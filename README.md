# Seamark

Read the numbers out of a chart or diagram a web page only shows as a picture.

A seamark is a fixed thing you can see from the water and steer by. This
library works the same way: it looks at what a page draws, not what it
stores, and tells you the values behind it. Useful when the data never
appears as text: SVG charts, third-party embeds, visual checks, and browser
agents that have to act on what a page shows.

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

The same demo on every platform, in English, Spanish, French, German,
Japanese and Chinese. Each app carries its own port of the engine with tests
beside it, so nothing depends on a web view.

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

MIT.
