/**
 * FINAL TOWER — Animation Verification Test after Map Expansion
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
  console.log('🚀 Animation Verification Test');
  const gameDir = path.resolve(__dirname);
  const { server, url, close: closeServer } = await serveStatic(gameDir, CONFIG.port);
  const gameUrl = `${url}/tower-defense.html`;

  try {
    const { browser, page } = await createBrowser({ timeout: CONFIG.timeout });
    const logs = captureConsole(page, { silent: true });

    await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
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
      window.__getPathTileColors = () => {
        return pathSegments.map(seg => seg.mesh && seg.mesh.material ? seg.mesh.material.color.getHex() : null);
      };
      window.__getAmbientPositions = () => {
        return ambientParticles.map(p => p.mesh ? { x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z } : null);
      };
    });

    const results = await runTestSuite('Animation Verification', [
      {
        name: 'Start game',
        fn: async () => {
          await page.evaluate(() => window.__startGame());
          await new Promise(r => setTimeout(r, 1000));
        },
      },
      {
        name: 'Advance to wave 6 (triggers expansion at wave 5)',
        fn: async () => {
          for (let w = 1; w <= 5; w++) {
            await page.evaluate(() => window.__startWave());
            await new Promise(r => setTimeout(r, 1500));
            await page.evaluate(() => window.__forceWaveComplete());
            await new Promise(r => setTimeout(r, 1500));
          }
          const state = await page.evaluate(() => ({
            mapW: CONFIG.MAP_WIDTH, mapH: CONFIG.MAP_HEIGHT, phase: gameState.gamePhase,
          }));
          assert(state.mapW === 10 && state.mapH === 10, `Map should be 10x10, is ${state.mapW}x${state.mapH}`);
        },
      },
      {
        name: 'Path tile colors animate after expansion',
        fn: async () => {
          const before = await page.evaluate(() => window.__getPathTileColors());
          await new Promise(r => setTimeout(r, 500));
          const after = await page.evaluate(() => window.__getPathTileColors());
          assert(before.length > 0, 'No path tiles found');
          const someChanged = before.some((c, i) => c !== after[i]);
          assert(someChanged, `Path tile colors not changing`);
        },
      },
      {
        name: 'Path segments exist after expansion',
        fn: async () => {
          const count = await page.evaluate(() => pathSegments.length);
          assert(count > 0, `No path segments after expansion: ${count}`);
        },
      },
      {
        name: 'Ambient particles move after expansion',
        fn: async () => {
          const before = await page.evaluate(() => window.__getAmbientPositions());
          await new Promise(r => setTimeout(r, 500));
          const after = await page.evaluate(() => window.__getAmbientPositions());
          assert(before.length > 0, 'No ambient particles found');
          const someMoved = before.some((pos, i) => pos && after[i] && (pos.x !== after[i].x || pos.y !== after[i].y));
          assert(someMoved, 'Ambient particles not moving');
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
            criticalErrors.forEach(e => console.log(`      [${e.type}] ${e.text}`));
          }
          assert(criticalErrors.length === 0, `${criticalErrors.length} errors found`);
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
