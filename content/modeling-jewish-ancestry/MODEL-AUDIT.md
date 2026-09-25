# September 25, 2026 historical restoration

The first published revision mistakenly promoted the later 2013-to-future subgroup experiment into the main essay and omitted the historical scenario screening. Sam identified that error. The corrected page restores the historical question, experiments and explicit screening, leaving the subgroup model as a separate extension.

Both original historical scripts were recovered from the original conversation and run unchanged. The first reproduced 34,503 retained / 100,000 drawn and the 6.394% rough all-age median (5th–95th: 5.193–8.098%). The second reproduced all seven 30,000-draw cases, including 1,134 retained in the main ensemble, median 8.02% (6.04–11.69%). These are provenance results, not validated population estimates.

The second script's final-interval bug was verified directly: it performs a full reproductive update even for a short remainder. Historical engine 1.0.0 prorates both the update and the full-generation arrival share by the elapsed fraction. The interpolation is an explicit new assumption. Full-generation calculations remain the recovered model's equations. A Python check independently verifies 490 steps over 95 retained paths against the original generation function plus this stated correction.

The main browser default now samples starts 1877–1927, generations 24–30 years, and ends in 2026. It retains 1,335 / 30,000 draws with median 6.801% (5th–95th: 5.315–9.178%). Its same-input old-timing comparison is computed during every build. The 2026 endpoint holds the last reference values constant, not newly observed 2026 data. The first model's age weights and adult-parent filter are not silently added to the second model.

Source checks found limitations beyond timing: the early 1877 point is not the 1880 point in the cited AJYB table; intermediate identity references mix definitions; the stock proxy differs in places from Census's series; exact calibration ignores measurement uncertainty. These remain clearly documented legacy assumptions for this restoration. A high rejection rate and sensitivity quantiles do not establish a fitted historical population or a national confidence interval. No denomination history has been invented.

The original subgroup engine and its numerical fixtures are unchanged. Its old saved links still open the optional extension. The historical widget has independent controls and state, so its calendar semantics cannot accidentally change the subgroup engine's whole-generation contract.

---

# Archived audit of the separate subgroup extension

## Claims this draft does not carry forward

**“About 8% of Americans have recent Jewish ancestry.”** This was the output of an exploratory historical setup, not a validated national estimate. The supplied future subgroup model starts from it; it cannot establish it. It remains a clearly labeled alternative starting assumption, not the post's conclusion.

**“One in five Americans by about 2100.”** The earlier future narrative mixed descendant-cohort outputs with calendar-year population language. No all-age survival/age structure was implemented to support that translation. This draft uses whole cohort steps and calls the calendar labels illustrative.

**“The starting date hardly matters.”** That may describe a particular forced historical trajectory; it is not a robust result of this forward subgroup model. Moving the reference-year label here does not change the underlying demographic inputs. A real historical-start experiment needs different initial populations and time-indexed inputs.

**“Omitting hidden immigrant ancestry makes the result conservative.”** It omits one potential source of ancestry under other fixed assumptions. It does not guarantee the complete estimate is a lower bound; fertility, mixing, survival, migration, and initialization errors can move outcomes either way.

**“Many Monte Carlo runs make the model credible.”** They make the calculation reproducible and characterize sensitivity over selected distributions. They do not validate the distributions or identify the omitted mechanisms.

## Inherited corrections

The recovered v2 script applies a full reproductive update to a shortened last interval. The supplied v3 reference uses whole generations. v4 preserves that whole-step contract and tests it. The current generation-years slider changes labels only; it does not repeat the partial-step bug under a different interface.

v3 improved the single-Jewish-group model by separating five identity groups and adding identity switching. Its frozen aggregate control matches the first reproductive step. These features are retained rather than replaced with a visually convenient but scientifically different model.

## Explicit v4 changes

1. **Default counting horizon:** start `J0=A0=.024`. Current Jewish members and specified Jewish arrivals are roots. There is initially no ancestry-only population counted in this experiment. This avoids presenting an unsupported historical estimate as an observed input.
2. **Terminology:** broad output is “Jewish roots + their descendants,” not a claim that every initial Jew, including a convert, necessarily has a Jewish ancestor. “No modeled connection” does not mean no real Jewish ancestors.
3. **Counterfactual zero-frequency control cells:** at D0=0, v3's generic missing-cell fallback would arbitrarily give J-D pairings two offspring who all enter D. v4 instead uses the corresponding subgroup-weighted fertility and transmission law. This is continuous in the ordinary D→0 limit, preserves first-step equality, and prevents the frozen identity trajectory changing merely because D rather than N carries pre-existing ancestry when both have equal fertility. Positive-frequency v3 fixtures still agree within tolerance.
4. **Arrival ancestry:** an explicit additional D fraction of arrivals is available in advanced settings. It is a stipulation, not a hidden data source.
5. **Transparent transmission:** same-group retention sliders preserve destinations among leavers. Full matrices are exposed in JSON. Degenerate transition rows are normalized rather than silently dropping mass.
6. **Validation:** non-finite values, invalid probability rows, ancestry below Jewish roots, inconsistent arrival shares, and fractional generation counts are rejected. Finite partner supply is preserved.
7. **Sensitivity:** the browser samples stated, independently chosen intervals around the current inputs. These are not a rerun of the earlier 20,000-draw v3 ensemble. Bands are labeled accordingly and discarded when inputs change or a run is cancelled.
8. **Animation:** the original parent/child event display was removed at Sam's request. The model's sampling helpers and their tests remain, but the page uses timelines and the optional random-pairing example.

## Known interpretive limits to keep visible

The model is sex-symmetric, non-overlapping, and age-free. Survey fertility for adult respondents is not automatically statistical-pair fertility. Branch labels, especially the future Haredi/modern split, do not determine immutable behavior. Inputs may evolve over time; one optional fertility-convergence rule does not resolve that uncertainty. The D/N clustering coefficient is a proxy, not a geographic mating network. Conversion, reaffiliation outside mixed families, mortality, and migration-by-origin are absent.

The matched-control comparison is a mechanism experiment. With constant subgroup inputs, later differences arise from subgroup composition and the identity/partner structure it induces. With fertility convergence enabled, differences also include that imposed within-group rate change. Neither comparison is a causal estimate from observed demographic data.

## September 24, 2026 clarity revision (superseded as the main essay)

The page now starts in 2013 at generation zero. `setup.js` contains the survey-linked reference, separately versioned from the unchanged engine and fixtures. The old 2020-inspired engine defaults are retained only for reproducibility and previously saved scenarios. Source denominators, proxy mappings, unknown pre-existing ancestry and future-rule assumptions are visible in the setup and source ledger.

The parent/child animation is removed. Starting year, generation interval, initial identity, additional outside ancestry, denomination mix and fertility are visible before the results. Comparison with frozen starting averages is optional. A custom date retains the entered population and visibly states that historical data has not been loaded. Whole-step clock semantics and the exact first-step match are preserved. CSV now includes illustrative years and clock assumptions; JSON includes setup version and references.
