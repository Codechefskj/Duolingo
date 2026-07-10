"""Current-user resolution — the single seam every route depends on.

Auth precedence:
  1. If an `Authorization: Bearer <token>` header is present, it MUST be
     valid — a bad/expired token is a 401, never a silent fallback.
  2. If no header is present, fall back to the seeded demo learner. This
     keeps the app usable out-of-the-box per the assignment spec
     ('assume a default logged-in learner') while still supporting real
     login for registered users.

Because every route already depends on `get_current_user`, adding token auth
here switched the entire API over without touching a single route handler.
"""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from .database import get_db
from . import models, auth

DEFAULT_USER_ID = 1


def _load_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        user_id = auth.decode_access_token(token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = _load_user(db, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Token refers to unknown user")
        return user

    # No token: demo-learner fallback (spec-permitted default).
    user = _load_user(db, DEFAULT_USER_ID)
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not seeded. Run seed.py.")
    return user
