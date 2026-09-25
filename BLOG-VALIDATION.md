# Blog publication verification

Validated for publication on September 24, 2026 (America/Los_Angeles), following Sam's approval. The catalog marks the essay published on that date, and the built blog and article have no draft or `noindex` metadata. The homepage is byte-identical to the pre-publication version on `origin/master`, with no blog link. Deployment uses the existing GitHub Pages root on `master`.

## Current revision

- Apply standard sentence casing and proper-name capitalization throughout the essay, model interface, chart labels, exports and downloadable notes.
- Publish the blog through its direct URLs without adding homepage navigation.

- Begin explicitly in 2013 at generation zero.
- Load a survey-linked starting population from `setup.js` 1.0.0. Show the source denominators, mappings and assumptions; distinguish unknown older ancestry from zero ancestry counted in this run.
- Put starting year, generation interval, initial Jewish identity, outside ancestry, denomination mix and fertility together before the results.
- Remove the parent/child samples, associated filters, explanation and unused presentation code.
- Use a simple timeline with years on charts, results tables, state links and exports. Make the frozen-average comparison optional.
- Shorten the article, move the random-pairing illustration into expandable detail, and retain a no-JavaScript reading path.
- Preserve old saved v4 scenarios and the separate full parameter editor.

## Numerical checks

`npm test`: **80 tests passed**. The v4 engine, Python reference and numerical parity fixtures are unchanged. The four new setup tests cover the coherent 2013 reference, normalized cohort states, first-step equality with the frozen control, custom-input identification, and date/interval invariance of reproductive states. Correct implementation is not demographic validation.

## Browser checks

`BLOG_TEST_URL=http://127.0.0.1:8786 npm run test:browser`: **147 checks passed**, across Chromium, Firefox and WebKit; no failed browser runs or JavaScript errors.

Checks use actual HTTP navigation, user-facing form inputs and real file downloads. Coverage includes the absence of homepage blog navigation, direct blog-to-article navigation, published title/date/indexing metadata, visible historical setup, timeline stepping and play/pause, editable initial ancestry and identity, mix balancing, invalid-input recovery, fertility effects, optional comparison, convergence labeling, imported unequal non-Jewish fertility, sensitivity, ordinary anchor navigation, saved links across reloads, compatibility with previous links, JSON/CSV dates and source metadata, keyboard operation, 390/320-pixel layouts, non-overlapping year labels, reduced motion, no-JavaScript reading and offline execution.

The desktop opening/setup/results and mobile setup/results screenshots were visually inspected. Artifacts and the full per-check record are in ignored `artifacts/blog/`. WebKit automation is not a physical iPhone test or formal screen-reader certification.

## Build and source review

Local links and unique HTML IDs checked. Generated model, setup, UI, styles, methods and source notes match their canonical files. Rebuilding reproduces the same bytes, including the source archive. The source archive contains the new setup module and its tests. `git diff --check` passed.

Pew's 2013 population, denomination, intermarriage and fertility references, plus the 2015 Orthodox analysis of the 2013 survey, were retrieved and checked. Haredi composition is derived; separate Haredi fertility is not supplied by the chosen reference. Unknown historical ancestry, proxy rates and future-rule assumptions remain labeled.

Fresh Eyes review caught a number-input step mismatch, crowded selected-year labels on long mobile timelines, and incomplete explanations for fertility convergence and imported unequal non-Jewish fertility. These were corrected and covered by browser checks.

The publication casing review also checked rendered text and preserved lowercase mathematical variables, file paths, source URLs and model keys. Footnote identifiers remain stable. The engine, setup, fixtures and reference model have no changes in this publication pass. Desktop and mobile screenshots were inspected after the capitalization changes.
