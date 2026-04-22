# Visual Enhancement Plan: Enemies, Turrets & Map Tiles

## Overview
All game assets are procedurally generated using Three.js BoxGeometry (voxel style) in `tower-defense.html`. This plan provides **intricate, precise code edits** to significantly enhance visual detail across enemies, turrets, and map tiles.

---

## IMPLEMENTATION TODO (Sequential Build Order)

### Phase 1: Foundation & Quick Wins

- [ ] **Task 1.1**: Declare missing arrays (`deathParticles`, `impactEffects`) near line 703
  - **Search pattern**: Find `let debrisParticles` or `let particles` near the top of the file where game state arrays are declared
  - **Insert after**: The existing particle array declarations (around line 703)
  - **Code to add**:
    ```javascript
    let deathParticles = [];
    let impactEffects = [];
    ```
  - **Dependencies**: None — this is a prerequisite for Tasks 8.1, 8.2, 8.3, 8.7
  - **Acceptance criteria**: No console errors when referencing `deathParticles.push()` or `impactEffects.push()`

- [ ] **Task 1.2**: Add material cache (`MATERIAL_CACHE`, `getMaterial()`) near top of file
  - **Search pattern**: Find `const CONFIG = {` block near top of file
  - **Insert after**: The CONFIG block, before any entity creation functions
  - **Code to add**:
    ```javascript
    const MATERIAL_CACHE = {};
    function getMaterial(key, props) {
        if (!MATERIAL_CACHE[key]) {
            MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial(props);
        }
        return MATERIAL_CACHE[key];
    }
    ```
  - **Dependencies**: None — this is a prerequisite for all enhancement tasks
  - **Acceptance criteria**: `getMaterial('test', {color: 0xff0000})` returns a cached material on second call
  - **Note**: Materials with per-instance randomization (color variations, transparency) should NOT use this cache

- [ ] **Task 1.3**: Add global toggle `VISUAL_ENHANCEMENTS_ENABLED` at top of file
  - **Search pattern**: Find `const CONFIG = {` or first `let` declaration
  - **Insert before**: CONFIG block
  - **Code to add**:
    ```javascript
    const VISUAL_ENHANCEMENTS_ENABLED = true;
    ```
  - **Dependencies**: None
  - **Acceptance criteria**: Setting to `false` in console disables all visual enhancements without breaking gameplay
  - **Usage**: Wrap all new voxel additions in `if (VISUAL_ENHANCEMENTS_ENABLED) { ... }`

- [ ] **Task 1.4**: Enhance enemy glow system (Section 1.8) — replace lines 2651-2656
  - **Search pattern**: `new THREE.SphereGeometry(12 * size` — find the existing enemy glow sphere creation
  - **Context**: This is inside the `createVoxelEnemyMesh()` function, after the switch case for enemy types, before the function returns
  - **Replace**: The existing glow sphere creation code (approximately 5-6 lines)
  - **With**: The enhanced glow code from Section 1.8 that adds `userData.phase`, `userData.baseOpacity`, and assigns to `enemy.glowMesh`
  - **Dependencies**: Task 1.1 (deathParticles array must exist)
  - **Acceptance criteria**: Each enemy has a glowMesh with pulsing animation data in userData
  - **Gotcha**: The existing glow code uses `scene.add(glowMesh)` — the enhanced version must do the same AND store reference on enemy object

- [ ] **Task 1.5**: Add water ripple animation to update loop (Section 4.2)
  - **Search pattern**: Find the main game loop — look for `function animate()` or `requestAnimationFrame(animate)`
  - **Insert inside**: The animate/update function, after existing terrain update calls
  - **Code to add**: The water ripple animation code from Section 4.2 (iterates `scene.children` for `isRipple`, `isSpore`, `isPuddle` userData)
  - **Dependencies**: Task 1.4 (must be in update loop already), Map tile water enhancements (Task 7.3)
  - **Acceptance criteria**: Water ripples pulse opacity and scale, spores float up and down, puddles shimmer
  - **Performance note**: This iterates ALL scene children — consider caching ripple/spore/puddle arrays for O(n) where n = effects count

- [ ] **Task 1.6**: Add enemy glow pulse animation to update loop (Section 4.1)
  - **Search pattern**: Find the main game loop — same location as Task 1.5
  - **Insert inside**: The animate/update function, near enemy update logic
  - **Code to add**: The enemy glow pulse animation from Section 4.1 (iterates `enemies` array, updates `glowMesh.material.opacity` and `glowMesh.scale`)
  - **Dependencies**: Task 1.4 (enhanced glow system must be in place)
  - **Acceptance criteria**: Enemy glow spheres pulse smoothly with sine wave opacity and scale
  - **Performance note**: O(n) where n = active enemies — negligible cost

### Phase 2: Existing Enemy Enhancements (7 types)

- [ ] **Task 2.1**: Basic Enemy — add arms, feet, nose, shoulder pads, tail, chest armor (Section 1.1)
  - **Search pattern**: `case 'basic':` inside `createVoxelEnemyMesh()` switch statement
  - **Insert before**: The `break;` statement of the basic case
  - **Code to add**: All voxel additions from Section 1.1 (arms, hands, feet, nose, shoulder pads, chest armor plate, tail)
  - **Dependencies**: Task 1.2 (material cache recommended but not required), Task 1.3 (wrap in VISUAL_ENHANCEMENTS_ENABLED check)
  - **Acceptance criteria**: Basic enemy has visible arms, feet, nose, shoulder pads, tail, and chest armor detail when viewed in browser
  - **Hitbox safety**: All new voxels are outside the core body hitbox — arms at x=±6, feet at y=0, nose at z=5, shoulders at x=±7, tail at z=-5
  - **Mesh count**: Adds ~10 meshes (from ~12 to ~22) — within budget of 30

- [ ] **Task 2.2**: Fast Enemy — add ear fins, claws, back spikes, streamlined feet, visor (Section 1.2)
  - **Search pattern**: `case 'fast':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the fast case
  - **Code to add**: All voxel additions from Section 1.2 (ear fins, claws, back spikes, streamlined feet, visor band)
  - **Dependencies**: Task 2.1 (same patterns apply)
  - **Acceptance criteria**: Fast enemy has swept-back ear fins, claw hands, back spikes, streamlined feet, and glowing visor band
  - **Note**: Visor material uses emissive `0xffaa00` — ensure it's visible but not overwhelming

- [ ] **Task 2.3**: Tank Enemy — add shoulder armor, armored legs, emblem, horns, shields, boots (Section 1.3)
  - **Search pattern**: `case 'tank':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the tank case
  - **Code to add**: All voxel additions from Section 1.3 (shoulder armor, shoulder spikes, armored legs, heavy boots, chest emblem, head horns, side shields, belt buckle)
  - **Dependencies**: Task 2.2
  - **Acceptance criteria**: Tank enemy looks heavily armored with shoulder plates, horn protrusions, side shields, and red chest emblem
  - **Mesh count**: Adds ~18 meshes (from ~16 to ~34) — within budget of 40

- [ ] **Task 2.4**: Sniper Enemy — add long arms, hat/hood, cloak, boots, scope lens, scope ring (Section 1.4)
  - **Search pattern**: `case 'sniper':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the sniper case
  - **Code to add**: All voxel additions from Section 1.4 (long arms, hands, hat brim, hat top, cloak back piece, boots, scope lens, scope ring)
  - **Dependencies**: Task 2.3
  - **Acceptance criteria**: Sniper enemy has tall hat/hood, flowing cloak, long arms, and glowing red scope lens
  - **Note**: Cloak material uses `color.multiplyScalar(0.65)` — derive from existing darkMat color

- [ ] **Task 2.5**: Burrowing Enemy — add drill front, digging claws, back plates, small eyes, tail fin, side armor (Section 1.5)
  - **Search pattern**: `case 'burrowing':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the burrowing case
  - **Code to add**: All voxel additions from Section 1.5 (drill front, large digging claws, armored back plates, small eyes, tail fin, side armor ridges)
  - **Dependencies**: Task 2.4
  - **Acceptance criteria**: Burrowing enemy has metallic drill protrusion, large claws, armored back plates, and tail fin
  - **Note**: Drill material is metallic gray (`0xaaaaaa`) — distinct from body color

