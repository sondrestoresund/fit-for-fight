// model.js — exercise model and scoring (exported + global bridge)
import { state } from './core-state.js';

export const LEVEL_ORDER=['prospect','standard','strong','elite','max'];

export function nameToKey(name){
  const map={
    'Pull-ups (strict, dead-hang)':'pullups',
    'Push-ups (strict, nonstop)':'pushups',
    '3-Mile (anchor)':'mile_3',
    '1-Mile Run':'mile_1',
    '5K Run':'run_5k',
    '10K Run':'run_10k',
    'Ammo Can Press (30 lb, 2 min)':'ammo_2min',
    '800 m Run':'run_800m',
    'Farmer’s Carry (2×50 lb DBs)':'farmers_carry',
    'Plank Hold':'plank',
    'Barbell Bench Press (xBW for 2–5 reps)':'bench_multbw',
    'Deadlift (xBW for 8 reps)':'deadlift_multbw',
    'Squat (xBW for 8 reps)':'squat_multbw',
    'Standing Long Jump':'long_jump'
  }; return map[name]||name.replace(/[^a-z0-9]+/gi,'_').toLowerCase();
}

export function standardsFromModel(rows){
  const out={};
  rows.forEach(r=>{
    const key=nameToKey(r.name);
    out[key]={ key, name:r.name, cat: r.cat.includes('Upper')?'Upper':(r.cat.includes('Core')?'Core':(r.cat.includes('Endurance')?'Endurance':'Load')),
      unit: r.unit==='xBW'?'multBW':(r.unit||'reps'), lowerIsBetter: r.dir==='lower',
      thresholds:{prospect:r.prospect,standard:r.std,strong:r.strong,elite:r.elite,max:r.max} };
  });
  return out;
}

function pickAgeBracket(age){const a=Number(age||30); const BR=[{min:-Infinity,max:19,time:0.97,output:1.03},{min:20,max:35,time:1.00,output:1.00},{min:36,max:39,time:1.02,output:0.98},{min:40,max:44,time:1.04,output:0.96},{min:45,max:49,time:1.07,output:0.93},{min:50,max:54,time:1.10,output:0.90},{min:55,max:59,time:1.13,output:0.87},{min:60,max:64,time:1.16,output:0.84},{min:65,max:69,time:1.20,output:0.80},{min:70,max:74,time:1.25,output:0.75},{min:75,max:Infinity,time:1.30,output:0.70}]; return BR.find(b=>a>=b.min&&a<=b.max)||BR[1]; }
const GENDER_MULT={male:{time:1.00,output:1.00},female:{time:1.12,output:0.88}};
const BASE={
  pullups:{type:'output',levels:[4,5,12,15,20]},
  pushups:{type:'output',levels:[32,40,60,80,100]},
  bench_ratio:{type:'ratio',levels:[0.8,1.0,1.25,1.5,1.75]},
  ammo_reps:{type:'output',levels:[26,40,60,80,100]},
  plank_time:{type:'time',levels:[60,90,120,180,240]},
  run_800m:{type:'time',levels:[225,210,180,150,135]},
  run_1mi:{type:'time',levels:[480,420,390,360,330]},
  run_3mi:{type:'time',levels:[1620,1440,1260,1140,1080]},
  run_5k:{type:'time',levels:[1650,1440,1260,1170,1080]},
  run_10k:{type:'time',levels:[3300,3000,2700,2400,2280]},
  long_jump_in:{type:'output',levels:[160,200,225,250,300]},
  farmers_m:{type:'output',levels:[40,50,75,100,150]},
  deadlift_r:{type:'ratio',levels:[1.0,1.25,1.5,2.0,2.5]},
  squat_r:{type:'ratio',levels:[1.0,1.25,1.5,2.0,2.5]},
};
function inchesToCm(inch){return Math.round(inch*2.54)}
function scaleByProfile(base, metric, age, sex){const br=pickAgeBracket(age); const gm=(GENDER_MULT[sex||'male']||GENDER_MULT.male); const mult=(metric==='time')?(br.time*gm.time):(metric==='ratio'?gm.output*br.output:gm.output*br.output); let v=base*mult; if(metric==='time') v=Math.round(v/5)*5; else if(metric==='ratio') v=Math.round(v*20)/20; else v=Math.round(v); const low=(metric==='time')?base*0.60:base*0.50; const high=(metric==='time')?base*2.0:base*1.5; return Math.max(low,Math.min(high,v)); }

export function buildModel(){
  const spec=(key)=>BASE[key]; const age=Number(state.profile?.age||30); const sex=(state.profile?.sex)||'male';
  const mk=(cat,name,unit,dir,key)=>{ const s=spec(key); const lvls=s.levels.map(v=>scaleByProfile(v,s.type,age,sex)); if(key==='long_jump_in'){ for(let i=0;i<lvls.length;i++) lvls[i]=inchesToCm(lvls[i]); } const [prospect,standard,strong,elite,maxv]=lvls; return {cat,name,unit,dir,prospect,std:standard,strong,elite,max:maxv}; };
  return [
    mk("Upper Body","Pull-ups (strict, dead-hang)","reps","higher","pullups"),
    mk("Upper Body","Push-ups (strict, nonstop)","reps","higher","pushups"),
    mk("Upper Body","Barbell Bench Press (xBW for 2–5 reps)","xBW","higher","bench_ratio"),
    mk("Upper Body","Ammo Can Press (30 lb, 2 min)","reps","higher","ammo_reps"),
    mk("Core","Plank Hold","sec","higher","plank_time"),
    mk("Speed & Endurance","800 m Run","sec","lower","run_800m"),
    mk("Speed & Endurance","1-Mile Run","sec","lower","run_1mi"),
    mk("Speed & Endurance","3-Mile (anchor)","sec","lower","run_3mi"),
    mk("Speed & Endurance","5K Run","sec","lower","run_5k"),
    mk("Speed & Endurance","10K Run","sec","lower","run_10k"),
    mk("Explosive Power","Standing Long Jump","cm","higher","long_jump_in"),
    mk("Load & Work Capacity","Farmer’s Carry (2×50 lb DBs)","m","higher","farmers_m"),
    mk("Load & Work Capacity","Deadlift (xBW for 8 reps)","xBW","higher","deadlift_r"),
    mk("Load & Work Capacity","Squat (xBW for 8 reps)","xBW","higher","squat_r"),
  ];
}

