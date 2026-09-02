import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDataSpace, pageToShot, snap } from '../src/coords.js';
import { crossings, describe as describeBranch, fitCircle } from '../src/curve.js';
import { fromLatex, fingerprint, same, pairUp, degree } from '../src/expr.js';
import { labelEdges } from '../src/dom.js';

test('data space inverts a chart with a flipped y axis', () => {
  const s = makeDataSpace({ x: 100, y: 300 }, { x: 150, y: 250 });
  assert.deepEqual(s.toData(200, 200), [2, 2]);
  assert.deepEqual(s.toPage(2, 2), { x: 200, y: 200 });
});

test('screenshot scaling matches a narrowed capture', () => {
  assert.deepEqual(pageToShot({ x: 932, y: 100 }, 1864, 1568), { x: 784, y: 84 });
});

test('snap only rounds within tolerance', () => {
  assert.equal(snap(2.04), 2);
  assert.equal(snap(2.4), 2.4);
});

test('crossings finds both roots of a parabola', () => {
  const pts = [];
  for (let x = -3; x <= 3; x += 0.05) pts.push([x, x * x - 4]);
  const r = crossings(pts);
  assert.equal(r.length, 2);
  assert.ok(Math.abs(r[0] + 2) < 0.05 && Math.abs(r[1] - 2) < 0.05);
});

test('a horizontal branch reads as flat', () => {
  const pts = [];
  for (let x = 2; x <= 5; x += 0.1) pts.push([x, 1]);
  const d = describeBranch(pts);
  assert.equal(d.flat, true);
  assert.equal(d.vertical, false);
  assert.equal(d.x0, 2);
});

test('circle fit recovers a centre from a partial arc', () => {
  const pts = [];
  for (let a = 0; a < Math.PI / 2; a += 0.05)
    pts.push([3 + 5 * Math.cos(a), -2 + 5 * Math.sin(a)]);
  const c = fitCircle(pts);
  assert.ok(Math.abs(c.cx - 3) < 1e-6);
  assert.ok(Math.abs(c.cy + 2) < 1e-6);
  assert.ok(Math.abs(c.r - 5) < 1e-6);
});

test('latex fractions survive brace stripping', () => {
  assert.equal(fromLatex('\\frac{1}{3}'), '((1)/(3))');
  assert.equal(fromLatex('4\\cdot\\frac{1}{2}'), '4*((1)/(2))');
});

test('implicit multiplication is made explicit', () => {
  assert.equal(fromLatex('4x^2(x+8)'), '4*x^2*(x+8)');
});

test('factored and expanded forms pair up, despite agreeing at zero', () => {
  const f = (x) => 4 * x * x * (x + 8);
  const g = (x) => 4 * x ** 3 + 32 * x * x;
  const h = (x) => 7 * x ** 4 * (x - 1);
  // the trap a single sample falls into: all three vanish at x = 0
  assert.ok(f(0) === 0 && g(0) === 0 && h(0) === 0);
  const prints = [f, g, h].map((fn) => fingerprint(fn));
  assert.ok(same(prints[0], prints[1]));
  assert.ok(!same(prints[0], prints[2]));
  assert.deepEqual(pairUp(prints), [[0, 1]]);
});

test('degree reads the highest exponent, and gives up on rationals', () => {
  assert.equal(degree('x^{3} - 4x + 9'), 3);
  assert.equal(degree('9 - 9x'), 1);
  assert.equal(degree('\\frac{1}{x}'), null);
});

test('labels attach to their nearest edge and know which is vertical', () => {
  const segs = [
    { mx: 50, my: 10, dx: 80, dy: 0 },   // horizontal top edge
    { mx: 10, my: 50, dx: 0, dy: 80 },   // vertical left edge
  ];
  const got = labelEdges([{ x: 52, y: 6, t: '8' }, { x: 6, y: 48, t: '3' }], segs);
  assert.equal(got[0].vertical, false);
  assert.equal(got[1].vertical, true);
  assert.ok(got[0].distance < 6);
});
