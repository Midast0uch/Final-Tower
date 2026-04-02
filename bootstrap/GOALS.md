# Tower Defense Game - Development Goals

## Project Overview
- **Project**: 3D Browser-based Tower Defense Game
- **Engine**: Three.js (via CDN)
- **Goal**: Fully functional, polished iPhone-quality game experience
- **Grid System**: 20x20 tile-based map

---

## Phase 1: Core Game Logic (Critical - Must Fix First)

### 1.1 Path System
- **Standard**: Single continuous path from left edge (x:0) to right edge (x:19)
- **Path Coordinates**: Must stay within y:5-15 range (visible on map)
- **Visual**: Connected tiles that clearly show enemy route from spawn to end

### 1.2 Enemy Spawning & Movement
- Enemies spawn at path start (x:0, left side)
- Follow waypoints sequentially through path
- Reach end = player loses 1 life
- Killed by tower = player gains energy

### 1.3 Tower Combat System
- Towers auto-target nearest enemy in range
- Projectiles travel to enemy and deal damage on hit
- Health system - enemies die when health <= 0
- Proper collision detection (not broken logic)

### 1.4 Wave Logic
- Use timestamp-based spawning (Date.now()), NOT frame counters
- Wave complete when: all enemies spawned AND all enemies dead/gone
- Proper reset between waves - towers stay, new wave starts fresh

---

## Phase 2: UI/UX Overhaul

### 2.1 Tower Card Dock
- Position: Bottom of screen, floating dock style
- Glassmorphism effect (backdrop blur, semi-transparent)
- Premium hover/select animations with glow
- Click to select, click again to deselect

### 2.2 Energy Display
- Circular progress ring with animation
- Shows current/max energy clearly
- Floating "+X" text when energy gained

### 2.3 Lives Display
- Animated heart icons
- Pulse animation when life lost
- Clear visual indicator of remaining lives

### 2.4 Start Button States
- START GAME → PLACE TOWERS → START WAVE 1 → (wave plays) → START WAVE 2 → etc
- Clear state transitions with visual feedback

---

## Phase 3: Visual Polish

### 3.1 Grass Terrain
- Multiple layers of grass blades with color variation
- Decorative elements: flowers (white/yellow/pink), small rocks
- Organic height variation for depth
- NOT flat green surface

### 3.2 Path Tiles
- Stone/sandy colored tiles with slight texture
- Grid lines between tiles for clarity
- Optional: directional arrows showing enemy flow
- Raised slightly above grass level

### 3.3 Tower Models
- Basic: Box base with rotating head and barrel
- Sniper: Tall cylindrical with long scope
- Cannon: Heavy round base with dual barrels
- Distinct silhouettes visible from top-down view

### 3.4 Enemy Visuals
- Different shapes per type: sphere, cube, pyramid
- Color coding: green=basic, blue=sniper, red=cannon, purple=boss
- Size variation: bosses 2.5x larger

### 3.5 Effects & Animations
- Particle explosions on enemy death
- Wave announcement overlay ("WAVE X")
- Smooth UI transitions and button hover effects
- Projectile trails

---

## Game Balance Standards

### Energy System
- Start with 100⚡
- Rewards per kill:
  - Basic enemy: +10⚡
  - Cannon enemy: +15⚡
  - Boss enemy: +30⚡
- Energy only gained by defeating enemies (not from waves)

### Tower Costs
- Basic: 20⚡ - balanced damage/speed
- Sniper: 40⚡ - high damage, slow, long range
- Cannon: 60⚡ - area damage potential

### Lives
- Start with 8 lives
- Lose 1 when enemy reaches path end
- Game over at 0 lives
- Victory after surviving all waves

---

## Technical Standards

### Code Quality
- Use ES6+ features (const/let, arrow functions)
- Proper error handling in game loop
- No memory leaks (dispose geometries/materials)
- Validate inputs before use

### Performance
- Object pooling where possible
- Minimize DOM updates
- Reuse geometries and materials

### Browser Compatibility
- Test on Chrome, Firefox, Edge
- Use local HTTP server (not file://)
- WebGL required

---

## File Structure
```
tower-defense/
├── tower-defense.html    # Main game (single file)
├── README.md             # Game documentation
└── bootstrap/
    ├── session_start.py  # Coordinate system
    ├── record_event.py   # Event logging
    └── coordinates.db    # Coordinate database
```

---

## Acceptance Criteria

- [ ] Path clearly visible from left to right
- [ ] Enemies spawn and follow path completely
- [ ] Towers shoot and damage enemies
- [ ] Enemies die and award energy
- [ ] Lives decrease when enemies reach end
- [ ] Wave progression works (1 → 2 → 3...)
- [ ] Game over when lives = 0
- [ ] Victory when all waves complete
- [ ] UI looks premium (not 2004 quality)
- [ ] No console errors during gameplay