- [ ] **Task 2.6**: Spawner Enemy — add spawning tube, portal ring, detailed pods, birthing sac, ritual markings, tentacles, crown (Section 1.6)
  - **Search pattern**: `case 'spawner':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the spawner case
  - **Code to add**: All voxel additions from Section 1.6 (spawning tube, portal ring, detailed side pods, pod openings, birthing sac, ritual markings, tentacle appendages, crown-like growth)
  - **Dependencies**: Task 2.5
  - **Acceptance criteria**: Spawner enemy has glowing purple portal on top, detailed side pods with glowing openings, birthing sac underneath, tentacles, and crown growth
  - **Mesh count**: Adds ~19 meshes (from ~14 to ~33) — within budget of 40

- [ ] **Task 2.7**: Boss Enemy — add pauldrons, gauntlets, throne back, chest core, leg armor, cape, crown jewels, arm bands, waist armor, foot spikes (Section 1.7)
  - **Search pattern**: `case 'boss':` inside `createVoxelEnemyMesh()`
  - **Insert before**: The `break;` statement of the boss case
  - **Code to add**: All voxel additions from Section 1.7 (shoulder pauldrons, pauldron spikes, armored gauntlets, gauntlet spikes, throne back structure, throne spikes, glowing chest core, core ring, leg armor plates, knee spikes, ground-stomp feet, foot spikes, cape, cape tattered bottom, crown jewels, arm bands, waist armor, waist belt buckle)
  - **Dependencies**: Task 2.6
  - **Acceptance criteria**: Boss enemy is massively detailed with pauldrons, throne back, glowing chest core (weak point), cape, crown jewels, and full armor
  - **Mesh count**: Adds ~35 meshes (from ~20 to ~55) — within budget of 60
  - **Gameplay note**: Chest core (`coreMat`) should be visually distinct as a weak point — red emissive with high intensity

### Phase 3: New Enemy Types (9 types, use lowercase naming)

- [ ] **Task 3.1**: Stealth Mole — semi-transparent body, shimmer, eye slits, cloak, mist trail, phase crystal, claws, feet (Section 1.9)
  - **Search pattern**: Find the `default:` case in `createVoxelEnemyMesh()` switch, or the last existing enemy case (`case 'boss':`)
  - **Insert before**: The `default:` case or after `case 'boss':` block
  - **Code to add**: Full `case 'stealth':` block from Section 1.9 (use lowercase `'stealth'` NOT `'STEALTH'` — see Code Alignment Note 16.1)
  - **Dependencies**: Task 2.7 (must come after existing enemies), Task 4.2 (special properties: dodgeChance=0.2, invisible=true)
  - **Acceptance criteria**: Stealth mole is semi-transparent with shimmer outline, glowing eye slits, mist trail, and phase crystal on back
  - **Integration note**: Requires `enemy.invisible = true` and toggle logic in enemy update loop (see Task 4.2)

- [ ] **Task 3.2**: Shielded Mole — shield generator, hex panels, chest plate, emitter bands, conduits, shield bubble (Section 1.10)
  - **Search pattern**: After `case 'stealth':` block
  - **Insert**: Full `case 'shielded':` block from Section 1.10 (use lowercase `'shielded'`)
  - **Dependencies**: Task 3.1, Task 4.2 (special property: armorReduction=0.15)
  - **Acceptance criteria**: Shielded mole has visible shield generator on back, translucent hex panels in front, energy conduits, and faint shield bubble outline
  - **Integration note**: Shield bubble should deplete when enemy takes damage (future enhancement)

- [ ] **Task 3.3**: Swarm Mole — tiny body, oversized claws, hive mark, blur trail, exoskeleton, antennae (Section 1.11)
  - **Search pattern**: After `case 'shielded':` block
  - **Insert**: Full `case 'swarm':` block from Section 1.11 (use lowercase `'swarm'`)
  - **Dependencies**: Task 3.2, Task 4.2 (special property: dodgeChance=0.2)
  - **Acceptance criteria**: Swarm mole is tiny (half size) with oversized claws, glowing hive mark, movement blur trail, and antennae
  - **Gameplay note**: Should move faster than basic enemies — verify speed multiplier in wave spawning

- [ ] **Task 3.4**: Splitting Mole — bulging body, crack lines, nucleus, inner silhouettes, claws, membrane ripples (Section 1.12)
  - **Search pattern**: After `case 'swarm':` block
  - **Insert**: Full `case 'splitting':` block from Section 1.12 (use lowercase `'splitting'`)
  - **Dependencies**: Task 3.3, Task 4.2 (special property: spawnOnDeath=2)
  - **Acceptance criteria**: Splitting mole looks bloated with glowing crack lines, visible nucleus core, and two faint inner mole silhouettes
  - **Integration note**: On death, must spawn 2 smaller child enemies — requires death handler modification (see Task 4.2)

- [ ] **Task 3.5**: Fire Elemental — charred body, ember cracks, flame head, smoke trail, heated claws (Section 1.13)
  - **Search pattern**: After `case 'splitting':` block
  - **Insert**: Full `case 'elemental_fire':` block from Section 1.13 (use lowercase `'elemental_fire'`)
  - **Dependencies**: Task 3.4
  - **Acceptance criteria**: Fire mole has charred ash body, glowing ember cracks, flame on head, smoke trail, and heated glowing claws
  - **Integration note**: On death, should deal burn damage to nearby towers (see Task 4.2)

- [ ] **Task 3.6**: Ice Elemental — frozen body, ice crust, frost spikes, snow cap, icicle claws, frost aura (Section 1.13)
  - **Search pattern**: After `case 'elemental_fire':` block
  - **Insert**: Full `case 'elemental_ice':` block from Section 1.13 (use lowercase `'elemental_ice'`)
  - **Dependencies**: Task 3.5
  - **Acceptance criteria**: Ice mole has translucent ice crust, frost spikes on back, snow cap, icicle claws, and frost aura ring on ground
  - **Integration note**: Should apply slow aura to nearby towers (see Task 4.2)

- [ ] **Task 3.7**: Poison Elemental — slime coating, toxic blisters, dripping slime, toxic claws, poison puddle (Section 1.13)
  - **Search pattern**: After `case 'elemental_ice':` block
  - **Insert**: Full `case 'elemental_poison':` block from Section 1.13 (use lowercase `'elemental_poison'`)
  - **Dependencies**: Task 3.6
  - **Acceptance criteria**: Poison mole has translucent slime coating, glowing toxic blisters, dripping slime, and poison puddle underneath
  - **Integration note**: Should apply poison DoT on hit (see Task 4.2)

- [ ] **Task 3.8**: Siege Mole — armored body, battering ram, ram head, siege tower, war paint, heavy feet, spikes (Section 1.14)
  - **Search pattern**: After `case 'elemental_poison':` block
  - **Insert**: Full `case 'siege':` block from Section 1.14 (use lowercase `'siege'`)
  - **Dependencies**: Task 3.7, Task 4.2 (special property: towerDamageMult=2)
  - **Acceptance criteria**: Siege mole is heavily armored with massive battering ram on front, siege tower on back, war paint markings, and heavy spiked feet
  - **Integration note**: Deals 2x damage to towers — verify in tower damage handler

- [ ] **Task 3.9**: Healer Mole — robed body, healing staff, aura ring, cross symbol, crystal pendant, hood (Section 1.15)
  - **Search pattern**: After `case 'siege':` block
  - **Insert**: Full `case 'healer':` block from Section 1.15 (use lowercase `'healer'`)
  - **Dependencies**: Task 3.8, Task 4.2 (special property: summonTimer=8, heal aura)
  - **Acceptance criteria**: Healer mole has flowing robe, healing staff with crystal, green aura ring on ground, white cross symbol on chest, and hood
  - **Integration note**: Should periodically heal nearby enemies — requires heal aura logic in enemy update loop (see Task 4.2)

- [ ] **Task 3.10**: Elite Basic — larger body, gold trim, champion helmet, crest, chest medal (Section 1.16)
  - **Search pattern**: After `case 'healer':` block
  - **Insert**: Full `case 'elite_basic':` block from Section 1.16 (use lowercase `'elite_basic'`)
  - **Dependencies**: Task 3.9, Task 4.2 (special property: armorReduction=0.15)
  - **Acceptance criteria**: Elite basic is 1.3x larger with gold trim on body edges, champion helmet with crest, gold-trimmed limbs, and chest medal
  - **Integration note**: Should have higher health than basic — verify in ENEMY_HEALTH dictionary

### Phase 4: Enemy System Integration (prerequisites for new types)

- [ ] **Task 4.1**: Add new enemy types to `ENEMY_KILL_REWARDS` dictionary
  - **Search pattern**: `const ENEMY_KILL_REWARDS = {` (around line 644)
  - **Insert**: Add all 16 new enemy types with appropriate reward values inside the existing dictionary, before the closing `}`
  - **Code to add**:
    ```javascript
    stealth: 18, shielded: 22, swarm: 4, splitting: 14,
    elemental_fire: 16, elemental_ice: 16, elemental_poison: 16,
    siege: 25, healer: 20, elite_basic: 18
    ```
  - **Dependencies**: Tasks 3.1-3.10 (enemy types must exist)
  - **Acceptance criteria**: Killing any new enemy type awards correct energy amount — no undefined reward errors

- [ ] **Task 4.2**: Add new enemy special properties (dodgeChance, armorReduction, invisible, etc.)
  - **Search pattern**: Find where existing enemy properties are set after `createVoxelEnemyMesh()` returns — look for `enemy.speed =` or `enemy.health =` assignments
  - **Insert**: Add special property assignments for each new type:
    ```javascript
    enemy.dodgeChance = (type === 'stealth' || type === 'swarm') ? 0.2 : 0;
    enemy.armorReduction = (type === 'shielded' || type === 'elite_basic') ? 0.15 : 0;
    enemy.invisible = (type === 'stealth') ? true : false;
    enemy.towerDamageMult = (type === 'siege') ? 2 : 1;
    enemy.spawnOnDeath = (type === 'splitting') ? 2 : (type === 'spawner') ? 2 : 0;
    enemy.summonTimer = (type === 'healer') ? 8 : (type === 'boss') ? 5 : 0;
    ```
  - **Dependencies**: Task 4.1
  - **Acceptance criteria**: Each new enemy type has correct special properties — stealth toggles visibility, shielded reduces damage, siege deals 2x tower damage, splitting spawns children on death
  - **Additional integration needed**:
    - **Stealth invisibility**: In enemy update loop, toggle `enemy.mesh.visible` every 2-3 seconds when `enemy.invisible === true`
    - **Splitting on death**: In death handler, if `enemy.spawnOnDeath > 0`, spawn N child enemies at death position with reduced size/health
    - **Healer aura**: In enemy update loop, if `enemy.summonTimer > 0`, periodically heal nearby enemies within radius
    - **Elemental death effects**: Fire elemental explodes with burn, ice elemental freezes nearby, poison elemental leaves poison puddle

- [ ] **Task 4.3**: Integrate new types into wave spawning logic
  - **Search pattern**: Find wave spawning code — look for `waveEnemies`, `spawnEnemy`, or `ENEMY_TYPES` array
  - **Modify**: Add new enemy types to wave composition. Early waves should only have basic/fast/swarm. Mid waves add tank/sniper/shielded. Late waves add boss/siege/healer/elementals.
  - **Dependencies**: Tasks 4.1, 4.2
  - **Acceptance criteria**: New enemy types appear in appropriate waves — no spawn errors, balanced difficulty progression
  - **Suggested wave composition**:
    - Waves 1-3: basic, fast
    - Waves 4-6: basic, fast, swarm, tank
    - Waves 7-10: + sniper, burrowing, shielded
    - Waves 11-15: + spawner, splitting, elemental variants
    - Waves 16-20: + siege, healer, elite_basic
    - Waves 21+: + boss (every 5 waves)

- [ ] **Task 4.4**: Add death particle update loop to main game loop
  - **Search pattern**: Find main game loop — `function animate()` or `requestAnimationFrame`
  - **Insert**: The death particle update code from Section 16.11 (iterates `deathParticles` array, updates position/opacity/life, removes dead particles)
  - **Dependencies**: Task 1.1 (deathParticles array), Task 8.1 (death explosion function)
  - **Acceptance criteria**: Death particles animate with gravity, fade out, and are removed from scene when life expires — no memory leak

- [ ] **Task 4.5**: Add impact effect update loop to main game loop
  - **Search pattern**: Same location as Task 4.4 (main game loop)
  - **Insert**: The impact effect update code from Section 16.11 (iterates `impactEffects` array, updates child positions/opacity, removes when life expires)
  - **Dependencies**: Task 1.1 (impactEffects array), Task 8.7 (impact effect function)
  - **Acceptance criteria**: Impact effects (sparks, smoke, crystals) animate and fade out correctly — no memory leak

- [ ] **Task 4.6**: Enhance hit flash for multi-material enemies (Section 16.10)
  - **Search pattern**: Find existing hit flash code — look for `hitFlash` or emissive white flash in damage handler
  - **Replace/Modify**: Update the hit flash to skip transparent/glowing materials and save/restore original emissive values
  - **Code to use**: The multi-material hit flash code from Section 16.10
  - **Dependencies**: Task 2.1-2.7 (enhanced enemies with multiple materials)
  - **Acceptance criteria**: Hit flash works correctly on enhanced enemies — armor plates flash white, but glow elements and transparent parts are not affected

- [ ] **Task 4.7**: Integrate damage visuals into damage handler (Section 16.7)
  - **Search pattern**: Find damage application code — look for `proj.target.health -= dmg`
  - **Insert after**: The health reduction line, add damage percent calculation and `applyDamageVisuals()` call
  - **Code to add**:
    ```javascript
    const maxHealth = ENEMY_HEALTH[proj.target.type] * waveScale;
    const damagePercent = 1 - (proj.target.health / maxHealth);
    applyDamageVisuals(proj.target.mesh || proj.target, damagePercent);
    ```
  - **Dependencies**: Task 8.5 (damage visual function), Task 4.6 (hit flash enhancement)
  - **Acceptance criteria**: Enemies show cracks at 25% damage, smoke at 50%, internal glow at 75% — visuals persist across hits

- [ ] **Task 4.8**: Add minimal status effect system (status, statusDuration, speedMultiplier) (Section 16.8)
  - **Search pattern**: Find enemy creation code — where `enemy.health`, `enemy.speed` are set
  - **Insert**: Initialize status properties on each enemy:
    ```javascript
    enemy.status = null;
    enemy.statusDuration = 0;
    enemy.speedMultiplier = 1;
    ```
  - **Also insert**: In projectile hit handler, add status application for SLOW tower:
    ```javascript
    if (proj.typeKey === 'SLOW') {
        enemy.status = 'SLOWED';
        enemy.statusDuration = 3000;
        enemy.speedMultiplier = TOWER_TYPES.SLOW.slowFactor || 0.5;
    }
    ```
  - **Also insert**: In enemy update loop, add status duration countdown:
    ```javascript
    if (enemy.statusDuration > 0) {
        enemy.statusDuration -= deltaTime;
        if (enemy.statusDuration <= 0) {
            enemy.status = null;
            enemy.speedMultiplier = 1;
        }
    }
    ```
  - **Dependencies**: Task 4.7
  - **Acceptance criteria**: Slow tower applies visible slow effect that expires after 3 seconds — enemy speed returns to normal
  - **Note**: BURNING, FROZEN, POISONED statuses require new tower types — defer for now or add as elemental tower variants

- [ ] **Task 4.9**: Add status visual update calls to enemy update loop (Section 2.3)
  - **Search pattern**: Find enemy update loop — where enemies move each frame
  - **Insert**: Call `applyStatusVisuals(enemy)` for each active enemy
  - **Dependencies**: Task 4.8 (status system), Task 8.6 (status visual function)
  - **Acceptance criteria**: Slowed enemies show blue ring, burning enemies have flame voxels, frozen enemies have ice shell, poisoned enemies have green bubbles
  - **Performance note**: Only call when `enemy.status !== null` to avoid unnecessary checks

### Phase 5: Turret Enhancements (5 types)

- [ ] **Task 5.1**: Basic Tower — add base platform, muzzle brake, heat vent, targeting sensor, ammo belt, corner reinforcements (Section 3.1)
  - **Search pattern**: `if (typeKey === 'BASIC')` inside turret creation function
  - **Replace**: The entire BASIC turret voxel block (lines 1365-1374) with the enhanced version from Section 3.1
  - **Dependencies**: Task 1.2 (material cache), Task 1.3 (VISUAL_ENHANCEMENTS_ENABLED)
  - **Acceptance criteria**: Basic tower has stepped base, corner reinforcements, muzzle brake, heat vent, targeting sensor, and ammo belt detail
  - **Critical fix**: After adding voxels, set `head` using material-based search instead of index (see Task 5.6)
  - **Mesh count**: ~18 meshes — within budget of 35

- [ ] **Task 5.2**: Sniper Tower — add tripod legs, barrel stabilizer, bipod, scope mount/lens, wind sensor, range finder (Section 3.2)
  - **Search pattern**: `else if (typeKey === 'SNIPER')`
  - **Replace**: The entire SNIPER turret voxel block (lines 1375-1387) with the enhanced version from Section 3.2 (labeled as 2.2 in plan)
  - **Dependencies**: Task 5.1
  - **Acceptance criteria**: Sniper tower has tripod legs, long barrel with stabilizer, bipod, scope with glowing red lens, wind sensor, and range finder
  - **Critical fix**: Set `head` using material-based search (see Task 5.6)
  - **Mesh count**: ~22 meshes — within budget of 35

- [ ] **Task 5.3**: Cannon Tower — add reinforced base, barrel casings, ammo boxes, blast shield, recoil dampeners, muzzle flash guards (Section 3.3)
  - **Search pattern**: `else if (typeKey === 'CANNON')`
  - **Replace**: The entire CANNON turret voxel block (lines 1388-1398) with the enhanced version from Section 3.3 (labeled as 2.3 in plan)
  - **Dependencies**: Task 5.2
  - **Acceptance criteria**: Cannon tower has reinforced base with rivets, dual barrels with casings, muzzle flash guards, recoil dampeners, ammo boxes, and blast shield
  - **Critical fix**: Set `head` using material-based search (see Task 5.6)
  - **Mesh count**: ~20 meshes — within budget of 35

- [ ] **Task 5.4**: Slow Tower — add crystal pedestal, energy ring, floating shards, growth clusters, rune markings, crystal tip (Section 3.4)
  - **Search pattern**: `else if (typeKey === 'SLOW')`
  - **Replace**: The entire SLOW turret voxel block (lines 1399-1408) with the enhanced version from Section 3.4 (labeled as 2.4 in plan)
  - **Dependencies**: Task 5.3
  - **Acceptance criteria**: Slow tower is a crystal structure with glowing energy ring, floating shards, rune markings, and glowing crystal tip
  - **Critical fix**: Set `head` using material-based search (see Task 5.6)
  - **Mesh count**: ~24 meshes — within budget of 35

- [ ] **Task 5.5**: Trap Tower — add pressure plate, markings, corner spikes, central spike with blood gro, hidden blades, trigger (Section 3.5)
  - **Search pattern**: `else if (typeKey === 'TRAP')`
  - **Replace**: The entire TRAP turret voxel block (lines 1409-1418) with the enhanced version from Section 3.5 (labeled as 2.5 in plan)
  - **Dependencies**: Task 5.4
  - **Acceptance criteria**: Trap tower has pressure plate base with warning markings, corner spikes, central spike with blood grooves, hidden blade slots, and trigger mechanism
  - **Critical fix**: Set `head` using material-based search (see Task 5.6)
  - **Mesh count**: ~26 meshes — within budget of 35

- [ ] **Task 5.6**: Fix turret `head` index references — use material-based or userData search instead of hardcoded indices (Section 16.4)
  - **Search pattern**: `head = meshGroup.children[meshGroup.children.length -` — find all turret head assignments
  - **Replace**: Each hardcoded index assignment with material-based or userData search:
    ```javascript
    // Tag the barrel voxel during creation:
    barrel.userData.isBarrel = true;
    // Then find it:
    head = meshGroup.children.find(c => c.userData.isBarrel) || meshGroup.children[meshGroup.children.length - 1];
    ```
  - **Dependencies**: Tasks 5.1-5.5 (all turret enhancements must be in place)
  - **Acceptance criteria**: All 5 turret types rotate correctly toward enemies — no wrong mesh rotation or missing rotation
  - **Testing**: Place each turret type and verify the barrel (not base, not decoration) rotates toward the nearest enemy

### Phase 6: Turret System Integration

- [ ] **Task 6.1**: Enhance projectile system — merge existing trails with plan's enhanced projectiles (Section 16.5)
  - **Search pattern**: Find projectile creation code — look for `proj.mesh =` or projectile geometry creation
  - **Decision**: Choose one of three options from Section 16.5:
    - **Option A (Recommended)**: Adapt enhanced projectile to return compatible object with `mesh: projGroup`
    - **Option B**: Enhance existing projectile creation inline (simpler, less risk)
    - **Option C**: Update projectile update loop to handle `THREE.Group` projectiles (most work)
  - **Dependencies**: Tasks 5.1-5.5 (turret enhancements), Task 8.7 (impact effects)
  - **Acceptance criteria**: Projectiles have enhanced visuals (trails, muzzle flash) and still connect with enemies correctly
  - **Gotcha**: Existing `proj.trails` array creates trailing spheres — merge with plan's trail system to avoid duplication

- [ ] **Task 6.2**: Add build animation to tower placement (Section 16.12)
  - **Search pattern**: Find tower placement code — where `createTower()` is called on click
  - **Insert after**: Tower creation, add `playBuildAnimation(tower.mesh)` call
  - **Code to add**: The `playBuildAnimation()` function from Section 2.7
  - **Dependencies**: Task 5.6 (head index fix)
  - **Acceptance criteria**: Towers scale up with bounce-in effect when placed — smooth animation over ~0.5 seconds

- [ ] **Task 6.3**: Add build animation update to main game loop (Section 2.7)
  - **Search pattern**: Find main game loop — same location as Tasks 4.4, 4.5
  - **Insert**: The build animation update code from Section 2.7 (iterates towers, updates `buildProgress` and scale)
  - **Dependencies**: Task 6.2
  - **Acceptance criteria**: Build animations progress each frame — towers reach full scale and stop animating

- [ ] **Task 6.4**: Add range indicator to tower placement preview (Section 16.13)
  - **Search pattern**: Find tower placement preview code — where ghost tower is shown on hover
  - **Insert**: Call `showRangeIndicator()` when preview is shown, remove indicator when placement is confirmed or cancelled
  - **Code to add**: The `showRangeIndicator()` function from Section 2.8
  - **Dependencies**: Task 6.2
  - **Acceptance criteria**: When hovering to place a tower, a translucent green range square shows the tower's attack radius
  - **Cleanup**: Range indicator must be removed from scene when tower is placed or placement is cancelled

- [ ] **Task 6.5**: Add wave incoming markers — verify spawn point variables (Section 16.14)
  - **Search pattern**: Find wave start code — where wave begins spawning enemies
  - **Insert**: Call `showWaveIncoming(waveNumber)` at wave start
  - **Verify**: Find actual spawn point variable names — search for `spawnX`, `spawnZ`, `spawnPoint`, `gameState.spawn`
  - **Code to add**: The `showWaveIncoming()` function from Section 2.9, with corrected spawn point variable names
  - **Dependencies**: Task 4.3 (wave spawning integration)
  - **Acceptance criteria**: When a wave starts, a flashing red beacon and warning ring appear at the spawn point for 2-3 seconds

- [ ] **Task 6.6**: Decide on turret upgrade visuals — implement, remove, or repurpose (Section 16.9)
  - **Search pattern**: None — this is a design decision task
  - **Options**:
    - **Option A**: Implement full upgrade system (right-click to upgrade, costs energy, adds visual details)
    - **Option B**: Remove Section 2.6 entirely (no upgrade visuals)
    - **Option C (Recommended)**: Repurpose as "wave survival" progression — towers gain visual details after N kills automatically
  - **Dependencies**: None — can be done in parallel
  - **Acceptance criteria**: Decision documented in code comments — if implementing, upgrade visuals appear correctly; if removing, Section 2.6 code is deleted

### Phase 7: Map Tile Enhancements

- [ ] **Task 7.1**: Grass Tile — add blade clusters, pebbles, soil patches (Section 3.1)
  - **Search pattern**: Find grass tile creation — look for grass color loop or `grassColor` variable
  - **Insert**: After the existing grass tile creation code, before the closing brace of the loop
  - **Code to add**: Grass blade clusters, pebbles, and soil patches from Section 3.1
  - **Dependencies**: Task 1.3 (VISUAL_ENHANCEMENTS_ENABLED)
  - **Acceptance criteria**: Grass tiles have visible blade clusters, scattered pebbles, and soil patches — natural look
  - **Performance note**: Add distance-based LOD — skip blades > 500 units from camera, reduce count > 200 units

- [ ] **Task 7.2**: Path Tile — add edge stones, wheel ruts, debris, puddles (Section 3.2)
  - **Search pattern**: Find path tile creation — look for `pathColor` or path tile loop
  - **Insert**: After existing path tile code, before the arrow section
  - **Code to add**: Path edge stones, wheel ruts, scattered debris, and puddle chance from Section 3.2
  - **Dependencies**: Task 7.1
  - **Acceptance criteria**: Path tiles have edge stones, wheel ruts, debris, and occasional puddles — worn road look
  - **Note**: Puddle userData includes `isPuddle: true` and `phase` for animation (Task 1.5)

- [ ] **Task 7.3**: Water — add ripple rings, foam edges, lily pads, underwater stones (Section 3.3)
  - **Search pattern**: Find water tile creation — look for water color or `waterMat`
  - **Insert**: After existing water tile code
  - **Code to add**: Water ripple rings and lily pads from Section 3.3
  - **Dependencies**: Task 7.2, Task 1.5 (water ripple animation)
  - **Acceptance criteria**: Water has animated ripple rings and scattered lily pads — living water feel
  - **Note**: Ripple userData includes `isRipple: true` and `phase` for animation (Task 1.5)

- [ ] **Task 7.4**: Flowers — add multi-petal design, leaves, pollen glow, varied stems (Section 3.4)
  - **Search pattern**: Find flower creation — look for existing flower loop or `flowerColors`
  - **Replace**: The entire flower creation block with the enhanced version from Section 3.4
  - **Dependencies**: Task 7.3
  - **Acceptance criteria**: Flowers have stems with leaves, multi-petal heads with glowing pollen centers — varied heights and colors

- [ ] **Task 7.5**: Mushrooms — add spots, gills, spore glow, cluster grouping, roots (Section 3.5)
  - **Search pattern**: Find mushroom creation — look for `mushCapGeo` or mushroom loop
  - **Replace**: The entire mushroom creation block with the enhanced version from Section 3.5
  - **Dependencies**: Task 7.4
  - **Acceptance criteria**: Mushrooms have spotted caps, visible gills underneath, glowing spores, and cluster groupings — magical forest feel
  - **Note**: Spore userData includes `isSpore: true` and `phase` for animation (Task 1.5)

- [ ] **Task 7.6**: Rocks — add crystal inlay, moss patches, crack lines (Section 3.6)
  - **Search pattern**: Find rock creation — look for `rockColors` or rock loop
  - **Replace**: The entire rock creation block with the enhanced version from Section 3.6
  - **Dependencies**: Task 7.5
  - **Acceptance criteria**: Rocks have moss patches, crystal inlays, and crack lines — weathered natural look

- [ ] **Task 7.7**: Grass Tufts — add multi-blade tufts, swaying, flower chance (Section 3.7)
  - **Search pattern**: Find grass tuft creation — look for `grassTuftColors` or tuft loop
  - **Replace**: The entire grass tuft creation block with the enhanced version from Section 3.7
  - **Dependencies**: Task 7.6
  - **Acceptance criteria**: Grass tufts have multiple blades with varied rotation, occasional small flowers — dense grassy areas

- [ ] **Task 7.8**: Pine Trees — add roots, branch protrusions, pine cones, bark texture (Section 3.8)
  - **Search pattern**: Find pine tree creation — look for `createVoxelPineTree` function
  - **Insert**: After the existing pine tree voxels, before `group.position.set`
  - **Code to add**: Root details, branch protrusions, pine cones, and bark texture voxels from Section 3.8
  - **Dependencies**: Task 7.7
  - **Acceptance criteria**: Pine trees have visible roots, branch protrusions, pine cones, and bark texture — detailed conifer look

- [ ] **Task 7.9**: Oak Trees — add root system, branches, acorns, bark, bird nest chance (Section 3.9)
  - **Search pattern**: Find oak tree creation — look for `createVoxelOakTree` function
  - **Insert**: After the existing oak tree voxels, before `group.position.set`
  - **Code to add**: Root system, branch structure, acorn details, bark texture, and bird nest chance from Section 3.9
  - **Dependencies**: Task 7.8
  - **Acceptance criteria**: Oak trees have expansive root system, branch structure, acorns, bark texture, and occasional bird nests with eggs

- [ ] **Task 7.10**: Bushes — add varied shapes, thorns, flowers, leaf variations (Section 3.10)
  - **Search pattern**: Find bush creation — look for `createVoxelBush` function
  - **Replace**: The entire `createVoxelBush` function with the enhanced version from Section 3.10
  - **Dependencies**: Task 7.9
  - **Acceptance criteria**: Bushes have varied leaf colors, thorns, berries, and occasional small flowers — dense hedge look

### Phase 8: Death Animations & Visual Effects

- [ ] **Task 8.1**: Implement death explosion function (Section 2.1)
  - **Search pattern**: Find enemy death handler — look for `enemy.health <= 0` or `createExplosion`
  - **Insert**: The `playDeathExplosion()` function from Section 2.1 near the death handler
  - **Integrate**: Call `playDeathExplosion()` before `scene.remove(enemy.mesh)` for Boss, Siege, Elemental Fire types
  - **Dependencies**: Task 1.1 (deathParticles array), Task 4.4 (death particle update loop)
  - **Acceptance criteria**: Boss, Siege, and Fire Elemental enemies explode into particles on death — particles have gravity and fade out

- [ ] **Task 8.2**: Implement death dissolve function + update loop (Section 2.1)
  - **Search pattern**: Same location as Task 8.1
  - **Insert**: The `playDeathDissolve()` function from Section 2.1
  - **Also insert**: The dissolve update code in the enemy update loop (checks `enemy.userData.isDissolving`)
  - **Integrate**: Call `playDeathDissolve(enemy)` for Stealth, Splitting types before removal
  - **Dependencies**: Task 8.1
  - **Acceptance criteria**: Stealth and Splitting enemies fade out with scale increase on death — smooth dissolve over ~2 seconds

- [ ] **Task 8.3**: Implement death collapse function + update loop (Section 2.1)
  - **Search pattern**: Same location as Task 8.1
  - **Insert**: The `playDeathCollapse()` function from Section 2.1
  - **Also insert**: The collapse update code in the enemy update loop (checks `enemy.userData.isCollapsing`)
  - **Integrate**: Call `playDeathCollapse(enemy)` for Tank, Elite, Shielded types before removal
  - **Dependencies**: Task 8.2
  - **Acceptance criteria**: Tank, Elite, and Shielded enemies tip over and squish on death — collapse animation over ~1 second

- [ ] **Task 8.4**: Integrate death animations with existing `createExplosion()` and death handler (Section 16.6)
  - **Search pattern**: Find existing `createExplosion()` function and death handler
  - **Modify**: Call the appropriate death animation function (explosion, dissolve, or collapse) based on enemy type BEFORE `scene.remove(enemy.mesh)`
  - **Also**: Ensure `deathParticles` array is declared (Task 1.1) and update loop is active (Task 4.4)
  - **Dependencies**: Tasks 8.1, 8.2, 8.3
  - **Acceptance criteria**: Death animations play correctly for each enemy type — no double explosions, no missing animations

- [ ] **Task 8.5**: Add damage visual function (cracks, smoke, core glow) (Section 2.2)
  - **Search pattern**: Near the damage handler or enemy creation functions
  - **Insert**: The `applyDamageVisuals()` function from Section 2.2
  - **Dependencies**: Task 4.7 (damage visual integration)
  - **Acceptance criteria**: Function is available and correctly adds crack voxels at 25%, smoke at 50%, core glow at 75% damage

- [ ] **Task 8.6**: Add status effect visual function (burning, frozen, poisoned, slowed) (Section 2.3)
  - **Search pattern**: Near the enemy update functions
  - **Insert**: The `applyStatusVisuals()` function from Section 2.3
  - **Dependencies**: Task 4.8 (status effect system), Task 4.9 (status visual update calls)
  - **Acceptance criteria**: Function correctly adds flame voxels for burning, ice shell for frozen, poison bubbles for poisoned, blue ring for slowed
  - **Note**: Only SLOWED has backing system currently — BURNING/FROZEN/POISONED visuals will not trigger until elemental tower types are added

- [ ] **Task 8.7**: Create impact effect function (sparks, explosion, ice crystals) (Section 2.5)
  - **Search pattern**: Near the projectile hit handler
  - **Insert**: The `createImpactEffect()` function from Section 2.5
  - **Integrate**: Call `createImpactEffect(position, type)` in projectile hit handler based on projectile type
  - **Dependencies**: Task 1.1 (impactEffects array), Task 4.5 (impact effect update loop), Task 6.1 (projectile enhancement)
  - **Acceptance criteria**: Basic projectiles create spark bursts, cannon creates explosion crater + smoke, slow creates ice crystal burst — all fade out correctly

### Phase 9: Testing & Verification

- [ ] **Task 9.1**: Visual verification — orbit camera around each enhanced entity
  - **Procedure**: Open `tower-defense.html` in browser, spawn each enemy type individually, place each turret type, inspect map decorations
  - **Checklist**:
    - [ ] All 7 existing enemy types show enhancement details
    - [ ] All 16 new enemy types render correctly
    - [ ] All 5 turret types show enhancement details
    - [ ] Map decorations (grass, flowers, mushrooms, rocks, trees, bushes) show details
    - [ ] No z-fighting (flickering overlapping voxels)
    - [ ] No T-pose or floating voxels (everything attached)
    - [ ] Color consistency (new voxels match entity palette)
  - **Dependencies**: All implementation tasks complete

- [ ] **Task 9.2**: Performance testing — FPS, draw calls, GPU memory
  - **Procedure**: Open DevTools → Performance tab, record 30 seconds of gameplay with maximum entities
  - **Checklist**:
    - [ ] FPS stays above 55 (target 60)
    - [ ] Draw calls < 2000
    - [ ] GPU memory < 500MB
    - [ ] No memory leak (materials not growing over time)
  - **Fallback**: If FPS < 55, apply fallback strategy from Section 6.5 (disable animations, reduce decorations, simplify boss)
  - **Dependencies**: Task 9.1

- [ ] **Task 9.3**: Gameplay testing — full wave with all enemy types, all turret types fire correctly
  - **Procedure**: Play a full game through 20+ waves
  - **Checklist**:
    - [ ] All enemy types spawn in appropriate waves
    - [ ] All turret types fire and hit enemies correctly
    - [ ] Death animations play for all enemy types
    - [ ] Damage visuals appear correctly
    - [ ] Status effects (slow) work correctly
    - [ ] No gameplay-breaking errors in console
  - **Dependencies**: Task 9.2

- [ ] **Task 9.4**: Collision testing — enemies take damage, pathfinding works, projectiles connect
  - **Procedure**: Focus on hitbox and collision behavior
  - **Checklist**:
    - [ ] Enemies take damage when clicked/targeted (hitbox not broken by new voxels)
    - [ ] Enemy pathfinding is not blocked by new visual voxels
    - [ ] Turret projectiles connect with enemies at expected range
    - [ ] Boss chest core is visually clear and mechanically functional (if weak point system exists)
    - [ ] Trap tower pressure plate triggers on enemy overlap
    - [ ] Slow tower crystal aura applies slow effect in correct radius
  - **Dependencies**: Task 9.3

- [ ] **Task 9.5**: Cross-browser testing — Chrome, Firefox, Safari, Edge
  - **Procedure**: Open `tower-defense.html` in each browser, run basic gameplay test
  - **Checklist**:
    - [ ] Chrome: All visuals render correctly, 60 FPS
    - [ ] Firefox: All visuals render correctly, acceptable FPS
    - [ ] Safari (if applicable): All visuals render correctly, acceptable FPS
    - [ ] Edge: All visuals render correctly, acceptable FPS
  - **Dependencies**: Task 9.4
  - **Procedure**: Open `tower-defense.html` in each browser, run basic gameplay test
  - **Checklist**:
    - [ ] Chrome: All visuals render correctly, 60 FPS
    - [ ] Firefox: All visuals render correctly, acceptable FPS
    - [ ] Safari (if applicable): All visuals render correctly, acceptable FPS
    - [ ] Edge: All visuals render correctly, acceptable FPS
  - **Dependencies**: Task 9.4

---

## 1. ENEMY ENHANCEMENTS

### 1.1 Basic Enemy (lines 2482-2491)
**Current**: 4-tier body, 2 eyes, simple mouth
**Enhancements**:
- Add small arms on each side (2 voxels each)
- Add feet/leg voxels at the base
- Add a subtle nose voxel between eyes
- Add shoulder pads (slightly lighter color voxels)
- Add a tail voxel at the back
- Add subtle armor plate detail on chest

**Precise edits** (add after line 2490, before `break;`):
```javascript
// Arms
voxel(2, 6, 2, -6, 8, 0, darkMat);
voxel(2, 6, 2, 6, 8, 0, darkMat);
// Hands
voxel(2, 2, 2, -6, 4, 0, lightMat);
voxel(2, 2, 2, 6, 4, 0, lightMat);
// Feet
voxel(3, 2, 4, -3, 0, 2, darkMat);
voxel(3, 2, 4, 3, 0, 2, darkMat);
// Nose
voxel(2, 2, 2, 0, 8, 5, lightMat);
// Shoulder pads
voxel(4, 2, 3, -7, 11, 0, lightMat);
voxel(4, 2, 3, 7, 11, 0, lightMat);
// Chest armor plate
voxel(6, 3, 1, 0, 7, 4.5, lightMat);
// Tail
voxel(2, 2, 4, 0, 4, -5, darkMat);
```

### 1.2 Fast Enemy (lines 2492-2502)
**Current**: Slim body, small eyes, 2 teeth
**Enhancements**:
- Add swept-back ear fins (aerodynamic look)
- Add claw hands
- Add spike protrusions on back
- Add streamlined feet
- Add a visor-like dark band across eyes

**Precise edits** (add after line 2502, before `break;`):
```javascript
// Ear fins (swept back)
voxel(1, 2, 3, -3, 10, -2, darkMat);
voxel(1, 2, 3, 3, 10, -2, darkMat);
// Claws
voxel(1, 1, 2, -3, 4, 3, lightMat);
voxel(1, 1, 2, -1, 4, 3, lightMat);
voxel(1, 1, 2, 1, 4, 3, lightMat);
voxel(1, 1, 2, 3, 4, 3, lightMat);
// Back spikes
voxel(1, 3, 1, 0, 10, -3, lightMat);
voxel(1, 2, 1, -2, 8, -3, lightMat);
voxel(1, 2, 1, 2, 8, -3, lightMat);
// Streamlined feet
voxel(2, 1, 3, -2, 0, 1, darkMat);
voxel(2, 1, 3, 2, 0, 1, darkMat);
// Visor band
const visorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.6, emissive: 0xffaa00, emissiveIntensity: 0.15 });
voxel(6, 1.5, 1, 0, 9, 3.5, visorMat);
```

### 1.3 Tank Enemy (lines 2504-2517)
**Current**: Large body, brows, teeth, mouth
**Enhancements**:
- Add heavy shoulder armor plates
- Add armored leg blocks
- Add chest emblem/badge
- Add horn-like protrusions on head
- Add side-mounted shields
- Add heavy boot voxels

**Precise edits** (add after line 2517, before `break;`):
```javascript
// Heavy shoulder armor
voxel(6, 4, 5, -10, 14, 0, lightMat);
voxel(6, 4, 5, 10, 14, 0, lightMat);
// Shoulder spikes
voxel(2, 4, 2, -11, 17, 0, lightMat);
voxel(2, 4, 2, 11, 17, 0, lightMat);
// Armored legs
voxel(5, 6, 5, -5, 2, 3, darkMat);
voxel(5, 6, 5, 5, 2, 3, darkMat);
// Heavy boots
voxel(6, 3, 6, -5, 0, 3, lightMat);
voxel(6, 3, 6, 5, 0, 3, lightMat);
// Chest emblem
const emblemMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3, metalness: 0.5, emissive: 0xff4444, emissiveIntensity: 0.2 });
voxel(4, 4, 1, 0, 10, 7.5, emblemMat);
// Head horns
voxel(3, 5, 3, -5, 23, 0, darkMat);
voxel(3, 5, 3, 5, 23, 0, darkMat);
voxel(2, 3, 2, -5, 26, 0, lightMat);
voxel(2, 3, 2, 5, 26, 0, lightMat);
// Side shields
voxel(3, 10, 8, -9, 10, 3, lightMat);
voxel(3, 10, 8, 9, 10, 3, lightMat);
// Belt buckle
const buckleMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
voxel(4, 3, 1, 0, 5, 7.5, buckleMat);
```

### 1.4 Sniper Enemy (lines 2519-2529)
**Current**: Tall thin body, asymmetric eyes, scope attachment
**Enhancements**:
- Add long thin arms
- Add a hat/hood
- Add a cloak-like back piece
- Add boots
- Add a scope lens detail (glowing)
- Add finger details on hands

**Precise edits** (add after line 2529, before `break;`):
```javascript
// Long arms
voxel(2, 8, 2, -5, 10, 0, darkMat);
voxel(2, 8, 2, 5, 10, 0, darkMat);
// Hands
voxel(2, 2, 2, -5, 5, 0, lightMat);
voxel(2, 2, 2, 5, 5, 0, lightMat);
// Hat/hood brim
voxel(8, 1, 6, 0, 21, 1, darkMat);
// Hat top
voxel(6, 3, 4, 0, 22.5, 0, darkMat);
// Cloak back piece
const cloakMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.65).getHex(), roughness: 0.8, metalness: 0.0 });
voxel(8, 10, 2, 0, 12, -4, cloakMat);
voxel(6, 8, 2, 0, 8, -5, cloakMat);
// Boots
voxel(3, 3, 4, -2, 0, 1, darkMat);
voxel(3, 3, 4, 2, 0, 1, darkMat);
// Scope lens (glowing red)
const scopeLensMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, metalness: 0.8, emissive: 0xff0000, emissiveIntensity: 0.6 });
voxel(2, 2, 1, 0, 19, 4.5, scopeLensMat);
// Scope ring detail
voxel(3, 3, 1, 0, 19, 5, darkMat);
```

### 1.5 Burrowing Enemy (lines 2531-2542)
**Current**: Wide body, side fins/claws, teeth
**Enhancements**:
- Add drill-like front protrusion
- Add digging claws (larger, more detailed)
- Add armored back plates
- Add underground-adapted small eyes
- Add tail fin
- Add side armor ridges

**Precise edits** (add after line 2542, before `break;`):
```javascript
// Drill front
const drillMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.7 });
voxel(4, 4, 2, 0, 7, 6, drillMat);
voxel(3, 3, 2, 0, 7, 8, drillMat);
voxel(2, 2, 2, 0, 7, 10, drillMat);
// Large digging claws
voxel(3, 4, 2, -6, 5, 6, lightMat);
voxel(3, 4, 2, 6, 5, 6, lightMat);
voxel(2, 3, 2, -7, 5, 8, lightMat);
voxel(2, 3, 2, 7, 5, 8, lightMat);
// Armored back plates
voxel(10, 2, 2, 0, 14, -5, darkMat);
voxel(8, 2, 2, 0, 12, -6, darkMat);
// Small eyes (underground adapted)
voxel(2, 1.5, 1, -3, 10, 4.5, eyePupilMat);
voxel(2, 1.5, 1, 3, 10, 4.5, eyePupilMat);
// Tail fin
voxel(6, 4, 2, 0, 6, -6, darkMat);
voxel(4, 6, 1, 0, 6, -7, lightMat);
// Side armor ridges
voxel(2, 8, 1, -7, 8, 0, lightMat);
voxel(2, 8, 1, 7, 8, 0, lightMat);
```

### 1.6 Spawner Enemy (lines 2544-2555)
**Current**: Bulky body, side pods, small eyes
**Enhancements**:
- Add spawning tube/portal on top
- Add more detailed side pods with openings
- Add birthing sac underneath
- Add ritual markings (glowing)
- Add tentacle-like appendages
- Add crown-like growth on head

**Precise edits** (add after line 2555, before `break;`):
```javascript
// Spawning tube on top
const tubeMat = new THREE.MeshStandardMaterial({ color: 0x9933ff, roughness: 0.3, metalness: 0.2, emissive: 0x6600cc, emissiveIntensity: 0.3 });
voxel(4, 6, 4, 0, 23, 0, tubeMat);
voxel(5, 2, 5, 0, 27, 0, tubeMat);
// Glowing portal ring
const portalMat = new THREE.MeshStandardMaterial({ color: 0xcc66ff, roughness: 0.1, metalness: 0.5, emissive: 0xcc66ff, emissiveIntensity: 0.5 });
voxel(6, 1, 1, 0, 28, 2.5, portalMat);
voxel(6, 1, 1, 0, 28, -2.5, portalMat);
voxel(1, 1, 6, 2.5, 28, 0, portalMat);
voxel(1, 1, 6, -2.5, 28, 0, portalMat);
// Detailed side pods with openings
voxel(5, 4, 5, -4, 3, 3, darkMat);
voxel(5, 4, 5, 4, 3, 3, darkMat);
// Pod openings (glowing)
voxel(3, 3, 1, -4, 3, 5.5, portalMat);
voxel(3, 3, 1, 4, 3, 5.5, portalMat);
// Birthing sac underneath
const sacMat = new THREE.MeshStandardMaterial({ color: 0x8844aa, roughness: 0.6, metalness: 0.0, transparent: true, opacity: 0.7 });
voxel(6, 3, 4, 0, -1, 2, sacMat);
// Ritual markings (glowing lines on body)
voxel(8, 1, 1, 0, 12, 5.5, portalMat);
voxel(1, 1, 8, 5.5, 12, 0, portalMat);
voxel(1, 1, 8, -5.5, 12, 0, portalMat);
// Tentacle appendages
voxel(2, 6, 2, -6, 6, -3, darkMat);
voxel(2, 4, 2, -7, 3, -5, darkMat);
voxel(2, 6, 2, 6, 6, -3, darkMat);
voxel(2, 4, 2, 7, 3, -5, darkMat);
// Crown-like growth
voxel(3, 2, 3, -3, 21, -2, lightMat);
voxel(3, 2, 3, 3, 21, -2, lightMat);
voxel(3, 3, 3, 0, 22, -3, lightMat);
```

### 1.7 Boss Enemy (lines 2557-2579)
**Current**: Largest, glowing red eyes, fangs, horns, crown
**Enhancements**:
- Add massive shoulder pauldrons with spikes
- Add armored gauntlets
- Add a throne-like back structure
- Add chest core (glowing weak point)
- Add leg armor plates
- Add cape-like back piece
- Add crown jewel details
- Add arm bands
- Add waist armor
- Add ground-stomp feet

**Precise edits** (add after line 2579, before `break;`):
```javascript
// Massive shoulder pauldrons
const pauldronMat = new THREE.MeshStandardMaterial({ color: 0x660000, roughness: 0.4, metalness: 0.6 });
voxel(8, 6, 6, -11, 20, 0, pauldronMat);
voxel(8, 6, 6, 11, 20, 0, pauldronMat);
// Pauldron spikes
voxel(2, 5, 2, -13, 24, 0, lightMat);
voxel(2, 5, 2, -9, 24, 0, lightMat);
voxel(2, 5, 2, 9, 24, 0, lightMat);
voxel(2, 5, 2, 13, 24, 0, lightMat);
// Armored gauntlets
voxel(5, 6, 5, -9, 10, 3, pauldronMat);
voxel(5, 6, 5, 9, 10, 3, pauldronMat);
// Gauntlet spikes
voxel(2, 3, 2, -10, 14, 4, lightMat);
voxel(2, 3, 2, 10, 14, 4, lightMat);
// Throne-like back structure
const throneMat = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.5, metalness: 0.4 });
voxel(12, 16, 3, 0, 18, -7, throneMat);
// Throne back spikes
voxel(2, 4, 2, -5, 27, -7, lightMat);
voxel(2, 4, 2, 0, 28, -7, lightMat);
voxel(2, 4, 2, 5, 27, -7, lightMat);
// Glowing chest core (weak point)
const coreMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, metalness: 0.8, emissive: 0xff0000, emissiveIntensity: 0.7 });
voxel(6, 6, 2, 0, 14, 7.5, coreMat);
// Core ring
voxel(7, 1, 1, 0, 17, 8, lightMat);
voxel(7, 1, 1, 0, 11, 8, lightMat);
voxel(1, 7, 1, 3.5, 14, 8, lightMat);
voxel(1, 7, 1, -3.5, 14, 8, lightMat);
// Leg armor plates
voxel(6, 8, 6, -5, 4, 3, pauldronMat);
voxel(6, 8, 6, 5, 4, 3, pauldronMat);
// Knee spikes
voxel(2, 3, 2, -5, 8, 5, lightMat);
voxel(2, 3, 2, 5, 8, 5, lightMat);
// Ground-stomp feet
voxel(8, 4, 8, -5, 0, 3, darkMat);
voxel(8, 4, 8, 5, 0, 3, darkMat);
// Foot spikes
voxel(2, 2, 2, -7, 1, 5, lightMat);
voxel(2, 2, 2, -3, 1, 5, lightMat);
voxel(2, 2, 2, 3, 1, 5, lightMat);
voxel(2, 2, 2, 7, 1, 5, lightMat);
// Cape-like back piece
const capeMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.8, metalness: 0.1 });
voxel(14, 12, 2, 0, 14, -5, capeMat);
voxel(12, 10, 2, 0, 10, -6, capeMat);
voxel(10, 8, 2, 0, 6, -7, capeMat);
// Cape tattered bottom
voxel(3, 4, 2, -5, 2, -7, capeMat);
voxel(3, 5, 2, 0, 1, -7, capeMat);
voxel(3, 3, 2, 5, 3, -7, capeMat);
// Crown jewel details
const crownJewelMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, metalness: 0.9, emissive: 0xff0000, emissiveIntensity: 0.8 });
voxel(3, 3, 3, 0, 32, 0, crownJewelMat);
voxel(2, 2, 2, -4, 30, 0, crownJewelMat);
voxel(2, 2, 2, 4, 30, 0, crownJewelMat);
// Arm bands
const armBandMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
voxel(4, 2, 4, -8, 14, 0, armBandMat);
voxel(4, 2, 4, 8, 14, 0, armBandMat);
// Waist armor
voxel(12, 4, 5, 0, 6, 2, pauldronMat);
// Waist belt buckle
voxel(4, 3, 1, 0, 6, 5, armBandMat);
```

### 1.8 Enemy Glow Enhancement
**Current**: Simple sphere glow (line 2651-2656)
**Enhancement**: Add pulsing animation data and type-specific glow effects

**Replace lines 2651-2656 with**:
```javascript
            const glowGeo = new THREE.SphereGeometry(12 * size, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.15 + Math.random() * 0.1 });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.position.copy(enemy.position);
            glowMesh.userData = { isEnemyGlow: true, phase: Math.random() * Math.PI * 2, baseOpacity: 0.15 };
            scene.add(glowMesh);
            enemy.glowMesh = glowMesh;
