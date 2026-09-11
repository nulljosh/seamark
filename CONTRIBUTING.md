# Contributing to seamark

seamark is a small MIT-licensed coordinate/curve/expression library published as `@nulljosh/seamark` on npm, with a live demo at seamark.heyitsmejosh.com. Pull requests welcome.

## Setup

```
git clone https://github.com/nulljosh/seamark.git
cd seamark
npm install
```

No build step to develop — `src/*.js` is plain JS. `npm run build` concatenates the source files into `public/seamark.js` for the demo page.

## Test

```
npm test
```

Runs `test/*.test.mjs` with Node's built-in test runner. Add a test alongside any new function in `src/`.

## Making a change

- Keep additions in the matching source file (`coords.js`, `curve.js`, `expr.js`, `dom.js`) — don't create new files for one function.
- Run `npm test` before opening a PR.
- If you touch the public API, update `README.md`'s usage section to match.

## Reporting a bug

Open a GitHub issue with a minimal reproduction — the smaller the input that breaks, the faster it gets fixed.
