// One page of the vertical TabView: the preset's name and plot, then the same family/roots/
// circle-fit readings ios/App/ContentView.swift shows after you draw the shape by hand.

import SwiftUI

struct CurvePageView: View {
    let curve: PresetCurve
    private var readings: Readings { Readings(curve.points) }

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                Circle().fill(curve.color).frame(width: 8, height: 8)
                Text(L[curve.labelKey])
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.text)
                    .lineLimit(1)
            }
            .padding(.top, 2)

            PlotView(curve: curve)
                .frame(height: 90)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                readingLine(L["family"], readings.family)
                readingLine(L["roots"], readings.roots)
                readingLine(L["circlefit"], readings.circleFit)
            }
            .font(.system(size: 11))
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 6)
        .background(Theme.graphBackground)
    }

    private func readingLine(_ label: String, _ value: String) -> some View {
        (Text(label + ": ").foregroundStyle(Theme.secondary) + Text(value).foregroundStyle(Theme.text))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
    }
}
