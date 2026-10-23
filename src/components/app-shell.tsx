"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight, Award, BarChart3, ChevronRight, CircleHelp, CirclePlay, Clock3,
  Compass, House, RotateCcw, ShieldCheck, Sparkles, Target, UserRound, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { analyzeAnswers, demoObservations, summarizeScores, type AiReflection, type Answer } from "@/lib/analysis";
import { questions, traitMeta, type SoftSkillTraits } from "@/lib/game-data";
import { initialState, levelFromXp, readState, type AppState, type PlayRecord, STORAGE_KEY, titleForLevel, writeState, xpIntoLevel } from "@/lib/storage";

type Screen = "home" | "game" | "result" | "profile";

function IconMark() {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-forest text-lime"><Sparkles size={17} strokeWidth={2.4} /></span>;
}

function Header({ screen, onNavigate, name, xp }: { screen: Screen; onNavigate: (screen: Screen) => void; name: string; xp: number }) {
  const items: { id: Screen; label: string }[] = [{ id: "home", label: "ホーム" }, { id: "game", label: "ゲーム" }, { id: "profile", label: "プロフィール" }];
  return <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:h-[72px] sm:px-8">
      <button className="flex items-center gap-2.5 text-left sm:gap-3" onClick={() => onNavigate("home")} aria-label="ホームへ">
        <IconMark /><span className="leading-tight"><span className="block text-[14px] font-extrabold tracking-[-.04em] sm:text-[15px]">HRS EQ game</span><span className="mt-0.5 block text-[9px] font-semibold tracking-[.14em] text-muted sm:text-[10px]">SOFT SKILLS STUDIO</span></span>
      </button>
      <nav className="hidden items-center gap-1 sm:flex">{items.map((item) => <button key={item.id} onClick={() => onNavigate(item.id)} className={`rounded-full px-4 py-2 text-sm transition ${screen === item.id || (screen === "result" && item.id === "game") ? "bg-[#eaf1fa] font-semibold text-forest" : "text-muted hover:text-ink"}`}>{item.label}</button>)}</nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => onNavigate("profile")} className="hidden items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-2 pr-3 sm:flex"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e9f1fb] text-forest"><UserRound size={14} /></span><span className="max-w-24 truncate text-xs font-semibold">{name}</span></button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f1fc] px-2.5 py-2 text-[10px] font-bold text-forest sm:px-3 sm:text-xs"><Zap size={13} fill="currentColor" />{xp} XP</span>
      </div>
    </div>
  </header>;
}

function BottomNavigation({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const items: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "ホーム", icon: <House size={19} /> },
    { id: "game", label: "チャレンジ", icon: <CirclePlay size={20} /> },
    { id: "profile", label: "プロフィール", icon: <UserRound size={19} /> },
  ];
  return <nav aria-label="メインメニュー" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pt-2 backdrop-blur-xl sm:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
    <div className="mx-auto grid max-w-[520px] grid-cols-3">{items.map((item) => {
      const active = screen === item.id || (screen === "result" && item.id === "game");
      return <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-semibold transition ${active ? "text-forest" : "text-[#8a98a8]"}`} aria-current={active ? "page" : undefined}>
        <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-[#e6f1fb]" : "bg-transparent"}`}>{item.icon}</span>{item.label}
      </button>;
    })}</div>
  </nav>;
}

function SectionTitle({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-[10px] font-bold tracking-[.18em] text-[#54759e]">{eyebrow}</p>}<h2 className="text-xl font-bold tracking-[-.04em] sm:text-2xl">{title}</h2>{copy && <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>}</div>{action}</div>;
}

function TraitChart({ scores }: { scores: SoftSkillTraits }) {
  const data = traitMeta.map((trait) => ({ subject: trait.short, value: scores[trait.key], fullMark: 100 }));
  return <div className="h-[285px] w-full sm:h-[320px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="69%">
    <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fill: "#708096", fontSize: 11, fontWeight: 600 }} />
    <Radar dataKey="value" stroke="#315fa8" fill="#81acd6" fillOpacity={0.4} strokeWidth={2.5} dot={{ r: 3, fill: "#315fa8", strokeWidth: 0 }} />
    <Tooltip formatter={(value) => [`${value}%`, "選択傾向の参考値"]} contentStyle={{ borderRadius: 12, border: "1px solid #e3eaf2", fontSize: 12 }} />
  </RadarChart></ResponsiveContainer></div>;
}

