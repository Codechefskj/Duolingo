from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, gamification
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[schemas.CourseOut])
def list_courses(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    courses = db.query(models.Course).all()
    return [_serialize_course(db, c, user.id) for c in courses]


@router.get("/{course_id}", response_model=schemas.CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db),
               user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _serialize_course(db, course, user.id)


def _serialize_course(db: Session, course: models.Course, user_id: int) -> dict:
    statuses = gamification.compute_skill_statuses(db, course.id, user_id)

    units_out = []
    for unit in sorted(course.units, key=lambda u: u.order_index):
        skills_out = []
        for skill in sorted(unit.skills, key=lambda s: s.order_index):
            status, crowns = statuses.get(skill.id, ("locked", 0))
            skills_out.append({
                "id": skill.id,
                "order_index": skill.order_index,
                "title": skill.title,
                "icon": skill.icon,
                "max_crowns": skill.max_crowns,
                "crowns_earned": crowns,
                "status": status,
                "lessons": [
                    {"id": l.id, "order_index": l.order_index, "crown_level": l.order_index + 1}
                    for l in sorted(skill.lessons, key=lambda x: x.order_index)
                ],
            })
        units_out.append({
            "id": unit.id,
            "order_index": unit.order_index,
            "title": unit.title,
            "description": unit.description,
            "skills": skills_out,
        })

    return {
        "id": course.id,
        "name": course.name,
        "language_code": course.language_code,
        "units": units_out,
    }
