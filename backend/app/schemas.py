"""Pydantic schemas — API-facing shapes, separate from ORM models so we
never accidentally leak internal columns (e.g. correct_answer) to the client."""
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, field_validator


# ---------- Auth ----------

class RegisterIn(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("password must be at least 6 characters")
        return v


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


# ---------- Stats / gamification ----------

class UserStatsOut(BaseModel):
    xp_total: int
    streak_count: int
    hearts: int
    hearts_max: int
    gems: int
    daily_goal_xp: int
    xp_today: int
    hearts_refill_at: Optional[datetime] = None
    seconds_to_next_heart: Optional[int] = None

    class Config:
        from_attributes = True


class AchievementOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    earned: bool


class CompleteIn(BaseModel):
    """Optional body for lesson completion; mode='legendary' doubles XP."""
    mode: Optional[str] = None


class ProfileOut(BaseModel):
    username: str
    stats: UserStatsOut
    skills_completed: int
    total_crowns: int
    achievements: list[AchievementOut]


class LeaderboardEntryOut(BaseModel):
    username: str
    xp_total: int
    rank: int
    streak_count: int


# ---------- Course / path ----------

class ExercisePublicOut(BaseModel):
    """Exercise shape sent to the client BEFORE answering — no correct_answer."""
    id: int
    order_index: int
    type: str
    prompt: str
    options: Any  # parsed JSON, shape depends on `type`

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    order_index: int
    crown_level: int

    class Config:
        from_attributes = True


class SkillOut(BaseModel):
    id: int
    order_index: int
    title: str
    icon: str
    max_crowns: int
    crowns_earned: int
    status: str  # locked | available | completed
    lessons: list[LessonOut]

    class Config:
        from_attributes = True


class UnitOut(BaseModel):
    id: int
    order_index: int
    title: str
    description: str
    skills: list[SkillOut]

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: int
    name: str
    language_code: str
    units: list[UnitOut]

    class Config:
        from_attributes = True


# ---------- Lesson play loop ----------

class LessonStartOut(BaseModel):
    lesson_attempt_id: int
    lesson_id: int
    skill_title: str
    exercises: list[ExercisePublicOut]
    hearts: int


class AnswerIn(BaseModel):
    exercise_id: int
    answer: Any  # string for most types, dict/list for match pairs


class AnswerOut(BaseModel):
    is_correct: bool
    correct_answer: Any
    hearts_remaining: int
    out_of_hearts: bool


class LessonCompleteOut(BaseModel):
    xp_earned: int
    accuracy: float
    new_crowns: int
    new_streak: int
    leveled_up_skill: bool
    daily_goal_met: bool
