# Audit of the earlier narrative and changes in v4

## Claims this draft does not carry forward

**“About 8% of Americans have recent Jewish ancestry.”** This was the output of an exploratory historical setup, not a validated national estimate. The supplied future subgroup model starts from it; it cannot establish it. It remains a clearly labeled alternative starting assumption, not the post's conclusion.

**“One in five Americans by about 2100.”** The earlier future narrative mixed descendant-cohort outputs with calendar-year population language. No all-age survival/age structure was implemented to support that translation. This draft uses whole cohort steps and calls the calendar labels illustrative.

**“The starting date hardly matters.”** That may describe a particular forced historical trajectory; it is not a robust result of this forward subgroup model. Moving the reference-year label here does not change the underlying demographic inputs. A real historical-start experiment needs different initial populations and time-indexed inputs.

**“Omitting hidden immigrant ancestry makes the result conservative.”** It omits one potential source of ancestry under other fixed assumptions. It does not guarantee the complete estimate is a lower bound; fertility, mixing, survival, migration, and initialization errors can move outcomes either way.

**“Many Monte Carlo runs make the model credible.”** They make the calculation reproducible and characterize sensitivity over selected distributions. They do not validate the distributions or identify the omitted mechanisms.

## Inherited corrections

v2 reportedly applied a full reproductive update to a shortened last interval. The supplied v3 reference uses whole generations. v4 preserves that whole-step contract and tests it. The current generation-years slider changes labels only; it does not repeat the partial-step bug under a different interface.

v3 improved the single-Jewish-group model by separating five identity groups and adding identity switching. Its frozen aggregate control matches the first reproductive step. These features are retained rather than replaced with a visually convenient but scientifically different model.

## Explicit v4 changes

1. **Default counting horizon:** start `J0=A0=.024`. Current Jewish members and specified Jewish arrivals are roots. There is initially no ancestry-only population counted in this experiment. This avoids presenting an unsupported historical estimate as an observed input.
2. **Terminology:** broad output is “Jewish roots + their descendants,” not a claim that every initial Jew, including a convert, necessarily has a Jewish ancestor. “No modeled connection” does not mean no real Jewish ancestors.
3. **Counterfactual zero-frequency control cells:** at D0=0, v3's generic missing-cell fallback would arbitrarily give J-D pairings two offspring who all enter D. v4 instead uses the corresponding subgroup-weighted fertility and transmission law. This is continuous in the ordinary D→0 limit, preserves first-step equality, and prevents the frozen identity trajectory changing merely because D rather than N carries pre-existing ancestry when both have equal fertility. Positive-frequency v3 fixtures still agree within tolerance.
4. **Arrival ancestry:** an explicit additional D fraction of arrivals is available in advanced settings. It is a stipulation, not a hidden data source.
5. **Transparent transmission:** same-group retention sliders preserve destinations among leavers. Full matrices are exposed in JSON. Degenerate transition rows are normalized rather than silently dropping mass.
6. **Validation:** non-finite values, invalid probability rows, ancestry below Jewish roots, inconsistent arrival shares, and fractional generation counts are rejected. Finite partner supply is preserved.
7. **Sensitivity:** the browser samples stated, independently chosen intervals around the current inputs. These are not a rerun of the earlier 20,000-draw v3 ensemble. Bands are labeled accordingly and discarded when inputs change or a run is cancelled.
8. **Animation:** independent illustrative events come from the same birth-weighted law as the exact cohort update. Filter probabilities and ancestry persistence are visible. No persistent agents or recovered ancestry trees are claimed.

## Known interpretive limits to keep visible

The model is sex-symmetric, non-overlapping, and age-free. Survey fertility for adult respondents is not automatically statistical-pair fertility. Branch labels, especially the future Haredi/modern split, do not determine immutable behavior. Inputs may evolve over time; one optional fertility-convergence rule does not resolve that uncertainty. The D/N clustering coefficient is a proxy, not a geographic mating network. Conversion, reaffiliation outside mixed families, mortality, and migration-by-origin are absent.

The matched-control comparison is a mechanism experiment. With constant subgroup inputs, later differences arise from subgroup composition and the identity/partner structure it induces. With fertility convergence enabled, differences also include that imposed within-group rate change. Neither comparison is a causal estimate from observed demographic data.

## September 2026 clarity revision

The page now starts in 2013 at generation zero. `setup.js` contains the survey-linked reference, separately versioned from the unchanged engine and fixtures. The old 2020-inspired engine defaults are retained only for reproducibility and previously saved scenarios. Source denominators, proxy mappings, unknown pre-existing ancestry and future-rule assumptions are visible in the setup and source ledger.

The parent/child animation is removed. Starting year, generation interval, initial identity, additional outside ancestry, denomination mix and fertility are visible before the results. Comparison with frozen starting averages is optional. A custom date retains the entered population and visibly states that historical data has not been loaded. Whole-step clock semantics and the exact first-step match are preserved. CSV now includes illustrative years and clock assumptions; JSON includes setup version and references.
