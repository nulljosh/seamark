// Comparing rendered expressions. Two forms of the same function look nothing
// alike as strings, and evaluating at a single point is not enough: x(x+8) and
// x^2+8x are both 0 at x=0, as is every other expression with a root there.

/** Turn common LaTeX into something a plain expression parser accepts. */
export function fromLatex(tex) {
  return String(tex ?? '')
    .replace(/\\(mathbf|textbf|text|emphasis|displaystyle)\b/g, '')
    .replace(/\\(cdot|times)/g, '*')
    .replace(/\\left|\\right/g, '')
    // \frac{a}{b} must become (a)/(b) BEFORE braces are stripped, or it
    // flattens to the ambiguous "fracab"
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\pi/g, '*(3.141592653589793)')
    .replace(/[{}]/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/\s/g, '')
    // substituting a constant for \pi can strand an operator at a boundary
    .replace(/(^|[=(*+\-/])\*+/g, '$1')
    // implicit multiplication: 4(x+1), (x+1)(x-1), 2x
    .replace(/(\d|\))(\()/g, '$1*$2')
    .replace(/(\d)([a-z])/gi, '$1*$2');
}

/**
 * Evaluate at several arbitrary points to get a comparable signature. The
 * sample points are deliberately irrational-looking so that symmetric or
 * periodic expressions don't collide by accident.
 */
export const SAMPLES = [0.7314, 1.3121, -2.1137, 3.4271];

export function fingerprint(fn, xs = SAMPLES) {
  try {
    const v = xs.map((x) => fn(x));
    return v.every((n) => Number.isFinite(n)) ? v : null;
  } catch {
    return null;
  }
}

/** Do two fingerprints describe the same function? */
export function same(a, b, tol = 1e-7) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((n, i) =>
    Math.abs(n - b[i]) <= tol * Math.max(1, Math.abs(n), Math.abs(b[i])));
}

/** Greedily pair equal-valued items; returns [i, j] index pairs. */
export function pairUp(fingerprints, tol = 1e-7) {
  const used = new Array(fingerprints.length).fill(false);
  const pairs = [];
  for (let i = 0; i < fingerprints.length; i++) {
    if (used[i] || !fingerprints[i]) continue;
    for (let j = i + 1; j < fingerprints.length; j++) {
      if (used[j] || !fingerprints[j]) continue;
      if (same(fingerprints[i], fingerprints[j], tol)) {
        used[i] = used[j] = true;
        pairs.push([i, j]);
        break;
      }
    }
  }
  return pairs;
}

/** Highest exponent present, i.e. polynomial degree. */
export function degree(expr) {
  const s = fromLatex(expr);
  if (/\/\s*[a-z(]/i.test(s)) return null; // rational: no single degree
  let d = 0;
  for (const m of s.matchAll(/[a-z](\^\(?(-?\d+)\)?)?/gi))
    d = Math.max(d, m[2] ? parseInt(m[2], 10) : 1);
  return d;
}
