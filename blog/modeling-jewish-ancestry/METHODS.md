# Historical experiments and their screens

Updated September 25, 2026. The main interactive is historical engine **1.0.0** (`historical.js`). It reconstructs the second historical experiment from the original conversation, with an explicit correction for an incomplete final generation. The separate subgroup extension remains engine **4.0.0** (`model.js`); its equations follow later in this document.

## Three distinct experiments

| Experiment | Starting point and endpoint | Screen | What its output describes |
|---|---|---|---|
| First historical script | Approximately 1925–2025, four 25-year steps | Rough adult-weighted identity 2.1–2.7%; parent-or-identity proxy 3.1–4.0% | Four cohorts combined with assumed surviving-population weights |
| Second historical script / main interactive | Sampled starts 1877–1927; 24–30 years per generation; original endpoint 2025, interactive default 2026 | Match the historical identity reference curve by solving arrival composition; reject any step requiring less than 0% or more than 60% Jewish arrivals | A simplified terminal population state; no all-age weighting |
| Subgroup extension | A 2013 survey-linked setup followed into the future | None; optional sensitivity draws are summarized without historical screening | Successive reproductive cohorts, distinguishing Jewish denominations |

No screen uses proximity to 8% as a criterion. The historical model does not derive or calibrate denomination shares. Its three states are J (Jewish identity), D (counted descendants outside identity), and N (no counted ancestry), with J+D+N=1. The broader quantity includes community roots as well as descent; it is not DNA or halakhic status.

## Recovered first experiment

`reference/jewish_ancestry_model.py` is unchanged. Running it with 100,000 draws and seed 20260923 reproduces **34,503 retained**. Percentiles (5th / median / 95th), in percent:

| Quantity | 5th | Median | 95th |
|---|---:|---:|---:|
| Rough all-age ancestry | 5.193 | 6.394 | 8.098 |
| Youngest-cohort ancestry | 7.082 | 9.133 | 12.200 |
| Rough all-age identity | 2.258 | 2.502 | 2.698 |
| Adult parent-or-identity proxy | 3.124 | 3.326 | 3.620 |

All-age weights are `[.08,.27,.33,.32]`; adult weights are `[.105,.357,.436,.102]`. These are stipulated, not estimated survival or age-structure schedules. Screening windows are analyst choices, not Pew confidence intervals. The parent proxy is the share of offspring with at least one Jewish-identifying parent plus Jewish arrivals; it approximates, but does not duplicate, a survey category that also includes upbringing. Exact distributions and code are in the original script. Full reproduction metadata for both historical scripts is in `historical-reproduction.json`.

## Historical reference curves

The second experiment retained these points. Between points, interpolate linearly; outside the listed period, hold the nearest endpoint fixed. Points mix estimates, proxies and assumptions; they are not a homogeneous measured series. See SOURCES.md for source checks and discrepancies. Percent units below.

- Jewish share: 1877: 0.52; 1897: 1.31; 1907: 2.00; 1917: 3.27; 1927: 3.58; 1937: 3.70; 1957: 3.20; 1970: 2.70; 1990: 2.20; 2013: 2.20; 2020: 2.40; 2025: 2.40.
- Foreign-born-stock proxy: 1900: 13.7; 1910: 14.6; 1920: 12.7; 1930: 11.3; 1940: 8.5; 1950: 6.9; 1960: 5.6; 1970: 4.8; 1980: 6.2; 1990: 8.2; 2000: 11.4; 2010: 12.7; 2018: 14.1; 2025: 14.5.
- Central intermarriage proxy: 1877: 1.0; 1897: 1.5; 1907: 2.0; 1935: 5.5; 1957: 3.8; 1975: 18; 1985: 42; 1995: 37; 2005: 45; 2015: 61; 2025: 63.

The 2025 Jewish share repeats the 2020 adult survey reference. The 2025 arrival and marriage proxy points are assumptions. The browser's 2026 endpoint holds all final points fixed for the extra year. The default does not assert any newly measured 2026 rates.

