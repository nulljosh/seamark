# Seamark Technical Whitepaper

**v0.1.0** | September 2026

Seamark reads the numbers out of a chart or diagram that a web page only
shows as a picture. It looks at what a page draws, not what it stores. Useful
for SVG charts, third-party embeds, visual checks, and browser agents that
must act on what a page shows. Library plus demo apps on every platform. Live
at [seamark.heyitsmejosh.com](https://seamark.heyitsmejosh.com).

## The coordinate problem

A browser graphic is measured in four rulers at once: SVG user units, page
pixels, the iframe it sits in, and your screenshot. Mixing two gives a
plausible wrong number. `src/coords.js` makes every conversion explicit:
`makeDataSpace(originPx, unitPx)` returns `toData` and `toPx` and nothing is
ever converted implicitly.

## Modules

| File | Does |
|---|---|
| `coords.js` | data space, page and frame offsets, screenshot scale |
| `curve.js` | `samplePath`, `crossings`, `fitCircle`, `family` |
| `expr.js` | compare formulas numerically at several points |
| `dom.js` | pick the visible iframe, pin labels to shapes, plan drags, click so frameworks accept it |

`samplePath` walks an SVG path with `getPointAtLength` and maps through the
data space. `crossings` finds sign changes against a level. `fitCircle` is a
least-squares fit from a partial arc. `family` classifies linear, quadratic
or exponential by testing first and second differences and ratios, or returns
null.

`expr.js` exists because `x(x+8)` and `x²+8x` agree at exactly the first
point anyone tests, so equality is checked at several.

## Ports

Each app carries its own engine port with tests beside it, so nothing depends
on a web view.

- **Web**: `src/` bundled to `public/seamark.js`. `npm test` runs 16 tests.
- **iPhone, iPad, Mac**: SwiftUI in `ios/`, `Engine.swift`.
- **Android, Windows, Linux**: Compose Multiplatform in `kmp/`, `Engine.kt`.
  Desktop packages as MSI, DEB or DMG. Android needs JDK 17.

Six languages: English, Spanish, French, German, Japanese, Chinese.

## License

MIT 2026, Joshua Trommel
