// Four coordinate spaces show up whenever you read a browser graphic, and
// mixing any two of them produces plausible-looking nonsense rather than an
// error. Keep every conversion explicit.
//
//   user     SVG path/point coordinates, scaled by the viewBox
//   frame    CSS pixels relative to the iframe's own viewport
//   page     CSS pixels relative to the top document
//   shot     screenshot pixels, when a capture is scaled to a fixed width
//   data     the chart's own units (grid squares, plotted values)

/** Map SVG user units to frame pixels using the element's live screen CTM. */
export function userToFrame(svg, x, y) {
  const m = svg.getScreenCTM();
  if (!m) return null;
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}

/** Shift frame pixels into the top document's space. */
export function frameToPage(frameRect, p) {
  return { x: p.x + frameRect.left, y: p.y + frameRect.top };
}

/**
 * Scale page pixels into screenshot space. A capture normalised to a fixed
 * width is the usual reason these disagree; without this every synthesised
 * click lands slightly wrong, and nothing reports an error.
 */
export function pageToShot(p, viewportWidth, shotWidth) {
  const k = shotWidth / viewportWidth;
  return { x: Math.round(p.x * k), y: Math.round(p.y * k) };
}

/**
 * Build a converter between page pixels and the chart's own units from two
 * known reference points. Y is inverted in most charts, which falls out of the
 * arithmetic rather than needing a special case.
 */
export function makeDataSpace(originPage, unitPage) {
  const ux = unitPage.x - originPage.x;
  const uy = unitPage.y - originPage.y;
  if (!ux || !uy) return null;
  return {
    toData: (px, py) => [(px - originPage.x) / ux, (py - originPage.y) / uy],
    toPage: (dx, dy) => ({ x: originPage.x + dx * ux, y: originPage.y + dy * uy }),
  };
}

/** Snap a reading to a whole unit when it is within tol, else leave it alone. */
export function snap(v, tol = 0.2) {
  const r = Math.round(v);
  return Math.abs(v - r) <= tol ? r : v;
}
// Reading values off a drawn curve. The page rarely states what it plots, so
// the drawing itself is the data source.

/** Sample an SVG path into evenly spaced points, mapped by `toData`. */
export function samplePath(path, toData, maxPoints = 200) {
  if (!path || !path.getTotalLength) return null;
  const L = path.getTotalLength();
  if (!L) return null;
  const svg = path.ownerSVGElement;
  const m = svg && svg.getScreenCTM();
  if (!m) return null;
  const n = Math.min(maxPoints, Math.max(12, Math.round(L / 4)));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const q = path.getPointAtLength((L * i) / n);
    out.push(toData(m.a * q.x + m.c * q.y + m.e, m.b * q.x + m.d * q.y + m.f));
  }
  return out;
}

/**
 * Where a sampled curve crosses `level`, by linear interpolation between
 * samples. Sampled paths often double back, so near-duplicates are collapsed.
 */
export function crossings(points, level = 0, minGap = 0.25) {
  const hits = [];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (!isFinite(y0) || !isFinite(y1)) continue;
    if (y0 === level) hits.push(x0);
    else if ((y0 - level) * (y1 - level) < 0)
      hits.push(x0 + ((x1 - x0) * (level - y0)) / (y1 - y0));
  }
  hits.sort((a, b) => a - b);
  return hits.filter((h, i) => i === 0 || Math.abs(h - hits[i - 1]) > minGap);
}

/** Classify a sampled branch, which is what "the slanted one" usually means. */
export function describe(points, tol = 0.2) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  return {
    x0: Math.min(...xs), x1: Math.max(...xs),
    y0: Math.min(...ys), y1: Math.max(...ys),
    flat: spanY < tol,
    vertical: spanX < tol,
  };
}

/**
 * Least-squares circle through sampled points. Works on partial arcs, where
 * averaging the extremes to guess a centre does not.
 */
