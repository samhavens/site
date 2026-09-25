# modeling jewish ancestry

I was wondering how many americans have at least one jewish ancestor. the percentage who identify as jewish doesn't answer that, since ancestry keeps passing down after a family stops identifying as jewish.

I tried a simple model, but using one fertility rate and one intermarriage rate for all jews seemed questionable. those rates differ between subgroups, which means the population averages should change as the proportions of those groups change. so I added subgroups. below you can change the assumptions and see how much they matter.

## a simple model

start with a population where 2% have the ancestry we're tracking. assume random pairing, equal expected fertility, and no immigration.

a child has that ancestry if either parent does. if the current share is `a`, the next generation's share is:

<div class="equation">a′ = 1 − (1 − a)²</div>

starting at 2%, this gives roughly 4%, 8%, 15%, 28%, and 48% over the next five generations. after six generations it's about 73%.

<div id="toy-widget" class="interactive"><p>the random-pairing example requires javascript. the equation above gives the same results.</p></div>

the mean fractional contribution from the starting group stays at 2% in this model. more people have some ancestry from that group, but the average contribution across the population hasn't increased. the fraction of people with any ancestry and the average amount of ancestry are different quantities.

random pairing is a poor assumption for the actual population. in pew's 2020 survey, 2% of married orthodox respondents had a non-jewish spouse, compared with 25% of conservative respondents, 42% of reform respondents, and 68% of respondents with no branch affiliation.[^marriage] those differences matter for how quickly ancestry spreads.

## adding subgroups

I split the jewish-identifying population into haredi, modern/other non-haredi orthodox, conservative, reform, and other/unaffiliated jewish. the two orthodox groups are separate categories; haredim aren't counted twice.

each group has its own fertility, intermarriage, and identity-transmission rates. children can end up in a different jewish subgroup or stop identifying as jewish. leaving orthodoxy doesn't necessarily mean leaving jewish identity, and children of intermarriages can identify as jewish.

there are also two non-jewish-identifying groups: descendants of jews and people with no ancestry counted by the model. secular people who identify as jewish belong in the jewish groups. pew likewise includes both jews by religion and jews of no religion in its jewish population.[^size]

identity is a probabilistic transition. ancestry passes down from either parent. once someone leaves jewish identity, their descendants stay in the ancestry count, even across further generations of non-jewish marriages.

the charts use “roots + descendants” for that broader count. it includes the starting jews themselves and jewish arrivals, as well as their descendants. a convert can be a starting root without already having a jewish ancestor. “no modeled connection” means no connection within this counting horizon; it doesn't establish that someone's entire family tree lacks jewish ancestors. the model doesn't determine halakhic status or measure dna.

## why the averages change

fertility differs too. pew's 2013 survey found an average of 4.1 children among orthodox respondents aged 40–59, compared with 1.8 among conservative respondents and 1.7 among reform respondents.[^fertility]

suppose the higher-fertility groups become a larger share of the next generation. the population's average fertility then rises. if those same groups have lower intermarriage rates, average intermarriage falls. both can happen while every subgroup's rates stay fixed.

to see how much this matters, I compare the subgroup model with a three-group version that combines all jewish-identifying people. its aggregate rates are calculated from the starting population and then held fixed. the two versions produce exactly the same first generation. after that, the subgroup model's averages can change as its composition changes.

the solid lines show the subgroup model; the dashed lines show the fixed-average comparison.

## try it

the default starts with a hypothetical cohort that's 2.4% jewish-identifying, using pew's 2020 adult estimate as a starting reference.[^size] it counts descendants from that point forward, starting with zero descendants outside jewish identity. that's a choice of where to start counting.

there's also an 8% starting-ancestry preset. I used that number in an earlier version, but it hasn't been established as an estimate of american ancestry. here it's an input to vary.

<div id="sim-widget" class="interactive wide"><p>enable javascript to run the subgroup model. the default results are also shown in the table below.</p></div>

the table below always shows the original default assumptions; changing the controls above doesn't change it:

<!-- DEFAULT-TABLE -->

the haredi share of jews goes from 6% to about 61% over four generations. aggregate intermarriage falls from about 61% to 24%, although the subgroup intermarriage rates haven't changed. the jewish-identifying share grows from 2.4% to 5.4%; roots plus descendants grow from 2.4% to 12.4%.

these are successive descendant cohorts, not the population alive in a particular future year. changing “years per generation” changes the illustrative dates; it doesn't change the number of reproductive steps. the model has no age structure.

## changing the assumptions

switch to **“start with 8% roots + descendants.”** the broader share at generation four rises from 12.4% to 31.9%. jewish identity stays at about 5.4%.

that's because the two non-jewish groups have equal fertility and are treated the same when paired with a jewish parent. moving people between those groups changes the amount of pre-existing ancestry without changing the mechanism for jewish identity.

the **“no new intermarriage; start at 8%”** preset sets every jewish subgroup's intermarriage rate to zero. existing descendants outside jewish identity still have children, and their ancestry continues spreading through their own marriages. stopping new intermarriage among jews doesn't stop that process.

**“shrinking orthodox fertility gap”** lets the fertility advantages of the two orthodox groups halve over three reproductive steps. this reduces their subsequent growth. holding a fertility difference constant for several generations is a substantial assumption, so it's worth comparing.

you can also change how many children stay in their parents' group and where the others end up. pew's switching tables show substantial movement between jewish denominations, but they describe respondents' upbringing and current affiliation. they don't directly measure the future child-to-adult transitions the model needs.[^switching]

## the animation

each example shows parents and a child sampled from the same birth-weighted distribution used to calculate the charts. the fill shows identity; the ring marks a jewish root or descendant. a child can have a different identity from their parents and still inherit the ancestry flag.

