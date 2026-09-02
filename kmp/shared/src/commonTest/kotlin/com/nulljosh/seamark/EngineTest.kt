package com.nulljosh.seamark

import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class EngineTest {
    private fun range(a: Double, b: Double, step: Double) = generateSequence(a) { it + step }.takeWhile { it <= b + 1e-9 }.toList()

    @Test fun parabolaRoots() {
        val r = Engine.crossings(range(-3.0, 3.0, 0.05).map { Pt(it, it * it - 4) })
        assertEquals(2, r.size); assertTrue(abs(r[0] + 2) < 0.05 && abs(r[1] - 2) < 0.05)
    }
    @Test fun flatBranch() {
        val d = Engine.describe(range(2.0, 5.0, 0.1).map { Pt(it, 1.0) })!!
        assertTrue(d.flat); assertTrue(!d.vertical)
    }
    @Test fun partialArcCircle() {
        val c = Engine.fitCircle(range(0.0, 1.5, 0.05).map { Pt(3 + 5 * cos(it), -2 + 5 * sin(it)) })!!
        assertTrue(abs(c.cx - 3) < 1e-6 && abs(c.cy + 2) < 1e-6 && abs(c.r - 5) < 1e-6)
    }
    @Test fun tables() {
        assertEquals("linear", Engine.family(listOf(Pt(0.0, 3.0), Pt(1.0, 5.0), Pt(2.0, 7.0), Pt(3.0, 9.0))))
        assertEquals("quadratic", Engine.family(listOf(Pt(0.0, 1.0), Pt(1.0, 4.0), Pt(2.0, 9.0), Pt(3.0, 16.0))))
        assertEquals("exponential", Engine.family(listOf(Pt(0.0, 2.0), Pt(1.0, 6.0), Pt(2.0, 18.0), Pt(3.0, 54.0))))
        assertNull(Engine.family(listOf(Pt(0.0, 0.0), Pt(1.0, 1.0), Pt(2.0, 0.0), Pt(3.0, 1.0))))
    }
    @Test fun unevenSampling() {
        val pts = range(0.0, 1.0, 0.01).map { t -> val x = -3 + 6 * t * t; Pt(x, 0.5 * x * x - 2) }
        assertEquals("quadratic", Engine.family(pts))
    }
}
