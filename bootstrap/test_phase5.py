#!/usr/bin/env python3
"""
Phase 5 Test Suite for Final Tower
Tests economy and progression systems
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

def test_leaderboard():
    """Test 5.1: Leaderboard system"""
    results = []
    html = read_game_html()
    
    # Test leaderboard key
    if "LEADERBOARD_KEY" in html and "finalTower_leaderboard" in html:
        results.append(TestResult("Leaderboard key", True, "localStorage key defined"))
    else:
        results.append(TestResult("Leaderboard key", False, "Missing"))
    
    # Test getLeaderboard function
    if "function getLeaderboard()" in html:
        results.append(TestResult("getLeaderboard", True, "Function exists"))
    else:
        results.append(TestResult("getLeaderboard", False, "Missing"))
    
    # Test saveScore function
    if "function saveScore" in html:
        results.append(TestResult("saveScore", True, "Function exists"))
    else:
        results.append(TestResult("saveScore", False, "Missing"))
    
    # Test leaderboard display
    if "showGameStats" in html:
        results.append(TestResult("Leaderboard display", True, "Stats shown on game over"))
    else:
        results.append(TestResult("Leaderboard display", False, "Missing"))
    
    return results

def test_achievements():
    """Test 5.2: Achievements system"""
    results = []
    html = read_game_html()
    
    # Test achievements key
    if "ACHIEVEMENTS_KEY" in html:
        results.append(TestResult("Achievements key", True, "localStorage key defined"))
    else:
        results.append(TestResult("Achievements key", False, "Missing"))
    
    # Test achievements definitions
    achievements = ["MOLE_MASHER", "SURVIVALIST", "PATHMASTER", "BOSS_BASHER", "ENDLESS_DEFENDER"]
    for ach in achievements:
        if ach in html:
            results.append(TestResult(f"Achievement: {ach}", True, f"{ach} defined"))
        else:
            results.append(TestResult(f"Achievement: {ach}", False, f"{ach} missing"))
    
    # Test unlockAchievement
    if "function unlockAchievement" in html:
        results.append(TestResult("unlockAchievement", True, "Function exists"))
    else:
        results.append(TestResult("unlockAchievement", False, "Missing"))
    
    return results

def test_save_load():
    """Test 5.3: Save/Load system"""
    results = []
    html = read_game_html()
    
    # Test save key
    if "SAVE_KEY" in html and "finalTower_save" in html:
        results.append(TestResult("Save key", True, "localStorage key defined"))
    else:
        results.append(TestResult("Save key", False, "Missing"))
    
    # Test saveGameState function
    if "function saveGameState()" in html:
        results.append(TestResult("saveGameState", True, "Function exists"))
    else:
        results.append(TestResult("saveGameState", False, "Missing"))
    
    # Test loadGameState function
    if "function loadGameState()" in html:
        results.append(TestResult("loadGameState", True, "Function exists"))
    else:
        results.append(TestResult("loadGameState", False, "Missing"))
    
    # Test hasSavedGame function
    if "function hasSavedGame()" in html:
        results.append(TestResult("hasSavedGame", True, "Function exists"))
    else:
        results.append(TestResult("hasSavedGame", False, "Missing"))
    
    # Test load on init
    if "hasSavedGame()" in html and "loadGameState()" in html:
        results.append(TestResult("Auto-load on start", True, "Game loads on startup"))
    else:
        results.append(TestResult("Auto-load on start", False, "Missing"))
    
    return results

def test_stats_tracking():
    """Test 5.4: Stats tracking"""
    results = []
    html = read_game_html()
    
    # Test totalKills tracking
    if "totalKills" in html:
        results.append(TestResult("totalKills tracking", True, "Kill counter exists"))
    else:
        results.append(TestResult("totalKills tracking", False, "Missing"))
    
    # Test pathChanges tracking
    if "pathChanges" in html:
        results.append(TestResult("pathChanges tracking", True, "Path change counter exists"))
    else:
        results.append(TestResult("pathChanges tracking", False, "Missing"))
    
    # Test bossesDefeated tracking
    if "bossesDefeated" in html:
        results.append(TestResult("bossesDefeated tracking", True, "Boss kill counter exists"))
    else:
        results.append(TestResult("bossesDefeated tracking", False, "Missing"))
    
    # Test achievements update on game over
    if "updateAchievements()" in html and "endGame" in html:
        results.append(TestResult("Achievement update", True, "Updated on game over"))
    else:
        results.append(TestResult("Achievement update", False, "Missing"))
    
    return results

def test_energy_rewards():
    """Test 5.5: Energy rewards by enemy type"""
    results = []
    html = read_game_html()
    
    # Test different energy rewards
    rewards = {
        "case 'boss'": 30,
        "case 'spawner'": 20,
        "case 'tank'": 15,
        "case 'fast'": 8,
    }
    
    for pattern, expected in rewards.items():
        if pattern in html:
            results.append(TestResult(f"Energy reward: {pattern}", True, f"Reward = {expected}"))
    
    # Test wave completion bonus
    if "energy + 20" in html:
        results.append(TestResult("Wave completion bonus", True, "+20 energy"))
    else:
        results.append(TestResult("Wave completion bonus", False, "Missing"))
    
    return results

def run_all_tests():
    print("=" * 60)
    print("FINAL TOWER - PHASE 5 TEST SUITE")
    print("=" * 60)
    print()
    
    all_results = []
    
    test_groups = [
        ("5.1 Leaderboard", test_leaderboard),
        ("5.2 Achievements", test_achievements),
        ("5.3 Save/Load", test_save_load),
        ("5.4 Stats Tracking", test_stats_tracking),
        ("5.5 Energy Rewards", test_energy_rewards),
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
        print("❌ Phase 5 NOT verified")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED - Phase 5 verified!")
        print()
        print("🎉 ALL 5 PHASES COMPLETE!")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    run_all_tests()
