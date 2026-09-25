# modeling jewish ancestry

start in 2013. Pew estimated that 2.2% of american adults identified as jewish, including secular and cultural jews.[^population] take a population with that starting share and follow its descendants, one generation at a time.

I wanted to know how many americans have at least one jewish ancestor. a child inherits ancestry from either parent, even if they grow up with a different identity. meanwhile, differences in fertility and marriage patterns change the composition of the jewish population itself. this model follows both processes.

## start in the past

the starting denomination mix and available fertility references come from the 2013 survey. some inputs remain assumptions, identified under the setup.[^denominations][^fertility][^orthodox] edit the starting values, then follow the timeline. this is a conditional experiment, not yet a historical estimate of today's ancestry.

<div id="sim-widget" class="interactive wide"><p>enable javascript to change the model. the 2013 reference results remain available below.</p></div>

the broader count, “jewish roots + descendants,” includes the starting jewish population, jewish arrivals, and their descendants. a convert can be a starting root without already having a jewish ancestor. secular people who identify as jewish belong in the jewish groups. this doesn't measure dna or determine halakhic status.

<details class="methods"><summary>2013 reference results, without javascript</summary>

this table always uses the reference inputs. the live results above respond to your edits.

<!-- DEFAULT-TABLE -->

</details>

## why separate the denominations?

fertility and intermarriage differ between groups. if a higher-fertility group becomes a larger share of the next generation, average fertility rises even when every group's own rate stays fixed. if that group also has lower intermarriage, average intermarriage falls.

the model separates haredi, other orthodox, conservative, reform, and other/unaffiliated jews. haredi and other orthodox partition orthodoxy. each group has its own fertility and pairing rules; children can move between groups. the two non-jewish groups distinguish descendants from people without a connection counted in this run.

turn on **compare with frozen starting averages** to see why the distinction matters. the dashed comparison combines all jews into one group and holds its initial average rates fixed. both versions produce the same first generation. after that, only the detailed version responds to changes in the denomination mix.

<!-- DEFAULT-SUMMARY -->

## what to change

**existing ancestry.** the default starts counting in 2013, with zero ancestry outside jewish identity. that omits earlier descent; it doesn't estimate it at zero. to assume an 8% total starting share, set ancestry outside identity to 5.8% alongside the 2.2% jewish share. an earlier draft used 8%, but that number was never established as an american ancestry estimate.

**fertility.** increase haredi fertility, or lower another group's, and watch its share of jewish identity change. the reference applies the published orthodox average to both orthodox groups because it doesn't supply separate completed-fertility rates. you can enter a different split directly.

**time.** the default interval is 27 years: 2013, 2040, 2067, and so on. 25 years gives 2013, 2038, 2063. the states at generation 1, 2, and 3 stay the same; this model has whole generations rather than overlapping ages. a custom start year also needs suitable starting inputs. the page doesn't silently invent them.

**identity and pairing.** open the additional rules to change intermarriage or the fraction of children staying in their parents' group. leaving orthodoxy need not mean leaving jewish identity. even if all new jewish intermarriage stopped, descendants already outside jewish identity would continue passing ancestry to their children.

<details class="methods" id="a-simple-model"><summary>the simplest case: random pairing</summary>

with equal fertility, random pairing and no arrivals, let `a` be the share with ancestry. the probability that neither parent has it is `(1 − a)²`, so:

<div class="equation">a′ = 1 − (1 − a)²</div>

starting at 2%, the ancestry share reaches about 48% after five generations. the average fractional contribution from the starting group remains 2%. having *any* ancestry and the average *amount* of ancestry are different quantities.

<div id="toy-widget" class="interactive"><p>the equation above provides the same calculation without javascript.</p></div>

this example shows the inheritance rule alone. it doesn't include the subgroup model's fertility differences, identity changes, pairing restrictions, or arrivals.

</details>

## limits

