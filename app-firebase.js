import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, getDocs, setDoc, deleteDoc, query,
  where, orderBy, serverTimestamp, limit, getDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { toTimestamp, parseTime, numOrNull, showToast, showToastAction } from './utils.js';
import { loadUserData, saveUserData, setState } from './core-state.js';
import { buildModel, standardsFromModel, computeHeadlineScores } from './model.js';
import { renderFireteam } from './fireteam.js';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmdJrCbHu8ux5W9vAosUTChSHIiN-16rA",
  authDomain: "fit-for-fight-b28a1.firebaseapp.com",
  projectId: "fit-for-fight-b28a1",
  storageBucket: "fit-for-fight-b28a1.firebasestorage.app",
  messagingSenderId: "815883203586",
  appId: "1:815883203586:web:b18cd969ca6346aa5aa31b",
  measurementId: "G-N6VX9Q7Y8F"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Small helper to swap views safely
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('show'));
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
  // header profile menu visibility
  const prof = document.getElementById('profileMenu');
  if (prof) prof.style.display = (id === 'view-login' || id === 'view-account') ? 'none' : '';
}

// Wire up Account form + auth state
export function wireAuthUI() {
  console.log('wireAuthUI initialized');
  const email = document.getElementById('email');
  const pass = document.getElementById('pass');
  const signup = document.getElementById('signupBtn');
  const login = document.getElementById('loginBtn');
  const logout = document.getElementById('logoutBtn');
  const status = document.getElementById('authStatus');

  // Buttons may not exist on non-account routes - guard each
  signup?.addEventListener('click', async () => {
    try { await createUserWithEmailAndPassword(auth, email.value.trim(), pass.value.trim()); }
    catch (e) { alert(e.message); }
  });

  login?.addEventListener('click', async () => {
    try { await signInWithEmailAndPassword(auth, email.value.trim(), pass.value.trim()); }
    catch (e) { alert(e.message); }
  });

  logout?.addEventListener('click', async () => {
    await signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (status) status.textContent = user ? `Signed in as ${user.email}` : 'Not signed in';
    // Default routing: signed-out -> account, signed-in -> home
    if (user) {
      try { await ensureDirectory(user); } catch (e) { console.error(e); }
      showView('view-home');
      location.hash = '#/home';
    } else {
      // Show login/landing first; “Go to Account” jumps to account form
      showView(location.hash === '#/account' ? 'view-account' : 'view-login');
    }
  });

  // Initial paint in case onAuthStateChanged hasn’t fired yet
  if (!auth.currentUser) {
    showView(location.hash === '#/account' ? 'view-account' : 'view-login');
  }
}

// (optional) export for other modules that need db/auth
export { auth, db };

// Firebase auth state change handler
export function onAuthStateChangedHandler() {
  onAuthStateChanged(auth, async (user) => {
    window.isFsAuthed = !!user;
    window.fsUid = user ? user.uid : null;

    if (user) {
      // Handle user signed in
      try {
        await ensureDirectory(user);
        await refreshFirestoreData();
      } catch (error) {
        console.error("Error during auth state change:", error);
      }
    } else {
      // Handle user signed out
      clearFirestoreState();
    }
  });
}

// Sign out function
export function fsSignOut() {
  return signOut(auth);
}

// Add friend function
export async function fsAddFriend(uid, friendUid) {
  if (!uid || !friendUid || uid === friendUid) return false;
  await addDoc(collection(db, "users", uid, "friends"), {
    uid: friendUid,
    addedAt: serverTimestamp()
  });
  return true;
}

