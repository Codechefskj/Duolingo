"""
Unit tests for gamification.py, using simulated `now`/`today` values instead
of real elapsed time or sleeping — this is exactly why every gamification
function takes time as a parameter rather than calling utcnow()/today()
internally.

Run with: python -m pytest app/test_gamification.py -v
"""
from datetime import datetime, date, timedelta

from app import models, gamification

def make_stats(**overrides) -> models.UserStats:
    defaults = dict(
        user_id=1, xp_total=0, streak_count=0, last_active_date=None,
        hearts=5, hearts_max=5, hearts_refill_at=None, gems=500,
        daily_goal_xp=30, xp_today=0, xp_today_date=None,
    )
    defaults.update(overrides)
    return models.UserStats(**defaults)


# ---------- Streak logic ----------

def test_streak_first_ever_activity():
    stats = make_stats(last_active_date=None)
    gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert stats.streak_count == 1


def test_streak_same_day_is_noop():
    stats = make_stats(streak_count=4, last_active_date=date(2026, 7, 10))
    gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert stats.streak_count == 4


def test_streak_consecutive_day_increments():
    stats = make_stats(streak_count=4, last_active_date=date(2026, 7, 9))
    gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert stats.streak_count == 5


def test_streak_gap_resets_to_one():
    stats = make_stats(streak_count=12, last_active_date=date(2026, 7, 1))
    gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert stats.streak_count == 1


def test_daily_goal_met_flag():
    stats = make_stats(daily_goal_xp=30, xp_today=25, xp_today_date=date(2026, 7, 10),
                        last_active_date=date(2026, 7, 10))
    met = gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert met is True
    assert stats.xp_today == 35


def test_xp_today_resets_on_new_day():
    stats = make_stats(xp_today=25, xp_today_date=date(2026, 7, 9),
                        last_active_date=date(2026, 7, 9))
    gamification.update_streak_and_xp(stats, 10, today=date(2026, 7, 10))
    assert stats.xp_today == 10  # not 35 — yesterday's xp_today shouldn't carry over


# ---------- Hearts regen ----------

def test_hearts_full_no_regen_needed():
    stats = make_stats(hearts=5, hearts_max=5, hearts_refill_at=None)
    assert gamification.compute_current_hearts(stats) == 5


def test_hearts_regen_after_one_interval():
    now = datetime(2026, 7, 10, 12, 0, 0)
    stats = make_stats(hearts=3, hearts_max=5,
                        hearts_refill_at=now - gamification.HEART_REGEN_INTERVAL - timedelta(minutes=1))
    assert gamification.compute_current_hearts(stats, now) == 4


def test_hearts_regen_caps_at_max():
    now = datetime(2026, 7, 10, 12, 0, 0)
    stats = make_stats(hearts=3, hearts_max=5,
                        hearts_refill_at=now - gamification.HEART_REGEN_INTERVAL * 10)
    assert gamification.compute_current_hearts(stats, now) == 5


def test_hearts_no_regen_before_interval_elapses():
    now = datetime(2026, 7, 10, 12, 0, 0)
    stats = make_stats(hearts=3, hearts_max=5, hearts_refill_at=now - timedelta(minutes=5))
    assert gamification.compute_current_hearts(stats, now) == 3


def test_lose_heart_starts_regen_clock():
    stats = make_stats(hearts=5, hearts_max=5, hearts_refill_at=None)
    now = datetime(2026, 7, 10, 12, 0, 0)
    gamification.lose_heart(stats, now)
    assert stats.hearts == 4
    assert stats.hearts_refill_at == now


def test_lose_heart_does_not_reset_existing_clock():
    started_at = datetime(2026, 7, 10, 11, 0, 0)
    stats = make_stats(hearts=4, hearts_max=5, hearts_refill_at=started_at)
    later = datetime(2026, 7, 10, 11, 10, 0)
    gamification.lose_heart(stats, later)
    assert stats.hearts == 3
    assert stats.hearts_refill_at == started_at  # clock doesn't restart on subsequent losses


def test_sync_hearts_clears_clock_once_full():
    now = datetime(2026, 7, 10, 12, 0, 0)
    stats = make_stats(hearts=4, hearts_max=5,
                        hearts_refill_at=now - gamification.HEART_REGEN_INTERVAL * 5)
    gamification.sync_hearts(stats, now)
    assert stats.hearts == 5
    assert stats.hearts_refill_at is None


def test_refill_hearts_with_gems_success():
    stats = make_stats(hearts=1, hearts_max=5, gems=500)
    ok = gamification.refill_hearts_with_gems(stats, cost=350)
    assert ok is True
    assert stats.hearts == 5
    assert stats.gems == 150


def test_refill_hearts_with_gems_insufficient_funds():
    stats = make_stats(hearts=1, hearts_max=5, gems=100)
    ok = gamification.refill_hearts_with_gems(stats, cost=350)
    assert ok is False
    assert stats.hearts == 1
    assert stats.gems == 100
