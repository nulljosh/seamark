// Palette for the watch plots. seamark/ios's ContentView draws every curve in a single
// `.orange`; here each preset gets its own color (mirroring curvely/watchos's Palette) so
// paging between them reads as distinct pages, not the same chart six times.

import SwiftUI

enum Theme {
    static let graphBackground = Color.black
    static let grid = Color.secondary.opacity(0.15)
    static let axis = Color.secondary.opacity(0.6)
    static let text = Color.primary
    static let secondary = Color.secondary
}

enum Palette {
    private static let colors: [Color] = [.orange, .cyan, .green, .pink, .purple, .yellow]
    static func color(at index: Int) -> Color { colors[index % colors.count] }
}
