// Convert raw answers (sliders, yes/no, real numbers) into comparable 0-10 scores
export function normalizeScores(options, criteria, raw) {
  const norm = {};
  options.forEach((o) => (norm[o.id] = {}));
  criteria.forEach((c) => {
    if (c.type === "yesno") {
      options.forEach((o) => (norm[o.id][c.id] = raw[o.id][c.id] === true ? 10 : 0));
    } else if (c.type === "number") {
      const vals = options.map((o) => Number(raw[o.id][c.id]));
      // Scaling before subtraction prevents overflow for finite values such as ±1e308.
      const magnitude = Math.max(1, ...vals.map(Math.abs));
      const scaled = vals.map((v) => v / magnitude);
      const min = Math.min(...scaled), max = Math.max(...scaled);
      options.forEach((o, i) => {
        let v = max === min ? 5 : ((scaled[i] - min) / (max - min)) * 10;
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
export function fmtRaw(c, v) {
  if (c.type === "yesno") return v === true ? "yes" : "no";
  if (c.type === "number") return `${v}`;
  return `${v}/10`;
}

// --- AHP: weights from pairwise judgments (geometric mean method) + consistency ratio
export function ahp(criteria, judgments) {
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
  const CR = n <= 2 ? 0 : Math.max(0, CI / RI);
  const weights = {};
  criteria.forEach((c, i) => (weights[c.id] = w[i]));
  return { weights, CR };
}

// --- TOPSIS: closeness to ideal solution
export function topsis(options, criteria, weights, scores) {
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
      return { ...o, closeness: dP + dM === 0 ? 0.5 : dM / (dP + dM) };
    })
    .sort((a, b) => b.closeness - a.closeness);
}

// --- weighted-sum cross-check (SAW)
export function weightedSum(options, criteria, weights, scores) {
  return options
    .map((o) => ({
      ...o,
      total: criteria.reduce((s, c) => s + weights[c.id] * (scores[o.id][c.id] / 10), 0),
    }))
    .sort((a, b) => b.total - a.total);
}

// --- minimax regret: weighted opportunity loss vs the best on each criterion
export function minimaxRegret(options, criteria, weights, scores) {
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

// Small numerical differences do not break an otherwise equal ranking.
export const TIE_TOLERANCE = 1e-9;

export function leaders(ranking, key = "closeness") {
  return ranking.filter((o) => Math.abs(o[key] - ranking[0][key]) <= TIE_TOLERANCE);
}

// These are deterministic scenarios, not probabilities or confidence intervals.
export function sensitivity(options, criteria, weights, scores, winnerId) {
  let held = 0, tied = 0, total = 0;
  for (const c of criteria) {
    for (const factor of [0.75, 1.25]) {
      const w = { ...weights, [c.id]: weights[c.id] * factor };
      const sum = Object.values(w).reduce((a, b) => a + b, 0);
      Object.keys(w).forEach((id) => (w[id] /= sum));
      const top = leaders(topsis(options, criteria, w, scores));
      total++;
      if (top.some((o) => o.id === winnerId)) {
        if (top.length === 1) held++;
        else tied++;
      }
    }
  }
  return { held, tied, total, fraction: held / total };
}

export function answerMissing(criterion, value) {
  if (criterion.type === "yesno") return typeof value !== "boolean";
  if ((typeof value !== "number" && typeof value !== "string") ||
      String(value).trim() === "" || !Number.isFinite(Number(value))) return true;
  return criterion.type === "scale" && (Number(value) < 0 || Number(value) > 10);
}

function validateDecision(options, criteria, raw, judgments) {
  if (options.length < 2 || options.length > 8 || criteria.length < 3 || criteria.length > 6)
    throw new Error("Use 2–8 options and 3–6 priorities.");
  for (const list of [options, criteria]) {
    if (new Set(list.map((item) => item.id)).size !== list.length)
      throw new Error("Options and priorities must have unique IDs.");
  }
  for (const c of criteria) {
    if (!["yesno", "scale", "number"].includes(c.type)) throw new Error("Unknown answer type.");
    for (const o of options) {
      if (answerMissing(c, raw[o.id]?.[c.id])) throw new Error(`Check the answer for ${o.name}: ${c.name}.`);
    }
  }
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      const v = judgments[`${i}-${j}`];
      if (!Number.isFinite(v) || v <= 0) throw new Error("Complete every priority comparison.");
    }
  }
}

export function buildRationale(ranked, criteria, weights, scores, raw, stress) {
  const win = ranked[0], run = ranked[1];
  const top = leaders(ranked);
  const sorted = [...criteria].sort((a, b) => weights[b.id] - weights[a.id]);
  const advantages = sorted.filter((c) => scores[win.id][c.id] > scores[run.id][c.id] + TIE_TOLERANCE);
  const concessions = sorted.filter((c) => scores[win.id][c.id] < scores[run.id][c.id] - TIE_TOLERANCE);
  let why;
  if (top.length > 1) {
    why = `${top.map((o) => o.name).join(" and ")} have the same top score. Your current answers do not select a single winner.`;
  } else {
    why = `${win.name} has the highest score with your current ratings and priorities.`;
    if (advantages.length) why += ` Compared with ${run.name}, it scores better on ${advantages.slice(0, 2).map((c) => c.name).join(" and ")}.`;
    if (concessions.length) why += ` ${run.name} scores better on ${concessions.slice(0, 2).map((c) => c.name).join(" and ")}.`;
  }
  const runnerNote = top.length > 1
    ? "This is a shared ranking, not a preference for the option listed first."
    : concessions.length
      ? `${run.name} scores better on ${concessions[0].name}. You can adjust the priorities or ratings to explore that tradeoff.`
      : `${run.name} ties or scores lower on each of your listed priorities.`;
  const whyNot = ranked.filter((o) => !top.some((t) => t.id === o.id) && o.id !== run.id).map((o) => {
    const worst = sorted.filter((c) => scores[win.id][c.id] > scores[o.id][c.id] + TIE_TOLERANCE)
      .sort((a, b) => weights[b.id] * (scores[win.id][b.id] - scores[o.id][b.id]) - weights[a.id] * (scores[win.id][a.id] - scores[o.id][a.id]))[0];
    return { name: o.name, reason: worst
      ? `Its largest weighted shortfall against ${win.name} is ${worst.name}: ${fmtRaw(worst, raw[o.id][worst.id])} versus ${fmtRaw(worst, raw[win.id][worst.id])}.`
      : "It has a lower overall score under this ranking method." };
  });
  const closer = top.length > 1
    ? "Review any missing priorities or uncertain ratings before choosing between these options."
    : stress.held === stress.total
      ? "The same option leads in every tested weight change. This check does not cover inaccurate ratings or priorities you have left out."
      : "Changing individual priorities can change the leading option. Review the tradeoffs before deciding.";
  return { why, runnerNote, whyNot, closer };
}

export function evaluateDecision(options, criteria, raw, judgments) {
  validateDecision(options, criteria, raw, judgments);
  const scores = normalizeScores(options, criteria, raw);
  const { weights, CR } = ahp(criteria, judgments);
  const ranked = topsis(options, criteria, weights, scores);
  const top = leaders(ranked);
  const saw = weightedSum(options, criteria, weights, scores);
  const sawLeaders = leaders(saw, "total");
  const regretRank = minimaxRegret(options, criteria, weights, scores);
  const regretLeaders = leaders(regretRank, "maxRegret");
  const stress = sensitivity(options, criteria, weights, scores, ranked[0].id);
  const sawAgrees = top.length === 1 && sawLeaders.length === 1 && sawLeaders[0].id === top[0].id;
  const rationale = buildRationale(ranked, criteria, weights, scores, raw, stress);
  return { weights, CR, ranked, top, saw, sawLeaders, regretRank, regretLeaders, stress, sawAgrees, rationale };
}
