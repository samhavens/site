# Blog draft verification

Verified locally on September 24, 2026 (America/Los_Angeles).

The new routes are `/blog/` and `/blog/modeling-jewish-ancestry/`. They remain local drafts, with `noindex` metadata. No push or deployment was performed.

## Numerical consistency

`npm test`: 76 tests passed. The engine, Python reference, numerical tests, and parity fixtures are byte-for-byte identical to the recovered revised draft. Coverage includes 50 Python-reference comparisons, pairing conservation, exact first-generation control matching, limiting cases, ancestry persistence, and seeded sampling. These checks establish implementation consistency, not demographic validity.

## Browser integration

`npm run test:browser`: 72 checks passed across Playwright Chromium, Firefox, and WebKit; no browser runs failed. The tests used the real local HTTP routes and actual filesystem downloads, not injected HTML or intercepted export blobs.

Checked navigation from the homepage through the blog index, default and alternate scenario outputs, subgroup edits, rejection of invalid imports, sensitivity bands, footnote navigation retaining sensitivity results, JSON/CSV downloads, saved-state URL reloads, visible errors for malformed state links, play/pause, keyboard scrubbing, mobile widths of 390 and 320 CSS pixels, reduced motion, text alternatives, no-JavaScript reading, and opening the self-contained HTML from disk without network dependencies.

The desktop and mobile opening/model screenshots were visually inspected. Screenshot artifacts and the per-check record are in ignored `artifacts/blog/`. Local links and HTML ID uniqueness passed. `git diff --check` passed.

WebKit automation is not a physical iPhone or Safari application test. Formal screen-reader conformance has not been certified. Live-domain integration remains a post-publication check.

## Source checks and scope

The cited Pew pages and Ralph–Coop paper were retrieved during integration. Pew's branch marriage percentages, age-specific fertility figures, and adult population definition were checked against the published text. Dated survey observations remain separate from the model's forward assumptions. The unvalidated 8% initial ancestry setting remains labeled as an input, and the article reports successive descendant cohorts rather than an all-age national forecast.

## Integration corrections

- Use the personal site's system-font design and Sam Havens byline.
- Preserve the revised plain explanatory prose.
- Start the main model at cohort 4; make secondary scenarios and detailed controls expandable.
- Animate the simple model's changing ancestry area without replacing every SVG element.
- Keep table scrolling keyboard accessible and saved-state errors visible.
- Ignore ordinary article anchors in the simulator's state loader so footnotes do not discard a completed sensitivity run.
- Compute static tables and all generated companions from the canonical source.

The local source archive contains the model, interface, assumptions, numerical tests, reference fixtures, and the portable HTML. The site's build instructions are in README.md.