## Sampled assumptions

All ranges are independent uniform draws. Starting year and generation length can be fractional. Setting the two ends of a range equal fixes that input.

| Input | Default range | Resampled when? |
|---|---|---|
| Start year | 1877–1927 | Each scenario |
| Years per generation | 24–30 | Each scenario |
| Initial outside ancestry | 0 (editable 0–20%) | Fixed user assumption |
| Descendant clustering c | 0–.5 | Each scenario, then constant |
| Relative fertility, two Jewish parents | .85–1.08 | Each scenario, then constant |
| Relative fertility, one Jewish parent | .82–1.06 | Each scenario, then constant |
| Relative fertility, D/D or D/N | .90–1.06 | Each scenario, then constant |
| Relative fertility, N/N | 1 | Fixed reference |
| Jewish identity retention, two Jewish parents | .94–.995 | Each scenario, then constant |
| Intermarriage multiplier | .55–1.65 before 1960; .75–1.35 before 1980; .88–1.12 thereafter | Each step, at its calendar midpoint; final rate clipped to .001–.80 |
| One-Jewish-parent identity retention | .12–.45 before 1940; .15–.50 before 1970; .25–.62 before 2000; .48–.75 thereafter | Each step, at its calendar midpoint |
| Arrival proxy multiplier | .65–1.45 | Each step |

Dates, fertility, clustering, two-parent retention and arrival settings are editable in the main widget. Calendar proxy curves and the one-parent retention intervals are fixed in code and documented here. N arrivals have no counted ancestry. No conversion process or mortality schedule is fitted.

## Full-generation update

Let j,d,n be the current shares; m the Jewish intermarriage rate; c the clustering assumption; z=d/(1-j); and h=1-j-j*m. Unordered pair masses are:

```
jj = j*(1-m)
jd = 2*j*m*d/(1-j)
jn = 2*j*m*n/(1-j)
dd = h*(c*z + (1-c)*z*z)
dn = h*(1-c)*2*z*(1-z)
nn = h*(c*(1-z) + (1-c)*(1-z)^2)
```

Here the final line names the pair mass `nn` in the implementation (not the individual share n). The six masses sum to one. Weight jj by fjj, jd+jn by fmix, dd+dn by fd, and nn by 1. Divide by their sum B. Then ancestry A=1-nn/B, identity J=(jj*fjj*rjj+(jd+jn)*fmix*rm)/B, D=A-J. The offspring parent proxy is (jj*fjj+(jd+jn)*fmix)/B.

## Partial final interval and calibration

A historical step ends at `min(current_year + generation_years, end_year)`. Let f be elapsed years / generation years. Compute a full next cohort F(x), then use `pre = x + f*(F(x)-x)`. Full steps have f=1; a seven-year remainder of a 28-year generation has f=.25. This convex mixture preserves a valid population distribution, but it is an interpolation assumption rather than an age-structured demographic process. The initial parent proxy is set to J; a partial final step blends it the same way. The proxy is exported for reproducibility but is not a screen in this experiment.

Let b be the foreign-born proxy at the step endpoint and k the sampled arrival multiplier. The full-generation arrival share is `u_full = clip(b * generation_years / 25 * k, .01, .35)`. Apply `u = f * u_full`. This makes arrivals vanish with elapsed time, instead of imposing at least 1% arrivals on even a tiny remainder. For a full generation, it matches the original script.

For target Jewish share t, solve `q = (t - (1-u)*pre.J) / u`. Reject the entire scenario immediately if q<0 or q exceeds the chosen ceiling (default .60). Otherwise `J=t`, `D=(1-u)*pre.D`; the remaining share is N. Jewish arrivals are new counted roots. This calibration matches identity at the modeled step endpoints, not every intervening year; lines between displayed points are visual interpolation.

