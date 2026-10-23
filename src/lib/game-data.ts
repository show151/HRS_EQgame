export type SoftSkillTraits = {
  communication: number;
  collaboration: number;
  initiative: number;
  adaptability: number;
  problemSolving: number;
  selfManagement: number;
};

export type ThinkingTraits = SoftSkillTraits;

export type GameOption = {
  id: string;
  text: string;
  traits: SoftSkillTraits;
};

export type GameQuestion = {
  id: string;
  number: string;
  category: string;
  title: string;
  setting: string;
  scenario: string;
  prompt: string;
  icon: string;
  options: GameOption[];
};

const t = (
  communication: number,
  collaboration: number,
  initiative: number,
  adaptability: number,
  problemSolving: number,
  selfManagement: number,
): SoftSkillTraits => ({ communication, collaboration, initiative, adaptability, problemSolving, selfManagement });

export const questions: GameQuestion[] = [
  {
    id: "hotel-emergency", number: "01", category: "連携・落ち着いた対応", title: "ホテルでの緊急対応", setting: "午後 3:42 · ロビー", icon: "✳",
    scenario: "チェックインが重なるホテルのロビーで、お客様が突然倒れました。近くには案内を待つ方が数組いて、スタッフは少ない時間帯です。",
    prompt: "安全と救護を優先しながら、あなたはどう動きますか？",
    options: [
      { id: "a", text: "お客様の反応と呼吸を確かめ、救護を始めながら近くの人に応援を頼む", traits: t(4, 3, 5, 3, 4, 5) },
      { id: "b", text: "スタッフに救急要請と責任者への連絡を頼み、自分はお客様のそばで状態を見る", traits: t(4, 5, 4, 4, 4, 4) },
      { id: "c", text: "周囲の危険を取り除き、役割を短く伝えて救護とロビー対応を並行する", traits: t(4, 5, 4, 5, 4, 4) },
      { id: "d", text: "救護と応援要請をすぐ始め、状況が落ち着いてから待っている方へ説明する", traits: t(5, 3, 5, 3, 4, 5) },
    ],
  },
  {
    id: "team-conflict", number: "02", category: "対話・合意形成", title: "チームの意見対立", setting: "火曜日 · 企画ミーティング", icon: "◌",
    scenario: "新しい接客プランを決める会議。経験豊富なメンバーは確実性を、新しいメンバーは大胆さを重視しています。決定期限は今日で、議論は平行線です。",
    prompt: "チームが納得して前に進むために、何から始めますか？",
    options: [
      { id: "a", text: "それぞれが大切にしていることを聞き、共通する目的を言葉にする", traits: t(5, 5, 3, 4, 3, 4) },
      { id: "b", text: "判断軸をチームでそろえ、案ごとの効果と負担を短時間で比べる", traits: t(4, 3, 4, 3, 5, 5) },
      { id: "c", text: "小さく試せる案をつくり、結果を見て次の判断をする期限も決める", traits: t(4, 4, 5, 5, 4, 4) },
      { id: "d", text: "今日決める範囲と決定方法を確認し、全員の意見を順に集める", traits: t(5, 4, 4, 4, 3, 5) },
    ],
  },
  {
    id: "cafe-register", number: "03", category: "柔軟性・問題解決", title: "カフェのレジが故障", setting: "土曜日 · ランチタイム", icon: "⌁",
    scenario: "混み合うカフェでレジが停止しました。会計待ちの列が伸び、キッチンでは注文が次々と完成しています。手書き伝票と別の決済端末は使えそうです。",
    prompt: "現場の混乱を抑えつつ、営業を続けるためにどうしますか？",
    options: [
      { id: "a", text: "別端末と手書き記録で会計を続け、全員に暫定手順を共有する", traits: t(4, 4, 5, 5, 5, 4) },
      { id: "b", text: "待ち時間の目安を伝え、注文量とスタッフの配置を状況に合わせて調整する", traits: t(5, 5, 4, 5, 4, 4) },
      { id: "c", text: "故障の範囲を切り分けてサポートへ連絡し、代替手段も同時に動かす", traits: t(4, 3, 4, 4, 5, 5) },
      { id: "d", text: "得意分野に合わせて会計・案内・キッチンの役割を組み直す", traits: t(4, 5, 5, 5, 4, 4) },
    ],
  },
  {
    id: "ai-proposal", number: "04", category: "批判的思考・協働", title: "AIの提案を導入する？", setting: "来月の運営改善会議", icon: "✦",
    scenario: "問い合わせ対応を効率化するAIツールが提案されました。試算では対応時間を減らせそうですが、想定外の質問への精度や、お客様が感じる温度感はまだ確かめられていません。",
    prompt: "期待と不安の両方があるとき、どんな一歩を提案しますか？",
    options: [
      { id: "a", text: "小さな試験導入を行い、効率と回答品質の確認基準をチームで決める", traits: t(4, 4, 5, 5, 5, 4) },
      { id: "b", text: "現場と利用者から困りごとを聞き、導入前に必要な条件を整理する", traits: t(5, 5, 3, 4, 4, 4) },
      { id: "c", text: "提案の根拠やデータ、個人情報の扱いを確認して比較材料をまとめる", traits: t(4, 3, 4, 3, 5, 5) },
      { id: "d", text: "AIが担う定型対応と、人が担う相談を分けた運用案を作る", traits: t(4, 5, 4, 5, 4, 4) },
    ],
  },
  {
    id: "release-bug", number: "05", category: "判断・自己管理", title: "公開直前の不具合", setting: "公開まであと 45 分", icon: "◎",
    scenario: "サービス公開の直前、特定の端末で申込み画面が正しく動かないと報告されました。対象範囲は調査中で、修正には少なくとも30分かかる見込みです。",
    prompt: "リスクを見極めながら、チームでどう判断しますか？",
    options: [
      { id: "a", text: "公開を一時保留し、影響範囲と修正後の確認手順を分担する", traits: t(4, 5, 4, 3, 5, 5) },
      { id: "b", text: "問題が起きる条件を絞り、対象を限定して公開できるか検討する", traits: t(4, 3, 5, 4, 5, 4) },
      { id: "c", text: "延期を判断する時刻と基準を置き、関係者への案内も準備する", traits: t(5, 4, 4, 4, 4, 5) },
      { id: "d", text: "安全に戻す手順を先に確認し、短い確認サイクルで公開可否を見直す", traits: t(4, 4, 5, 5, 5, 4) },
    ],
  },
  {
    id: "booking-overlap", number: "06", category: "共感・調整", title: "重なってしまった予約", setting: "金曜日 · フロントデスク", icon: "⌂",
    scenario: "システムの反映遅れで、同じ部屋に二組の予約が入っていたことが判明しました。到着したお客様はどちらも長旅の後で、近隣ホテルには空室があるか確認が必要です。",
    prompt: "お客様の不安を受け止め、解決へ進むためにどうしますか？",
    options: [
      { id: "a", text: "状況を率直に説明して希望を聞き、代替案を一緒に比較する", traits: t(5, 5, 3, 4, 4, 4) },
      { id: "b", text: "近隣施設の空室や移動手段を確認し、具体的な選択肢を整えてから説明する", traits: t(4, 4, 4, 4, 5, 5) },
      { id: "c", text: "責任者と連携して対応方針を決め、窓口を一つにして進捗を伝える", traits: t(4, 5, 4, 4, 4, 5) },
      { id: "d", text: "まずお客様の優先事項を確かめ、条件に合わせて複数案をすばやく探す", traits: t(5, 4, 5, 5, 4, 4) },
    ],
  },
  {
    id: "teammate-mistake", number: "07", category: "フィードバック・信頼", title: "同じミスが続く同僚", setting: "月末 · 共同作業の締切前", icon: "↗",
    scenario: "同僚の入力ミスが続き、確認作業に時間がかかっています。本人は忙しそうで、チームには再発を防ぐ共通手順がまだありません。",
    prompt: "関係を保ち、仕事の質も上げるためにどんな対応をしますか？",
    options: [
      { id: "a", text: "まず影響箇所を一緒に確認し、落ち着いた場で本人の状況を聞く", traits: t(5, 5, 4, 4, 4, 4) },
      { id: "b", text: "入力手順やチェック項目を見直し、誰でも使える確認方法を提案する", traits: t(4, 4, 4, 4, 5, 5) },
      { id: "c", text: "締切に間に合うよう役割を一時調整し、あとで改善策を一緒に振り返る", traits: t(4, 5, 5, 5, 4, 4) },
      { id: "d", text: "具体的な事実と影響を共有し、本人の考えも聞きながら対策を相談する", traits: t(5, 5, 4, 3, 4, 5) },
    ],
  },
  {
    id: "resource-shortage", number: "08", category: "優先順位・チームワーク", title: "人手が足りない納期前", setting: "木曜日 · リリース準備", icon: "◷",
    scenario: "納期まで一週間のプロジェクトで、担当者が急に休むことになりました。作業をすべて引き継ぐ余裕はなく、顧客への約束と品質基準は守りたい状況です。",
    prompt: "無理のない計画に組み直すため、まず何をしますか？",
    options: [
      { id: "a", text: "全タスクを並べ、顧客価値と必須条件を軸に優先順位をチームで決める", traits: t(4, 5, 4, 4, 5, 5) },
      { id: "b", text: "作業を小さく分け、得意分野と空き時間に合わせて再配分する", traits: t(4, 5, 5, 5, 4, 4) },
      { id: "c", text: "納期への影響を早めに顧客へ伝え、範囲や段階的な納品を相談する", traits: t(5, 4, 4, 4, 4, 5) },
      { id: "d", text: "必須品質を守れる最小構成を考え、リスクと代替案を共有する", traits: t(4, 4, 5, 4, 5, 5) },
    ],
  },
  {
    id: "quiet-meeting", number: "09", category: "場づくり・傾聴", title: "発言が少ないミーティング", setting: "オンライン · 企画の最終確認", icon: "◉",
    scenario: "オンライン会議で数人だけが話し続け、他の参加者は発言していません。終了まで15分ですが、決定に必要な現場視点がまだ集まっていません。",
    prompt: "多様な意見を引き出すため、進行をどう変えますか？",
    options: [
      { id: "a", text: "全員が短く話せる順番をつくり、まだ出ていない懸念を尋ねる", traits: t(5, 5, 4, 4, 3, 4) },
      { id: "b", text: "チャットや匿名メモでも意見を集め、残り時間で論点を整理する", traits: t(4, 4, 4, 5, 4, 5) },
      { id: "c", text: "決める問いと必要な情報を絞り、担当領域ごとに確認する", traits: t(4, 4, 5, 4, 5, 5) },
      { id: "d", text: "いったん発言を止めて考える時間を取り、希望者から順に共有する", traits: t(5, 4, 3, 5, 3, 5) },
    ],
  },
  {
    id: "unclear-request", number: "10", category: "主体性・すり合わせ", title: "あいまいな依頼", setting: "月曜日 · 上司からの相談", icon: "✎",
    scenario: "上司から「来週の会議で使う資料をいい感じにまとめて」と頼まれました。期限は三日後。目的、読み手、必要な詳しさはまだわかりません。",
    prompt: "手戻りを減らし、期待に合う成果物をつくるには？",
    options: [
      { id: "a", text: "会議の目的と読み手、決めたいことを短く確認してから構成を考える", traits: t(5, 4, 4, 3, 5, 5) },
      { id: "b", text: "想定する目的と構成を仮案にし、早めに見てもらって方向を合わせる", traits: t(5, 4, 5, 5, 4, 4) },
      { id: "c", text: "過去の資料や会議参加者を調べ、共通する期待を見つけて案をつくる", traits: t(3, 3, 5, 4, 5, 5) },
      { id: "d", text: "必要な情報を先に集め、優先順位や不足点を一覧にして相談する", traits: t(4, 4, 4, 4, 5, 5) },
    ],
  },
];

export const traitMeta: { key: keyof SoftSkillTraits; label: string; short: string; color: string; description: string }[] = [
  { key: "communication", label: "伝える・聴く", short: "対話", color: "#315fa8", description: "意図を伝え、相手の話を聴く" },
  { key: "collaboration", label: "協働・調整", short: "協働", color: "#72a7d9", description: "周囲と役割や認識を合わせる" },
  { key: "initiative", label: "主体性", short: "主体", color: "#4c80c6", description: "必要な一歩を自分から始める" },
  { key: "adaptability", label: "柔軟性", short: "柔軟", color: "#78b7c5", description: "状況に合わせて方法を変える" },
  { key: "problemSolving", label: "課題解決", short: "解決", color: "#7a86c4", description: "課題を整理し、次の手を考える" },
  { key: "selfManagement", label: "自己管理", short: "自己管理", color: "#5c80a5", description: "優先度や気持ちを整えて進める" },
];