```

### 1.9 Stealth Mole Enemy
**Current**: Not present
**Enhancements**:
- Semi-transparent body with shimmer effect
- Distorted outline voxels (slightly offset, lower opacity)
- Glowing eye slits (narrow, intense)
- Cloak-like ragged edges
- Smoke/mist trail voxels at base
- Phase-shift crystal on back (flickering)

**Precise edits** (add in enemy switch case, before default):
```javascript
case 'STEALTH': {
    const stealthMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.6 });
    const shimmerMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.3 });
    const eyeGlowMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.1, metalness: 0.8, emissive: 0x00ffcc, emissiveIntensity: 0.7 });
    const mistMat = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.5, metalness: 0.0, transparent: true, opacity: 0.25 });
    // Semi-transparent body
    voxel(8, 10, 8, 0, 9, 0, stealthMat);
    voxel(7, 8, 7, 0, 8, 0, stealthMat);
    // Shimmer outline (offset)
    voxel(9, 11, 9, 0.5, 9.5, 0.5, shimmerMat);
    voxel(9, 11, 9, -0.5, 9.5, -0.5, shimmerMat);
    // Glowing eye slits
    voxel(3, 1, 1, -2, 11, 4, eyeGlowMat);
    voxel(3, 1, 1, 2, 11, 4, eyeGlowMat);
    // Cloak ragged edges
    voxel(2, 6, 1, -5, 6, -3, stealthMat);
    voxel(2, 5, 1, 5, 7, -3, stealthMat);
    voxel(1, 4, 1, -6, 5, -2, stealthMat);
    voxel(1, 4, 1, 6, 5, -2, stealthMat);
    // Mist trail at base
    voxel(6, 2, 6, 0, 2, 0, mistMat);
    voxel(4, 1, 4, 0, 1, 2, mistMat);
    // Phase-shift crystal on back
    const phaseMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.1, metalness: 0.7, emissive: 0x00ffcc, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 });
    voxel(3, 4, 2, 0, 12, -4, phaseMat);
    voxel(2, 3, 1, 0, 14, -5, phaseMat);
    // Small claws
    voxel(1, 2, 2, -3, 5, 5, darkMat);
    voxel(1, 2, 2, 3, 5, 5, darkMat);
    // Feet
    voxel(3, 2, 3, -2, 0, 1, darkMat);
    voxel(3, 2, 3, 2, 0, 1, darkMat);
    break;
}
```

### 1.10 Shielded Mole Enemy
**Current**: Not present
**Enhancements**:
- Visible shield generator on back (glowing orb)
- Hexagonal shield panels (translucent, in front)
- Reinforced chest plate
- Shield emitter arm band
- Energy conduit lines on body
- Shield bubble outline (faint sphere)

**Precise edits** (add in enemy switch case):
```javascript
case 'SHIELDED': {
    const shieldGenMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.2, metalness: 0.6, emissive: 0x4488ff, emissiveIntensity: 0.5 });
    const shieldPanelMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35 });
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x88bbff, roughness: 0.2, metalness: 0.5, emissive: 0x88bbff, emissiveIntensity: 0.3 });
    const armorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7).getHex(), roughness: 0.5, metalness: 0.4 });
    // Main body
    voxel(8, 10, 8, 0, 9, 0, darkMat);
    voxel(7, 8, 7, 0, 8, 0, darkMat);
    // Reinforced chest plate
    voxel(6, 6, 2, 0, 9, 4.5, armorMat);
    voxel(4, 4, 1, 0, 9, 5.5, lightMat);
    // Shield generator on back
    voxel(4, 4, 3, 0, 10, -4, shieldGenMat);
    voxel(3, 3, 2, 0, 12, -5, shieldGenMat);
    // Shield emitter arm band
    voxel(3, 2, 3, -5, 10, 0, shieldGenMat);
    voxel(3, 2, 3, 5, 10, 0, shieldGenMat);
    // Energy conduit lines
    voxel(1, 8, 1, -3, 9, 3, conduitMat);
    voxel(1, 8, 1, 3, 9, 3, conduitMat);
    voxel(1, 6, 1, -4, 8, 2, conduitMat);
    voxel(1, 6, 1, 4, 8, 2, conduitMat);
    // Hexagonal shield panels (front)
    voxel(5, 5, 1, -3, 10, 6, shieldPanelMat);
    voxel(5, 5, 1, 3, 10, 6, shieldPanelMat);
    voxel(5, 5, 1, 0, 6, 6, shieldPanelMat);
    // Shield bubble outline (faint)
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.12 });
    voxel(12, 14, 1, 0, 10, 7, bubbleMat);
    voxel(12, 14, 1, 0, 10, -7, bubbleMat);
    voxel(1, 14, 14, 6, 10, 0, bubbleMat);
    voxel(1, 14, 14, -6, 10, 0, bubbleMat);
    // Eyes
    voxel(2, 2, 1, -2, 11, 4, eyeMat);
    voxel(2, 2, 1, 2, 11, 4, eyeMat);
    // Feet
    voxel(3, 2, 3, -2, 0, 1, darkMat);
    voxel(3, 2, 3, 2, 0, 1, darkMat);
    break;
}
```

### 1.11 Swarm Mole Enemy
**Current**: Not present
**Enhancements**:
- Tiny body (half size of basic)
- Oversized claws relative to body
- Glowing hive-mark on forehead
- Rapid movement blur trail
- Cluster grouping indicator (faint link to nearby swarm)
- Exoskeleton plate detail

**Precise edits** (add in enemy switch case):
```javascript
case 'SWARM': {
    const exoMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8).getHex(), roughness: 0.6, metalness: 0.2 });
    const hiveMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.2, metalness: 0.5, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const blurMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.0, transparent: true, opacity: 0.2 });
    // Tiny body (half scale)
    voxel(4, 5, 4, 0, 5, 0, darkMat);
    voxel(3, 4, 3, 0, 4, 0, darkMat);
    // Exoskeleton plates
    voxel(5, 2, 5, 0, 7, 0, exoMat);
    voxel(5, 1, 5, 0, 3, 0, exoMat);
    // Oversized claws
    voxel(2, 3, 3, -3, 4, 4, lightMat);
    voxel(2, 3, 3, 3, 4, 4, lightMat);
    voxel(1, 2, 2, -4, 3, 5, lightMat);
    voxel(1, 2, 2, 4, 3, 5, lightMat);
    // Hive mark on forehead
    voxel(2, 2, 1, 0, 6, 3, hiveMat);
    // Eyes (small, beady)
    voxel(1.5, 1.5, 1, -1.5, 6, 2.5, eyeMat);
    voxel(1.5, 1.5, 1, 1.5, 6, 2.5, eyeMat);
    // Movement blur trail
    voxel(3, 4, 2, 0, 5, -3, blurMat);
    voxel(2, 3, 2, 0, 5, -5, blurMat);
    // Tiny feet
    voxel(2, 1, 2, -1, 0, 1, darkMat);
    voxel(2, 1, 2, 1, 0, 1, darkMat);
    // Antennae
    voxel(1, 3, 1, -1, 8, 1, darkMat);
    voxel(1, 3, 1, 1, 8, 1, darkMat);
    voxel(1, 1, 1, -1.5, 9.5, 1.5, lightMat);
    voxel(1, 1, 1, 1.5, 9.5, 1.5, lightMat);
    break;
}
```

### 1.12 Splitting Mole Enemy
**Current**: Not present
**Enhancements**:
- Bulging body (looks like it will split)
- Crack lines across body (glowing)
- Core nucleus visible (pulsing)
- Membrane-like outer layer
- Split preparation glow (intensifies before death)
- Two smaller mole silhouettes inside (faint)

**Precise edits** (add in enemy switch case):
```javascript
case 'SPLITTING': {
    const membraneMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.75 });
    const crackMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.1, metalness: 0.6, emissive: 0xff6600, emissiveIntensity: 0.5 });
    const nucleusMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.1, metalness: 0.7, emissive: 0xff4444, emissiveIntensity: 0.6 });
    const innerMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(1.3).getHex(), roughness: 0.5, metalness: 0.0, transparent: true, opacity: 0.4 });
    // Bulging body
    voxel(9, 10, 9, 0, 9, 0, membraneMat);
    voxel(10, 8, 10, 0, 8, 0, membraneMat);
    // Crack lines (vertical)
    voxel(1, 8, 1, 0, 9, 4.5, crackMat);
    voxel(1, 6, 1, 0, 7, 5, crackMat);
    // Crack lines (horizontal)
    voxel(4, 1, 1, 0, 12, 4.5, crackMat);
    voxel(4, 1, 1, 0, 6, 4.5, crackMat);
    // Core nucleus (center)
    voxel(4, 4, 4, 0, 9, 0, nucleusMat);
    voxel(3, 3, 3, 0, 9, 0, nucleusMat);
    // Inner mole silhouettes (faint)
    voxel(4, 5, 3, -2, 8, -1, innerMat);
    voxel(4, 5, 3, 2, 8, -1, innerMat);
    // Eyes
    voxel(2, 2, 1, -2, 11, 4.5, eyeMat);
    voxel(2, 2, 1, 2, 11, 4.5, eyeMat);
    // Claws
    voxel(2, 3, 2, -4, 6, 5, lightMat);
    voxel(2, 3, 2, 4, 6, 5, lightMat);
    // Feet
    voxel(3, 2, 3, -2, 0, 1, darkMat);
    voxel(3, 2, 3, 2, 0, 1, darkMat);
    // Membrane ripples
    voxel(1, 6, 1, -5, 8, 0, membraneMat);
    voxel(1, 6, 1, 5, 8, 0, membraneMat);
    break;
}
```

### 1.13 Elemental Mole Variants
**Current**: Not present
**Enhancements**: Three sub-types (Fire, Ice, Poison) with particle effects

**Fire Mole**:
```javascript
case 'ELEMENTAL_FIRE': {
    const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.3, metalness: 0.4, emissive: 0xff4400, emissiveIntensity: 0.3 });
    const flameMat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.2, metalness: 0.2, emissive: 0xff6600, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    const ashMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.0 });
    // Charred body
    voxel(8, 10, 8, 0, 9, 0, ashMat);
    voxel(7, 8, 7, 0, 8, 0, ashMat);
    // Ember cracks on body
    voxel(1, 4, 1, -2, 9, 4, emberMat);
    voxel(1, 4, 1, 2, 9, 4, emberMat);
    voxel(1, 3, 1, 0, 7, 4.5, emberMat);
    // Flame on head
    voxel(4, 5, 3, 0, 15, 0, flameMat);
    voxel(3, 4, 2, 0, 17, 0, flameMat);
    voxel(2, 3, 2, 0, 19, 0, flameMat);
    // Glowing eyes
    voxel(2, 2, 1, -2, 11, 4, emberMat);
    voxel(2, 2, 1, 2, 11, 4, emberMat);
    // Smoke trail
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.2 });
    voxel(4, 3, 4, 0, 3, -2, smokeMat);
    voxel(3, 2, 3, 0, 2, -4, smokeMat);
    // Claws (heated, glowing)
    voxel(2, 3, 2, -3, 5, 5, emberMat);
    voxel(2, 3, 2, 3, 5, 5, emberMat);
    // Feet
    voxel(3, 2, 3, -2, 0, 1, ashMat);
    voxel(3, 2, 3, 2, 0, 1, ashMat);
    break;
}
```

**Ice Mole**:
```javascript
case 'ELEMENTAL_ICE': {
    const frostMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.5, emissive: 0x88ccff, emissiveIntensity: 0.2 });
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.6 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0 });
    // Frozen body
    voxel(8, 10, 8, 0, 9, 0, darkMat);
    // Ice crust overlay
    voxel(9, 11, 9, 0, 9.5, 0, iceMat);
    // Frost spikes on back
    voxel(2, 5, 2, -2, 14, -3, frostMat);
    voxel(2, 5, 2, 2, 14, -3, frostMat);
    voxel(2, 4, 2, 0, 13, -4, frostMat);
    // Snow cap on head
    voxel(6, 2, 6, 0, 14, 0, snowMat);
    voxel(4, 1, 4, 0, 15, 0, snowMat);
    // Glacial eyes
    voxel(2, 2, 1, -2, 11, 4, frostMat);
    voxel(2, 2, 1, 2, 11, 4, frostMat);
    // Icicle claws
    voxel(1, 4, 2, -3, 5, 5, iceMat);
    voxel(1, 4, 2, 3, 5, 5, iceMat);
    // Frozen feet
    voxel(3, 2, 3, -2, 0, 1, frostMat);
    voxel(3, 2, 3, 2, 0, 1, frostMat);
    // Frost aura ring
    const auraMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.15 });
    voxel(12, 1, 12, 0, 1, 0, auraMat);
    break;
}
```

**Poison Mole**:
```javascript
case 'ELEMENTAL_POISON': {
    const toxinMat = new THREE.MeshStandardMaterial({ color: 0x44ff44, roughness: 0.2, metalness: 0.3, emissive: 0x44ff44, emissiveIntensity: 0.4 });
    const slimeMat = new THREE.MeshStandardMaterial({ color: 0x66cc44, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.5 });
    const blisterMat = new THREE.MeshStandardMaterial({ color: 0x88ff66, roughness: 0.1, metalness: 0.4, emissive: 0x88ff66, emissiveIntensity: 0.3 });
    // Diseased body
    voxel(8, 10, 8, 0, 9, 0, darkMat);
    // Slime coating
    voxel(9, 10, 9, 0, 9, 0.5, slimeMat);
    // Toxic blisters
    voxel(2, 2, 1, -3, 10, 4.5, blisterMat);
    voxel(2, 2, 1, 3, 10, 4.5, blisterMat);
    voxel(2, 2, 1, 0, 8, 5, blisterMat);
    voxel(2, 2, 1, -2, 6, 4.5, blisterMat);
    voxel(2, 2, 1, 2, 6, 4.5, blisterMat);
    // Dripping slime
    voxel(1, 3, 1, -2, 3, 3, slimeMat);
    voxel(1, 2, 1, 3, 4, 3, slimeMat);
    // Sickly eyes
    voxel(2, 2, 1, -2, 11, 4, toxinMat);
    voxel(2, 2, 1, 2, 11, 4, toxinMat);
    // Toxic claws
    voxel(2, 3, 2, -3, 5, 5, toxinMat);
    voxel(2, 3, 2, 3, 5, 5, toxinMat);
    // Feet
    voxel(3, 2, 3, -2, 0, 1, darkMat);
    voxel(3, 2, 3, 2, 0, 1, darkMat);
    // Poison puddle underneath
    voxel(8, 0.5, 8, 0, 0.5, 0, slimeMat);
    break;
}
```

### 1.14 Siege Mole Enemy
**Current**: Not present
**Enhancements**:
- Heavy battering ram attachment on front
- Reinforced armor plating all over
- Siege tower-like structure on back
- Heavy reinforced feet
- War paint markings
- Ram head (metal, spiked)

**Precise edits** (add in enemy switch case):
```javascript
case 'SIEGE': {
    const plateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.6).getHex(), roughness: 0.5, metalness: 0.5 });
    const ramMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 });
    const warPaintMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.4, metalness: 0.1, emissive: 0xff3333, emissiveIntensity: 0.2 });
    // Heavily armored body
    voxel(10, 12, 10, 0, 10, 0, plateMat);
    voxel(9, 10, 9, 0, 9, 0, darkMat);
    // Armor plate seams
    voxel(1, 10, 1, -5, 10, 4, lightMat);
    voxel(1, 10, 1, 5, 10, 4, lightMat);
    voxel(1, 10, 1, -5, 10, -4, lightMat);
    voxel(1, 10, 1, 5, 10, -4, lightMat);
    // Battering ram on front
    voxel(4, 4, 10, 0, 8, 8, ramMat);
    voxel(3, 3, 8, 0, 8, 11, ramMat);
    // Ram head (spiked)
    voxel(5, 5, 3, 0, 8, 14, ramMat);
    voxel(2, 2, 2, -2, 10, 15, lightMat);
    voxel(2, 2, 2, 2, 10, 15, lightMat);
    voxel(2, 2, 2, 0, 6, 15, lightMat);
    // Siege tower on back
    voxel(6, 8, 4, 0, 14, -4, plateMat);
    voxel(7, 2, 5, 0, 18, -4, plateMat);
    // War paint markings
    voxel(3, 1, 1, 0, 12, 5.5, warPaintMat);
    voxel(1, 4, 1, -4, 10, 5, warPaintMat);
    voxel(1, 4, 1, 4, 10, 5, warPaintMat);
    // Heavy reinforced feet
    voxel(4, 3, 4, -3, 0, 2, ramMat);
    voxel(4, 3, 4, 3, 0, 2, ramMat);
    // Foot spikes
    voxel(1, 1, 1, -4, 0, 4, lightMat);
    voxel(1, 1, 1, -2, 0, 4, lightMat);
    voxel(1, 1, 1, 2, 0, 4, lightMat);
    voxel(1, 1, 1, 4, 0, 4, lightMat);
    // Eyes (narrow, determined)
    voxel(2, 1.5, 1, -2, 11, 5, eyeMat);
    voxel(2, 1.5, 1, 2, 11, 5, eyeMat);
    break;
}
```

### 1.15 Healer/Support Mole Enemy
**Current**: Not present
**Enhancements**:
- Healing staff/totem carried
- Aura ring on ground (glowing)
- Robe-like draping
- Gentle/soothing eye color
- Healing crystal pendant
- Support symbol on chest (cross/plus)

**Precise edits** (add in enemy switch case):
```javascript
case 'HEALER': {
    const robeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8).getHex(), roughness: 0.7, metalness: 0.0 });
    const healAuraMat = new THREE.MeshStandardMaterial({ color: 0x44ff88, roughness: 0.1, metalness: 0.3, emissive: 0x44ff88, emissiveIntensity: 0.4, transparent: true, opacity: 0.3 });
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6, metalness: 0.1 });
    const healCrystalMat = new THREE.MeshStandardMaterial({ color: 0x88ffaa, roughness: 0.1, metalness: 0.6, emissive: 0x88ffaa, emissiveIntensity: 0.6 });
    const symbolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.3 });
    // Robed body
    voxel(8, 10, 8, 0, 9, 0, darkMat);
    // Robe draping
    voxel(9, 8, 9, 0, 6, 0, robeMat);
    voxel(10, 4, 10, 0, 3, 0, robeMat);
    // Robe hem
    voxel(11, 1, 11, 0, 1, 0, robeMat);
    // Healing staff
    voxel(2, 14, 2, 5, 10, 2, staffMat);
    // Staff crystal
    voxel(3, 3, 3, 5, 17, 2, healCrystalMat);
    voxel(2, 2, 2, 5, 19, 2, healCrystalMat);
    // Aura ring on ground
    voxel(14, 1, 1, 0, 0.5, 7, healAuraMat);
    voxel(14, 1, 1, 0, 0.5, -7, healAuraMat);
    voxel(1, 1, 14, 7, 0.5, 0, healAuraMat);
    voxel(1, 1, 14, -7, 0.5, 0, healAuraMat);
    // Healing symbol on chest (plus)
    voxel(3, 1, 1, 0, 10, 4.5, symbolMat);
    voxel(1, 3, 1, 0, 10, 4.5, symbolMat);
    // Crystal pendant
    voxel(2, 2, 1, 0, 8, 5, healCrystalMat);
    // Gentle eyes
    voxel(2, 2, 1, -2, 11, 4, healAuraMat);
    voxel(2, 2, 1, 2, 11, 4, healAuraMat);
    // Hood
    voxel(9, 2, 8, 0, 14, 0, robeMat);
    voxel(7, 2, 7, 0, 15, -1, robeMat);
    // Feet (hidden by robe)
    voxel(2, 1, 2, -2, 0, 1, darkMat);
    voxel(2, 1, 2, 2, 0, 1, darkMat);
    break;
}
```

### 1.16 Elite/Champion Mole Variants
**Current**: Not present
**Enhancements**: Upgraded versions of base types with gold trim, larger size, crown/helmet

**Elite Basic** (enhanced basic mole):
```javascript
case 'ELITE_BASIC': {
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
    const eliteMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7).getHex(), roughness: 0.4, metalness: 0.3 });
    // Larger body (1.3x basic)
    voxel(10, 13, 10, 0, 11, 0, eliteMat);
    voxel(9, 11, 9, 0, 10, 0, eliteMat);
    // Gold trim on body edges
    voxel(11, 1, 11, 0, 17, 0, goldTrimMat);
    voxel(11, 1, 11, 0, 5, 0, goldTrimMat);
    // Champion helmet
    voxel(10, 4, 10, 0, 18, 0, eliteMat);
    voxel(11, 2, 11, 0, 20, 0, goldTrimMat);
    // Helmet crest
    voxel(2, 4, 1, 0, 21, 0, goldTrimMat);
    // Gold-trimmed arms
    voxel(3, 7, 3, -7, 10, 0, eliteMat);
    voxel(3, 7, 3, 7, 10, 0, eliteMat);
    voxel(3, 1, 3, -7, 6, 0, goldTrimMat);
    voxel(3, 1, 3, 7, 6, 0, goldTrimMat);
    // Gold-trimmed legs
    voxel(4, 3, 4, -3, 2, 2, eliteMat);
    voxel(4, 3, 4, 3, 2, 2, eliteMat);
    voxel(4, 1, 4, -3, 0, 2, goldTrimMat);
    voxel(4, 1, 4, 3, 0, 2, goldTrimMat);
    // Elite eyes (gold-tinted)
    voxel(2.5, 2.5, 1, -2.5, 13, 5, goldTrimMat);
    voxel(2.5, 2.5, 1, 2.5, 13, 5, goldTrimMat);
    // Chest medal
    voxel(3, 3, 1, 0, 11, 5.5, goldTrimMat);
    break;
}
```

---

## 2. VISUAL EFFECTS SYSTEMS

### 2.1 Death Animations
**Add to enemy death handler**:

**Explosion Death** (for Boss, Siege, Elemental Fire):
```javascript
function playDeathExplosion(position, color, size) {
    const particleCount = 20 + Math.floor(size * 10);
    for (let i = 0; i < particleCount; i++) {
        const pSize = 1 + Math.random() * 2;
        const pGeo = new THREE.BoxGeometry(pSize, pSize, pSize);
        const pMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? color : 0xff4400,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(pGeo, pMat);
        particle.position.copy(position);
        particle.position.y += size * 5;
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                2 + Math.random() * 4,
                (Math.random() - 0.5) * 4
            ),
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02
        };
        scene.add(particle);
        deathParticles.push(particle);
    }
}
```

**Dissolve Death** (for Stealth, Splitting):
```javascript
function playDeathDissolve(enemy) {
    enemy.userData.isDissolving = true;
    enemy.userData.dissolveProgress = 0;
    enemy.userData.dissolveSpeed = 0.02;
}
// In update loop:
if (enemy.userData.isDissolving) {
    enemy.userData.dissolveProgress += enemy.userData.dissolveSpeed;
    enemy.material.opacity = 1 - enemy.userData.dissolveProgress;
    enemy.scale.setScalar(1 + enemy.userData.dissolveProgress * 0.3);
    if (enemy.userData.dissolveProgress >= 1) {
        scene.remove(enemy);
    }
}
```

**Collapse Death** (for Tank, Elite, Shielded):
```javascript
function playDeathCollapse(enemy) {
    enemy.userData.isCollapsing = true;
    enemy.userData.collapseProgress = 0;
}
// In update loop:
if (enemy.userData.isCollapsing) {
    enemy.userData.collapseProgress += 0.03;
    enemy.rotation.x = enemy.userData.collapseProgress * Math.PI / 2;
    enemy.position.y -= enemy.userData.collapseProgress * 0.5;
    enemy.scale.y = 1 - enemy.userData.collapseProgress * 0.5;
    if (enemy.userData.collapseProgress >= 1) {
        scene.remove(enemy);
    }
}
```

### 2.2 Damage State Visuals
**Add to enemy damage handler**:
```javascript
function applyDamageVisuals(enemy, damagePercent) {
    if (damagePercent > 0.25 && !enemy.userData.hasCracks) {
        // Add crack voxels
        const crackMat = new THREE.MeshStandardMaterial({ color: 0xff6644, emissive: 0xff4422, emissiveIntensity: 0.3 });
        for (let i = 0; i < 3; i++) {
            const crack = new THREE.Mesh(new THREE.BoxGeometry(1, 2 + Math.random() * 2, 0.5), crackMat);
            crack.position.set(
                (Math.random() - 0.5) * 6,
                5 + Math.random() * 8,
                4.5
            );
            enemy.add(crack);
        }
        enemy.userData.hasCracks = true;
    }
    if (damagePercent > 0.5 && !enemy.userData.hasSmoke) {
        // Add smoke voxels
        const smokeMat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.4 });
        for (let i = 0; i < 4; i++) {
            const smoke = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), smokeMat);
            smoke.position.set(
                (Math.random() - 0.5) * 4,
                12 + Math.random() * 4,
                (Math.random() - 0.5) * 4
            );
            smoke.userData.isSmoke = true;
            smoke.userData.phase = Math.random() * Math.PI * 2;
            enemy.add(smoke);
        }
        enemy.userData.hasSmoke = true;
    }
    if (damagePercent > 0.75 && !enemy.userData.hasGlow) {
        // Add internal glow (critical damage)
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8, transparent: true, opacity: 0.5 });
        const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), glowMat);
        coreGlow.position.set(0, 8, 0);
        coreGlow.userData.isCoreGlow = true;
        enemy.add(coreGlow);
        enemy.userData.hasCoreGlow = true;
    }
}
```

### 2.3 Status Effect Indicators
**Add to enemy update loop**:
```javascript
function applyStatusVisuals(enemy) {
    // Burning
    if (enemy.status === 'BURNING') {
        if (!enemy.userData.burningVisual) {
            const flameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
            for (let i = 0; i < 5; i++) {
                const flame = new THREE.Mesh(new THREE.BoxGeometry(1 + Math.random(), 2 + Math.random() * 2, 1), flameMat);
                flame.position.set((Math.random() - 0.5) * 6, 12 + Math.random() * 4, (Math.random() - 0.5) * 6);
                flame.userData.isFlame = true;
                flame.userData.phase = Math.random() * Math.PI * 2;
                enemy.add(flame);
            }
            enemy.userData.burningVisual = true;
        }
    }
    // Frozen
    if (enemy.status === 'FROZEN') {
        if (!enemy.userData.frozenVisual) {
            const iceMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.6 });
            const iceShell = new THREE.Mesh(new THREE.BoxGeometry(12, 16, 12), iceMat);
            iceShell.position.y = 8;
            enemy.add(iceShell);
            enemy.userData.frozenVisual = iceShell;
        }
    }
    // Poisoned
    if (enemy.status === 'POISONED') {
        if (!enemy.userData.poisonVisual) {
            const poisonMat = new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x44ff44, emissiveIntensity: 0.3, transparent: true, opacity: 0.4 });
            for (let i = 0; i < 3; i++) {
                const bubble = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), poisonMat);
                bubble.position.set((Math.random() - 0.5) * 4, 10 + Math.random() * 6, 4);
                bubble.userData.isPoisonBubble = true;
                bubble.userData.phase = Math.random() * Math.PI * 2;
                enemy.add(bubble);
            }
            enemy.userData.poisonVisual = true;
        }
    }
    // Slowed
    if (enemy.status === 'SLOWED') {
        if (!enemy.userData.slowVisual) {
            const slowMat = new THREE.MeshStandardMaterial({ color: 0x6688ff, transparent: true, opacity: 0.2 });
            const slowRing = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), slowMat);
            slowRing.position.y = 1;
            enemy.add(slowRing);
            enemy.userData.slowVisual = slowRing;
        }
    }
}
```

### 2.4 Projectile Enhancements
**Add to projectile creation**:
```javascript
function createEnhancedProjectile(type, startPos, targetPos) {
    const projGroup = new THREE.Group();
    projGroup.position.copy(startPos);

    // Core projectile
    const coreGeo = new THREE.BoxGeometry(2, 2, 2);
    let coreMat;
    switch (type) {
        case 'BASIC':
            coreMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
            break;
        case 'SNIPER':
            coreMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.7 });
            break;
        case 'CANNON':
            coreMat = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0xff4400, emissiveIntensity: 0.3 });
            break;
        case 'SLOW':
            coreMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, emissive: 0x66aaff, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
            break;
        case 'TRAP':
            coreMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.4 });
            break;
    }
    const core = new THREE.Mesh(coreGeo, coreMat);
    projGroup.add(core);

    // Trail particles
    const trailMat = coreMat.clone();
    trailMat.transparent = true;
    trailMat.opacity = 0.4;
    for (let i = 0; i < 5; i++) {
        const trail = new THREE.Mesh(new THREE.BoxGeometry(1.5 - i * 0.2, 1.5 - i * 0.2, 1.5 - i * 0.2), trailMat);
        trail.position.z = -i * 2;
        trail.userData.isTrail = true;
        trail.userData.trailIndex = i;
        projGroup.add(trail);
    }

    // Muzzle flash (initial)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), flashMat);
    flash.userData.isMuzzleFlash = true;
    flash.userData.life = 1.0;
    projGroup.add(flash);

    projGroup.userData = { type, target: targetPos, speed: type === 'SNIPER' ? 2 : 1 };
    return projGroup;
}
```

### 2.5 Hit/Impact Effects
**Add to projectile hit handler**:
```javascript
function createImpactEffect(position, type) {
    const impactGroup = new THREE.Group();
    impactGroup.position.copy(position);

    switch (type) {
        case 'BASIC':
            // Spark burst
            for (let i = 0; i < 8; i++) {
                const spark = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.6, transparent: true, opacity: 1 })
                );
                spark.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 3
                );
                spark.userData.life = 1.0;
                spark.userData.isSpark = true;
                impactGroup.add(spark);
            }
            break;
        case 'CANNON':
            // Explosion crater
            const craterMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
            const crater = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), craterMat);
            crater.position.y = -0.5;
            impactGroup.add(crater);
            // Smoke cloud
            for (let i = 0; i < 6; i++) {
                const smoke = new THREE.Mesh(
                    new THREE.BoxGeometry(3 + Math.random() * 2, 3 + Math.random() * 2, 3 + Math.random() * 2),
                    new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.5 })
                );
                smoke.position.set((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4);
                smoke.userData.isSmoke = true;
                smoke.userData.phase = Math.random() * Math.PI * 2;
                impactGroup.add(smoke);
            }
            break;
        case 'SLOW':
            // Ice crystal burst
            for (let i = 0; i < 10; i++) {
                const crystal = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 2, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x88ccff, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 })
                );
                crystal.position.set((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6);
                crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                crystal.userData.isCrystal = true;
                crystal.userData.phase = Math.random() * Math.PI * 2;
                impactGroup.add(crystal);
            }
            break;
    }

    impactGroup.userData.life = 1.0;
    impactGroup.userData.decay = 0.03;
    scene.add(impactGroup);
    impactEffects.push(impactGroup);
}
```

### 2.6 Turret Upgrade Visuals
**Add to turret upgrade function**:
```javascript
function applyUpgradeVisuals(turret, level) {
    switch (level) {
        case 2:
            // Add accent trim
            const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.7 });
            const trim = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 22), trimMat);
            trim.position.y = 15;
            turret.add(trim);
            break;
        case 3:
            // Add glowing runes
            const runeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
            for (let i = 0; i < 4; i++) {
                const rune = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), runeMat);
                const angle = (i / 4) * Math.PI * 2;
                rune.position.set(Math.cos(angle) * 12, 10, Math.sin(angle) * 12);
                rune.rotation.y = angle;
                turret.add(rune);
            }
            // Add crown/topper
            const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8, emissive: 0xffd700, emissiveIntensity: 0.3 });
            const crown = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), crownMat);
            crown.position.y = 20;
            turret.add(crown);
            break;
    }
}
```

### 2.7 Build/Destroy Animations
**Add to turret placement**:
```javascript
function playBuildAnimation(turret) {
    turret.scale.setScalar(0.01);
    turret.userData.isBuilding = true;
    turret.userData.buildProgress = 0;
}
// In update loop:
if (turret.userData.isBuilding) {
    turret.userData.buildProgress += 0.04;
    const t = turret.userData.buildProgress;
    // Bounce-in effect
    const scale = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    turret.scale.setScalar(scale * 1.1);
    if (t >= 1) {
        turret.scale.setScalar(1);
        turret.userData.isBuilding = false;
    }
}
```

### 2.8 Range Indicators
**Add to turret placement preview**:
```javascript
function showRangeIndicator(position, range) {
    const rangeMat = new THREE.MeshStandardMaterial({
        color: 0x44ff88,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const rangeRing = new THREE.Mesh(
        new THREE.BoxGeometry(range * 2, 0.5, range * 2),
        rangeMat
    );
    rangeRing.position.copy(position);
    rangeRing.position.y = 0.5;
    rangeRing.userData.isRangeIndicator = true;
    scene.add(rangeRing);
    return rangeRing;
}
```

### 2.9 Wave Incoming Markers
**Add to wave start**:
```javascript
function showWaveIncoming(waveNumber) {
    const warningGroup = new THREE.Group();
    // Flashing warning beacon at spawn point
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 4), beaconMat);
    beacon.position.set(spawnX, 4, spawnZ);
    beacon.userData.isWarningBeacon = true;
    beacon.userData.phase = 0;
    warningGroup.add(beacon);
    // Warning ring on ground
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), ringMat);
    ring.position.set(spawnX, 0.5, spawnZ);
    ring.userData.isWarningRing = true;
    warningGroup.add(ring);
    scene.add(warningGroup);
    return warningGroup;
}
```

---

## 3. TURRET ENHANCEMENTS

### 3.1 Basic Tower (lines 1365-1374)
**Current**: Stepped pyramid with barrel
**Enhancements**:
- Add base platform detail
- Add barrel muzzle
- Add targeting sensor (small glowing dot)
- Add ammo belt detail
- Add corner reinforcements
- Add barrel heat vent

**Precise edits** (replace lines 1365-1374):
```javascript
            if (typeKey === 'BASIC') {
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.6, metalness: 0.15 });
                const topMat = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.5, metalness: 0.2 });
                const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.4, metalness: 0.3 });
                const accentMat = new THREE.MeshStandardMaterial({ color: 0x5a6578, roughness: 0.5, metalness: 0.25 });
                // Stepped base
                voxel(30, 3, 30, 0, 1.5, 0, baseMat);
                voxel(28, 4, 28, 0, 5, 0, baseMat);
                voxel(24, 4, 24, 0, 9, 0, baseMat);
                voxel(20, 4, 20, 0, 13, 0, topMat);
                // Corner reinforcements
                voxel(3, 6, 3, -10, 10, -10, accentMat);
                voxel(3, 6, 3, 10, 10, -10, accentMat);
                voxel(3, 6, 3, -10, 10, 10, accentMat);
                voxel(3, 6, 3, 10, 10, 10, accentMat);
                // Barrel
                barrel = voxel(4, 4, 18, 12, 13, 0, barrelMat);
                // Muzzle brake
                voxel(5, 5, 3, 12, 13, 10, accentMat);
                // Muzzle hole
                voxel(2, 2, 1, 12, 13, 11.5, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.0 }));
                // Heat vent
                voxel(3, 1, 6, 12, 11, 4, accentMat);
                // Targeting sensor
                const sensorMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.2, metalness: 0.5, emissive: 0x00ff00, emissiveIntensity: 0.4 });
                voxel(2, 2, 1, 0, 15.5, 8, sensorMat);
                // Ammo belt detail
                voxel(16, 2, 2, 0, 9, 10, accentMat);
                head = meshGroup.children[meshGroup.children.length - 8];
