#!/usr/bin/env python3
"""Exploratory Jewish genealogical-ancestry model. Python 3.10+ and NumPy.

Run:
    python jewish_ancestry_model.py
    python jewish_ancestry_model.py --draws 100000 --seed 20260923

This is a parameter-sensitivity exercise, NOT a survey estimate, posterior,
confidence interval, or fitted individual-level demographic reconstruction.

Scope of recent-ancestry calculation:
    Descent from a stylized early/mid-20th-century U.S. Jewish population,
    plus a small initial non-identifying descendant group and subsequent
    Jewish immigration. Older ancestry carried by non-Jewish immigrants is
    omitted. J identity is used as an ancestry proxy: adult conversions and
    adoption are not separately modeled.

States:
    J: identifies as Jewish (and is assigned the ancestry flag)
    D: does not identify as Jewish, but has the ancestry flag
    N: neither, within the modeled horizon

Children inherit the genealogical flag whenever either parent has it.
Identity retention is modeled separately. Six unordered pair types conserve
parental population shares. Every person is assumed to participate in the
reproductive pool; fertility multipliers absorb some differences in outcomes.
The model does not reconstruct actual family trees or variable parental ages.

Observed anchors (definitions and limitations matter):
  Historical population:
    Sidney Goldstein, American Jewry, 1970: A Demographic Profile,
    American Jewish Year Book 1971, Table 1, printed p. 11.
    https://www.jewishdatabank.org/content/upload/bjdb/304/NJPS1971-AJYB_Article.pdf
    1900: 1.4%; 1927: 3.6%; 1937: 3.7%.
    Same source, printed p. 27: 1957 survey found 3.8% of married
    Jewish individuals had non-Jewish spouses. It warns of undercounting
    when partners' previous religions are unavailable.
  Pew Jewish Americans in 2020:
    https://www.pewresearch.org/religion/2021/05/11/the-size-of-the-u-s-jewish-population/
    2.4% of U.S. adults classified Jewish; another 1.1% have a Jewish
    parent or upbringing but are not classified Jewish.
    This is an identity/parentage/upbringing proxy, not strict genealogy.
    https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/
    Intermarriage among surveyed Jewish individuals: 18% for intact
    marriages begun before 1980; about 40% for 1980-1999; 61% for
    2010-2020. These are not unbiased historic reproductive-pair rates.
    https://www.pewresearch.org/religion/2021/05/11/jewish-demographics/
    Ages 40-59: mean children 1.9 among Jews, 2.3 general population.

All parameter ranges, migration fractions, identity-retention assumptions,
clustering coefficients, cohort weights and screening tolerances below are
analyst assumptions, informed by the anchors but not directly estimated from
them. Uniform parameter draws are not empirical probability distributions.
"""
from __future__ import annotations
import argparse
import numpy as np


def generation(j, d, m, retain_jj, retain_mixed, fertility_jj,
               fertility_mixed, fertility_d, migration, immigrant_j,
               clustering):
    """One generation of population masses; supports scalars or NumPy arrays.

    m is the fraction of Jewish *individuals* with non-Jewish partners.
    It is not the fraction of Jewish-involved couples that are mixed.

    Among residual non-Jewish pairs, clustering is a mixture weight:
      0 = random D/N pairing;
      1 = all D pair with D and all N with N.
    This is a crude proxy for geographic/social clustering, not a measured
    tendency to choose partners based on knowledge of ancestry.

    migration replaces a fraction of the newborn/cohort composition with
    immigrants; immigrant_j is the Jewish fraction of this replacement.
    Other immigrants enter N. This is a coarse generational adjustment,
    NOT an annual immigration rate or a census foreign-born share.

    fertility_d applies to both D-D and D-N pairs. N-N fertility is 1.
    """
    n = 1 - j - d
    jj = j * (1 - m)
    jd = 2 * j * m * d / (1 - j)
    jn = 2 * j * m * n / (1 - j)
    h = 1 - j - j * m
    z = d / (1 - j)
    dd = h * (clustering * z + (1 - clustering) * z * z)
    dn = h * (1 - clustering) * 2 * z * (1 - z)
    nn = h * (clustering * (1 - z)
              + (1 - clustering) * (1 - z) ** 2)
    norm = (jj * fertility_jj + (jd + jn) * fertility_mixed
            + (dd + dn) * fertility_d + nn)
    ancestry = 1 - nn / norm
    jewish = (jj * fertility_jj * retain_jj
              + (jd + jn) * fertility_mixed * retain_mixed) / norm
    parent_proxy = (jj * fertility_jj
                    + (jd + jn) * fertility_mixed) / norm

    return (
        (1 - migration) * jewish + migration * immigrant_j,
        (1 - migration) * (ancestry - jewish),
        (1 - migration) * parent_proxy + migration * immigrant_j,
    )


