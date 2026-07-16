import { useState } from "react";

/* ============================================================
   VERDICT: a standalone decision framework. No AI, no API.
   Methods: AHP pairwise weighting (Saaty scale, geometric mean,
   consistency ratio) → TOPSIS ranking → minimax regret check
   → weight sensitivity analysis for robustness.
   ============================================================ */

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --paper: #F3F4F0; --ink: #15171C; --ink-soft: #4A4E58; --line: #D8DAD2;
      --blue: #2B3EE8; --blue-dark: #1E2CB0; --rust: #D14E24; --card: #FCFCFA;
      --green: #1E7A46;
    }
    body { background: var(--paper); }
    .vd-root { min-height: 100vh; background: var(--paper); color: var(--ink);
      font-family: 'Instrument Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    .vd-shell { max-width: 880px; margin: 0 auto; padding: 28px 20px 90px; }
    .vd-brand { display: flex; align-items: baseline; justify-content: space-between;
      border-bottom: 2px solid var(--ink); padding-bottom: 12px; margin-bottom: 38px; }
    .vd-logo { font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 87%;
      font-size: 22px; letter-spacing: 0.04em; text-transform: uppercase; }
    .vd-logo span { color: var(--blue); }
    .vd-step { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-soft); }
    .vd-h1 { font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 82%;
      font-size: clamp(32px, 6vw, 52px); line-height: 1.02; text-transform: uppercase;
      margin-bottom: 14px; }
    .vd-sub { font-size: 16px; color: var(--ink-soft); line-height: 1.55; max-width: 600px; }
    .vd-label { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft);
      display: block; margin: 26px 0 8px; }
    .vd-input { width: 100%; background: var(--card); border: 1.5px solid var(--line);
      border-radius: 6px; padding: 12px 14px; font: 500 16px 'Instrument Sans', sans-serif;
      color: var(--ink); outline: none; transition: border-color .15s; }
    .vd-input:focus { border-color: var(--blue); }
    .vd-btn { font-family: 'Archivo', sans-serif; font-weight: 800; font-stretch: 90%;
      text-transform: uppercase; letter-spacing: 0.05em; font-size: 15px;
      background: var(--ink); color: var(--paper); border: none; border-radius: 6px;
      padding: 15px 26px; cursor: pointer; margin-top: 28px; transition: background .15s; }
    .vd-btn:hover { background: var(--blue); }
    .vd-btn:disabled { background: var(--line); color: var(--ink-soft); cursor: not-allowed; }
    .vd-btn:focus-visible, .vd-input:focus-visible, .vd-ghost:focus-visible,
    .vd-chipbtn:focus-visible, .vd-int:focus-visible, .vd-tag button:focus-visible {
      outline: 3px solid var(--blue); outline-offset: 2px; }
    .vd-ghost { background: none; border: 1.5px solid var(--line); border-radius: 6px;
      font: 600 13px 'IBM Plex Mono', monospace; color: var(--ink-soft);
      padding: 9px 14px; cursor: pointer; }
    .vd-ghost:hover { border-color: var(--ink); color: var(--ink); }
    .vd-row { display: flex; gap: 10px; align-items: center; }
    .vd-tag { display: inline-flex; align-items: center; gap: 8px; background: var(--card);
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 7px 8px 7px 14px;
      font: 600 14px 'Instrument Sans', sans-serif; margin: 0 8px 8px 0; }
    .vd-tag button { border: none; background: var(--ink); color: var(--paper);
      border-radius: 999px; width: 20px; height: 20px; font-size: 12px; cursor: pointer;
      line-height: 1; }
    .vd-chipbtn { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px;
      border: 1px dashed var(--ink-soft); border-radius: 999px; padding: 6px 13px;
      background: none; color: var(--ink-soft); cursor: pointer; margin: 0 8px 8px 0; }
    .vd-chipbtn:hover { border-color: var(--blue); color: var(--blue); border-style: solid; }
    .vd-hint { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-soft);
      margin-top: 8px; line-height: 1.6; }

    /* pairwise fork */
    .vd-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6px; }
    .vd-fork-q { font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 82%;
      font-size: clamp(24px, 4.4vw, 38px); text-transform: uppercase; line-height: 1.05;
      margin: 6px 0 24px; }
    .vd-vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center;
      border: 2px solid var(--ink); border-radius: 10px; background: var(--card);
      padding: 26px 22px; }
    .vd-vs-name { font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 85%;
      font-size: clamp(18px, 3vw, 26px); text-transform: uppercase; line-height: 1.05; }
    .vd-vs-name.right { text-align: right; }
    .vd-or { background: var(--ink); color: var(--paper); font-family: 'Archivo', sans-serif;
      font-weight: 900; font-size: 12px; letter-spacing: 0.06em; border-radius: 999px;
      width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }
    .vd-int-row { display: flex; flex-direction: column; gap: 9px; margin-top: 16px; }
    .vd-int { border: 1.5px solid var(--line); background: var(--card); border-radius: 8px;
      padding: 15px 16px; cursor: pointer; font: 500 15px 'Instrument Sans', sans-serif;
      color: var(--ink); line-height: 1.4; transition: all .12s; text-align: left;
      display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; }
    .vd-int:hover { border-color: var(--blue); background: #EEF0FE; }
    .vd-int:active { transform: translateY(1px); }
    .vd-int .side { font: 700 11px 'IBM Plex Mono', monospace; letter-spacing: 0.06em;
      text-transform: uppercase; border-radius: 999px; padding: 4px 10px; flex-shrink: 0;
      border: 1.5px solid currentColor; }
    .vd-int .side.a { color: var(--blue-dark); }
    .vd-int .side.b { color: var(--rust); }
    .vd-int .side.eq { color: var(--ink-soft); }
    .vd-int b { font-weight: 600; }
    .vd-dots { display: flex; gap: 6px; margin-top: 22px; flex-wrap: wrap; }
    .vd-dot { width: 22px; height: 5px; border-radius: 3px; background: var(--line); }
    .vd-dot.done { background: var(--blue); }
    .vd-dot.now { background: var(--ink); }

    /* scoring */
    .vd-score-card { border: 1.5px solid var(--line); border-radius: 10px; background: var(--card);
      padding: 18px 20px; margin-bottom: 12px; }
    .vd-score-name { font-family: 'Archivo', sans-serif; font-weight: 800; font-stretch: 88%;
      font-size: 17px; text-transform: uppercase; margin-bottom: 10px;
      display: flex; justify-content: space-between; align-items: baseline; }
    .vd-score-val { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--blue-dark); }
    input[type=range].vd-slider { width: 100%; accent-color: var(--blue); height: 26px; cursor: pointer; }

    /* verdict */
    .vd-stamp-wrap { border: 2.5px solid var(--ink); border-radius: 12px; background: var(--card);
      padding: 32px 28px 28px; position: relative; margin-top: 24px; overflow: hidden; }
    .vd-stamp { position: absolute; top: 20px; right: -34px; transform: rotate(11deg);
      border: 2.5px solid var(--rust); color: var(--rust); border-radius: 6px;
      font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 15px;
      letter-spacing: 0.16em; padding: 6px 42px; text-transform: uppercase; opacity: .9;
      animation: stampIn .35s cubic-bezier(.2,1.6,.4,1) both .2s; }
    @keyframes stampIn { from { transform: rotate(11deg) scale(2.1); opacity: 0; }
      to { transform: rotate(11deg) scale(1); opacity: .9; } }
    @media (prefers-reduced-motion: reduce) { .vd-stamp { animation: none; } }
    .vd-win-name { font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 80%;
      font-size: clamp(28px, 5.2vw, 44px); text-transform: uppercase; line-height: 1.02;
      max-width: 76%; }
    .vd-why { font-size: 16px; line-height: 1.6; margin-top: 14px; max-width: 640px; }
    .vd-meter-row { display: flex; align-items: center; gap: 10px; margin-top: 10px;
      font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-soft); }
    .vd-meter-row .lbl { width: 130px; flex-shrink: 0; }
    .vd-bar { flex: 1; height: 8px; background: var(--paper); border: 1px solid var(--line);
      border-radius: 4px; overflow: hidden; max-width: 320px; }
    .vd-bar i { display: block; height: 100%; background: var(--blue); }
    .vd-bar.g i { background: var(--green); }
    .vd-runner { border: 1.5px solid var(--line); border-radius: 10px; background: var(--card);
      padding: 18px 22px; margin-top: 14px; }
    .vd-runner h3 { font-family: 'Archivo', sans-serif; font-weight: 800; font-stretch: 88%;
      font-size: 18px; text-transform: uppercase; }
    .vd-section { margin-top: 34px; }
    .vd-item { display: grid; grid-template-columns: minmax(120px, 210px) 1fr; gap: 16px;
      padding: 13px 0; border-top: 1px solid var(--line); font-size: 14.5px; line-height: 1.5; }
    .vd-item b { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }
    .vd-item span { color: var(--ink-soft); }
    .vd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .vd-chip { font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid var(--line);
      border-radius: 999px; padding: 5px 12px; background: var(--card); color: var(--ink-soft); }
    .vd-chip b { color: var(--ink); }
    .vd-note { border: 1.5px solid var(--rust); background: #FBEDE7; color: #7C2C10;
      border-radius: 8px; padding: 13px 16px; font-size: 14px; line-height: 1.55; margin-top: 18px; }
    .vd-note.ok { border-color: var(--green); background: #E9F4EC; color: #144D2C; }
    @media (max-width: 620px) {
      .vd-vs { grid-template-columns: 1fr; text-align: center; }
      .vd-vs-name.right { text-align: center; }
      .vd-or { margin: 0 auto; }
      .vd-win-name { max-width: 100%; }
      .vd-stamp { position: static; display: inline-block; transform: rotate(-2deg);
        margin-bottom: 12px; padding: 5px 16px; }
      .vd-item { grid-template-columns: 1fr; gap: 4px; }
    }
  `}</style>
);

/* ================= decision mathematics ================= */

// Convert raw answers (sliders, yes/no, real numbers) into comparable 0-10 scores
function normalizeScores(options, criteria, raw) {
  const norm = {};
  options.forEach((o) => (norm[o.id] = {}));
  criteria.forEach((c) => {
    if (c.type === "yesno") {
      options.forEach((o) => (norm[o.id][c.id] = raw[o.id][c.id] === true ? 10 : 0));
    } else if (c.type === "number") {
      const vals = options.map((o) => Number(raw[o.id][c.id]));
      const min = Math.min(...vals), max = Math.max(...vals);
      options.forEach((o, i) => {
        let v = max === min ? 5 : ((vals[i] - min) / (max - min)) * 10;
        if (c.lowerBetter) v = 10 - v;
        norm[o.id][c.id] = v;
      });
    } else {
      options.forEach((o) => (norm[o.id][c.id] = Number(raw[o.id][c.id])));
    }
  });
  return norm;
}

// Show a raw answer in human terms
function fmtRaw(c, v) {
  if (c.type === "yesno") return v === true ? "yes" : "no";
  if (c.type === "number") return `${v}`;
  return `${v}/10`;
}

// --- AHP: weights from pairwise judgments (geometric mean method) + consistency ratio
function ahp(criteria, judgments) {
  const n = criteria.length;
  // build full reciprocal comparison matrix
  const M = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      const v = judgments[key] ?? 1;
      return i < j ? v : 1 / v;
    })
  );
  // geometric mean of each row → normalised weights
  const gm = M.map((row) => Math.pow(row.reduce((p, v) => p * v, 1), 1 / n));
  const sum = gm.reduce((a, b) => a + b, 0);
  const w = gm.map((v) => v / sum);
  // consistency: lambda_max via (M·w)_i / w_i
  const Mw = M.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
  const lambdaMax = Mw.reduce((s, v, i) => s + v / w[i], 0) / n;
  const CI = (lambdaMax - n) / (n - 1 || 1);
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41][n - 1] || 1.45;
  const CR = n <= 2 ? 0 : CI / RI;
  const weights = {};
  criteria.forEach((c, i) => (weights[c.id] = w[i]));
  return { weights, CR };
}

// --- TOPSIS: closeness to ideal solution
function topsis(options, criteria, weights, scores) {
  const ids = criteria.map((c) => c.id);
  const norms = {};
  ids.forEach((id) => {
    norms[id] = Math.sqrt(options.reduce((s, o) => s + Math.pow(scores[o.id][id], 2), 0)) || 1;
  });
  const W = options.map((o) => ids.map((id) => (scores[o.id][id] / norms[id]) * weights[id]));
  const ideal = ids.map((_, j) => Math.max(...W.map((r) => r[j])));
  const anti = ids.map((_, j) => Math.min(...W.map((r) => r[j])));
  return options
    .map((o, i) => {
      const dP = Math.sqrt(W[i].reduce((s, v, j) => s + (v - ideal[j]) ** 2, 0));
      const dM = Math.sqrt(W[i].reduce((s, v, j) => s + (v - anti[j]) ** 2, 0));
      return { ...o, closeness: dP + dM === 0 ? 0 : dM / (dP + dM) };
    })
    .sort((a, b) => b.closeness - a.closeness);
}

// --- weighted-sum cross-check (SAW)
function weightedSum(options, criteria, weights, scores) {
  return options
    .map((o) => ({
      ...o,
      total: criteria.reduce((s, c) => s + weights[c.id] * (scores[o.id][c.id] / 10), 0),
    }))
    .sort((a, b) => b.total - a.total);
}

// --- minimax regret: weighted opportunity loss vs the best on each criterion
function minimaxRegret(options, criteria, weights, scores) {
  const best = {};
  criteria.forEach((c) => {
    best[c.id] = Math.max(...options.map((o) => scores[o.id][c.id]));
  });
  return options
    .map((o) => ({
      ...o,
      maxRegret: Math.max(
        ...criteria.map((c) => weights[c.id] * (best[c.id] - scores[o.id][c.id]))
      ),
    }))
    .sort((a, b) => a.maxRegret - b.maxRegret);
}

// --- sensitivity: perturb each weight ±25%, does the TOPSIS winner survive?
function sensitivity(options, criteria, weights, scores, winnerId) {
  let held = 0, total = 0;
  for (const c of criteria) {
    for (const factor of [0.75, 1.25]) {
      const w = { ...weights, [c.id]: weights[c.id] * factor };
      const s = Object.values(w).reduce((a, b) => a + b, 0);
      Object.keys(w).forEach((k) => (w[k] = w[k] / s));
      total++;
      if (topsis(options, criteria, w, scores)[0].id === winnerId) held++;
    }
  }
  return held / total;
}

// plain-language rationale, generated from the numbers
function buildRationale(ranked, criteria, weights, scores, raw, regretRank, robustness, sawAgrees) {
  const win = ranked[0], run = ranked[1];
  const sorted = [...criteria].sort((a, b) => weights[b.id] - weights[a.id]);
  const advantages = sorted.filter((c) => scores[win.id][c.id] >= scores[run.id][c.id]);
  const topAdv = advantages.slice(0, 2).map((c) => c.name);
  const concession = sorted.find((c) => scores[win.id][c.id] < scores[run.id][c.id]);
  const advWeight = advantages.reduce((s, c) => s + weights[c.id], 0);

  let why = `${win.name} comes out on top for ${topAdv.join(" and ") || "the things you care about most"}, and wins on the factors that carry ${Math.round(advWeight * 100)}% of what you said matters.`;
  if (concession)
    why += ` It gives up a little on ${concession.name.toLowerCase()}, but not enough to change the answer.`;
  if (regretRank[0].id === win.id)
    why += ` It's also the safest pick: whichever way things go, it leaves the least on the table.`;
  if (sawAgrees) why += ` Two different ways of running the numbers both land on it.`;

  const runnerCrit = [...criteria].sort(
    (a, b) =>
      weights[b.id] * (scores[run?.id]?.[b.id] - scores[win.id][b.id]) -
      weights[a.id] * (scores[run?.id]?.[a.id] - scores[win.id][a.id])
  )[0];
  const runnerNote = run
    ? scores[run.id][runnerCrit.id] > scores[win.id][runnerCrit.id]
      ? `Pick ${run.name} only if ${runnerCrit.name.toLowerCase()} matters more to you than your tradeoff answers suggested.`
      : `${run.name} never actually beats the winner where it counts for you.`
    : "";

  const whyNot = ranked.slice(2).map((o) => {
    const worst = [...criteria].sort(
      (a, b) =>
        weights[b.id] * (scores[ranked[0].id][b.id] - scores[o.id][b.id]) -
        weights[a.id] * (scores[ranked[0].id][a.id] - scores[o.id][a.id])
    )[0];
    let reason;
    if (worst.type === "yesno" && raw[o.id][worst.id] !== true && raw[ranked[0].id][worst.id] === true) {
      reason = `It's missing ${worst.name.toLowerCase()}, which the winner has, and you said that matters.`;
    } else if (worst.type === "number") {
      reason = `Its ${worst.name.toLowerCase()} of ${fmtRaw(worst, raw[o.id][worst.id])} loses out to the winner's ${fmtRaw(worst, raw[ranked[0].id][worst.id])}, and that's one of the things you said matters most.`;
    } else {
      reason = `Falls well behind on ${worst.name.toLowerCase()} (${fmtRaw(worst, raw[o.id][worst.id])} vs the winner's ${fmtRaw(worst, raw[ranked[0].id][worst.id])}), and that's one of the things you said matters most.`;
    }
    return { name: o.name, reason };
  });

  const closer =
    robustness >= 0.9
      ? "This answer barely budges even when your priorities get shaken up. You can stop researching now."
      : robustness >= 0.7
        ? "This answer holds up under most shifts in your priorities. It's safe to commit."
        : "This one is genuinely close. The top two are nearly interchangeable, so pick either one and don't look back.";

  return { why, runnerNote, whyNot, closer };
}

