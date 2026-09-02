package com.nulljosh.seamark

import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.sqrt

// Kotlin port of src/curve.js. Points are in data space (grid units, y up).
data class Pt(val x: Double, val y: Double)
data class Branch(val x0: Double, val x1: Double, val y0: Double, val y1: Double, val flat: Boolean, val vertical: Boolean)
data class Circle(val cx: Double, val cy: Double, val r: Double)

object Engine {
    /** Where a sampled curve crosses [level], near-duplicates collapsed. */
    fun crossings(pts: List<Pt>, level: Double = 0.0, minGap: Double = 0.25): List<Double> {
        val hits = ArrayList<Double>()
        for (i in 1 until pts.size) {
            val a = pts[i - 1]; val b = pts[i]
            if (!a.y.isFinite() || !b.y.isFinite()) continue
            if (a.y == level) hits.add(a.x)
            else if ((a.y - level) * (b.y - level) < 0) hits.add(a.x + (b.x - a.x) * (level - a.y) / (b.y - a.y))
        }
        hits.sort()
        val out = ArrayList<Double>()
        for (h in hits) if (out.isEmpty() || abs(h - out.last()) > minGap) out.add(h)
        return out
    }

    fun describe(pts: List<Pt>, tol: Double = 0.2): Branch? {
        if (pts.isEmpty()) return null
        val x0 = pts.minOf { it.x }; val x1 = pts.maxOf { it.x }
        val y0 = pts.minOf { it.y }; val y1 = pts.maxOf { it.y }
        return Branch(x0, x1, y0, y1, y1 - y0 < tol, x1 - x0 < tol)
    }

    /** Least-squares circle; works on a partial arc. */
    fun fitCircle(pts: List<Pt>): Circle? {
        if (pts.size < 3) return null
        var sx = 0.0; var sy = 0.0; var sxx = 0.0; var syy = 0.0; var sxy = 0.0; var sxz = 0.0; var syz = 0.0; var sz = 0.0
        for (p in pts) {
            val z = p.x * p.x + p.y * p.y
            sx += p.x; sy += p.y; sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y
            sxz += p.x * z; syz += p.y * z; sz += z
        }
        val s = solve(listOf(listOf(sxx, sxy, sx), listOf(sxy, syy, sy), listOf(sx, sy, pts.size.toDouble())), listOf(sxz, syz, sz)) ?: return null
        val cx = s[0] / 2; val cy = s[1] / 2
        return Circle(cx, cy, sqrt(max(0.0, s[2] + cx * cx + cy * cy)))
    }

    fun circleError(pts: List<Pt>, c: Circle): Double =
        pts.sumOf { abs(hypot(it.x - c.cx, it.y - c.cy) - c.r) } / max(1, pts.size)

    /** "linear", "quadratic", "exponential" or null, fitting each model fewest-parameters-first. */
    fun family(points: List<Pt>, tol: Double = 0.02): String? {
        val p = points.filter { it.x.isFinite() && it.y.isFinite() }
        if (p.size < 4) return null
        val xs = p.map { it.x }; val ys = p.map { it.y }
        val scale = max(1e-9, ys.max() - ys.min())
        fun fits(model: (Double) -> Double): Boolean {
            val rms = sqrt(xs.indices.sumOf { val d = model(xs[it]) - ys[it]; d * d } / xs.size)
            return rms / scale < tol
        }
        fitBasis(xs, ys, listOf({ _ -> 1.0 }, { x -> x }))?.let { l -> if (fits { l[0] + l[1] * it }) return "linear" }
        val sign = if (ys.all { it > 0 }) 1.0 else if (ys.all { it < 0 }) -1.0 else 0.0
        if (sign != 0.0) fitBasis(xs, ys.map { ln(sign * it) }, listOf({ _ -> 1.0 }, { x -> x }))?.let { e ->
            if (fits { sign * exp(e[0] + e[1] * it) }) return "exponential"
        }
        fitBasis(xs, ys, listOf({ _ -> 1.0 }, { x -> x }, { x -> x * x }))?.let { q ->
            if (fits { q[0] + q[1] * it + q[2] * it * it }) return "quadratic"
        }
        return null
    }

    fun fitBasis(xs: List<Double>, ys: List<Double>, basis: List<(Double) -> Double>): List<Double>? {
        val k = basis.size
        val a = Array(k) { DoubleArray(k) }; val b = DoubleArray(k)
        for (i in xs.indices) {
            val f = basis.map { it(xs[i]) }
            for (r in 0 until k) { b[r] += f[r] * ys[i]; for (c in 0 until k) a[r][c] += f[r] * f[c] }
        }
        return solve(a.map { it.toList() }, b.toList())
    }

    /** Gauss-Jordan with partial pivoting; systems here are 2x2 or 3x3. */
    fun solve(a: List<List<Double>>, b: List<Double>): List<Double>? {
        val n = b.size
        val m = Array(n) { r -> DoubleArray(n + 1) { c -> if (c < n) a[r][c] else b[r] } }
        for (c in 0 until n) {
            var p = c
            for (r in c + 1 until n) if (abs(m[r][c]) > abs(m[p][c])) p = r
            if (abs(m[p][c]) < 1e-12) return null
            val t = m[c]; m[c] = m[p]; m[p] = t
            for (r in 0 until n) if (r != c) {
                val f = m[r][c] / m[c][c]
                for (k in c..n) m[r][k] -= f * m[c][k]
            }
        }
        return (0 until n).map { m[it][n] / m[it][it] }
    }
}
