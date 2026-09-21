# Architecture

Seamark reads values off rendered charts, SVG paths, and grids. A chart lives in four coordinate spaces at once: SVG user units, CSS pixels on the page, pixels within an iframe, and screenshot pixels if the image is scaled. Every conversion is explicit to avoid plausible-looking wrong numbers. The library also samples curves, fits circles, detects curve families (linear, quadratic, exponential), and fingerprints expressions to compare them even when written in different forms.

Seamark is an npm library plus a web demo at seamark.heyitsmejosh.com, plus native apps for iOS, macOS, watchOS, and KMP (Android/Windows/Linux).

## How it runs

**Web:** User navigates to seamark.heyitsmejosh.com. Vite app loads. User draws a curve or enters two reference points. The browser calls the seamark library: `samplePath()` to read the curve's points, `makeDataSpace()` to map page pixels to chart units, `crossings()` to find where the curve meets y=0, `fitCircle()` to fit a partial arc, `family()` to classify the curve's shape. Results display below the drawing.

**Native apps:** iOS, macOS, and watchOS use the same drawing and analysis UI via SwiftUI. `Engine.swift` is the Swift port of the seamark library. watchOS pages through six preset curves instead of freehand drawing. KMP apps (Android/Windows/Linux) use `Engine.kt`, the Kotlin port.

## Core library

| File | What it owns |
|---|---|
| `src/coords.js` | Four coordinate spaces and converters between them. `userToFrame()` maps SVG user units to CSS frame pixels via the element's screen CTM. `frameToPage()` shifts frame pixels into the top document's space. `pageToShot()` scales page pixels to screenshot space when a capture is normalised to fixed width. `makeDataSpace()` builds a converter between page pixels and the chart's own units from two known reference points. `gridCell()` computes the center of one cell in a drawn grid by chess-style name (e4) or [col, row]. `snap()` rounds a reading to a whole unit when it is within tolerance. |
| `src/curve.js` | Reading and analyzing SVG paths. `samplePath()` samples an SVG path into evenly spaced points, mapped to chart units via the toData converter. `crossings()` finds where a sampled curve crosses a given level (default y=0) via linear interpolation. `describe()` measures the extents and flatness/verticality of a sampled branch. `fitCircle()` fits a least-squares circle through sampled points, works on partial arcs. `family()` classifies a curve as linear, quadratic, exponential, or null (unknown). Linear fit uses least squares. Quadratic checks if the second differences are constant. Exponential checks if log(y) is linear in x. |
| `src/expr.js` | Expression comparison. `fromLatex()` converts LaTeX notation to a plain expression parser format (e.g., `\frac{a}{b}` becomes `(a)/(b)`). `fingerprint()` evaluates an expression at several sample points to get a comparable signature, so `x(x+8)` and `x^2+8x` can be compared even though they look different as strings. `same()` checks if two fingerprints describe the same function within tolerance. `pairUp()` greedily pairs equal-valued items by fingerprint. `degree()` extracts the polynomial degree from an expression. |
| `src/dom.js` | DOM manipulation and geometric inference. `visibleFrame()` picks the iframe a user can actually see (apps routinely leave stale iframes mounted). `labelEdges()` matches each text label to the geometry it annotates by nearest segment midpoint. `assign()` assigns each label to a distinct point, minimising total distance (solves the exact assignment problem for up to 8 labels). `xyDrags()` plans the sequence of clicks and drags needed to move points on a dot plot. `fiberFind()` extracts the state object behind a React rendering without touching the page structure. `clickLike()` clicks in a way frameworks accept (dispatches `pointerdown`, `pointerup`, and `click` in the right order). |
| `src/index.js` | Public API. Re-exports all functions from the four modules above. |
| `test/seamark.test.mjs` | Test suite covering coordinate conversions, path sampling, crossings, circle fitting, curve family classification, expression parsing and fingerprinting, label assignment, and DOM helpers. Run with `node --test`. |

## Web demo

| File | What it owns |
|---|---|
| `public/index.html` | Demo app root. Draws an SVG canvas for freehand drawing, input fields for reference points, and panels for results. Embedded inside a device frame. |
| `public/seamark.js` | Bundled library (built from `src/` via `npm run build`). Used by the demo and published to npm. |
| `public/i18n.js` | Internationalization. UI strings for English, Spanish, French, German, Japanese, and Chinese. The demo queries `navigator.language` to pick a language. |
| `public/devices.css` | Styling for device frames (iPhone, iPad, Mac, Android, Windows). Matches the visitor's user agent. |
| `vite.config.js` + `package.json` | Build configuration. Vite bundles `src/` into `public/seamark.js`. |

## iOS and macOS

