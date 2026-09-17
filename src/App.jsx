import { useEffect, useRef, useState } from "react";
import { answerMissing, evaluateDecision } from "./decision.js";

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

    .vd-row { flex-wrap: wrap; }
    .vd-row > .vd-input { flex: 1; min-width: 0; }
    .vd-ghost:disabled, .vd-chipbtn:disabled { opacity: .5; cursor: not-allowed; }
    .vd-tag { max-width: 100%; flex-wrap: wrap; overflow-wrap: anywhere; }
    .vd-tag button { flex-shrink: 0; }
    .vd-vs-name, .vd-fork-q, .vd-win-name, .vd-item, .vd-kicker,
    .vd-score-name, .vd-why, .vd-chip { overflow-wrap: anywhere; min-width: 0; }
    .vd-score-name { gap: 12px; flex-wrap: wrap; }
    .vd-score-val { flex-shrink: 0; }
    .vd-meter-row { flex-wrap: wrap; }
    .vd-bar { min-width: 60px; }
    .vd-int > span:last-child { min-width: 0; overflow-wrap: anywhere; }

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
  const [error, setError] = useState("");
  const stageRef = useRef(null);
  useEffect(() => {
    if (phase !== "setup") {
      stageRef.current?.querySelector("h1")?.focus();
      window.scrollTo(0, 0);
    }
  }, [phase, pairIdx, critIdx]);

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
            if (typeof cur !== "boolean") next[o.id][c.id] = null;
          } else if (c.type === "number") {
            if (typeof cur !== "number" && cur !== "" && typeof cur !== "string") next[o.id][c.id] = "";
          } else if (typeof cur !== "number") {
            next[o.id][c.id] = 5;
          }
        });
      });
      return next;
    });
    setError("");
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

  const answersMissing = (c) => options.some((o) => answerMissing(c, scores[o.id]?.[c.id]));

  const finishScoring = () => {
    setError("");
    try {
      setResult(evaluateDecision(options, criteria, scores, judgments));
      setPhase("verdict");
    } catch (err) {
      setError(err.message);
    }
  };

  const reset = () => {
    setPhase("setup"); setName(""); setOptions([]); setCriteria([]);
    setJudgments({}); setScores({}); setResult(null); setPairIdx(0); setCritIdx(0); setError("");
    setOptDraft(""); setCritDraft(""); setCritType("scale"); setPairs([]);
  };

  const sortedW = result
    ? [...criteria].sort((a, b) => result.weights[b.id] - result.weights[a.id])
    : [];

  return (
    <div className="vd-root">
      {FONTS}
      <main className="vd-shell" ref={stageRef}>
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
            <h1 className="vd-h1" tabIndex={-1}>Compare your options.</h1>
            <p className="vd-sub">
              List your options, compare your priorities, and rate each choice.
              See which options rank highest and how the result changes when you
              adjust what matters. Your answers stay in this browser tab.
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="vd-ghost" onClick={loadExample}>
                Load the ereader example
              </button>
              {name === EXAMPLE.name && (
                <p className="vd-hint" style={{ marginTop: 8 }}>
                  Practice example loaded, including sample prices and ratings.
                  These are not current product prices or verified specifications.
                </p>
              )}
            </div>

            <label className="vd-label" htmlFor="vd-name">Step 1 · What are you deciding?</label>
            <input id="vd-name" className="vd-input" value={name} maxLength={200}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Which ereader should I buy?" />

            <label className="vd-label" htmlFor="vd-opt">
              Step 2 · List the exact things you're choosing between
            </label>
            <p className="vd-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              These are the specific products, places, or choices on your list. Type one
              at a time and press Add. For an ereader that might be "Kindle Paperwhite",
              then "Kobo Clara", and so on. Add between 2 and 8 options.
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
              <input id="vd-opt" className="vd-input" value={optDraft} maxLength={100}
                onChange={(e) => setOptDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="Type one option, e.g. Kindle Paperwhite" />
              <button className="vd-ghost" disabled={options.length >= 8} onClick={() => addOption()}>Add</button>
            </div>

            <label className="vd-label" htmlFor="vd-criterion">
              Step 3 · Add what matters to you, in your own words (3 to 6 things)
            </label>
            <p className="vd-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              Anything you'd weigh up when choosing: price, comfort, or a feature you would
              prefer. Type it below, then pick how you'll answer it: a 0 to 10 rating for
              preferences, yes or no for features (yes is better), or a number for facts like price.
              A missing feature does not automatically exclude an option.
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
              <input id="vd-criterion" className="vd-input" maxLength={100} style={{ flex: "1 1 200px" }} value={critDraft}
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
              <button className="vd-ghost" disabled={criteria.length >= 6} onClick={() => addCriterion()}>Add</button>
            </div>
            <p className="vd-hint" style={{ marginTop: 14, marginBottom: 6 }}>
              Stuck for ideas? A few common ones you can tap:
            </p>
            <div>
              {SUGGESTED.filter((s) => !criteria.some((c) => c.name === s.n))
                .slice(0, 4)
                .map((s) => (
                  <button className="vd-chipbtn" key={s.n} disabled={criteria.length >= 6} onClick={() => addCriterion(s)}>
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
              <h1 className="vd-fork-q" tabIndex={-1}>Which matters more?</h1>
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
                <button className="vd-ghost" onClick={() => pairIdx > 0 ? setPairIdx(pairIdx - 1) : setPhase("setup")}>
                  {pairIdx > 0 ? "← Back a question" : "← Edit decision"}
                </button>
              </div>
              <p className="vd-hint" style={{ marginTop: 14 }}>
                These comparisons determine the weight of each priority.
                The result also checks whether your comparisons are consistent.
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
            <h1 className="vd-fork-q" tabIndex={-1}>{criteria[critIdx].name}</h1>
            <p className="vd-sub" style={{ marginBottom: 20 }}>
              {criteria[critIdx].type === "yesno" &&
                "Does each option have this feature? Choose Yes or No for every option."}
              {criteria[critIdx].type === "number" &&
                `Type the actual number for each option. ${criteria[critIdx].lowerBetter ? "Lower" : "Higher"} is better here, and the tool will compare them for you.`}
              {criteria[critIdx].type === "scale" &&
                "Rate each option on this priority: 0 is worst and 10 is best. Ratings start at 5; adjust them to reflect your assessment."}
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
                    <div className="vd-row" role="group" aria-label={`${o.name}: ${c.name}`}>
                      <button className="vd-ghost" aria-pressed={val === true}
                        style={val === true
                          ? { borderColor: "var(--green)", color: "var(--green)", fontWeight: 700 }
                          : {}}
                        onClick={() => setScore(o.id, c.id, true)}>Yes</button>
                      <button className="vd-ghost" aria-pressed={val === false}
                        style={val === false
                          ? { borderColor: "var(--rust)", color: "var(--rust)", fontWeight: 700 }
                          : {}}
                        onClick={() => setScore(o.id, c.id, false)}>No</button>
                    </div>
                  )}
                  {c.type === "number" && (
                    <input type="number" step="any" inputMode="decimal" className="vd-input"
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
                disabled={answersMissing(criteria[critIdx])}
                onClick={() =>
                  critIdx + 1 < criteria.length ? setCritIdx(critIdx + 1) : finishScoring()
                }>
                {critIdx + 1 < criteria.length ? "Next →" : "Get my answer →"}
              </button>
            </div>
            {error && <p className="vd-note" role="alert">{error}</p>}
            {answersMissing(criteria[critIdx]) && (
              <p className="vd-hint">Answer for every option to continue.</p>
            )}
          </div>
        )}

        {/* ---------- VERDICT ---------- */}
        {phase === "verdict" && result && (
          <div>
            <div className="vd-kicker">{name || "your decision"} · the answer is in</div>
            <h1 className="vd-h1" tabIndex={-1}>{result.top.length > 1 ? "No single winner." : "Your leading option."}</h1>

            <div className="vd-stamp-wrap">
              <div className="vd-stamp">{result.top.length > 1 ? "Tied" : "Verdict"}</div>
              <div className="vd-win-name">{result.top.map((o) => o.name).join(" / ")}</div>
              <p className="vd-why">{result.rationale.why}</p>
              <div style={{ marginTop: 18 }}>
                <div className="vd-meter-row">
                  <span className="lbl">relative score</span>
                  <div className="vd-bar"><i style={{ width: `${result.ranked[0].closeness * 100}%` }} /></div>
                  <span>{Math.round(result.ranked[0].closeness * 100)} / 100</span>
                </div>
                {result.top.length === 1 && <div className="vd-meter-row">
                  <span className="lbl">weight checks</span>
                  <div className="vd-bar g"><i style={{ width: `${result.stress.fraction * 100}%` }} /></div>
                  <span>{result.stress.held} of {result.stress.total} kept this sole leader</span>
                </div>}
                <p className="vd-hint">Scores compare these options using your ratings. They are not probabilities of a good purchase.</p>
              </div>
            </div>

            {result.CR > 0.1 && (
              <div className="vd-note">
                Some priority comparisons conflict (consistency ratio {result.CR.toFixed(2)}).
                Review the weighting before relying on this ranking.
              </div>
            )}
            {result.CR <= 0.1 && criteria.length > 2 && (
              <div className="vd-note ok">
                No large inconsistency was detected in your priority comparisons
                (consistency ratio {result.CR.toFixed(2)}).
              </div>
            )}

            {result.top.length === 1 && result.ranked[1] && (
              <div className="vd-runner">
                <div className="vd-kicker">
                  next option · relative score {Math.round(result.ranked[1].closeness * 100)}
                </div>
                <h3>{result.ranked[1].name}</h3>
                <p className="vd-why" style={{ marginTop: 8, fontSize: 14.5 }}>
                  {result.rationale.runnerNote}
                </p>
              </div>
            )}

            {result.rationale.whyNot.length > 0 && (
              <div className="vd-section">
                <div className="vd-kicker">Other comparisons</div>
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
                  {result.sawLeaders.length > 1
                    ? `Adding the weighted scores gives a shared top score to ${result.sawLeaders.map((o) => o.name).join(" and ")}.`
                    : result.sawAgrees
                      ? `Adding the weighted scores also ranks ${result.saw[0].name} first.`
                      : `Adding the weighted scores ranks ${result.saw[0].name} first. These methods combine your ratings differently; disagreement does not establish that the choices are equally good.`}
                </span>
              </div>
              <div className="vd-item">
                <b>Largest shortfall</b>
                <span>
                  {result.regretLeaders.map((o) => o.name).join(" and ")} {result.regretLeaders.length > 1 ? "share" : "has"} the smallest
                  worst shortfall on any one priority, after applying your weights and
                  comparing against the best score for that priority.
                </span>
              </div>
              <div className="vd-item">
                <b>The stress test</b>
                <span>
                  {result.top.length > 1
                    ? "The base ranking is tied, so there is no single winner to describe as stable."
                    : `Each priority was increased and decreased by 25%, one at a time, then all weights were rescaled to sum to 100%. ${result.ranked[0].name} remained the sole leader in ${result.stress.held} of ${result.stress.total} scenarios and shared the lead in ${result.stress.tied}. These are limited scenarios, not a probability estimate.`}
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
              <button className="vd-ghost" onClick={() => { setCritIdx(0); setError(""); setPhase("score"); }}>Edit ratings</button>
              <button className="vd-ghost" onClick={() => { setResult(null); setPhase("setup"); }}>Edit decision</button>
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
      </main>
    </div>
  );
}
