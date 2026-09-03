// The watch has no drawing surface worth a finger-drag gesture (see ios/App/ContentView.swift's
// header comment: readings come from a rendered path, not the raw stroke, and a ~180pt screen
// doesn't leave room to draw anything worth measuring). So instead of a canvas + gesture, this
// pages through the same six "quick examples" ios/App/ContentView.swift offers, each generated
// with the exact same closures, then run through the real Engine to produce the same readings
// the phone would show after you drew that shape by hand.

import Foundation
import SwiftUI

struct PresetCurve: Identifiable {
    let id: String
    let labelKey: String
    let points: [Pt]
    let colorIndex: Int

    var color: Color { Palette.color(at: colorIndex) }
}

private func fn(_ f: (Double) -> Double, _ x0: Double, _ x1: Double) -> [Pt] {
    stride(from: x0, through: x1, by: 0.05).map { Pt(x: $0, y: f($0)) }
}

private func arc(_ cx: Double, _ cy: Double, _ r: Double, _ a0: Double, _ a1: Double) -> [Pt] {
    stride(from: a0, through: a1, by: 0.03).map { Pt(x: cx + r * cos($0), y: cy + r * sin($0)) }
}

/// Mirrors ios/App/ContentView.swift's `examples` row exactly: same functions, same domains.
let presetCurves: [PresetCurve] = [
    PresetCurve(id: "parabola", labelKey: "parabola", points: fn({ 0.5 * ($0 * $0 - 4) }, -3.4, 3.4), colorIndex: 0),
    PresetCurve(id: "exponential", labelKey: "exponential", points: fn({ 0.5 * pow(2, $0) }, -7, 3), colorIndex: 1),
    PresetCurve(id: "sine", labelKey: "sine", points: fn({ 2 * sin($0) }, -7, 7), colorIndex: 2),
    PresetCurve(id: "hyperbola", labelKey: "hyperbola", points: fn({ 3 / $0 }, 0.65, 7), colorIndex: 3),
    PresetCurve(id: "circle", labelKey: "circle", points: arc(-1, 1, 3, 0, 2 * .pi + 0.03), colorIndex: 4),
    PresetCurve(id: "arc", labelKey: "arc", points: arc(1, -0.5, 2.2, -2.4, 0.7), colorIndex: 5),
]

/// Same readings ios/App/ContentView.swift's `measure()` derives, computed once per preset
/// instead of after a drag gesture (there's no stroke here, just the preset's own points).
struct Readings {
    let family: String
    let roots: String
    let circleFit: String

    init(_ pts: [Pt]) {
        let f: (Double) -> String = { String(format: abs($0) < 5e-3 ? "0" : "%.2f", $0) }
        let rootValues = Engine.crossings(pts)
        roots = rootValues.isEmpty ? L["never"] : rootValues.map(f).joined(separator: ", ")
        family = Engine.family(pts).map { L[$0 == "exponential" ? "exponentialf" : $0] } ?? L["none"]
        if let c = Engine.fitCircle(pts), Engine.circleError(pts, c) < 0.12 {
            circleFit = "\(L["centre"]) (\(f(c.cx)), \(f(c.cy)))  r=\(f(c.r))"
        } else {
            circleFit = L["notcircle"]
        }
    }
}
