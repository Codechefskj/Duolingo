# Lingo — Duolingo-style Web App

A functional clone of Duolingo's learning path, lesson player, and gamification loop —
built with Next.js (TypeScript) + FastAPI + SQLite.

## Tech Stack

| Layer     | Choice                                           |
|-----------|---------------------------------------------------|
| Frontend  | Next.js 14 (App Router, TypeScript), Tailwind CSS |
| Backend   | FastAPI, SQLAlchemy ORM                           |
| Database  | SQLite                                            |
| Auth      | Simplified — single default demo learner (per spec) |

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt --break-system-packages   # or use a venv
python -m app.seed        # wipes + recreates duolingo.db with seed content
python -m uvicorn app.main:app --reload --port 8000
```

API docs (auto-generated) at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to localhost:8000
npm run dev                  # http://localhost:3000
```

Visiting `/` redirects to `/learn`, the skill-tree home screen.

### Re-seeding

`python -m app.seed` is destructive — it drops and rebuilds all tables. Run it any
time you want to reset progress back to the demo state.

## Architecture Overview

```
frontend/                       backend/
  app/                            app/
    learn/           -> skill tree    main.py         -> FastAPI app + CORS
    lesson/[id]/      -> lesson player  database.py     -> SQLAlchemy engine/session
    profile/          -> stats page     models.py       -> ORM models (schema below)
    leaderboard/                        schemas.py      -> Pydantic request/response shapes
  components/                          gamification.py -> hearts/streak/unlock logic
    LessonPlayer.tsx  (state machine)   exercise_check.py -> per-type answer checking
    ExerciseRenderer.tsx (type switch)  deps.py         -> simplified "current user" auth seam
    exercises/*.tsx                     seed.py         -> course + demo user seed data
    SkillPath / SkillNode                routers/
    TopBar / FeedbackBar / Modal           courses.py  -> skill-tree read API
  lib/                                    lessons.py  -> lesson start/answer/complete loop
    api.ts (fetch client)                 users.py    -> stats/profile/leaderboard/hearts
    types.ts (shared TS types)
```

**Design principle:** gamification rules (hearts, XP, streak, unlock state) live entirely
on the backend. The frontend only renders what the API returns and posts user actions —
a page refresh or client bug can't let a learner fabricate XP or bypass a locked skill.

### The lesson loop (state machine)

```
POST /lessons/{id}/start              -> creates a LessonAttempt, returns exercises (no answers)
POST /lesson-attempts/{id}/answer     -> checks one answer, deducts a heart if wrong
POST /lesson-attempts/{id}/complete   -> tallies XP, updates streak + skill crowns
```

Frontend state machine (`LessonPlayer.tsx`): `loading -> active -> checked -> (active | complete | out_of_hearts)`.

### Skill unlock derivation