function TraitBars({ scores }: { scores: SoftSkillTraits }) {
  return <div className="space-y-4">{traitMeta.map((trait) => <div key={trait.key}>
    <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">{trait.label}</span><span className="text-[11px] font-medium text-muted">{scores[trait.key]}%</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-[#ecf1f6]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${scores[trait.key]}%`, background: trait.color }} /></div>
  </div>)}</div>;
}

function DemoGrowthChart() {
  const data = [{ label: "1回目", value: 43 }, { label: "2回目", value: 51 }, { label: "3回目", value: 48 }, { label: "4回目", value: 63 }, { label: "5回目", value: 68 }, { label: "6回目", value: 74 }];
  return <div className="h-[205px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}>
    <defs><linearGradient id="growth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7aa9d4" stopOpacity={0.2} /><stop offset="100%" stopColor="#7aa9d4" stopOpacity={0.01} /></linearGradient></defs>
    <CartesianGrid stroke="#ecf1f6" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b98a8", fontSize: 10 }} tickMargin={8} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#8b98a8", fontSize: 10 }} />
    <Tooltip formatter={(value) => [`${value}`, "デモ指標"]} contentStyle={{ borderRadius: 12, border: "1px solid #e3eaf2", fontSize: 11 }} /><Area type="monotone" dataKey="value" stroke="#315fa8" strokeWidth={2.5} fill="url(#growth)" dot={{ r: 3, fill: "#315fa8", strokeWidth: 0 }} activeDot={{ r: 5 }} />
  </AreaChart></ResponsiveContainer></div>;
}

function StatCard({ icon, label, value, detail, tone = "blue" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "blue" | "sky" | "indigo" }) {
  const tones = { blue: "bg-[#eaf1fb] text-forest", sky: "bg-[#e7f2fc] text-[#3c7caf]", indigo: "bg-[#eef0fb] text-[#727daf]" };
  return <div className="min-w-0 rounded-[20px] border border-line bg-white p-3.5 shadow-sm min-[380px]:p-4 sm:p-5"><div className={`mb-4 grid h-9 w-9 place-items-center rounded-[12px] ${tones[tone]}`}>{icon}</div><p className="text-[11px] font-medium text-muted">{label}</p><p className="mt-1 break-words text-[17px] font-bold leading-tight tracking-[-.05em] text-ink sm:text-[24px] sm:tracking-[-.06em]">{value}</p><p className="mt-1 text-[10px] text-muted">{detail}</p></div>;
}