```

### 2.2 Sniper Tower (lines 1375-1387)
**Current**: Tall tower with long barrel and red scope
**Enhancements**:
- Add tripod base legs
- Add barrel stabilizer
- Add scope mount detail
- Add wind sensor
- Add range finder
- Add bipod at barrel end

**Precise edits** (replace lines 1375-1387):
```javascript
            } else if (typeKey === 'SNIPER') {
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x553c9a, roughness: 0.5, metalness: 0.2 });
                const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6b46c1, roughness: 0.45, metalness: 0.25 });
                const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.3, metalness: 0.4 });
                const scopeMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e, roughness: 0.2, metalness: 0.5, emissive: 0xe53e3e, emissiveIntensity: 0.3 });
                const accentMat = new THREE.MeshStandardMaterial({ color: 0x7c5cbf, roughness: 0.4, metalness: 0.3 });
                // Base platform
                voxel(32, 3, 32, 0, 1.5, 0, baseMat);
                voxel(30, 4, 30, 0, 5, 0, baseMat);
                // Tripod legs
                voxel(4, 6, 4, -12, 5, -12, accentMat);
                voxel(4, 6, 4, 12, 5, -12, accentMat);
                voxel(4, 6, 4, 0, 5, 14, accentMat);
                // Tower body
                voxel(26, 4, 26, 0, 9, 0, baseMat);
                voxel(20, 5, 20, 0, 13.5, 0, bodyMat);
                voxel(18, 5, 18, 0, 18.5, 0, bodyMat);
                voxel(16, 4, 16, 0, 22.5, 0, bodyMat);
                // Long barrel
                barrel = voxel(3, 3, 32, 20, 20, 0, barrelMat);
                // Barrel stabilizer ring
                voxel(5, 5, 4, 14, 20, 0, accentMat);
                // Bipod at barrel end
                voxel(2, 6, 2, 18, 16, 16, accentMat);
                voxel(2, 6, 2, 22, 16, 16, accentMat);
                // Muzzle
                voxel(4, 4, 3, 20, 20, 17.5, accentMat);
                // Scope mount
                voxel(4, 3, 4, 28, 21, 0, accentMat);
                // Scope
                voxel(5, 5, 8, 28, 23, 0, scopeMat);
                // Scope lens
                const lensMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, metalness: 0.8, emissive: 0xff0000, emissiveIntensity: 0.5 });
                voxel(3, 3, 1, 28, 23, 4.5, lensMat);
                // Wind sensor
                const windSensorMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.2, metalness: 0.5, emissive: 0x00ffff, emissiveIntensity: 0.3 });
                voxel(2, 2, 2, -10, 24, 0, windSensorMat);
                // Range finder
                voxel(3, 2, 3, 0, 24.5, 8, accentMat);
                head = meshGroup.children[meshGroup.children.length - 12];
