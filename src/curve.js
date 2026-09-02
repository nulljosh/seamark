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

function solve3(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}
