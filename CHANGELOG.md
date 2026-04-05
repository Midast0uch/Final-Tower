# Changelog

## Unreleased

### Bug Fixes
- Fix "Cannot read properties of undefined (reading 'value')" console error by adding null checks for DOM elements in `setupLoginScreen()` and `createUI()`
- Fix "Unexpected token <" syntax error caused by unpkg CDN returning HTML error page; switched to jsdelivr/cdnjs CDN with fallback
- Fix enemy visibility glitching — all enemies were toggling on/off every ~4 frames due to unguarded `invisTimer`; now only `burrowing` type enemies use invisibility
- Fix enemy glowMesh position drifting — now tracks `enemy.mesh.position` instead of base `enemy.position`
- Fix missing `camera` and `renderer` initialization in `init()` — both were declared but never instantiated
- Remove `<base href="/">` tag that caused resource path resolution issues
- Fix orphaned duplicate code block (lines 1178-1191) that caused syntax errors
- Fix path tiles buried under grass blocks — raised from y=6.5 to y=7.5
- Fix camera not centering on map at game start — now uses `updateCameraPosition()` with proper initial state

### Gameplay
- Reduced early wave enemy health scaling: `healthMult` from 0.12→0.06 per wave in `generateWaveEnemies()`, `waveHealthMult` from 0.08→0.04 per wave in `spawnEnemy()`
- Reduced speed multipliers: `speedMult` from 0.015→0.01 and 0.01→0.005 for smoother early game

### Visual
- Path tiles now pulse between dark brown and saturated green (`0x1a8a0a`) with emissive glow (intensity 1.0–2.0), visible through scene lighting
- Dimmed scene lighting: ambient 0.6→0.4, hemisphere 0.5→0.35, directional 1.2→0.9, fill 0.3→0.2
- Decoy brown dirt tiles scattered on ~10% of grass tiles for visual confusion and natural aesthetic
- Path tiles use darker mole-brown colors (`0x3d2b1f` to `0x2c1a0a`) with stronger edge outlines (opacity 0.35)
- Replaced ShaderMaterial skybox with solid background color (`0x87CEEB`) to fix Three.js internal uniform error
- Added CDN fallback chain for Three.js (jsdelivr → cdnjs)
- Added error trapping for uncaught errors and unhandled promise rejections

### Code Quality
- Added null checks throughout `setupLoginScreen()`, `createUI()`, and `setupEventListeners()`
- Added `decoyTiles` array for tracking and clearing decoy tiles between waves
