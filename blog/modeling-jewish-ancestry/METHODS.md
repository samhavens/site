# model v4: definitions, assumptions, and update equations

## scope

This is a deterministic expected-value model of **successive non-overlapping reproductive cohorts**. It illustrates inheritance and compositional effects. It does not estimate the present number of Americans with Jewish ancestry or forecast the population alive in a calendar year.

“Connection” in the code means membership in the starting Jewish community, Jewish membership among specified arrivals, or descent from those roots. A convert can be a root without having a Jewish ancestor. No genetic fractions, halakhic status, observed individual identities, or personal family records are inferred.

## state and defaults

The state is `x = [H,M,C,R,U,D,N]`, a nonnegative vector summing to one:

| index | state |
|---|---|
| H | haredi Jewish identity |
| M | modern/other non-haredi Orthodox Jewish identity |
| C | Conservative Jewish identity |
| R | Reform Jewish identity |
| U | other/unaffiliated Jewish identity, including secular identifying Jews |
| D | a modeled descendant who does not identify as Jewish |
| N | no modeled connection within this counting horizon |

`J = H+M+C+R+U`, `A = J+D = 1-N`. H and M partition Orthodoxy. These broad labels are a simplification of heterogeneous communities.

Default initial Jewish identity: `J0=0.024`; default initial connection: `A0=0.024`. Thus `D0=0`, and the default counts forward from a community rather than inventing a total historical-ancestry estimate. The previous `A0=0.08` assumption is available as a separate preset.

Default Jewish mixture is `[.06,.03,.17,.37,.37]`, an adult-survey-inspired illustration. The 6/3 Orthodox split, the residual other-Jewish category, and applying this mixture to a reproductive cohort are assumptions, not an estimated age-specific US population.

All values below are **model inputs**, not a table of empirically measured rates. See `SOURCES.md` for the separate observations that motivated some choices.

| group | effective same-group offspring | non-Jewish partner rate | own-group reservation in the Jewish partner pool | retained Jewish identity with one Jewish parent |
|---|---:|---:|---:|---:|
| H | 5.5 | .005 | .96 | .60 |
| M | 3.0 | .025 | .80 | .65 |
| C | 1.9 | .45 | .50 | .65 |
| R | 1.8 | .65 | .50 | .60 |
| U | 1.6 | .80 | .40 | .50 |
| D | 2.0 | not applicable | not applicable | not applicable |
| N | 2.0 | not applicable | not applicable | not applicable |

A fertility entry is offspring per **statistical pairing**, incorporating childlessness into its effective average. Every adult participates in a statistical unit; the model does not assert that everyone literally marries. Only relative fertility affects normalized composition. It does not maintain absolute population sizes or fertility-by-age schedules.

Other defaults: D/N clustering `.25`; Jewish/non-Jewish fertility multiplier `.90`; arrival fraction of each next cohort `.15`; Jewish share of arrivals `.024`; additional ancestry-only share of arrivals `0`. Jewish arrivals use a separately specified mixture, initially the same as the initial Jewish mixture. Editing initial composition does not silently change arrival composition.

## balanced pairing

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

## fertility

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

## identity transmission

Each pair has a probability vector `T_ij,k` over adult offspring identities. Default rows for two same-group Jewish parents are:

| parent group | H | M | C | R | U | D | N |
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

## cohort update and arrivals

Compute birth weights and the next normalized state:

```
b_k = sum_ij P_ij * F_ij * T_ij,k
B = sum_k b_k
x'_k = (1-u)*b_k/B + u*v_k
```

u is the **arrival share of the next cohort**, not the annual immigration rate and not the foreign-born share of the existing all-age population. v is the stipulated arrival composition. All cohorts use the same u/v unless the engine is deliberately extended.

An individual descendant never loses descent. Its population frequency can nevertheless decrease under differential fertility or denominator changes from arrivals. “Ancestry is an OR” does not imply unconditional monotonic growth of its population share.

## the matched frozen-average control

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

## common generation length and start date

`generationYears` and `referenceYear` only produce the label `referenceYear + g*generationYears`. Changing either leaves every state exactly unchanged. A run performs whole reproductive steps only. There are no fractional endpoint generations.

A different starting year does **not** load a historical population, marriage regime, migration flow, or survival schedule. A different common generation interval does **not** give Haredim a shorter interval than other groups. Those would require substantive historical/age-structured extensions.

## sensitivity explorer

A seeded Mulberry32 generator samples independent uniform intervals around the selected inputs, clipped to valid domains. At width 1:

| parameter | half-range |
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

## animation

Unconditional event weights are `(1-u)*P_ij*F_ij*T_ij,k/B` for births and `u*v_k` for arrivals. They sum to the same next-cohort distribution displayed in the charts. The separate animation seed samples 12 cases from these events.

Filters select mixed parents, non-Jewish descendant families, or two Haredi parents. The UI states the mass of that condition in the next cohort. Zero-probability conditions display no invented examples. Arrival events have no simulated parents. At the last selected cohort the animation uses the previous available parent cohort rather than inventing an extra output state.

These are independently sampled illustrative outcomes, not a stochastic population with persistent people, shared relatives, or pedigree collapse. Canvas motion reveals parent-to-child transmission; sample text supplies an equivalent reading path.

## major omitted mechanisms

No empirical historical calibration; no ages, mortality, sex asymmetries, subgroup generation times, fertility schedules, or absolute population counts; no separate geography or migration by origin; no independent conversion/reaffiliation process outside mixed families; no time-varying behavior except optional Orthodox fertility convergence; no endogenous feedback between community size and fertility/partner choices beyond finite partner availability; no persistent stochastic pedigrees or DNA inheritance.

These omissions do not invalidate the mathematical compatibility demonstration. They do prevent promoting the output to a national ancestry estimate or demographic forecast.
