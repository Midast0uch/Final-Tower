/**
 * Puppeteer Test Utility — Shared browser testing harness
 * 
 * Works in WSL/Linux with Puppeteer's bundled Chromium.
 * Captures console logs, errors, network failures, and page errors.
 * 
 * Usage:
 *   const { createBrowser, captureConsole, screenshot } = require('./puppeteer-util');
 *   
 *   const { browser, page } = await createBrowser();
 *   const logs = captureConsole(page);
 *   await page.goto('http://localhost:8080');
 *   console.log('Captured logs:', logs.all());
 *   await browser.close();
 * 
 * For interactive/manual testing (non-headless):
 *   const { browser, page } = await createBrowser({ headless: false });
 *   // Browser stays open — press Ctrl+C to close
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Browser Launch ─────────────────────────────────────────

/**
 * Launch a browser with correct Chromium path for WSL/Linux.
 * 
 * @param {Object} options
 * @param {boolean} options.headless - Run headless (default: true)
 * @param {number} options.width - Viewport width (default: 1280)
 * @param {number} options.height - Viewport height (default: 720)
 * @param {number} options.timeout - Default navigation timeout ms (default: 30000)
 * @param {string[]} options.extraArgs - Additional Chrome args
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
async function createBrowser(options = {}) {
  const {
    headless = true,
    width = 1280,
    height = 720,
    timeout = 30000,
    extraArgs = [],
  } = options;

  // Puppeteer's bundled Chromium (installed via npx puppeteer browsers install chrome)
  const executablePath = puppeteer.executablePath();

  const browser = await puppeteer.launch({
    headless: headless === true ? 'new' : headless,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // Software rendering for WSL/headless environments without GPU
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--disable-gpu-compositing',
      '--enable-unsafe-swiftshader',
      '--disable-extensions',
      '--remote-debugging-port=9222',
      ...extraArgs,
    ],
    protocolTimeout: 30000,
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);

  return { browser, page };
}

// ─── Console Capture ────────────────────────────────────────

/**
 * Capture all console output from a page.
 * Returns an object with methods to query captured logs.
 * 
 * @param {Page} page - Puppeteer page
 * @param {Object} options
 * @param {boolean} options.silent - If true, don't print to stdout (default: false)
 * @returns {{ all: Function, errors: Function, warnings: Function, logs: Function, clear: Function }}
 */
function captureConsole(page, options = {}) {
  const { silent = false } = options;
  const entries = [];

  // Capture console.log, console.error, console.warn, console.info
  page.on('console', (msg) => {
    const entry = {
      type: msg.type(), // 'log', 'error', 'warning', 'info', 'debug'
      text: msg.text(),
      timestamp: Date.now(),
      location: msg.location?.(),
    };
    entries.push(entry);
    if (!silent) {
      const prefix = {
        error: '❌',
        warning: '⚠️',
        log: '📝',
        info: 'ℹ️',
        debug: '🔍',
      }[entry.type] || '📝';
      console.log(`${prefix} [${entry.type}] ${entry.text}`);
    }
  });

  // Capture uncaught page errors
  page.on('pageerror', (error) => {
    const entry = {
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    };
    entries.push(entry);
    if (!silent) {
      console.log(`💥 [pageerror] ${error.message}`);
    }
  });

  // Capture failed network requests
  page.on('requestfailed', (request) => {
    const entry = {
      type: 'network_error',
      text: `${request.method()} ${request.url()} — ${request.failure()?.errorText}`,
      url: request.url(),
      method: request.method(),
      errorText: request.failure()?.errorText,
      timestamp: Date.now(),
    };
    entries.push(entry);
    if (!silent) {
      console.log(`🌐 [network_error] ${request.method()} ${request.url()} — ${request.failure()?.errorText}`);
    }
  });

  return {
    /** Get all captured entries */
    all() { return [...entries]; },
    /** Get only error entries (console.error + pageerror + network_error) */
    errors() { return entries.filter(e => ['error', 'pageerror', 'network_error'].includes(e.type)); },
    /** Get only warning entries */
    warnings() { return entries.filter(e => e.type === 'warning'); },
    /** Get only log entries */
    logs() { return entries.filter(e => e.type === 'log'); },
    /** Get entries of a specific type */
    byType(type) { return entries.filter(e => e.type === type); },
    /** Clear all captured entries */
    clear() { entries.length = 0; },
    /** Get count of entries */
    count() { return entries.length; },
  };
}

