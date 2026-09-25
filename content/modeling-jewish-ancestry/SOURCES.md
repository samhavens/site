# Historical source and assumption ledger

Checked September 25, 2026. The main model restores the original historical experiment; it does not turn its approximate reference points into newly verified observations. Original scripts and their SHA-256 hashes are in `reference/` and `historical-reproduction.json`. `METHODS.md` lists every numerical reference point and sampling range.

| Input or claim | Source and status | Mapping and limitation |
|---|---|---|
| Early Jewish population curve | Sidney Goldstein, [American Jewry, 1970: A Demographic Profile](https://www.jewishdatabank.org/content/upload/bjdb/304/NJPS1971-AJYB_Article.pdf), AJYB 1971, printed p.11, Table 1 | The table gives approximately 1.3% in 1897, 2.0% in 1907, 3.3% in 1917, 3.6% in 1927 and 3.7% in 1937. Those support the broad trajectory, not the model's extra decimal precision. The table's early point is 1880 at 0.5%, not the script's 1877 at 0.52%; the latter is retained as a legacy assumption, not asserted as verified by this table. |
| 1957 Jewish religion reference | Goldstein's article describes the Census religion survey; printed p.38, Table 7 reports 3.868 million Jewish people among 119.333 million civilians aged 14+ | Approximately 3.2% is religion among civilians aged 14+, not the same definition as modern broad adult Jewish identity or an all-age share. |
| 1970 2.7%, 1990 2.2% | Legacy reference choices in the recovered script | Retained for reproduction; these exact points were not independently established as a consistent series in this restoration. Do not attribute them to AJYB Table 1, which lists 1968 at 2.9%. |
| 2013 2.2%, 2020 2.4% identity; 2020 1.1% additional background | Pew, [The Size of the U.S. Jewish Population](https://www.pewresearch.org/religion/2021/05/11/the-size-of-the-u-s-jewish-population/) | Adult survey estimates under Pew's definitions, with sampling uncertainty. Background covers parents or upbringing, not all ancestry. The first model's adult proxy is approximate. Repeating 2.4% in 2025/2026 is an assumption. |
| Modern intermarriage curve | Pew, [Marriage, Families and Children](https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/) | Intact marriages by marriage era, including 18% before 1980 and 61% in 2010 or later. Applying them to all reproductive pairings and assigning era midpoints is a convention. The script's early rates and 2025 63% endpoint remain assumptions/proxies, not a validated annual series. |
| Mixed-parent identity retention | Same Pew marriage/family chapter informed broad ranges | Parental reports of how children are being raised are not longitudinal adult retention probabilities. The historical intervals are analyst assumptions. |
| Foreign-born-stock proxy | [Census historical foreign-born statistics](https://www.census.gov/library/working-papers/2006/demo/POP-twps0081.html) | The legacy points are approximate and sometimes differ: Census gives 4.7% in 1970, 7.9% in 1990 and 11.1% in 2000; the script uses 4.8%, 8.2% and 11.4%. All are resident stocks, not generation-specific arrival flows. The multiplier and 2025 14.5% endpoint are assumptions. Retaining these inputs aids comparison with the original experiment; it is not an endorsement of their precision. |
| Fertility, clustering, screening windows, 60% arrival ceiling, cohort weights | Analyst choices in the original scripts | Not observed confidence bounds. Screening on exact identity points does not propagate their measurement uncertainty. |
| Partial-generation interpolation | New, explicit correction in historical engine 1.0.0 | Removes a full-extra-generation timing artifact; does not supply a validated age structure. |

The corrected interactive uses a **2026 endpoint**, not a new 2026 dataset. Values beyond the last curve point are held constant. Starting outside ancestry defaults to zero as a counting-horizon choice. Non-Jewish arrivals carry no counted additional ancestry. The historical endpoint is not an age-weighted estimate of everyone alive today.

All displayed ranges summarize selected sensitivity assumptions. They are not survey confidence intervals or posterior probabilities. The desired 8% result is never a selection criterion.

---

# Subgroup extension source ledger

Checked September 24, 2026. The separate subgroup extension starts from 2013 survey references. Dates below are source dates; none implies present-day measurement or historical calibration.

## 2013 starting values (`setup.js` 1.0.0)

| Input | Primary source | Mapping and limit |
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
