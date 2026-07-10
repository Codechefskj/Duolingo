"use client";

import type { ExercisePublic } from "@/lib/types";
import MultipleChoice from "./exercises/MultipleChoice";
import Translate from "./exercises/Translate";
import Match from "./exercises/Match";
import FillBlank from "./exercises/FillBlank";
import TypeAnswer from "./exercises/TypeAnswer";

export default function ExerciseRenderer({
  exercise, value, onChange, locked,
}: {
  exercise: ExercisePublic;
  value: unknown;
  onChange: (v: unknown) => void;
  locked: boolean;
}) {
  switch (exercise.type) {
    case "multiple_choice":
      return (
        <MultipleChoice
          options={exercise.options as { choices: string[] }}
          value={(value as string) ?? null}
          onChange={onChange}
          locked={locked}
        />
      );
    case "translate":
      return (
        <Translate
          options={exercise.options as { word_bank: string[] }}
          value={(value as string[]) ?? []}
          onChange={onChange}
          locked={locked}
        />
      );
    case "match":
      return (
        <Match
          options={exercise.options as { left: string[]; right: string[] }}
          value={(value as Record<string, string>) ?? {}}
          onChange={onChange}
          locked={locked}
        />
      );
    case "fill_blank":
      return (
        <FillBlank
          options={exercise.options as { sentence: string }}
          value={(value as string) ?? ""}
          onChange={onChange}
          locked={locked}
        />
      );
    case "type_answer":
      return (
        <TypeAnswer value={(value as string) ?? ""} onChange={onChange} locked={locked} />
      );
    default:
      return <p>Unsupported exercise type: {exercise.type}</p>;
  }
}