/* ================= UI data ================= */

const SUGGESTED = [
  { n: "Price", type: "number", lowerBetter: true },
  { n: "Build quality", type: "scale" },
  { n: "Ease of use", type: "scale" },
  { n: "Comfort", type: "scale" },
  { n: "Battery life", type: "number", lowerBetter: false },
  { n: "Weight", type: "number", lowerBetter: true },
  { n: "Looks", type: "scale" },
  { n: "Waterproof", type: "yesno" },
  { n: "Warranty length", type: "number", lowerBetter: false },
  { n: "Durability", type: "scale" },
];

const TYPE_LABEL = { scale: "rate 0-10", yesno: "yes / no", number: "a number" };
const typeBadge = (c) =>
  c.type === "number" ? `number, ${c.lowerBetter ? "lower" : "higher"} is better` : TYPE_LABEL[c.type];

const EXAMPLE = {
  name: "Which ereader should I buy?",
  options: ["Kindle Paperwhite", "Kobo Libra Colour", "Kobo Clara BW", "Onyx Boox Go 6"],
  criteria: [
    { n: "Price (AUD)", type: "number", lowerBetter: true },
    { n: "Borrows library books directly", type: "yesno" },
    { n: "Screen quality", type: "scale" },
    { n: "Comfort in hand", type: "scale" },
    { n: "Works with other apps and formats", type: "scale" },
  ],
  raw: [
    [269, false, 8, 6, 3],
    [359, true, 8, 9, 7],
    [219, true, 7, 7, 7],
    [299, false, 7, 6, 9],
  ],
};

