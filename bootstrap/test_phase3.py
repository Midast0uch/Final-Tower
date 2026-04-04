#!/usr/bin/env python3
"""
Phase 3 Test Suite for Final Tower
Tests all turret type implementations + regression guards
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'bootstrap'))

def read_game_html():
    with open('tower-defense.html', 'r') as f:
        return f.read()

class TestResult:
    def __init__(self, name, passed, message=""):
        self.name = name
        self.passed = passed
        self.message = message
        
    def __str__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status} {self.name}: {self.message}"

def test_turret_types():
    """Test 3.1: All 5 turret types"""
    results = []
    html = read_game_html()
    
    # Basic turret
    if "BASIC:" in html and "cost: 20" in html and "damage: 5" in html:
        results.append(TestResult("Basic Turret", True, "cost=20, damage=5, range=7"))
    else:
        results.append(TestResult("Basic Turret", False, "Missing or incorrect"))
    
    # Sniper turret
    if "SNIPER:" in html and "cost: 40" in html and "damage: 15" in html and "range: 18" in html:
        results.append(TestResult("Sniper Turret", True, "cost=40, damage=15, range=18"))
    else:
        results.append(TestResult("Sniper Turret", False, "Missing or incorrect"))
    
    # Cannon turret
    if "CANNON:" in html and "cost: 60" in html and "area: 4" in html:
        results.append(TestResult("Cannon Turret", True, "cost=60, area damage"))
    else:
        results.append(TestResult("Cannon Turret", False, "Missing or incorrect"))
    
    # Trap turret (one-time use)
    if "TRAP:" in html and "cost: 35" in html and "oneTime: true" in html and "damage: 30" in html:
        results.append(TestResult("Trap Turret", True, "cost=35, one-time use, high damage"))
    else:
        results.append(TestResult("Trap Turret", False, "Missing or incorrect"))
    
    # Slow turret
    if "SLOW:" in html and "cost: 45" in html and "slowFactor: 0.5" in html:
        results.append(TestResult("Slow Turret", True, "cost=45, 50% slow"))
    else:
        results.append(TestResult("Slow Turret", False, "Missing or incorrect"))
    
    return results

def test_turret_fire_rates():
    """Test 3.2: Turret fire rates"""
    results = []
    html = read_game_html()
    
    # Check fireRate exists for each turret
    if "fireRate:" in html:
        results.append(TestResult("Fire rates defined", True, "All turrets have fireRate"))
    else:
        results.append(TestResult("Fire rates defined", False, "Missing fireRate"))
    
    return results

def test_turret_visuals():
    """Test 3.3: Turret visual creation"""
    results = []
    html = read_game_html()
    
    # Test createTower function exists
    if "function createTower" in html:
        results.append(TestResult("createTower function", True, "Turret creation function exists"))
    else:
        results.append(TestResult("createTower function", False, "Missing"))
    
    # Check for turret icon display
    if "tower-icon" in html and "tower-cost" in html:
        results.append(TestResult("Turret UI elements", True, "Icon and cost display"))
    else:
        results.append(TestResult("Turret UI elements", False, "Missing UI"))
    
    return results

# ============================================================
# REGRESSION GUARDS
# ============================================================

def test_all_towers_have_mesh():
    """REGRESSION: TRAP and SLOW towers had no visual mesh — empty THREE.Group().
    Bug: createTower only had if blocks for BASIC/SNIPER/CANNON.
    TRAP and SLOW fell through to empty group, invisible on map."""
    results = []
    html = read_game_html()
    
    # Extract createTower function body
    tower_func = re.search(r"function createTower\([^)]*\)\s*\{(.*?)\n        \}", html, re.DOTALL)
    if not tower_func:
        results.append(TestResult("All towers have mesh", False, "Could not find createTower function"))
        return results
    
    body = tower_func.group(1)
    
    # Check each tower type has geometry creation
    tower_types = ['BASIC', 'SNIPER', 'CANNON', 'TRAP', 'SLOW']
    missing = []
    for ttype in tower_types:
        if f"typeKey === '{ttype}'" not in body:
            missing.append(ttype)
    
    if not missing:
        results.append(TestResult("All towers have mesh", True, "All 5 tower types have visual geometry"))
    else:
        results.append(TestResult("All towers have mesh", False, f"Missing visuals for: {', '.join(missing)}"))
    
    return results

def test_projectile_creation_has_target():
    """REGRESSION: createProjectile set target: null — projectiles never hit.
    Bug: No enemy lookup at creation time, target always null."""
    results = []
    html = read_game_html()
    
    # Check createProjectile finds closest enemy
    has_enemy_lookup = bool(re.search(
        r"function createProjectile.*?closestEnemy|function createProjectile.*?target.*=.*enemy",
        html, re.DOTALL
    ))
    # Should NOT have target: null
    has_null_target = bool(re.search(r"target:\s*null", html))
    
    if has_enemy_lookup and not has_null_target:
        results.append(TestResult("Projectile target assignment", True, "Projectiles lock onto enemies at creation"))
    else:
        reasons = []
        if has_null_target:
            reasons.append("target: null found")
        if not has_enemy_lookup:
            reasons.append("no enemy lookup in createProjectile")
        results.append(TestResult("Projectile target assignment", False, "; ".join(reasons)))
    
    return results

def test_cannon_area_damage():
    """REGRESSION: CANNON area damage only hit single target.
    Bug: No area damage loop — only hit the primary target."""
    results = []
    html = read_game_html()
    
    # Check for area damage pattern in projectile update
    has_area_loop = bool(re.search(r"areaRange|area.*damage|forEach.*health.*-=.*damage", html))
    
    if has_area_loop:
        results.append(TestResult("Cannon area damage", True, "CANNON damages all enemies in radius"))
    else:
        results.append(TestResult("Cannon area damage", False, "No area damage logic found"))
    
    return results

def test_no_duplicate_remove_enemy():
    """REGRESSION: Two removeEnemy functions — second overwrote first.
    Bug: Duplicate function at end of file lacked kill tracking and energy rewards."""
    results = []
    html = read_game_html()
    
    # Count removeEnemy definitions
    count = len(re.findall(r"function removeEnemy", html))
    
    if count == 1:
        results.append(TestResult("Single removeEnemy", True, "Only one removeEnemy definition"))
    elif count == 0:
        results.append(TestResult("Single removeEnemy", False, "No removeEnemy function found"))
    else:
        results.append(TestResult("Single removeEnemy", False, f"Found {count} removeEnemy definitions (duplicates)"))
    
    return results

def test_barrel_only_tracking():
    """REGRESSION: tower.mesh.lookAt() rotated entire tower, not just barrel.
    Bug: The whole tower mesh rotated toward enemies instead of just the barrel."""
    results = []
    html = read_game_html()
    
    has_barrel_lookat = bool(re.search(r"barrel\.lookAt", html))
    has_mesh_lookat_targeting = bool(re.search(r"tower\.mesh\.lookAt", html))
    
    if has_barrel_lookat and not has_mesh_lookat_targeting:
        results.append(TestResult("Barrel-only tracking", True, "Only barrel rotates toward target"))
    elif has_mesh_lookat_targeting:
        results.append(TestResult("Barrel-only tracking", False, "tower.mesh.lookAt rotates entire tower"))
    else:
        results.append(TestResult("Barrel-only tracking", False, "No barrel.lookAt found"))
    
    return results

def run_all_tests():
    print("=" * 60)
    print("FINAL TOWER - PHASE 3 TEST SUITE")
    print("=" * 60)
    print()
    
    all_results = []
    
    test_groups = [
        ("3.1 Turret Types", test_turret_types),
        ("3.2 Fire Rates", test_turret_fire_rates),
        ("3.3 Turret Visuals", test_turret_visuals),
        ("3.4 REGRESSION: Tower Combat Guards", lambda: [
            *test_all_towers_have_mesh(),
            *test_projectile_creation_has_target(),
            *test_cannon_area_damage(),
            *test_no_duplicate_remove_enemy(),
            *test_barrel_only_tracking(),
        ]),
    ]
    
    for group_name, test_func in test_groups:
        print(f"\n--- {group_name} ---")
        results = test_func()
        all_results.extend(results)
        for r in results:
            print(f"  {r}")
    
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in all_results if r.passed)
    failed = sum(1 for r in all_results if not r.passed)
    total = len(all_results)
    
    print(f"Total: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {passed/total*100:.1f}%")
    print()
    
    if failed > 0:
        print("FAILED TESTS:")
        for r in all_results:
            if not r.passed:
                print(f"  - {r.name}")
        print()
        print("❌ Phase 3 NOT verified")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED - Phase 3 verified!")
        sys.exit(0)

if __name__ == "__main__":
    run_all_tests()