Skill lock/unlock state is **not** stored as a column. It's computed fresh on every
request (`gamification.compute_skill_statuses`): flatten all skills in a course by
unit/skill order, then a skill is `available` if the previous skill in that sequence
has ≥1 crown (or it's the very first skill), else `locked`. This means progress and
unlock state can never drift out of sync.

### Hearts regeneration

No cron job / background worker. `hearts_refill_at` stores the timestamp regen started;
current hearts are lazily computed from elapsed time on every read
(`gamification.compute_current_hearts`), materialized back to the row when touched.

### Streak logic

`update_streak_and_xp` takes an explicit `today: date` parameter rather than calling
`date.today()` internally, so the exact rule (same day = no-op, consecutive day =
+1, gap = reset to 1) is directly unit-testable by passing simulated dates.

## Database Schema

```
User ──1:1── UserStats (xp_total, streak_count, hearts, hearts_refill_at, gems, daily_goal_xp)
  │
  ├──1:N── UserSkillProgress ──N:1── Skill (crowns_earned, status)
  └──1:N── LessonAttempt ──N:1── Lesson
              │
              └──1:N── ExerciseAttempt ──N:1── Exercise

Course ──1:N── Unit ──1:N── Skill ──1:N── Lesson ──1:N── Exercise
```

| Table                | Key columns                                                              |
|----------------------|---------------------------------------------------------------------------|
| `users`              | id, username                                                              |
| `user_stats`         | xp_total, streak_count, last_active_date, hearts, hearts_refill_at, gems, daily_goal_xp, xp_today |
| `courses`             | name, language_code                                                       |
| `units`               | course_id, order_index, title                                            |
| `skills`              | unit_id, order_index, title, icon, max_crowns                            |
| `lessons`             | skill_id, order_index *(doubles as crown level − 1)*                     |
| `exercises`           | lesson_id, order_index, type, prompt, correct_answer, `options_json`     |
| `user_skill_progress` | user_id, skill_id, crowns_earned, status                                 |
| `lesson_attempts`     | user_id, lesson_id, xp_earned, hearts_lost, status                       |
| `exercise_attempts`   | lesson_attempt_id, exercise_id, user_answer, is_correct                  |

**Notable tradeoff:** `exercises.options_json` is a flexible JSON blob whose shape
depends on `type` (multiple choice / translate / match / fill-blank / type-answer)
rather than five separate near-duplicate tables. This keeps the schema small at the
cost of DB-level shape validation, which is pushed into `schemas.py` / `exercise_check.py`
instead.

**Documented simplification:** the leaderboard is derived by sorting `user_stats.xp_total`
across all seeded users rather than a separate weekly-rollup table — sufficient for the
seeded demo, called out as a place a real weekly/friends leaderboard would need its own table.

## API Overview

| Method | Path                                  | Purpose                                   |
|--------|----------------------------------------|--------------------------------------------|
| POST   | `/auth/register`                      | Create account (bcrypt-hashed password), returns JWT |
| POST   | `/auth/login`                         | Verify credentials, returns JWT            |
| GET    | `/courses`                            | List courses with unit/skill/lesson tree + unlock state |
| GET    | `/courses/{id}`                       | Single course detail                       |
| POST   | `/lessons/{id}/start`                 | Start a lesson attempt, returns exercises (no answers) |
| POST   | `/lesson-attempts/{id}/answer`        | Submit one answer, returns correctness + hearts remaining |
| POST   | `/lesson-attempts/{id}/complete`      | Finalize attempt: XP, streak, crowns       |
| GET    | `/users/me/stats`                     | Current hearts/XP/streak/gems              |
| GET    | `/users/me/profile`                   | Stats + achievements + crowns              |
| POST   | `/users/me/hearts/refill`             | Mocked gem-for-hearts refill               |
| GET    | `/leaderboard`                        | Top learners by XP                         |

Full interactive docs at `/docs` once the backend is running.

## Assumptions & Simplifications

- **Auth**: real (but simple) JWT auth is implemented — `/auth/register` and
  `/auth/login` issue bcrypt-backed tokens, and every route resolves the caller via
  `Authorization: Bearer <token>`. Requests **without** a token fall back to the
  seeded demo learner, per the assignment's "assume a default logged-in learner"
  note, so the app stays usable with zero setup. A present-but-invalid token is a
  401, never a silent fallback. Set `JWT_SECRET` in production (dev fallback is
  intentionally insecure).
- **Leaderboard**: global all-time XP ranking across seeded users, not a real weekly
  rollup or social graph.
- **Hearts refill by gems**: mocked — always succeeds if the demo user has ≥350 gems.
- **Audio / pronunciation / Super subscription / multi-language**: out of scope per spec,
  left as "coming soon" in the profile settings placeholder.
- **Crown/lesson progression**: a skill's crowns only advance sequentially (completing
  lesson N sets crowns to N+1 only if that's higher than current) — no skipping ahead
  by replaying an earlier lesson.

## Automated Tests

Three suites (70 tests total):

- `test_gamification.py` — streak day-rollover, hearts regen over simulated elapsed
  time, gem refill. Time is injected as a parameter everywhere, so "a day passed"
  is simulated, never slept.
- `test_exercise_check.py` — per-type answer checking (all 5 exercise types),
  including normalization edge cases and the unknown-type failure path.
- `test_auth.py` — register → login → authenticated request against an isolated
  in-memory DB, plus wrong password, duplicate username, expired/tampered tokens,
  malformed headers, and the no-token demo fallback.

```bash
cd backend
python -m pytest app/ -v
```

## Bonus Features Implemented

- **User authentication (beyond spec)** — the spec allowed a hardcoded demo learner, but register/login is fully implemented: bcrypt password hashing, stateless JWT access tokens, a Duolingo-styled `/login` page, and per-user progress isolation (each learner has their own XP, streak, hearts, and skill tree state; new users appear on the leaderboard). No-token requests still fall back to the demo learner so the app works out-of-the-box.
- **Audio for exercises** — browser text-to-speech (Web Speech API) with normal and slow (🐢) playback buttons on every exercise, preferring a Spanish voice when available (`TTSButton.tsx`).
- **Achievements / badges** — a full badge catalog computed server-side with earned/locked flags (`/users/me/profile`), rendered as a grid with locked badges greyed out.
- **Real leaderboard across seeded users** — ranks all seeded learners by total XP with streaks shown; the demo user's rank moves as they earn XP.
- **Legendary / timed practice mode** — `/practice` lists unlocked skills; a legendary run gives 90 seconds, no heart loss, and **double XP** on success (backend `mode: "legendary"` on the complete endpoint; verified 100 XP vs 50 XP normal).
- **Dark mode** — dark theme is the default (matching Duolingo's dark web UI), with a light-mode toggle in the sidebar persisted to localStorage via CSS variables.
- **Responsive design** — desktop shows sidebar + main + right rail; the right rail collapses below `xl`, the sidebar collapses to icon rail below `lg`, and mobile gets a bottom tab bar.
- **Animations** — node ring glow on the active skill, bounce/wiggle mascot, shake on wrong answers, slide-up feedback bar, pop-in popovers/modals, and confetti on lesson completion.

## A Note on the Mascot & Assets

The layout, color palette, and interaction patterns intentionally mirror Duolingo's
web app per the assignment brief. The mascot, logo, and all artwork, however, are
**original** (a hand-written SVG owl in `Mascot.tsx`) — Duolingo's Duo character and
brand assets are their intellectual property and are not copied here.

## What I'd Add With More Time

- Alembic migrations instead of `create_all`
- Real auth (JWT) swapped into the `get_current_user` seam
- A literal circular progress-ring SVG per skill node (currently crowns are shown as
  icon counts in the skill popover, not a radial ring — functionally equivalent but
  visually simpler than Duolingo's actual ring)
- Dark mode, audio via TTS, a real weekly-rollup leaderboard table
- Deployment (Vercel for frontend, Railway/Render for backend) — not done in this
  session since it requires the developer's own hosting accounts
