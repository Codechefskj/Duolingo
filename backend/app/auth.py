"""
Authentication: password hashing (bcrypt) + stateless JWT access tokens.

Kept as small pure-ish helpers — token creation takes `now`/`expires_delta`
rather than reading the clock internally, so expiry logic is unit-testable
without sleeping (same philosophy as gamification.py).

Real auth was out of scope per the spec ('assume a default logged-in
learner'), so this is an intentional extra. The rest of the app already
routes every request through deps.get_current_user, so switching from the
hardcoded demo user to real token auth touches only that one seam.

Env vars (with dev-safe fallbacks):
  JWT_SECRET        - signing key. MUST be overridden in production.
  JWT_EXPIRE_MIN    - access-token lifetime in minutes (default 7 days).
"""
import os
from datetime import datetime, timedelta

import bcrypt
import jwt  # PyJWT

JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", str(60 * 24 * 7)))  # 7 days


# ---------- password hashing ----------

def hash_password(plain: str) -> str:
    """Bcrypt-hash a plaintext password. Returns a str safe to store in a
    TEXT column. Bcrypt auto-generates and embeds a per-password salt, so
    two identical passwords produce different hashes."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time comparison of a candidate password against a stored hash.
    Returns False on any malformed hash rather than raising."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------- JWT access tokens ----------

def create_access_token(user_id: int, now: datetime | None = None,
                        expires_delta: timedelta | None = None) -> str:
    """Encode a signed JWT whose subject is the user id. `now`/`expires_delta`
    are injectable so tests can mint already-expired or future tokens."""
    now = now or datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=JWT_EXPIRE_MIN))
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Return the user id from a valid token, or None if the token is
    invalid, tampered, or expired. Never raises — the caller turns None
    into a 401."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    if sub is None:
        return None
    try:
        return int(sub)
    except (ValueError, TypeError):
        return None
