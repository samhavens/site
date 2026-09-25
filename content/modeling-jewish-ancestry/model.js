/* ancestry-not-identity v4.0.0 — deterministic cohort scenarios, not forecasts.
 * No DOM, network, dependencies, or demographic estimates hidden in this module.
 * P[i][j] is an ORDERED parent-pair distribution, with BOTH marginals equal to x.
 * Thus sum(P*F)/2 is the relative next-cohort size before migration; the 1/2
 * cancels when calculating composition. All outputs are successive cohorts.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AncestryModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '4.0.0';
  const NAMES = ['haredi', 'modern / other orthodox', 'conservative', 'reform',
    'other / unaffiliated jewish', 'descendant, not jewish-identifying', 'no modeled connection'];
  const SHORT = ['haredi', 'other orthodox', 'conservative', 'reform', 'other jewish', 'descendant', 'no connection'];
  const DEFAULT_TRANSITIONS = [
    [.92,.04,.01,.01,.018,.002,0], [.05,.72,.08,.06,.07,.02,0],
    [.003,.017,.42,.30,.19,.07,0], [.002,.008,.04,.65,.18,.12,0],
    [.002,.008,.02,.06,.81,.10,0]
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  const sum = a => a.reduce((s,x) => s+x, 0);
  const zeros = n => Array(n).fill(0);
  const matrix = n => Array.from({length:n}, () => zeros(n));
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  function defaults() {
    return {
      initialJewish:.024, initialConnection:.024,
      jewishMix:[.06,.03,.17,.37,.37],
      fertility:[5.5,3,1.9,1.8,1.6,2,2],
      intermarriage:[.005,.025,.45,.65,.80],
      selfPair:[.96,.80,.50,.50,.40],
      sameGroupTransitions:clone(DEFAULT_TRANSITIONS),
      mixedRetention:[.60,.65,.65,.60,.50], mixedUnaffiliatedWeight:.35,
      mixedFertility:.90, clustering:.25,
      arrivalShare:.15, arrivalJewish:.024, arrivalDescendant:0,
      arrivalMix:[.06,.03,.17,.37,.37],
      fertilityHalfLife:0, generations:6,
      generationYears:27, referenceYear:2026
    };
  }
  function validate(p) {
    if (!p || typeof p !== 'object') throw new TypeError('parameters must be an object');
    function number(v,n,lo,hi) {
      if (!Number.isFinite(v) || v<lo || v>hi) throw new RangeError(`${n} must be between ${lo} and ${hi}`);
    }
    function vector(a,n,name,lo=0,hi=1) {
      if (!Array.isArray(a)||a.length!==n) throw new TypeError(`${name} must have ${n} entries`);
      a.forEach((v,i)=>number(v,`${name}[${i}]`,lo,hi));
    }
    function probabilityRow(a,n,name) { vector(a,n,name); if(Math.abs(sum(a)-1)>1e-9) throw new RangeError(`${name} must sum to 1`); }
    ['initialJewish','initialConnection','mixedUnaffiliatedWeight','mixedFertility','clustering','arrivalShare','arrivalJewish','arrivalDescendant'].forEach(k=>number(p[k],k,0,1));
    if(p.initialConnection<p.initialJewish) throw new RangeError('initial connection must include the jewish-identifying roots');
    if(p.arrivalJewish+p.arrivalDescendant>1+1e-12) throw new RangeError('arrival jewish + descendant shares cannot exceed 1');
    probabilityRow(p.jewishMix,5,'jewishMix'); probabilityRow(p.arrivalMix,5,'arrivalMix');
    vector(p.fertility,7,'fertility',.001,15);
    ['intermarriage','selfPair','mixedRetention'].forEach(k=>vector(p[k],5,k));
    if(!Array.isArray(p.sameGroupTransitions)||p.sameGroupTransitions.length!==5) throw new TypeError('sameGroupTransitions must have 5 rows');
    p.sameGroupTransitions.forEach((r,i)=>{
      probabilityRow(r,7,`sameGroupTransitions[${i}]`);
      if(r[6]!==0) throw new RangeError('descendants cannot lose their ancestry flag');
    });
    number(p.fertilityHalfLife,'fertilityHalfLife',0,100);
    number(p.generations,'generations',1,16);
    if(!Number.isInteger(p.generations)) throw new RangeError('generations must be whole steps');
    number(p.generationYears,'generationYears',15,50); number(p.referenceYear,'referenceYear',1500,2500);
    return p;
  }
  function initial(p) {return [...p.jewishMix.map(x=>x*p.initialJewish),p.initialConnection-p.initialJewish,1-p.initialConnection];}
  function arrivals(p) {return [...p.arrivalMix.map(x=>x*p.arrivalJewish),p.arrivalDescendant,1-p.arrivalJewish-p.arrivalDescendant];}
  function collapse(x) {return [sum(x.slice(0,-2)),x.at(-2),x.at(-1)];}

  /** Balanced sex-symmetric parent-pair distribution. No partner creation. */
  function pairing(x,m,cluster,own) {
    const k=x.length, q=k-2, P=matrix(k), non=x[q]+x[q+1];
    let cross=x.slice(0,q).map((v,i)=>v*m[i]), requested=sum(cross);
    const ration=requested>non ? non/requested : 1;
    cross=cross.map(v=>v*ration);
    const nonCond=non>0 ? [x[q]/non,x[q+1]/non] : [0,0];
    for(let i=0;i<q;i++) for(let a=0;a<2;a++) P[i][q+a]=P[q+a][i]=cross[i]*nonCond[a];
    const inside=x.slice(0,q).map((v,i)=>v-cross[i]);
    const reserved=inside.map((v,i)=>v*own[i]), rest=inside.map((v,i)=>v-reserved[i]), total=sum(rest);
    for(let i=0;i<q;i++) for(let j=0;j<q;j++) P[i][j]=(total>0?rest[i]*rest[j]/total:0)+(i===j?reserved[i]:0);
    const left=[0,1].map(a=>Math.max(0,x[q+a]-sum(cross)*nonCond[a])), all=sum(left);
    for(let a=0;a<2;a++) for(let b=0;b<2;b++) P[q+a][q+b]=(all>0?(1-cluster)*left[a]*left[b]/all:0)+(a===b?cluster*left[a]:0);
    return P;
  }
  function fertilityMatrix(p,step=0) {
    const f=p.fertility.slice();
    if(p.fertilityHalfLife>0) for(let i=0;i<2;i++) f[i]=f[6]+(f[i]-f[6])*2**(-step/p.fertilityHalfLife);
    return f.map((a,i)=>f.map((b,j)=>Math.sqrt(a*b)*((i<5)!==(j<5)?p.mixedFertility:1)));
  }
  function childTensor(p) {
    const T=Array.from({length:7},()=>Array.from({length:7},()=>zeros(7)));
    for(let i=0;i<5;i++) {
      for(let j=0;j<5;j++) T[i][j]=p.sameGroupTransitions[i].map((v,k)=>(v+p.sameGroupTransitions[j][k])/2);
      const weights=p.sameGroupTransitions[i].slice(0,5), mass=sum(weights);
      const dest=weights.map(v=>mass>0?(1-p.mixedUnaffiliatedWeight)*v/mass:0);
      // When no same-group offspring remain Jewish, the conditional destination
      // for a separately retained mixed-parent child is explicitly unaffiliated.
      dest[4]+=mass>0?p.mixedUnaffiliatedWeight:1;
      for(let j=5;j<7;j++) {
        T[i][j]=[...dest.map(v=>v*p.mixedRetention[i]),1-p.mixedRetention[i],0];
        T[j][i]=T[i][j].slice();
      }
    }
    T[5][5][5]=T[5][6][5]=T[6][5][5]=T[6][6][6]=1;
    return T;
  }
  function next(x,P,F,T,u,v) {
    const k=x.length, born=zeros(k); let birthMass=0;
    for(let i=0;i<k;i++) for(let j=0;j<k;j++) {
      const b=P[i][j]*F[i][j]; birthMass+=b;
      for(let a=0;a<k;a++) born[a]+=b*T[i][j][a];
    }
    if(!(birthMass>0)) throw new RangeError('this cohort produces no births');
    const state=born.map((b,k)=>(1-u)*b/birthMass+u*v[k]);
    return {state,birthMass};
  }
  function collapseSystem(P,F,T,p,x) {
    const parts=[[0,1,2,3,4],[5],[6]], f=matrix(3), t=Array.from({length:3},()=>matrix(3));
    for(let a=0;a<3;a++) for(let b=0;b<3;b++) {
      let pp=0, bb=0; const dest=zeros(3);
      for(const i of parts[a]) for(const j of parts[b]) {
        const birth=P[i][j]*F[i][j]; pp+=P[i][j]; bb+=birth;
        for(let c=0;c<3;c++) for(const k of parts[c]) dest[c]+=birth*T[i][j][k];
      }
      if(bb>1e-290) {f[a][b]=bb/pp; t[a][b]=dest.map(v=>v/bb);}
      else {
        // A category absent at t=0 has no observed conditional pair average.
        // Supply its counterfactual law, rather than inventing two children
        // who all lose Jewish identity. In particular, J-D and J-N must be
        // equivalent when D and N have equal fertility. Cross-group Jewish
        // weights are the existing subgroup exposures x_i*m_i (or the input
        // mixture if there are no such exposures). This branch never changes
        // the exact first-step match, since its initial pair mass is zero.
        let w=x.slice(0,5).map((v,i)=>v*p.intermarriage[i]);
        if(sum(w)===0) w=x.slice(0,5);
        if(sum(w)===0) w=p.jewishMix.slice();
        w=w.map(v=>v/sum(w));
        let fb=0;const td=zeros(3);
        for(const i of parts[a]) for(const j of parts[b]) {
          const weight=(a===0?w[i]:1)*(b===0?w[j]:1),birth=weight*F[i][j];
          fb+=birth;
          for(let c=0;c<3;c++) for(const k of parts[c]) td[c]+=birth*T[i][j][k];
        }
        f[a][b]=fb;t[a][b]=td.map(v=>v/fb);
      }
    }
    return {f,t};
  }
  function metrics(x) {
    const q=x.length-2,j=sum(x.slice(0,q));
    return {identity:j, connection:1-x.at(-1), descendants:x.at(-2),
      harediShare:x.length===7&&j>0?x[0]/j:0,
      orthodoxShare:x.length===7&&j>0?(x[0]+x[1])/j:0};
  }
  function diagnostics(x,p,g) {
    const P=pairing(x,p.intermarriage,p.clustering,p.selfPair), F=fertilityMatrix(p,g), j=sum(x.slice(0,5));
    let crossed=0, births=0;
    for(let i=0;i<5;i++) { crossed+=P[i][5]+P[i][6]; for(let k=0;k<7;k++) births+=P[i][k]*F[i][k]; }
    return {aggregateIntermarriage:j>0?crossed/j:0, effectiveOffspringPerJewishParent:j>0?births/j:0};
  }
  function simulate(input) {
    const p=validate(clone(input)); let x=initial(p), z=collapse(x);
    const T=childTensor(p), F0=fertilityMatrix(p), P0=pairing(x,p.intermarriage,p.clustering,p.selfPair);
    const frozen=collapseSystem(P0,F0,T,p,x), j=sum(x.slice(0,5));
    const m=j>0?sum(x.slice(0,5).map((v,i)=>v*p.intermarriage[i]))/j:0;
    const v=arrivals(p), av=collapse(v);
    const full=[x.slice()], control=[z.slice()];
    for(let g=0;g<p.generations;g++) {
      x=next(x,pairing(x,p.intermarriage,p.clustering,p.selfPair),fertilityMatrix(p,g),T,p.arrivalShare,v).state;
      z=next(z,pairing(z,[m],p.clustering,[0]),frozen.f,frozen.t,p.arrivalShare,av).state;
      full.push(x);control.push(z);
    }
    return {version:VERSION,parameters:p,full,control,
      rows:full.map((x,g)=>({generation:g,illustrativeYear:p.referenceYear+g*p.generationYears,
        ...metrics(x),...diagnostics(x,p,g),controlIdentity:metrics(control[g]).identity,controlConnection:metrics(control[g]).connection}))};
  }
  function setRetention(p,i,r) {
    if(!Number.isInteger(i)||i<0||i>4||!Number.isFinite(r)||r<0||r>1) throw new RangeError('invalid retention');
    const row=p.sameGroupTransitions[i], others=row.map((v,k)=>k===i?0:v); let s=sum(others);
    if(s===0) { // A fully diagonal row has no learned destinations for leavers.
      for(let k=0;k<7;k++) others[k]=k===i?0:DEFAULT_TRANSITIONS[i][k]; s=sum(others);
    }
    p.sameGroupTransitions[i]=others.map(v=>(1-r)*v/s);p.sameGroupTransitions[i][i]=r;
    return p;
  }
  function rng(seed) { // Mulberry32: explicit uint32 seed, same in every runtime.
    let a=seed>>>0; return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  }
  const uniform=(r,a,b)=>a+(b-a)*r();
  /** Input sensitivity, NOT a calibrated distribution over possible futures.
   * Each interval is uniform and independent except row renormalization,
   * the fixed D/N fertility ratio, and connection >= identity.
   * A width of zero returns the base scenario exactly.
   */
  function sampleParameters(base,r,width=1) {
    if(!Number.isFinite(width)||width<0||width>2) throw new RangeError('width must be 0..2');
    const p=clone(base); if(width===0) return p; const interval=(v,h,lo=0,hi=1)=>uniform(r,Math.max(lo,v-h*width),Math.min(hi,v+h*width));
    p.fertility=p.fertility.map(v=>interval(v,.2*v,.001,15)); p.fertility[5]=clamp(base.fertility[5]*p.fertility[6]/base.fertility[6],.001,15);
    p.intermarriage=p.intermarriage.map((v,i)=>interval(v,[.01,.035,.15,.13,.10][i]));
    for(let i=0;i<5;i++) setRetention(p,i,interval(base.sameGroupTransitions[i][i],.08));
    p.mixedRetention=p.mixedRetention.map(v=>interval(v,.15));
    p.clustering=interval(p.clustering,.15);p.arrivalShare=interval(p.arrivalShare,.05);
    p.arrivalJewish=interval(p.arrivalJewish,.01,0,1-base.arrivalDescendant);
    p.initialConnection=interval(p.initialConnection,.02,p.initialJewish,1);
    return p;
  }
  function quantile(sorted,q) { const t=(sorted.length-1)*q, i=Math.floor(t); return sorted[i]+(sorted[Math.min(i+1,sorted.length-1)]-sorted[i])*(t-i); }
  function summarizeRuns(results) {
    if(!results.length) throw new RangeError('at least one run is required');
    const n=results[0].rows.length;
    if(results.some(r=>r.rows.length!==n)) throw new RangeError('run lengths differ');
    return Array.from({length:n},(_,g)=>{
      const out={generation:g};
      for(const k of ['identity','connection','controlIdentity','controlConnection']) {
        const a=results.map(r=>r.rows[g][k]).sort((a,b)=>a-b);out[k]=[.05,.5,.95].map(q=>quantile(a,q));
      }
      return out;
    });
  }
  /** Samples illustrative births from the SAME birth-weighted joint law.
   * These are not persistent people or a second population forecast. Filters
   * are explicitly conditional samples and must never be presented as shares.
   */
  function sampleBirths(result,g,seed=1,count=12,filter='all') {
    if(!Number.isInteger(g)||g<0||g>=result.full.length-1) throw new RangeError('invalid parent generation');
    if(!Number.isInteger(count)||count<1||count>10000) throw new RangeError('invalid sample size');
    const p=result.parameters,x=result.full[g],P=pairing(x,p.intermarriage,p.clustering,p.selfPair),F=fertilityMatrix(p,g),T=childTensor(p),v=arrivals(p);
    let total=0;for(let i=0;i<7;i++) for(let j=0;j<7;j++) total+=P[i][j]*F[i][j];
    const events=[];
    for(let i=0;i<7;i++) for(let j=0;j<7;j++) for(let k=0;k<7;k++) {
      const w=(1-p.arrivalShare)*P[i][j]*F[i][j]*T[i][j][k]/total;
      if(w>0) events.push({i,j,k,weight:w,arrival:false});
    }
    for(let k=0;k<7;k++) if(p.arrivalShare*v[k]>0) events.push({i:null,j:null,k,weight:p.arrivalShare*v[k],arrival:true});
    const predicates={all:()=>true, mixed:e=>!e.arrival&&((e.i<5)!==(e.j<5)),
      descendants:e=>!e.arrival&&e.i>=5&&e.j>=5&&(e.i===5||e.j===5),
      haredi:e=>!e.arrival&&e.i===0&&e.j===0};
    if(!predicates[filter]) throw new RangeError('unknown birth filter');
    const pool=events.filter(predicates[filter]), mass=sum(pool.map(e=>e.weight));
    if(mass===0) return {events:[],filter,mass:0};
    const r=rng(seed), sampled=[];
    for(let n=0;n<count;n++) {let u=r()*mass,chosen=pool.at(-1);for(const e of pool){u-=e.weight;if(u<=0){chosen=e;break;}}sampled.push({...chosen});}
    return {events:sampled,filter,mass};
  }
  function toy(p,g) {
    if(!Number.isFinite(p)||p<0||p>1||!Number.isInteger(g)||g<0||g>30) throw new RangeError('invalid toy inputs');
    return p===1?1:-Math.expm1(2**g*Math.log1p(-p));
  }
  return {VERSION,NAMES,SHORT,defaults,validate,initial,arrivals,collapse,pairing,fertilityMatrix,
    childTensor,next,metrics,diagnostics,simulate,setRetention,rng,sampleParameters,summarizeRuns,sampleBirths,toy,clone};
});
