import Foundation

// Swift port of src/curve.js. Points are in data space (grid units, y up).
struct Pt: Equatable { var x: Double; var y: Double }

struct Branch { var x0, x1, y0, y1: Double; var flat, vertical: Bool }
struct Circle { var cx, cy, r: Double }

enum Engine {
    /// Where a sampled curve crosses `level`, near-duplicates collapsed.
    static func crossings(_ pts: [Pt], level: Double = 0, minGap: Double = 0.25) -> [Double] {
        var hits: [Double] = []
        for i in 1..<max(1, pts.count) {
            let a = pts[i - 1], b = pts[i]
            guard a.y.isFinite, b.y.isFinite else { continue }
            if a.y == level { hits.append(a.x) }
            else if (a.y - level) * (b.y - level) < 0 {
                hits.append(a.x + (b.x - a.x) * (level - a.y) / (b.y - a.y))
            }
        }
        hits.sort()
        var out: [Double] = []
        for h in hits where out.last.map({ abs(h - $0) > minGap }) ?? true { out.append(h) }
        return out
    }

    static func describe(_ pts: [Pt], tol: Double = 0.2) -> Branch? {
        guard let x0 = pts.map(\.x).min(), let x1 = pts.map(\.x).max(),
              let y0 = pts.map(\.y).min(), let y1 = pts.map(\.y).max() else { return nil }
        return Branch(x0: x0, x1: x1, y0: y0, y1: y1, flat: y1 - y0 < tol, vertical: x1 - x0 < tol)
    }

    /// Least-squares circle; works on a partial arc.
    static func fitCircle(_ pts: [Pt]) -> Circle? {
        guard pts.count >= 3 else { return nil }
        var sx = 0.0, sy = 0.0, sxx = 0.0, syy = 0.0, sxy = 0.0, sxz = 0.0, syz = 0.0, sz = 0.0
        for p in pts {
            let z = p.x * p.x + p.y * p.y
            sx += p.x; sy += p.y; sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y
            sxz += p.x * z; syz += p.y * z; sz += z
        }
        let n = Double(pts.count)
        guard let s = solve([[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], [sxz, syz, sz]) else { return nil }
        let cx = s[0] / 2, cy = s[1] / 2
        return Circle(cx: cx, cy: cy, r: sqrt(max(0, s[2] + cx * cx + cy * cy)))
    }

    /// Mean distance of the points from the fitted circle, for "is this a circle at all".
    static func circleError(_ pts: [Pt], _ c: Circle) -> Double {
        pts.reduce(0) { $0 + abs(hypot($1.x - c.cx, $1.y - c.cy) - c.r) } / Double(max(1, pts.count))
    }

    /// "linear", "quadratic", "exponential" or nil, by fitting each model fewest-parameters-first.
    static func family(_ pts: [Pt], tol: Double = 0.02) -> String? {
        let P = pts.filter { $0.x.isFinite && $0.y.isFinite }
        guard P.count >= 4 else { return nil }
        let xs = P.map(\.x), ys = P.map(\.y)
        let scale = max(1e-9, ys.max()! - ys.min()!)
        func fits(_ model: (Double) -> Double) -> Bool {
            let rms = sqrt(zip(xs, ys).reduce(0) { $0 + pow(model($1.0) - $1.1, 2) } / Double(xs.count))
            return rms / scale < tol
        }
        if let l = fitBasis(xs, ys, [{ _ in 1 }, { $0 }]), fits({ l[0] + l[1] * $0 }) { return "linear" }
        let sign: Double = ys.allSatisfy { $0 > 0 } ? 1 : ys.allSatisfy { $0 < 0 } ? -1 : 0
        if sign != 0, let e = fitBasis(xs, ys.map { log(sign * $0) }, [{ _ in 1 }, { $0 }]),
           fits({ sign * exp(e[0] + e[1] * $0) }) { return "exponential" }
        if let q = fitBasis(xs, ys, [{ _ in 1 }, { $0 }, { $0 * $0 }]),
           fits({ q[0] + q[1] * $0 + q[2] * $0 * $0 }) { return "quadratic" }
        return nil
    }

    static func fitBasis(_ xs: [Double], _ ys: [Double], _ basis: [(Double) -> Double]) -> [Double]? {
        let k = basis.count
        var A = Array(repeating: Array(repeating: 0.0, count: k), count: k)
        var b = Array(repeating: 0.0, count: k)
        for (x, y) in zip(xs, ys) {
            let f = basis.map { $0(x) }
            for r in 0..<k { b[r] += f[r] * y; for c in 0..<k { A[r][c] += f[r] * f[c] } }
        }
        return solve(A, b)
    }

    /// Gauss-Jordan with partial pivoting; systems here are 2x2 or 3x3.
    static func solve(_ A: [[Double]], _ b: [Double]) -> [Double]? {
        let n = b.count
        var M = A.enumerated().map { $0.element + [b[$0.offset]] }
        for c in 0..<n {
            var p = c
            for r in (c + 1)..<max(c + 1, n) where abs(M[r][c]) > abs(M[p][c]) { p = r }
            if abs(M[p][c]) < 1e-12 { return nil }
            M.swapAt(c, p)
            for r in 0..<n where r != c {
                let f = M[r][c] / M[c][c]
                for k in c...n { M[r][k] -= f * M[c][k] }
            }
        }
        return (0..<n).map { M[$0][n] / M[$0][$0] }
    }
}