```

### 2.3 Cannon Tower (lines 1388-1398)
**Current**: Wide heavy tower with dual barrels
**Enhancements**:
- Add reinforced base
- Add barrel casings
- Add ammo storage boxes
- Add blast shield
- Add recoil dampeners
- Add muzzle flash guard

**Precise edits** (replace lines 1388-1398):
```javascript
            } else if (typeKey === 'CANNON') {
                const baseMat = new THREE.MeshStandardMaterial({ color: 0xc53030, roughness: 0.6, metalness: 0.15 });
                const topMat = new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.55, metalness: 0.2 });
                const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.35, metalness: 0.35 });
                const accentMat = new THREE.MeshStandardMaterial({ color: 0xd44040, roughness: 0.5, metalness: 0.25 });
                // Reinforced base
                voxel(36, 3, 36, 0, 1.5, 0, baseMat);
                voxel(34, 4, 34, 0, 5, 0, baseMat);
                voxel(30, 4, 30, 0, 9, 0, baseMat);
                // Base rivets
                voxel(2, 2, 2, -15, 5, -15, accentMat);
                voxel(2, 2, 2, 15, 5, -15, accentMat);
                voxel(2, 2, 2, -15, 5, 15, accentMat);
                voxel(2, 2, 2, 15, 5, 15, accentMat);
                // Tower body
                voxel(26, 4, 26, 0, 13, 0, topMat);
                voxel(22, 4, 22, 0, 17, 0, topMat);
                // Barrel casings
                voxel(8, 8, 8, 14, 14, 0, accentMat);
                voxel(8, 8, 8, 14, 14, 8, accentMat);
                // Dual barrels
                barrel = voxel(6, 6, 24, 14, 14, 0, barrelMat);
                voxel(6, 6, 24, 14, 14, 8, barrelMat);
                // Muzzle flash guards
                voxel(8, 8, 3, 14, 14, 13.5, accentMat);
                voxel(8, 8, 3, 14, 14, 21.5, accentMat);
                // Recoil dampeners
                voxel(4, 3, 4, 8, 12, 0, accentMat);
                voxel(4, 3, 4, 8, 12, 8, accentMat);
                // Ammo storage boxes
                voxel(6, 5, 6, -10, 10, -10, accentMat);
                voxel(6, 5, 6, -10, 10, 10, accentMat);
                // Blast shield
                voxel(12, 8, 2, -8, 16, -12, accentMat);
                head = meshGroup.children[meshGroup.children.length - 10];
