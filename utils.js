// Shared utilities used by both classic scripts and modules
// Exported for module imports; also attach to window.U for optional global access.

export const toTimestamp = (date) => (date instanceof Date ? date : new Date(date));

// Parse time in mm:ss or hh:mm:ss (minutes:seconds standard)
export function parseTime(s){
  if(!s) return null;
  const parts = String(s).split(':').map(n=>parseInt(n,10)||0);
  return parts.reduce((acc,n)=>acc*60+n,0);
}

export const fmtDT = (d) => new Date(d).toLocaleString();
export const numOrNull = (v)=>{ const n=Number(v); return Number.isFinite(n)?n:null; };

export function showToast(msg){
  try{
    const t=document.createElement('div');
    t.className='app-toast';
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    t.textContent=msg;
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),250); }, 2200);
  }catch{}
}

export function showToastAction(msg,label,action){
  try{
    const t=document.createElement('div');
    t.className='app-toast';
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    const span=document.createElement('span'); span.textContent=msg;
    const a=document.createElement('span'); a.className='toast-act'; a.textContent=label;
    a.onclick=()=>{ try{ action?.(); }finally{ t.classList.remove('show'); setTimeout(()=>t.remove(),200);} };
    t.appendChild(span); t.appendChild(a);
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),250); }, 4000);
  }catch{}
}

// Formatting helpers
export const fmtSecs = (v)=>{ const m=Math.floor(v/60), s=Math.round(v%60); return `${m}:${String(s).padStart(2,'0')}`; };
export function fmtDate(iso){ try{ const d=new Date(iso); if(!isFinite(d)) return iso; return d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch{ return iso } }

// Avatars
export function hashCode(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
export function avatarHTML(name, uid){ const ini=((name||'U').trim()[0]||'U').toUpperCase(); const colors=['#2bd9b8','#6aa9ff','#f3c355','#ff6aa9','#79c389','#6fc2d0']; const idx=hashCode(String(uid||name||'x'))%colors.length; const bg=colors[idx]; return `<span class="avatar" style="background:${bg};color:#0b1311">${ini}</span>`; }

// Optional global attachment
try{ window.U = { toTimestamp, parseTime, fmtDT, numOrNull, showToast, showToastAction, fmtSecs, fmtDate, avatarHTML, hashCode }; }catch{}