the filters select mixed-parent families, non-jewish families with ancestry, or two haredi parents. the label reports what fraction of the next cohort the selected filter represents. the twelve displayed examples are conditional samples, not a representative population or a persistent family tree. arrivals are shown separately because their parents aren't modeled.

## limits

many of the inputs remain assumptions: fertility within orthodoxy, future identity transitions, clustering among descendants, and arrivals. the survey figures above are useful reference points, but don't directly supply those parameters. for example, the marriage figures describe intact marriages at survey time, and the fertility figures describe respondents in a particular age range.[^marriage][^fertility]

the arrivals control specifies a share of each new cohort. it isn't an annual immigration rate or the fraction of the current population born abroad. arrival composition, including older ancestry among non-jewish arrivals, is specified separately.

the sensitivity button varies inputs over stated ranges. its middle 90% contains 90% of the sampled scenarios, not a 90% probability interval for the future. it isn't fitting a model to observations. increasing the draw count tests the chosen ranges more thoroughly without improving their empirical basis.

an actual calendar-year forecast would need ages at childbearing, mortality, and the current age distribution within each group. pew's 2020 overview reports that 17% of jewish adults aged 18–29 were orthodox, compared with 9% of jewish adults overall.[^overview] starting every group from an all-adult average misses that difference.

estimating today's ancestry would also require a historical model, including ancestry that non-jewish immigrants already had before arriving. this model doesn't reconstruct that. it also doesn't estimate detectable dna: genealogical ancestors can leave no surviving genetic material. ralph and coop discuss that distinction and the relevance of geography and population structure, without providing a jewish-specific american ancestry estimate.[^genealogy]

## what this shows

under the default assumptions, jewish identity grows, orthodox groups become a larger share of it, and descendants outside jewish identity grow too. those results are compatible because they describe different populations. higher fertility and lower intermarriage within some jewish groups don't stop ancestry from spreading among people whose families stopped identifying as jewish earlier.

the sizes depend on the inputs. I still don't have a well-supported estimate of how many americans have a jewish ancestor. the subgroup comparison does show why keeping aggregate fertility and intermarriage fixed can produce different results from keeping each subgroup's rates fixed.

<details class="methods"><summary>update equations and implementation details</summary>

let `xᵢ` be a group's share in the parent cohort. the model constructs a symmetric ordered-pair matrix `Pᵢⱼ` whose row and column sums equal `x`. `Fᵢⱼ` gives expected offspring per statistical pairing. `Tᵢⱼₖ` gives the probability that a child of that pairing belongs to group `k` in the next adult cohort. each transition row sums to one.

<div class="equation">bₖ = Σᵢⱼ Pᵢⱼ Fᵢⱼ Tᵢⱼₖ<br>x′ₖ = (1 − u) bₖ / Σₗ bₗ + u vₖ</div>

`u` is the arrival share of the next cohort; `v` is the arrivals' group composition. counting both parent orders introduces the same factor of two in every birth term, which cancels when normalizing.

same-group fertility inputs average childlessness into statistical pairing units. between-group fertility uses the geometric mean of the two groups' inputs, with a multiplier for jewish/non-jewish pairings. these are modeling conventions rather than directly measured pair-specific fertility rates.

within the jewish partner pool, each group reserves a fraction of its available members for same-subgroup pairing. the rest pair randomly within that pool. the remaining non-jewish population uses a mixture of random and same-ancestry pairing. the clustering setting approximates social and geographic structure; it doesn't assume people know their distant ancestry when choosing partners.

partner demand is capped by supply. the full transition matrix is editable through the json settings. changing a same-group retention slider preserves the relative destinations among people who leave that group.

children retain their parents' ancestry flag. the ancestry share of the population can nevertheless fall if other groups have more children or arrivals increase the denominator.

</details>

## sources and code

this exploratory model was developed with an ai assistant. the javascript is checked against the python subgroup model, conservation checks, and simple mathematical cases. those tests check implementation consistency. demographic validation would require additional work. the source bundle includes the code, tests, and assumptions.

<div class="source-links"><a href="source.zip" download>download source + tests</a><a href="standalone.html" download>offline interactive essay</a><a href="post.md">markdown</a><a href="model.js">javascript model</a><a href="METHODS.md">methods</a></div>

[^size]: pew research center, [the size of the u.s. jewish population](https://www.pewresearch.org/religion/2021/05/11/the-size-of-the-u-s-jewish-population/), may 11, 2021; survey conducted in 2019–2020. the 2.4% figure concerns adults under pew's definition.

[^marriage]: pew research center, [marriage, families and children](https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/), may 11, 2021. the branch-specific intermarriage figures concern individuals in intact marriages at survey time.

[^fertility]: pew research center, [intermarriage and other demographics](https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/), october 1, 2013, “fertility.” the 4.1, 1.8, and 1.7 figures use respondents aged 40–59. pew's [2020 demographic chapter](https://www.pewresearch.org/religion/2021/05/11/jewish-demographics/) also reports fertility measures with different age definitions.

[^switching]: jacob ausubel, gregory a. smith, and alan cooperman, [denominational switching among u.s. jews](https://www.pewresearch.org/short-reads/2021/06/22/denominational-switching-among-u-s-jews-reform-judaism-has-gained-conservative-judaism-has-lost/), june 22, 2021. retrospective self-reported upbringing and current affiliation.

[^overview]: pew research center, [jewish americans in 2020](https://www.pewresearch.org/religion/2021/05/11/jewish-americans-in-2020/), may 11, 2021.

[^genealogy]: peter ralph and graham coop, [the geography of recent genetic ancestry across europe](https://doi.org/10.1371/journal.pbio.1001555), *plos biology*, 2013.
