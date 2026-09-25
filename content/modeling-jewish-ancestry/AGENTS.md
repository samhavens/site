# instructions for the integrating agent

Read `METHODS.md` and `MODEL-AUDIT.md` before changing the draft. This is a completed prototype to integrate and improve, not an invitation to replace the engine with an unrelated model.

## editorial direction

This is the full-prose revision requested after Sam rejected the first draft. Use informal, direct explanation, with actual assumptions and results. Avoid aphorisms, sentimental ancestry language, dramatic reveals, grand concluding statements, and forced slang. Apply this to the whole essay and interface, not only the introduction. Do not restore the older wording or infer that short sentences alone match the author. Keep necessary technical distinctions, source notes, and definitions.

The current title is `modeling jewish ancestry`. `index.md` is canonical: run `npm run build` from the site root after prose edits. Numerical behavior is unchanged in this editorial revision.

## implementation contracts

Preserve these contracts:

1. Distinguish Jewish identity, roots-plus-genealogical-descent, detectable DNA, and halakhic status. Only the first two are simulated. Secular Jews can be Jewish-identifying. Haredi and other Orthodox groups partition Orthodoxy.
2. The 8% initial ancestry setting is an assumption, not an empirical estimate. Default root-counting starts with no ancestry-only population; that is a limited counting horizon, not a claim that old ancestry is absent.
3. All numerical outputs describe successive whole cohorts. Never label them the share of all Americans alive in a future year. A common generation interval only changes the clock labels in this model.
4. The ordered pairing matrix is symmetric and has both marginals equal to the input population. Offspring identity rows sum to one. A rooted parent's child never enters the no-connection group.
5. The frozen-average control matches the subgroup model at the first reproductive step. Do not replace it with an arbitrary competing scenario.
6. Animation samples must use the engine's birth-weighted distribution. A filtered sample must state its conditioning and its mass. Do not imply the 12 displayed families are an unconditioned population sample or a persistent genealogy.
7. Sensitivity bands are quantiles over stated input distributions, not forecast confidence intervals. Export the model version and assumptions with numerical results.
8. Keep a no-JavaScript reading path, visible input labels, text alternatives for animation, reduced-motion support, and a locally scrollable subgroup table on small screens.
9. Run `npm test` after model changes and `npm run build` after source changes. Regenerate parity fixtures only as a separately explained reference-model change, never just to make a failing test pass.
10. Do not publish, deploy, change the live blog, or assert measured demographic validity without Sam's review.

Use normal code casing. The essay and interface prose are intentionally mostly lowercase. No framework, analytics, CDN, or backend is needed for the delivered version. The current destination is samuelhavens.com/blog; follow the site root PRODUCT.md and DESIGN.md.