export function fitCircle(points) {
  const n = points.length;
  if (n < 3) return null;
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sxz = 0, Syz = 0, Sz = 0;
  for (const [x, y] of points) {
    const z = x * x + y * y;
    Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y;
    Sxz += x * z; Syz += y * z; Sz += z;
  }
  const A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]];
  const b = [Sxz, Syz, Sz];
  const s = solve3(A, b);
  if (!s) return null;
  const cx = s[0] / 2, cy = s[1] / 2;
  const r = Math.sqrt(Math.max(0, s[2] + cx * cx + cy * cy));
  return { cx, cy, r };
}

function solve3(A, b) { return solve(A, b); }

// Gauss-Jordan with partial pivoting; the systems here are 2x2 or 3x3.
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Least-squares coefficients for y = sum(c_i * basis_i(x)). */
function fitBasis(xs, ys, basis) {
  const k = basis.length;
  const A = Array.from({ length: k }, () => new Array(k).fill(0));
  const b = new Array(k).fill(0);
  xs.forEach((x, i) => {
    const f = basis.map((g) => g(x));
    for (let r = 0; r < k; r++) {
      b[r] += f[r] * ys[i];
      for (let c = 0; c < k; c++) A[r][c] += f[r] * f[c];
    }
  });
  return solve(A, b);
}

function rms(xs, ys, model) {
  return Math.sqrt(xs.reduce((s, x, i) => s + (model(x) - ys[i]) ** 2, 0) / xs.length);
}

/**
 * Which family a set of points belongs to: 'linear', 'quadratic',
 * 'exponential', or null. Works for a value table (four rows is enough) and
 * for a sampled curve alike, since it fits each model rather than taking
 * finite differences, which fall apart the moment x is unevenly spaced.
 * Models are tried fewest-parameters-first, so an exact geometric table is
 * exponential even though a quadratic would also pass through it.
 */
export function family(points, tol = 0.02) {
  const P = points.filter((p) => isFinite(p[0]) && isFinite(p[1]));
  if (P.length < 4) return null;
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const scale = Math.max(1e-9, Math.max(...ys) - Math.min(...ys));
  const fits = (model) => rms(xs, ys, model) / scale < tol;
  const lin = fitBasis(xs, ys, [() => 1, (x) => x]);
  if (lin && fits((x) => lin[0] + lin[1] * x)) return 'linear';
  const sign = ys.every((v) => v > 0) ? 1 : ys.every((v) => v < 0) ? -1 : 0;
  if (sign) {
    const e = fitBasis(xs, ys.map((v) => Math.log(sign * v)), [() => 1, (x) => x]);
    if (e && fits((x) => sign * Math.exp(e[0] + e[1] * x))) return 'exponential';
  }
  const q = fitBasis(xs, ys, [() => 1, (x) => x, (x) => x * x]);
  if (q && fits((x) => q[0] + q[1] * x + q[2] * x * x)) return 'quadratic';
  return null;
}

/** Mean of a point list: where to click a wedge or a blob, in whatever space it was sampled. */
export function centroid(points) {
  if (!points.length) return null;
  const s = points.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return [s[0] / points.length, s[1] / points.length];
}
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
// The parts that touch a live page. Two lessons are baked in here: the DOM
// keeps stale copies of things you assume are gone, and frameworks ignore
// synthetic clicks that don't look like a real pointer.

/**
 * Pick the iframe a user can actually see. Apps routinely leave earlier
 * frames mounted, so the first match is often the previous view's.
 */
export function visibleFrame(doc = document) {
  const frames = [...doc.querySelectorAll('iframe')].filter((f) => {
    const r = f.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return false;
    const st = getComputedStyle(f);
    return st.visibility !== 'hidden' && st.display !== 'none' &&
      parseFloat(st.opacity || '1') > 0.05;
  });
  return frames.length ? frames[frames.length - 1] : null;
}

/**
 * Match each text label to the geometry it annotates, by nearest segment
 * midpoint. This is how you tell a height from a width without being told:
 * ask which edge the number is sitting on.
 */
export function labelEdges(labels, segments) {
  return labels.map((l) => {
    let best = null, bd = Infinity;
    for (const s of segments) {
      const d = Math.hypot(s.mx - l.x, s.my - l.y);
      if (d < bd) { bd = d; best = s; }
    }
    if (!best) return null;
    const ang = Math.abs((Math.atan2(best.dy, best.dx) * 180) / Math.PI);
    return {
      label: l,
      segment: best,
      distance: bd,
      vertical: Math.min(ang, 180 - ang) > 60,
    };
  }).filter(Boolean);
}

