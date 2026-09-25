#!/usr/bin/env python3
"""Jewish genealogical ancestry: subgroup sensitivity experiment, version 3.

Run: python subgroup_model.py --draws 20000 --seed 20260924 --out results.json
Requires Python 3.10+ and numpy. No network access, proprietary data, or other files.

THIS IS A COHORT SCENARIO MODEL, NOT A FITTED US POPULATION FORECAST.
Outputs describe successive non-overlapping adult descendant cohorts, NOT all ages
alive in a particular calendar year. Parameters are deliberately exposed below.
No partial generation receives a full reproductive step. A common generation
interval can label cohorts, but does not change the per-generation dynamics.
Age structure and subgroup-specific reproductive timing require a further model.

State order:
 H = Haredi Orthodox; M = Modern/other non-Haredi Orthodox;
 C = Conservative; R = Reform; U = other/unaffiliated Jewish identity;
 D = descendant of someone Jewish, no current Jewish identity;
 N = neither within the limited ancestry horizon of this model.
H and M partition Orthodoxy; H is not an extra group added to all Orthodox.
U includes secular Jews who identify as Jewish. D is NOT the same as U.
The ancestry statistic includes currently Jewish people themselves, matching v2.
Each child inherits the ancestry flag if either parent has it, independently of
which denomination, if any, the child will identify with as an adult.

Sources informing (but NOT determining) scenario choices:
 https://www.pewresearch.org/religion/2021/05/11/jewish-americans-in-2020/
 https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/
 https://www.pewresearch.org/religion/2021/05/11/jewish-demographics/
 https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/
 https://www.pewresearch.org/religion/2015/08/26/a-portrait-of-american-orthodox-jews/
 https://www.pewresearch.org/short-reads/2021/06/22/denominational-switching-among-u-s-jews-reform-judaism-has-gained-conservative-judaism-has-lost/

Observed anchors must not be confused with the model inputs:
 * Pew 2020 adult denominations: 9% Orthodox, 17% Conservative, 37% Reform,
   32% no branch and 4% other (rounding). H/M split is approximately 6%/3%.
 * Pew 2020 intermarriage among all intact marriages: Orthodox 2%, C 25%,
   R 42%, no branch 68%; among non-Orthodox marrying in 2010-2020: 72%.
   No joint recent-marriage x subgroup rate is assumed to be directly measured.
 * Pew 2013 completed offspring, ages 40-59: Orthodox 4.1, C 1.8, R 1.7.
 * Pew 2020 3.3 Orthodox / 1.4 non-Orthodox offspring averages pool all adult
   ages. They are NOT completed fertility or total fertility rates.
 * Denominational switching is real; leaving Orthodoxy often retains Jewish
   identity. Pew's all-age switching tables do NOT identify a future child
   transmission matrix or Haredi retention rate. Ours are scenario assumptions.

Structural limitations:
 * Statistical sex-symmetric reproductive pairing units absorb childlessness;
   they are not literal claims that everyone marries. Same-sex social parenting,
   adoption, differential marriage prevalence and biological parentage are not
   modeled separately. Survey marriage is an imperfect proxy for reproduction.
 * Within-group fertility inputs are effective offspring per reproductive unit,
   including childlessness implicitly. Between-group fertility is the geometric
   mean, with an additional mixed-Jewish/non-Jewish multiplier. Therefore these
   inputs are NOT observed group-wide fertility after averaging across partners.
 * Child adult identity is drawn from a transition tensor. No direct conversion
   from two N parents or late-life identity switching is included. Movement from
   non-Orthodox Jewish groups into Orthodoxy is included.
 * Migration is an explicit assumed SHARE OF THE NEW COHORT, not a historical
   foreign-born stock mislabeled as a migration flow. Non-Jewish arrivals have
   zero prior ancestry by construction. This omits old imported ancestry, but
   does not make the other modeling assumptions lower bounds.
 * Current ancestry 8% (or a 6-12% sensitivity prior) is an unvalidated starting
   assumption inherited from the conversation, not a finding of this model.
 * No historical subgroup reconstruction, survey likelihood, posterior,
   confidence interval, causal claim or halakhic-status calculation.

Control design:
Collapse the initial 7-state pairing, birth and transmission system into J,D,N.
The collapsed control has EXACTLY the same first-generation J,D,N output.
Then freeze its aggregate pairing, fertility and identity-transmission rates.
The full model lets composition evolve. Matched differences isolate the failure
of holding initially correct aggregate rates fixed; they are not comparisons
with a separately refitted v2, and not estimates of causal effects of religion.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Any
import numpy as np

NAMES = ['haredi', 'modern_other_orthodox', 'conservative', 'reform',
         'other_unaffiliated_jewish', 'ancestry_no_identity', 'neither']
# Rounded 2020 adult composition, illustrative starting COHORT only.
MIX = np.array([.06, .03, .17, .37, .37])
CENTRAL_F = np.array([5.5, 3.0, 1.9, 1.8, 1.6, 2.0, 2.0])
F_LOW = np.array([4.5, 2.5, 1.6, 1.5, 1.2, 1.8, 1.8])
F_HIGH = np.array([6.5, 3.5, 2.2, 2.1, 1.9, 2.2, 2.2])
CENTRAL_M = np.array([.005, .025, .45, .65, .80])
M_LOW = np.array([0., .005, .30, .50, .70])
M_HIGH = np.array([.015, .06, .60, .78, .90])
# Among Jewish in-marriage pool, group-specific shares reserved for own subgroup.
SELF_PAIR = np.array([.96, .80, .50, .50, .40])
# Offspring's adult state given same-Jewish-subgroup parents. All are assumptions.
T_CENTRAL = np.array([
 [.92, .04, .01, .01, .018, .002, 0.],
 [.05, .72, .08, .06, .070, .020, 0.],
 [.003, .017, .42, .30, .190, .070, 0.],
 [.002, .008, .04, .65, .180, .120, 0.],
 [.002, .008, .02, .06, .810, .100, 0.],
])
# Total probability of adult Jewish identity with one Jewish-identifying parent.
MIXED_R = np.array([.60, .65, .65, .60, .50])


def draw_parameters(n: int, seed: int, central: bool=False) -> dict[str, np.ndarray]:
    if n < 1:
        raise ValueError('draws must be positive')
    rng = np.random.default_rng(seed)
    if central:
        n = 1
        f = CENTRAL_F[None, :].copy()
        m = CENTRAL_M[None, :].copy()
        t = T_CENTRAL[None, :, :].copy()
        rm = MIXED_R[None, :].copy()
        mix = MIX[None, :].copy()
        cluster = np.array([.25])
        migration = np.array([.15])
        immigrant_j = np.array([.024])
        mixed_f = np.array([.90])
        ancestry = np.array([.08])
    else:
        f = rng.uniform(F_LOW, F_HIGH, size=(n, 7))
        f[:, 5] = f[:, 6]  # D and N share fertility to isolate ancestry diffusion.
        m = rng.uniform(M_LOW, M_HIGH, size=(n, 5))
        mix = np.tile(MIX, (n, 1))
        h = rng.uniform(.05, .08, n)
        mo = rng.uniform(.02, .04, n)
        mix[:, 0] = h
        mix[:, 1] = mo
        mix[:, 2:] = (1-h-mo)[:, None] * MIX[2:] / MIX[2:].sum()
        # Vary each own-group retention probability; preserve relative destinations
        # among leavers, rather than send all Orthodox leavers to non-Jewish D.
        stay = rng.uniform([.80, .60, .30, .55, .70],
                           [.97, .85, .55, .78, .90], size=(n, 5))
        t = np.tile(T_CENTRAL, (n, 1, 1))
        for i in range(5):
            other = T_CENTRAL[i].copy()
            other[i] = 0.
            other /= other.sum()
            t[:, i, :] = (1-stay[:, i])[:, None] * other
            t[:, i, i] = stay[:, i]
        rm = rng.uniform([.40, .45, .45, .40, .30],
                         [.80, .85, .80, .80, .70], size=(n, 5))
        cluster = rng.uniform(0., .50, n)
        migration = rng.uniform(.10, .20, n)
        immigrant_j = rng.uniform(.01, .035, n)
        mixed_f = rng.uniform(.80, 1.0, n)
        ancestry = rng.uniform(.06, .12, n)
    x = np.zeros((n, 7))
    x[:, :5] = .024 * mix
    x[:, 5] = ancestry - .024
    x[:, 6] = 1. - ancestry
    return dict(f=f, m=m, t=t, rm=rm, mix=mix, cluster=cluster,
                migration=migration, immigrant_j=immigrant_j,
                mixed_f=mixed_f, initial=x)


def pairing(x: np.ndarray, m: np.ndarray, cluster: np.ndarray,
            own: np.ndarray) -> np.ndarray:
    """Symmetric ordered-parent matrix P, with row and column marginals x.

    Shape x=(draws,k), where first k-2 states identify Jewish and last two D,N.
    The prescribed m is the fraction of individuals (not couples) marrying out.
    """
    draws, k = x.shape
    q = k-2
    p = np.zeros((draws, k, k))
    non = x[:, -2:].sum(axis=1)
    cross = x[:, :q] * m
    # If extremely long-run composition makes desired partners unavailable,
    # ration all requested out-marriages proportionately; never create people.
    cross *= np.minimum(1., non / np.maximum(cross.sum(axis=1), 1e-300))[:, None]
    cond_non = x[:, -2:] / np.maximum(non, 1e-300)[:, None]
    block = cross[:, :, None] * cond_non[:, None, :]
    p[:, :q, -2:] = block
    p[:, -2:, :q] = block.transpose(0, 2, 1)
    inside = x[:, :q] - cross
    reserved = inside * own
    rest = inside - reserved
    denom = rest.sum(axis=1)
    p[:, :q, :q] = rest[:, :, None] * rest[:, None, :] / np.maximum(denom, 1e-300)[:, None, None]
    ids = np.arange(q)
    p[:, ids, ids] += reserved
    left = x[:, -2:] - block.sum(axis=1)
    left = np.maximum(left, 0.)
    denom = left.sum(axis=1)
    p[:, -2:, -2:] = ((1-cluster)[:, None, None] * left[:, :, None] * left[:, None, :]
                      / np.maximum(denom, 1e-300)[:, None, None])
    p[:, -2, -2] += cluster * left[:, 0]
    p[:, -1, -1] += cluster * left[:, 1]
    return p


def fertility_matrix(f: np.ndarray, mixed_f: np.ndarray) -> np.ndarray:
    matrix = np.sqrt(f[:, :, None] * f[:, None, :])
    matrix[:, :5, 5:] *= mixed_f[:, None, None]
    matrix[:, 5:, :5] *= mixed_f[:, None, None]
    return matrix


def child_tensor(t: np.ndarray, rm: np.ndarray) -> np.ndarray:
    n = len(t)
    out = np.zeros((n, 7, 7, 7))
    for i in range(5):
        for j in range(5):
            out[:, i, j, :] = .5*(t[:, i, :] + t[:, j, :])
        # Conditional identity distribution for mixed-parent families: 65% the
        # parent's transmission distribution, 35% other/unaffiliated Jewish.
        dest = .65 * t[:, i, :5] / t[:, i, :5].sum(axis=1)[:, None]
        dest[:, 4] += .35
        for j in (5, 6):
            out[:, i, j, :5] = rm[:, i, None] * dest
            out[:, i, j, 5] = 1-rm[:, i]
            out[:, j, i, :] = out[:, i, j, :]
    out[:, 5, 5, 5] = 1.
    out[:, 5, 6, 5] = 1.
    out[:, 6, 5, 5] = 1.
    out[:, 6, 6, 6] = 1.
    return out


def arrival_vector(p: dict[str, np.ndarray]) -> np.ndarray:
    out = np.zeros_like(p['initial'])
    out[:, :5] = p['immigrant_j'][:, None] * p['mix']
    out[:, 6] = 1-p['immigrant_j']
    return out


def collapse_state(x: np.ndarray) -> np.ndarray:
    return np.stack([x[:, :5].sum(axis=1), x[:, 5], x[:, 6]], axis=1)


def collapse_birth_system(pairs: np.ndarray, f: np.ndarray, t: np.ndarray
                         ) -> tuple[np.ndarray, np.ndarray]:
    """Obtain pair-averaged F and offspring-identity T in aggregate J,D,N."""
    parts = [np.arange(5), np.array([5]), np.array([6])]
    n = len(pairs)
    ff = np.zeros((n, 3, 3))
    tt = np.zeros((n, 3, 3, 3))
    birth = pairs*f
    for a, ai in enumerate(parts):
        for b, bj in enumerate(parts):
            pp = pairs[:, ai[:, None], bj].sum(axis=(1, 2))
            bb = birth[:, ai[:, None], bj].sum(axis=(1, 2))
            ff[:, a, b] = bb / np.maximum(pp, 1e-300)
            for c, ck in enumerate(parts):
                mass = (birth[:, ai[:, None], bj, None]
                        * t[:, ai[:, None, None], bj[None, :, None], ck]).sum(axis=(1, 2, 3))
                tt[:, a, b, c] = mass / np.maximum(bb, 1e-300)
            # Degenerate zero-frequency pair: provide well-defined harmless fallback.
            absent = bb <= 1e-290
            if np.any(absent):
                ff[absent, a, b] = 2.
                tt[absent, a, b, :] = 0.
                tt[absent, a, b, 2 if a==2 and b==2 else 1] = 1.
    return ff, tt


def step(x: np.ndarray, m: np.ndarray, cluster: np.ndarray, own: np.ndarray,
         f: np.ndarray, t: np.ndarray, migration: np.ndarray,
         arrivals: np.ndarray) -> np.ndarray:
    pp = pairing(x, m, cluster, own)
    born = np.einsum('nij,nij,nijk->nk', pp, f, t, optimize=True)
    born /= born.sum(axis=1)[:, None]
    return (1-migration)[:, None]*born + migration[:, None]*arrivals


def run_pair(p: dict[str, np.ndarray], generations: int=4,
             fertility_convergence: bool=False) -> dict[str, np.ndarray]:
    """Full model versus a matched frozen-aggregate control.

    Convergence: from generation 2 onward, H/M fertility advantages above the
    background shrink, leaving HALF the initial excess at generation 4.
    Both systems still match exactly in generation 1. This intentionally tests
    failure of indefinitely holding the initial fertility gap fixed.
    """
    x = p['initial'].copy()
    z = collapse_state(x)
    full = [x.copy()]
    control = [z.copy()]
    f0 = fertility_matrix(p['f'], p['mixed_f'])
    tt = child_tensor(p['t'], p['rm'])
    pair0 = pairing(x, p['m'], p['cluster'], SELF_PAIR)
    fc, tc = collapse_birth_system(pair0, f0, tt)
    mc = ((x[:, :5]*p['m']).sum(axis=1)/x[:, :5].sum(axis=1))[:, None]
    arrivals = arrival_vector(p)
    ac = collapse_state(arrivals)
    for g in range(generations):
        f = p['f'].copy()
        if fertility_convergence:
            factor = 2.**(-g/3.)
            f[:, :2] = f[:, 6, None] + (f[:, :2]-f[:, 6, None])*factor
        x = step(x, p['m'], p['cluster'], SELF_PAIR,
                 fertility_matrix(f, p['mixed_f']), tt,
                 p['migration'], arrivals)
        z = step(z, mc, p['cluster'], np.array([0.]), fc, tc,
                 p['migration'], ac)
        full.append(x.copy())
        control.append(z.copy())
    return dict(full=np.stack(full, axis=1), frozen=np.stack(control, axis=1))


def metrics(x: np.ndarray) -> dict[str, np.ndarray]:
    if x.shape[-1] == 7:
        j = x[..., :5].sum(axis=-1)
        orth = (x[..., :2].sum(axis=-1)/j)
        h = x[..., 0]/j
        return dict(ancestry=1-x[..., 6], jewish_identity=j,
                    orthodox_share_of_jews=orth, haredi_share_of_jews=h)
    return dict(ancestry=1-x[..., 2], jewish_identity=x[..., 0])


def check_tests() -> None:
    p = draw_parameters(500, 7)
    x = p['initial']
    pp = pairing(x, p['m'], p['cluster'], SELF_PAIR)
    np.testing.assert_allclose(pp, pp.transpose(0, 2, 1), atol=1e-14)
    np.testing.assert_allclose(pp.sum(axis=2), x, atol=1e-14)
    assert np.all(pp >= -1e-14)
    t = child_tensor(p['t'], p['rm'])
    np.testing.assert_allclose(t.sum(axis=3), 1., atol=1e-14)
    assert np.all(t[:, :6, :, 6] == 0.)
    assert np.all(t[:, :, :6, 6] == 0.)
    result = run_pair(p)
    np.testing.assert_allclose(collapse_state(result['full'][:, 1]),
                               result['frozen'][:, 1], atol=1e-13)
    np.testing.assert_allclose(result['full'].sum(axis=2), 1., atol=1e-13)
    assert np.all(result['full'] >= -1e-14)
    assert np.all(1-result['full'][..., 6] >= result['full'][..., :5].sum(axis=-1)-1e-14)
    # Random mating, equal fertility, no migration, no identity distinctions:
    # A' must equal 1-(1-A)^2.
    xx = np.array([[0., .08, .92]])
    mm = np.array([[0.]])
    rp = pairing(xx, mm, np.array([0.]), np.array([0.]))
    assert abs(1-rp[0, 2, 2]-(1-.92**2)) < 1e-14
    # Extreme states still conserve pairing mass under partner scarcity.
    for row in ([.8,.1,.04,.02,.01,.01,.02], [0,0,0,0,0,0,1], [1,0,0,0,0,0,0]):
        xx = np.array([row], dtype=float)
        rr = pairing(xx, CENTRAL_M[None], np.array([.25]), SELF_PAIR)
        np.testing.assert_allclose(rr.sum(axis=2), xx, atol=1e-14)
    print('PASS: pairing balance, symmetry, nonnegativity, transmission normalization,')
    print('      ancestry inheritance, matched first generation, random-mating limit, extreme states')


def summarize(result: dict[str, np.ndarray]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for label, state in result.items():
        out[label] = {key: np.percentile(val*100, [5,50,95], axis=0).T.tolist()
                      for key, val in metrics(state).items()}
    mf, mc = metrics(result['full']), metrics(result['frozen'])
    out['paired_difference_percentage_points'] = {
        key: np.percentile((mf[key]-mc[key])*100, [5,50,95], axis=0).T.tolist()
        for key in ('ancestry', 'jewish_identity')}
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--draws', type=int, default=20000)
    parser.add_argument('--seed', type=int, default=20260924)
    parser.add_argument('--generations', type=int, default=4)
    parser.add_argument('--out', type=Path, default=Path('results.json'))
    args = parser.parse_args()
    if args.generations < 1:
        parser.error('--generations must be positive')
    check_tests()
    central = summarize(run_pair(draw_parameters(1, args.seed, central=True), args.generations))
    sample = draw_parameters(args.draws, args.seed)
    ensemble = summarize(run_pair(sample, args.generations))
    # Fixed 8% ancestry reveals parameter uncertainty without mixing it with
    # the separately unvalidated current-ancestry prior.
    fixed = {k:v.copy() for k,v in sample.items()}
    fixed['initial'][:, 5] = .08-.024
    fixed['initial'][:, 6] = .92
    fixed_result = summarize(run_pair(fixed, args.generations))
    convergence = summarize(run_pair(fixed, args.generations, fertility_convergence=True))
    lowret = {k:v.copy() for k,v in fixed.items()}
    # Higher Haredi exit stress test, while preserving destinations among leavers.
    base = T_CENTRAL[0].copy(); base[0]=0.; base/=base.sum()
    retention = np.random.default_rng(args.seed+1).uniform(.60, .80, args.draws)
    lowret['t'][:, 0] = (1-retention)[:,None]*base
    lowret['t'][:, 0, 0] = retention
    lowret_result = summarize(run_pair(lowret, args.generations))
    payload = dict(
        warning='Conditional cohort scenarios, NOT all-age calendar-year forecasts. p5/p50/p95 are sensitivity quantiles, not confidence intervals.',
        seed=args.seed, draws=args.draws, generations=args.generations,
        sources=[
            'https://www.pewresearch.org/religion/2021/05/11/marriage-families-and-children/',
            'https://www.pewresearch.org/religion/2021/05/11/jewish-demographics/',
            'https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/',
            'https://www.pewresearch.org/short-reads/2021/06/22/denominational-switching-among-u-s-jews-reform-judaism-has-gained-conservative-judaism-has-lost/'],
        central_parameters={
            'group_order':NAMES, 'initial_jewish_mix':MIX.tolist(),
            'own_group_fertility':CENTRAL_F.tolist(),
            'jewish_individual_intermarriage':CENTRAL_M.tolist(),
            'child_adult_state_two_same_group_parents':T_CENTRAL.tolist(),
            'mixed_parent_jewish_identity_retention':MIXED_R.tolist(),
            'D_N_assortativity':.25,'mixed_fertility_multiplier':.9,
            'new_cohort_immigrant_fraction':.15,'immigrant_jewish_identity':.024},
        central=central, ensemble_variable_start_ancestry=ensemble,
        ensemble_fixed_8_percent_start=fixed_result,
        orthodox_fertility_advantage_halves_by_fourth_step=convergence,
        haredi_retention_60_to_80_percent=lowret_result,
    )
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(payload,indent=2)+'\n')
    print('\nCENTRAL (percent, successive COHORTS):')
    print('generation | A frozen | A subgroups | J frozen | J subgroups | H share of J')
    for g in range(args.generations+1):
        f=central['full']; c=central['frozen']
        print(g, *[round(v,3) for v in [c['ancestry'][g][1], f['ancestry'][g][1],
              c['jewish_identity'][g][1], f['jewish_identity'][g][1], f['haredi_share_of_jews'][g][1]]])
    print('\nENSEMBLE (fixed initial A=8%, p5/p50/p95):')
    for mode in ('frozen','full'):
        print(mode)
        for key in fixed_result[mode]:
            print(key, np.round(fixed_result[mode][key],3).tolist())
    print('\nPAIRED full-minus-frozen changes:',json.dumps(fixed_result['paired_difference_percentage_points']))
    print('\nFINAL-GENERATION SENSITIVITIES:')
    for name, res in [('constant rates',fixed_result),('fertility convergence',convergence),('higher Haredi exit',lowret_result)]:
        print(name, {k:np.round(v[-1],3).tolist() for k,v in res['full'].items()})
    print('\nWrote',args.out.resolve())

if __name__=='__main__':
    main()
