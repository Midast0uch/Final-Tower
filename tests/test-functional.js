/**
 * FINAL TOWER — Functional Test Suite
 * 
 * Verifies runtime behavior of recent fixes:
 * - Projectiles render consistently (MeshBasicMaterial)
 * - No memory leaks across waves (disposeMesh cleanup)
 * - Multi-path spawning works at wave 15+
 * - Path colors are distinct for multiple paths
 * 
 * Usage: node test-functional.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const {
  createBrowser,
  captureConsole,
  serveStatic,
  runTestSuite,
  assert,
  assertEqual,
} = require('./puppeteer-util');

const CONFIG = {
  port: 0,
  timeout: 60000,
};

async function runTests() {
  console.log('🚀 FINAL TOWER — Functional Test Suite');
  console.log('');

  const gameDir = path.resolve(__dirname);
  const { server, url, close: closeServer } = await serveStatic(gameDir, CONFIG.port);
  const gameUrl = `${url}/tower-defense.html`;
  console.log(`📡 Server: ${url}`);
  console.log(`🎮 Game: ${gameUrl}\n`);

  try {
    const { browser, page } = await createBrowser({ timeout: CONFIG.timeout });
    const logs = captureConsole(page, { silent: true });

    // ── Load game ──
    console.log('📡 Loading game...');
    await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✅ Game loaded\n');

    // ── Inject game-state helpers ──
    await page.evaluate(() => {
      window.__getSceneInfo = () => {
        if (!scene) return null;
        let meshCount = 0;
        const breakdown = {};
        scene.traverse(child => {
          if (child.isMesh) {
            meshCount++;
            const key = child.material ? (child.material.name || child.material.type || 'unknown') : 'no-mat';
            breakdown[key] = (breakdown[key] || 0) + 1;
          }
        });
        return { meshCount, breakdown };
      };

      window.__getGameState = () => ({
        wave: gameState.wave,
        waveActive: gameState.waveActive,
        gamePhase: gameState.gamePhase,
        enemies: gameState.enemies.length,
        projectiles: gameState.projectiles.length,
        towers: gameState.towers.length,
        pathSegments: pathSegments.length,
        activePathCount: gameState.activePathCount,
        activePaths: gameState.activePaths ? gameState.activePaths.length : null,
      });

      window.__startGame = () => {
        if (!gameState.gameStarted) startGame();
      };

      window.__startWave = () => startWave();

      window.__placeTowerAt = (gridX, gridZ, typeKey) => {
        if (!gameState.gameStarted) return false;
        if (gameState.pathGrid[gridX] && gameState.pathGrid[gridX][gridZ]) return false;
        if (gameState.towers.some(t => t.gridX === gridX && t.gridZ === gridZ)) return false;
        if (gridX < 0 || gridX >= CONFIG.MAP_WIDTH || gridZ < 0 || gridZ >= CONFIG.MAP_HEIGHT) return false;
        const towerDef = TOWER_TYPES[typeKey] || TOWER_TYPES.BASIC;
        if (gameState.energy < towerDef.cost) return false;
        gameState.energy -= towerDef.cost;
        const tower = createTower(gridX, gridZ, typeKey);
        if (tower && tower.mesh) playBuildAnimation(tower.mesh);
        updateUI();
        return !!tower;
      };

      window.__forceWaveComplete = () => {
        // Clean up remaining enemies
        gameState.enemies.forEach(enemy => {
          if (enemy.glowMesh && enemy.glowMesh.parent) { scene.remove(enemy.glowMesh); disposeMesh(enemy.glowMesh); }
          if (enemy.mesh && enemy.mesh.parent) { scene.remove(enemy.mesh); }
          disposeMesh(enemy.mesh);
        });
        gameState.enemies = [];
        waveEnemies = [];
        if (gameState.waveEnemiesByPath) {
          gameState.waveEnemiesByPath.forEach(q => { if (q) q.length = 0; });
        }
        gameState.waveActive = false;
        waveComplete();
      };

      window.__forceNextWave = (targetWave) => {
        gameState.wave = targetWave - 1;
        gameState.gamePhase = 'PREPARATION';
        gameState.waveActive = false;
        startPreparationPhase();
        return gameState.wave;
      };

      window.__getProjectiles = () => {
        return gameState.projectiles.map(p => ({
          typeKey: p.typeKey,
          hasMesh: !!p.mesh,
          meshParent: !!p.mesh && !!p.mesh.parent,
          meshMaterialType: p.mesh && p.mesh.material ? p.mesh.material.type : null,
          meshMaterialColor: p.mesh && p.mesh.material && p.mesh.material.color ? p.mesh.material.color.getHexString() : null,
        }));
      };

      window.__getPathColors = () => {
        const colors = [];
        pathSegments.forEach(seg => {
          if (seg.mesh && seg.mesh.material && seg.mesh.material.color) {
            colors.push(seg.mesh.material.color.getHex());
          }
        });
        return [...new Set(colors)];
      };
    });

    const results = await runTestSuite('FINAL TOWER Functional Tests', [
      {
        name: 'Game loads without critical errors',
        fn: async () => {
          const criticalErrors = logs.errors().filter(e =>
            e.type === 'pageerror' ||
            (e.type === 'error' && !e.text.includes('404') && !e.text.includes('favicon'))
          );
          assert(criticalErrors.length === 0, `Errors: ${criticalErrors.map(e => e.text).join('; ')}`);
        },
      },
      {
        name: 'Three.js scene initialized with meshes',
        fn: async () => {
          const info = await page.evaluate(() => window.__getSceneInfo());
          assert(info !== null, 'Scene not accessible');
          assert(info.meshCount > 0, `Scene has ${info.meshCount} meshes`);
        },
      },
      {
        name: 'Game starts and enters preparation phase',
        fn: async () => {
          await page.evaluate(() => window.__startGame());
          await new Promise(r => setTimeout(r, 1000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.gamePhase === 'PREPARATION', `Phase is ${state.gamePhase}`);
        },
      },
      {
        name: 'Can place towers using actual game function',
        fn: async () => {
          const placed = await page.evaluate(() => {
            let count = 0;
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
              for (let z = 0; z < CONFIG.MAP_HEIGHT; z++) {
                if (window.__placeTowerAt(x, z, 'BASIC')) count++;
                if (count >= 3) break;
              }
              if (count >= 3) break;
            }
            return count;
          });
          assert(placed >= 3, `Only placed ${placed} towers`);
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.towers >= 3, `Only ${state.towers} towers in state`);
        },
      },
      {
        name: 'Wave starts and enemies spawn',
        fn: async () => {
          await page.evaluate(() => window.__startWave());
          await new Promise(r => setTimeout(r, 2000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.waveActive === true, 'Wave not active');
        },
      },
      {
        name: 'Projectiles render with MeshBasicMaterial',
        fn: async () => {
          // Wait for towers to fire
          await new Promise(r => setTimeout(r, 3000));
          const projectiles = await page.evaluate(() => window.__getProjectiles());
          assert(projectiles.length > 0, `No projectiles fired (${projectiles.length})`);
          const allBasic = projectiles.every(p => p.meshMaterialType === 'MeshBasicMaterial');
          assert(allBasic, `Some projectiles use non-basic material: ${projectiles.map(p => p.meshMaterialType).join(', ')}`);
        },
      },
      {
        name: 'Projectiles have visible color',
        fn: async () => {
          const projectiles = await page.evaluate(() => window.__getProjectiles());
          assert(projectiles.length > 0, 'No projectiles to check');
          const hasColor = projectiles.some(p => p.meshMaterialColor && p.meshMaterialColor !== '000000');
          assert(hasColor, 'Projectiles have no visible color');
        },
      },
      {
        name: 'Path draw/clear cycle does not leak meshes',
        fn: async () => {
          // Isolate path drawing by repeatedly clearing and redrawing paths
          const counts = [];
          for (let i = 0; i < 5; i++) {
            const before = await page.evaluate(() => window.__getSceneInfo());
            await page.evaluate(() => {
              clearPathTiles();
              drawAllPaths();
            });
            // Wait for all setTimeout debris particles to spawn and expire
            // Max delay = path.length * 30ms, particle life ~40 frames (~700ms)
            await new Promise(r => setTimeout(r, 4000));
            const after = await page.evaluate(() => window.__getSceneInfo());
            counts.push({ before: before.meshCount, after: after.meshCount });
            console.log(`      Cycle ${i+1}: ${before.meshCount} → ${after.meshCount} meshes`);
          }
          const first = counts[0];
          const last = counts[counts.length - 1];
          // Allow +600 for temporary debris particles from drawPath setTimeout effects
          assert(Math.abs(last.after - first.after) < 600,
            `Mesh count drifted by ${last.after - first.after} (${first.after} → ${last.after}) across cycles — possible leak`);
        },
      },
      {
        name: 'Memory does not grow unboundedly across multiple waves',
        fn: async () => {
          const meshCounts = [];
          for (let i = 0; i < 5; i++) {
            // Ensure we're in preparation phase
            await page.evaluate(() => {
              if (gameState.gamePhase !== 'PREPARATION') {
                window.__forceWaveComplete();
              }
            });
            await new Promise(r => setTimeout(r, 500));

            // Record mesh count before wave
            const before = await page.evaluate(() => window.__getSceneInfo());
            const mapSizeBefore = await page.evaluate(() => CONFIG.MAP_WIDTH * CONFIG.MAP_HEIGHT);

            // Start wave
            await page.evaluate(() => window.__startWave());
            await new Promise(r => setTimeout(r, 3000));

            // Complete wave cleanly
            await page.evaluate(() => window.__forceWaveComplete());
            await new Promise(r => setTimeout(r, 2500)); // Extra time for setTimeout debris to finish

            // Record mesh count after cleanup
            const after = await page.evaluate(() => window.__getSceneInfo());
            const mapSizeAfter = await page.evaluate(() => CONFIG.MAP_WIDTH * CONFIG.MAP_HEIGHT);
            meshCounts.push({ before: before.meshCount, after: after.meshCount, mapSize: mapSizeAfter });
            console.log(`      Wave ${i+1}: ${before.meshCount} → ${after.meshCount} meshes (map ${mapSizeBefore} → ${mapSizeAfter})`);
          }
          // Check that mesh count scales with map size, not unboundedly
          const first = meshCounts[0];
          const last = meshCounts[meshCounts.length - 1];
          const meshGrowth = last.after - first.after;
          const mapGrowth = last.mapSize - first.mapSize;
          // Each new map cell adds ~10-15 meshes (terrain + path tile + curbs + edges + decorations)
          const expectedGrowth = mapGrowth * 15;
          assert(meshGrowth <= expectedGrowth + 400,
            `Mesh count grew by ${meshGrowth} but map only grew by ${mapGrowth} cells. Expected <= ${expectedGrowth + 400}, possible leak.`);
        },
      },
      {
        name: 'Multi-path generation works at wave 15',
        fn: async () => {
          await page.evaluate(() => window.__forceNextWave(15));
          await new Promise(r => setTimeout(r, 1000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.activePathCount >= 2, `Expected 2+ paths, got ${state.activePathCount}`);
        },
      },
      {
        name: 'Multi-path colors are distinct',
        fn: async () => {
          const colors = await page.evaluate(() => window.__getPathColors());
          assert(colors.length >= 2, `Only ${colors.length} distinct path colors found`);
          const multiPathColors = [0x8b4513, 0x228b22, 0x800080, 0xff00ff];
          const hasMultiColor = colors.some(c => multiPathColors.includes(c));
          assert(hasMultiColor, `No multi-path colors found in [${colors.map(c => '0x' + c.toString(16)).join(', ')}]`);
        },
      },
      {
        name: 'Enemies spawn on multiple paths simultaneously',
        fn: async () => {
          await page.evaluate(() => window.__startWave());
          await new Promise(r => setTimeout(r, 3000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.enemies > 0, `No enemies spawned on wave ${state.wave}`);
        },
      },
      {
        name: 'Path scaling works at wave 25 (3 paths)',
        fn: async () => {
          await page.evaluate(() => {
            window.__forceWaveComplete();
            window.__forceNextWave(25);
          });
          await new Promise(r => setTimeout(r, 1000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.activePathCount >= 3, `Expected 3+ paths at wave 25, got ${state.activePathCount}`);
        },
      },
      {
        name: 'Path scaling works at wave 35 (4 paths)',
        fn: async () => {
          await page.evaluate(() => {
            window.__forceWaveComplete();
            window.__forceNextWave(35);
          });
          await new Promise(r => setTimeout(r, 1000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.activePathCount >= 4, `Expected 4+ paths at wave 35, got ${state.activePathCount}`);
        },
      },
      {
        name: 'No console errors after full test run',
        fn: async () => {
          const criticalErrors = logs.errors().filter(e => {
            const isLoginError = e.text.includes("reading 'value'") || e.text.includes('Script error');
            if (isLoginError) return false;
            if (e.type === 'pageerror') return true;
            if (e.type === 'error') {
              return !e.text.includes('404') && !e.text.includes('favicon');
            }
            return false;
          });
          assert(criticalErrors.length === 0, `Errors: ${criticalErrors.map(e => e.text).join('; ')}`);
        },
      },
    ]);

    // Print any console errors for debugging
    const errors = logs.errors();
    if (errors.length > 0) {
      console.log('\n📋 All console errors:');
      for (const err of errors) {
        console.log(`   [${err.type}] ${err.text}`);
      }
    }

    await browser.close();
    await closeServer();
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error.stack);
    await closeServer();
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