// Ensure directory entry exists for user
async function ensureDirectory(user) {
  if (!user) return;
  const ref = doc(db, 'directory', user.uid);
  let exists = false; 
  try { 
    const s = await getDoc(ref); 
    exists = s.exists(); 
  } catch {}
  const state = loadUserData(user.uid) || {};
  const displayName = state.profile?.name || (user.email || '').split('@')[0] || 'User';
  const payload = { 
    uid: user.uid, 
    emailLower: (user.email || '').toLowerCase(), 
    displayName, 
    name: displayName, 
    updatedAt: serverTimestamp() 
  };
  if (!exists) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

// Refresh Firestore data
async function refreshFirestoreData() {
  // Fetch and update Firestore data as needed
  console.log("Refreshing Firestore data...");
}

// Clear Firestore state when user signs out
function clearFirestoreState() {
  console.log("Clearing Firestore state...");
}

// Expose auth flags for classic scripts
window.isFsAuthed = false;
window.fsUid = null;

// Elements (if present)
const email = document.getElementById("email");
const pass  = document.getElementById("pass");
const signupBtn = document.getElementById("signup");
const loginBtn  = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const who   = document.getElementById("who");
const authBox = document.getElementById("authBox");
const logBox  = document.getElementById("logBox");

// Firestore refs
const logsCol  = (uid) => collection(db, 'users', uid, 'logs');
const daysCol  = (uid) => collection(db, 'users', uid, 'testDays');
const dirCol   = () => collection(db, 'directory');
const pubDoc   = (uid) => doc(db, 'usersPublic', uid);
const friendsCol = (uid) => collection(db, 'users', uid, 'friends');

// Public API for non-module scripts
window.refreshFs = refreshFs;
window.fsSignOut = fsSignOut;
window.fsAddFriend = fsAddFriend;
window.fsValidateUid = validateUid;
window.fsGetPublic = async (uid)=>{ try{ const s=await getDoc(pubDoc(uid)); return s.exists()?s.data():null; }catch{ return null } };

// Helpers
async function createLog(uid,payload){ return addDoc(logsCol(uid),{...payload,date:toTimestamp(payload.date),createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); }
async function updateLog(uid,logId,updates){ return setDoc(doc(db,'users',uid,'logs',logId),{...updates,...(updates.date?{date:toTimestamp(updates.date)}:{}),updatedAt:serverTimestamp()},{merge:true}); }
async function deleteLog(uid,logId){ return deleteDoc(doc(db,'users',uid,'logs',logId)); }
async function listAllLogs(uid){ const qy=query(logsCol(uid),orderBy('date','desc')); const snap=await getDocs(qy); return snap.docs.map(d=>({id:d.id,...d.data()})); }
async function listTestDays(uid){ const qy=query(daysCol(uid),orderBy('date','desc')); const snap=await getDocs(qy); return snap.docs.map(d=>({id:d.id,...d.data()})); }

async function findUidByEmail(email){ const emailLower=String(email||'').toLowerCase(); if(!emailLower) return null; const qy=query(dirCol(), where('emailLower','==',emailLower), limit(1)); const snap=await getDocs(qy); if(snap.empty) return null; return snap.docs[0].id; }
async function validateUid(uid){ try{ const [a,b]=await Promise.all([getDoc(pubDoc(uid)), getDoc(doc(db,'directory',uid))]); return (a.exists()||b.exists()); }catch{ return false; } }
async function addFriend(uid, friendUid){ if(!uid||!friendUid||uid===friendUid) return false; await setDoc(doc(db,'users',uid,'friends',friendUid),{uid:friendUid,addedAt:serverTimestamp()},{merge:true}); return true; }
async function removeFriend(uid, friendUid){ try{ await deleteDoc(doc(db,'users',uid,'friends',friendUid)); return true; }catch{ return false; } }

// Public profiles
function recognizedRowForName(name){ try{ return buildModel().find(r=>r.name===name); }catch{ return null } }
function valueFromLogForRow(log,row){ if(!row) return null; if(row.unit==='reps') return (typeof log.reps==='number')?log.reps:null; if(row.unit==='sec') return (typeof log.timeSec==='number')?log.timeSec:null; return null; }
function prsMapFromFSLogs(logs){ const map={}; const rows=buildModel(); logs.forEach(l=>{ const row=recognizedRowForName(l.exercise); if(!row) return; const key=nameToKey(row.name); const v=valueFromLogForRow(l,row); if(v==null) return; if(map[key]==null){ map[key]=v; } else { map[key] = row.dir==='higher' ? Math.max(map[key],v) : Math.min(map[key],v); } }); return map; }
function recentPRsFromFSLogs(logs){ const rows=buildModel(); const best={}; const out=[]; const sorted=logs.slice().sort((a,b)=>{ const da=a.date?.toDate? a.date.toDate():new Date(a.date); const db=b.date?.toDate? b.date.toDate():new Date(b.date); return da-db; }); sorted.forEach(l=>{ const row=recognizedRowForName(l.exercise); if(!row) return; const key=nameToKey(row.name); const v=valueFromLogForRow(l,row); if(v==null) return; const prev=best[key]; const better = prev==null ? true : (row.dir==='higher'? v>prev : v<prev); if(better){ best[key]=v; out.push({ label: row.name, value: v, unit: row.unit, date: (l.date?.toDate? l.date.toDate() : new Date(l.date)).toISOString().slice(0,10) }); } }); return out.slice(-12); }
async function publishPublicSummary(){ const user=auth.currentUser; if(!user) return; const st=loadUserData(user.uid)||{}; const share=!!(st.profile?.sharePRs); const base={ uid:user.uid, name:st.profile?.name || (user.email||'').split('@')[0] || 'User', sharePRs:share, updatedAt:serverTimestamp(), emailLower:(user.email||'').toLowerCase() }; if(!share){ await setDoc(pubDoc(user.uid), base, {merge:true}); return; } const prs=prsMapFromFSLogs(FS.logs||[]); const std = standardsFromModel(buildModel()); const scores = computeHeadlineScores(prs,std,{pft:['pullups','pushups','mile_3'], cft:['ammo_2min','run_800m','farmers_carry']}); const recentPRs = recentPRsFromFSLogs(FS.logs||[]); await setDoc(pubDoc(user.uid), { ...base, scores, recentPRs }, {merge:true}); }

// Realtime squad subscriptions
const PUB_CACHE = {}; const PUB_UNSUBS = {}; let FRIENDS_UNSUB=null; window.PUB_CACHE = PUB_CACHE; // reuse in classic code
function resubscribePublic(ids){ const set=new Set(ids); Object.keys(PUB_UNSUBS).forEach(uid=>{ if(!set.has(uid)){ try{ PUB_UNSUBS[uid](); }catch{} delete PUB_UNSUBS[uid]; delete PUB_CACHE[uid]; } }); ids.forEach(uid=>{ if(PUB_UNSUBS[uid]) return; PUB_UNSUBS[uid] = onSnapshot(pubDoc(uid),(snap)=>{ PUB_CACHE[uid]=snap.exists()?snap.data():null; try{ renderFireteam(); }catch{} }); }); }
function setupSquadRealtime(){ try{ Object.values(PUB_UNSUBS).forEach(u=>u()); }catch{} for(const k in PUB_UNSUBS) delete PUB_UNSUBS[k]; try{ FRIENDS_UNSUB && FRIENDS_UNSUB(); }catch{} FRIENDS_UNSUB=null; const user=auth.currentUser; if(!user) return; FRIENDS_UNSUB = onSnapshot(friendsCol(user.uid),(snap)=>{ const ids=snap.docs.map(d=>d.id); let s=loadUserData(user.uid)||{}; s.fireteam=s.fireteam||{}; s.fireteam.friends=ids; saveUserData(user.uid,s); resubscribePublic([user.uid,...ids]); try{ renderFireteam(); }catch{} }); resubscribePublic([user.uid,...((loadUserData(user.uid)||{}).fireteam?.friends||[])]); }

// Local FS state
const FS={ user:null, days:[], logs:[], currentDayId:null, dateFilter:null, editingLogId:null };

function normalizeFsLogs(){ const norm=[]; (FS.logs||[]).forEach(l=>{ const row=recognizedRowForName(l.exercise); if(!row) return; let value=null; if(row.unit==='reps') value = l.reps ?? null; else if(row.unit==='sec') value = l.timeSec ?? null; else { value=null; } if(value==null || isNaN(value)) return; const tp = tierAndPoints5(row.dir,value,row.prospect,row.std,row.strong,row.elite,row.max); norm.push({date:new Date(l.date?.toDate?l.date.toDate():l.date).toISOString().slice(0,10),exercise:exerciseKey(row),label:`${row.cat} — ${row.name}`,value,unit:row.unit,dir:row.dir,tier:tp.tier,pts:tp.pts,source:'fs'}); }); window.FS_LOGS = norm; }

function renderFs(){ const rows=buildModel(); const fsExercises=document.getElementById('fsExercises'); if(fsExercises){ fsExercises.innerHTML = rows.map(r=>`<option value=\"${r.name}\">`).join(''); }
  const fsDayList=document.getElementById('fsDayList'); if(fsDayList){ fsDayList.innerHTML=''; (FS.days||[]).forEach(d=>{ const li=document.createElement('li'); li.className='panel'; li.style.padding='8px'; const dt=new Date(d.date?.toDate?d.date.toDate():d.date); const label=`${d.title||'Test Day'} — ${dt.toLocaleDateString()}`; li.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div>${label}</div><div style="display:flex;gap:8px"><button class="rowbtn" data-act="open" data-id="${d.id}">Open</button><button class="rowbtn" data-act="rename" data-id="${d.id}">Rename</button><button class="rowbtn" data-act="delete" data-id="${d.id}">Delete</button></div></div>`; fsDayList.appendChild(li); }); }
  const fsLogList=document.getElementById('fsLogList'); const fsFilterLabel=document.getElementById('fsFilterLabel'); if(fsLogList){ fsLogList.innerHTML=''; let logs=FS.logs||[]; if(FS.currentDayId){ logs=logs.filter(l=>l.testDayId===FS.currentDayId); fsFilterLabel.textContent='Filtered by Test Day'; } else if(FS.dateFilter){ const dstr=FS.dateFilter; logs=logs.filter(l=>{ const d=new Date(l.date?.toDate?l.date.toDate():l.date); const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return s===dstr;}); fsFilterLabel.textContent=`Logs on ${new Date(dstr).toLocaleDateString()}`; } else { fsFilterLabel.textContent='All logs'; }
    logs.forEach(l=>{ const li=document.createElement('li'); li.className='panel'; li.style.padding='8px'; const dt=new Date(l.date?.toDate?l.date.toDate():l.date); const parts=[]; if(l.reps!=null) parts.push(`${l.reps} reps`); if(l.weight!=null) parts.push(`${l.weight} lb`); if(l.timeSec!=null) parts.push(`${Math.floor(l.timeSec/60)}:${String(Math.floor(l.timeSec%60)).padStart(2,'0')}`); li.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${l.exercise}</b> • ${parts.join(' • ')||'-'}<div class="muted">${dt.toLocaleString()}${l.testDayId?` • TD`:''}${l.notes?` • ${l.notes}`:''}</div></div></div>`; fsLogList.appendChild(li); }); }
  normalizeFsLogs(); try{ renderFireteam(); }catch{} try{ /* optional: progress refresh */ }catch{}
}

async function refreshFs(){ const user=auth.currentUser; if(!user) return; FS.days = await listTestDays(user.uid); FS.logs = await listAllLogs(user.uid); try{ const fr = await listFriends(user.uid); let s=loadUserData(user.uid)||{}; s.fireteam=s.fireteam||{}; s.fireteam.friends=fr; saveUserData(user.uid,s); }catch{} renderFs(); try{ await publishPublicSummary(); }catch{} try{ setupSquadRealtime(); }catch{} }

// Log modal expose (used by classic scripts)
window.openFsLogModal = function openFsLogModal(log){ const fsLogModal=document.getElementById('fsLogModal'); const fsLogTitle=document.getElementById('fsLogTitle'); const fsDate=document.getElementById('fsDate'); const fsExercise=document.getElementById('fsExercise'); const fsReps=document.getElementById('fsReps'); const fsWeight=document.getElementById('fsWeight'); const fsTime=document.getElementById('fsTime'); const fsNotes=document.getElementById('fsNotes'); const fsTestDay=document.getElementById('fsTestDay'); const fsDelete=document.getElementById('fsDelete'); FS.editingLogId = log?.id || null; if(fsLogTitle) fsLogTitle.textContent = FS.editingLogId ? 'Edit Log' : 'Add Log'; const now=new Date(); const toLocal=(d)=>{ const z=new Date(d); z.setMinutes(z.getMinutes()-z.getTimezoneOffset()); return z.toISOString().slice(0,16); }; if(fsDate) fsDate.value = toLocal(log?.date?.toDate?log.date.toDate(): (log?.date||now)); if(fsExercise) fsExercise.value = log?.exercise || ''; if(fsReps) fsReps.value = log?.reps ?? ''; if(fsWeight) fsWeight.value = log?.weight ?? ''; if(fsTime) fsTime.value = log?.timeSec!=null ? `${Math.floor(log.timeSec/60)}:${String(Math.floor(log.timeSec%60)).padStart(2,'0')}` : ''; if(fsNotes) fsNotes.value = log?.notes || ''; renderFs(); if(fsTestDay) fsTestDay.value = (log?.testDayId || FS.currentDayId || ''); if(fsDelete) fsDelete.style.display = FS.editingLogId ? '' : 'none'; if(fsLogModal) fsLogModal.style.display='flex'; }
window.setFsCurrentDayId = (id)=>{ FS.currentDayId=id||null; FS.dateFilter=null; renderFs(); };
window.setFsDateFilter = (dateStr)=>{ FS.dateFilter=dateStr||null; FS.currentDayId=null; renderFs(); };

// Auto-boot so index.html doesn’t need to import anything
wireAuthUI();
