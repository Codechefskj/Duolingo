"""Answer-checking logic, one function per exercise type.

`correct_answer` on the Exercise row is stored as JSON text for every type
so the check functions have a single consistent parsing step, even though
most types just hold a plain string underneath.
"""
import json
from typing import Any


def _normalize(s: str) -> str:
    return " ".join(s.strip().lower().split())


def check_multiple_choice(correct_answer_json: str, user_answer: Any) -> bool:
    correct = json.loads(correct_answer_json)
    return _normalize(str(user_answer)) == _normalize(str(correct))


def check_translate(correct_answer_json: str, user_answer: Any) -> bool:
    """user_answer is the ordered list of words the learner tapped from the word bank."""
    correct = json.loads(correct_answer_json)  # list[str] or str
    if isinstance(correct, list):
        correct_sentence = " ".join(correct)
    else:
        correct_sentence = correct
    if isinstance(user_answer, list):
        user_sentence = " ".join(user_answer)
    else:
        user_sentence = str(user_answer)
    return _normalize(user_sentence) == _normalize(correct_sentence)


def check_fill_blank(correct_answer_json: str, user_answer: Any) -> bool:
    correct = json.loads(correct_answer_json)
    return _normalize(str(user_answer)) == _normalize(str(correct))


def check_type_answer(correct_answer_json: str, user_answer: Any) -> bool:
    correct = json.loads(correct_answer_json)
    return _normalize(str(user_answer)) == _normalize(str(correct))


def check_match(correct_answer_json: str, user_answer: Any) -> bool:
    """correct_answer: list of [left, right] pairs.
    user_answer: dict mapping left -> right as submitted by the learner."""
    correct_pairs = json.loads(correct_answer_json)  # list[[left, right]]
    correct_map = {left: right for left, right in correct_pairs}
    if not isinstance(user_answer, dict):
        return False
    if set(user_answer.keys()) != set(correct_map.keys()):
        return False
    return all(_normalize(str(user_answer[k])) == _normalize(str(v)) for k, v in correct_map.items())


CHECKERS = {
    "multiple_choice": check_multiple_choice,
    "translate": check_translate,
    "fill_blank": check_fill_blank,
    "type_answer": check_type_answer,
    "match": check_match,
}


def check_answer(exercise_type: str, correct_answer_json: str, user_answer: Any) -> bool:
    checker = CHECKERS.get(exercise_type)
    if checker is None:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
    return checker(correct_answer_json, user_answer)
