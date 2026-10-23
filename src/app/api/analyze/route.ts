import { NextResponse } from "next/server";
import { questions, traitMeta } from "@/lib/game-data";
import type { Answer } from "@/lib/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  const serverDelay = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 0;
  const exponentialDelay = 700 * (2 ** attempt) + Math.random() * 300;
  return Math.min(2500, Math.max(exponentialDelay, serverDelay));
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(traitMeta.map(({ key }) => [key, { type: "integer", minimum: 0, maximum: 100 }])),
      required: traitMeta.map(({ key }) => key),
    },
    observations: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          caseNumbers: { type: "array", items: { type: "string", enum: questions.map((question) => question.number) }, minItems: 1, maxItems: questions.length },
        },
        required: ["text", "caseNumbers"],
      },
    },
  },
  required: ["summary", "scores", "observations"],
};

function toGemini25Schema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGemini25Schema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "additionalProperties")
    .map(([key, child]) => [
      key,
      key === "type" && typeof child === "string" ? child.toUpperCase() : toGemini25Schema(child),
    ]));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ code: "api_key_missing", error: "回答分析には、サーバーにGEMINI_API_KEYまたはGOOGLE_API_KEYを設定してください。" }, { status: 503 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストを読み取れませんでした。" }, { status: 400 });
  }

  const rawAnswers = input && typeof input === "object" ? (input as { answers?: unknown }).answers : null;
  if (!Array.isArray(rawAnswers) || rawAnswers.length !== questions.length) {
    return NextResponse.json({ error: "10問すべての回答が必要です。" }, { status: 400 });
  }

  const answers: Answer[] = [];
  for (const raw of rawAnswers) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ error: "回答データを確認してください。" }, { status: 400 });
    const answer = raw as Partial<Answer>;
    const question = questions.find((item) => item.id === answer.questionId);
    if (!question || !question.options.some((option) => option.id === answer.optionId) || answers.some((item) => item.questionId === answer.questionId)) {
      return NextResponse.json({ error: "回答データを確認してください。" }, { status: 400 });
    }
    answers.push({ questionId: question.id, optionId: answer.optionId! });
  }

  const selectedCases = questions.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id)!;
    const option = question.options.find((item) => item.id === answer.optionId)!;
    return { caseNumber: question.number, case: question.title, situation: question.scenario, selectedAction: option.text, referenceWeights: option.traits };
  });

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const generationConfig = model.startsWith("gemini-2.5-")
      ? {
          responseMimeType: "application/json",
          responseSchema: toGemini25Schema(responseSchema),
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 1200,
        }
      : {
          responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: responseSchema } },
          maxOutputTokens: 1200,
        };
    const body = JSON.stringify({
        systemInstruction: {
          parts: [{ text: `あなたはケーススタディの回答記録を簡潔に整理します。入力は本人が選んだ10個の行動と、各選択肢に設定されたデモ用参考重みです。summaryには、複数の回答から確認できる行動選択の共通点を日本語の一文（およそ25〜50文字）で要約してください。「今回の回答では、〜する行動が複数見られました」のように、選択した行動だけを述べ、性格や能力の判定や他者からどう見られるかは書かないでください。明記されていない動機・意図は推測せず、回答者が自分で意味づけできる余地を残してください。scoresは各指標について、10問分の参考重みを合計し（最大50）、50で割って100を掛けて四捨五入した0〜100の整数にしてください。指標キー: ${traitMeta.map(({ key }) => key).join(", ")}。observationsは複数の回答に繰り返し現れる判断・行動のパターンを日本語で3つ記述してください。各記述は選択された回答文から確認できる事実に限り、「事実を確認する選択が複数あります」のような言い方にしてください。単一回答を一般化せず、根拠となるケース番号を各項目に付けてください。分析の意味づけは回答者本人に委ねます。` }],
        },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(selectedCases) }] }],
        // Gemini 2.5 uses the legacy MIME type/schema fields and can spend the
        // output budget on thinking unless that budget is disabled for this short task.
        generationConfig,
      });

    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(45_000),
          body,
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          console.error(`[Gemini analysis] request timed out on attempt ${attempt + 1}: ${error.name}`);
          return NextResponse.json({ code: "gemini_timeout", error: "Geminiの応答に時間がかかっています。しばらくしてから再試行してください。" }, { status: 504 });
        }
        if (attempt === 2) throw error;
        await wait(700 * (2 ** attempt) + Math.random() * 300);
        continue;
      }
      if (response.ok || !transientStatuses.has(response.status) || attempt === 2) break;
      const delay = retryDelay(response, attempt);
      await response.body?.cancel();
      await wait(delay);
    }

    if (!response) {
      return NextResponse.json({ error: "Gemini APIから応答を受け取れませんでした。デモ表示に切り替えました。" }, { status: 503 });
    }
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
      const providerMessage = typeof providerError?.error?.message === "string" ? providerError.error.message.slice(0, 500) : "詳細メッセージなし";
      console.error(`[Gemini analysis] HTTP ${response.status}: ${providerMessage}`);
      const isTemporary = transientStatuses.has(response.status);
      return NextResponse.json({ error: isTemporary ? "Gemini APIが混雑しています。デモ表示に切り替えました。しばらくしてから再試行できます。" : `Gemini APIがHTTP ${response.status}を返しました。API設定を確認してください。` }, { status: isTemporary ? 503 : 502 });
    }
    const result = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const text = result.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
    if (!text) return NextResponse.json({ error: "AI分析の結果を読み取れませんでした。" }, { status: 502 });
    const parsed = JSON.parse(text) as { summary?: unknown; scores?: unknown; observations?: unknown };
    if (typeof parsed.summary !== "string" || parsed.summary.trim().length === 0 || parsed.summary.length > 120) {
      return NextResponse.json({ error: "一言まとめを読み取れませんでした。もう一度お試しください。" }, { status: 502 });
    }
    const rawScores = parsed.scores && typeof parsed.scores === "object" ? parsed.scores as Record<string, unknown> : null;
    const scores = rawScores && Object.fromEntries(traitMeta.map(({ key }) => [key, rawScores[key]]));
    if (!scores || traitMeta.some(({ key }) => typeof scores[key] !== "number" || !Number.isInteger(scores[key]) || Number(scores[key]) < 0 || Number(scores[key]) > 100)) {
      return NextResponse.json({ error: "グラフデータを読み取れませんでした。もう一度お試しください。" }, { status: 502 });
    }
    const validCaseNumbers = new Set(questions.map((question) => question.number));
    const observations = Array.isArray(parsed.observations) ? parsed.observations : [];
    if (observations.length !== 3 || !observations.every((observation) => {
      if (!observation || typeof observation !== "object") return false;
      const item = observation as { text?: unknown; caseNumbers?: unknown };
      return typeof item.text === "string" && item.text.trim().length > 0
        && Array.isArray(item.caseNumbers) && item.caseNumbers.length > 0
        && item.caseNumbers.every((number) => typeof number === "string" && validCaseNumbers.has(number));
    })) {
      return NextResponse.json({ error: "回答分析の結果を読み取れませんでした。もう一度お試しください。" }, { status: 502 });
    }
    return NextResponse.json({ summary: parsed.summary.trim(), scores, observations });
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
    console.error(`[Gemini analysis] request failed: ${reason}`);
    return NextResponse.json({ error: "AI分析に接続できませんでした。しばらくしてからもう一度お試しください。" }, { status: 502 });
  }
}
