import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, gamification, exercise_check
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(tags=["lessons"])

@router.post("/lessons/{lesson_id}/start", response_model=schemas.LessonStartOut)
def start_lesson(lesson_id: int, db: Session = Depends(get_db),
                  user: models.User = Depends(get_current_user)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    stats = user.stats
    gamification.sync_hearts(stats)
    if stats.hearts <= 0:
        raise HTTPException(status_code=400, detail="Out of hearts")
    db.commit()

    attempt = models.LessonAttempt(user_id=user.id, lesson_id=lesson.id, status="in_progress")
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    exercises_out = [
        schemas.ExercisePublicOut(
            id=e.id,
            order_index=e.order_index,
            type=e.type,
            prompt=e.prompt,
            options=json.loads(e.options_json or "{}"),
        )
        for e in sorted(lesson.exercises, key=lambda x: x.order_index)
    ]

    return schemas.LessonStartOut(
        lesson_attempt_id=attempt.id,
        lesson_id=lesson.id,
        skill_title=lesson.skill.title,
        exercises=exercises_out,
        hearts=stats.hearts,
    )


@router.post("/lesson-attempts/{attempt_id}/answer", response_model=schemas.AnswerOut)
def submit_answer(attempt_id: int, body: schemas.AnswerIn, db: Session = Depends(get_db),
                   user: models.User = Depends(get_current_user)):
    attempt = db.query(models.LessonAttempt).filter(
        models.LessonAttempt.id == attempt_id, models.LessonAttempt.user_id == user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Lesson attempt not found")
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Lesson attempt already finished")

    exercise = db.query(models.Exercise).filter(models.Exercise.id == body.exercise_id).first()
    if not exercise or exercise.lesson_id != attempt.lesson_id:
        raise HTTPException(status_code=400, detail="Exercise does not belong to this lesson")

    is_correct = exercise_check.check_answer(exercise.type, exercise.correct_answer, body.answer)

    db.add(models.ExerciseAttempt(
        lesson_attempt_id=attempt.id,
        exercise_id=exercise.id,
        user_answer=json.dumps(body.answer),
        is_correct=is_correct,
    ))

    stats = user.stats
    out_of_hearts = False
    if not is_correct:
        gamification.lose_heart(stats)
        attempt.hearts_lost += 1
        if stats.hearts <= 0:
            attempt.status = "failed"
            out_of_hearts = True

    db.commit()

    correct_answer_parsed = json.loads(exercise.correct_answer)

    return schemas.AnswerOut(
        is_correct=is_correct,
        correct_answer=correct_answer_parsed,
        hearts_remaining=stats.hearts,
        out_of_hearts=out_of_hearts,
    )


@router.post("/lesson-attempts/{attempt_id}/complete", response_model=schemas.LessonCompleteOut)
def complete_lesson(attempt_id: int, body: schemas.CompleteIn | None = None,
                     db: Session = Depends(get_db),
                     user: models.User = Depends(get_current_user)):
    attempt = db.query(models.LessonAttempt).filter(
        models.LessonAttempt.id == attempt_id, models.LessonAttempt.user_id == user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Lesson attempt not found")
    if attempt.status == "completed":
        raise HTTPException(status_code=400, detail="Already completed")

    exercise_attempts = attempt.exercise_attempts
    total = len(exercise_attempts)
    correct = sum(1 for ea in exercise_attempts if ea.is_correct)
    accuracy = (correct / total) if total else 0.0

    xp_earned = correct * gamification.XP_PER_CORRECT_ANSWER
    lesson_passed = attempt.status != "failed"
    if lesson_passed:
        xp_earned += gamification.XP_LESSON_COMPLETION_BONUS
        # Legendary (timed) mode pays double XP on success
        if body and body.mode == "legendary":
            xp_earned *= 2
        attempt.status = "completed"
    attempt.completed_at = datetime.utcnow()
    attempt.xp_earned = xp_earned

    stats = user.stats
    daily_goal_met = gamification.update_streak_and_xp(stats, xp_earned)

    new_crowns = 0
    leveled_up_skill = False
    if lesson_passed:
        lesson = attempt.lesson
        skill = lesson.skill
        progress = db.query(models.UserSkillProgress).filter(
            models.UserSkillProgress.user_id == user.id,
            models.UserSkillProgress.skill_id == skill.id,
        ).first()
        if not progress:
            progress = models.UserSkillProgress(
                user_id=user.id, skill_id=skill.id, crowns_earned=0, status="available"
            )
            db.add(progress)

        # crown level == (lesson order_index + 1); only advances if this
        # lesson is the next sequential one for the skill (no skipping ahead)
        if lesson.order_index + 1 > progress.crowns_earned:
            progress.crowns_earned = lesson.order_index + 1
            leveled_up_skill = True
        progress.last_practiced_at = datetime.utcnow()
        if progress.crowns_earned >= skill.max_crowns:
            progress.status = "completed"
        new_crowns = progress.crowns_earned

    db.commit()

    return schemas.LessonCompleteOut(
        xp_earned=xp_earned,
        accuracy=round(accuracy, 2),
        new_crowns=new_crowns,
        new_streak=stats.streak_count,
        leveled_up_skill=leveled_up_skill,
        daily_goal_met=daily_goal_met,
    )