```

### 2.4 Slow Tower (lines 1399-1408)
**Current**: Crystal tower with glowing blue crystal
**Enhancements**:
- Add crystal base pedestal
- Add floating crystal shards
- Add energy ring around base
- Add crystal growth clusters
- Add rune markings
- Add aura particles (small floating crystals)

**Precise edits** (replace lines 1399-1408):
```javascript
            } else if (typeKey === 'SLOW') {
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.5, metalness: 0.1 });
                const crystalMat = new THREE.MeshStandardMaterial({ color: 0x63b3ed, roughness: 0.2, metalness: 0.3, emissive: 0x63b3ed, emissiveIntensity: 0.4 });
                const accentMat = new THREE.MeshStandardMaterial({ color: 0x4299e1, roughness: 0.3, metalness: 0.2 });
                const runeMat = new THREE.MeshStandardMaterial({ color: 0xbee3f8, roughness: 0.1, metalness: 0.5, emissive: 0xbee3f8, emissiveIntensity: 0.6 });
                // Crystal base pedestal
                voxel(28, 3, 28, 0, 1.5, 0, baseMat);
                voxel(26, 4, 26, 0, 5, 0, baseMat);
                voxel(22, 4, 22, 0, 9, 0, baseMat);
                // Energy ring
                voxel(24, 2, 2, 0, 9, 11, runeMat);
                voxel(24, 2, 2, 0, 9, -11, runeMat);
                voxel(2, 2, 24, 11, 9, 0, runeMat);
                voxel(2, 2, 24, -11, 9, 0, runeMat);
                // Pedestal corners
                voxel(4, 6, 4, -11, 6, -11, accentMat);
                voxel(4, 6, 4, 11, 6, -11, accentMat);
                voxel(4, 6, 4, -11, 6, 11, accentMat);
                voxel(4, 6, 4, 11, 6, 11, accentMat);
                // Main crystal body
                voxel(18, 4, 18, 0, 13, 0, crystalMat);
                voxel(14, 5, 14, 0, 17.5, 0, crystalMat);
                voxel(10, 6, 10, 0, 22.5, 0, crystalMat);
                // Crystal tip
                voxel(6, 4, 6, 0, 27, 0, crystalMat);
                voxel(3, 3, 3, 0, 30, 0, runeMat);
                // Floating crystal shards
                voxel(3, 5, 2, -10, 20, 0, accentMat);
                voxel(3, 5, 2, 10, 20, 0, accentMat);
                voxel(2, 5, 3, 0, 20, -10, accentMat);
                voxel(2, 5, 3, 0, 20, 10, accentMat);
                // Crystal growth clusters
                voxel(4, 3, 4, -6, 14, 8, accentMat);
                voxel(4, 3, 4, 6, 14, -8, accentMat);
                // Rune markings
                voxel(12, 1, 1, 0, 13, 9.5, runeMat);
                voxel(1, 1, 12, 9.5, 13, 0, runeMat);
                voxel(1, 1, 12, -9.5, 13, 0, runeMat);
                head = meshGroup.children[meshGroup.children.length - 1];
```

### 2.5 Trap Tower (lines 1409-1418)
**Current**: Spike trap with central spike
**Enhancements**:
- Add pressure plate base
- Add spike ring
- Add warning markings
- Add hidden blade slots
- Add trigger mechanism
- Add blood gro on spikes

**Precise edits** (replace lines 1409-1418):
```javascript
            } else if (typeKey === 'TRAP') {
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.7, metalness: 0.1 });
                const spikeMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e, roughness: 0.4, metalness: 0.3 });
                const accentMat = new THREE.MeshStandardMaterial({ color: 0xfc8181, roughness: 0.3, metalness: 0.4 });
                const warningMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.2, emissive: 0xffcc00, emissiveIntensity: 0.2 });
                // Pressure plate base
                voxel(30, 2, 30, 0, 1, 0, baseMat);
                voxel(28, 3, 28, 0, 3.5, 0, baseMat);
                // Pressure plate markings
                voxel(20, 1, 1, 0, 5, 14, warningMat);
                voxel(20, 1, 1, 0, 5, -14, warningMat);
                voxel(1, 1, 20, 14, 5, 0, warningMat);
                voxel(1, 1, 20, -14, 5, 0, warningMat);
                // Corner spikes
                voxel(4, 12, 4, -10, 9, -10, spikeMat);
                voxel(4, 12, 4, 10, 9, -10, spikeMat);
                voxel(4, 12, 4, -10, 9, 10, spikeMat);
                voxel(4, 12, 4, 10, 9, 10, spikeMat);
                // Spike tips
                voxel(2, 3, 2, -10, 16, -10, accentMat);
                voxel(2, 3, 2, 10, 16, -10, accentMat);
                voxel(2, 3, 2, -10, 16, 10, accentMat);
                voxel(2, 3, 2, 10, 16, 10, accentMat);
                // Central spike
                voxel(5, 14, 5, 0, 10, 0, spikeMat);
                // Central spike tip
                voxel(3, 4, 3, 0, 19, 0, accentMat);
                // Blood gro on central spike
                voxel(1, 10, 1, 0, 10, 2.5, accentMat);
                voxel(1, 10, 1, 0, 10, -2.5, accentMat);
                voxel(1, 10, 1, 2.5, 10, 0, accentMat);
                voxel(1, 10, 1, -2.5, 10, 0, accentMat);
                // Hidden blade slots
                voxel(3, 8, 2, -6, 7, 14, spikeMat);
                voxel(3, 8, 2, 6, 7, 14, spikeMat);
                voxel(3, 8, 2, -6, 7, -14, spikeMat);
                voxel(3, 8, 2, 6, 7, -14, spikeMat);
                // Trigger mechanism
                voxel(4, 3, 4, 0, 5, 0, warningMat);
                head = meshGroup.children[meshGroup.children.length - 1];
```

---

## 4. MAP TILE ENHANCEMENTS

### 3.1 Grass Tile Enhancement (lines 1742-1759)
**Enhancements**:
- Add grass blade clusters on top
- Add small pebble details
- Add soil peek-through patches
- Add flower sprout chance

**Precise edits** (add after line 1759, before closing brace of the loop):
```javascript
                    // Grass blade clusters
                    if (Math.random() > 0.5) {
                        const bladeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(grassColor).lerp(new THREE.Color(0x90EE90), 0.3).getHex(), roughness: 0.95, metalness: 0.0 });
                        for (let b = 0; b < 4; b++) {
                            const bladeH = 2 + Math.random() * 3;
                            const bladeGeo = new THREE.BoxGeometry(1, bladeH, 1);
                            const blade = new THREE.Mesh(bladeGeo, bladeMat);
                            blade.position.set(worldX + (Math.random() - 0.5) * 20, 4 + heightVar + bladeH / 2, worldZ + (Math.random() - 0.5) * 20);
                            blade.rotation.z = (Math.random() - 0.5) * 0.3;
                            scene.add(blade);
                        }
                    }
                    // Small pebbles
                    if (Math.random() > 0.6) {
                        const pebbleGeo = new THREE.BoxGeometry(2 + Math.random() * 2, 1, 2 + Math.random() * 2);
                        const pebbleMat = new THREE.MeshStandardMaterial({ color: stoneColors[Math.floor(Math.random() * stoneColors.length)], roughness: 0.8, metalness: 0.05 });
                        const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
                        pebble.position.set(worldX + (Math.random() - 0.5) * 15, 4.5 + heightVar, worldZ + (Math.random() - 0.5) * 15);
                        pebble.rotation.y = Math.random() * Math.PI;
                        scene.add(pebble);
                    }
                    // Soil peek-through
                    if (Math.random() > 0.75) {
                        const soilGeo = new THREE.BoxGeometry(8 + Math.random() * 6, 0.5, 8 + Math.random() * 6);
                        const soilMat = new THREE.MeshStandardMaterial({ color: dirtColors[Math.floor(Math.random() * dirtColors.length)], roughness: 1.0, metalness: 0.0 });
                        const soil = new THREE.Mesh(soilGeo, soilMat);
                        soil.position.set(worldX + (Math.random() - 0.5) * 10, 4.3 + heightVar, worldZ + (Math.random() - 0.5) * 10);
                        scene.add(soil);
                    }
```

### 3.2 Path Tile Enhancement (lines 2303-2337)
**Enhancements**:
- Add path edge stones
- Add ruts/wheel tracks
- Add scattered debris
- Add puddle chance
- Add footstep indentations
- Add path border grass

**Precise edits** (add after line 2318, before the arrow section):
```javascript
                // Path edge stones
                if (Math.random() > 0.6) {
                    const edgeStoneGeo = new THREE.BoxGeometry(3 + Math.random() * 3, 2, 3 + Math.random() * 3);
                    const edgeStoneMat = new THREE.MeshStandardMaterial({ color: stoneColors[Math.floor(Math.random() * stoneColors.length)], roughness: 0.85, metalness: 0.05 });
                    const edgeStone = new THREE.Mesh(edgeStoneGeo, edgeStoneMat);
                    const side = Math.random() > 0.5 ? 1 : -1;
                    edgeStone.position.set(x + side * (CONFIG.TILE_SIZE / 2 - 2), 7, z + (Math.random() - 0.5) * 20);
                    edgeStone.rotation.y = Math.random() * Math.PI;
                    scene.add(edgeStone);
                }
                // Wheel ruts
                if (Math.random() > 0.5) {
                    const rutGeo = new THREE.BoxGeometry(2, 0.5, 15);
                    const rutMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pathColor).multiplyScalar(0.7).getHex(), roughness: 1.0, metalness: 0.0 });
                    const rut = new THREE.Mesh(rutGeo, rutMat);
                    rut.position.set(x + (Math.random() - 0.5) * 10, 8.3, z);
                    scene.add(rut);
                }
                // Scattered debris
                if (Math.random() > 0.7) {
                    const debrisGeo = new THREE.BoxGeometry(2 + Math.random() * 2, 1, 2 + Math.random() * 2);
                    const debrisMat = new THREE.MeshStandardMaterial({ color: dirtColors[Math.floor(Math.random() * dirtColors.length)], roughness: 0.95, metalness: 0.0 });
                    const debris = new THREE.Mesh(debrisGeo, debrisMat);
                    debris.position.set(x + (Math.random() - 0.5) * 20, 8.3, z + (Math.random() - 0.5) * 20);
                    debris.rotation.y = Math.random() * Math.PI;
                    scene.add(debris);
                }
                // Puddle chance
                if (Math.random() > 0.85) {
                    const puddleGeo = new THREE.BoxGeometry(10 + Math.random() * 8, 0.3, 8 + Math.random() * 6);
                    const puddleMat = new THREE.MeshStandardMaterial({ color: 0x4FC3F7, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.6 });
                    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
                    puddle.position.set(x + (Math.random() - 0.5) * 10, 8.4, z + (Math.random() - 0.5) * 10);
                    puddle.userData = { isPuddle: true, phase: Math.random() * Math.PI * 2 };
                    scene.add(puddle);
                }
```

### 3.3 Water Enhancement (lines 1784-1794)
**Enhancements**:
- Add water ripple rings
- Add foam edges
- Add lily pad chance
- Add underwater stone detail

**Precise edits** (add after line 1794):
```javascript
            // Water ripple rings
            const rippleMat = new THREE.MeshStandardMaterial({ color: 0x81D4FA, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.3 });
            for (let i = 0; i < 8; i++) {
                const rippleGeo = new THREE.BoxGeometry(8 + Math.random() * 6, 0.2, 8 + Math.random() * 6);
                const ripple = new THREE.Mesh(rippleGeo, rippleMat);
                ripple.position.set(Math.random() * CONFIG.MAP_WIDTH * blockSize, 0.7, Math.random() * CONFIG.MAP_HEIGHT * blockSize);
                ripple.userData = { isRipple: true, phase: Math.random() * Math.PI * 2 };
                scene.add(ripple);
            }
            // Lily pads
            const lilyMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8, metalness: 0.0 });
            for (let i = 0; i < 5; i++) {
                const lilyGeo = new THREE.BoxGeometry(4, 0.3, 4);
                const lily = new THREE.Mesh(lilyGeo, lilyMat);
                const lx = Math.random() * CONFIG.MAP_WIDTH * blockSize;
                const lz = Math.random() * CONFIG.MAP_HEIGHT * blockSize;
                lily.position.set(lx, 0.8, lz);
                lily.rotation.y = Math.random() * Math.PI;
                scene.add(lily);
            }
```

### 3.4 Flower Enhancement (lines 1796-1812)
**Enhancements**:
- Add multi-petal flower design
- Add leaf detail on stem
- Add pollen glow
- Add varying stem heights

**Precise edits** (replace lines 1796-1812):
```javascript
            const flowerColors = [0xff6b9d, 0xffeb3b, 0xffffff, 0xe91e63, 0x9c27b0, 0xff5722, 0x00bcd4];
            const flowerStemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.9, metalness: 0.0 });
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7a2e, roughness: 0.85, metalness: 0.0 });
            const pollenMat = new THREE.MeshStandardMaterial({ color: 0xffee88, roughness: 0.3, metalness: 0.2, emissive: 0xffee88, emissiveIntensity: 0.15 });
            for (let i = 0; i < 40; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const fx = x * blockSize + blockSize / 2;
                const fz = z * blockSize + blockSize / 2;
                const stemH = 3 + Math.random() * 4;
                const stemGeo = new THREE.BoxGeometry(1, stemH, 1);
                const stem = new THREE.Mesh(stemGeo, flowerStemMat);
                stem.position.set(fx, 4 + stemH / 2, fz);
                stem.rotation.z = (Math.random() - 0.5) * 0.2;
                scene.add(stem);
                // Leaves
                if (Math.random() > 0.4) {
                    const leafGeo = new THREE.BoxGeometry(3, 0.5, 1.5);
                    const leaf = new THREE.Mesh(leafGeo, leafMat);
                    leaf.position.set(fx + 2, 5 + Math.random() * 2, fz);
                    leaf.rotation.z = 0.5;
                    scene.add(leaf);
                }
                // Multi-petal flower head
                const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.7, metalness: 0.0 });
                // Center
                const centerGeo = new THREE.BoxGeometry(3, 3, 3);
                const center = new THREE.Mesh(centerGeo, pollenMat);
                center.position.set(fx, 5 + stemH, fz);
                scene.add(center);
                // Petals
                for (let p = 0; p < 4; p++) {
                    const petalGeo = new THREE.BoxGeometry(2.5, 2.5, 1.5);
                    const petal = new THREE.Mesh(petalGeo, flowerMat);
                    const angle = (p / 4) * Math.PI * 2;
                    petal.position.set(fx + Math.cos(angle) * 3, 5 + stemH, fz + Math.sin(angle) * 3);
                    petal.rotation.y = angle;
                    scene.add(petal);
                }
            }
```

### 3.5 Mushroom Enhancement (lines 1814-1830)
**Enhancements**:
- Add spotted cap detail
- Add gill detail underneath
- Add spore glow
- Add cluster grouping
- Add root detail

**Precise edits** (replace lines 1814-1830):
```javascript
            const mushCapGeo = new THREE.BoxGeometry(6, 3, 6);
            const mushStemGeo = new THREE.BoxGeometry(2.5, 5, 2.5);
            const mushColors = [0xff4444, 0xff8800, 0xffcc00, 0xcc44ff];
            const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });
            const gillMat = new THREE.MeshStandardMaterial({ color: 0xffeecc, roughness: 0.8, metalness: 0.0 });
            const sporeMat = new THREE.MeshStandardMaterial({ color: 0xaaffaa, roughness: 0.2, metalness: 0.3, emissive: 0xaaffaa, emissiveIntensity: 0.2 });
            for (let i = 0; i < 25; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const mx = x * blockSize + blockSize / 2;
                const mz = z * blockSize + blockSize / 2;
                const mushColor = mushColors[Math.floor(Math.random() * mushColors.length)];
                const mushCapMat = new THREE.MeshStandardMaterial({ color: mushColor, roughness: 0.6, metalness: 0.0 });
                const capScale = 0.8 + Math.random() * 0.5;
                // Main cap
                const cap = new THREE.Mesh(mushCapGeo, mushCapMat);
                cap.position.set(mx, 7, mz);
                cap.scale.setScalar(capScale);
                scene.add(cap);
                // Spots on cap
                for (let s = 0; s < 3; s++) {
                    const spotGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
                    const spot = new THREE.Mesh(spotGeo, spotMat);
                    spot.position.set(mx + (Math.random() - 0.5) * 4, 8.5, mz + (Math.random() - 0.5) * 4);
                    scene.add(spot);
                }
                // Gills underneath
                for (let g = 0; g < 3; g++) {
                    const gillGeo = new THREE.BoxGeometry(5, 0.3, 0.5);
                    const gill = new THREE.Mesh(gillGeo, gillMat);
                    gill.position.set(mx, 5.5, mz + (g - 1) * 1.5);
                    scene.add(gill);
                }
                // Stem
                const stemMat = new THREE.MeshStandardMaterial({ color: 0xffeecc, roughness: 0.85, metalness: 0.0 });
                const stem = new THREE.Mesh(mushStemGeo, stemMat);
                stem.position.set(mx, 3.5, mz);
                scene.add(stem);
                // Spore glow
                const sporeGeo = new THREE.BoxGeometry(1, 1, 1);
                const spore = new THREE.Mesh(sporeGeo, sporeMat);
                spore.position.set(mx, 9, mz);
                spore.userData = { isSpore: true, phase: Math.random() * Math.PI * 2 };
                scene.add(spore);
                // Cluster mushrooms
                if (Math.random() > 0.5) {
                    for (let c = 0; c < 2; c++) {
                        const smallCapGeo = new THREE.BoxGeometry(3, 2, 3);
                        const smallCap = new THREE.Mesh(smallCapGeo, mushCapMat);
                        smallCap.position.set(mx + (c === 0 ? -5 : 5), 4, mz + (Math.random() - 0.5) * 4);
                        scene.add(smallCap);
                        const smallStemGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
                        const smallStem = new THREE.Mesh(smallStemGeo, stemMat);
                        smallStem.position.set(mx + (c === 0 ? -5 : 5), 2, mz + (Math.random() - 0.5) * 4);
                        scene.add(smallStem);
                    }
                }
            }
