// core-state.js — state and storage helpers (exported + global bridge)

export const DATA_PREFIX = 'mcfit:data:';
export const dataKeyFor = (uid)=> DATA_PREFIX + (uid||'guest');

export function loadUserData(uid){
  try{
    return JSON.parse(localStorage.getItem(dataKeyFor(uid))||'{"profile":{},"logs":[],"sessions":[],"selectedExercises":[]}');
  }catch{
    return {profile:{},logs:[],sessions:[],selectedExercises:[]};
  }
}

export function saveUserData(uid,data){ localStorage.setItem(dataKeyFor(uid), JSON.stringify(data)); }

export const activeUID = ()=> (window.fsUid||null);

export let state = loadUserData(activeUID());

export function ensureFireteam(){ state.fireteam = state.fireteam || {friends:[]}; }
export function inviteCode(){ return activeUID() || '-'; }
export function fireteamFriends(){ ensureFireteam(); return state.fireteam.friends || []; }

export function dedupe(arr,keyFn){ const seen=new Set(); return arr.filter(x=>{ const k=keyFn(x); if(seen.has(k)) return false; seen.add(k); return true; }); }

// Bridge to window for classic code (temporary)
try{
  window.DATA_PREFIX = DATA_PREFIX;
  window.dataKeyFor = dataKeyFor;
  window.loadUserData = loadUserData;
  window.saveUserData = saveUserData;
  window.activeUID = activeUID;
  window.state = state;
  window.ensureFireteam = ensureFireteam;
  window.inviteCode = inviteCode;
  window.fireteamFriends = fireteamFriends;
  window.dedupe = dedupe;
}catch{}