function HomeScreen({ state, onPlay, onProfile, onContinue }: { state: AppState; onPlay: () => void; onProfile: () => void; onContinue: () => void }) {
  const latest = state.history.find((record) => !record.legacy);
  return <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-8 sm:pb-20 sm:pt-12">
    <section className="relative isolate overflow-hidden rounded-[26px] bg-forest p-5 text-white shadow-[0_24px_60px_rgba(30,77,145,.18)] sm:rounded-[36px] sm:p-12 lg:p-[60px]">
      <div className="grain pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -right-28 -top-36 h-[410px] w-[410px] rounded-full border border-white/10 sm:right-[2%] sm:top-[-30%]"><div className="absolute inset-10 rounded-full border border-white/10"><div className="absolute inset-10 rounded-full border border-white/10"><div className="absolute right-[18%] top-[15%] h-4 w-4 rounded-full bg-lime shadow-[0_0_40px_12px_rgba(200,229,255,.3)]" /></div></div></div>
      <div className="relative max-w-[670px] animate-fade-up">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[.15em] text-[#d5eaff] sm:mb-7"><Sparkles size={12} /> SOFT SKILLS CASE FILES</div>
        <h1 className="text-[30px] font-bold leading-[1.3] tracking-[-.065em] min-[380px]:text-[34px] sm:text-[48px] lg:text-[56px]">ケースで見つける、<br /><span className="text-lime">選んだ行動と自分の視点。</span></h1>
        <p className="mt-4 max-w-[480px] text-[13px] leading-7 text-white/75 sm:mt-5 sm:text-[15px]">仕事のケースで自分の行動を選び、10問のあとに選択内容と参考指標を見ながら振り返ります。</p>
        <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
          <Button variant="secondary" onClick={state.progress ? onContinue : onPlay} className="h-[52px] px-7 text-[13px]">{state.progress ? "つづきから再開" : "ケーススタディを始める"}<ArrowRight size={16} /></Button>
          <Button variant="outline" onClick={onProfile} className="h-[52px] border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white sm:hidden">プロフィールを見る<UserRound size={15} /></Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/65 sm:mt-7"><span className="flex items-center gap-1.5"><Clock3 size={13} />約5〜8分</span><span className="flex items-center gap-1.5"><CircleHelp size={13} />全10ケース</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} />途中保存できます</span></div>
      </div>
      <div className="absolute bottom-10 right-[7%] hidden w-[245px] rotate-[4deg] rounded-[22px] border border-white/15 bg-white/[.09] p-5 backdrop-blur-sm lg:block"><div className="mb-6 flex items-center justify-between"><span className="text-[10px] font-semibold tracking-wider text-white/60">SOFT SKILLS MAP</span><Compass size={16} className="text-lime" /></div><div className="grid grid-cols-6 items-end gap-2">{[44, 78, 61, 53, 87, 66].map((height, i) => <div key={i} className="flex flex-col items-center gap-2"><div className="flex h-[90px] w-full items-end"><span className="w-full rounded-t-full bg-lime/80" style={{ height: `${height}%`, opacity: .55 + i * .06 }} /></div><span className="text-[8px] text-white/60">{traitMeta[i].short}</span></div>)}</div><p className="mt-5 border-t border-white/10 pt-4 text-center text-[10px] text-white/65">選択の積み重ねを、次の一歩に。</p></div>
    </section>

    <section className="mt-8 sm:mt-10"><SectionTitle eyebrow="YOUR JOURNEY" title="小さなケースから、気づきを。" copy="選んだ行動と参考グラフを見ながら、自分の視点で振り返れます。" />
      <div className="grid grid-cols-2 gap-2.5 min-[380px]:gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={<Award size={17} />} label="現在のレベル" value={`Lv. ${levelFromXp(state.xp)}`} detail={`称号：${titleForLevel(levelFromXp(state.xp))}`} />
        <StatCard icon={<Zap size={17} />} label="獲得 XP" value={state.xp.toLocaleString()} detail="回答と完了で獲得" tone="sky" />
        <StatCard icon={<Target size={17} />} label="完了した回数" value={`${state.plays}回`} detail="10ケース完了" tone="indigo" />
        <StatCard icon={<BarChart3 size={17} />} label="最新の記録" value={latest ? "回答を保存済み" : "これから記録"} detail={latest ? "10ケース完了" : "まずは10問に挑戦"} />
      </div>
    </section>

  </main>;
}

function GameScreen({ progress, onChoose, onQuit }: { progress: NonNullable<AppState["progress"]>; onChoose: (optionId: string) => void; onQuit: () => void }) {
  const question = questions[progress.questionIndex];
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [progress.questionIndex]);
  return <main className="mx-auto max-w-[1000px] px-4 pb-28 pt-5 sm:px-8 sm:pb-20 sm:pt-12">
    <button onClick={onQuit} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-forest"><ChevronRight className="rotate-180" size={15} />中断してホームへ</button>
    <div className="mb-6 flex items-end justify-between gap-3 sm:mb-7"><div className="min-w-0"><p className="mb-2 text-[10px] font-bold tracking-[.12em] text-[#54759e] min-[380px]:tracking-[.17em]">CASE {question.number}<span className="mx-1.5 text-[#c9d4e0]">·</span>{question.category}</p><h1 className="break-words text-[22px] font-bold leading-snug tracking-[-.05em] min-[380px]:text-2xl sm:text-[32px]">{question.title}</h1></div><span className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-muted">{progress.questionIndex + 1}<span className="mx-1 text-[#c9d4e0]">/</span>{questions.length}</span></div>
    <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#e5edf5]"><div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${(progress.questionIndex / questions.length) * 100}%` }} /></div>
    <div className="grid items-start gap-4 lg:grid-cols-[.72fr_1.28fr] lg:gap-6">
      <aside className="rounded-[22px] bg-[#e9f1fb] p-5 sm:rounded-[24px] sm:p-7"><div className="mb-5 flex items-center justify-between sm:mb-7"><span className="grid h-11 w-11 place-items-center rounded-[15px] bg-white text-[21px] text-forest shadow-sm sm:h-12 sm:w-12">{question.icon}</span><span className="text-[10px] font-bold tracking-[.14em] text-[#58769c]">CASE STUDY</span></div><p className="mb-2 text-[10px] font-semibold tracking-wide text-[#8091a6]">{question.setting}</p><p className="text-[13px] leading-[1.9] text-[#42566d]">{question.scenario}</p></aside>
      <section className="rounded-[22px] border border-line bg-white p-4 shadow-card sm:rounded-[24px] sm:p-7"><h2 className="mb-4 text-[14px] font-bold leading-6 sm:mb-5 sm:text-[15px]">{question.prompt}</h2><p className="mb-3 text-[10px] text-muted">今のあなたに近い行動をひとつ選んでください。全10問のあとにまとめて振り返ります。</p>
        <div className="space-y-2.5">{question.options.map((option, index) => <button key={option.id} onClick={() => onChoose(option.id)} className="group flex min-h-14 w-full items-start gap-2.5 rounded-[16px] border border-line bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#9bb9dc] hover:bg-[#fbfdff] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest min-[380px]:gap-3 min-[380px]:p-3.5 sm:gap-4 sm:p-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#eff4f9] text-[11px] font-bold text-[#788aa1] transition group-hover:bg-forest group-hover:text-white">{["A", "B", "C", "D"][index]}</span><span className="min-w-0 flex-1 break-words pt-1 text-[12px] font-medium leading-[1.8] text-[#394e67] sm:text-[13px]">{option.text}</span><ChevronRight size={16} className="mt-1 shrink-0 text-[#c1cedd] transition group-hover:translate-x-0.5 group-hover:text-forest" />
        </button>)}</div>
      </section>
    </div>
    <p className="mt-5 text-center text-[10px] text-muted">回答は選択するたびに保存されます。正解・不正解や途中の解説はありません。</p>
  </main>;
}

function AiReflectionPanel({ record, onSave }: { record: PlayRecord; onSave: (reflection: AiReflection) => void }) {
  const [reflection, setReflection] = useState(record.aiReflection);
  const [loading, setLoading] = useState(!record.aiReflection);
  const [error, setError] = useState("");
  const requested = useRef(false);

  async function runAnalysis() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: record.answers }) });
      const result = await response.json() as AiReflection & { error?: string };
      if (!response.ok) throw new Error(result.error || "AI分析に接続できませんでした。");
      setReflection(result); onSave(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI分析に接続できませんでした。");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (record.aiReflection || requested.current) return;
    requested.current = true;
    void runAnalysis();
  }, []);

  const observations = reflection?.observations ?? demoObservations;
  const summary = reflection?.summary ?? summarizeScores(reflection?.scores ?? record.scores);

  return <section className="rounded-[26px] border border-[#d7e6f5] bg-[#f4f8fd] p-5 sm:p-7">
    <div className="rounded-[18px] border border-[#d7e6f5] bg-white p-4 sm:p-5"><p className="text-[10px] font-bold tracking-[.14em] text-[#54759e]">ひとことで言うと</p><p className="mt-2 text-[14px] font-semibold leading-7 text-[#344e6c]">{loading ? "回答に表れた行動の傾向をまとめています…" : summary}</p>{!reflection?.summary && !loading && <p className="mt-1 text-[10px] leading-5 text-muted">選択肢に設定された参考値によるデモ要約です。</p>}</div>
    <div className="mt-5 flex items-center gap-2 border-t border-[#d7e6f5] pt-4 text-[10px] font-semibold text-[#54759e]">{loading ? <><span className="h-2 w-2 animate-pulse rounded-full bg-[#4b8bc0]" />Geminiが回答とグラフを自動で整理しています…</> : reflection ? <><span className="h-2 w-2 rounded-full bg-[#4c9a76]" />Geminiによる回答整理</> : <><span className="h-2 w-2 rounded-full bg-[#d49a4a]" />デモデータを表示中</>}</div>
    <div className="mt-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#54759e]">{reflection ? "回答文に記された行動のパターン（ケース番号つき）" : "傾向表示のデモ例"}</p>{!reflection && <p className="mt-2 rounded-xl bg-white px-4 py-3 text-[10px] leading-5 text-muted">{loading ? "分析の完了までサンプルを表示しています。" : "Geminiを利用できないため、以下はあなたの回答を分析したものではないデモ例です。"}</p>}<ul className="mt-3 space-y-3">{observations.map((observation, index) => <li key={index} className="rounded-[15px] bg-white p-4 text-[12px] leading-6 text-[#53647b]"><div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf1fa] text-[10px] font-bold text-[#3c7caf]">{index + 1}</span><p>{observation.text}</p></div><div className="mt-3 flex flex-wrap gap-1.5 pl-9">{observation.caseNumbers.map((number) => <span key={number} className="rounded-full bg-[#edf1fa] px-2 py-1 text-[9px] font-semibold text-[#466a9b]">CASE {number}</span>)}</div></li>)}</ul><p className="mt-3 text-[10px] leading-5 text-muted">回答文の共通点のみを整理します。背景や意味は、ご自身の視点で振り返ってください。</p>{!loading && !reflection && <><Button variant="ghost" onClick={() => { requested.current = false; void runAnalysis(); }} className="mt-2 h-9 px-2 text-[10px]">Geminiで再試行<RotateCcw size={12} /></Button>{error && <p role="status" className="mt-2 text-[10px] text-[#8d4c56]">自動分析を利用できませんでした。{error}</p>}</>}</div>
  </section>;
}

function ResultScreen({ record, onPlay, onProfile, onSaveAi }: { record: PlayRecord; onPlay: () => void; onProfile: () => void; onSaveAi: (reflection: AiReflection) => void }) {
  const analysis = analyzeAnswers(record.answers);
  const scores = record.aiReflection?.scores ?? record.scores;
  const date = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(record.completedAt));
  const legacy = record.legacy || analysis.answeredCount === 0;
  return <main className="mx-auto max-w-[1120px] px-4 pb-28 pt-6 sm:px-8 sm:pb-20 sm:pt-12">
    <div className="mb-6 flex flex-col items-start gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:mb-8"><p className="text-[10px] font-bold tracking-[.17em] text-[#54759e]">YOUR ANSWERS · {date}</p><span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-muted">正解・不正解はありません</span></div>
    {!legacy && <div className="mt-5"><AiReflectionPanel key={record.id} record={record} onSave={onSaveAi} /></div>}
    <section className="mt-5 sm:mt-6">
      <div className="rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-7"><SectionTitle eyebrow={record.aiReflection ? "GEMINI ANSWER ANALYSIS" : "REFERENCE CHART"} title="選択肢に設定した6つの指標" copy={record.aiReflection ? "Geminiが回答と選択肢の参考重みから自動作成したグラフです。" : "選択肢に設定したデモ用の仮の重みを自動集計しています。Gemini分析後にグラフが更新されます。"} /><TraitChart scores={scores} /><div className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line pt-5 sm:grid-cols-3 sm:gap-x-4">{traitMeta.map((item) => <div key={item.key} className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} /><div><p className="text-[10px] font-bold">{item.label}</p><p className="mt-0.5 text-[9px] leading-4 text-muted">{item.description}</p></div></div>)}</div></div>
    </section>
    <div className="mt-5 flex flex-col justify-between gap-3 rounded-[24px] border border-line bg-white p-5 shadow-sm sm:mt-7 sm:flex-row sm:items-center sm:px-7"><div><p className="text-[13px] font-bold">10ケース完了、おつかれさまでした。</p><p className="mt-1 text-[11px] text-muted">今回の選択をヒントに、次の一歩を見つけてみてください。</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onProfile} className="h-10 px-3 text-xs min-[380px]:px-4">プロフィール<UserRound size={14} /></Button><Button onClick={onPlay} className="h-10 px-3 text-xs min-[380px]:px-4">もう一度挑戦<RotateCcw size={14} /></Button></div></div>
  </main>;
}

