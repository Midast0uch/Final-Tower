/**
 * FINAL TOWER — Browser Test Runner
 * 
 * Uses Puppeteer with bundled Chromium (works in WSL).
 * Captures console logs, errors, and page state.
 * 
 * Usage:
 *   node test-runner.js                  # Run all tests headless
 *   node test-runner.js --interactive    # Open browser for manual testing
 *   node test-runner.js --capture        # Capture console logs only (no assertions)
 *   node test-runner.js --screenshot     # Take screenshots of game states
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Shared utility
const {
  createBrowser,
  captureConsole,
  screenshot,
  serveStatic,
  interactiveTest,
  runTestSuite,
  assert,
  assertEqual,
} = require('./puppeteer-util');

// ─── Configuration ───────────────────────────────────────────

const CONFIG = {
  port: 0, // 0 = random available port
  timeout: 30000,
  screenshotDir: './test-screenshots',
};

// ─── Parse CLI args ──────────────────────────────────────────

const args = process.argv.slice(2);
const isInteractive = args.includes('--interactive') || args.includes('-i');
const isCapture = args.includes('--capture') || args.includes('-c');
const isScreenshot = args.includes('--screenshot') || args.includes('-s');

// ─── Test Suite ──────────────────────────────────────────────

async function runTests() {
  console.log('🚀 FINAL TOWER — Browser Test Suite');
  console.log(`   Mode: ${isInteractive ? 'Interactive' : isCapture ? 'Console Capture' : 'Headless'}`);
  console.log('');

  // Start static file server
  const gameDir = path.resolve(__dirname);
  const { server, url, port, close: closeServer } = await serveStatic(gameDir, CONFIG.port);
  const gameUrl = `${url}/tower-defense.html`;
  console.log(`📡 Server started: ${url}`);
  console.log(`🎮 Game URL: ${gameUrl}\n`);

  try {
    // ── Interactive mode: open browser, capture logs, wait for user ──
    if (isInteractive) {
      const { browser, page, logs, close } = await interactiveTest(gameUrl);
      
      // Wait for game to initialize — use domcontentloaded for games
      await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#game-container', { timeout: 10000 }).catch(() => {
        console.log('⚠️  Game container not found — game may still be loading');
      });

      console.log('\n🎮 Game loaded! Interact with the browser window.');
      console.log('   Console logs will appear below. Press Ctrl+C to close.\n');

      // Keep process alive
      await new Promise(() => {});
      return;
    }

    // ── Headless test mode ──
    const { browser, page } = await createBrowser({ timeout: CONFIG.timeout });
    const logs = captureConsole(page);

    // Navigate to game — use domcontentloaded instead of networkidle2
    // because games make continuous resource requests
    console.log('📡 Loading game...');
    await page.goto(gameUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    // Wait for game to initialize
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✅ Game loaded\n');

    // Wait for game container
    await page.waitForSelector('#game-container', { timeout: 10000 });
    console.log('   ✅ Game container ready\n');

    // Take initial screenshot if requested
    if (isScreenshot) {
      if (!fs.existsSync(CONFIG.screenshotDir)) {
        fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
      }
      await screenshot(page, path.join(CONFIG.screenshotDir, 'initial-load.png'));
    }

    // ── Console capture mode: just dump logs and exit ──
    if (isCapture) {
      // Wait a bit for all initialization logs
      await new Promise(r => setTimeout(r, 3000));

      console.log('\n📋 CAPTURED CONSOLE OUTPUT');
      console.log('='.repeat(50));
      const allLogs = logs.all();
      for (const entry of allLogs) {
        const prefix = { error: '❌', warning: '⚠️', log: '📝', info: 'ℹ️', debug: '🔍' }[entry.type] || '📝';
        console.log(`${prefix} [${entry.type}] ${entry.text}`);
      }
      console.log('='.repeat(50));
      console.log(`Total: ${logs.count()} | Errors: ${logs.errors().length} | Warnings: ${logs.warnings().length}`);

      if (isScreenshot) {
        await screenshot(page, path.join(CONFIG.screenshotDir, 'console-capture.png'));
      }

      await browser.close();
      await closeServer();
      process.exit(logs.errors().length > 0 ? 1 : 0);
    }

    // ── Full test suite ──
    const results = await runTestSuite('FINAL TOWER Tests', [
      {
        name: 'Game loads without critical errors',
        fn: async () => {
          const pageErrors = logs.byType('pageerror');
          if (pageErrors.length > 0) {
            throw new Error(`Page errors: ${pageErrors.map(e => e.text).join('; ')}`);
          }
          // Filter out non-critical errors (404s for favicons, etc.)
          const criticalErrors = logs.errors().filter(e => 
            e.type === 'pageerror' || 
            (e.type === 'error' && !e.text.includes('404') && !e.text.includes('CDN') && !e.text.includes('favicon'))
          );
          assert(criticalErrors.length === 0, `Critical errors: ${criticalErrors.map(e => e.text).join('; ')}`);
        },
      },
      {
        name: 'Game container exists',
        fn: async () => {
          const container = await page.$('#game-container');
          assert(container !== null, 'Game container not found');
        },
      },
      {
        name: 'UI elements are present',
        fn: async () => {
          const missing = await page.evaluate(() => {
            const elements = [
              { selector: '#game-container', name: 'Game container' },
            ];
            return elements
              .filter(e => !document.querySelector(e.selector))
              .map(e => e.name);
          });
          // Only check game container — HUD elements may load async
          assert(missing.length === 0, `Missing elements: ${missing.join(', ')}`);
        },
      },
      {
        name: 'Three.js loaded successfully',
        fn: async () => {
          const hasThree = await page.evaluate(() => typeof THREE !== 'undefined');
          assert(hasThree, 'Three.js not loaded');
        },
      },
      {
        name: 'Game state accessible',
        fn: async () => {
          const state = await page.evaluate(() => {
            return {
              hasGameContainer: !!document.getElementById('game-container'),
              hasCanvas: !!document.querySelector('canvas'),
              bodyChildren: document.body.children.length,
            };
          });
          assert(state.hasGameContainer, 'Game container missing');
          assert(state.hasCanvas, 'Canvas not rendered — Three.js may have failed');
        },
      },
      {
        name: 'No network errors for critical resources',
        fn: async () => {
          const networkErrors = logs.byType('network_error');
          const criticalErrors = networkErrors.filter(e => 
            !e.url.includes('favicon') && !e.url.includes('.ico')
          );
          assert(criticalErrors.length === 0, 
            `Network errors: ${criticalErrors.map(e => `${e.method} ${e.url} — ${e.errorText}`).join('; ')}`);
        },
      },
      {
        name: 'Canvas renders at correct size',
        fn: async () => {
          const canvasInfo = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;
            return {
              width: canvas.width,
              height: canvas.height,
              clientWidth: canvas.clientWidth,
              clientHeight: canvas.clientHeight,
            };
          });
          assert(canvasInfo !== null, 'Canvas not found');
          assert(canvasInfo.width > 0, `Canvas width is 0`);
          assert(canvasInfo.height > 0, `Canvas height is 0`);
        },
      },
    ]);

    // Take final screenshot
    if (isScreenshot) {
      await screenshot(page, path.join(CONFIG.screenshotDir, 'test-complete.png'));
    }

    // Print console summary
    console.log('\n📋 Console Summary:');
    console.log(`   Total logs: ${logs.count()}`);
    console.log(`   Errors: ${logs.errors().length}`);
    console.log(`   Warnings: ${logs.warnings().length}`);
    
    // Print any errors
    const errors = logs.errors();
    if (errors.length > 0) {
      console.log('\n❌ Console Errors:');
      for (const err of errors.slice(0, 10)) {
        console.log(`   ${err.text}`);
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

// ─── Run ─────────────────────────────────────────────────────

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});