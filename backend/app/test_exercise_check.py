"""
Unit tests for exercise_check.py.

These tests verify the server-side answer checking logic for every supported
exercise type. They cover:

- Correct and incorrect answers
- Case-insensitive comparisons
- Whitespace normalization
- Word-bank ordering
- Match pair completeness
- Empty/None inputs
- Dispatcher behavior
- Invalid exercise types

Run:
    python -m pytest app/test_exercise_check.py -v
"""

import json

import pytest

from app import exercise_check


def j(obj):
    """Serialize Python object to JSON."""
    return json.dumps(obj)


# ============================================================================
# MULTIPLE CHOICE
# ============================================================================

def test_multiple_choice_correct():
    assert exercise_check.check_multiple_choice(j("The cat"), "The cat") is True


def test_multiple_choice_wrong():
    assert exercise_check.check_multiple_choice(j("The cat"), "The dog") is False


def test_multiple_choice_case_insensitive():
    assert exercise_check.check_multiple_choice(j("The cat"), "the CAT") is True


def test_multiple_choice_whitespace():
    assert exercise_check.check_multiple_choice(j("The cat"), "   The cat   ") is True


def test_multiple_choice_empty():
    assert exercise_check.check_multiple_choice(j("The cat"), "") is False


def test_multiple_choice_none():
    assert exercise_check.check_multiple_choice(j("The cat"), None) is False


# ============================================================================
# TYPE ANSWER
# ============================================================================

def test_type_answer_correct():
    assert exercise_check.check_type_answer(j("agua"), "agua") is True


def test_type_answer_wrong():
    assert exercise_check.check_type_answer(j("agua"), "vino") is False


def test_type_answer_case_insensitive():
    assert exercise_check.check_type_answer(j("agua"), "AGUA") is True


def test_type_answer_whitespace():
    assert exercise_check.check_type_answer(j("agua"), "   agua   ") is True


def test_type_answer_empty():
    assert exercise_check.check_type_answer(j("agua"), "") is False


def test_type_answer_none():
    assert exercise_check.check_type_answer(j("agua"), None) is False


# ============================================================================
# FILL BLANK
# ============================================================================

def test_fill_blank_correct():
    assert exercise_check.check_fill_blank(j("soy"), "soy") is True


def test_fill_blank_wrong():
    assert exercise_check.check_fill_blank(j("soy"), "es") is False


def test_fill_blank_case():
    assert exercise_check.check_fill_blank(j("soy"), "SOY") is True


def test_fill_blank_spaces():
    assert exercise_check.check_fill_blank(j("soy"), "  soy  ") is True


def test_fill_blank_empty():
    assert exercise_check.check_fill_blank(j("soy"), "") is False


def test_fill_blank_none():
    assert exercise_check.check_fill_blank(j("soy"), None) is False


# ============================================================================
# TRANSLATE
# ============================================================================

def test_translate_word_bank_correct():
    correct = ["La", "casa", "es", "grande"]

    assert exercise_check.check_translate(
        j(correct),
        ["La", "casa", "es", "grande"],
    )


def test_translate_word_bank_wrong_order():
    correct = ["La", "casa", "es", "grande"]

    assert (
        exercise_check.check_translate(
            j(correct),
            ["casa", "La", "es", "grande"],
        )
        is False
    )


def test_translate_accepts_string():
    correct = ["La", "casa", "es", "grande"]

    assert exercise_check.check_translate(
        j(correct),
        "La casa es grande",
    )


def test_translate_string_case_spaces():
    correct = ["La", "casa", "es", "grande"]

    assert exercise_check.check_translate(
        j(correct),
        "   la CASA es GRANDE   ",
    )


def test_translate_correct_stored_as_string():
    assert exercise_check.check_translate(
        j("La casa es grande"),
        ["La", "casa", "es", "grande"],
    )


def test_translate_empty():
    correct = ["La", "casa"]

    assert exercise_check.check_translate(
        j(correct),
        "",
    ) is False


def test_translate_none():
    correct = ["La", "casa"]

    assert exercise_check.check_translate(
        j(correct),
        None,
    ) is False


# ============================================================================
# MATCH
# ============================================================================

def test_match_correct():
    pairs = [
        ["hola", "hello"],
        ["gato", "cat"],
        ["agua", "water"],
    ]

    user = {
        "hola": "hello",
        "gato": "cat",
        "agua": "water",
    }

    assert exercise_check.check_match(j(pairs), user)


def test_match_wrong_pair():
    pairs = [
        ["hola", "hello"],
        ["gato", "cat"],
    ]

    user = {
        "hola": "hello",
        "gato": "dog",
    }

    assert exercise_check.check_match(j(pairs), user) is False


def test_match_missing_pair():
    pairs = [
        ["hola", "hello"],
        ["gato", "cat"],
    ]

    user = {
        "hola": "hello",
    }

    assert exercise_check.check_match(j(pairs), user) is False


def test_match_not_dict():
    pairs = [["hola", "hello"]]

    assert exercise_check.check_match(
        j(pairs),
        ["hola", "hello"],
    ) is False


def test_match_case_insensitive():
    pairs = [["hola", "hello"]]

    user = {
        "hola": "HELLO",
    }

    assert exercise_check.check_match(j(pairs), user)


def test_match_empty():
    pairs = [["hola", "hello"]]

    assert exercise_check.check_match(j(pairs), {}) is False


def test_match_none():
    pairs = [["hola", "hello"]]

    assert exercise_check.check_match(j(pairs), None) is False


# ============================================================================
# DISPATCHER
# ============================================================================

@pytest.mark.parametrize(
    "exercise_type,correct,user",
    [
        ("multiple_choice", j("Dog"), "Dog"),
        ("type_answer", j("agua"), "agua"),
        ("fill_blank", j("soy"), "soy"),
        ("translate", j(["La", "casa"]), ["La", "casa"]),
        ("match", j([["a", "b"]]), {"a": "b"}),
    ],
)
def test_dispatcher_all_types(exercise_type, correct, user):
    assert exercise_check.check_answer(
        exercise_type,
        correct,
        user,
    )


def test_dispatcher_unknown_type():
    with pytest.raises(ValueError):
        exercise_check.check_answer(
            "speech_recognition",
            j("x"),
            "x",
        )


# ============================================================================
# INVALID JSON
# ============================================================================

def test_invalid_json_multiple_choice():
    with pytest.raises(Exception):
        exercise_check.check_multiple_choice("{", "cat")


def test_invalid_json_type_answer():
    with pytest.raises(Exception):
        exercise_check.check_type_answer("{", "agua")


def test_invalid_json_fill_blank():
    with pytest.raises(Exception):
        exercise_check.check_fill_blank("{", "soy")


def test_invalid_json_translate():
    with pytest.raises(Exception):
        exercise_check.check_translate("{", "hola")


def test_invalid_json_match():
    with pytest.raises(Exception):
        exercise_check.check_match("{", {})