"""
IRIS Bootstrap — Session Start
File: bootstrap/session_start.py

Run this as the FIRST command of every session and after every context condense.
Reads the coordinate database and prints the current state into the context window.
The agent reads this output to know where it is, what it built, what to avoid.

Usage:
    python3 bootstrap/session_start.py
    python3 bootstrap/session_start.py --compact    # shorter output for post-condense
    python3 bootstrap/session_start.py --gate       # just show current gate status
"""

import sys
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

sys.path.insert(0, SCRIPT_DIR)

from coordinates import CoordinateStore, LANDMARK_THRESHOLD


def get_current_gate(store: CoordinateStore) -> tuple[int, str]:
    """
    Determine which gate the agent is currently on.
    Returns (gate_number, gate_status_description)
    """
    landmarks = store.get_landmarks(permanent_only=True)
    permanent_names = {lm["name"] for lm in landmarks}

    if "tower_defense_game" not in permanent_names:
        return 0, "SESSION 1 — Build the tower defense game foundation"

    return 1, "GATE 1 — Game Implementation | In Progress"


def print_full_state(store: CoordinateStore):
    """Full state output for session start."""
    session_count  = store.get_session_count()
    landmarks      = store.get_landmarks()
    permanent      = [l for l in landmarks if l["is_permanent"]]
    developing     = [l for l in landmarks if not l["is_permanent"]]
    warnings       = store.get_active_warnings(session_count)
    contracts      = store.get_active_contracts()
    gate_num, gate_desc = get_current_gate(store)

    conf = min(0.20 + (len(permanent) * 0.05), 0.95)

    if len(permanent) == 0:
        maturity = "immature"
    elif len(permanent) < 3:
        maturity = "developing"
    elif len(permanent) < 8:
        maturity = "active"
    else:
        maturity = "mature"

    print("=" * 65)
    print("TOWER DEFENSE — SESSION START")
    print("=" * 65)
    print(f"Sessions completed:  {session_count}")
    print(f"Graph maturity:      {maturity}")
    print(f"Confidence:          {conf:.2f}")
    print(f"Permanent landmarks: {len(permanent)}")
    print()
    print(f"CURRENT GATE: {gate_desc}")
    print()

    print("PERMANENT LANDMARKS (verified features):")
    if permanent:
        for lm in permanent:
            print(f"  [+] {lm['name']}")
            print(f"      {lm['description'][:70]}")
    else:
        print("  none yet - game in development")

    if developing:
        print()
        print("DEVELOPING (needs more test passes to crystallize):")
        for lm in developing:
            print(
                f"  [~] {lm['name']} "
                f"({lm['pass_count']}/{LANDMARK_THRESHOLD} passes)"
            )

    print()
    print("GRADIENT WARNINGS (past bugs to avoid):")
    if warnings:
        for w in warnings[-5:]:
            print(f"  [{w['space']}] {w['description'][:70]}")
            if w["correction"]:
                print(f"    → fix: {w['correction'][:60]}")
    else:
        print("  none recorded yet")

    if contracts:
        print()
        print("ACTIVE CONTRACTS (rules from corrections):")
        for c in contracts:
            print(f"  [{c['confidence']:.2f}] {c['rule'][:75]}")

    try:
        graph_summary = store.get_graph_summary()
        total_ev = graph_summary["total_events"]
        if total_ev > 0:
            print()
            print(f"CODE GRAPH: {total_ev} events | {graph_summary['file_nodes']} files")
    except Exception:
        pass

    print()
    print("CONTEXT WINDOW REMINDER:")
    print("  Target: stay under 55k tokens")
    print("  At 50-55k: run python3 bootstrap/mid_session_snapshot.py")
    print()
    print("OBJECTIVE ANCHOR:")
    print("  Deliver a fully functional Tower Defense game with all features")
    print("  and complete UI/UX design working.")
    print("=" * 65)
    print()
    print("Read tower-defense.html to continue development.")
    print()


def print_compact_state(store: CoordinateStore):
    """Compact state for after context condense."""
    session_count = store.get_session_count()
    permanent     = store.get_landmarks(permanent_only=True)
    warnings      = store.get_active_warnings(session_count)
    gate_num, gate_desc = get_current_gate(store)

    print("--- TOWER DEFENSE STATE (post-condense) ---")
    print(f"Gate: {gate_desc}")
    print(f"Permanent landmarks: {len(permanent)}")

    if permanent:
        print("Recent:")
        for lm in permanent[-3:]:
            print(f"  [+] {lm['name']}: {lm['description'][:55]}")

    if warnings:
        print("Warnings (last 3):")
        for w in warnings[-3:]:
            print(f"  [{w['space']}] {w['description'][:60]}")

    print(f"Objective: Deliver fully functional Tower Defense game")
    print("--- END COORDINATE STATE ---")
    print()


def print_gate_only(store: CoordinateStore):
    """Just show current gate status."""
    gate_num, gate_desc = get_current_gate(store)
    permanent = store.get_landmarks(permanent_only=True)
    print(f"Current gate: {gate_desc}")
    print(f"Permanent landmarks: {len(permanent)}")


if __name__ == "__main__":
    db_path = os.path.join(SCRIPT_DIR, "coordinates.db")

    if not os.path.exists(db_path):
        print("=" * 65)
        print("TOWER DEFENSE — FIRST RUN DETECTED")
        print("=" * 65)
        print()
        print("No coordinate database found.")
        print("This is your first session.")
        print()
        print("Working on: tower-defense.html")
        print("Objective: Build a fully functional Tower Defense game")
        print("=" * 65)
        sys.exit(0)

    store = CoordinateStore(db_path)

    if "--compact" in sys.argv:
        print_compact_state(store)
    elif "--gate" in sys.argv:
        print_gate_only(store)
    else:
        print_full_state(store)