```

### 3.6 Rock Enhancement (lines 1857-1874)
**Enhancements**:
- Add crystal inlay chance
- Add moss patches
- Add crack lines
- Add varied cluster formations

**Precise edits** (replace lines 1857-1874):
```javascript
            const rockColors = [0x505050, 0x404040, 0x606060, 0x3a3a3a, 0x707070];
            const mossMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95, metalness: 0.0 });
            const crystalInlayMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.2, metalness: 0.6, emissive: 0x88ccff, emissiveIntensity: 0.15 });
            for (let i = 0; i < 30; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const rx = x * blockSize + blockSize / 2;
                const rz = z * blockSize + blockSize / 2;
                const rockColor = rockColors[Math.floor(Math.random() * rockColors.length)];
                const rockW = 4 + Math.random() * 5;
                const rockH = 3 + Math.random() * 4;
                const rockD = 4 + Math.random() * 5;
                const rockGeo = new THREE.BoxGeometry(rockW, rockH, rockD);
                const rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.85, metalness: 0.05 });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(rx, rockH / 2, rz);
                rock.rotation.y = Math.random() * Math.PI;
                rock.castShadow = true;
                scene.add(rock);
                const rockEdges = new THREE.LineSegments(new THREE.EdgesGeometry(rockGeo), edgeMat);
                rockEdges.position.copy(rock.position);
                rockEdges.rotation.copy(rock.rotation);
                scene.add(rockEdges);
                // Moss patches
                if (Math.random() > 0.5) {
                    const mossGeo = new THREE.BoxGeometry(rockW * 0.6, 0.5, rockD * 0.6);
                    const moss = new THREE.Mesh(mossGeo, mossMat);
                    moss.position.set(rx, rockH + 0.25, rz);
                    moss.rotation.y = rock.rotation.y;
                    scene.add(moss);
                }
                // Crystal inlay
                if (Math.random() > 0.7) {
                    const crystalGeo = new THREE.BoxGeometry(2, 2, 1);
                    const crystal = new THREE.Mesh(crystalGeo, crystalInlayMat);
                    crystal.position.set(rx + (Math.random() - 0.5) * rockW * 0.5, rockH * 0.6, rz + rockD / 2 + 0.5);
                    crystal.rotation.y = rock.rotation.y;
                    scene.add(crystal);
                }
                // Crack lines
                if (Math.random() > 0.6) {
                    const crackMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, metalness: 0.0 });
                    const crackGeo = new THREE.BoxGeometry(rockW * 0.8, 0.3, 0.5);
                    const crack = new THREE.Mesh(crackGeo, crackMat);
                    crack.position.set(rx, rockH * 0.5, rz + rockD / 2 + 0.25);
                    crack.rotation.y = rock.rotation.y;
                    scene.add(crack);
                }
            }
```

### 3.7 Grass Tuft Enhancement (lines 1876-1887)
**Enhancements**:
- Add multi-blade tufts
- Add swaying variation
- Add small flower chance in tufts

**Precise edits** (replace lines 1876-1887):
```javascript
            const grassTuftColors = [0x3d6b2d, 0x4a8c3a, 0x2f5c28, 0x5a8c3a];
            for (let i = 0; i < 60; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const tx = x * blockSize + blockSize / 2;
                const tz = z * blockSize + blockSize / 2;
                const tuftColor = grassTuftColors[Math.floor(Math.random() * grassTuftColors.length)];
                const tuftMat = new THREE.MeshStandardMaterial({ color: tuftColor, roughness: 0.95, metalness: 0.0 });
                // Multi-blade tuft
                for (let b = 0; b < 3; b++) {
                    const tuftH = 5 + Math.random() * 4;
                    const tuftGeo = new THREE.BoxGeometry(1.5, tuftH, 1.5);
                    const tuft = new THREE.Mesh(tuftGeo, tuftMat);
                    tuft.position.set(tx + (b - 1) * 3, tuftH / 2, tz);
                    tuft.rotation.z = (Math.random() - 0.5) * 0.4;
                    tuft.rotation.x = (Math.random() - 0.5) * 0.2;
                    scene.add(tuft);
                }
                // Small flower in tuft
                if (Math.random() > 0.7) {
                    const fColor = [0xff6b9d, 0xffeb3b, 0xffffff, 0xe91e63][Math.floor(Math.random() * 4)];
                    const fMat = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.7, metalness: 0.0 });
                    const fGeo = new THREE.BoxGeometry(2, 2, 2);
                    const flower = new THREE.Mesh(fGeo, fMat);
                    flower.position.set(tx, 8, tz);
                    scene.add(flower);
                }
            }
```

### 3.8 Pine Tree Enhancement (lines 1940-1971)
**Enhancements**:
- Add root detail
- Add branch protrusions
- Add pine cone
- Add snow cap chance
- Add bark texture voxels

**Precise edits** (add after line 1967, before `group.position.set`):
```javascript
            // Root detail
            const rootMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.95, metalness: 0.0 });
            voxel(4, 2, 2, -3, 1, 3, rootMat);
            voxel(4, 2, 2, 3, 1, 3, rootMat);
            voxel(2, 2, 4, 3, 1, -3, rootMat);
            voxel(2, 2, 4, -3, 1, -3, rootMat);
            // Branch protrusions
            const branchMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95, metalness: 0.0 });
            voxel(4, 2, 2, 6, 12, 0, branchMat);
            voxel(4, 2, 2, -6, 14, 0, branchMat);
            voxel(2, 2, 4, 0, 16, 6, branchMat);
            // Pine cones
            const pineConeMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.0 });
            voxel(2, 3, 2, 4, 11, 2, pineConeMat);
            voxel(2, 3, 2, -3, 15, -2, pineConeMat);
            // Bark texture voxels
            const barkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0, metalness: 0.0 });
            voxel(1, 2, 1, 1.5, 3, 1.5, barkMat);
            voxel(1, 2, 1, -1.5, 5, -1.5, barkMat);
            voxel(1, 2, 1, 1.5, 7, 0, barkMat);
```

### 3.9 Oak Tree Enhancement (lines 1974-2017)
**Enhancements**:
- Add root system
- Add branch structure
- Add bird nest chance
- Add acorn details
- Add bark texture

**Precise edits** (add after line 2013, before `group.position.set`):
```javascript
            // Root system
            const rootMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.95, metalness: 0.0 });
            voxel(5, 3, 3, -4, 1, 4, rootMat);
            voxel(5, 3, 3, 4, 1, 4, rootMat);
            voxel(3, 3, 5, 4, 1, -4, rootMat);
            voxel(3, 3, 5, -4, 1, -4, rootMat);
            voxel(3, 2, 3, -5, 1, 0, rootMat);
            voxel(3, 2, 3, 5, 1, 0, rootMat);
            // Branch structure
            const branchMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9, metalness: 0.0 });
            voxel(6, 3, 3, 7, 14, 0, branchMat);
            voxel(6, 3, 3, -7, 15, 0, branchMat);
            voxel(3, 3, 6, 0, 16, 7, branchMat);
            voxel(3, 3, 6, 0, 13, -7, branchMat);
            // Acorn details
            const acornMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.0 });
            const acornCapMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8, metalness: 0.0 });
            voxel(2, 2, 2, 3, 14, 3, acornMat);
            voxel(2, 1, 2, 3, 15, 3, acornCapMat);
            voxel(2, 2, 2, -4, 16, 2, acornMat);
            voxel(2, 1, 2, -4, 17, 2, acornCapMat);
            // Bark texture
            const barkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0, metalness: 0.0 });
            voxel(1, 3, 1, 1.5, 4, 1.5, barkMat);
            voxel(1, 3, 1, -1.5, 6, -1.5, barkMat);
            voxel(1, 3, 1, 1.5, 8, 0, barkMat);
            voxel(1, 3, 1, -1.5, 10, 1.5, barkMat);
            // Bird nest chance
            if (Math.random() > 0.6) {
                const nestMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.95, metalness: 0.0 });
                voxel(5, 2, 5, 5, 16, 0, nestMat);
                voxel(3, 1, 3, 5, 17, 0, nestMat);
                // Eggs
                const eggMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.6, metalness: 0.0 });
                voxel(1.5, 1.5, 1.5, 4, 18, 0, eggMat);
                voxel(1.5, 1.5, 1.5, 6, 18, 0, eggMat);
            }
```

### 3.10 Bush Enhancement (lines 2020-2049)
**Enhancements**:
- Add varied bush shapes
- Add thorn detail
- Add flower on bush
- Add leaf cluster variation

**Precise edits** (replace lines 2020-2049):
```javascript
        function createVoxelBush(x, z, berryColors) {
            const bushMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.9, metalness: 0.0 });
            const lightGreenMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.88, metalness: 0.0 });
            const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.92, metalness: 0.0 });
            const thornMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.0 });
            const group = new THREE.Group();
            const bushVoxels = [
                { ox: 0, oy: 3, oz: 0, sx: 8, sy: 3, sz: 6 },
                { ox: 0, oy: 5, oz: 0, sx: 7, sy: 3, sz: 5 },
                { ox: 2, oy: 4, oz: 0, sx: 4, sy: 3, sz: 4 },
                { ox: -2, oy: 4, oz: 0, sx: 4, sy: 3, sz: 4 },
                { ox: 0, oy: 4, oz: 2, sx: 5, sy: 3, sz: 3 },
                { ox: 0, oy: 4, oz: -2, sx: 5, sy: 3, sz: 3 },
            ];
            bushVoxels.forEach((v, i) => {
                const mat = i % 3 === 0 ? darkGreenMat : (i % 3 === 1 ? bushMat : lightGreenMat);
                const geo = new THREE.BoxGeometry(v.sx, v.sy, v.sz);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(v.ox, v.oy, v.oz);
                mesh.castShadow = true;
                group.add(mesh);
            });
            // Thorns
            for (let t = 0; t < 6; t++) {
                const thornGeo = new THREE.BoxGeometry(1, 2, 1);
                const thorn = new THREE.Mesh(thornGeo, thornMat);
                thorn.position.set((Math.random() - 0.5) * 8, 4 + Math.random() * 3, (Math.random() - 0.5) * 6);
                thorn.rotation.z = (Math.random() - 0.5) * 0.8;
                group.add(thorn);
            }
            // Berries
            const berryGeo = new THREE.BoxGeometry(2, 2, 2);
            for (let j = 0; j < 4; j++) {
                const berryMat = new THREE.MeshStandardMaterial({ color: berryColors[Math.floor(Math.random() * berryColors.length)], roughness: 0.5, metalness: 0.0 });
                const berry = new THREE.Mesh(berryGeo, berryMat);
                berry.position.set((Math.random() - 0.5) * 6, 4 + j * 0.5, (Math.random() - 0.5) * 4);
                group.add(berry);
            }
            // Small flowers on bush
            if (Math.random() > 0.5) {
                const fColor = [0xff6b9d, 0xffeb3b, 0xffffff][Math.floor(Math.random() * 3)];
                const fMat = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.7, metalness: 0.0 });
                const fGeo = new THREE.BoxGeometry(2, 2, 2);
                const flower = new THREE.Mesh(fGeo, fMat);
                flower.position.set((Math.random() - 0.5) * 6, 6, (Math.random() - 0.5) * 4);
                group.add(flower);
            }
            group.position.set(x, 0, z);
            group.scale.setScalar(0.7 + Math.random() * 0.6);
            scene.add(group);
        }
```

---

## 5. ANIMATION ENHANCEMENTS

### 4.1 Add to `updateTerrain` function
Add pulsing glow animation for enemy glows (add to updateTerrain):
```javascript
            // Animate enemy glows
            enemies.forEach(enemy => {
                if (enemy.glowMesh && enemy.glowMesh.userData.isEnemyGlow) {
                    const t = Date.now() * 0.003 + enemy.glowMesh.userData.phase;
                    enemy.glowMesh.material.opacity = enemy.glowMesh.userData.baseOpacity + Math.sin(t) * 0.08;
                    const pulseScale = 1 + Math.sin(t) * 0.1;
                    enemy.glowMesh.scale.setScalar(pulseScale);
                }
            });
```

### 4.2 Add water ripple animation to `updateTerrain`
```javascript
            // Animate water ripples
            scene.children.forEach(child => {
                if (child.userData.isRipple) {
                    const t = Date.now() * 0.002 + child.userData.phase;
                    child.material.opacity = 0.2 + Math.sin(t) * 0.15;
                    child.scale.setScalar(1 + Math.sin(t) * 0.1);
                }
                if (child.userData.isSpore) {
                    const t = Date.now() * 0.004 + child.userData.phase;
                    child.material.opacity = 0.3 + Math.sin(t) * 0.3;
                    child.position.y += Math.sin(t) * 0.02;
                }
                if (child.userData.isPuddle) {
                    const t = Date.now() * 0.003 + child.userData.phase;
                    child.material.opacity = 0.5 + Math.sin(t) * 0.15;
                }
            });