function ProfileScreen({ state, onNameChange, onDelete, onHome }: { state: AppState; onNameChange: (name: string) => void; onDelete: () => void; onHome: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.playerName);
  const latest = state.history.find((record) => !record.legacy);
  const scores = latest?.scores ?? { communication: 0, collaboration: 0, initiative: 0, adaptability: 0, problemSolving: 0, selfManagement: 0 };
  const level = levelFromXp(state.xp);
  const xpProgress = xpIntoLevel(state.xp);
  const joined = latest ? `${new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(new Date(latest.completedAt))}から挑戦中` : state.plays > 0 ? "以前のプレイ記録があります" : "今日からスタート";
  function saveName() { const trimmed = draft.trim().slice(0, 20); if (trimmed) onNameChange(trimmed); setEditing(false); }
  return <main className="mx-auto max-w-[1120px] px-4 pb-28 pt-6 sm:px-8 sm:pb-20 sm:pt-12">
    <div className="mb-6 sm:mb-8"><p className="mb-2 text-[10px] font-bold tracking-[.17em] text-[#54759e]">YOUR PROFILE</p><h1 className="text-3xl font-bold tracking-[-.06em]">プロフィール</h1><p className="mt-2 text-sm text-muted">挑戦の記録と、選択肢の参考指標。</p></div>
    <section className="grid gap-4 lg:grid-cols-[.78fr_1.22fr] sm:gap-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-[26px] bg-forest p-5 text-white sm:rounded-[28px] sm:p-8"><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10"><div className="absolute inset-5 rounded-full border border-white/10" /></div><div className="relative flex items-start justify-between"><span className="grid h-[54px] w-[54px] place-items-center rounded-[18px] bg-white/10 text-lime"><UserRound size={24} /></span><button aria-label="プロフィール名を編集" onClick={() => { setDraft(state.playerName); setEditing(true); }} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/15"><span className="text-sm">✎</span></button></div>
          {editing ? <div className="relative mt-5 flex gap-2"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveName(); if (event.key === "Escape") setEditing(false); }} maxLength={20} className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-lime" aria-label="プレイヤー名" /><button onClick={saveName} className="rounded-xl bg-lime px-3 text-xs font-bold text-forest">保存</button></div> : <><p className="relative mt-5 text-[10px] font-semibold tracking-[.15em] text-white/55">PLAYER</p><h2 className="relative mt-1 truncate text-[24px] font-bold tracking-[-.04em]">{state.playerName}</h2></>}
          <p className="relative mt-5 flex items-center gap-2 text-[11px] text-white/65"><Award size={14} className="text-lime" />{joined}</p>
        </div>
        <div className="rounded-[24px] border border-line bg-white p-5 shadow-card sm:rounded-[26px] sm:p-6"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-[#54759e]">LEVEL {level} · 称号</p><p className="mt-1 text-[25px] font-bold tracking-[-.06em]">{titleForLevel(level)}</p></div><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e7f2fc] text-[#3c7caf]"><Award size={19} /></span></div><div className="mt-5 flex justify-between text-[10px] font-semibold text-muted"><span>{xpProgress} / 300 XP</span><span>Lv. {level + 1} まで</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ecf1f6]"><div className="h-full rounded-full bg-[#9cc7ed] transition-all" style={{ width: `${(xpProgress / 300) * 100}%` }} /></div><p className="mt-4 text-[10px] leading-5 text-muted">レベルと称号はプレイへの取り組みを表し、能力の優劣を示しません。</p></div>
        <div className="grid grid-cols-2 gap-2.5 min-[380px]:gap-3"><StatCard icon={<Zap size={17} />} label="トータル XP" value={state.xp.toLocaleString()} detail="挑戦の積み重ね" tone="sky" /><StatCard icon={<Target size={17} />} label="完了した回数" value={`${state.plays}回`} detail="10ケース完了" tone="indigo" /></div>
      </div>
      <div className="rounded-[24px] border border-line bg-white p-5 shadow-card sm:rounded-[26px] sm:p-7"><SectionTitle eyebrow="LATEST ANSWER REFERENCE" title={latest ? "直近の回答指標" : "回答の記録"} copy={latest ? "選択肢に設定した重みの集計です。意味づけはご自身で振り返ってください。" : "10ケースを完了すると、選択内容と参考指標を確認できます。"} />{latest ? <><TraitChart scores={scores} /><TraitBars scores={scores} /></> : <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[20px] bg-[#f7f9fc] px-4 text-center"><span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[#e6eff9] text-forest"><Compass size={24} /></span><p className="mt-4 text-sm font-bold">最初の10ケースに挑戦</p><Button onClick={onHome} size="sm" className="mt-5">ホームへ<ArrowRight size={14} /></Button></div>}</div>
    </section>
    <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.85fr] sm:mt-5 sm:gap-5">
      <div className="rounded-[24px] border border-line bg-white p-5 shadow-card sm:rounded-[26px] sm:p-7"><div className="mb-2 flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-[#54759e]">GROWTH JOURNEY</p><h2 className="mt-1 text-lg font-bold">成長のイメージ</h2></div><span className="rounded-full bg-[#edf2f8] px-2.5 py-1 text-[9px] font-bold text-[#8191a2]">デモデータ</span></div><p className="mb-2 text-[10px] leading-5 text-muted">実際のプレイ履歴とは別のサンプルです。</p><DemoGrowthChart /></div>
      <div className="rounded-[24px] border border-line bg-white p-5 shadow-card sm:rounded-[26px] sm:p-7"><SectionTitle eyebrow="PLAY HISTORY" title="プレイ履歴" />{state.history.length ? <div className="max-h-[290px] space-y-2 overflow-auto pr-1">{state.history.map((record) => <div key={record.id} className="flex items-center justify-between gap-3 rounded-[15px] bg-[#f7f9fc] p-3.5"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-forest"><Sparkles size={15} /></span><span className="min-w-0"><span className="block truncate text-[11px] font-bold">{record.legacy ? "旧バージョンの記録" : "10ケースの回答"}</span><span className="mt-1 block text-[9px] text-muted">{record.legacy ? "旧バージョン" : "10ケース"} · {new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric" }).format(new Date(record.completedAt))}</span></span></span><ChevronRight size={15} className="shrink-0 text-[#9daa9e]" /></div>)}</div> : <div className="rounded-[17px] bg-[#f7f9fc] px-4 py-7 text-center"><p className="text-xs font-semibold">まだプレイ履歴はありません</p><p className="mt-1 text-[10px] text-muted">最初の挑戦を記録しましょう。</p></div>}<div className="mt-5 border-t border-line pt-4"><button onClick={onDelete} className="text-[10px] font-semibold text-[#a27b72] transition hover:text-red-600">保存データを削除する</button><p className="mt-1 text-[9px] text-muted">プレイヤー名・XP・履歴・途中の進捗が削除されます。</p></div></div>
    </section>
  </main>;
}