the historical reference is a starting point, not a fitted reconstruction. Pew's population and denomination estimates describe adults of all ages. its fertility references here describe respondents aged 40–59, and its marriage figures describe intact marriages. applying them to a reproductive cohort requires assumptions.[^population][^fertility]

older ancestry outside jewish identity is not measured by these inputs. neither are future identity transitions, the other-jewish fertility setting, clustering among descendants, or arrivals. the arrivals control adds a share of each new generation; it isn't an annual immigration rate. the full source notes distinguish observations, proxies, and assumptions.

the sensitivity controls vary those assumptions. the middle 90% of sampled outcomes contains 90% of the selected scenarios, not a 90% probability interval for the future. more samples don't make the chosen ranges better supported.

estimating all americans alive in a particular year would require age structure, mortality and historical migration, along with the initial ancestry we're missing. detectable dna is another question: a genealogical ancestor can leave no surviving genetic material.[^genealogy]

I still don't have a defensible estimate of how many americans have a jewish ancestor. this model does make it easier to see which assumptions drive the answer, and why fixed population averages can miss what happens as groups grow at different rates.

<details class="methods"><summary>update equations and implementation details</summary>

let `xᵢ` be a group's share in the parent generation. the model constructs a symmetric ordered-pair matrix `Pᵢⱼ` with both marginals equal to `x`. `Fᵢⱼ` gives expected offspring per statistical pairing; `Tᵢⱼₖ` gives the probability of adult offspring identity `k`. each transition row sums to one.

<div class="equation">bₖ = Σᵢⱼ Pᵢⱼ Fᵢⱼ Tᵢⱼₖ<br>x′ₖ = (1 − u) bₖ / Σₗ bₗ + u vₖ</div>

`u` is the arrival share; `v` is arrival composition. counting both parent orders introduces a factor that cancels when normalizing. cross-group fertility uses a geometric mean, with an additional multiplier for jewish/non-jewish pairs. partner demand is capped by supply.

subgroup reservation and ancestry clustering approximate structured pairing. they don't assume people know their remote ancestry. identity-transition rows are editable in json; changing retention preserves the relative destinations among people who leave a group. children keep inherited ancestry, though its population share can fall under differential fertility or arrivals.

</details>

## sources and code

this exploratory model was developed with an ai assistant. its javascript is checked against a python reference, conservation rules and simple mathematical cases. those checks establish implementation consistency, not demographic validity.

<div class="source-links"><a href="source.zip" download>source + tests</a><a href="standalone.html" download>offline interactive essay</a><a href="post.md">markdown</a><a href="model.js">model</a><a href="METHODS.md">methods</a><a href="SOURCES.md">source notes</a></div>

[^population]: Pew Research Center, [population estimates](https://www.pewresearch.org/religion/2013/10/01/chapter-1-population-estimates/), october 1, 2013. the 2.2% estimate includes jews by religion and jews of no religion under Pew's definition; it is not a census of ancestry.

[^denominations]: Pew Research Center, [a portrait of jewish americans](https://www.pewresearch.org/religion/2013/10/01/jewish-american-beliefs-attitudes-culture-survey/), october 1, 2013. reported adult denomination shares are survey estimates, with sampling uncertainty. the remaining share is combined as other/unaffiliated here.

[^fertility]: Pew Research Center, [intermarriage and other demographics](https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/), october 1, 2013. fertility references are reported children for respondents aged 40–59; marriage percentages concern currently married respondents.

[^orthodox]: Pew Research Center, [a portrait of american orthodox jews](https://www.pewresearch.org/religion/2015/08/26/a-portrait-of-american-orthodox-jews/), august 26, 2015, reanalyzing the 2013 survey. 62% of the 10% orthodox share yields a derived 6.2% haredi share; the other orthodox category includes the rest. this arithmetic does not imply decimal-level measurement precision.

[^genealogy]: peter ralph and graham coop, [the geography of recent genetic ancestry across europe](https://doi.org/10.1371/journal.pbio.1001555), *plos biology*, 2013. not an estimate of jewish ancestry among americans.