```

---

## 6. TECHNICAL REFERENCE

### 5.1 Coordinate System
- All voxel positions use **local coordinates** relative to the enemy/turret Group center
- `voxel(w, h, d, x, y, z, material)` creates a BoxGeometry centered at (x, y, z) with dimensions (w, h, d)
- Y-axis is UP (vertical), X-axis is RIGHT, Z-axis is FORWARD (toward camera/target)
- Values are in **voxel units** where 1 unit ≈ 1 world unit (CONFIG.TILE_SIZE = 30)

### 5.2 The `voxel()` Helper
Located in `tower-defense.html` around line 1340:
```javascript
function voxel(w, h, d, x, y, z, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshGroup.add(mesh);
    return mesh;
}
```
- Returns the created mesh for reference (used for barrel assignment)
- All voxels are added to `meshGroup`, which is the turret/enemy's visual container
- `meshGroup` is a THREE.Group that gets positioned in the scene

### 5.3 Material Conventions
- `darkMat` / `lightMat` — pre-defined in each enemy switch case, derived from the enemy's `color` parameter
- `eyePupilMat` — pre-defined dark material for eyes
- Turret sections define their own materials inline (baseMat, barrelMat, accentMat, etc.)
- **Rule**: Create materials ONCE per entity type, reuse across all voxels of that type

---

## 7. PERFORMANCE BUDGET

### 6.1 Mesh Count Limits
| Category | Current Meshes | After Enhancement | Max Allowed |
|----------|---------------|-------------------|-------------|
| Per Basic Enemy | ~12 | ~22 | 30 |
| Per Fast Enemy | ~10 | ~23 | 30 |
| Per Tank Enemy | ~16 | ~34 | 40 |
| Per Sniper Enemy | ~14 | ~27 | 35 |
| Per Burrow Enemy | ~12 | ~24 | 35 |
| Per Spawner Enemy | ~14 | ~33 | 40 |
| Per Boss Enemy | ~20 | ~55 | 60 |
| Per Turret | ~8-12 | ~18-28 | 35 |
| Map decorations | ~200 | ~500 | 800 |

### 6.2 Draw Call Budget
- **Target**: Maintain 60 FPS on mid-range hardware (GTX 1060 / M1 equivalent)
- **Max draw calls**: 2000 per frame
- **Current estimate**: ~800 draw calls (baseline)
- **Post-enhancement estimate**: ~1200-1400 draw calls
- **Buffer**: 600+ draw calls remaining for effects, UI, particles

### 6.3 Memory Budget
- Each unique `MeshStandardMaterial` ≈ 50KB GPU memory
- Each `BoxGeometry` (unique dimensions) ≈ 2KB
- **Material reuse target**: ≤ 40 unique materials total (currently ~25, adding ~15)
- **Geometry reuse**: All box geometries are auto-merged by Three.js instancing where possible

### 6.4 Animation Cost
- Enemy glow pulse: O(n) where n = active enemies (max ~50) — negligible
- Water ripple animation: O(m) where m = ripple meshes (max ~50) — negligible
- Total animation overhead: < 0.5ms per frame on modern hardware

### 6.5 Fallback Strategy
If performance drops below 60 FPS after enhancements:
1. **First**: Disable map decoration animations (ripples, spores, puddles) — saves ~30% animation cost
2. **Second**: Reduce grass blade clusters from 4 to 2 per tile — saves ~100 meshes
3. **Third**: Remove enemy glow spheres entirely — saves ~50 meshes + animation
4. **Fourth**: Simplify Boss enemy (remove cape, throne back, reduce pauldron spikes) — saves ~15 meshes per boss
5. **Last resort**: Cap max simultaneous enemies from 50 to 35

---

## 8. MATERIAL POOLING STRATEGY

### 7.1 Problem
Many enhancement sections create `new THREE.MeshStandardMaterial()` inline. If called per-enemy-instance, this creates duplicate materials that waste GPU memory and prevent draw call batching.

### 7.2 Solution: Shared Material Cache
Add this material cache near the top of `tower-defense.html` (after CONFIG, before any entity creation):
```javascript
const MATERIAL_CACHE = {};
function getMaterial(key, props) {
    if (!MATERIAL_CACHE[key]) {
        MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial(props);
    }
    return MATERIAL_CACHE[key];
}
```

### 7.3 Material Key Naming Convention
- `enemy_dark` / `enemy_light` — base enemy materials
- `enemy_glow_red` / `enemy_glow_orange` — emissive accent materials
- `turret_basic_base` / `turret_basic_barrel` — turret-specific materials
- `map_grass_blade` / `map_water_ripple` / `map_rock_moss` — map decoration materials
- `detail_spike` / `detail_crystal` / `detail_rune` — shared detail materials

### 7.4 Materials That MUST Be Pooled
| Material | Used In | Reuse Count |
|----------|---------|-------------|
| `lightMat` (accent) | All enemies | 7 types × N instances |
| `drillMat` (metallic gray) | Burrowing enemies | N instances |
| `pauldronMat` (dark red metal) | Boss enemies | N instances |
| `sensorMat` (green emissive) | Basic turrets | N instances |
| `crystalMat` (blue emissive) | Slow turrets | N instances |
| `rippleMat` (water) | Map water tiles | ~50 instances |
| `sporeMat` (green emissive) | Map mushrooms | ~25 instances |

### 7.5 Materials That Can Stay Inline
- Unique one-off materials (e.g., Boss crown jewel, Spawner portal)
- Materials with per-instance randomization (color variations)
- Transparent materials that need individual opacity control (birthing sac)

---

## 9. HITBOX & GAMEPLAY COMPATIBILITY

### 8.1 Current Hitbox System
- Enemy hitboxes are calculated from the **base body voxels only**, not visual details
- Turret targeting uses distance-to-center, not mesh collision
- Projectiles hit based on radius check, not raycast against visual meshes

### 8.2 Enhancement Safety Rules
1. **Do NOT modify existing body/core voxel positions** — only ADD new voxels
2. **New voxels should be OUTSIDE the existing hitbox radius** — arms, tails, spikes, etc. extend outward
3. **Do NOT change the Group's bounding box** significantly — keep additions within ±20% of original size
4. **Turret barrel positions must remain unchanged** — only add detail around them

### 8.3 Collision Testing Checklist
After each enhancement section:
- [ ] Enemy still takes damage when clicked/targeted
- [ ] Enemy pathfinding is not blocked by new visual voxels
- [ ] Turret projectiles still connect with enemies at expected range
- [ ] Boss weak point (chest core) is visually clear and mechanically functional
- [ ] Trap tower pressure plate still triggers on enemy overlap
- [ ] Slow tower crystal aura still applies slow effect in correct radius

---

## 10. TESTING PLAN

### 9.1 Visual Verification (Per Section)
For each enhancement section, verify:
1. **Open `tower-defense.html`** in browser
2. **Trigger the relevant entity type** (spawn enemy, place turret, load map)
3. **Orbit camera** around the entity to check all angles
4. **Verify no z-fighting** (flickering overlapping voxels)
5. **Verify no T-pose or floating voxels** (everything should be attached)
6. **Check color consistency** (new voxels match the entity's color palette)

### 9.2 Performance Testing
1. Open browser DevTools → Performance tab
2. Record 30 seconds of gameplay with maximum entities on screen
3. Check:
   - [ ] FPS stays above 55 (target 60)
   - [ ] Draw calls < 2000
   - [ ] GPU memory < 500MB
   - [ ] No memory leak (materials not growing over time)

### 9.3 Gameplay Testing
1. [ ] Complete a full wave with all 7 enemy types present
2. [ ] Place all 5 turret types and verify they fire correctly
3. [ ] Let a game run for 10+ minutes — check for performance degradation
4. [ ] Test on mobile browser (if applicable) — verify acceptable performance

### 9.4 Cross-Browser Testing
- [ ] Chrome (primary target)
- [ ] Firefox
- [ ] Safari (macOS/iOS if applicable)
- [ ] Edge

---

## 11. ROLLBACK STRATEGY

### 10.1 Git-Based Rollback (Recommended)
Before starting any enhancement work:
```bash
git add -A && git commit -m "checkpoint: pre-visual-enhancement baseline"
```
After each section, commit separately:
```bash
git add -A && git commit -m "enhancement: enemy visuals"
git add -A && git commit -m "enhancement: turret visuals"
# etc.
```
To rollback a specific section:
```bash
git revert <commit-hash>
```

### 10.2 Manual Rollback
If not using git, save a backup copy before each section:
```
cp tower-defense.html tower-defense.html.bak.enemies
cp tower-defense.html tower-defense.html.bak.turrets
# etc.
```

### 10.3 Quick Disable Switch
Add a global toggle at the top of `tower-defense.html`:
```javascript
const VISUAL_ENHANCEMENTS_ENABLED = true; // Set to false to disable all enhancements
```
Wrap each enhancement section's new voxel additions in:
```javascript
if (VISUAL_ENHANCEMENTS_ENABLED) {
    // new voxel code here
}
```
This allows instant A/B comparison by toggling one variable.

---

## 12. LOD & CULLING STRATEGY

### 11.1 Distance-Based Detail Reduction
For map decorations (grass, flowers, rocks, mushrooms):
- **Near** (camera distance < 200): Full detail as specified
- **Mid** (200 < distance < 500): Reduce blade/cluster count by 50%
- **Far** (distance > 500): Skip entirely or use single placeholder mesh

Implementation:
```javascript
const distToCamera = camera.position.distanceTo(new THREE.Vector3(fx, 0, fz));
if (distToCamera > 500) return; // Skip far decorations
if (distToCamera > 200) bladeCount = 2; // Reduce mid-range
```

### 11.2 Frustum Culling
Three.js handles frustum culling automatically for meshes added to the scene. Ensure:
- All decoration meshes have `mesh.frustumCulled = true` (default)
- No meshes are added to a parent with `frustumCulled = false`

### 11.3 InstancedMesh for Repetitive Elements
For elements with > 50 instances (grass blades, pebbles, spores), consider migrating to `THREE.InstancedMesh`:
```javascript
const grassInstancedGeo = new THREE.BoxGeometry(1, 3, 1);
const grassInstancedMat = new THREE.MeshStandardMaterial({ color: 0x3d6b2d });
const grassMesh = new THREE.InstancedMesh(grassInstancedGeo, grassInstancedMat, 200);
// Set matrix for each instance
```
This reduces 200 draw calls to 1.

---

## 13. PROGRESSIVE ROLLOUT PLAN

### Phase 1: Highest Impact, Lowest Risk (Ship First)
- Enemy glow enhancement (Section 1.8) — one mesh per enemy, huge visual improvement
- Turret targeting sensor details — small additions, zero gameplay impact
- Water ripple animation — ambient, no interaction with gameplay

### Phase 2: Core Visual Upgrade (Ship Second)
- All 7 enemy type enhancements (Sections 1.1-1.7)
- All 5 turret type enhancements (Sections 2.1-2.5)
- Enemy glow animation (Section 4.1)

### Phase 3: Environmental Polish (Ship Third)
- Map tile enhancements (Sections 3.1-3.3)
- Flower, mushroom, rock enhancements (Sections 3.4-3.6)
- Water animation (Section 4.2)

### Phase 4: Final Detail Pass (Ship Last)
- Tree enhancements (Sections 3.8-3.9)
- Bush enhancement (Section 3.10)
- Grass tuft enhancement (Section 3.7)

---

## 14. IMPLEMENTATION ORDER

1. **Phase 1** — Enemy glow + turret sensors + water ripples (quick wins)
2. **Phase 2** — Enemy enhancements (Section 1) — Highest visual impact
3. **Phase 3** — Turret enhancements (Section 2) — Second highest impact
4. **Phase 4** — Map tile enhancements (Section 3) — Environmental polish
5. **Phase 5** — Animation enhancements (Section 4) — Brings everything to life

---

## 16. CODE ALIGNMENT NOTES (Critical — Read Before Implementing)

### 16.1 Enemy Type Naming Convention
**Issue**: The plan uses uppercase type strings in some new enemy case blocks (e.g., `'STEALTH'`, `'SHIELDED'`), but the **actual code uses lowercase** for all 7 existing types: `'basic'`, `'fast'`, `'tank'`, `'sniper'`, `'burrowing'`, `'spawner'`, `'boss'`.

**Fix**: When adding new enemy types to the switch case in `createVoxelEnemyMesh()`, use **lowercase** strings to match the existing convention:
```javascript
case 'stealth':   // NOT 'STEALTH'
case 'shielded':  // NOT 'SHIELDED'
case 'swarm':     // NOT 'SWARM'
// etc.
```

### 16.2 Enemy `voxel()` Function Does NOT Return a Mesh
**Issue**: The plan's enemy enhancement code assumes `voxel()` returns the created mesh (like the turret version does). However, the **enemy voxel function at line ~2469 is void** — it does not return anything:
```javascript
// Actual enemy voxel function (line ~2469):
const voxel = (sx, sy, sz, px, py, pz, m) => {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geo, m || mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    group.add(mesh);
    // NO return statement!
};
```

**Fix**: The enemy voxel code in Sections 1.1-1.7 and 1.9-1.16 is correct as-is because it does NOT use return values. However, if any future enhancement needs to reference a specific mesh (like the turret `head = meshGroup.children[...]` pattern), you must use `group.children[group.children.length - N]` instead.

### 16.3 New Enemy Types Need Game System Integration
**Issue**: The plan adds voxel models for 16 new enemy types (stealth, shielded, swarm, splitting, elemental_fire, elemental_ice, elemental_poison, siege, healer, elite_basic, etc.) but does not address the systems that must support them:

**Required additions for each new enemy type**:

1. **`ENEMY_KILL_REWARDS`** (line ~644): Add kill reward value
   ```javascript
   const ENEMY_KILL_REWARDS = {
       basic: 10, fast: 8, tank: 15, sniper: 12, burrowing: 15, spawner: 20, boss: 30,
       stealth: 18, shielded: 22, swarm: 4, splitting: 14,
       elemental_fire: 16, elemental_ice: 16, elemental_poison: 16,
       siege: 25, healer: 20, elite_basic: 18
   };
   ```

2. **Enemy special properties** (lines ~2632-2638): Each new type needs property assignments:
   ```javascript
   enemy.dodgeChance = (type === 'stealth' || type === 'swarm') ? 0.2 : 0;
   enemy.armorReduction = (type === 'shielded' || type === 'elite_basic') ? 0.15 : 0;
   enemy.invisible = (type === 'stealth') ? true : false;
   enemy.towerDamageMult = (type === 'siege') ? 2 : 1;
   enemy.spawnOnDeath = (type === 'splitting') ? 2 : (type === 'spawner') ? 2 : 0;
   enemy.summonTimer = (type === 'healer') ? 8 : (type === 'boss') ? 5 : 0;
   ```

3. **Wave spawning system**: New types must be added to wave composition logic so they actually appear in gameplay.

4. **Status effect properties** (if applicable):
   - `stealth`: Toggle `enemy.visible` every 2-3 seconds
   - `shielded`: Track shield HP, visual shield depletion
   - `splitting`: On death, spawn 2 smaller children
   - `healer`: Periodic heal aura to nearby enemies
   - `elemental_fire`: Burn damage to nearby towers on death
   - `elemental_ice`: Slow aura to nearby towers
   - `elemental_poison`: Poison DoT on hit

### 16.4 Turret `head` Index References Will Break
**Issue**: The plan replaces turret voxel blocks with significantly more voxels, then sets `head = meshGroup.children[meshGroup.children.length - N]` with specific indices (e.g., `-8`, `-12`, `-10`). These indices are based on the **enhanced** voxel count, but:

- The turret's rotation logic uses `head` to aim the barrel
- If the index is wrong, the wrong mesh will rotate (or nothing will)

**Fix**: After adding all voxels for each turret type, use a **material-based or position-based search** instead of index:
```javascript
// Instead of: head = meshGroup.children[meshGroup.children.length - 8];
// Use: Find the barrel mesh by its position or a userData flag
head = meshGroup.children.find(c => c.userData.isBarrel) || meshGroup.children[meshGroup.children.length - 1];
```
Or tag the barrel voxel: `barrel.userData.isBarrel = true;`

### 16.5 Existing Projectile System Conflicts
**Issue**: Section 2.4 `createEnhancedProjectile()` returns a `THREE.Group` with trails and muzzle flash, but the **actual projectile system** (lines ~3500-3550) uses a simple object with a `mesh` property:
```javascript
const proj = {
    mesh: mesh,           // Single THREE.Mesh
    target: closestEnemy,
    damage: ...,
    speed: ...,
    life: 120,
    typeKey: tower.typeKey,
    trails: []            // Already has trail system
};
```

**Fix**: Either:
- **Option A**: Adapt the enhanced projectile to return a compatible object: `{ mesh: projGroup, target: ..., trails: [] }`
- **Option B**: Enhance the existing projectile creation inline instead of replacing it
- **Option C**: Update the projectile update loop (lines ~3520-3548) to handle `THREE.Group` projectiles

**Also**: The existing `proj.trails` array already creates trailing spheres. The plan's trail system would duplicate this. Remove or merge the existing trail code.

### 16.6 Existing Death/Explosion System Conflicts
**Issue**: Section 2.1 death animations reference `deathParticles.push()` but this array **does not exist**. The actual code uses `debrisParticles` (line ~703) and `createExplosion()` function.

**Fix**: Either:
- Declare `const deathParticles = [];` near line 703 alongside `debrisParticles`
- Or integrate with the existing `createExplosion()` and `debrisParticles` system
- The existing `createExplosion()` already handles particle creation on enemy death (line ~2914)

**Also**: The existing death handler at line ~2914 does:
```javascript
createExplosion(enemy.mesh.position.x, enemy.mesh.position.y, enemy.mesh.position.z, enemy.size);
scene.remove(enemy.glowMesh);
scene.remove(enemy.mesh);
```
The plan's `playDeathExplosion()`, `playDeathDissolve()`, `playDeathCollapse()` need to be called **before** `scene.remove(enemy.mesh)` and the update loops need to be added to the main game loop.

### 16.7 Damage Visuals Integration Point
**Issue**: Section 2.2 `applyDamageVisuals()` expects to be called with `damagePercent`, but the **actual damage code** (line ~3050-3065) is inline:
```javascript
let dmg = proj.damage;
if (proj.target.armorReduction > 0) {
    dmg *= (1 - proj.target.armorReduction);
}
proj.target.health -= dmg;
proj.target.hitFlash = 1;
```

**Fix**: Add damage percent tracking and call `applyDamageVisuals()`:
```javascript
proj.target.health -= dmg;
proj.target.hitFlash = 1;
const maxHealth = ENEMY_HEALTH[proj.target.type] * waveScale;
const damagePercent = 1 - (proj.target.health / maxHealth);
applyDamageVisuals(proj.target.mesh || proj.target, damagePercent);
```

**Note**: The `applyDamageVisuals()` function references `enemy.add(crack)` — this assumes the enemy mesh is a `THREE.Group`. The actual enemy mesh IS a group (from `createVoxelEnemyMesh()`), so this works.

### 16.8 Status Effect Visuals Have No Backing System
**Issue**: Section 2.3 `applyStatusVisuals()` checks for `enemy.status === 'BURNING'`, `enemy.status === 'FROZEN'`, etc. However, **no status effect system exists** in the actual code. The SLOW tower has `slowFactor: 0.5` defined (line ~641) but the slow is never actually applied to enemies.

**Prerequisite**: Before the status visuals will show anything, you must implement:
1. A `status` property on enemies (default `null`)
2. Status application logic in the projectile hit handler
3. Status duration/tick logic in the enemy update loop
4. Status removal on expiration

**Minimal status system to add**:
```javascript
// On projectile hit (in the damage application code):
if (proj.typeKey === 'SLOW') {
    enemy.status = 'SLOWED';
    enemy.statusDuration = 3000; // 3 seconds
    enemy.speedMultiplier = TOWER_TYPES.SLOW.slowFactor || 0.5;
}

// In enemy update loop:
if (enemy.statusDuration > 0) {
    enemy.statusDuration -= deltaTime;
    if (enemy.statusDuration <= 0) {
        enemy.status = null;
        enemy.speedMultiplier = 1;
    }
}
```

**For BURNING, FROZEN, POISONED**: These require new turret types or tower upgrade effects that don't currently exist. Either:
- Add these as elemental turret variants (requires new tower types)
- Or remove the status visuals for now and only implement SLOWED (which has partial support)

### 16.9 Turret Upgrade System Does Not Exist
**Issue**: Section 2.6 `applyUpgradeVisuals()` assumes a turret upgrade system with `level` parameter, but **towers are placed once and never upgraded** in the current code.

**Fix options**:
- **Option A**: Implement a basic upgrade system first (right-click turret to upgrade, costs energy)
- **Option B**: Remove Section 2.6 entirely for now
- **Option C**: Repurpose as "wave survival" visual progression — towers gain visual upgrades after N kills

### 16.10 Hit Flash with Multi-Material Enemies
**Issue**: The current hit flash system (line ~2957-2968, ~3055-3065) sets emissive to white on the enemy mesh. With enhanced enemies having **multiple materials** (armor plates, glowing elements, transparent parts), a uniform white flash will look wrong.

**Fix**: The hit flash iterates `enemy.mesh.children` (or similar). For multi-material enemies:
```javascript
// Instead of setting all children to white emissive:
enemy.mesh.children.forEach(child => {
    if (child.material && !child.material.transparent) {
        child.userData._origEmissive = child.material.emissive.getHex();
        child.userData._origEmissiveIntensity = child.material.emissiveIntensity;
        child.material.emissive.setHex(0xffffff);
        child.material.emissiveIntensity = 0.5;
    }
});
// Skip transparent/glowing materials during flash
```

### 16.11 `deathParticles` Array Declaration Missing
**Issue**: Section 2.1 references `deathParticles.push(particle)` but this array is never declared.

**Fix**: Add near line 703 (with other particle arrays):
```javascript
let deathParticles = [];
let impactEffects = []; // Also needed for Section 2.5
```

And add cleanup in the update loop:
```javascript
// Update death particles
for (let i = deathParticles.length - 1; i >= 0; i--) {
    const p = deathParticles[i];
    p.userData.life -= p.userData.decay;
    p.material.opacity = p.userData.life;
    p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
    p.userData.velocity.y -= 0.05; // gravity
    if (p.userData.life <= 0) {
        scene.remove(p);
        deathParticles.splice(i, 1);
    }
}

// Update impact effects
for (let i = impactEffects.length - 1; i >= 0; i--) {
    const impact = impactEffects[i];
    impact.userData.life -= impact.userData.decay;
    impact.children.forEach(child => {
        if (child.material) child.material.opacity = impact.userData.life;
        if (child.userData.velocity) {
            child.position.add(child.userData.velocity.clone().multiplyScalar(0.016));
            child.userData.velocity.y -= 0.03;
        }
    });
    if (impact.userData.life <= 0) {
        scene.remove(impact);
        impactEffects.splice(i, 1);
    }
}
```

### 16.12 Build Animation Integration
**Issue**: Section 2.7 `playBuildAnimation()` sets `turret.userData.isBuilding = true` but the current code places towers directly at full scale.

**Fix**: In the tower placement code (where `createTower()` is called), add:
```javascript
const tower = createTower(typeKey, gridX, gridZ);
playBuildAnimation(tower.mesh);
```

And add the build animation update to the main game loop (where towers are updated each frame).

### 16.13 Range Indicator Integration
**Issue**: Section 2.8 `showRangeIndicator()` creates a new mesh but the current placement preview system may already show something.

**Fix**: Integrate with the existing tower placement preview. When hovering to place a tower, show the range indicator. Remove it when placement is confirmed or cancelled.

### 16.14 Wave Incoming Markers Integration
**Issue**: Section 2.9 `showWaveIncoming()` references `spawnX` and `spawnZ` variables. Verify these exist in the actual code or use the actual spawn point coordinates.

**Fix**: Find the actual spawn point variables in the code and use those instead. The spawn point may be defined as `gameState.spawnPoint` or similar.

### 16.15 Turret TRAP and SLOW Types Were Initially Missing
**Issue**: Earlier versions of this plan only covered BASIC, SNIPER, and CANNON turret enhancements. Sections 2.4 (Slow Tower) and 2.5 (Trap Tower) have been added to the plan. Verify these sections are present and complete before implementation.

### 16.16 Line Number References May Be Stale
**Issue**: The plan references specific line numbers (e.g., "lines 2482-2491", "line 2651-2656"). The actual file is 3,568 lines. Line numbers may shift as edits are made.

**Fix**: Use **code search patterns** instead of line numbers when implementing. Search for:
- Enemy switch case: `case 'basic':` through `case 'boss':`
- Turret types: `if (typeKey === 'BASIC')` through `else if (typeKey === 'TRAP')`
- Enemy glow: `new THREE.SphereGeometry(12 * size`
- Death handler: `if (enemy.health <= 0)`
- Damage handler: `proj.target.health -= dmg`

### 16.17 Map Tile Section Numbering Inconsistency
**Issue**: Section 4 is titled "MAP TILE ENHANCEMENTS" but its subsections are numbered 3.1, 3.2, etc. Sections 3.1-3.10 are under "## 3. TURRET ENHANCEMENTS" but should be under "## 4. MAP TILE ENHANCEMENTS". The turret sections are numbered 2.1-2.5 (under "## 3. TURRET ENHANCEMENTS").

**Fix**: This is a documentation numbering issue only. The content is correct, but be aware:
- Sections 3.1-3.5 in the plan = Turret enhancements (should be 3.1-3.5)
- Sections 3.1-3.10 in the plan = Map tile enhancements (should be 4.1-4.10)
- Sections 4.1-4.2 in the plan = Animation enhancements (should be 5.1-5.2)

### 16.18 Existing Systems That Should NOT Be Overwritten
The following systems already exist and should be **enhanced, not replaced**:

| System | Location | Plan Section | Action |
|--------|----------|-------------|--------|
| Ambient particles | line ~700, 2799-2808 | None | Keep as-is |
| Debris/explosion particles | line ~703, 2893-2908 | 2.1 | Merge with deathParticles |
| Enemy glow mesh | line ~2651-2656 | 1.8 | Replace as planned |
| AOE indicator | line ~2694-2725 | None | Keep as-is |
| Projectile trails | line ~3522-3548 | 2.4 | Merge or replace |
| Hit flash | line ~2957-2968, 3055-3065 | 2.2 | Enhance for multi-material |
| Path tile animation | line ~3231-3248 | 3.2 | Keep, add edge details |
| Water animation | line ~2728-2735 | 3.3 | Enhance as planned |
| Path creation particles | line ~2289-2299 | None | Keep as-is |
| Random event buffs | line ~3217-3228 | None | Keep as-is |

---

## 17. ESTIMATED IMPACT

- **Enemies**: 40-60% more voxel detail per type, distinctive silhouettes, better readability
- **Turrets**: 50-70% more detail, unique identities, clearer function communication
- **Map tiles**: 30-50% more environmental richness, layered detail, natural feel
- **Animations**: Pulsing glows, water effects, spore floating — living world feel
- **Performance**: < 10% FPS impact with LOD strategy, < 5% without heavy decorations
- **Memory**: ~2-5MB additional GPU memory for new materials and geometries
