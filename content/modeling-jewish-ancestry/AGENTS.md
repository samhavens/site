# Integrating and editing this essay

Read `METHODS.md`, `SOURCES.md` and `MODEL-AUDIT.md` before changing calculations or numerical claims. Canonical files live here; run `npm run build` at the site root to regenerate `blog/`. Do not edit generated copies directly.

## Editorial scope

Sam's original question concerned how much Jewish ancestry Americans might have today. Present two explicit sections: historical to present, without denomination groups, then projection, with denomination groups. The historical widget varies starts from 1877–1927 and ends in 2026, with 2025 available as the original endpoint. The projection is visible by default and uses an independent 2013 survey baseline; it does not inherit the historical endpoint. Keep earlier experiments and the timing audit in expandable notes.

Use direct, informal prose with standard casing. Preserve the opening anecdote about someone doubting an 8% claim. Avoid dramatic ancestry aphorisms, sentimental language and grand conclusions. Keep source definitions, uncertainty and assumptions intelligible.

## Contracts

1. Distinguish identity, roots plus genealogical descent, DNA and halakhic status. Only the first two are modeled. Secular Jews can be Jewish-identifying.
2. Do not merge the two historical screens. The first used rough adult identity/parent-proxy windows and cohort weights; the second matches a historical identity curve and screens implied arrival composition. Neither filters on proximity to 8%.
3. In `historical.js`, a different start loads the matching reference share and a different generation length changes reproductive steps before the endpoint. An incomplete final generation receives a fractional update and prorated arrivals. Keep this approximation explicit. The endpoint is not an age-weighted count of all living Americans.
4. Preserve the recovered historical Python files unchanged. Original results are reproduced in `historical-reproduction.json`; corrected browser results use a different documented RNG. Do not regenerate reference evidence to make new code pass.
5. Keep `model.js` v4 and `setup.js` numerical behavior compatible with existing saved subgroup links. Only that separate engine uses whole-generation clock labels. Its frozen-average comparison matches at the first step.
6. Initial outside ancestry defaults to zero as a counting-horizon assumption. Modern identity anchors are adult survey estimates; historical anchors mix definitions. Held-fixed 2026 references are not new observations. Relative fertility, migration proxies and screening ceilings are assumptions.
7. Retained quantiles are sensitivity distributions, not demographic confidence intervals. Show rejection counts, never fill rejected endpoints with zero, and export settings, versions and seed with results. Clear stale results when controls change.
8. Do not restore parent/child sample animations. Preserve keyboard access, reduced-motion support, no-JavaScript results, accessible labels and mobile table scrolling. No analytics or external runtime dependencies.
9. Run `npm test`, the historical Python parity check, `npm run build` and the browser checks after relevant changes. Keep the standalone HTML self-contained.
10. Sam approved publication on September 24, 2026 and requested this correction on September 25. Publish to the existing GitHub Pages site, retaining standard casing and **no homepage link to /blog/**. Publication approval does not establish demographic validity.