const xy = (p) => (Array.isArray(p) ? p : [p.x, p.y]);

/**
 * Assign each label to a distinct point, minimising TOTAL distance. Labels sit
 * offset from their points, consistently to one side, so greedy nearest-first
 * steals the wrong point; with a handful of labels the exact search is cheap.
 * Returns point indices in label order, or null.
 */
export function assign(labels, points, max = 8) {
  const n = labels.length;
  if (!n || points.length < n || n > max) return null;
  let best = null, bestCost = Infinity;
  const walk = (chosen, cost) => {
    if (cost >= bestCost) return;
    if (chosen.length === n) { bestCost = cost; best = chosen.slice(); return; }
    const [lx, ly] = xy(labels[chosen.length]);
    for (let i = 0; i < points.length; i++) {
      if (chosen.includes(i)) continue;
      const [px, py] = xy(points[i]);
      chosen.push(i);
      walk(chosen, cost + Math.hypot(px - lx, py - ly));
      chosen.pop();
    }
  };
  walk([], 0);
  return best;
}

/**
 * Moves that turn the bins the widget currently shows into the bins `values`
 * demands: a dot plot with too many dots on 3 and too few on 5 wants one dot
 * dragged from 3 to 5. Returns [{ item, to }] or null when counts disagree.
 * Which pointer performs the drag is the caller's problem; some widgets only
 * answer to a real OS mouse.
 */
export function rebalance(items, values, key = (p) => p.x) {
  const need = new Map();
  for (const v of values) need.set(v, (need.get(v) || 0) + 1);
  const have = new Map();
  const surplus = [];
  for (const it of items) {
    const k = key(it);
    have.set(k, (have.get(k) || 0) + 1);
    if (have.get(k) > (need.get(k) || 0)) surplus.push(it);
  }
  const deficit = [];
  for (const [k, n] of need) for (let c = have.get(k) || 0; c < n; c++) deficit.push(k);
  if (surplus.length !== deficit.length) return null;
  return surplus.map((item, i) => ({ item, to: deficit[i] }));
}

/** Straight segments of every path in a container, in one coordinate space. */
export function segments(root, map, minLength = 4) {
  const out = [];
  for (const el of root.querySelectorAll('path,line,polyline,polygon')) {
    let pts = [];
    if (el.tagName === 'line') {
      pts = [[+el.getAttribute('x1'), +el.getAttribute('y1')],
             [+el.getAttribute('x2'), +el.getAttribute('y2')]];
    } else if (el.getTotalLength) {
      const L = el.getTotalLength();
      if (!L) continue;
      const n = Math.min(60, Math.max(8, Math.round(L / 6)));
      for (let i = 0; i <= n; i++) {
        const p = el.getPointAtLength((L * i) / n);
        pts.push([p.x, p.y]);
      }
    }
    for (let i = 1; i < pts.length; i++) {
      const a = map(pts[i - 1][0], pts[i - 1][1]);
      const b = map(pts[i][0], pts[i][1]);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < minLength) continue;
      out.push({ mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
                 dx: b.x - a.x, dy: b.y - a.y, length: len, element: el });
    }
  }
  return out;
}

/**
 * A pointer sequence a framework will accept. el.click() alone is ignored by
 * React handlers bound to pointer events, with no error to tell you why.
 */
export function tap(el, view = window) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const base = {
    bubbles: true, cancelable: true, composed: true, view,
    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0,
  };
  const P = view.PointerEvent, M = view.MouseEvent;
  const pointer = { pointerId: 1, pointerType: 'mouse', isPrimary: true };
  el.dispatchEvent(new P('pointerdown', { ...base, ...pointer, buttons: 1 }));
  el.dispatchEvent(new M('mousedown', { ...base, buttons: 1 }));
  el.dispatchEvent(new P('pointerup', { ...base, ...pointer, buttons: 0 }));
  el.dispatchEvent(new M('mouseup', { ...base, buttons: 0 }));
  el.dispatchEvent(new M('click', { ...base, buttons: 0 }));
  return true;
}
