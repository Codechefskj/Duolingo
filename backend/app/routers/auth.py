"""Auth routes: register + login. Both return a JWT the client sends back as
`Authorization: Bearer <token>` on every subsequent request.

A newly-registered user is bootstrapped with the same starting state the seed
script gives a fresh learner: a UserStats row (full hearts, 0 XP) and an
'available' UserSkillProgress on the first skill of the course, so the skill
tree has an unlocked entry point immediately.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, gamification
from ..database import get_db

router = APIRouter(tags=["auth"])


def _bootstrap_new_user(db: Session, user: models.User) -> None:
    """Give a brand-new user the same starting state as a seeded learner."""
    db.add(models.UserStats(
        user_id=user.id,
        xp_total=0,
        streak_count=0,
        last_active_date=None,
        hearts=5,
        hearts_max=5,
        gems=500,
        daily_goal_xp=30,
        xp_today=0,
        xp_today_date=date.today(),
    ))
    # Unlock the very first skill (flattened order) so the path isn't fully
    # locked. Every later skill is derived from crown progress at read time.
    first_course = db.query(models.Course).order_by(models.Course.id).first()
    if first_course:
        skills = gamification.ordered_skills_for_course(db, first_course.id)
        if skills:
            db.add(models.UserSkillProgress(
                user_id=user.id, skill_id=skills[0].id,
                crowns_earned=0, status="available",
            ))


@router.post("/auth/register", response_model=schemas.TokenOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = models.User(
        username=body.username,
        password_hash=auth.hash_password(body.password),
    )
    db.add(user)
    db.flush()  # assign user.id before bootstrapping related rows

    _bootstrap_new_user(db, user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return schemas.TokenOut(access_token=token, user_id=user.id, username=user.username)


@router.post("/auth/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    # Same generic error whether the username is unknown or the password is
    # wrong, so the endpoint doesn't leak which usernames exist.
    if not user or not user.password_hash or not auth.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = auth.create_access_token(user.id)
    return schemas.TokenOut(access_token=token, user_id=user.id, username=user.username)
