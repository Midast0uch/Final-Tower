# Tower Defense Game

A 3D browser-based Tower Defense game built with Three.js. Place towers to defend against waves of enemies trying to cross the map.

## How to Play

1. **Start Game** - Click "START GAME" to begin
2. **Place Towers** - Select a tower card, then click on the grass to place it
3. **Start Wave** - Click the button to spawn enemies
4. **Defend** - Towers will automatically shoot at enemies
5. **Earn Energy** - Defeating enemies awards energy for more towers
6. **Survive** - Don't let enemies reach the end!

## Tower Types

| Tower | Cost | Damage | Fire Rate | Special |
|-------|------|--------|-----------|---------|
| 🔫 Basic | 20⚡ | Low | Fast | Balanced |
| 🎯 Sniper | 40⚡ | High | Slow | Long range |
| 💣 Cannon | 60⚡ | High | Slow | Area damage |

## Game Flow

1. Start Game → 2. Place Towers → 3. Start Wave → 4. Enemies Follow Path → 5. Towers Attack → 6. Earn Energy → Repeat

## Controls

- **Click tower card** - Select tower to place
- **Click selected tower again** - Deselect/cancel
- **Click on map** - Place selected tower (must be on grass, not path)
- **Click START buttons** - Progress through game phases

## Energy System

- Start with 100⚡
- Earn energy by defeating enemies:
  - Basic enemies: +10⚡
  - Cannon enemies: +15⚡
  - Boss enemies: +30⚡

## Running the Game

### Option 1: Local Server (Recommended)
```bash
cd tower-defense
python -m http.server 8080
```
Then open: http://localhost:8080/tower-defense.html

### Option 2: VS Code Live Server
1. Install Live Server extension
2. Right-click tower-defense.html → "Open with Live Server"

## Technical Details

- **Engine**: Three.js (via CDN)
- **Rendering**: WebGL with 3D geometry
- **Camera**: Top-down isometric view
- **Grid**: 20x20 tile system with path-based enemy routing

## Browser Requirements

- Chrome 80+, Firefox 75+, Edge 80+, Safari 13+
- WebGL support required

## Game Features

- ✓ 3D tower models with unique designs
- ✓ Path-following enemy AI
- ✓ Tower targeting and projectiles
- ✓ Energy rewards system
- ✓ Wave progression
- ✓ Animated UI and effects
- ✓ Premium glassmorphism tower cards