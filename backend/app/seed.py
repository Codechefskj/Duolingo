"""
Run with: python -m app.seed

Wipes and recreates the SQLite DB, then seeds:
- 1 Spanish course, 2 units, 3 skills/unit, 2 lessons/skill, mixed exercises
- A demo user (id=1, the 'default logged-in learner') with partial progress
- 4 extra seeded users for a non-empty leaderboard
"""
import json
from datetime import datetime, date, timedelta

from .database import Base, engine, SessionLocal
from . import models


def j(obj) -> str:
    return json.dumps(obj)


def build_exercises(db, lesson, specs: list[dict]) -> list[models.Exercise]:
    out = []
    for i, spec in enumerate(specs):
        ex = models.Exercise(
            lesson=lesson,
            order_index=i,
            type=spec["type"],
            prompt=spec["prompt"],
            correct_answer=j(spec["correct_answer"]),
            options_json=j(spec.get("options", {})),
        )
        db.add(ex)
        out.append(ex)
    return out


def main():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    course = models.Course(name="Spanish", language_code="es")
    db.add(course)
    db.flush()

    unit1 = models.Unit(course=course, order_index=0, title="Unit 1: Basics",
                         description="Greetings and everyday phrases")
    unit2 = models.Unit(course=course, order_index=1, title="Unit 2: Everyday Life",
                         description="Food, family, and simple sentences")
    db.add_all([unit1, unit2])
    db.flush()

    # ---- Unit 1 skills ----
    skill_greetings = models.Skill(unit=unit1, order_index=0, title="Greetings",
                                    icon="wave", max_crowns=2)
    skill_basics = models.Skill(unit=unit1, order_index=1, title="Basics",
                                 icon="book", max_crowns=2)
    skill_phrases = models.Skill(unit=unit1, order_index=2, title="Phrases",
                                  icon="chat", max_crowns=2)
    db.add_all([skill_greetings, skill_basics, skill_phrases])
    db.flush()

    # ---- Unit 2 skills ----
    skill_food = models.Skill(unit=unit2, order_index=0, title="Food", icon="food", max_crowns=2)
    skill_family = models.Skill(unit=unit2, order_index=1, title="Family", icon="family", max_crowns=2)
    skill_sentences = models.Skill(unit=unit2, order_index=2, title="Sentences",
                                    icon="pencil", max_crowns=2)
    db.add_all([skill_food, skill_family, skill_sentences])
    db.flush()

    # ---- Lessons + exercises for "Greetings" (fully fleshed out example) ----
    greet_l1 = models.Lesson(skill=skill_greetings, order_index=0)
    greet_l2 = models.Lesson(skill=skill_greetings, order_index=1)
    db.add_all([greet_l1, greet_l2])
    db.flush()

    build_exercises(db, greet_l1, [
        {"type": "multiple_choice", "prompt": "Which word means 'hello'?",
         "correct_answer": "Hola",
         "options": {"choices": ["Hola", "Adios", "Gracias", "Por favor"]}},
        {"type": "translate", "prompt": "Translate: 'Good morning'",
         "correct_answer": ["Buenos", "dias"],
         "options": {"word_bank": ["Buenos", "dias", "noches", "Hola", "tardes"]}},
        {"type": "type_answer", "prompt": "Type the Spanish word for 'goodbye'",
         "correct_answer": "adios", "options": {}},
        {"type": "match", "prompt": "Match the greetings to their translations",
         "correct_answer": [["Hola", "Hello"], ["Adios", "Goodbye"], ["Gracias", "Thank you"]],
         "options": {"left": ["Hola", "Adios", "Gracias"], "right": ["Goodbye", "Thank you", "Hello"]}},
    ])
    build_exercises(db, greet_l2, [
        {"type": "fill_blank", "prompt": "Buenas ___ (Good afternoon)",
         "correct_answer": "tardes", "options": {"sentence": "Buenas ___"}},
        {"type": "multiple_choice", "prompt": "Which means 'please'?",
         "correct_answer": "Por favor",
         "options": {"choices": ["Por favor", "De nada", "Hola", "Adios"]}},
        {"type": "type_answer", "prompt": "Type the Spanish word for 'thank you'",
         "correct_answer": "gracias", "options": {}},
        {"type": "translate", "prompt": "Translate: 'See you later'",
         "correct_answer": ["Hasta", "luego"],
         "options": {"word_bank": ["Hasta", "luego", "manana", "pronto", "Hola"]}},
    ])

    # ---- Lessons + exercises for "Basics" ----
    basics_l1 = models.Lesson(skill=skill_basics, order_index=0)
    basics_l2 = models.Lesson(skill=skill_basics, order_index=1)
    db.add_all([basics_l1, basics_l2])
    db.flush()
    build_exercises(db, basics_l1, [
        {"type": "multiple_choice", "prompt": "'El gato' means:",
         "correct_answer": "The cat", "options": {"choices": ["The cat", "The dog", "The house", "The car"]}},
        {"type": "type_answer", "prompt": "Type the Spanish word for 'water'",
         "correct_answer": "agua", "options": {}},
        {"type": "fill_blank", "prompt": "Yo ___ Adi (I am Adi)",
         "correct_answer": "soy", "options": {"sentence": "Yo ___ Adi"}},
        {"type": "translate", "prompt": "Translate: 'The house is big'",
         "correct_answer": ["La", "casa", "es", "grande"],
         "options": {"word_bank": ["La", "casa", "es", "grande", "pequena", "El"]}},
    ])
    build_exercises(db, basics_l2, [
        {"type": "multiple_choice", "prompt": "'Uno, dos, tres' are:",
         "correct_answer": "Numbers", "options": {"choices": ["Numbers", "Colors", "Days", "Foods"]}},
        {"type": "match", "prompt": "Match numbers to words",
         "correct_answer": [["uno", "one"], ["dos", "two"], ["tres", "three"]],
         "options": {"left": ["uno", "dos", "tres"], "right": ["two", "three", "one"]}},
        {"type": "type_answer", "prompt": "Type the Spanish word for 'book'",
         "correct_answer": "libro", "options": {}},
        {"type": "fill_blank", "prompt": "Tengo ___ libros (I have two books)",
         "correct_answer": "dos", "options": {"sentence": "Tengo ___ libros"}},
    ])

    # ---- Lessons + exercises for "Phrases" ----
    phr_l1 = models.Lesson(skill=skill_phrases, order_index=0)
    phr_l2 = models.Lesson(skill=skill_phrases, order_index=1)
    db.add_all([phr_l1, phr_l2])
    db.flush()
    build_exercises(db, phr_l1, [
        {"type": "multiple_choice", "prompt": "'Como estas?' means:",
         "correct_answer": "How are you?",
         "options": {"choices": ["How are you?", "What is this?", "Where are you?", "Who are you?"]}},
        {"type": "type_answer", "prompt": "Type: 'I am fine' in Spanish",
         "correct_answer": "estoy bien", "options": {}},
        {"type": "translate", "prompt": "Translate: 'What is your name?'",
         "correct_answer": ["Como", "te", "llamas"],
         "options": {"word_bank": ["Como", "te", "llamas", "estas", "eres"]}},
        {"type": "fill_blank", "prompt": "Mucho ___ (Nice to meet you)",
         "correct_answer": "gusto", "options": {"sentence": "Mucho ___"}},
    ])
    build_exercises(db, phr_l2, [
        {"type": "multiple_choice", "prompt": "'No entiendo' means:",
         "correct_answer": "I don't understand",
         "options": {"choices": ["I don't understand", "I don't know", "I don't like it", "I don't have it"]}},
        {"type": "type_answer", "prompt": "Type: 'Excuse me' in Spanish",
         "correct_answer": "perdon", "options": {}},
        {"type": "match", "prompt": "Match phrases to meanings",
         "correct_answer": [["Lo siento", "I'm sorry"], ["De nada", "You're welcome"]],
         "options": {"left": ["Lo siento", "De nada"], "right": ["You're welcome", "I'm sorry"]}},
        {"type": "translate", "prompt": "Translate: 'I need help'",
         "correct_answer": ["Necesito", "ayuda"],
         "options": {"word_bank": ["Necesito", "ayuda", "tengo", "quiero", "comida"]}},
    ])

    # ---- Unit 2 lessons: lighter seeding (2 exercises each) is fine, still varied ----
    for skill, words in [
        (skill_food, [("La manzana", "The apple"), ("El pan", "The bread")]),
        (skill_family, [("La madre", "The mother"), ("El padre", "The father")]),
        (skill_sentences, [("Yo como pan", "I eat bread"), ("Ella es feliz", "She is happy")]),
    ]:
        l1 = models.Lesson(skill=skill, order_index=0)
        l2 = models.Lesson(skill=skill, order_index=1)
        db.add_all([l1, l2])
        db.flush()
        build_exercises(db, l1, [
            {"type": "multiple_choice", "prompt": f"'{words[0][0]}' means:",
             "correct_answer": words[0][1],
             "options": {"choices": [words[0][1], "The car", "The road", "The book"]}},
            {"type": "type_answer", "prompt": f"Type the Spanish for '{words[1][1]}'",
             "correct_answer": words[1][0].split()[-1] if len(words[1][0].split()) > 1 else words[1][0],
             "options": {}},
        ])
        build_exercises(db, l2, [
            {"type": "translate", "prompt": f"Translate: '{words[0][1]}'",
             "correct_answer": words[0][0].split(),
             "options": {"word_bank": words[0][0].split() + ["extra", "words"]}},
            {"type": "fill_blank", "prompt": f"{words[1][0].rsplit(' ', 1)[0]} ___",
             "correct_answer": words[1][0].split()[-1],
             "options": {"sentence": f"{words[1][0].rsplit(' ', 1)[0]} ___"}},
        ])

    db.commit()

    # ---- Users ----
    def make_user(username: str, xp: int, streak: int, hearts: int = 5,
                   gems: int = 500, last_active_offset_days: int = 0) -> models.User:
        u = models.User(username=username)
        db.add(u)
        db.flush()
        stats = models.UserStats(
            user_id=u.id,
            xp_total=xp,
            streak_count=streak,
            last_active_date=date.today() - timedelta(days=last_active_offset_days),
            hearts=hearts,
            hearts_max=5,
            gems=gems,
            daily_goal_xp=30,
            xp_today=0,
            xp_today_date=date.today(),
        )
        db.add(stats)
        return u

    demo = make_user("adi_learns", xp=80, streak=4, hearts=4, gems=500, last_active_offset_days=0)
    make_user("maria_rex", xp=210, streak=12)
    make_user("kenji_go", xp=150, streak=6)
    make_user("sara_polyglot", xp=95, streak=2)
    make_user("theo_speaks", xp=40, streak=1)
    db.commit()

    # Give the demo user real progress: Greetings mastered (2 crowns),
    # Basics 1 crown in progress, rest locked/available via derivation.
    db.add(models.UserSkillProgress(
        user_id=demo.id, skill_id=skill_greetings.id, crowns_earned=2, status="completed",
        last_practiced_at=datetime.utcnow() - timedelta(days=1),
    ))
    db.add(models.UserSkillProgress(
        user_id=demo.id, skill_id=skill_basics.id, crowns_earned=1, status="available",
        last_practiced_at=datetime.utcnow() - timedelta(hours=5),
    ))
    db.commit()

    print("Seed complete.")
    print(f"  Demo user: id={demo.id} username={demo.username}")
    print(f"  Courses: {db.query(models.Course).count()}")
    print(f"  Skills: {db.query(models.Skill).count()}, Lessons: {db.query(models.Lesson).count()}, "
          f"Exercises: {db.query(models.Exercise).count()}")
    db.close()


if __name__ == "__main__":
    main()
