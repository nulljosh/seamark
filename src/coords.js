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

/**
 * Centre of one cell in a drawn grid, by chess-style name ("e4") or
 * [col, row]. A board drawn on a canvas has no DOM cells to click, so the
 * only way to hit a square is arithmetic on its bounding box. `flipped`
 * means the grid is drawn from the other side, as a board is for black.
 */
export function gridCell(cell, rect, { size = 8, flipped = false, inset } = {}) {
  const [col0, row0] = typeof cell === 'string'
    ? [cell.charCodeAt(0) - 97, +cell.slice(1) - 1]
    : cell;
  const col = flipped ? size - 1 - col0 : col0;
  const row = flipped ? row0 : size - 1 - row0;
  const g = inset ? insetRect(rect, inset) : rect;
  const w = g.width / size, h = g.height / size;
  return { x: g.left + w * (col + 0.5), y: g.top + h * (row + 0.5) };
}

/**
 * Recover a table from cells that were merely POSITIONED like one. A layout
 * built from absolutely-placed spans has no rows or columns to read, only
 * coordinates — so cluster the centres on each axis and let membership fall
 * out of which cluster a cell is nearest.
 *
 * Tolerances are per-axis on purpose: text lines sit much closer vertically
 * than columns do horizontally, and a single tolerance either merges two rows
 * or splits one column in half.
 *
 * `cells` are `{ x, y, t }` centres in any one space. Returns the grid plus
 * the cluster centres, so a caller can map a cell back to a click target.
 */
export function clusterGrid(cells, { tolX = 24, tolY = 14, min = 6 } = {}) {
  const pts = (cells || []).filter((c) => c && Number.isFinite(c.x) && Number.isFinite(c.y));
  if (pts.length < min) return null;
  const cluster = (vals, tol) => {
    const out = [];
    [...vals].sort((a, b) => a - b).forEach((v) => {
      const g = out.find((g) => Math.abs(g[0] - v) < tol);
      if (g) g.push(v); else out.push([v]);
    });
    return out.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
  };
  const ys = cluster(pts.map((c) => c.y), tolY);
  const xs = cluster(pts.map((c) => c.x), tolX);
  const near = (v, arr) => arr.reduce((b, a, i) => (Math.abs(a - v) < Math.abs(arr[b] - v) ? i : b), 0);
  const grid = ys.map(() => xs.map(() => ''));
  for (const c of pts) grid[near(c.y, ys)][near(c.x, xs)] = c.t ?? '';
  return { grid, xs, ys };
}

/**
 * The drawn grid is rarely the whole element. A board rendered on a canvas
 * usually sits inside its own padding, so treating the element's box as the
 * grid puts every click a fraction of a square off — close enough to look
 * right and still select the wrong square. Fractions are of the element box.
 */
export function insetRect(rect, { left = 0, top = 0, width = 1, height = width } = {}) {
  return {
    left: rect.left + rect.width * left,
    top: rect.top + rect.height * top,
    width: rect.width * width,
    height: rect.height * height,
  };
}
