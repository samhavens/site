# Source and assumption ledger

Checked September 24, 2026. The essay starts from 2013 survey references. Dates below are source dates; none implies present-day measurement or historical calibration.

## 2013 starting values (`setup.js` 1.0.0)

| input | primary source | mapping and limit |
|---|---|---|
| Jewish identity .022 | Pew, [population estimates](https://www.pewresearch.org/religion/2013/10/01/chapter-1-population-estimates/), October 2013 | Adult “net Jewish” estimate, including Jews of no religion. Used for a simplified reproductive cohort, not measured ancestry or an all-age population. |
| Orthodox .10, Conservative .18, Reform .35 | Pew, [A Portrait of Jewish Americans](https://www.pewresearch.org/religion/2013/10/01/jewish-american-beliefs-attitudes-culture-survey/), October 2013 | Survey estimates with sampling uncertainty. Residual .37 combines other affiliations and no denomination; residual arithmetic includes rounding. |
| Haredi .062, other Orthodox .038 | Pew, [A Portrait of American Orthodox Jews](https://www.pewresearch.org/religion/2015/08/26/a-portrait-of-american-orthodox-jews/), August 2015, reanalyzing 2013 | Derived from .10 Orthodox × .62 Haredi within Orthodoxy. Other Orthodox includes the remainder, not just Modern Orthodox. Decimal precision is arithmetic, not measurement precision. |
| Fertility references 4.1 Orthodox, 1.8 Conservative, 1.7 Reform; general public 2.2 | Pew, [intermarriage and other demographics](https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/), October 2013 | Reported children among adults aged 40–59. Applying these to statistical pairings is a modeling convention. Both Orthodox groups receive the aggregate 4.1; their separate fertility is not measured here. General-public 2.2 proxies both non-Jewish groups. Other-Jewish 1.6 is stipulated. |
| Intermarriage .02 Orthodox, .27 Conservative, .50 Reform, .69 unaffiliated | Same [Pew demographic chapter](https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/) | Complements of reported Jewish-spouse shares among currently married respondents. Not prospective reproductive-union probabilities. Both Orthodox groups use the aggregate; unaffiliated proxies the broader other-Jewish group. |
| Additional ancestry outside identity: zero | Counting convention, not an observation | Starts descent counting with the reference community. Surveys about parents or upbringing do not measure all remote ancestry. Enter an assumed additional share to include it. |
| Arrival share .15, Jewish share .022 and the starting mix | Assumptions | Mirroring the starting community in arrivals does not make arrival flows observed. Arrival share is per new cohort, not annual immigration. |

The historical reference loads these values together. A manually changed start year keeps the current parameters and is visibly labeled custom. There is no interpolation over earlier centuries and no claim that the same denominational categories or behavior apply to them.

## Remaining assumptions

Identity transitions, within-Jewish partner reservation, descendant clustering, mixed-pair fertility, future fertility persistence/convergence and imported ancestry are assumptions. The input-sensitivity intervals are stipulated and are not confidence intervals for the survey estimates. Outputs are conditional successive-cohort calculations, not a forecast of everyone alive in a calendar year.

The former 8% total-ancestry starting point is still expressible (2.2% initial Jewish identity plus 5.8% additional outside ancestry). It is not an established estimate.

## Legacy reproducibility

`M.defaults()` retains the recovered engine's .024 identity, .06/.03/.17/.37/.37 Jewish mix, illustrative subgroup rates and 2026 reference label, so old saved scenarios and numerical parity fixtures are unchanged. It is not the current essay default. Its .024 identity reference came from Pew's [2020 population chapter](https://www.pewresearch.org/religion/2021/05/11/the-size-of-the-u-s-jewish-population/); the former rates were scenario assumptions, not a synchronized historical dataset.

## Genealogy versus genetics

Ralph and Coop, [The Geography of Recent Genetic Ancestry across Europe](https://doi.org/10.1371/journal.pbio.1001555), PLOS Biology, 2013, distinguishes genealogical and genetic ancestry and examines population structure. It does not estimate Jewish ancestry among Americans.

The inheritance recurrence and frozen-average comparison are conditional mathematical constructions. Correct implementation alone does not validate their demographic inputs.
