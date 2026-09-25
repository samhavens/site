# Modeling Jewish Ancestry

Start in 2013. Pew estimated that 2.2% of American adults identified as Jewish, including secular and cultural Jews.[^population] Take a population with that starting share and follow its descendants, one generation at a time.

I wanted to know how many Americans have at least one Jewish ancestor. A child inherits ancestry from either parent, even if they grow up with a different identity. Meanwhile, differences in fertility and marriage patterns change the composition of the Jewish population itself. This model follows both processes.

## Start in the past

The starting denomination mix and available fertility references come from the 2013 survey. Some inputs remain assumptions, identified under the setup.[^denominations][^fertility][^orthodox] Edit the starting values, then follow the timeline. This is a conditional experiment, not yet a historical estimate of today's ancestry.

<div id="sim-widget" class="interactive wide"><p>Enable JavaScript to change the model. The 2013 reference results remain available below.</p></div>

The broader count, “Jewish roots + descendants,” includes the starting Jewish population, Jewish arrivals, and their descendants. A convert can be a starting root without already having a Jewish ancestor. Secular people who identify as Jewish belong in the Jewish groups. This doesn't measure DNA or determine halakhic status.

<details class="methods"><summary>2013 reference results, without JavaScript</summary>

This table always uses the reference inputs. The live results above respond to your edits.

| Year | Generation | Jewish identity | Roots + descendants | Haredi share of Jews | Intermarriage among Jews |
|---:|---:|---:|---:|---:|---:|
| 2013 | 0 | 2.2% | 2.2% | 6.2% | 48.1% |
| 2040 | 1 | 2.0% | 2.7% | 11.2% | 47.7% |
| 2067 | 2 | 2.0% | 3.6% | 18.0% | 43.7% |
| 2094 | 3 | 2.1% | 5.1% | 25.9% | 38.2% |
| 2121 | 4 | 2.4% | 7.3% | 34.0% | 32.5% |

</details>

## Why separate the denominations?

Fertility and intermarriage differ between groups. If a higher-fertility group becomes a larger share of the next generation, average fertility rises even when every group's own rate stays fixed. If that group also has lower intermarriage, average intermarriage falls.

The model separates Haredi, other Orthodox, Conservative, Reform, and other/unaffiliated Jews. Haredi and other Orthodox partition Orthodoxy. Each group has its own fertility and pairing rules; children can move between groups. The two non-Jewish groups distinguish descendants from people without a connection counted in this run.

Turn on **Compare with frozen starting averages** to see why the distinction matters. The dashed comparison combines all Jews into one group and holds its initial average rates fixed. Both versions produce the same first generation. After that, only the detailed version responds to changes in the denomination mix.

Under the 2013 reference assumptions, generation four (2121) is 2.4% Jewish-identifying and 7.3% roots + descendants. These are conditional model outputs for that generation.

## What to change

**Existing ancestry.** The default starts counting in 2013, with zero ancestry outside Jewish identity. That omits earlier descent; it doesn't estimate it at zero. To assume an 8% total starting share, set ancestry outside identity to 5.8% alongside the 2.2% Jewish share. An earlier draft used 8%, but that number was never established as an American ancestry estimate.

**Fertility.** Increase Haredi fertility, or lower another group's, and watch its share of Jewish identity change. The reference applies the published Orthodox average to both Orthodox groups because it doesn't supply separate completed-fertility rates. You can enter a different split directly.

**Time.** The default interval is 27 years: 2013, 2040, 2067, and so on. 25 years gives 2013, 2038, 2063. The states at generation 1, 2, and 3 stay the same; this model has whole generations rather than overlapping ages. A custom start year also needs suitable starting inputs. The page doesn't silently invent them.

**Identity and pairing.** Open the additional rules to change intermarriage or the fraction of children staying in their parents' group. Leaving Orthodoxy need not mean leaving Jewish identity. Even if all new Jewish intermarriage stopped, descendants already outside Jewish identity would continue passing ancestry to their children.

<details class="methods" id="a-simple-model"><summary>The simplest case: random pairing</summary>

With equal fertility, random pairing and no arrivals, let `a` be the share with ancestry. The probability that neither parent has it is `(1 − a)²`, so:

<div class="equation">a′ = 1 − (1 − a)²</div>

Starting at 2%, the ancestry share reaches about 48% after five generations. The average fractional contribution from the starting group remains 2%. Having *any* ancestry and the average *amount* of ancestry are different quantities.

