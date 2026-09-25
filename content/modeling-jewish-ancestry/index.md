# Modeling Jewish Ancestry

Someone told me they'd heard that 8% of Americans had some Jewish ancestry. They thought that had to be wrong, so I tried modeling it.

That is a different question from how many Americans identify as Jewish. A child can inherit ancestry from a Jewish parent without growing up Jewish. Their children can inherit it too. Over several generations, the population with some ancestry can become much larger than the population that identifies as Jewish.

I started about a century ago and worked forward. Then I varied the starting date, generation length, fertility and other assumptions, and discarded scenarios that couldn't satisfy the model's checks. The question was whether something like 8% could emerge from that process. It wasn't a number I put into the starting population.

## Start in the past, finish in the present

The first experiment ran approximately **1925–2025**, four generations of 25 years. The next version sampled starting dates from **1877–1927** and generation lengths from **24–30 years**. An earlier start loaded a smaller historical Jewish population; it didn't just move the dates on an otherwise identical calculation.[^historical]

The interactive below restores that second experiment. It ends in **2026** by default; choose 2025 to use the original endpoint. The final reference values are held fixed for the extra year, not treated as new observations. You can narrow the starting period, use 1925 alone, or change the generation length. Set a range's minimum and maximum equal to hold it fixed.

<div id="historical-widget" class="interactive wide"><p>Enable JavaScript to vary the historical scenarios and inspect the screen. The default results remain readable below.</p></div>

“Roots + descendants” counts the starting Jewish population, Jewish arrivals, and anyone descended from those roots. It includes people who still identify as Jewish. It doesn't measure the amount of someone's ancestry, detectable DNA, or halakhic status. A convert can enter as a Jewish root without having a Jewish ancestor already.[^genealogy]

<details class="methods"><summary>Default historical results, without JavaScript</summary>

These results use the published defaults. Changing the interactive does not change this reference table.

<!-- DEFAULT-TABLE -->

</details>

## Which scenarios survived?

There were two experiments, with different screens.

In the first, I ran **100,000 scenarios** and kept the **34,503** whose rough adult-weighted results put Jewish identity between **2.1–2.7%** and a Jewish-parent-or-identity proxy between **3.1–4.0%**. Those were chosen screening windows around modern benchmarks, not survey confidence intervals. Pew's 2020 estimates distinguish 2.4% of adults classified as Jewish from another 1.1% with a Jewish parent or upbringing; the model's proxy is only an approximation to those categories.[^population]

With assumed weights for four surviving cohorts, the retained scenarios had a median all-age ancestry share of **6.4%**, with a middle 90% range of **5.2–8.1%**. The weights were rough; this wasn't a full age-structured population model. The original script and exact reproduction are in the source archive.

The second experiment, now interactive above, asked each historical path to match a reference curve for the Jewish population share. At each step it solved for the Jewish share of arrivals needed to make that happen. It rejected the whole path if the required share was negative or above 60%. It **did not also apply the first experiment's adult-parent screen**. Nor did either experiment filter for an answer near 8%.

This screen is restrictive. With the default corrected run, only about one scenario in 22 survives. Most rejected runs leave too large a Jewish-identifying share to match the next reference point even when every arrival is non-Jewish. Matching the curve is built into the calculation; it is not independent evidence that the retained histories are true.

## A timing correction that matters

The original second script reported a median around **8.0%**, with a middle 90% range of **6.0–11.7%**, for its 2025 endpoint. But it contained a timing bug: a short final interval still received a whole generation of reproduction. A run ending with seven years left got another full generation of ancestry transmission.

The version above advances only the elapsed fraction of that final generation. It interpolates between the current population and the next cohort, and prorates arrivals by the same fraction. This is an explicit approximation; it does not supply the missing age structure.

<!-- DEFAULT-SUMMARY -->

So the original suspicion doesn't settle the question. These assumptions can produce ancestry shares around 8%, but the output moves with the timing rule and the screening choices. I wouldn't cite the model as evidence that exactly 8% of Americans have Jewish ancestry.

## What the model leaves uncertain

The historical Jewish population figures use different definitions and denominators across time. The modern anchors describe adults, while some earlier figures describe the whole population. Joining them into one curve is a modeling decision.[^historical][^population]

Intermarriage also changes through time, using broad ranges around historical references. Pew's marriage figures describe marriages still intact at the survey date, not every reproductive pairing that occurred in a past decade. Mixed-parent identity retention, relative fertility and clustering among descendants are sampled assumptions.[^marriage]

