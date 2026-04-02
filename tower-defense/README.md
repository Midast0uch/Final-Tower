# Final Tower - Endless 3D Tower Defense

A 3D browser-based Tower Defense game built with Three.js featuring Minecraft-style voxel terrain, dynamic path generation, and endless waves.

## How to Play

1. **Enter Name** - Type your name and click "START GAME"
2. **Main Menu** - Click "PLAY" to start
3. **Preparation Phase** - You have 60 seconds to place towers
4. **Start Wave** - Click "START WAVE" to spawn enemies
5. **Defend** - Towers automatically shoot enemies
6. **Survive** - Don't let enemies reach the end!

## Game Flow

```
Login → Main Menu → Preparation (60s) → Wave Active → Wave Complete → Repeat
```

## Tower Types

| Tower | Cost | Damage | Range | Special |
|-------|------|--------|-------|---------|
| 🔵 Basic | 20⚡ | 5 | 7 | Balanced |
| 🎯 Sniper | 40⚡ | 15 | 18 | Long range |
| 💥 Cannon | 60⚡ | 3 | 6 | Area damage (4 tile) |
| 💣 Trap | 35⚡ | 30 | 3 | One-time use |
| ❄️ Slow | 45⚡ | 2 | 8 | 50% slow |

## Enemy Types

| Enemy | HP | Speed | Special |
|-------|-----|-------|---------|
| 🟢 Basic | Standard | Standard | - |
| 🟡 Fast | Low | 1.8x | - |
| 🔵 Tank | High | 0.5x | - |
| 🟣 Sniper | Low | Standard | Long range attack |
| 🟤 Burrowing | Standard | 0.7x | Ignores ground turrets |
| 🩷 Spawner | High | 0.3x | Spawns minions |
| 🔴 Boss (every 5 waves) | Very High | 0.4x | - |

## Path Types

- **STRAIGHT** - Direct path from start to end
- **WINDING** - Curved zigzag path
- **BRANCHING** - Forks into multiple paths
- **MAZE** - Complex labyrinth path

Path type changes every 6 waves.

## Running the Game

### Local Server (Required - not file://)
```bash
cd tower-defense
python -m http.server 8080
```
Open: http://localhost:8080/tower-defense.html

### VS Code Live Server
1. Install Live Server extension
2. Right-click tower-defense.html → "Open with Live Server"

## Technical Details

- **Engine**: Three.js (via CDN)
- **Rendering**: WebGL with 3D voxel geometry
- **Camera**: Top-down isometric view
- **Grid**: 20x20 tile system

## Browser Requirements

- Chrome 80+, Firefox 75+, Edge 80+, Safari 13+
- WebGL support required

## Features

- ✓ Endless wave system with scaling difficulty
- ✓ 5 tower types with unique abilities
- ✓ 7 enemy types with varied behavior
- ✓ 4 path generation algorithms
- ✓ Minecraft-style voxel terrain
- ✓ Login & main menu
- ✓ Leaderboard & achievements system
- ✓ Save/load game progress
- ✓ Animated UI and effects