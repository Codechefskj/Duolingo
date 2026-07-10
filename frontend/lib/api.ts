import type {
  Course, Profile, LeaderboardEntry, LessonStart, AnswerResult, LessonComplete, UserStats,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "lingo_token";

// ---- token storage (browser-only; guarded so SSR imports don't crash) ----

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

// ---- fetch client ----

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      // No token -> no header -> backend serves the demo learner (spec default).
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401 && token) {
    // Token invalid/expired: drop it so the app falls back to the demo
    // learner instead of being stuck in a 401 loop.
    clearToken();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
}

export const api = {
  // ---- auth ----
  register: (username: string, password: string) =>
    request<AuthToken>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<AuthToken>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // ---- content / progress ----
  getCourses: () => request<Course[]>("/courses"),
  getCourse: (id: number) => request<Course>(`/courses/${id}`),
  getMyStats: () => request<UserStats>("/users/me/stats"),
  getProfile: () => request<Profile>("/users/me/profile"),
  getLeaderboard: () => request<LeaderboardEntry[]>("/leaderboard"),
  refillHearts: () =>
    request<{ hearts: number; gems: number }>("/users/me/hearts/refill", { method: "POST" }),

  startLesson: (lessonId: number) =>
    request<LessonStart>(`/lessons/${lessonId}/start`, { method: "POST" }),

  submitAnswer: (attemptId: number, exerciseId: number, answer: unknown) =>
    request<AnswerResult>(`/lesson-attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify({ exercise_id: exerciseId, answer }),
    }),

  completeLesson: (attemptId: number, mode?: string) =>
    request<LessonComplete>(`/lesson-attempts/${attemptId}/complete`, {
      method: "POST",
      body: JSON.stringify({ mode: mode ?? null }),
    }),
};
