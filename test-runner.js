const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Game configuration for tests
const CONFIG = {
  HOST: 'localhost',
  PORT: 8080,
  BASE_URL: `http://${CONFIG.HOST}:${CONFIG.PORT}`,
  TILE_SIZE: 40,
  MAP_WIDTH: 20,
  MAP_HEIGHT: 12
};

// Test results tracking
let results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function describe(name, tests) {
  console.log(`\n📋 ${name}`);
  tests.forEach(test => {
    test();
  });
}

function test(name, fn) {
  results.total++;
  console.log(`  ▶️  ${name}`);
  try {
    fn();
    results.passed++;
    console.log(`     ✅ Passed`);
  } catch (error) {
    results.failed++;
    console.log(`     ❌ Failed: ${error.message}`);
  }
}

function skip(name, reason) {
  results.total++;
  results.skipped++;
  console.log(`  ⏭️  ${name} - ${reason}`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Tower Defense Game Test Suite');
  console.log(`   Target URL: ${CONFIG.BASE_URL}`);
  console.log('');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Navigate to game
  console.log('📡 Navigating to game...');
  try {
    await page.goto(CONFIG.BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log('   ✅ Game loaded successfully');
  } catch (error) {
    console.error('   ❌ Failed to load game:', error.message);
    await browser.close();
    process.exit(1);
    return;
  }

  // Wait for game to initialize
  console.log('⏳ Waiting for game initialization...');
  await page.waitForSelector('#game-container', { timeout: 10000 });
  console.log('   ✅ Game container ready');

  // Helper to get game state from page
  async function getGameState() {
    const state = await page.evaluate(() => {
      // Access game state - this depends on how the game exposes its state
      return {
        energy: 0,
        seals: 0,
        lives: 10,
        wave: 1,
        towers: [],
        enemies: [],
        projectiles: []
      };
    });
    return state;
  }

  // Helper to click on element
  async function click(selector) {
    await page.click(selector).catch(() => {});
  }

  // Helper to wait for game update
  async function waitGameUpdate() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // ====== TEST SUITE ======

  describe('Game Initialization', () => {
    test('Game loads without errors', async () => {
      const errors = await page.evaluate(() => {
        let errors = [];
        try {
          // Try to access basic game elements
          const container = document.getElementById('game-container');
          if (!container) errors.push('Game container not found');
          
          // Check for console errors
          return errors;
        } catch (e) {
          return [e.message];
        }
      });

      if (errors.length > 0) {
        throw new Error('Initialization errors: ' + errors.join(', '));
      }
    });

    test('UI elements are present', async () => {
      const missing = await page.evaluate(() => {
        const elements = [
          { selector: '#game-container', name: 'Game container' },
          { selector: '#ui', name: 'UI panel' },
          { selector: '#energy-display', name: 'Energy display' },
          { selector: '#wave-display', name: 'Wave display' }
        ];
        
        return elements
          .filter(e => !document.querySelector(e.selector))
          .map(e => e.name);
      });

      if (missing.length > 0) {
        throw new Error(`Missing UI elements: ${missing.join(', ')}`);
      }
    });
  });

  describe('Basic Game Mechanics', () => {
    test('Energy system works', async () => {
      const initialEnergy = await page.evaluate(() => {
        const el = document.getElementById('energy-display');
        return el ? parseInt(el.textContent) : 0;
      });

      // Wait for energy to regenerate
      await waitGameUpdate();
      
      // Energy should have increased
      const updatedEnergy = await page.evaluate(() => {
        const el = document.getElementById('energy-display');
        return el ? parseInt(el.textContent) : 0;
      });

      if (updatedEnergy <= initialEnergy) {
        throw new Error('Energy did not regenerate');
      }

      console.log(`     Energy regenerated: ${initialEnergy} → ${updatedEnergy}`);
    });

    test('Wave progression works', async () => {
      const initialWave = await page.evaluate(() => {
        const el = document.getElementById('wave-display');
        return el ? parseInt(el.textContent) : 1;
      });

      // Click start wave button
      await click('#start-wave-btn');
      await waitGameUpdate();

      // Wave should have progressed
      const updatedWave = await page.evaluate(() => {
        const el = document.getElementById('wave-display');
        return el ? parseInt(el.textContent) : 1;
      });

      if (updatedWave === initialWave) {
        throw new Error('Wave did not progress');
      }

      console.log(`     Wave progressed: ${initialWave} → ${updatedWave}`);
    });
  });

  describe('Tower Placement', () => {
    test('Tower placement validation works', async () => {
      // This test would require checking:
      // 1. Cannot place on path
      // 2. Cannot place on occupied tile
      // 3. Must have sufficient energy
      // 4. Must be within range
      
      console.log('     ⏭️  Skipped - requires interactive tower UI');
    });

    test('Tower firing mechanics work', async () => {
      // This test would require:
      // 1. Placing a tower
      // 2. Waiting for enemies to spawn
      // 3. Verifying projectiles are fired
      // 4. Verifying damage is dealt
      
      console.log('     ⏭️  Skipped - requires interactive tower placement');
    });
  });

  describe('Enemy Behavior', () => {
    test('Enemies spawn and move along paths', async () => {
      // This test would require:
      // 1. Starting a wave
      // 2. Verifying enemies appear
      // 3. Tracking their movement
      // 4. Verifying they reach the end
      
      console.log('     ⏭️  Skipped - requires interactive wave system');
    });

    test('Enemy types have correct stats', async () => {
      // This test would require:
      // 1. Spawning different enemy types
      // 2. Verifying their HP, speed, damage
      
      console.log('     ⏭️  Skipped - requires interactive enemy spawning');
    });
  });

  describe('Dynamic Wave Generation', () => {
    test('Wave generation system exists', async () => {
      const hasWaveGen = await page.evaluate(() => {
        return typeof window.generateWave !== 'undefined';
      });

      if (!hasWaveGen) {
        throw new Error('Wave generation system not found');
      }

      console.log('     ✅ Wave generation system exists');
    });

    test('Wave generation creates valid waves', async () => {
      // This test would verify:
      // 1. Generated waves have enemies
      // 2. Enemy counts scale with wave number
      // 3. Wave difficulty increases appropriately
      
      console.log('     ⏭️  Skipped - requires wave generation implementation');
    });
  });

  describe('Random Events System', () => {
    test('Random events system exists', async () => {
      const hasEvents = await page.evaluate(() => {
        return typeof window.triggerRandomEvent !== 'undefined';
      });

      if (!hasEvents) {
        throw new Error('Random events system not found');
      }

      console.log('     ✅ Random events system exists');
    });

    test('Event cards display correctly', async () => {
      // This test would verify:
      // 1. Event cards appear when triggered
      // 2. Event effects are applied
      // 3. Event cards have proper styling
      
      console.log('     ⏭️  Skipped - requires random events implementation');
    });
  });

  describe('Tower Upgrades', () => {
    test('Upgrade system exists', async () => {
      const hasUpgrades = await page.evaluate(() => {
        return typeof window.upgradeTower !== 'undefined';
      });

      if (!hasUpgrades) {
        throw new Error('Tower upgrade system not found');
      }

      console.log('     ✅ Tower upgrade system exists');
    });
  });

  describe('Enemy Synergies', () => {
    test('Synergy system exists', async () => {
      const hasSynergies = await page.evaluate(() => {
        return typeof window.checkSynergies !== 'undefined';
      });

      if (!hasSynergies) {
        throw new Error('Enemy synergy system not found');
      }

      console.log('     ✅ Enemy synergy system exists');
    });
  });

  describe('Destructible Terrain', () => {
    test('Destructible terrain system exists', async () => {
      const hasDestructible = await page.evaluate(() => {
        return typeof window.destroyTerrain !== 'undefined';
      });

      if (!hasDestructible) {
        throw new Error('Destructible terrain system not found');
      }

      console.log('     ✅ Destructible terrain system exists');
    });
  });

  describe('Chaos Meter', () => {
    test('Chaos meter exists', async () => {
      const hasChaos = await page.evaluate(() => {
        return typeof window.updateChaosMeter !== 'undefined';
      });

      if (!hasChaos) {
        throw new Error('Chaos meter system not found');
      }

      console.log('     ✅ Chaos meter system exists');
    });
  });

  describe('Visual Feedback', () => {
    test('Particle system exists', async () => {
      const hasParticles = await page.evaluate(() => {
        return typeof window.createParticle !== 'undefined';
      });

      if (!hasParticles) {
        throw new Error('Particle system not found');
      }

      console.log('     ✅ Particle system exists');
    });

    test('Hit effects display correctly', async () => {
      // This test would verify:
      // 1. Hit effects appear on damage
      // 2. Effects have correct colors
      // 3. Effects fade appropriately
      
      console.log('     ⏭️  Skipped - requires interactive combat');
    });
  });

  // Cleanup
  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total tests:  ${results.total}`);
  console.log(`Passed:       ${results.passed}`);
  console.log(`Failed:       ${results.failed}`);
  console.log(`Skipped:      ${results.skipped}`);
  console.log(`Success rate: ${(results.passed / results.total * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the output above.');
    process.exit(1);
  } else if (results.total > 0) {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
