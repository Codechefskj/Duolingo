from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, gamification
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(tags=["users"])


@router.get("/users/me/stats", response_model=schemas.UserStatsOut)
def get_my_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    stats = user.stats
    gamification.sync_hearts(stats)
    db.commit()
    return schemas.UserStatsOut(
        xp_total=stats.xp_total,
        streak_count=stats.streak_count,
        hearts=stats.hearts,
        hearts_max=stats.hearts_max,
        gems=stats.gems,
        daily_goal_xp=stats.daily_goal_xp,
        xp_today=stats.xp_today,
        hearts_refill_at=stats.hearts_refill_at,
        seconds_to_next_heart=gamification.seconds_to_next_heart(stats),
    )


@router.post("/users/me/hearts/refill")
def refill_hearts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    stats = user.stats
    gamification.sync_hearts(stats)
    ok = gamification.refill_hearts_with_gems(stats)
    if not ok:
        db.commit()
        raise HTTPException(status_code=400, detail="Not enough gems")
    db.commit()
    return {"hearts": stats.hearts, "gems": stats.gems}


@router.get("/users/me/profile", response_model=schemas.ProfileOut)
def get_profile(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    stats = user.stats
    gamification.sync_hearts(stats)

    progress_rows = db.query(models.UserSkillProgress).filter(
        models.UserSkillProgress.user_id == user.id
    ).all()
    skills_completed = sum(1 for p in progress_rows if p.status == "completed")
    total_crowns = sum(p.crowns_earned for p in progress_rows)

    # Full badge catalog with earned flags, so the UI can render locked
    # badges greyed-out like a real achievements screen.
    achievements = [
        schemas.AchievementOut(id="wildfire3", title="Wildfire", icon="🔥",
            description="Reach a 3 day streak", earned=stats.streak_count >= 3),
        schemas.AchievementOut(id="wildfire7", title="Blazing", icon="🔥",
            description="Reach a 7 day streak", earned=stats.streak_count >= 7),
        schemas.AchievementOut(id="sage", title="Sage", icon="⚡",
            description="Earn 100 total XP", earned=stats.xp_total >= 100),
        schemas.AchievementOut(id="scholar", title="Scholar", icon="📚",
            description="Earn 500 total XP", earned=stats.xp_total >= 500),
        schemas.AchievementOut(id="champion", title="Champion", icon="🏅",
            description="Master your first skill", earned=skills_completed >= 1),
        schemas.AchievementOut(id="conqueror", title="Conqueror", icon="👑",
            description="Collect 10 crowns", earned=total_crowns >= 10),
        schemas.AchievementOut(id="moneybags", title="Moneybags", icon="💎",
            description="Hold 500 gems", earned=stats.gems >= 500),
    ]

    db.commit()

    return schemas.ProfileOut(
        username=user.username,
        stats=schemas.UserStatsOut(
            xp_total=stats.xp_total,
            streak_count=stats.streak_count,
            hearts=stats.hearts,
            hearts_max=stats.hearts_max,
            gems=stats.gems,
            daily_goal_xp=stats.daily_goal_xp,
            xp_today=stats.xp_today,
            hearts_refill_at=stats.hearts_refill_at,
            seconds_to_next_heart=gamification.seconds_to_next_heart(stats),
        ),
        skills_completed=skills_completed,
        total_crowns=total_crowns,
        achievements=achievements,
    )


@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntryOut])
def get_leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(models.User, models.UserStats)
        .join(models.UserStats, models.UserStats.user_id == models.User.id)
        .order_by(models.UserStats.xp_total.desc())
        .limit(20)
        .all()
    )
    return [
        schemas.LeaderboardEntryOut(username=u.username, xp_total=s.xp_total,
                                     rank=i + 1, streak_count=s.streak_count)
        for i, (u, s) in enumerate(rows)
    ]
