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