The original script applied F(x) in full even when f<1 and used `clip(b * elapsed_years / 25 * k, .01, .35)` for arrivals. Audit-only `legacyTiming` reproduces those timing rules. This is bundled to expose the effect of the correction, not as an equally recommended interactive option. Both reproduction and correction retain the original population curves and assumptions.

## Sampling, display and reproducibility

The browser uses Mulberry32, a separate stream per scenario: `(seed + index * 0x9e3779b9) mod 2^32`. NumPy's original RNG is different, so a browser run does not reproduce the exact historical acceptance count merely by sharing its seed. Use the unchanged original Python scripts to reproduce those counts. The old/new timing comparison in `default-results.json` uses the same browser draws, with each timing version applying its own screen.

Histograms and linearly interpolated 5th/50th/95th percentiles include **only retained endpoints**. Rejected endpoints are absent, not zero. The displayed trajectory is the lower-middle retained scenario sorted by endpoint ancestry (ties by draw index), so it is a real path near the median rather than a synthetic median path. Exports retain every draw's status and rejection reason. JSON includes the displayed path's step-specific sampled rates. Complete settings, seed, version and record index reproduce every other path.

The reference default is 30,000 draws, seed 106, ending in 2026: **1,335 retained**, 28,665 rejected for negative implied Jewish arrivals and none for the 60% ceiling. Retained ancestry percentiles are **5.315 / 6.801 / 9.178%**. The same browser inputs ending in 2025 retain 1,345, with **5.263 / 6.709 / 9.013%**. These ranges describe the chosen scenarios, not measured-population uncertainty. Most trials fail; that selection is part of the result, not hidden evidence of fit.

Reproduce from the article directory:

```
node --test tests/*.test.cjs
uv run --no-project --with numpy python reference/verify_historical.py
uv run --no-project --with numpy python reference/jewish_ancestry_model.py --draws 100000 --seed 20260923
uv run --no-project --with numpy python reference/jewish_ancestry_sensitivity_v2.py
```

The independent Python parity check uses the recovered full-generation function with the browser's exported sampled inputs, then separately applies the stated interpolation and calibration. Reproduction validates implementation, not the historical assumptions.

---

# Separate subgroup extension (v4): definitions and equations

## Scope

This is a deterministic expected-value model of **successive non-overlapping reproductive cohorts**. It illustrates inheritance and compositional effects. It does not estimate the present number of Americans with Jewish ancestry or forecast the population alive in a calendar year.

“Connection” in the code means membership in the starting Jewish community, Jewish membership among specified arrivals, or descent from those roots. A convert can be a root without having a Jewish ancestor. No genetic fractions, halakhic status, observed individual identities, or personal family records are inferred.

## State

The state is `x = [H,M,C,R,U,D,N]`, a nonnegative vector summing to one:

| Index | State |
|---|---|
| H | Haredi Jewish identity |
| M | Modern/other non-Haredi Orthodox Jewish identity |
| C | Conservative Jewish identity |
| R | Reform Jewish identity |
| U | other/unaffiliated Jewish identity, including secular identifying Jews |
| D | a modeled descendant who does not identify as Jewish |
| N | no modeled connection within this counting horizon |

`J = H+M+C+R+U`, `A = J+D = 1-N`. H and M partition Orthodoxy. These broad labels are a simplification of heterogeneous communities.

## Subgroup extension starting setup (2013)

The optional subgroup widget and its offline counterpart use `setup.js` version 1.0.0, which applies survey-linked starting values to the unchanged v4 engine. This is a conditional reference scenario, not a fitted reconstruction of the 2013 population.

`J0=A0=.022`, so `D0=0`. The zero is a counting-horizon choice, not an estimate of absent earlier ancestry. The interface separately exposes Jewish identity and **additional ancestry outside identity**, both as percentages of the whole initial population. Their sum is `A0`; changing J0 preserves the user-entered D0.

