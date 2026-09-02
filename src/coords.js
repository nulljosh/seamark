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
