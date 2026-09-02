<img src="icon.svg" width="80" style="border-radius:18px">

# Seamark

![version](https://img.shields.io/badge/version-v0.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Fseamark-black?logo=github)](https://github.com/nulljosh/seamark)


The page shows a chart. You need the numbers. Seamark reads them off the drawing.

A seamark is a fixed thing you can see from the water and steer by. This library
works the same way. It looks at what a page draws, not what it stores, and tells
you the values behind it. For when the data never shows up as text: SVG charts,
third-party embeds, visual checks, and browser agents that have to act on what
they see.

## What it does

- **Keeps coordinates straight.** A browser graphic is measured in four rulers
  at once: SVG units, page pixels, the frame it sits in, and your screenshot.
  Mix two and you get a plausible wrong number. Every conversion here is explicit.
- **Reads curves.** Sample a drawn path, find where it crosses a level, fit a
  circle from a partial arc, and tell linear from quadratic from exponential.
- **Compares formulas.** `x(x+8)` and `x²+8x` look nothing alike and agree at
  exactly the point you would test first, so it compares them at several.
- **Handles widgets.** Picks the iframe you can actually see, pins labels to
  the shapes they sit on, plans the drags a dot plot needs, and clicks in a
  way frameworks accept.

## Use

```js
import { samplePath, crossings, fitCircle, family, makeDataSpace } from 'seamark';

const space = makeDataSpace(originInPagePx, oneUnitInPagePx);
const points = samplePath(document.querySelector('svg path'), space.toData);

crossings(points);   // where the curve meets y = 0
fitCircle(points);   // { cx, cy, r }
family(points);      // 'linear' | 'quadratic' | 'exponential' | null
```

```sh
npm test         # 16 tests
npm run build    # bundles src/ into public/seamark.js for the demo
```

## Apps

The same demo everywhere, in English, Spanish, French, German, Japanese and
Chinese. Each app carries its own port of the engine, with tests beside it.
Nothing depends on a web view.

- **Web:** https://seamark.heyitsmejosh.com. Draw a curve and watch it get measured.
- **iPhone, iPad and Mac:** SwiftUI app in `ios/`. `Engine.swift` is the Swift port.
- **Android, Windows and Linux:** Compose Multiplatform app in `kmp/`.
  `Engine.kt` is the Kotlin port. Desktop packages as MSI, DEB or DMG.

```sh
cd ios && xcodegen generate                       # then open Seamark.xcodeproj
swiftc -o /tmp/smcheck ios/App/Engine.swift ios/Checks/main.swift && /tmp/smcheck

cd kmp && export JAVA_HOME=$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home  # D8 rejects newer JDKs
./gradlew :shared:jvmTest                         # Kotlin engine tests
./gradlew :composeApp:assembleDebug               # Android APK
./gradlew :composeApp:packageDistributionForCurrentOS
```

MIT 2026 Joshua Trommel

## Whitepaper

[Technical whitepaper](WHITEPAPER.md)
