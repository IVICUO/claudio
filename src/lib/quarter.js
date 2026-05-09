// Quarter helpers, format used throughout the app: "YYYY QN" (e.g. "2026 Q2").

export function currentQuarter(now = new Date()) {
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()} Q${q}`;
}

// Returns a deduplicated, descending-sorted list of quarter labels:
// every quarter present on a project, plus the current quarter, plus the next.
export function availableQuarters(projects, now = new Date()) {
  const set = new Set(projects.map((p) => p.quarter).filter(Boolean));
  set.add(currentQuarter(now));
  set.add(nextQuarter(now));
  return Array.from(set).sort((a, b) => compareQuarter(b, a));
}

export function nextQuarter(now = new Date()) {
  const m = now.getMonth();
  const y = now.getFullYear();
  const q = Math.floor(m / 3) + 1;
  if (q === 4) return `${y + 1} Q1`;
  return `${y} Q${q + 1}`;
}

// Lexicographic on "YYYY QN" works for same-year, custom for cross-year.
function compareQuarter(a, b) {
  const pa = parse(a); const pb = parse(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.q - pb.q;
}
function parse(label) {
  const m = String(label).match(/(\d{4})\s*Q([1-4])/i);
  if (!m) return { year: 0, q: 0 };
  return { year: parseInt(m[1], 10), q: parseInt(m[2], 10) };
}

// A project shows in a quarter view if it explicitly matches OR it has no quarter set
// (treated as "ongoing", visible in every quarter).
export function projectInQuarter(project, quarterLabel) {
  if (!project.quarter) return true;
  return project.quarter === quarterLabel;
}
