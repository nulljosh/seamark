import SwiftUI

// Draw a curve; the readings come from the rendered Path, sampled by arc length,
// never from the point list the finger produced.
struct ContentView: View {
    @State private var strokes: [CGPoint] = []
    @State private var readings: [(String, String)] = []
    private let unit: CGFloat = 40

    var body: some View {
        VStack(spacing: 12) {
            examples
            #if os(macOS)
            HStack(alignment: .top, spacing: 12) { board; panel.frame(width: 260) }
            #else
            board
            panel
            #endif
        }
        .padding()
    }

    private var examples: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                Button(L["clear"]) { strokes = []; readings = [] }
                Button(L["parabola"]) { draw({ 0.5 * ($0 * $0 - 4) }, -3.4, 3.4) }
                Button(L["exponential"]) { draw({ 0.5 * pow(2, $0) }, -7, 3) }
                Button(L["sine"]) { draw({ 2 * sin($0) }, -7, 7) }
                Button(L["hyperbola"]) { draw({ 3 / $0 }, 0.65, 7) }
                Button(L["circle"]) { arc(-1, 1, 3, 0, 2 * .pi + 0.03) }
                Button(L["arc"]) { arc(1, -0.5, 2.2, -2.4, 0.7) }
            }
        }
    }

    private var board: some View {
        GeometryReader { geo in
            let origin = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
            Canvas { ctx, size in
                var g = Path()
                var x = origin.x.truncatingRemainder(dividingBy: unit)
                while x < size.width { g.move(to: CGPoint(x: x, y: 0)); g.addLine(to: CGPoint(x: x, y: size.height)); x += unit }
                var y = origin.y.truncatingRemainder(dividingBy: unit)
                while y < size.height { g.move(to: CGPoint(x: 0, y: y)); g.addLine(to: CGPoint(x: size.width, y: y)); y += unit }
                ctx.stroke(g, with: .color(.secondary.opacity(0.15)))
                var axes = Path()
                axes.move(to: CGPoint(x: 0, y: origin.y)); axes.addLine(to: CGPoint(x: size.width, y: origin.y))
                axes.move(to: CGPoint(x: origin.x, y: 0)); axes.addLine(to: CGPoint(x: origin.x, y: size.height))
                ctx.stroke(axes, with: .color(.secondary.opacity(0.6)), lineWidth: 1.5)
                ctx.stroke(curve(origin), with: .color(.orange), style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
            }
            .background(Color.secondary.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .gesture(DragGesture(minimumDistance: 0)
                .onChanged { v in
                    let p = data(v.location, origin)
                    if v.translation == .zero { strokes = [p] }
                    else if let last = strokes.last, hypot(p.x - last.x, p.y - last.y) > 0.06 { strokes.append(p) }
                }
                .onEnded { _ in measure(origin) })
        }
        .aspectRatio(640.0 / 440.0, contentMode: .fit)
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(L["measured"]).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            ForEach(readings, id: \.0) { r in
                HStack { Text(r.0); Spacer(); Text(r.1).fontWeight(.semibold).monospacedDigit() }
                Divider()
            }
            if readings.isEmpty { Text(L["hint"]).foregroundStyle(.secondary) }
        }
        .padding(14)
        .background(Color.secondary.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: geometry

    private func data(_ p: CGPoint, _ origin: CGPoint) -> CGPoint {
        CGPoint(x: (p.x - origin.x) / unit, y: -(p.y - origin.y) / unit)
    }
    private func curve(_ origin: CGPoint) -> Path {
        var path = Path()
        for (i, p) in strokes.enumerated() {
            let v = CGPoint(x: origin.x + p.x * unit, y: origin.y - p.y * unit)
            if i == 0 { path.move(to: v) } else { path.addLine(to: v) }
        }
        return path
    }

    /// The library's job: sample the RENDERED path by arc length and map it back to data.
    private func measure(_ origin: CGPoint) {
        let path = curve(origin)
        guard strokes.count > 2 else { readings = []; return }
        let n = 160
        let pts: [Pt] = (0...n).compactMap { i in
            guard let q = path.trimmedPath(from: 0, to: max(Double(i) / Double(n), 1e-6)).currentPoint else { return nil }
            let d = data(q, origin)
            return Pt(x: d.x, y: d.y)
        }
        guard let b = Engine.describe(pts) else { readings = []; return }
        let f: (Double) -> String = { String(format: abs($0) < 5e-3 ? "0" : "%.2f", $0) }
        let roots = Engine.crossings(pts)
        let c = Engine.fitCircle(pts)
        let isCircle = c.map { Engine.circleError(pts, $0) < 0.12 } ?? false
        readings = [
            (L["samples"], "\(pts.count)"),
            (L["xrange"], "\(f(b.x0)) … \(f(b.x1))"),
            (L["yrange"], "\(f(b.y0)) … \(f(b.y1))"),
            (L["roots"], roots.isEmpty ? L["never"] : roots.map(f).joined(separator: ", ")),
            (L["branch"], b.flat ? L["horizontal"] : b.vertical ? L["vertical"] : L["curved"]),
            (L["family"], Engine.family(pts).map { L[$0 == "exponential" ? "exponentialf" : $0] } ?? L["none"]),
            (L["circlefit"], isCircle ? "\(L["centre"]) (\(f(c!.cx)), \(f(c!.cy)))  r=\(f(c!.r))" : L["notcircle"]),
        ]
    }

    private func draw(_ fn: (Double) -> Double, _ x0: Double, _ x1: Double) {
        strokes = stride(from: x0, through: x1, by: 0.05).map { CGPoint(x: $0, y: fn($0)) }
        measure(CGPoint(x: 320, y: 220))
    }
    private func arc(_ cx: Double, _ cy: Double, _ r: Double, _ a0: Double, _ a1: Double) {
        strokes = stride(from: a0, through: a1, by: 0.03).map { CGPoint(x: cx + r * cos($0), y: cy + r * sin($0)) }
        measure(CGPoint(x: 320, y: 220))
    }
}