The arrivals rule uses a coarse foreign-born-population proxy. A stock of foreign-born residents is not the flow of new immigrants during a generation; the original proxy points are approximate and don't all match Census series exactly. Non-Jewish arrivals are assigned no additional Jewish ancestry. That leaves any such ancestry uncounted.[^immigration]

Finally, ancestry already outside Jewish identity at the starting date is unknown. The default sets it to zero to make the counting horizon explicit. You can add an assumed starting share. The later model's endpoint is a simplified population state, not a count weighted across all ages alive today. The middle 90% range describes the assumptions that survived the screen, not a 90% confidence interval for the American population.

## Where denominations enter

After the historical experiments, I asked what different fertility and marriage patterns within Jewish communities might do over time. That became a separate model, with Haredi, other Orthodox, Conservative, Reform, and other/unaffiliated Jewish groups. If a higher-fertility group grows as a share of the population, population-wide averages can change even when each group's own rates stay fixed.

That extension is below. Its linked starting values come from **2013**, when the survey supplies population, denomination and fertility references. It does **not** reconstruct historical denomination shares or feed into the historical screen above. Its date control labels successive cohorts; the historical model's generation-length control changes how many reproductive steps fit before the endpoint.

<details class="methods" id="denomination-extension"><summary>Explore the separate denomination and fertility experiment</summary>

Change the visible starting shares and fertility inputs, then follow successive generations. **Compare with frozen starting averages** shows how changing group composition differs from holding the initial average rates fixed. Both calculations match at the first generation. These are conditional cohort scenarios, not forecasts of everyone alive in a future year.

<div id="sim-widget" class="interactive wide"><p>Enable JavaScript to explore the optional subgroup model. Its equations and starting values are included in Methods.</p></div>

</details>

<details class="methods" id="a-simple-model"><summary>The inheritance rule on its own</summary>

With equal fertility, random pairing and no arrivals, let `a` be the share with ancestry. The probability that neither parent has it is `(1 − a)²`, so:

<div class="equation">a′ = 1 − (1 − a)²</div>

Starting at 2%, this toy calculation reaches about 48% with *some* ancestry after five generations. The average fractional contribution from the starting group remains 2%. Having any ancestry and the average amount of ancestry are different quantities.

<div id="toy-widget" class="interactive"><p>The equation above provides the same calculation without JavaScript.</p></div>

</details>

## Sources and code

This exploratory model was developed with an AI assistant. The recovered historical Python scripts are included unchanged, alongside the corrected browser model, reproduction results and tests. The two historical screens and the later subgroup model are documented separately in Methods. Numerical checks establish that the code follows the stated rules; they don't validate the demographic assumptions.

<div class="source-links"><a href="source.zip" download>Source + tests</a><a href="standalone.html" download>Offline interactive essay</a><a href="post.md">Markdown</a><a href="historical.js">Historical model</a><a href="METHODS.md">Methods</a><a href="SOURCES.md">Source notes</a></div>

[^historical]: Sidney Goldstein, [American Jewry, 1970: A Demographic Profile](https://www.jewishdatabank.org/content/upload/bjdb/304/NJPS1971-AJYB_Article.pdf), *American Jewish Year Book*, 1971, particularly the historical population estimates in Table 1. The model retains the original experiment's reference curve; see the source ledger for definition changes and assumed endpoints.

[^population]: Pew Research Center, [The Size of the U.S. Jewish Population](https://www.pewresearch.org/religion/2021/05/11/the-size-of-the-u-s-jewish-population/), May 11, 2021. These are survey estimates with sampling uncertainty. “Jewish background” is defined through parentage or upbringing, not all remote ancestry.

[^marriage]: Pew Research Center, [Marriage, Families and Children](https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/), May 11, 2021. The historical experiment uses these as references for assumed calendar-varying pairing and identity rules, not a directly observed sequence of reproductive cohorts.

[^immigration]: U.S. Census Bureau, [Historical Census Statistics on the Foreign-Born Population: 1850 to 2000](https://www.census.gov/library/working-papers/2006/demo/POP-twps0081.html), 2006. This documents the distinction between a resident stock and immigration flows. The model's retained proxy curve is listed explicitly in Methods.

[^genealogy]: Peter Ralph and Graham Coop, [The Geography of Recent Genetic Ancestry across Europe](https://doi.org/10.1371/journal.pbio.1001555), *PLOS Biology*, 2013. Not an estimate of Jewish ancestry among Americans.