let uid = 0;
const nid = () => `id${++uid}`;

/* ================= component ================= */

export default function Verdict() {
  const [phase, setPhase] = useState("setup"); // setup | weigh | score | verdict
  const [name, setName] = useState("");
  const [options, setOptions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [optDraft, setOptDraft] = useState("");
  const [critDraft, setCritDraft] = useState("");
  const [critType, setCritType] = useState("scale"); // scale | yesno | number-low | number-high
  const [pairs, setPairs] = useState([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [judgments, setJudgments] = useState({});
  const [scores, setScores] = useState({});
  const [critIdx, setCritIdx] = useState(0);
  const [result, setResult] = useState(null);

  const addOption = (label) => {
    const v = (label ?? optDraft).trim();
    if (!v || options.length >= 8 || options.some((o) => o.name.toLowerCase() === v.toLowerCase())) return;
    setOptions([...options, { id: nid(), name: v }]);
    setOptDraft("");
  };
  const addCriterion = (preset) => {
    const v = (preset ? preset.n : critDraft).trim();
    if (!v || criteria.length >= 6 || criteria.some((c) => c.name.toLowerCase() === v.toLowerCase())) return;
    const type = preset ? preset.type : critType.startsWith("number") ? "number" : critType;
    const lowerBetter = preset ? !!preset.lowerBetter : critType === "number-low";
    setCriteria([...criteria, { id: nid(), name: v, type, lowerBetter }]);
    setCritDraft("");
  };

  const loadExample = () => {
    const opts = EXAMPLE.options.map((n) => ({ id: nid(), name: n }));
    const crits = EXAMPLE.criteria.map((c) => ({
      id: nid(), name: c.n, type: c.type, lowerBetter: !!c.lowerBetter,
    }));
    const sc = {};
    opts.forEach((o, i) => {
      sc[o.id] = {};
      crits.forEach((c, j) => (sc[o.id][c.id] = EXAMPLE.raw[i][j]));
    });
    setName(EXAMPLE.name);
    setOptions(opts);
    setCriteria(crits);
    setScores(sc);
  };

  const startWeighing = () => {
    const p = [];
    for (let i = 0; i < criteria.length; i++)
      for (let j = i + 1; j < criteria.length; j++) p.push([i, j]);
    setPairs(p);
    setPairIdx(0);
    setJudgments({});
    // ensure score store exists (preserves example prefill)
    setScores((prev) => {
      const next = { ...prev };
      options.forEach((o) => {
        next[o.id] = { ...(next[o.id] || {}) };
        criteria.forEach((c) => {
          const cur = next[o.id][c.id];
          if (c.type === "yesno") {
            if (typeof cur !== "boolean") next[o.id][c.id] = false;
          } else if (c.type === "number") {
            if (typeof cur !== "number" && cur !== "" && typeof cur !== "string") next[o.id][c.id] = "";
          } else if (typeof cur !== "number") {
            next[o.id][c.id] = 5;
          }
        });
      });
      return next;
    });
    setPhase("weigh");
  };

  const judge = (intensity) => {
    const [i, j] = pairs[pairIdx];
    const v = intensity.side === "=" ? 1 : intensity.side === "L" ? intensity.v : 1 / intensity.v;
    setJudgments((prev) => ({ ...prev, [`${i}-${j}`]: v }));
    if (pairIdx + 1 < pairs.length) setPairIdx(pairIdx + 1);
    else {
      setCritIdx(0);
      setPhase("score");
    }
  };

  const setScore = (optId, critId, v) =>
    setScores((prev) => ({ ...prev, [optId]: { ...prev[optId], [critId]: v } }));

  const numbersMissing = (c) =>
    c.type === "number" &&
    options.some((o) => scores[o.id]?.[c.id] === "" || !Number.isFinite(Number(scores[o.id]?.[c.id])));

  const finishScoring = () => {
    const norm = normalizeScores(options, criteria, scores);
    const { weights, CR } = ahp(criteria, judgments);
    const ranked = topsis(options, criteria, weights, norm);
    const saw = weightedSum(options, criteria, weights, norm);
    const regretRank = minimaxRegret(options, criteria, weights, norm);
    const robustness = sensitivity(options, criteria, weights, norm, ranked[0].id);
    const sawAgrees = saw[0].id === ranked[0].id;
    const rationale = buildRationale(ranked, criteria, weights, norm, scores, regretRank, robustness, sawAgrees);
    setResult({ weights, CR, ranked, saw, regretRank, robustness, sawAgrees, rationale });
    setPhase("verdict");
  };

  const reset = () => {
    setPhase("setup"); setName(""); setOptions([]); setCriteria([]);
    setJudgments({}); setScores({}); setResult(null); setPairIdx(0); setCritIdx(0);
  };

  const sortedW = result
    ? [...criteria].sort((a, b) => result.weights[b.id] - result.weights[a.id])
    : [];

  return (
    <div className="vd-root">
      {FONTS}
      <div className="vd-shell">
        <div className="vd-brand">
          <div className="vd-logo">Verdict<span>.</span><sup style={{ fontSize: 10, letterSpacing: 0, marginLeft: 2 }}>™</sup></div>
          <div className="vd-step">
            {phase === "setup" && "01 / the decision"}
            {phase === "weigh" && `02 / question ${pairIdx + 1} of ${pairs.length}`}
            {phase === "score" && `03 / rating ${critIdx + 1} of ${criteria.length}`}
            {phase === "verdict" && "04 / verdict"}
          </div>
        </div>

        {/* ---------- SETUP ---------- */}
        {phase === "setup" && (
          <div>
            <h1 className="vd-h1">Stop researching.<br />Start deciding.</h1>
            <p className="vd-sub">
              Can't choose? List your options, answer a few easy either/or questions,
              and this tool runs the numbers and hands you one clear answer, plus proof
              it can back it up. Everything happens on your device.
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="vd-ghost" onClick={loadExample}>
                Load the ereader example
              </button>
              {name === EXAMPLE.name && (
                <p className="vd-hint" style={{ marginTop: 8 }}>
                  Example loaded. Everything below is filled in, including the ratings,
                  so you can just click through and watch it work.
                </p>
              )}
            </div>

            <label className="vd-label" htmlFor="vd-name">Step 1 · What are you deciding?</label>
            <input id="vd-name" className="vd-input" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Which ereader should I buy?" />

            <label className="vd-label" htmlFor="vd-opt">
              Step 2 · List the exact things you're choosing between
            </label>
            <p className="vd-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              These are the specific products, places, or choices on your list. Type one
              at a time and press Add. For an ereader that might be "Kindle Paperwhite",
              then "Kobo Clara", and so on. You need at least 2.
            </p>
            <div style={{ marginBottom: 8 }}>
              {options.map((o) => (
                <span className="vd-tag" key={o.id}>
                  {o.name}
                  <button aria-label={`Remove ${o.name}`}
                    onClick={() => setOptions(options.filter((x) => x.id !== o.id))}>×</button>
                </span>
              ))}
            </div>
            <div className="vd-row">
              <input id="vd-opt" className="vd-input" value={optDraft}
                onChange={(e) => setOptDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="Type one option, e.g. Kindle Paperwhite" />
              <button className="vd-ghost" onClick={() => addOption()}>Add</button>
            </div>

            <label className="vd-label">
              Step 3 · Add what matters to you, in your own words (3 to 6 things)
            </label>
            <p className="vd-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              Anything you'd weigh up when choosing: price, comfort, a feature it must
              have. Type it below, then pick how you'll answer it: a 0 to 10 rating for
              feelings, yes or no for features, or a real number for facts like price.
            </p>
            <div style={{ marginBottom: 8 }}>
              {criteria.map((c) => (
                <span className="vd-tag" key={c.id}>
                  {c.name}
                  <em style={{ fontStyle: "normal", fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11, color: "var(--ink-soft)" }}>{typeBadge(c)}</em>
                  <button aria-label={`Remove ${c.name}`}
                    onClick={() => setCriteria(criteria.filter((x) => x.id !== c.id))}>×</button>
                </span>
              ))}
            </div>
            <div className="vd-row" style={{ flexWrap: "wrap" }}>
              <input className="vd-input" style={{ flex: "1 1 200px" }} value={critDraft}
                onChange={(e) => setCritDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCriterion()}
                placeholder="Type something that matters, e.g. has warm light" />
              <select className="vd-input" style={{ flex: "0 1 230px", cursor: "pointer" }}
                aria-label="How will you answer this one?"
                value={critType} onChange={(e) => setCritType(e.target.value)}>
                <option value="scale">I'll rate it 0 to 10</option>
                <option value="yesno">It's a yes or no</option>
                <option value="number-low">It's a number, lower is better</option>
                <option value="number-high">It's a number, higher is better</option>
              </select>
              <button className="vd-ghost" onClick={() => addCriterion()}>Add</button>
            </div>
            <p className="vd-hint" style={{ marginTop: 14, marginBottom: 6 }}>
              Stuck for ideas? A few common ones you can tap:
            </p>
            <div>
              {SUGGESTED.filter((s) => !criteria.some((c) => c.name === s.n))
                .slice(0, 4)
                .map((s) => (
                  <button className="vd-chipbtn" key={s.n} onClick={() => addCriterion(s)}>
                    + {s.n}
                  </button>
                ))}
            </div>

            <button className="vd-btn"
              disabled={options.length < 2 || criteria.length < 3}
              onClick={startWeighing}>
              Weigh what matters →
            </button>
            {(options.length < 2 || criteria.length < 3) && (
              <p className="vd-hint">Add at least 2 options and 3 things that matter to continue.</p>
            )}
          </div>
        )}

        {/* ---------- WEIGH (AHP) ---------- */}
        {phase === "weigh" && pairs[pairIdx] && (() => {
          const A = criteria[pairs[pairIdx][0]].name;
          const B = criteria[pairs[pairIdx][1]].name;
          const choices = [
            { key: "A5", side: "a", badge: "A", text: <><b>{A}</b> matters much more</>, label: `${A} matters much more than ${B}`, v: 5, dir: "L" },
            { key: "A3", side: "a", badge: "A", text: <><b>{A}</b> matters a bit more</>, label: `${A} matters a bit more than ${B}`, v: 3, dir: "L" },
            { key: "EQ", side: "eq", badge: "=", text: <>They matter <b>equally</b></>, label: `${A} and ${B} matter equally`, v: 1, dir: "=" },
            { key: "B3", side: "b", badge: "B", text: <><b>{B}</b> matters a bit more</>, label: `${B} matters a bit more than ${A}`, v: 3, dir: "R" },
            { key: "B5", side: "b", badge: "B", text: <><b>{B}</b> matters much more</>, label: `${B} matters much more than ${A}`, v: 5, dir: "R" },
          ];
          return (
            <div>
              <div className="vd-kicker">{name || "your decision"} · working out what matters most to you</div>
              <div className="vd-fork-q">Which matters more?</div>
              <div className="vd-vs">
                <div className="vd-vs-name" style={{ color: "var(--blue-dark)" }}>
                  <span className="vd-kicker" style={{ display: "block" }}>A</span>{A}
                </div>
                <div className="vd-or">VS</div>
                <div className="vd-vs-name right" style={{ color: "var(--rust)" }}>
                  <span className="vd-kicker" style={{ display: "block" }}>B</span>{B}
                </div>
              </div>
              <div className="vd-int-row" role="group" aria-label="Choose which one matters more to you">
                {choices.map((ch) => (
                  <button className="vd-int" key={ch.key} aria-label={ch.label}
                    onClick={() => judge({ side: ch.dir, v: ch.v })}>
                    <span className={`side ${ch.side}`}>{ch.badge}</span>
                    <span>{ch.text}</span>
                  </button>
                ))}
              </div>
              <div className="vd-dots" aria-hidden="true">
                {pairs.map((_, i) => (
                  <div key={i} className={`vd-dot ${i < pairIdx ? "done" : i === pairIdx ? "now" : ""}`} />
                ))}
              </div>
              <div className="vd-row" style={{ marginTop: 16 }}>
                {pairIdx > 0 && (
                  <button className="vd-ghost" onClick={() => setPairIdx(pairIdx - 1)}>
                    ← Back a question
                  </button>
                )}
              </div>
              <p className="vd-hint" style={{ marginTop: 14 }}>
                Why two at a time? Because comparing two things is easy and rating ten things
                at once is not. Your answers quietly build a picture of how much each factor
                really matters to you, and the tool even checks whether your answers agree
                with each other.
              </p>
            </div>
          );
        })()}

        {/* ---------- SCORE ---------- */}
        {phase === "score" && criteria[critIdx] && (
          <div>
            <div className="vd-kicker">
              rating {critIdx + 1} of {criteria.length}
            </div>
            <div className="vd-fork-q">{criteria[critIdx].name}</div>
            <p className="vd-sub" style={{ marginBottom: 20 }}>
              {criteria[critIdx].type === "yesno" &&
                "Simple one. Does each option have it, yes or no?"}
              {criteria[critIdx].type === "number" &&
                `Type the actual number for each option. ${criteria[critIdx].lowerBetter ? "Lower" : "Higher"} is better here, and the tool will compare them for you.`}
              {criteria[critIdx].type === "scale" &&
                "Just on this one thing, how does each option do? 0 means terrible, 10 means as good as it gets. Forget everything else for now."}
            </p>
            {options.map((o) => {
              const c = criteria[critIdx];
              const val = scores[o.id]?.[c.id];
              return (
                <div className="vd-score-card" key={o.id}>
                  <div className="vd-score-name">
                    {o.name}
                    {c.type === "scale" && <span className="vd-score-val">{val ?? 5} / 10</span>}
                  </div>
                  {c.type === "scale" && (
                    <input type="range" min="0" max="10" step="1" className="vd-slider"
                      aria-label={`${o.name}: ${c.name}`}
                      value={val ?? 5}
                      onChange={(e) => setScore(o.id, c.id, Number(e.target.value))} />
                  )}
                  {c.type === "yesno" && (
                    <div className="vd-row">
                      <button className="vd-ghost"
                        style={val === true
                          ? { borderColor: "var(--green)", color: "var(--green)", fontWeight: 700 }
                          : {}}
                        onClick={() => setScore(o.id, c.id, true)}>Yes</button>
                      <button className="vd-ghost"
                        style={val === false
                          ? { borderColor: "var(--rust)", color: "var(--rust)", fontWeight: 700 }
                          : {}}
                        onClick={() => setScore(o.id, c.id, false)}>No</button>
                    </div>
                  )}
                  {c.type === "number" && (
                    <input type="number" inputMode="decimal" className="vd-input"
                      aria-label={`${o.name}: ${c.name}`}
                      value={val ?? ""}
                      placeholder={c.lowerBetter ? "e.g. 249" : "e.g. 12"}
                      onChange={(e) => setScore(o.id, c.id, e.target.value)} />
                  )}
                </div>
              );
            })}
            <div className="vd-row">
              <button className="vd-ghost"
                onClick={() =>
                  critIdx > 0
                    ? setCritIdx(critIdx - 1)
                    : (setPairIdx(pairs.length - 1), setPhase("weigh"))
                }>
                ← Back
              </button>
              <button className="vd-btn" style={{ marginTop: 0 }}
                disabled={numbersMissing(criteria[critIdx])}
                onClick={() =>
                  critIdx + 1 < criteria.length ? setCritIdx(critIdx + 1) : finishScoring()
                }>
                {critIdx + 1 < criteria.length ? "Next →" : "Get my answer →"}
              </button>
            </div>
            {numbersMissing(criteria[critIdx]) && (
              <p className="vd-hint">Fill in a number for every option to continue.</p>
            )}
          </div>
        )}

        {/* ---------- VERDICT ---------- */}
        {phase === "verdict" && result && (
          <div>
            <div className="vd-kicker">{name || "your decision"} · the answer is in</div>
            <h1 className="vd-h1">Pick this one.</h1>

            <div className="vd-stamp-wrap">
              <div className="vd-stamp">Verdict</div>
              <div className="vd-win-name">{result.ranked[0].name}</div>
              <p className="vd-why">{result.rationale.why}</p>
              <div style={{ marginTop: 18 }}>
                <div className="vd-meter-row">
                  <span className="lbl">fit score</span>
                  <div className="vd-bar"><i style={{ width: `${result.ranked[0].closeness * 100}%` }} /></div>
                  <span>{Math.round(result.ranked[0].closeness * 100)} / 100</span>
                </div>
                <div className="vd-meter-row">
                  <span className="lbl">steadiness</span>
                  <div className="vd-bar g"><i style={{ width: `${result.robustness * 100}%` }} /></div>
                  <span>
                    stays the winner {Math.round(result.robustness * 100)}% of the time
                  </span>
                </div>
              </div>
            </div>

            {result.CR > 0.1 && (
              <div className="vd-note">
                One thing to know: some of your either/or answers pulled in different
                directions, which happens to everyone. The answer still stands, but if
                it feels off, redo the questions and see if it changes.
              </div>
            )}
            {result.CR <= 0.1 && criteria.length > 2 && (
              <div className="vd-note ok">
                Nice one: your either/or answers all lined up with each other, so the
                result genuinely reflects what you said matters.
              </div>
            )}

            {result.ranked[1] && (
              <div className="vd-runner">
                <div className="vd-kicker">
                  second place · fit score {Math.round(result.ranked[1].closeness * 100)}
                </div>
                <h3>{result.ranked[1].name}</h3>
                <p className="vd-why" style={{ marginTop: 8, fontSize: 14.5 }}>
                  {result.rationale.runnerNote}
                </p>
              </div>
            )}

            {result.rationale.whyNot.length > 0 && (
              <div className="vd-section">
                <div className="vd-kicker">Why not the others</div>
                {result.rationale.whyNot.map((w, i) => (
                  <div className="vd-item" key={i}>
                    <b>{w.name}</b>
                    <span>{w.reason}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="vd-section">
              <div className="vd-kicker">How much each thing mattered to you</div>
              <div className="vd-chips">
                {sortedW.map((c) => (
                  <div className="vd-chip" key={c.id}>
                    <b>{c.name}</b> {Math.round(result.weights[c.id] * 100)}%
                  </div>
                ))}
              </div>
            </div>

            <div className="vd-section">
              <div className="vd-kicker">Double checks</div>
              <div className="vd-item">
                <b>A second opinion</b>
                <span>
                  {result.sawAgrees
                    ? `The result was checked with a second, simpler way of adding up the scores. It also picks ${result.saw[0].name}.`
                    : `A second, simpler way of adding up the scores prefers ${result.saw[0].name}. When two methods disagree, it means the race is very close, so treat the top two as equally good choices.`}
                </span>
              </div>
              <div className="vd-item">
                <b>The no-regrets check</b>
                <span>
                  {result.regretRank[0].name} is the pick you'd be least likely to kick
                  yourself over later
                  {result.regretRank[0].id === result.ranked[0].id
                    ? ", and it's the same as the winner. Good sign."
                    : ". Worth knowing if avoiding buyer's remorse matters more to you than getting the absolute best."}
                </span>
              </div>
              <div className="vd-item">
                <b>The stress test</b>
                <span>
                  We nudged your priorities up and down and re-ran the whole thing{" "}
                  {2 * criteria.length} times. The winner came out on top in{" "}
                  {Math.round(result.robustness * 100)}% of those re-runs.
                </span>
              </div>
            </div>

            <p className="vd-why" style={{ fontWeight: 600, marginTop: 28 }}>
              {result.rationale.closer}
            </p>
            <div className="vd-row" style={{ marginTop: 16 }}>
              <button className="vd-ghost" onClick={() => { setPairIdx(0); setJudgments({}); setPhase("weigh"); }}>
                Redo the weighting
              </button>
              <button className="vd-ghost" onClick={reset}>New decision</button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 60, borderTop: "1px solid var(--line)", paddingTop: 16,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--ink-soft)",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>Verdict™ · built by Sunny Sangar</span>
          <a href="https://sunnysangar.com" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--blue-dark)", textDecoration: "none" }}>
            sunnysangar.com
          </a>
        </div>
      </div>
    </div>
  );
}
