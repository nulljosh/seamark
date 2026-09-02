# Roadmap

## Open
- [ ] Name: "sextant" is a placeholder Joshua wants improved
- [ ] Attach `sextant.heyitsmejosh.com` to the Pages project. The DNS CNAME
      exists and is proxied; the custom domain still needs adding in the
      Cloudflare dashboard, because the DNS-scoped token cannot touch Pages and
      this wrangler build has no `pages domain` command
- [ ] More demo examples: sine, hyperbola, step, full circle, a piecewise pair
- [ ] Publish to npm once the name is settled
- [ ] Port the remaining techniques out of the Duolingo solver: table
      classification (differences vs ratios), optimal label-to-point assignment,
      and the drag helpers for widgets that ignore synthetic events

## Done
Coordinate reconciliation, path sampling with crossings and branch description,
partial-arc circle fit, expression fingerprinting, visible-frame selection,
label-to-edge matching, framework-acceptable pointer events. 11 tests.
Demo live at https://sextant-20m.pages.dev
