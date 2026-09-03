// A single preset curve, drawn full-width. Cut down from ios/App/ContentView.swift's `board`:
// no drag gesture (nothing to draw on a watch face), fixed centered scale, same grid/axis/curve
// drawing as the phone, minus the pointer handling.

import SwiftUI

struct PlotView: View {
    let curve: PresetCurve

    /// Smaller than the iOS board's 40pt unit: watch screens are ~180-220pt wide, so a lower
    /// scale keeps the whole preset shape on screen instead of one steep sliver of it.
    private let unit: CGFloat = 14

    var body: some View {
        Canvas(rendersAsynchronously: false) { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            drawGrid(&context, size: size, center: center)
            drawAxes(&context, size: size, center: center)
            drawCurve(&context, size: size, center: center)
        }
        .background(Theme.graphBackground)
    }

    private func drawGrid(_ context: inout GraphicsContext, size: CGSize, center: CGPoint) {
        var path = Path()
        var x = center.x.truncatingRemainder(dividingBy: unit)
        while x < size.width {
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: size.height))
            x += unit
        }
        var y = center.y.truncatingRemainder(dividingBy: unit)
        while y < size.height {
            path.move(to: CGPoint(x: 0, y: y))
            path.addLine(to: CGPoint(x: size.width, y: y))
            y += unit
        }
        context.stroke(path, with: .color(Theme.grid), lineWidth: 0.5)
    }

    private func drawAxes(_ context: inout GraphicsContext, size: CGSize, center: CGPoint) {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: center.y))
        path.addLine(to: CGPoint(x: size.width, y: center.y))
        path.move(to: CGPoint(x: center.x, y: 0))
        path.addLine(to: CGPoint(x: center.x, y: size.height))
        context.stroke(path, with: .color(Theme.axis), lineWidth: 1)
    }

    private func drawCurve(_ context: inout GraphicsContext, size: CGSize, center: CGPoint) {
        var path = Path()
        for (i, p) in curve.points.enumerated() {
            guard p.y.isFinite else { continue }
            let v = CGPoint(x: center.x + p.x * unit, y: center.y - p.y * unit)
            if i == 0 { path.move(to: v) } else { path.addLine(to: v) }
        }
        context.stroke(
            path,
            with: .color(curve.color),
            style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round)
        )
    }
}
