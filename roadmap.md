# Roadmap

## Open
- [ ] Apple Watch companion app -- standalone watchOS target (XcodeGen), same pattern as talli/watchos, sparkjar/watchos, epiphany/watchos, and the new companions in bookrank/charwork/curvely/fengshui/inkpress/lexly/quotestreak. Deferred 2026-09-02 to keep the sweep scoped; pick network+token-pairing, App-Group share, or a fully local port depending on what the app actually is.
- [ ] Publish to npm (name settled: seamark)
- [ ] App Store records for iOS/macOS; Play Store for Android. Held until the 4.3(a) wave clears
- [ ] Native-speaker pass on the es/fr/de/ja/zh strings

## Done
- 2026-09-01: renamed sextant → seamark (repo, dir, package, Pages project, DNS, domain)
- 2026-09-01: native apps. iOS + macOS SwiftUI in `ios/` (Engine.swift, 8 checks);
  Android/Windows/Linux Compose Multiplatform in `kmp/` (Engine.kt, 5 tests, APK
  builds with JDK 17; JDK 26 breaks D8). Six UI languages on every platform
- 2026-09-01: landing page: house style, animated curve-tile hero, Apple-style
  headings, six platform cards, six languages; icon.svg + architecture.svg;
  GitHub homepage + description set
- 2026-09-01: ported remaining Duolingo-solver techniques (`family`, `assign`,
  `rebalance`, `centroid`); 16 JS tests; 8 demo examples
- 2026-09-01: custom domain via the Pages API with the wrangler OAuth token
- Coordinate reconciliation, path sampling, circle fit, expression
  fingerprinting, visible-frame selection, label-to-edge matching, pointer events
