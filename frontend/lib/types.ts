export type SkillStatus = "locked" | "available" | "completed";
export type ExerciseType = "multiple_choice" | "translate" | "match" | "fill_blank" | "type_answer";

export interface UserStats {
  xp_total: number;
  streak_count: number;
  hearts: number;
  hearts_max: number;
  gems: number;
  daily_goal_xp: number;
  xp_today: number;
  hearts_refill_at: string | null;
  seconds_to_next_heart: number | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface Profile {
  username: string;
  stats: UserStats;
  skills_completed: number;
  total_crowns: number;
  achievements: Achievement[];
}

export interface LeaderboardEntry {
  username: string;
  xp_total: number;
  rank: number;
  streak_count: number;
}

export interface LessonSummary { id: number; order_index: number; crown_level: number; }

export interface Skill {
  id: number; order_index: number; title: string; icon: string;
  max_crowns: number; crowns_earned: number; status: SkillStatus;
  lessons: LessonSummary[];
}

export interface Unit { id: number; order_index: number; title: string; description: string; skills: Skill[]; }
export interface Course { id: number; name: string; language_code: string; units: Unit[]; }

export interface ExercisePublic {
  id: number; order_index: number; type: ExerciseType; prompt: string;
  options: Record<string, unknown>;
}

export interface LessonStart {
  lesson_attempt_id: number; lesson_id: number; skill_title: string;
  exercises: ExercisePublic[]; hearts: number;
}

export interface AnswerResult {
  is_correct: boolean; correct_answer: unknown;
  hearts_remaining: number; out_of_hearts: boolean;
}

export interface LessonComplete {
  xp_earned: number; accuracy: number; new_crowns: number;
  new_streak: number; leveled_up_skill: boolean; daily_goal_met: boolean;
}
