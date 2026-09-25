# Two-part presentation clarification — September 25, 2026

The article now has two main sections: Historical to present, without denomination groups, then Projection, with denomination groups. The projection is open by default and explicitly starts from its own 2013 survey baseline. Earlier experiments and the timing audit remain available in expandable notes. Both numerical engines, their inputs, historical default results and the homepage are unchanged.

- All **89 model tests**, **87 historical browser checks** and **147 blog/projection browser checks** pass. Coverage includes Chromium, Firefox and WebKit, both models, saved scenarios, exports, keyboard operation, reduced motion, 320/390px layouts, no-JavaScript reading and offline execution.
- Fresh Eyes review covered the prose, navigation, computed summaries, widget headings and generated outputs. Desktop and mobile screenshots of the opening and projection transition were inspected; the two section headings and independent baselines are visible, with no mobile overflow.
- The generated article, Markdown, offline copy and source archive carry the same presentation. The main text retains the screening explanation and selected-scenario uncertainty; collapsing the experiment history does not remove its provenance or timing comparison.

---

# Historical restoration verification — September 25, 2026

This revision restores the original historical-to-present modeling task and both scenario-screening experiments. It replaces the main 2013-to-future widget with a historical sweep and retains the subgroup engine as a closed optional extension. The opening anecdote, standard casing, direct blog URLs and unchanged homepage are preserved.

## Recovered evidence and model checks

- Recovered both original historical Python attachments and preserved them byte-for-byte. Their hashes and exact reproduced summaries are in `historical-reproduction.json`.
- Original first experiment: 100,000 draws, 34,503 retained, median rough all-age ancestry 6.394% (5th–95th: 5.193–8.098%). Original second experiment: reproduced all seven 30,000-draw cases; main case retained 1,134, median 8.02% (6.04–11.69%). These do not share a screen or age weighting.
- Verified and corrected the original full-reproduction-on-a-partial-final-interval bug. The correction and the prorated arrivals assumption are explicit in the essay and Methods. The original timing behavior remains only for reproduction/audit comparison.
- `npm test`: **89 passing tests**. Includes historical date semantics, elapsed fractions, decimal-year arithmetic, conservation, screen/rejection accounting, retained quantiles, reproducibility and empty-screen behavior, plus all 80 existing subgroup/reference tests.
- Python reference check: **490 historical steps across 95 retained paths** match the recovered full-generation function plus independently applied elapsed-fraction interpolation, prorated arrivals and calibration.
- Corrected default: starts 1877–1927, generations 24–30 years, endpoint 2026, seed 106, 30,000 draws; 1,335 retained; median 6.801% (5.315–9.178%). Source and proxy limitations, selection, and endpoint-versus-all-age distinctions remain explicit.

## Browser and artifact checks

- **87 historical browser checks** across Chromium, Firefox and WebKit: historical defaults, screening, matched initial share, real year/interval changes, empty screens, stale-result clearing, error messages, JSON/CSV exports, keyboard/timeline controls, 320/390px layouts, reduced-motion styles, no-JavaScript reading and offline execution.
- **147 existing blog/subgroup browser checks** still pass after adapting them to open the separate extension. Saved v4 links retain their original values and open the extension. No browser JavaScript errors.
- Desktop and mobile screenshots inspected. The main widget shows retained and rejected counts, a histogram of retained endpoints, and a single real historical path. No parent/child samples.
- Source archive verified against canonical files, including both unchanged recovered Python scripts and the reference checker. Runtime asset URLs and the source archive use content hashes to avoid stale caches.
- Rebuilding yields **16 byte-identical publication files**. The homepage is byte-identical to `db6ab60:index.html`; it has no local blog link. `git diff --check` passes.

## Review

Fresh Eyes review found a decimal generation-length rounding case that could put a computed fraction just above one; a failing regression test reproduced it before the bounded elapsed-fraction fix. Review also ensured failures hide incomplete results, exported paths include arrival multipliers, and histogram labels retain fractional-percent precision. The main calculations, UI, build, references and tests were re-read. Primary-source checks distinguished inherited curve approximations from independently verified survey figures; these are documented in the source ledger rather than silently upgraded into observations.

These checks validate implementation and presentation, not demographic accuracy. WebKit automation is not a physical iPhone test. Deployment uses the existing GitHub Pages root on `master`; live deployment evidence is recorded in ignored `artifacts/blog/` after release.

---

# Earlier publication verification — September 24

Validated for publication on September 24, 2026 (America/Los_Angeles), following Sam's approval. The catalog marks the essay published on that date, and the built blog and article have no draft or `noindex` metadata. The homepage is byte-identical to the pre-publication version on `origin/master`, with no blog link. Deployment uses the existing GitHub Pages root on `master`.

## September 24 revision (superseded as the main model)

- Apply standard sentence casing and proper-name capitalization throughout the essay, model interface, chart labels, exports and downloadable notes.
- Publish the blog through its direct URLs without adding homepage navigation.

- Open with the reported 8% claim and the objection that prompted the model. Introduce the 2013 source and starting population in the model section.
- Begin the model explicitly in 2013 at generation zero.
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
