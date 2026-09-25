#!/usr/bin/env python3
"""Sensitivity model for genealogical Jewish ancestry in the U.S.

This is an exploratory demographic model, not a population estimate or confidence interval.
It tracks three states:
  J: currently Jewish identity
  D: Jewish genealogical ancestry, no current Jewish identity
  N: neither within the modeled U.S. lineage horizon

Core idea:
- Start from historical U.S. Jewish population-share anchors.
- Reproduce by generation with calendar-varying Jewish intermarriage rates.
- Descendants inherit genealogical ancestry whenever either parent has it.
- Jewish identity retention is separate from ancestry inheritance.
- At each generation, calibrate immigrant Jewish share so simulated J matches the
  historical Jewish population-share curve; reject paths needing impossible or
  very implausible immigrant composition (>60% Jewish).
- Approximate the immigrant fraction using the historical foreign-born U.S. share.

Important limitation: immigrants not currently Jewish are assigned no hidden Jewish
ancestry. Therefore this estimates ancestry diffused through modeled U.S. Jewish
communities, not all older Jewish ancestry carried into the U.S. by nominally
non-Jewish immigrants.

Empirical anchors used in choosing ranges:
- American Jewish Year Book historical U.S. Jewish shares: 1877 0.52%, 1897 1.31%,
  1907 2.00%, 1917 3.27%, 1927 3.58%, 1937 3.70%.
- 1957 Census/Pew historical benchmark: ~3.2% Jewish by religion.
- 1970 NJPS: ~2.7% core Jewish population; 1990: ~2.2%.
- Pew 2020: 2.4% of U.S. adults Jewish + 1.1% Jewish background.
- Pew 2020 intact-marriage intermarriage: 18% pre-1980, 42% 1980s,
  37% 1990s, 45% 2000s, 61% 2010-2020.
- Pew 2020: among intermarried Jewish parents, 28% raise children Jewish by
  religion, 29% Jewish not by religion, 12% partly Jewish, 30% not Jewish.
- Historical U.S. foreign-born shares from Pew/Census series.

Run: python jewish_ancestry_sensitivity_v2.py
"""
from __future__ import annotations
import numpy as np

J_ANCHORS = {
    1877: .0052, 1897: .0131, 1907: .0200, 1917: .0327,
    1927: .0358, 1937: .0370, 1957: .0320, 1970: .0270,
    1990: .0220, 2013: .0220, 2020: .0240, 2025: .0240,
}
FB_ANCHORS = {
    1900:.137, 1910:.146, 1920:.127, 1930:.113, 1940:.085,
    1950:.069, 1960:.056, 1970:.048, 1980:.062, 1990:.082,
    2000:.114, 2010:.127, 2018:.141, 2025:.145,
}
M_ANCHORS = {
    1877:.01, 1897:.015, 1907:.02, 1935:.055, 1957:.038,
    1975:.18, 1985:.42, 1995:.37, 2005:.45, 2015:.61, 2025:.63,
}

def interp(anchors, year):
    ys=np.array(sorted(anchors),dtype=float)
    vs=np.array([anchors[int(y)] for y in ys],dtype=float)
    return float(np.interp(year,ys,vs))

def jshare(y): return interp(J_ANCHORS,y)
def fborn(y): return interp(FB_ANCHORS,y)
def mcentral(y): return interp(M_ANCHORS,y)

def draw_m(mid,rng):
    base=mcentral(mid)
    if mid < 1960: mult=rng.uniform(.55,1.65)
    elif mid < 1980: mult=rng.uniform(.75,1.35)
    else: mult=rng.uniform(.88,1.12)
    return float(np.clip(base*mult,.001,.80))

def draw_mixed_retention(mid,rng):
    # broad-Jewish-identity retention, not halakhic status
    if mid < 1940: return rng.uniform(.12,.45)
    if mid < 1970: return rng.uniform(.15,.50)
    if mid < 2000: return rng.uniform(.25,.62)
    return rng.uniform(.48,.75)

def generation_pre_migration(j,d,m,retain_jj,retain_mix,fjj,fmix,fd,c):
    n=1-j-d
    jj=j*(1-m)
    jd=2*j*m*d/(1-j)
    jn=2*j*m*n/(1-j)
    h=1-j-j*m
    z=d/(1-j)
    dd=h*(c*z+(1-c)*z*z)
    dn=h*(1-c)*2*z*(1-z)
    nn=h*(c*(1-z)+(1-c)*(1-z)**2)
    norm=jj*fjj+(jd+jn)*fmix+(dd+dn)*fd+nn
    ancestry=1-nn/norm
    jewish=(jj*fjj*retain_jj+(jd+jn)*fmix*retain_mix)/norm
    parent_proxy=(jj*fjj+(jd+jn)*fmix)/norm
    return jewish, ancestry-jewish, parent_proxy

def simulate_path(start,gen,rng):
    j=jshare(start); d=0.0
    clustering=rng.uniform(0,.5)
    fjj=rng.uniform(.85,1.08)
    fmix=rng.uniform(.82,1.06)
    fd=rng.uniform(.90,1.06)
    retain_jj=rng.uniform(.94,.995)
    y=float(start); parent_proxy=np.nan
    while y < 2025-1e-9:
        yn=min(y+gen,2025.0)
        span=yn-y; mid=(y+yn)/2
        m=draw_m(mid,rng)
        rm=draw_mixed_retention(mid,rng)
        jpre,dpre,parent_proxy=generation_pre_migration(
            j,d,m,retain_jj,rm,fjj,fmix,fd,clustering)
        # foreign-born stock is used as a coarse proxy for first-generation
        # entrants in the generation; scale by span and allow wide error.
        mig=float(np.clip(fborn(yn)*(span/25)*rng.uniform(.65,1.45),.01,.35))
        target=jshare(yn)
        immigrant_j=(target-(1-mig)*jpre)/mig
        if immigrant_j < 0 or immigrant_j > .60:
            return None
        j=(1-mig)*jpre+mig*immigrant_j
        d=(1-mig)*dpre
        parent_proxy=(1-mig)*parent_proxy+mig*immigrant_j
        y=yn
    return j+d,parent_proxy,start,gen,clustering

def ensemble(n,seed,start_range,gen_range):
    rng=np.random.default_rng(seed)
    out=[]
    for _ in range(n):
        start=rng.uniform(*start_range)
        gen=rng.uniform(*gen_range)
        z=simulate_path(start,gen,rng)
        if z is not None: out.append(z)
    return np.array(out,float)

def summarize(label,x):
    q=np.percentile(x[:,0]*100,[5,25,50,75,95])
    p=np.percentile(x[:,1]*100,[5,50,95])
    print(f"{label:28s} accepted={len(x):5d} ancestry p5/p25/p50/p75/p95="
          f"{q[0]:.2f}/{q[1]:.2f}/{q[2]:.2f}/{q[3]:.2f}/{q[4]:.2f}%  "
          f"parent-proxy={p[0]:.2f}/{p[1]:.2f}/{p[2]:.2f}%")

if __name__ == '__main__':
    cases=[
        ('short gen 20-24', (1877,1927),(20,24)),
        ('central gen 24-28',(1877,1927),(24,28)),
        ('long gen 28-32',  (1877,1927),(28,32)),
        ('early start',     (1877,1897),(24,30)),
        ('middle start',    (1897,1907),(24,30)),
        ('late start',      (1907,1927),(24,30)),
        ('main ensemble',   (1877,1927),(24,30)),
    ]
    for i,(label,sr,gr) in enumerate(cases):
        x=ensemble(30000,100+i,sr,gr)
        summarize(label,x)