def recent_scenarios(draws: int, seed: int):
    """Draw assumptions and screen on loose modern adult-population anchors."""
    rng = np.random.default_rng(seed)

    def by_stage(ranges):
        return np.column_stack([rng.uniform(lo, hi, draws)
                                for lo, hi in ranges])

    def constant_by_stage(lo, hi):
        return np.repeat(rng.uniform(lo, hi, draws)[:, None], 4, axis=1)

    # Initial parents around the early-20th-century population peak.
    j = rng.uniform(.032, .037, draws)
    d = rng.uniform(0, .004, draws)

    # Four reproductive stages, approximately a generation apart.
    # These are deliberately broad period approximations, not annual data.
    m = by_stage(((.015, .065), (.07, .20), (.35, .50), (.55, .68)))
    retain_jj = constant_by_stage(.94, .99)
    retain_mixed = by_stage(((.10, .35), (.20, .45),
                             (.35, .60), (.45, .70)))
    fertility_jj = constant_by_stage(.85, 1.05)
    fertility_mixed = constant_by_stage(.80, 1.05)
    fertility_d = constant_by_stage(.85, 1.05)
    migration = by_stage(((0, .04), (0, .06), (.03, .12), (.06, .18)))
    immigrant_j = by_stage(((.01, .05),) * 4)
    clustering = constant_by_stage(0, .30)

    cohorts = []
    for k in range(4):
        j, d, parent_proxy = generation(
            j, d, m[:, k], retain_jj[:, k], retain_mixed[:, k],
            fertility_jj[:, k], fertility_mixed[:, k], fertility_d[:, k],
            migration[:, k], immigrant_j[:, k], clustering[:, k],
        )
        cohorts.append(np.column_stack((j, d, j + d, parent_proxy)))
    cohorts = np.stack(cohorts, axis=1)

    # Stylized surviving birth-cohort weights; not a census age reconstruction.
    # Four cohorts span roughly the oldest to youngest living generations.
    all_age_weights = np.array([.08, .27, .33, .32])
    adult_weights = np.array([.105, .357, .436, .102])
    all_ages = (cohorts * all_age_weights[None, :, None]).sum(axis=1)
    adults = (cohorts * adult_weights[None, :, None]).sum(axis=1)

    # Broad consistency filters, not a statistical likelihood or validation.
    keep = ((adults[:, 0] >= .021) & (adults[:, 0] <= .027)
            & (adults[:, 3] >= .031) & (adults[:, 3] <= .040))
    return cohorts, all_ages, adults, keep


def long_run(m: float, clustering: float, generations: int = 20) -> float:
    """Illustration in a CLOSED population; not a U.S./European estimate.

    Initial J=1%, D=0. Equal fertility, no migration.
    Two-Jewish-parent children all retain identity and mixed-parent children
    retain it at 50%, keeping J exactly 1% through time. Descendants outside
    Jewish identity continue to transmit the ancestry flag.
    """
    j, d = .01, 0.
    for _ in range(generations):
        j, d, _ = generation(j, d, m, 1., .5, 1., 1., 1.,
                              0., 0., clustering)
    return float(j + d)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draws", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=20260923)
    args = parser.parse_args()
    if args.draws < 1:
        parser.error("--draws must be positive")

    cohorts, all_ages, adults, keep = recent_scenarios(args.draws, args.seed)
    print(f"Parameter draws: {args.draws:,}; retained: {keep.sum():,}")
    if not keep.any():
        raise SystemExit("No scenarios passed the loose anchor filters.")
    print("Percentiles below describe selected assumptions, NOT uncertainty"
          " probabilities about the real population.")
    for label, values in (
        ("All-age recent ancestry", all_ages[keep, 2]),
        ("Youngest cohort recent ancestry", cohorts[keep, -1, 2]),
        ("All-age Jewish identity", all_ages[keep, 0]),
        ("Adult parent/identity proxy", adults[keep, 3]),
    ):
        q = np.percentile(100 * values, [5, 50, 95])
        print(f"{label}: p5={q[0]:.3f}%, median={q[1]:.3f}%, "
              f"p95={q[2]:.3f}%")

    print("\nLong-run illustration: ancestry after 20 generations; J stays 1%.")
    print("Jewish outmarriage | clustering .50 | clustering .25")
    for m in (.001, .01, .05):
        print(f"{100*m:17.1f}% | {100*long_run(m,.50):13.2f}% |"
              f" {100*long_run(m,.25):13.2f}%")
    print("\nDo not interpret the long-run illustrations as measured historical"
          " U.S. or European ancestry estimates.")


if __name__ == "__main__":
    main()