| Group | Share within Jewish identity | Effective same-group offspring | Non-Jewish partner rate |
|---|---:|---:|---:|
| H | .062 | 4.1 | .02 |
| M | .038 | 4.1 | .02 |
| C | .18 | 1.8 | .27 |
| R | .35 | 1.7 | .50 |
| U | .37 | 1.6 | .69 |
| D | not applicable | 2.2 | not applicable |
| N | not applicable | 2.2 | not applicable |

See `SOURCES.md` for the source denominators and assumptions. Haredi composition derives from the reported Orthodox share and Haredi fraction within Orthodoxy; M includes every remaining Orthodox subgroup. The reported Orthodox fertility average is applied equally to H and M, not presented as two separately observed rates. Other-Jewish fertility is stipulated; the general-public fertility reference proxies D/N. The unaffiliated marriage reference proxies the broader U group. Adult survey estimates are used as simplified reproductive-cohort inputs.

The 2013 setup also sets `arrivalJewish=.022` and copies the initial Jewish mix into `arrivalMix`. This is an explicit assumption about arrivals. Later editing of the starting mix does not modify the arrival mix. The reset button restores all reference inputs and future rules, while preserving the chosen generation interval and run length. A custom year keeps the current values and visibly requires the reader to review them; it does not fetch or interpolate historical demography.

For reproducibility, `M.defaults()` retains the recovered v4 values (`J0=A0=.024`, reference year 2026, Jewish mix `[.06,.03,.17,.37,.37]`, fertility `[5.5,3,1.9,1.8,1.6,2,2]`, intermarriage `[.005,.025,.45,.65,.80]`). These are the **legacy engine defaults**, not the current essay's starting setup. Old v4 state links keep their complete saved values. The engine, reference model, and parity fixtures are unchanged.

Own-group reservation remains `[.96,.80,.50,.50,.40]`; one-Jewish-parent identity retention remains `[.60,.65,.65,.60,.50]`. Both are assumptions.

A fertility entry is offspring per **statistical pairing**, incorporating childlessness into its effective average. Every adult participates in a statistical unit; the model does not assert that everyone literally marries. Only relative fertility affects normalized composition. It does not maintain absolute population sizes or fertility-by-age schedules.

Other essay defaults: D/N clustering `.25`; Jewish/non-Jewish fertility multiplier `.90`; arrival fraction of each next cohort `.15`; Jewish share of arrivals `.022`; additional ancestry-only share of arrivals `0`. Jewish arrivals use a separately specified mixture, initially the same as the initial Jewish mixture. Editing initial composition does not silently change arrival composition.

## Balanced pairing

The implementation constructs a symmetric **ordered-pair** matrix `P`. Both row and column sums equal `x`, and the entries sum to one. This is a distribution of parental positions, not an unordered count of couples. Double-counting the two orientations cancels in the normalized birth update.

For each Jewish subgroup, requested cross-pool mass is `x_i*m_i`. If total requested partners exceed `D+N`, all cross-pool demands are scaled down proportionally. Available partners are assigned between D and N in proportion to their populations. The resulting cross cells are inserted symmetrically.

Let the remaining Jewish mass of subgroup i be `a_i`. Reserve `r_i = a_i*s_i` on its own-group diagonal. Let `z_i=a_i-r_i` and `Z=sum z_i`. The Jewish block is:

```
P_ij = z_i*z_j/Z + indicator(i=j)*r_i
```

The random-pool term is zero when Z is zero. Reservation is a portion of the remaining in-marriage pool; the final same-group share is larger because the random pool also generates same-group matches.

Let `d_a` be the remaining D/N masses after cross-pool matches. With clustering `c`, their block is:

```
P_ab = (1-c)*d_a*d_b/sum(d) + c*indicator(a=b)*d_a
```

Here c is a crude proxy for population structure, not a claim that people know remote ancestry and deliberately choose on that basis. Geography, ethnicity, education, and persistent social networks are not separately modeled.

