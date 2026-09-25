# Historical model restoration — September 25, 2026

## Problem and source of truth

The published page mistakenly made a 2013-to-future subgroup experiment the main model. Sam's original “Estimate Jewish Ancestry” conversation first modeled roughly 1925–2025, then varied starts from 1877–1927 and generation lengths, screening historical scenarios before summarizing their endpoints. The two recovered Python scripts are authoritative records of those experiments; the later subgroup model is a separate extension.

## Implementation plan

1. Preserve both recovered scripts unchanged. Reproduce the original first-stage screen (34,503 / 100,000 retained) and the seven original historical sensitivity runs.
2. Add an isolated historical engine with explicit start-year and generation-length ranges, a present-day endpoint, matched starting Jewish share, fertility/retention assumptions, and the original immigration-feasibility screen. Retain the subgroup engine and its saved links in a closed, clearly labeled extension.
3. Correct the historical script's short-final-interval bug: interpolate only the elapsed fraction of the final generation, and prorate the full-generation arrival share by the same fraction. Label this an approximation, not an age-structured reconstruction. Preserve an audit-only legacy timing mode for a like-for-like comparison.
4. Make the interactive show drawn/retained/rejected counts, rejection reasons, retained endpoint quantiles, and a representative accepted trajectory from the past to the endpoint. Do not screen on the desired 8% answer.
5. Rewrite the essay around the original question, both historical screens, corrected results, and limitations. Default endpoint is 2026; post-2020 identity and final historical reference values are held fixed assumptions, not new survey measurements.
6. Build, validate, review, refresh private preview, and publish to the already authorized GitHub Pages destination. Preserve the homepage exactly.

## Verification before release

- Write regression tests first for the missing historical module and its time semantics; observe failure before implementation.
- Check scalar full-generation calculations against the recovered Python reference, population conservation, exact accepted calibration, impossible-immigration rejection, elapsed-fraction behavior, deterministic sampling, and empty retained sets.
- Preserve all existing subgroup engine tests. Test the new controls, filtering, explicit rerun/stale-state behavior, exports, timeline, reduced motion, keyboard access, and 320/390px layouts in Chromium, Firefox and WebKit.
- Check no-JavaScript and self-contained offline versions. Inspect desktop/mobile screenshots. Review all edited code with fresh eyes.
- Rebuild deterministically, check whitespace, verify unchanged homepage, verify source archive provenance, and check deployed bytes and the public interactive after the Pages build succeeds.

## Interpretation boundaries

The first experiment's all-age summary uses assumed cohort weights. The later historical engine's endpoint is a simplified population state, not a validated estimate of all living Americans. Historical identity anchors mix definitions and denominators; foreign-born stock is a migration proxy. Initial outside ancestry and non-Jewish immigrants' uncounted ancestry are unknown. Retained quantiles describe selected assumptions, not statistical confidence intervals. The subgroup extension is not a source of historical denomination data.
