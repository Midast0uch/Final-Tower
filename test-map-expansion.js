/**
 * FINAL TOWER — Map Expansion Diagnostic Test
 * 
 * Triggers map expansion and checks for errors + animation state.
 * Usage: node test-map-expansion.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

const {
  createBrowser,
  captureConsole,
  serveStatic,
  runTestSuite,
  assert,
} = require('./puppeteer-util');

const CONFIG = { port: 0, timeout: 60000 };

async function runTests() {
  console.log('🚀 Map Expansion Diagnostic Test');
  const gameDir = path.resolve(__dirname);
  const { server, url, close: closeServer } = await serveStatic(gameDir, CONFIG.port);
  const gameUrl = `${url}/tower-defense.html`;

  try {
    const { browser, page } = await createBrowser({ timeout: CONFIG.timeout });
    const logs = captureConsole(page, { silent: true });

    await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
      window.__getSceneInfo = () => {
        if (!scene) return null;
        let meshCount = 0;
        let waterCount = 0;
        let rippleCount = 0;
        let sporeCount = 0;
        let puddleCount = 0;
        scene.traverse(child => {
          if (child.isMesh) meshCount++;
          if (child.userData) {
            if (child.userData.isWater) waterCount++;
            if (child.userData.isRipple) rippleCount++;
            if (child.userData.isSpore) sporeCount++;
            if (child.userData.isPuddle) puddleCount++;
          }
        });
        return { meshCount, waterCount, rippleCount, sporeCount, puddleCount };
      };
      window.__getGameState = () => ({
        wave: gameState.wave,
        gamePhase: gameState.gamePhase,
        enemies: gameState.enemies.length,
        towers: gameState.towers.length,
        pathSegments: pathSegments.length,
        mapWidth: CONFIG.MAP_WIDTH,
        mapHeight: CONFIG.MAP_HEIGHT,
        ambientParticles: ambientParticles.length,
        clouds: clouds.length,
        debrisParticles: debrisParticles.length,
        deathParticles: deathParticles.length,
        impactEffects: impactEffects.length,
        waveMarkers: waveMarkers.length,
        buildAnimations: buildAnimations.length,
      });
      window.__startGame = () => { if (!gameState.gameStarted) startGame(); };
      window.__startWave = () => startWave();
      window.__forceWaveComplete = () => {
        gameState.enemies.forEach(enemy => {
          if (enemy.glowMesh && enemy.glowMesh.parent) { scene.remove(enemy.glowMesh); disposeMesh(enemy.glowMesh); }
          if (enemy.mesh && enemy.mesh.parent) { scene.remove(enemy.mesh); }
          disposeMesh(enemy.mesh);
        });
        gameState.enemies = [];
        waveEnemies = [];
        if (gameState.waveEnemiesByPath) gameState.waveEnemiesByPath.forEach(q => { if (q) q.length = 0; });
        gameState.waveActive = false;
        waveComplete();
      };
    });

    const results = await runTestSuite('Map Expansion Tests', [
      {
        name: 'Start game and verify initial state',
        fn: async () => {
          await page.evaluate(() => window.__startGame());
          await new Promise(r => setTimeout(r, 1000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.mapWidth === 8 && state.mapHeight === 8, `Initial map is ${state.mapWidth}x${state.mapHeight}`);
          assert(state.ambientParticles === 40, `Expected 40 ambient particles, got ${state.ambientParticles}`);
          assert(state.clouds > 0, `Expected clouds, got ${state.clouds}`);
        },
      },
      {
        name: 'Advance through waves 1-4 without expansion',
        fn: async () => {
          for (let w = 1; w <= 4; w++) {
            await page.evaluate(() => window.__startWave());
            await new Promise(r => setTimeout(r, 2000));
            await page.evaluate(() => window.__forceWaveComplete());
            await new Promise(r => setTimeout(r, 1500));
            const state = await page.evaluate(() => window.__getGameState());
            console.log(`      After wave ${w}: map ${state.mapWidth}x${state.mapHeight}, phase ${state.gamePhase}`);
          }
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.mapWidth === 8 && state.mapHeight === 8, `Map should still be 8x8 after wave 4, is ${state.mapWidth}x${state.mapHeight}`);
        },
      },
      {
        name: 'Wave 5 triggers map expansion to 10x10',
        fn: async () => {
          await page.evaluate(() => window.__startWave());
          await new Promise(r => setTimeout(r, 2000));
          await page.evaluate(() => window.__forceWaveComplete());
          await new Promise(r => setTimeout(r, 2000));
          const state = await page.evaluate(() => window.__getGameState());
          console.log(`      After wave 5: map ${state.mapWidth}x${state.mapHeight}, phase ${state.gamePhase}`);
          assert(state.mapWidth === 10 && state.mapHeight === 10, `Map should be 10x10 after wave 5, is ${state.mapWidth}x${state.mapHeight}`);
        },
      },
      {
        name: 'Animation systems still active after expansion',
        fn: async () => {
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.ambientParticles === 40, `Ambient particles broken: ${state.ambientParticles}`);
          assert(state.clouds > 0, `Clouds broken: ${state.clouds}`);
          assert(state.pathSegments > 0, `Path segments broken: ${state.pathSegments}`);
        },
      },
      {
        name: 'No errors during or after expansion',
        fn: async () => {
          const criticalErrors = logs.errors().filter(e => {
            if (e.type === 'pageerror') return true;
            if (e.type === 'error') return !e.text.includes('404') && !e.text.includes('favicon');
            return false;
          });
          if (criticalErrors.length > 0) {
            console.log('      Errors found:');
            criticalErrors.forEach(e => console.log(`        [${e.type}] ${e.text}`));
          }
          assert(criticalErrors.length === 0, `${criticalErrors.length} errors found`);
        },
      },
      {
        name: 'Mesh count is reasonable after expansion',
        fn: async () => {
          const info = await page.evaluate(() => window.__getSceneInfo());
          console.log(`      Meshes: ${info.meshCount}, water: ${info.waterCount}, puddles: ${info.puddleCount}`);
          assert(info.meshCount > 0, 'Scene has no meshes');
          assert(info.meshCount < 10000, `Too many meshes: ${info.meshCount} — possible leak`);
        },
      },
      {
        name: 'Start wave 6 after expansion works',
        fn: async () => {
          await page.evaluate(() => window.__startWave());
          await new Promise(r => setTimeout(r, 2000));
          const state = await page.evaluate(() => window.__getGameState());
          assert(state.gamePhase === 'WAVE_ACTIVE', `Phase is ${state.gamePhase} after starting wave 6`);
        },
      },
    ]);

    await browser.close();
    await closeServer();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    await closeServer();
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
