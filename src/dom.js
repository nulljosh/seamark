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
