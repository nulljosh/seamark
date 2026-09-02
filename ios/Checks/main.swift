// Engine self-check, ported from test/seamark.test.mjs. No build system:
//   swiftc -o /tmp/smcheck ios/App/Engine.swift ios/Checks/main.swift && /tmp/smcheck
import Foundation

var checks = 0
func check(_ ok: @autoclosure () -> Bool, _ label: String) {
    checks += 1
    if !ok() { print("FAIL: \(label)"); exit(1) }
}

let parabola = stride(from: -3.0, through: 3.0, by: 0.05).map { Pt(x: $0, y: $0 * $0 - 4) }
let roots = Engine.crossings(parabola)
check(roots.count == 2 && abs(roots[0] + 2) < 0.05 && abs(roots[1] - 2) < 0.05, "parabola roots")

let flat = stride(from: 2.0, through: 5.0, by: 0.1).map { Pt(x: $0, y: 1) }
check(Engine.describe(flat)!.flat && !Engine.describe(flat)!.vertical, "flat branch")

let arc = stride(from: 0.0, to: .pi / 2, by: 0.05).map { Pt(x: 3 + 5 * cos($0), y: -2 + 5 * sin($0)) }
let c = Engine.fitCircle(arc)!
check(abs(c.cx - 3) < 1e-6 && abs(c.cy + 2) < 1e-6 && abs(c.r - 5) < 1e-6, "partial-arc circle fit")

check(Engine.family([Pt(x: 0, y: 3), Pt(x: 1, y: 5), Pt(x: 2, y: 7), Pt(x: 3, y: 9)]) == "linear", "linear table")
check(Engine.family([Pt(x: 0, y: 1), Pt(x: 1, y: 4), Pt(x: 2, y: 9), Pt(x: 3, y: 16)]) == "quadratic", "quadratic table")
check(Engine.family([Pt(x: 0, y: 2), Pt(x: 1, y: 6), Pt(x: 2, y: 18), Pt(x: 3, y: 54)]) == "exponential", "exponential table")
check(Engine.family([Pt(x: 0, y: 0), Pt(x: 1, y: 1), Pt(x: 2, y: 0), Pt(x: 3, y: 1)]) == nil, "zigzag is none")
let uneven = stride(from: 0.0, through: 1.0, by: 0.01).map { t -> Pt in let x = -3 + 6 * t * t; return Pt(x: x, y: 0.5 * x * x - 2) }
check(Engine.family(uneven) == "quadratic", "uneven sampling")

print("ok \(checks) checks")
