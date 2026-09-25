"""Check browser paths against the recovered Python generation function.

Run from the article directory:
  uv run --no-project --with numpy python reference/verify_historical.py

The original Python file is deliberately not edited to agree with JavaScript.
The elapsed-fraction interpolation is checked explicitly on top of its full step.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import subprocess

ROOT = Path(__file__).resolve().parents[1]
original = ROOT / 'reference/jewish_ancestry_sensitivity_v2.py'
assert hashlib.sha256(original.read_bytes()).hexdigest() == '8ca307dd9d241c3cf8d3853a9d81d97ac60a7256051bb3af1b3c6cf117333cd7'
spec = importlib.util.spec_from_file_location('recovered_v2', original)
ref = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ref)
program = '''const H=require(process.argv[1]);const p={...H.defaults(),draws:2000};
const runs=[];for(let i=0;i<p.draws;i++){const r=H.trial(p,i);if(r.status==='accepted')runs.push(r);}
console.log(JSON.stringify({p,runs}));'''
data = json.loads(subprocess.check_output(['node', '-e', program, str(ROOT/'historical.js')], text=True))
checks = 0
for run in data['runs']:
    for previous, row in zip(run['rows'], run['rows'][1:]):
        p = row['rates']
        full = ref.generation_pre_migration(previous['j'], previous['d'], p['m'], p['rjj'], p['rm'], p['fjj'], p['fmix'], p['fd'], p['c'])
        f = (row['year'] - previous['year']) / run['generationYears']
        old = [previous['j'], previous['d'], previous['parentProxy']]
        pre = [a + f*(b-a) for a,b in zip(old, full)]
        u = row['arrivalShare']
        expected_u = f * min(.35, max(.01, ref.fborn(row['year']) * run['generationYears'] / 25 * row['arrivalScale']))
        assert math.isclose(u, expected_u, rel_tol=0, abs_tol=1e-12)
        target = ref.jshare(row['year'])
        needed = (target - (1-u)*pre[0]) / u
        expected = [target, (1-u)*pre[1], (1-u)*pre[2] + u*needed]
        assert math.isclose(needed, row['immigrantJewish'], rel_tol=0, abs_tol=1e-12)
        for key, value in zip(['j','d','parentProxy'], expected):
            assert math.isclose(row[key], value, rel_tol=0, abs_tol=1e-12), (key, row[key], value)
        assert 0 <= needed <= data['p']['immigrantJewishMax']
        assert row['year'] <= data['p']['endYear']
        checks += 1
assert checks > 100
print(f'{len(data["runs"])} retained paths, {checks} steps match the recovered Python reference plus the stated timing correction.')
