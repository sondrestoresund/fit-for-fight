// fireteam.js — extracted without behavior changes

export async function renderFireteam(){
  (window.ensureFireteam||function(){})();
  document.getElementById("inviteCode").textContent = (window.inviteCode||(()=>'-'))();
  const me=(window.activeUID||(()=>null))();
  const friends=(window.fireteamFriends||(()=>[]))();
  const uids=[me,...friends].filter(Boolean);
  // Prefer realtime cache; fallback to fetch via window.fsGetPublic
  const docs = await Promise.all(uids.map(async (uid)=>{
    const cached = (window.PUB_CACHE&&window.PUB_CACHE[uid])||null;
    if(cached) return {uid,doc:cached};
    if(window.fsGetPublic){ try{ const d=await window.fsGetPublic(uid); return {uid,doc:d}; }catch{} }
    return {uid,doc:null};
  }));
  // Leaderboard by OVERALL score
  const ranks = docs.map(({uid,doc})=>({ uid, name: doc?.name || (uid===me?'You':'Friend'), score: doc?.scores?.OVERALL?.score || 0 })).sort((a,b)=>b.score-a.score);
  const lb=document.getElementById("ftLeaderboard"); if(lb){ lb.innerHTML=""; ranks.forEach(r=>{const chip=document.createElement('div'); chip.className='chip-sm'; chip.innerHTML=`${(window.avatarHTML||(()=>''))(r.name,r.uid)}<span>${r.name}: ${r.score}</span>`; lb.appendChild(chip)}); }
  // Friends list with remove buttons
  const fl = document.getElementById('friendsList'); if(fl){
    fl.innerHTML='';
    const friendsOnly = uids.filter(u=>u!==me);
    if(!friendsOnly.length){ const li=document.createElement('li'); li.className='muted'; li.textContent='No friends yet.'; fl.appendChild(li); }
    friendsOnly.sort((u1,u2)=>{ const a=(docs.find(x=>x.uid===u1)?.doc?.name||'').toLowerCase(); const b=(docs.find(x=>x.uid===u2)?.doc?.name||'').toLowerCase(); return a.localeCompare(b); });
    friendsOnly.forEach(uid=>{
      const d=(docs.find(x=>x.uid===uid)?.doc)||{}; const name=d?.name||uid.slice(0,6);
      const li=document.createElement('li'); li.className='panel'; li.style.padding='8px'; li.style.display='flex'; li.style.justifyContent='space-between'; li.style.alignItems='center';
      li.innerHTML=`<div style="display:flex;align-items:center;gap:8px">${(window.avatarHTML||(()=>''))(name,uid)}<span>${name}</span></div><div><button class='rowbtn' data-remove='${uid}'>Remove</button></div>`;
      fl.appendChild(li);
    });
  }
  // PR Feed from recentPRs
  const feed=document.getElementById("ftFeed"); if(feed){ feed.innerHTML=""; const items=[]; docs.forEach(({uid,doc})=>{ if(!doc || doc.sharePRs===false) return; (doc.recentPRs||[]).forEach(x=>items.push({uid,name:doc.name||'Friend',label:x.label,value:x.value,unit:x.unit,date:x.date})) }); items.sort((a,b)=>b.date.localeCompare(a.date)); items.slice(0,20).forEach(it=>{const chip=document.createElement('div'); chip.className='chip-sm'; const val= it.unit==='sec'? (window.fmtSecs?window.fmtSecs(it.value):it.value) : (it.unit==='xBW'?Number(it.value).toFixed(2):String(it.value)); chip.innerHTML=`${(window.avatarHTML||(()=>''))(it.name,it.uid)}<span>${it.name} • PR: ${it.label} • ${val} • ${(window.fmtDate?window.fmtDate(it.date):it.date)}</span>`; feed.appendChild(chip)}); }
  // Compare list (names from directory/public)
  const cmp=document.getElementById("compareWith"); if(cmp){ cmp.innerHTML = docs.filter(d=>d.uid!==me).sort((a,b)=>{ const an=(a.doc?.name||'').toLowerCase(), bn=(b.doc?.name||'').toLowerCase(); return an.localeCompare(bn); }).map(({uid,doc})=>`<option value="${uid}">${doc?.name||'Friend'}</option>`).join(''); cmp.addEventListener('change',()=> (window.renderCompare||renderCompare)(cmp.value),{once:true}); if(cmp.value) (window.renderCompare||renderCompare)(cmp.value); }
}

export async function renderCompare(uid){
  const c=document.getElementById("compareTable"); if(!c) return; c.innerHTML='';
  const me=(window.activeUID||(()=>null))();
  const meDoc = (window.PUB_CACHE&&window.PUB_CACHE[me]) || (window.fsGetPublic? await window.fsGetPublic(me): null) || {};
  const frDoc = (window.PUB_CACHE&&window.PUB_CACHE[uid]) || (window.fsGetPublic? await window.fsGetPublic(uid): null) || {};
  const wrap=document.createElement('div');
  const fmtv=(x)=> x.unit==='sec' ? (window.fmtSecs?window.fmtSecs(x.value):x.value) : (x.unit==='xBW'?Number(x.value).toFixed(2):String(x.value));
  wrap.innerHTML = `
    <div class="grid grid-2">
      <div class="panel">
        <h3 style="margin:0">${meDoc.name||'You'}</h3>
        <div class="chips" style="margin-top:6px">
          <div class="chip-sm">Overall: ${meDoc.scores?.OVERALL?.score ?? '-'}</div>
          <div class="chip-sm">PFT: ${meDoc.scores?.PFT?.score ?? '-'}</div>
          <div class="chip-sm">CFT: ${meDoc.scores?.CFT?.score ?? '-'}</div>
        </div>
        <div class="muted" style="margin-top:6px">Recent PRs</div>
        <div class="chips" style="margin-top:6px">${(meDoc.recentPRs||[]).slice(-6).map(x=>`<div class='chip-sm'>${x.label} • ${fmtv(x)}</div>`).join('')}</div>
      </div>
      <div class="panel">
        <h3 style="margin:0">${frDoc.name||'Friend'}</h3>
        <div class="chips" style="margin-top:6px">
          <div class="chip-sm">Overall: ${frDoc.scores?.OVERALL?.score ?? '-'}</div>
          <div class="chip-sm">PFT: ${frDoc.scores?.PFT?.score ?? '-'}</div>
          <div class="chip-sm">CFT: ${frDoc.scores?.CFT?.score ?? '-'}</div>
        </div>
        <div class="muted" style="margin-top:6px">Recent PRs</div>
        <div class="chips" style="margin-top:6px">${(frDoc.recentPRs||[]).slice(-6).map(x=>`<div class='chip-sm'>${x.label} • ${fmtv(x)}</div>`).join('')}</div>
      </div>
    </div>`;
  c.appendChild(wrap);
}

// No global bridges here; temporary assignment happens in bootstrap.js