<div id="toy-widget" class="interactive"><p>The equation above provides the same calculation without JavaScript.</p></div>

This example shows the inheritance rule alone. It doesn't include the subgroup model's fertility differences, identity changes, pairing restrictions, or arrivals.

</details>

## Limits

The historical reference is a starting point, not a fitted reconstruction. Pew's population and denomination estimates describe adults of all ages. Its fertility references here describe respondents aged 40–59, and its marriage figures describe intact marriages. Applying them to a reproductive cohort requires assumptions.[^population][^fertility]

Older ancestry outside Jewish identity is not measured by these inputs. Neither are future identity transitions, the other-Jewish fertility setting, clustering among descendants, or arrivals. The arrivals control adds a share of each new generation; it isn't an annual immigration rate. The full source notes distinguish observations, proxies, and assumptions.

The sensitivity controls vary those assumptions. The middle 90% of sampled outcomes contains 90% of the selected scenarios, not a 90% probability interval for the future. More samples don't make the chosen ranges better supported.

Estimating all Americans alive in a particular year would require age structure, mortality and historical migration, along with the initial ancestry we're missing. Detectable DNA is another question: a genealogical ancestor can leave no surviving genetic material.[^genealogy]

I still don't have a defensible estimate of how many Americans have a Jewish ancestor. This model does make it easier to see which assumptions drive the answer, and why fixed population averages can miss what happens as groups grow at different rates.

<details class="methods"><summary>Update equations and implementation details</summary>

Let `xᵢ` be a group's share in the parent generation. The model constructs a symmetric ordered-pair matrix `Pᵢⱼ` with both marginals equal to `x`. `Fᵢⱼ` gives expected offspring per statistical pairing; `Tᵢⱼₖ` gives the probability of adult offspring identity `k`. Each transition row sums to one.

<div class="equation">bₖ = Σᵢⱼ Pᵢⱼ Fᵢⱼ Tᵢⱼₖ<br>x′ₖ = (1 − u) bₖ / Σₗ bₗ + u vₖ</div>

`u` is the arrival share; `v` is arrival composition. Counting both parent orders introduces a factor that cancels when normalizing. Cross-group fertility uses a geometric mean, with an additional multiplier for Jewish/non-Jewish pairs. Partner demand is capped by supply.

Subgroup reservation and ancestry clustering approximate structured pairing. They don't assume people know their remote ancestry. Identity-transition rows are editable in JSON; changing retention preserves the relative destinations among people who leave a group. Children keep inherited ancestry, though its population share can fall under differential fertility or arrivals.

</details>

## Sources and code

This exploratory model was developed with an AI assistant. Its JavaScript is checked against a Python reference, conservation rules and simple mathematical cases. Those checks establish implementation consistency, not demographic validity.

<div class="source-links"><a href="source.zip" download>Source + tests</a><a href="standalone.html" download>Offline interactive essay</a><a href="post.md">Markdown</a><a href="model.js">Model</a><a href="METHODS.md">Methods</a><a href="SOURCES.md">Source notes</a></div>

[^population]: Pew Research Center, [Population Estimates](https://www.pewresearch.org/religion/2013/10/01/chapter-1-population-estimates/), October 1, 2013. The 2.2% estimate includes Jews by religion and Jews of no religion under Pew's definition; it is not a census of ancestry.

[^denominations]: Pew Research Center, [A Portrait of Jewish Americans](https://www.pewresearch.org/religion/2013/10/01/jewish-american-beliefs-attitudes-culture-survey/), October 1, 2013. Reported adult denomination shares are survey estimates, with sampling uncertainty. The remaining share is combined as other/unaffiliated here.

[^fertility]: Pew Research Center, [Intermarriage and Other Demographics](https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/), October 1, 2013. Fertility references are reported children for respondents aged 40–59; marriage percentages concern currently married respondents.

[^orthodox]: Pew Research Center, [A Portrait of American Orthodox Jews](https://www.pewresearch.org/religion/2015/08/26/a-portrait-of-american-orthodox-jews/), August 26, 2015, reanalyzing the 2013 survey. 62% of the 10% Orthodox share yields a derived 6.2% Haredi share; the other Orthodox category includes the rest. This arithmetic does not imply decimal-level measurement precision.

[^genealogy]: Peter Ralph and Graham Coop, [The Geography of Recent Genetic Ancestry across Europe](https://doi.org/10.1371/journal.pbio.1001555), *PLOS Biology*, 2013. Not an estimate of Jewish ancestry among Americans.
