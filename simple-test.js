const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('Starting simple browser test...');
  
  // Launch Chrome directly on Windows with debugging enabled
  const chromePath = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',  // Use single process mode
        '--host-resolver-rules=MAP localhost 127.0.0.1'
      ],
      protocol: 'webDriverBiDi',
    });
    
    console.log('Browser launched!');
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console ERROR:', msg.text());
      }
    });
    
    page.on('pageerror', err => {
      console.log('Page ERROR:', err.message);
    });
    
    console.log('Navigating to game...');
    await page.goto('http://localhost:8080/tower-defense.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Page loaded, waiting for game to initialize...');
    await page.waitForTimeout(3000);
    
    // Check if game container exists
    const gameExists = await page.evaluate(() => {
      return document.getElementById('game-container') !== null;
    });
    
    console.log('Game container exists:', gameExists);
    
    // Get any errors
    const errors = await page.evaluate(() => {
      const errors = [];
      return errors;
    });
    
    console.log('\n=== Test Results ===');
    console.log('Browser launched: ✅');
    console.log('Page loaded: ✅');
    console.log('Game container:', gameExists ? '✅' : '❌');
    
    await browser.close();
    console.log('\nTest completed successfully!');
    
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

simpleTest();
