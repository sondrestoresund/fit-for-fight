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

// Optional global attachment
try{ window.U = { toTimestamp, parseTime, fmtDT, numOrNull, showToast, showToastAction }; }catch{}