| File | What it owns |
|---|---|
| `ios/App/Engine.swift` | Line-for-line port of `src/curve.js` and core functions from `src/coords.js`. Exports `samplePath()`, `crossings()`, `describe()`, `fitCircle()`, `family()`, `makeDataSpace()`, etc. |
| `ios/App/SeamarkApp.swift` | App entry point. `WindowGroup` with `ContentView()`. Prefers dark color scheme. |
| `ios/App/ContentView.swift` | Main drawing and analysis UI. Canvas for freehand drawing. Input fields for reference points. Panels for results (crossings, circle fit, curve family). Calls `Engine.swift` functions to analyze the drawn path. |
| `ios/App/L.swift` | Localization. UI strings for six languages. `L` is a simple key-based accessor. |
| `ios/Checks/main.swift` | Test suite mirroring `test/seamark.test.mjs`. Runs the same test vectors through `Engine.swift` so the Swift port never drifts from the JavaScript original. Run `swiftc -o /tmp/smcheck ios/App/Engine.swift ios/Checks/main.swift && /tmp/smcheck`. |
| `ios/project.yml` | xcodegen config for iOS and macOS targets. Generates `Seamark.xcodeproj`. |

## watchOS

| File | What it owns |
|---|---|
| `watchos/SeamarkWatchApp.swift` | App entry point. Single `WindowGroup` with `ContentView`. |
| `watchos/Views/CurvePageView.swift` | Pages through six preset curves. Tap a curve to drill into its details. Shows curve name and description. |
| `watchos/Views/PlotView.swift` | Renders a preset curve as an SVG plot. Displays the curve family, crossings, and circle fit results below. |
| `watchos/Models/Engine.swift` | Same as `ios/App/Engine.swift`. Shared by both iOS and watchOS. |
| `watchos/Models/Presets.swift` | Six preset curves for analysis: sine wave, exponential, power law, parabola, hyperbola, cubic. Each is a `(name, equation, f(x))` tuple. `PlotView` samples these and analyzes them using `Engine.swift`. |
| `watchos/Models/L.swift` | Localization. Same strings as iOS. |
| `watchos/Models/Theme.swift` | Design tokens for watchOS. Colors, typography, spacing. Dark theme only. |
| `watchos/project.yml` | xcodegen config. Generates `SeamarkWatch.xcodeproj`. |

## Kotlin Multiplatform

| File | What it owns |
|---|---|
| `kmp/shared/src/commonMain/kotlin/com/nulljosh/seamark/Engine.kt` | Kotlin port of `Engine.swift` and `src/curve.js`. Exports the same analysis functions. Used by both Android and desktop. |
| `kmp/shared/src/commonTest/kotlin/com/nulljosh/seamark/EngineTest.kt` | Test suite for the Kotlin engine, mirroring both the JavaScript and Swift test suites. Ensures all three implementations stay synchronized. |
| `kmp/composeApp/src/commonMain/kotlin/com/nulljosh/seamark/SeamarkScreen.kt` | Shared Compose UI for Android and desktop. Drawing canvas, reference point inputs, results panels. Calls `Engine.kt` to analyze drawn paths. |
| `kmp/composeApp/src/commonMain/kotlin/com/nulljosh/seamark/Strings.kt` | Localization for Compose. UI strings for six languages. |
| `kmp/composeApp/src/androidMain/kotlin/com/nulljosh/seamark/MainActivity.kt` | Android entry point. Boots the Compose app. |
| `kmp/composeApp/src/desktopMain/kotlin/com/nulljosh/seamark/Main.kt` | Desktop (JVM) entry point. Boots the Compose app as a window. |
| `kmp/gradlew` + `kmp/build.gradle.kts` | Gradle build. `./gradlew :composeApp:assembleDebug` builds the Android APK. `./gradlew :composeApp:packageDistributionForCurrentOS` builds the desktop installer (MSI, DEB, or DMG). |

## Gotchas

- **Coordinate spaces:** Mixing any two of the four coordinate spaces (user, frame, page, shot) produces plausible-looking wrong numbers. Every conversion here is explicit; the interfaces force you to think about which space you are in.
- **Stale DOM:** Apps routinely leave earlier iframe elements mounted, so `visibleFrame()` picks the last one, not the first.
- **Synthetic clicks:** Frameworks ignore mouse events that don't look like real pointer events. `clickLike()` dispatches `pointerdown`, `pointerup`, and `click` with all required properties so React and other frameworks actually respond.
- **Circle fit:** Works on partial arcs because it uses least-squares, not averaging extremes. A 90-degree arc is enough.
- **Curve family detection:** Linear fit, quadratic check (constant second differences), exponential check (log-linear). Some curves don't fit any; those return null.
- **Expression fingerprinting:** Two different-looking expressions are compared by evaluating them at several sample points. The points are deliberately irrational-looking (0.7314, 1.3121, -2.1137, 3.4271) so symmetric or periodic expressions don't collide by accident.
- **Multi-platform engine parity:** `src/curve.js`, `ios/App/Engine.swift`, and `kmp/shared/src/commonMain/kotlin/com/nulljosh/seamark/Engine.kt` must stay synchronized. Divergence is a bug. All three are pinned by the same test vectors.
