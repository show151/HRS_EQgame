import { questions, traitMeta, type SoftSkillTraits } from "@/lib/game-data";

export type Answer = { questionId: string; optionId: string };
export type TraitScore = SoftSkillTraits;
export type SelectedAction = { title: string; choice: string };
export type RuleBasedAnalysis = {
  scores: SoftSkillTraits;
  selectedActions: SelectedAction[];
  answeredCount: number;
};
export type AiReflection = {
  scores: SoftSkillTraits;
  summary?: string;
  observations: { text: string; caseNumbers: string[] }[];
};

export function summarizeScores(scores: SoftSkillTraits) {
  const strongest = traitMeta.reduce((best, trait) => scores[trait.key] > scores[best.key] ? trait : best, traitMeta[0]);
  return `選択肢の参考値では、「${strongest.label}」に関わる行動が相対的に多く含まれていました。`;
}

export const demoObservations: AiReflection["observations"] = [
  { text: "ケースの前提を確かめてから進める行動を選ぶ回答例です。", caseNumbers: ["01", "04", "10"] },
  { text: "複数の人と情報や役割を共有する行動を選ぶ回答例です。", caseNumbers: ["02", "05", "08"] },
  { text: "状況に応じて手順や役割を組み替える行動を選ぶ回答例です。", caseNumbers: ["03", "06", "09"] },
];

export function analyzeAnswers(answers: Answer[]): RuleBasedAnalysis {
  const totals: SoftSkillTraits = { communication: 0, collaboration: 0, initiative: 0, adaptability: 0, problemSolving: 0, selfManagement: 0 };
  const selectedActions = answers.flatMap((answer) => {
    const question = questions.find((item) => item.id === answer.questionId);
    const option = question?.options.find((item) => item.id === answer.optionId);
    if (!question || !option) return [];
    for (const trait of traitMeta) totals[trait.key] += option.traits[trait.key];
    return [{ title: question.title, choice: option.text }];
  });

  const scores = Object.fromEntries(traitMeta.map(({ key }) => [key, Math.round((totals[key] / Math.max(1, selectedActions.length * 5)) * 100)])) as SoftSkillTraits;
  return { scores, selectedActions, answeredCount: selectedActions.length };
}

export function averageScores(items: { scores: SoftSkillTraits }[]) {
  const base: SoftSkillTraits = { communication: 0, collaboration: 0, initiative: 0, adaptability: 0, problemSolving: 0, selfManagement: 0 };
  if (!items.length) return base;
  for (const item of items) for (const meta of traitMeta) base[meta.key] += item.scores[meta.key];
  for (const meta of traitMeta) base[meta.key] = Math.round(base[meta.key] / items.length);
  return base;
}