## Fertility

For group fertility inputs f_i:

```
F_ij = sqrt(f_i*f_j)
```

Multiply by `mixedFertility` when exactly one parent is Jewish-identifying. Cross-denominational Jewish pairings and D/N pairings receive no such multiplier. The geometric mean is a stipulated convention, not a fitted estimate for mixed couples.

With optional fertility-gap half-life h > 0, Orthodox inputs at reproductive step g become:

```
f_i(g) = f_N + (f_i(0)-f_N)*2^(-g/h), i in {H,M}
```

A half-life of zero switches convergence off. The first step g=0 is unchanged. “Half over three steps” means the excess has halved when evaluating g=3, not that every parameter is linearly interpolated by calendar year.

## Identity transmission

Each pair has a probability vector `T_ij,k` over adult offspring identities. Default rows for two same-group Jewish parents are:

| Parent group | H | M | C | R | U | D | N |
|---|---:|---:|---:|---:|---:|---:|---:|
| H | .920 | .040 | .010 | .010 | .018 | .002 | 0 |
| M | .050 | .720 | .080 | .060 | .070 | .020 | 0 |
| C | .003 | .017 | .420 | .300 | .190 | .070 | 0 |
| R | .002 | .008 | .040 | .650 | .180 | .120 | 0 |
| U | .002 | .008 | .020 | .060 | .810 | .100 | 0 |

These rows are illustrative, not recovered from a longitudinal transmission study. They apply to the identity reached in the next modeled adult cohort. Leaving one's initial subgroup is not necessarily leaving Jewish identity. Cross-Jewish-subgroup parent rows are the average of the two corresponding same-group rows.

For one Jewish parent in group i and one D/N parent, retain Jewish identity with probability `mixedRetention[i]`. Conditional on retention, destinations are 65% the normalized Jewish destinations in i's same-group row and 35% U. Nonretained offspring enter D. If the same-group row has no Jewish destinations, the separately retained mixed-parent children go to U.

D/D and D/N offspring enter D. N/N offspring enter N. There is no N-to-J conversion process after initialization; adding one would need a separate identity/root convention and data. D does not recover Jewish identity except through a pairing with a Jewish parent.

The “stays in same group” slider changes the diagonal entry and rescales the other destinations proportionally. It preserves the previous relative destinations among leavers. The full JSON editor exposes every transmission row; all rows must sum to one and have zero N probability for rooted parents.

## Cohort update and arrivals

Compute birth weights and the next normalized state:

```
b_k = sum_ij P_ij * F_ij * T_ij,k
B = sum_k b_k
x'_k = (1-u)*b_k/B + u*v_k
```

u is the **arrival share of the next cohort**, not the annual immigration rate and not the foreign-born share of the existing all-age population. v is the stipulated arrival composition. All cohorts use the same u/v unless the engine is deliberately extended.

An individual descendant never loses descent. Its population frequency can nevertheless decrease under differential fertility or denominator changes from arrivals. “Ancestry is an OR” does not imply unconditional monotonic growth of its population share.

## The matched frozen-average control

Collapse the seven groups into `[J,D,N]`. From the initial fine-grained pair distribution, compute for coarse pair a,b:

```
Fbar_ab = sum_(i in a,j in b) P_ij*F_ij / sum_(i in a,j in b) P_ij
Tbar_ab,c = sum_(i in a,j in b,k in c) P_ij*F_ij*T_ij,k
             / sum_(i in a,j in b) P_ij*F_ij
```

The aggregate initial intermarriage input is the initial Jewish-population-weighted mean of subgroup m_i. Pairing uses the same balanced supply constraint, D/N clustering, and collapsed arrival vector. The conditional fertility and transmission averages are then frozen.

This matches the fine model's collapsed first next-cohort state exactly. Subsequent divergence shows the consequences of updating subgroup composition instead of indefinitely using initial averages. With optional time-varying fertility enabled, later divergence also includes the imposed change in those fertility inputs; it is not then a pure composition-only treatment.