export function AppShell({ initialScreen = "home" }: { initialScreen?: Screen }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AppState>(initialState);
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [latestRecord, setLatestRecord] = useState<PlayRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { const saved = readState(); setState(saved); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeState(state); }, [hydrated, state]);

  function navigate(target: Screen) {
    if (target === "profile") { if (pathname !== "/profile") router.push("/profile"); return; }
    if (pathname === "/profile") { router.push("/"); return; }
    setScreen(target);
  }
  function beginGame() {
    const next: AppState = { ...state, progress: { questionIndex: 0, answers: [] } };
    setState(next); writeState(next); setScreen("game");
  }
  function continueGame() { setScreen("game"); }

  function chooseOption(optionId: string) {
    const progress = state.progress;
    if (!progress) return;
    const question = questions[progress.questionIndex];
    if (!question || progress.answers.some((answer) => answer.questionId === question.id)) return;
    const answers: Answer[] = [...progress.answers, { questionId: question.id, optionId }];
    const earnedXp = state.xp + 20;
    if (progress.questionIndex === questions.length - 1) {
      const analysis = analyzeAnswers(answers);
      const record: PlayRecord = { id: `${Date.now()}`, completedAt: new Date().toISOString(), styleName: "10ケースの回答", scores: analysis.scores, answers };
      const completed: AppState = { ...state, xp: earnedXp + 50, plays: state.plays + 1, history: [record, ...state.history], progress: null };
      setState(completed); writeState(completed); setLatestRecord(record); setScreen("result");
      setToast("10ケース完了 · +70 XP");
      window.setTimeout(() => setToast(null), 2200);
    } else {
      const next: AppState = { ...state, xp: earnedXp, progress: { questionIndex: progress.questionIndex + 1, answers } };
      setState(next); writeState(next);
    }
  }

  async function saveAiReflection(recordId: string, reflection: AiReflection) {
    const update = (record: PlayRecord): PlayRecord => record.id === recordId ? { ...record, aiReflection: reflection } : record;
    setState((current) => ({ ...current, history: current.history.map(update) }));
    setLatestRecord((current) => current ? update(current) : current);
  }

  function clearSavedData() {
    if (!window.confirm("保存したプレイヤー名、XP、履歴、途中の進捗をすべて削除します。よろしいですか？")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("hrs-eqgame-v1");
    setState(initialState); setLatestRecord(null); setScreen("home");
  }

  const activeRecord = latestRecord ?? state.history[0] ?? null;
  if (!hydrated) return <div className="min-h-screen bg-canvas" />;
  const activeScreen = pathname === "/profile" ? "profile" : screen;
  return <div className="min-h-screen bg-canvas pb-20 sm:pb-0">
    <Header screen={activeScreen} onNavigate={navigate} name={state.playerName} xp={state.xp} />
    {activeScreen === "home" && <HomeScreen state={state} onPlay={beginGame} onContinue={continueGame} onProfile={() => navigate("profile")} />}
    {activeScreen === "game" && state.progress && <GameScreen progress={state.progress} onChoose={chooseOption} onQuit={() => setScreen("home")} />}
    {activeScreen === "game" && !state.progress && <main className="mx-auto max-w-[800px] px-4 py-20 pb-32 text-center"><p className="text-sm font-semibold">新しいチャレンジを始めましょう。</p><Button onClick={beginGame} className="mt-5">10ケースに挑戦<ArrowRight size={15} /></Button></main>}
    {activeScreen === "result" && activeRecord && <ResultScreen key={activeRecord.id} record={activeRecord} onPlay={beginGame} onProfile={() => navigate("profile")} onSaveAi={(reflection) => saveAiReflection(activeRecord.id, reflection)} />}
    {activeScreen === "result" && !activeRecord && <main className="mx-auto max-w-[800px] px-4 py-20 pb-32 text-center"><p className="text-sm font-semibold">結果はまだありません。</p><Button onClick={() => setScreen("home")} className="mt-5">ホームへ戻る</Button></main>}
    {activeScreen === "profile" && <ProfileScreen state={state} onNameChange={(playerName) => setState((current) => ({ ...current, playerName }))} onDelete={clearSavedData} onHome={() => navigate("home")} />}
    <footer className="border-t border-line/80"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-2 px-4 py-5 text-[10px] text-muted sm:flex-row sm:items-center sm:px-8 sm:py-6"><span>© 2026 HRS EQ game <span className="mx-1.5 text-[#c9d4e0]">·</span> ケースで見つけるソフトスキル。</span><span>この結果は能力の測定・採用評価には使用できません。</span></div></footer>
    <BottomNavigation screen={activeScreen} onNavigate={navigate} />
    {toast && <div role="status" className="animate-pop-in fixed bottom-24 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#183a68] px-5 py-3 text-[11px] font-bold text-white shadow-[0_14px_40px_rgba(20,54,100,.3)] sm:bottom-6"><Zap size={14} className="text-lime" fill="currentColor" />{toast}</div>}
  </div>;
}