// ─── Screenshot Helper ──────────────────────────────────────

/**
 * Take a screenshot and save to file.
 * 
 * @param {Page} page - Puppeteer page
 * @param {string} filePath - Path to save screenshot
 * @param {Object} options - Screenshot options (fullPage, etc.)
 */
async function screenshot(page, filePath, options = {}) {
  const { fullPage = true } = options;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await page.screenshot({ path: filePath, fullPage });
  console.log(`📸 Screenshot saved: ${filePath}`);
}

// ─── Static File Server ─────────────────────────────────────

/**
 * Start a simple HTTP server to serve static files.
 * Useful for testing HTML games and Flutter web builds.
 * 
 * @param {string} directory - Directory to serve
 * @param {number} port - Port number (default: 8080)
 * @returns {Promise<{server: http.Server, url: string, close: Function}>}
 */
function serveStatic(directory, port = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Handle Seraph Vision health check gracefully for tests
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ llamaReady: false }));
        return;
      }

      // Simple path resolution — no directory traversal
      let filePath = path.join(directory, req.url === '/' ? 'index.html' : req.url);
      
      // For final-tower: serve tower-defense.html as default
      if (req.url === '/' && fs.existsSync(path.join(directory, 'tower-defense.html'))) {
        filePath = path.join(directory, 'tower-defense.html');
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.wasm': 'application/wasm',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' ? addr.port : port;
      resolve({
        server,
        url: `http://localhost:${actualPort}`,
        port: actualPort,
        close: () => new Promise(r => server.close(r)),
      });
    });

    server.on('error', reject);
  });
}

// ─── Interactive Mode ────────────────────────────────────────

/**
 * Open browser in interactive (non-headless) mode for manual testing.
 * Browser stays open until you press Ctrl+C or call close().
 * Console logs are captured and displayed in terminal.
 * 
 * @param {string} url - URL to navigate to
 * @param {Object} options - Browser options
 * @returns {Promise<{browser: Browser, page: Page, logs: Object, close: Function}>}
 */
async function interactiveTest(url, options = {}) {
  const { browser, page } = await createBrowser({ ...options, headless: false });
  const logs = captureConsole(page);

  console.log(`\n🌐 Interactive test mode — browser open`);
  console.log(`   URL: ${url}`);
  console.log(`   Console logs will appear below. Press Ctrl+C to close.\n`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  const close = async () => {
    console.log('\n📊 Console Summary:');
    console.log(`   Total: ${logs.count()}`);
    console.log(`   Errors: ${logs.errors().length}`);
    console.log(`   Warnings: ${logs.warnings().length}`);
    await browser.close();
  };

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log('\nClosing browser...');
    await close();
    process.exit(0);
  });

  return { browser, page, logs, close };
}

// ─── Test Runner Helpers ─────────────────────────────────────

/**
 * Simple test framework for browser tests.
 * 
 * @param {string} name - Test suite name
 * @param {Array<{name: string, fn: Function}>} tests - Array of test functions
 * @returns {Promise<{total: number, passed: number, failed: number, skipped: number}>}
 */
async function runTestSuite(name, tests) {
  const results = { total: 0, passed: 0, failed: 0, skipped: 0, failures: [] };

  console.log(`\n📋 ${name}`);
  console.log('='.repeat(50));

  for (const test of tests) {
    results.total++;
    try {
      const result = await test.fn();
      if (result === 'skip') {
        results.skipped++;
        console.log(`  ⏭️  ${test.name} — skipped`);
      } else {
        results.passed++;
        console.log(`  ✅ ${test.name}`);
      }
    } catch (error) {
      results.failed++;
      results.failures.push({ name: test.name, error: error.message });
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);
  console.log('='.repeat(50));

  return results;
}

/**
 * Assert helper — throws if condition is false.
 */
function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

/**
 * Assert equal helper.
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

module.exports = {
  createBrowser,
  captureConsole,
  screenshot,
  serveStatic,
  interactiveTest,
  runTestSuite,
  assert,
  assertEqual,
};