**Zero-frequency pairs:** the default D0=0 means J-D has no observed initial conditional average. v4 explicitly supplies a counterfactual law: average the corresponding fine-grained pair fertility/transmission over Jewish cross-pair exposures x_i*m_i (falling back to initial Jewish shares, then input mixture when exposures are zero). D/D, D/N, and N/N use their actual fine-grained laws. If an absent J-J block ever needs a fallback, it uses the product of these representative Jewish weights. These initially absent cells cannot change the exact first-step match; they do affect later behavior and are explicit conventions. In the ordinary root-counting case, the J-D law is the continuous D→0 limit and equals J-N when D/N fertility is equal.

The frozen control is not an alternative empirically fitted forecast. It isolates the danger of extrapolating initial averages.

## Common generation length and start date

`generationYears` and `referenceYear` only produce the label `referenceYear + g*generationYears`. Changing either leaves every state exactly unchanged. A run performs whole reproductive steps only. There are no fractional endpoint generations.

Typing a different starting year does **not** load a historical population, marriage regime, migration flow, or survival schedule. The separate “Load 2013 starting values” action restores that reference bundle. Dates appear on chart axes, the selected generation, the full results table, saved state links and exports. A different common generation interval does **not** give Haredim a shorter interval than other groups. Those would require substantive historical/age-structured extensions.

## Sensitivity explorer

A seeded Mulberry32 generator samples independent uniform intervals around the selected inputs, clipped to valid domains. At width 1:

| Parameter | Half-range |
|---|---|
| effective fertility | 20% of selected value |
| non-Jewish partner rates H/M/C/R/U | .01 / .035 / .15 / .13 / .10 |
| own-group identity retention | .08 |
| mixed-parent Jewish retention | .15 |
| D/N clustering | .15 |
| arrival share of next cohort | .05 |
| Jewish share of arrivals | .01 |
| initial roots-plus-descendants share | .02; never below initial Jewish identity |

D/N fertility use the same multiplicative change, preserving their selected ratio. Leaver destinations are rescaled as retention changes. The initial Jewish share/mix, arrival mix/ancestry-only share, subgroup reservation, mixed fertility multiplier, convergence, and conditional destinations otherwise stay fixed.

Width multiplies these ranges; zero returns the selected parameters exactly. Quantiles use sorted values with linear interpolation. The bands are the 5th and 95th percentiles of this **chosen input ensemble**. They are not sampling-error confidence intervals, a Bayesian posterior, or estimated probabilities of future outcomes. At the root-only default the initial-ancestry interval is clipped on its lower side, so sampled runs generally start with more connection than the selected scenario; the band need not center on that line.

## Presentation and optional sampling API

The page opens at generation zero. Play, next and keyboard scrubbing advance the selected whole generation and update its year, exact shares and composition marker. The frozen-average comparison is opt-in. A separate expandable random-pairing example retains the animated ancestry area and its numerical text equivalent; reduced-motion settings disable its transitions.

The parent/child sample animation and filters were removed at Sam's request because they obscured the main experiment. The engine's tested `sampleBirths` API remains available to source users: unconditional event weights are `(1-u)*P_ij*F_ij*T_ij,k/B` for births and `u*v_k` for arrivals. These are independent illustrative draws, not persistent people or a family tree.

## Major omitted mechanisms

No empirical historical calibration; no ages, mortality, sex asymmetries, subgroup generation times, fertility schedules, or absolute population counts; no separate geography or migration by origin; no independent conversion/reaffiliation process outside mixed families; no time-varying behavior except optional Orthodox fertility convergence; no endogenous feedback between community size and fertility/partner choices beyond finite partner availability; no persistent stochastic pedigrees or DNA inheritance.

These omissions do not invalidate the mathematical compatibility demonstration. They do prevent promoting the output to a national ancestry estimate or demographic forecast.
