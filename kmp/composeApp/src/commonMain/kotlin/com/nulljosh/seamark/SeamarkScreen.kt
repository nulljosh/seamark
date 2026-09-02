package com.nulljosh.seamark

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlin.math.*

private const val UNIT = 40f
private val accent = Color(0xFFC2451F)

// Draw a curve; readings come from the rendered Path measured by arc length,
// never from the raw pointer positions.
@Composable
fun SeamarkScreen() {
    var pts by remember { mutableStateOf(listOf<Pt>()) }
    var readings by remember { mutableStateOf(listOf<Pair<String, String>>()) }
    var size by remember { mutableStateOf(Offset(640f, 440f)) }
    val origin = Offset(size.x / 2, size.y / 2)

    fun toData(p: Offset) = Pt(((p.x - origin.x) / UNIT).toDouble(), (-(p.y - origin.y) / UNIT).toDouble())
    fun toView(p: Pt) = Offset(origin.x + (p.x * UNIT).toFloat(), origin.y - (p.y * UNIT).toFloat())
    fun path(): Path = Path().apply { pts.forEachIndexed { i, p -> val v = toView(p); if (i == 0) moveTo(v.x, v.y) else lineTo(v.x, v.y) } }

    fun measure() {
        if (pts.size < 3) { readings = emptyList(); return }
        val pm = PathMeasure().apply { setPath(path(), false) }
        val n = 160
        val sampled = (0..n).map { toData(pm.getPosition(pm.length * it / n)) }
        val b = Engine.describe(sampled) ?: return
        fun f(v: Double) = if (abs(v) < 5e-3) "0" else ((round(v * 100) / 100).toString().removeSuffix(".0"))
        val roots = Engine.crossings(sampled)
        val c = Engine.fitCircle(sampled)
        val isCircle = c != null && Engine.circleError(sampled, c) < 0.12
        readings = listOf(
            Strings["samples"] to "${sampled.size}",
            Strings["xrange"] to "${f(b.x0)} … ${f(b.x1)}",
            Strings["yrange"] to "${f(b.y0)} … ${f(b.y1)}",
            Strings["roots"] to (if (roots.isEmpty()) Strings["never"] else roots.joinToString(", ") { f(it) }),
            Strings["branch"] to (if (b.flat) Strings["horizontal"] else if (b.vertical) Strings["vertical"] else Strings["curved"]),
            Strings["family"] to (Engine.family(sampled)?.let { Strings[if (it == "exponential") "exponentialf" else it] } ?: Strings["none"]),
            Strings["circlefit"] to (if (isCircle) "${Strings["centre"]} (${f(c!!.cx)}, ${f(c.cy)})  r=${f(c.r)}" else Strings["notcircle"]),
        )
    }
    fun draw(fn: (Double) -> Double, x0: Double, x1: Double) {
        pts = generateSequence(x0) { it + 0.05 }.takeWhile { it <= x1 }.map { Pt(it, fn(it)) }.toList(); measure()
    }
    fun arc(cx: Double, cy: Double, r: Double, a0: Double, a1: Double) {
        pts = generateSequence(a0) { it + 0.03 }.takeWhile { it <= a1 }.map { Pt(cx + r * cos(it), cy + r * sin(it)) }.toList(); measure()
    }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton({ pts = emptyList(); readings = emptyList() }) { Text(Strings["clear"]) }
            OutlinedButton({ draw({ 0.5 * (it * it - 4) }, -3.4, 3.4) }) { Text(Strings["parabola"]) }
            OutlinedButton({ draw({ 0.5 * 2.0.pow(it) }, -7.0, 3.0) }) { Text(Strings["exponential"]) }
            OutlinedButton({ draw({ 2 * sin(it) }, -7.0, 7.0) }) { Text(Strings["sine"]) }
            OutlinedButton({ draw({ 3 / it }, 0.65, 7.0) }) { Text(Strings["hyperbola"]) }
            OutlinedButton({ arc(-1.0, 1.0, 3.0, 0.0, 2 * PI + 0.03) }) { Text(Strings["circle"]) }
            OutlinedButton({ arc(1.0, -0.5, 2.2, -2.4, 0.7) }) { Text(Strings["arc"]) }
        }
        Canvas(
            Modifier.fillMaxWidth().aspectRatio(640f / 440f)
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(14.dp))
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { pts = listOf(toData(it)) },
                        onDrag = { change, _ -> val p = toData(change.position); val l = pts.last()
                            if (hypot(p.x - l.x, p.y - l.y) > 0.06) pts = pts + p },
                        onDragEnd = { measure() },
                    )
                },
        ) {
            size = Offset(this.size.width, this.size.height)
            val o = Offset(this.size.width / 2, this.size.height / 2)
            val grid = Color.Gray.copy(alpha = 0.18f)
            var x = o.x % UNIT; while (x < this.size.width) { drawLine(grid, Offset(x, 0f), Offset(x, this.size.height)); x += UNIT }
            var y = o.y % UNIT; while (y < this.size.height) { drawLine(grid, Offset(0f, y), Offset(this.size.width, y)); y += UNIT }
            drawLine(Color.Gray, Offset(0f, o.y), Offset(this.size.width, o.y), 1.5f)
            drawLine(Color.Gray, Offset(o.x, 0f), Offset(o.x, this.size.height), 1.5f)
            drawPath(path(), accent, style = Stroke(width = 2.5f, cap = StrokeCap.Round))
        }
        Column(Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(14.dp)).padding(14.dp)) {
            Text(Strings["measured"], style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
            if (readings.isEmpty()) Text(Strings["hint"], color = MaterialTheme.colorScheme.onSurfaceVariant)
            readings.forEach { (k, v) ->
                Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) { Text(k); Spacer(Modifier.weight(1f)); Text(v, fontWeight = FontWeight.SemiBold) }
                HorizontalDivider()
            }
        }
    }
}
