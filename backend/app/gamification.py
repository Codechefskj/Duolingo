"""
Gamification rules, kept as pure-ish functions (a `now`/`today` parameter is
always accepted rather than calling datetime.utcnow() internally) so unit
tests can simulate "a day passed" or "3 hours passed" without sleeping or
mocking global time.
"""
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from . import models

HEART_REGEN_INTERVAL = timedelta(minutes=30)  # 1 heart per 30 min, tune freely
XP_PER_CORRECT_ANSWER = 10
XP_LESSON_COMPLETION_BONUS = 10


def compute_current_hearts(stats: models.UserStats, now: datetime | None = None) -> int:
    """Lazily derive hearts from elapsed time instead of running a cron job.

    If hearts are already full, or regen was never started, no computation
    needed. Otherwise: how many regen intervals have elapsed since
    `hearts_refill_at`, capped at hearts_max.
    """
    now = now or datetime.utcnow()
    if stats.hearts >= stats.hearts_max or stats.hearts_refill_at is None:
        return stats.hearts

    elapsed = now - stats.hearts_refill_at
    regenerated = int(elapsed / HEART_REGEN_INTERVAL)
    return min(stats.hearts_max, stats.hearts + regenerated)


def seconds_to_next_heart(stats: models.UserStats, now: datetime | None = None) -> int | None:
    now = now or datetime.utcnow()
    current = compute_current_hearts(stats, now)
    if current >= stats.hearts_max or stats.hearts_refill_at is None:
        return None
    elapsed = now - stats.hearts_refill_at
    remainder = HEART_REGEN_INTERVAL - (elapsed % HEART_REGEN_INTERVAL)
    return int(remainder.total_seconds())


def sync_hearts(stats: models.UserStats, now: datetime | None = None) -> None:
    """Materialize the lazily-computed heart count back onto the row.
    Call this at the start of any request that reads or spends hearts."""
    now = now or datetime.utcnow()
    new_hearts = compute_current_hearts(stats, now)
    if new_hearts != stats.hearts:
        stats.hearts = new_hearts
    if stats.hearts >= stats.hearts_max:
        stats.hearts_refill_at = None
    elif stats.hearts_refill_at is None:
        # Defensive: hearts are below max but no regen clock is running
        # (shouldn't happen via normal gameplay since lose_heart always
        # starts the clock, but guards against direct DB edits/migrations
        # ever leaving hearts permanently stuck).
        stats.hearts_refill_at = now


def lose_heart(stats: models.UserStats, now: datetime | None = None) -> None:
    now = now or datetime.utcnow()
    sync_hearts(stats, now)
    if stats.hearts > 0:
        stats.hearts -= 1
        if stats.hearts_refill_at is None:
            stats.hearts_refill_at = now


def refill_hearts_with_gems(stats: models.UserStats, cost: int = 350) -> bool:
    """Mocked 'practice/refill' purchase."""
    if stats.gems < cost:
        return False
    stats.gems -= cost
    stats.hearts = stats.hearts_max
    stats.hearts_refill_at = None
    return True


def update_streak_and_xp(stats: models.UserStats, xp_earned: int, today: date | None = None) -> bool:
    """Updates streak_count and xp_today based on activity date logic.
    Returns True if the daily XP goal was met as a result of this update."""
    today = today or date.today()

    if stats.last_active_date == today:
        pass  # already active today, streak unchanged
    elif stats.last_active_date == today - timedelta(days=1):
        stats.streak_count += 1
    else:
        stats.streak_count = 1  # missed a day (or first ever activity) -> reset

    if stats.xp_today_date != today:
        stats.xp_today = 0
        stats.xp_today_date = today

    stats.xp_today += xp_earned
    stats.xp_total += xp_earned
    stats.last_active_date = today

    return stats.xp_today >= stats.daily_goal_xp


def ordered_skills_for_course(db: Session, course_id: int) -> list[models.Skill]:
    """Flatten unit->skill ordering into a single sequence, which is what
    unlock-progression is computed against."""
    units = (
        db.query(models.Unit)
        .filter(models.Unit.course_id == course_id)
        .order_by(models.Unit.order_index)
        .all()
    )
    skills: list[models.Skill] = []
    for unit in units:
        skills.extend(sorted(unit.skills, key=lambda s: s.order_index))
    return skills

def compute_skill_statuses(db: Session, course_id: int, user_id: int) -> dict[int, tuple[str, int]]:
    """Single source of truth for lock/unlock state — computed fresh each
    request instead of stored, so it can never drift from actual progress."""
    skills = ordered_skills_for_course(db, course_id)
    progress_rows = (
        db.query(models.UserSkillProgress)
        .filter(models.UserSkillProgress.user_id == user_id)
        .all()
    )
    progress_by_skill = {p.skill_id: p for p in progress_rows}

    result: dict[int, tuple[str, int]] = {}
    prev_crowns = None
    for i, skill in enumerate(skills):
        prog = progress_by_skill.get(skill.id)
        crowns = prog.crowns_earned if prog else 0

        if crowns >= skill.max_crowns:
            status = "completed"
        elif i == 0 or (prev_crowns is not None and prev_crowns >= 1):
            status = "available"
        else:
            status = "locked"

        result[skill.id] = (status, crowns)
        prev_crowns = crowns
    return result