export function tierAndPoints5(dir,val,prospect,std,strong,elite,maxv){ if(val==null||isNaN(val)) return {tier:"-",pts:null}; let t="Below",p=0; if(dir==="higher"){ if(val<prospect){p=Math.max(0,20*(val/prospect));t="Below"} else if(val<std){p=20+(val-prospect)/(std-prospect)*20;t="Prospect"} else if(val<strong){p=40+(val-std)/(strong-std)*30;t="Standard"} else if(val<elite){p=70+(val-strong)/(elite-strong)*20;t="Strong"} else if(val<maxv){p=90+(val-elite)/(maxv-elite)*10;t="Elite"} else {p=100;t="Max"} } else { if(val>prospect){p=Math.max(0,20*(prospect/val));t="Below"} else if(val>std){p=20+(prospect-val)/(prospect-std)*20;t="Prospect"} else if(val>strong){p=40+(std-val)/(std-strong)*30;t="Standard"} else if(val>elite){p=70+(strong-val)/(strong-elite)*20;t="Strong"} else if(val>maxv){p=90+(elite-val)/(elite-maxv)*10;t="Elite"} else {p=100;t="Max"} } return {tier:t,pts:Math.round(p)}; }
export function tierClass(t){return t==="Max"?"t-max":t==="Elite"?"t-elite":t==="Strong"?"t-strong":t==="Standard"?"t-std":t==="Prospect"?"t-prospect":""}

const BANDS=[0.00,0.20,0.40,0.70,0.90,1.00];
const TIER_IDX={Prospect:1,Standard:2,Strong:3,Elite:4,Max:5};
export function bandForTier(t){const i=TIER_IDX[t]||0; const start=BANDS[i-1]||0, end=BANDS[i]||0; return {start,end,mid:(start+end)/2}}
export function exerciseKey(row){return `${row.cat}|${row.name}|${row.unit}|${row.dir}`}
export function bestFor(row){const key=exerciseKey(row);const logs=(state.logs||[]).filter(l=>l.exercise===key);if(!logs.length) return null;let best=logs[0];for(const l of logs){if(row.dir==="higher"){if(l.value>best.value) best=l;} else {if(l.value<best.value) best=l;}}return best}
export function filterRows(rows){const selected=state.selectedExercises&&state.selectedExercises.length?new Set(state.selectedExercises):null;return selected?rows.filter(r=>selected.has(exerciseKey(r))):rows}

// Scoring for ring cards
function normalizeExerciseScore(value,cfg){ if(value==null) return 0; const T=cfg.thresholds; const meets=(v,lvl)=> cfg.lowerIsBetter ? v<=T[lvl] : v>=T[lvl]; if(meets(value,'max')) return 100; for(let i=LEVEL_ORDER.length-2;i>=0;i--){ const lo=LEVEL_ORDER[i], hi=LEVEL_ORDER[i+1]; const loOK=meets(value,lo), hiOK=meets(value,hi); if(loOK && !hiOK){ const base=20*(i+1); const a=T[lo], b=T[hi]; const t=cfg.lowerIsBetter? (b-value)/(b-a) : (value-a)/(b-a); return Math.max(0,Math.min(100,base+20*t)); } } return 0; }
function computeCategoryScore(prs,standards,requiredKeys){ const n=requiredKeys.length; let sum=0,logged=0; for(const key of requiredKeys){const cfg=standards[key]; const val=prs[key]??null; if(val!=null) logged++; sum+=normalizeExerciseScore(val,cfg||{});} const raw=n?(sum/n):0, coverage=n?(logged/n):0; return {raw,coverage,required:n,logged}; }
export function computeHeadlineScores(prs,standards,scoreSets){ const p=computeCategoryScore(prs,standards,scoreSets.pft); const c=computeCategoryScore(prs,standards,scoreSets.cft); const overallRaw=(p.raw+c.raw)/2; const overallCoverage=(p.logged+c.logged)/(p.required+c.required||1); const overall=Math.round(overallRaw*overallCoverage); return {PFT:{score:Math.round(p.raw*p.coverage),raw:p.raw,coverage:p.coverage}, CFT:{score:Math.round(c.raw*c.coverage),raw:c.raw,coverage:c.coverage}, OVERALL:{score:overall,raw:overallRaw,coverage:overallCoverage}}; }
export const SCORE_SETS={pft:['pullups','pushups','mile_3'], cft:['ammo_2min','run_800m','farmers_carry']};

// Bridge to window for classic code temporary
try{
  window.nameToKey=nameToKey; window.standardsFromModel=standardsFromModel; window.buildModel=buildModel; window.tierAndPoints5=tierAndPoints5; window.tierClass=tierClass; window.bandForTier=bandForTier; window.exerciseKey=exerciseKey; window.bestFor=bestFor; window.filterRows=filterRows; window.computeHeadlineScores=computeHeadlineScores; window.SCORE_SETS=SCORE_SETS;
}catch{}

