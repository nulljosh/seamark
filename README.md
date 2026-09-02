# sextant

Read real values out of rendered browser graphics.

A sextant fixes your position by observing what is visible, without
instrumenting anything it measures. This library does the same for a web page:
given a chart, a diagram or a widget that only exists as drawn output, it
recovers the numbers behind it.

Useful when the data is not in the DOM as text — canvas-adjacent SVG apps,
third-party embeds, visual regression checks, and browser agents that have to
act on what a page *shows* rather than what it exposes.

## What's in it

**Coordinates.** A browser graphic lives in four spaces at once: SVG user
units, CSS pixels, an iframe's own viewport, and screenshot space. Mixing any
two yields plausible numbers rather than an error, so a reading stays quietly
wrong until something downstream breaks. Every conversion here is explicit.

**Curves.** Sample a path into data space, find where it crosses a level,
classify a branch as flat, vertical or slanted, and least-squares fit a circle
that works from a partial arc.

**Expressions.** Compare rendered maths by fingerprint over several sample
points, not by string and not by a single evaluation — `x(x+8)` and `x²+8x`
share no characters and agree at exactly the point you would test first.

**DOM.** Pick the iframe that is actually visible when stale ones are still
mounted, match text labels to the edges they annotate, and dispatch a pointer
sequence that frameworks accept (`el.click()` alone is ignored by React
handlers bound to pointer events, silently).

## Use

```js
import { samplePath, crossings, fitCircle, makeDataSpace } from 'sextant';

const space = makeDataSpace(originInPagePx, oneUnitInPagePx);
const points = samplePath(document.querySelector('svg path'), space.toData);

crossings(points);      // x values where the curve meets y = 0
fitCircle(points);       // { cx, cy, r }
```

```sh
npm test
```

## Demo

`public/index.html` — draw a curve and watch the measurements come back. It
reads the rendered path, never the point list it drew with.

MIT.
