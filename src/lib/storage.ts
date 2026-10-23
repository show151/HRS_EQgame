import type { AiReflection, Answer } from "@/lib/analysis";
import { questions, traitMeta, type SoftSkillTraits } from "@/lib/game-data";

export const STORAGE_KEY = "hrs-eqgame-v2";
const LEGACY_STORAGE_KEY = "hrs-eqgame-v1";

export type PlayRecord = {
  id: string;
  completedAt: string;
  styleName: string;
  scores: SoftSkillTraits;
  answers: Answer[];
  aiReflection?: AiReflection;
  legacy?: boolean;
};

export type GameProgress = { questionIndex: number; answers: Answer[] };
export type AppState = {
  playerName: string;
  xp: number;
  plays: number;
  history: PlayRecord[];
  progress: GameProgress | null;
};

export const initialState: AppState = { playerName: "ゲスト", xp: 0, plays: 0, history: [], progress: null };

function safeAnswers(value: unknown): Answer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const answer = entry as Partial<Answer>;
    const question = questions.find((item) => item.id === answer.questionId);
    if (!question || !question.options.some((option) => option.id === answer.optionId)) return [];
    return [{ questionId: question.id, optionId: answer.optionId! }];
  });
}

function migrateScores(value: unknown): SoftSkillTraits {
  const old = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const number = (key: string) => typeof old[key] === "number" && Number.isFinite(old[key]) ? Number(old[key]) : 50;
  if (typeof old.communication === "number") {
    return {
      communication: number("communication"), collaboration: number("collaboration"), initiative: number("initiative"),
      adaptability: number("adaptability"), problemSolving: number("problemSolving"), selfManagement: number("selfManagement"),
    };
  }
  return {
    communication: Math.round(number("empathy") * 0.8 + number("logical") * 0.2),
    collaboration: Math.round(number("empathy") * 0.6 + number("initiative") * 0.4),
    initiative: number("initiative"), adaptability: number("flexibility"),
    problemSolving: number("logical"), selfManagement: number("riskAwareness"),
  };
}

function safeAiReflection(value: unknown): AiReflection | undefined {
  if (!value || typeof value !== "object") return undefined;
  const reflection = value as { scores?: unknown; summary?: unknown; observations?: unknown };
  const rawScores = reflection.scores && typeof reflection.scores === "object" ? reflection.scores as Record<string, unknown> : null;
  const scores = rawScores && Object.fromEntries(traitMeta.map(({ key }) => [key, rawScores[key]]));
  if (!scores || traitMeta.some(({ key }) => typeof scores[key] !== "number" || !Number.isFinite(scores[key]) || Number(scores[key]) < 0 || Number(scores[key]) > 100)) return undefined;
  const observations = reflection.observations;
  const validCaseNumbers = new Set(questions.map((question) => question.number));
  if (!Array.isArray(observations) || observations.length !== 3) return undefined;
  if (!observations.every((observation) => {
    if (!observation || typeof observation !== "object") return false;
    const item = observation as { text?: unknown; caseNumbers?: unknown };
    return typeof item.text === "string" && Array.isArray(item.caseNumbers) && item.caseNumbers.length > 0
      && item.caseNumbers.every((number) => typeof number === "string" && validCaseNumbers.has(number));
  })) return undefined;
  return {
    scores: scores as SoftSkillTraits,
    ...(typeof reflection.summary === "string" && reflection.summary.trim() ? { summary: reflection.summary.slice(0, 120) } : {}),
    observations: observations as AiReflection["observations"],
  };
}

function safeHistory(value: unknown): PlayRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Partial<PlayRecord>;
    if (typeof item.id !== "string" || typeof item.completedAt !== "string" || typeof item.styleName !== "string") return [];
    const aiReflection = safeAiReflection(item.aiReflection);
    return [{
      id: item.id, completedAt: item.completedAt, styleName: item.styleName,
      scores: migrateScores(item.scores), answers: safeAnswers(item.answers),
      ...(aiReflection ? { aiReflection } : {}),
      ...(item.legacy ? { legacy: true } : {}),
    }];
  });
}

function normalizeState(raw: string): AppState {
  const saved = JSON.parse(raw) as Partial<AppState>;
  const progress = saved.progress && typeof saved.progress === "object" ? saved.progress as Partial<GameProgress> : null;
  const index = typeof progress?.questionIndex === "number" && Number.isInteger(progress.questionIndex) ? progress.questionIndex : -1;
  const answers = safeAnswers(progress?.answers);
  const safeProgress = index >= 0 && index < questions.length ? { questionIndex: index, answers } : null;
  return {
    playerName: typeof saved.playerName === "string" ? saved.playerName.slice(0, 20) : initialState.playerName,
    xp: typeof saved.xp === "number" && Number.isFinite(saved.xp) ? Math.max(0, saved.xp) : 0,
    plays: typeof saved.plays === "number" && Number.isFinite(saved.plays) ? Math.max(0, saved.plays) : 0,
    history: safeHistory(saved.history),
    progress: safeProgress,
  };
}

export function readState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeState(current);
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return initialState;
    const saved = normalizeState(legacy);
    saved.history = saved.history.map((record) => ({ ...record, legacy: true }));
    return saved;
  } catch {
    return initialState;
  }
}

export function writeState(state: AppState) {
  if (typeof window === "undefined") return;
  if (state.playerName === initialState.playerName && state.xp === 0 && state.plays === 0 && state.history.length === 0 && state.progress === null) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const levelFromXp = (xp: number) => Math.floor(xp / 300) + 1;
export const xpIntoLevel = (xp: number) => xp % 300;
const levelTitles = ["挑戦のはじまり", "ケース探究者", "振り返り実践者", "継続チャレンジャー", "視点をひろげる人", "ケースの旅人", "挑戦を続ける人", "継続の探究者"];
export const titleForLevel = (level: number) => levelTitles[Math.min(Math.max(1, level), levelTitles.length) - 1];
