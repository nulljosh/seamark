import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            ForEach(presetCurves) { curve in
                CurvePageView(curve: curve)
            }
        }
        .tabViewStyle(.verticalPage)
    }
}
