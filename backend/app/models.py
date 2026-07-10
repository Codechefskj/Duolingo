"""
SQLAlchemy models.

Schema overview (see README for the full ER description):

  User 1---1 UserStats
  Course 1---N Unit 1---N Skill 1---N Lesson 1---N Exercise
  User 1---N UserSkillProgress N---1 Skill
  User 1---N LessonAttempt N---1 Lesson
  LessonAttempt 1---N ExerciseAttempt N---1 Exercise

Design notes:
- `exercises.options_json` holds a JSON blob whose shape depends on `type`.
  A single flexible table beats 5 near-duplicate exercise tables; the
  tradeoff is losing DB-level shape validation, which we push into the
  Pydantic schemas / service layer instead.
- Skill unlock state is NOT stored as a column. It's derived at read time
  from ordering + `UserSkillProgress.crowns_earned`, so there's no
  "unlocked" flag that can drift out of sync with progress.
- Leaderboard is derived from `UserStats.xp_total` across seeded users
  rather than a separate weekly-rollup table (documented simplification).
"""
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    # Nullable so pre-auth seeded users (and the demo learner) remain valid;
    # a user with no hash simply can't authenticate via password.
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stats = relationship("UserStats", back_populates="user", uselist=False,
                          cascade="all, delete-orphan")
    skill_progress = relationship("UserSkillProgress", back_populates="user",
                                   cascade="all, delete-orphan")
    lesson_attempts = relationship("LessonAttempt", back_populates="user",
                                    cascade="all, delete-orphan")


class UserStats(Base):
    """1:1 with User. Kept separate from User so hot-path gamification
    fields don't bloat the identity row."""
    __tablename__ = "user_stats"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    xp_total = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    hearts = Column(Integer, default=5)
    hearts_max = Column(Integer, default=5)
    hearts_refill_at = Column(DateTime, nullable=True)  # timestamp regen clock started
    gems = Column(Integer, default=500)
    daily_goal_xp = Column(Integer, default=30)
    xp_today = Column(Integer, default=0)
    xp_today_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="stats")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    language_code = Column(String, nullable=False)

    units = relationship("Unit", back_populates="course",
                          order_by="Unit.order_index", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, default="")

    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit",
                           order_by="Skill.order_index", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    icon = Column(String, default="star")
    max_crowns = Column(Integer, default=3)

    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill",
                            order_by="Lesson.order_index", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order_index = Column(Integer, nullable=False)  # also doubles as crown level - 1

    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson",
                              order_by="Exercise.order_index", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    type = Column(String, nullable=False)  # multiple_choice | translate | match | fill_blank | type_answer
    prompt = Column(String, nullable=False)
    correct_answer = Column(Text, nullable=False)  # JSON-encoded when composite (e.g. match pairs)
    options_json = Column(Text, default="{}")  # shape depends on `type`

    lesson = relationship("Lesson", back_populates="exercises")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    crowns_earned = Column(Integer, default=0)
    status = Column(String, default="locked")  # locked | available | completed
    last_practiced_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="skill_progress")
    skill = relationship("Skill")


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    xp_earned = Column(Integer, default=0)
    hearts_lost = Column(Integer, default=0)
    status = Column(String, default="in_progress")  # in_progress | completed | failed

    user = relationship("User", back_populates="lesson_attempts")
    lesson = relationship("Lesson")
    exercise_attempts = relationship("ExerciseAttempt", back_populates="lesson_attempt",
                                      cascade="all, delete-orphan")


class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id = Column(Integer, primary_key=True)
    lesson_attempt_id = Column(Integer, ForeignKey("lesson_attempts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    lesson_attempt = relationship("LessonAttempt", back_populates="exercise_attempts")
    exercise = relationship("Exercise")
