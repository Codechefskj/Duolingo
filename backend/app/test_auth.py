"""
Integration tests for the auth flow, using FastAPI's TestClient against an
isolated in-memory SQLite database (the real duolingo.db is never touched).

Covers: register -> login -> authenticated request, plus the failure paths
that matter for security — wrong password, duplicate username, expired token,
malformed header, and demo-user fallback when no token is sent.

Run with: python -m pytest app/test_auth.py -v
"""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, auth
from app.database import Base, get_db
from app.main import app


# ---- isolated in-memory DB shared across the test session ----

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # one shared connection so :memory: persists
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def fresh_db():
    """Rebuild schema + a minimal course/demo-user before every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Minimal course so register's skill-bootstrap has something to unlock.
    course = models.Course(name="Spanish", language_code="es")
    db.add(course)
    db.flush()
    unit = models.Unit(course_id=course.id, order_index=0, title="Unit 1")
    db.add(unit)
    db.flush()
    skill = models.Skill(unit_id=unit.id, order_index=0, title="Greetings")
    db.add(skill)
    # Demo user (id=1) so the no-token fallback path is exercisable.
    demo = models.User(username="demo", password_hash=None)
    db.add(demo)
    db.flush()
    db.add(models.UserStats(user_id=demo.id, hearts=5, hearts_max=5, gems=500,
                            daily_goal_xp=30))
    db.commit()
    db.close()
    yield


client = TestClient(app)


# ---------- register ----------

def test_register_returns_token_and_creates_user():
    r = client.post("/auth/register", json={"username": "alice", "password": "hunter2"})
    assert r.status_code == 201
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["username"] == "alice"
    assert auth.decode_access_token(body["access_token"]) == body["user_id"]


def test_register_bootstraps_stats_and_first_skill():
    r = client.post("/auth/register", json={"username": "bob", "password": "secret1"})
    token = r.json()["access_token"]
    # The new user's stats endpoint works with their own token.
    stats = client.get("/users/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats.status_code == 200
    assert stats.json()["xp_total"] == 0
    assert stats.json()["hearts"] == 5


def test_register_duplicate_username_conflicts():
    client.post("/auth/register", json={"username": "carol", "password": "secret1"})
    r = client.post("/auth/register", json={"username": "carol", "password": "other1"})
    assert r.status_code == 409


def test_register_rejects_short_password():
    r = client.post("/auth/register", json={"username": "dave", "password": "x"})
    assert r.status_code == 422  # pydantic validation


# ---------- login ----------

def test_login_success():
    client.post("/auth/register", json={"username": "erin", "password": "hunter2"})
    r = client.post("/auth/login", json={"username": "erin", "password": "hunter2"})
    assert r.status_code == 200
    assert auth.decode_access_token(r.json()["access_token"]) == r.json()["user_id"]


def test_login_wrong_password_rejected():
    client.post("/auth/register", json={"username": "frank", "password": "hunter2"})
    r = client.post("/auth/login", json={"username": "frank", "password": "wrongpw"})
    assert r.status_code == 401


def test_login_unknown_user_rejected():
    r = client.post("/auth/login", json={"username": "ghost", "password": "whatever"})
    assert r.status_code == 401


# ---------- protected route / token handling ----------

def test_protected_route_with_no_token_falls_back_to_demo():
    # No Authorization header -> demo user (id=1) per spec.
    r = client.get("/users/me/stats")
    assert r.status_code == 200


def test_protected_route_with_valid_token_uses_that_user():
    reg = client.post("/auth/register", json={"username": "heidi", "password": "hunter2"})
    token = reg.json()["access_token"]
    profile = client.get("/users/me/profile", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    assert profile.json()["username"] == "heidi"


def test_expired_token_rejected():
    reg = client.post("/auth/register", json={"username": "ivan", "password": "hunter2"})
    uid = reg.json()["user_id"]
    past = datetime.utcnow() - timedelta(days=30)
    expired = auth.create_access_token(uid, now=past, expires_delta=timedelta(minutes=5))
    r = client.get("/users/me/stats", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_malformed_authorization_header_rejected():
    r = client.get("/users/me/stats", headers={"Authorization": "Basic abc123"})
    assert r.status_code == 401


def test_tampered_token_rejected():
    reg = client.post("/auth/register", json={"username": "judy", "password": "hunter2"})
    token = reg.json()["access_token"]
    r = client.get("/users/me/stats", headers={"Authorization": f"Bearer {token}xyz"})
    assert r.status_code == 401
