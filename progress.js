// progress.js — extracted without behavior changes

export let PROG_CHART;

export function renderProgress(){
  const rows=(window.filterRows?window.filterRows(window.buildModel()):window.buildModel());
  const sel=document.querySelector('#progExercise');
  if(sel) sel.innerHTML=rows.map(r=>`<option value="${(window.exerciseKey?window.exerciseKey(r):r.name)}">${r.name}</option>`).join("");
  if(!rows.length){ document.querySelector('#calendar').innerHTML="No selected exercises. Open Profile and choose some."; document.querySelector('#progMeters').innerHTML=""; document.querySelector('#progTimeline').innerHTML=""; return; }
  drawCalendar();
  // Build meters for each selected exercise
  const wrap=document.querySelector("#progMeters"); if(wrap) wrap.innerHTML="";
  rows.forEach((row,i)=>{
    const pr=(window.bestFor?window.bestFor(row):null);
    const label=row.name.split(" (")[0];
    const right=pr? (row.unit==="sec"?(window.fmtSecs?window.fmtSecs(pr.value):pr.value):(row.unit==="xBW"?Number(pr.value).toFixed(2):String(pr.value))) : "-";
    const blk=document.createElement("div"); blk.style.margin="10px 0";
    blk.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center\"><div><b>${label}</b></div><div class=\"muted\">${right}</div></div>
    <div class=\"level-meter\" id=\"pmeter-${i}\"><div class=\"fill\" id=\"pfill-${i}\"></div><div class=\"tick\" style=\"left:20%\"></div><div class=\"tick\" style=\"left:40%\"></div><div class=\"tick\" style=\"left:70%\"></div><div class=\"tick\" style=\"left:90%\"></div><div class=\"marker\" id=\"pmark-${i}\" style=\"left:0%\"></div></div>
    <div class="muted" style="margin-top:4px">Streak: ${(window.weeksStreakFor?window.weeksStreakFor((window.exerciseKey?window.exerciseKey(row):row.name)):0) || 0} week${((window.weeksStreakFor?window.weeksStreakFor((window.exerciseKey?window.exerciseKey(row):row.name)):0)||0)===1?"":"s"}</div>`;
    if(wrap) wrap.appendChild(blk);
    const curr = pr?.value;
    let tier = curr!=null? window.tierAndPoints5(row.dir,curr,row.prospect,row.std,row.strong,row.elite,row.max).tier : "-";
    const band = window.bandForTier?window.bandForTier(tier):{mid:0,end:0};
    const mark=document.querySelector("#pmark-"+i); if(mark) mark.style.left=Math.round(band.mid*100)+"%";
    const pf=document.querySelector("#pfill-"+i); if(pf){ pf.style.width=Math.round(band.end*100)+"%"; }
  });
  // PR timeline for all exercises
  const tl=document.querySelector("#progTimeline"); if(tl){ tl.innerHTML=""; (window.extractPRTimeline?window.extractPRTimeline():[]).forEach(l=>{const chip=document.createElement("div"); chip.className="chip-sm"; const row=(window.buildModel?window.buildModel():[]).find(r=>(window.exerciseKey?window.exerciseKey(r):r.name)===l.exercise); const val=row?.unit==="sec"?(window.fmtSecs?window.fmtSecs(l.value):l.value):(row?.unit==="xBW"?Number(l.value).toFixed(2):String(l.value)); chip.textContent = `${l.label.split(' — ')[1]} • ${val} • ${l.date}`; tl.appendChild(chip)}); }
}

export function drawCalendar(){
  const CAL_OFFSET = window.CAL_OFFSET||0;
  const base = new Date(); base.setMonth(base.getMonth()+CAL_OFFSET);
  const ms = window.monthStart?window.monthStart(base):new Date(base.getFullYear(),base.getMonth(),1);
  const me = window.monthEnd?window.monthEnd(base):new Date(base.getFullYear(),base.getMonth()+1,0);
  const year = ms.getFullYear(), month = ms.getMonth();
  const firstDow = (ms.getDay()+6)%7; // Monday-start
  const days = me.getDate();
  const state=window.state||{};
  const sessions = (state.sessions||[]).filter(s=>{ const d=new Date(s.date); return d.getFullYear()===year && d.getMonth()===month; });
  const FSDAYS = (window.FS_DAYS||[]).filter(x=>{ const d=new Date(x.date?.toDate?x.date.toDate():x.date); return d.getFullYear()===year && d.getMonth()===month; });
  const FSLOGS = (window.FS_RAW_LOGS||[]);

  const grid=document.createElement("div"); grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(7,1fr)"; grid.style.gap="6px";
  const header=document.createElement('div'); header.style.display='flex'; header.style.alignItems='center'; header.style.justifyContent='space-between'; header.style.margin='0 0 8px 0';
  const title=document.createElement('div'); title.style.fontWeight='800'; title.style.fontFamily='Inter'; title.textContent=ms.toLocaleString('en-US',{month:'long',year:'numeric'});
  const nav=document.createElement('div'); nav.style.display='flex'; nav.style.gap='6px';
  const prevBtn=document.createElement('button'); prevBtn.className='rowbtn'; prevBtn.textContent='‹ Prev'; prevBtn.addEventListener('click',()=>{ window.CAL_OFFSET=(window.CAL_OFFSET||0)-1; drawCalendar(); });
  const todayBtn=document.createElement('button'); todayBtn.className='rowbtn'; todayBtn.textContent='Today'; todayBtn.addEventListener('click',()=>{ window.CAL_OFFSET=0; drawCalendar(); });
  const nextBtn=document.createElement('button'); nextBtn.className='rowbtn'; nextBtn.textContent='Next ›'; nextBtn.addEventListener('click',()=>{ window.CAL_OFFSET=(window.CAL_OFFSET||0)+1; drawCalendar(); });
  nav.appendChild(prevBtn); nav.appendChild(todayBtn); nav.appendChild(nextBtn);
  header.appendChild(title); header.appendChild(nav);
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d=>{ const c=document.createElement("div"); c.className="muted"; c.textContent=d; grid.appendChild(c); });
  for(let i=0;i<firstDow;i++){ grid.appendChild(document.createElement("div")); }
  for(let d=1; d<=days; d++){
    const cell=document.createElement("div"); cell.className="panel cal-cell"; cell.style.padding="8px";
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const has = sessions.find(s=>s.date===dateStr);
    const dayMatch = (x)=>{ const dt=new Date(x.date?.toDate?x.date.toDate():x.date); return dt.getFullYear()===year && dt.getMonth()===month && dt.getDate()===d; };
    const fsDay = FSDAYS.find(dayMatch);
    const logsCountFS = FSLOGS.filter(l=>{ const dt=new Date(l.date?.toDate?l.date.toDate():l.date); if(isNaN(dt)) return false; const Y=dt.getFullYear(), M=dt.getMonth(), D=dt.getDate(); return Y===year && M===month && D===d; }).length;
    const logsCountLocal = (state.logs||[]).filter(l=>{ const dt=new Date(l.date+'T00:00:00'); if(isNaN(dt)) return false; const Y=dt.getFullYear(), M=dt.getMonth(), D=dt.getDate(); return Y===year && M===month && D===d; }).length;
    const logsCount = logsCountFS + logsCountLocal;
    const tag = has || fsDay ? '<span class="badge b-strong">Test</span>' : (logsCount?`<span class="badge">${logsCount} logs</span>`:'');
    if(has || fsDay || logsCount>0) cell.classList.add('has-logs');
    const sub = has ? `<div class="muted" style="margin-top:6px">Avg: <b>${has.avgPts}</b></div>` : '';
    cell.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${d}</b></div>${tag}</div>${sub}`;
    cell.style.cursor='pointer';
    cell.addEventListener('click',()=>{
      if(window.openFsLogModal && window.isFsAuthed){ if(window.setFsDateFilter) window.setFsDateFilter(dateStr); if(logsCount===0){ window.openFsLogModal({date:new Date(dateStr), testDayId: fsDay?.id||null}); } try{ document.getElementById('logBox')?.scrollIntoView({behavior:'smooth', block:'start'}); }catch{} }
      else if(has){ alert(`Test Day ${window.fmtDate?window.fmtDate(dateStr):dateStr}\nAverage: ${has.avgPts}\nEntries: ${has.entries.length}`); }
      else { alert(`${window.fmtDate?window.fmtDate(dateStr):dateStr}\nSign in (Account box) to add/edit logs for this day.`); }
    });
    grid.appendChild(cell);
  }
  const cal = document.querySelector("#calendar"); if(cal){ cal.innerHTML=""; cal.appendChild(header); cal.appendChild(grid); }
}

export function drawProgChart(exKey){
  const rows=(window.buildModel?window.buildModel():[]);
  const row=rows.find(r=>(window.exerciseKey?window.exerciseKey(r):r.name)===exKey)|| (window.filterRows?window.filterRows(rows)[0]:rows[0]);
  const logs=(window.state?.logs||[]).filter(l=>l.exercise===exKey).sort((a,b)=>a.date.localeCompare(b.date));
  const last30=logs.filter(l=>{const d=new Date(l.date), now=new Date(); return (now-d)<=30*86400000});
  const labels=last30.map(l=>l.date), values=last30.map(l=> l.unit==="sec"? l.value/60 : l.value);
  const ms=window.monthStart?window.monthStart():new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const me=window.monthEnd?window.monthEnd():new Date(new Date().getFullYear(),new Date().getMonth()+1,0);
  const mlogs=logs.filter(l=>{const d=new Date(l.date); return d>=ms && d<=me});
  const bestEl=document.querySelector('#bestThisMonth');
  if(mlogs.length){let best=mlogs[0]; mlogs.forEach(l=>{if(row.dir==="higher"){if(l.value>best.value) best=l;} else {if(l.value<best.value) best=l;}}); if(bestEl) bestEl.textContent=row.unit==="sec"?(window.fmtSecs?window.fmtSecs(best.value):best.value):(row.unit==="xBW"?Number(best.value).toFixed(2):String(best.value));} else { if(bestEl) bestEl.textContent="-"}
  const ctx=document.querySelector("#progChart")?.getContext?.("2d"); if(!ctx || !window.Chart) return;
  if(PROG_CHART) PROG_CHART.destroy();
  PROG_CHART=new Chart(ctx,{type:"line",data:{labels,datasets:[{label:"Your Result",data:values,borderWidth:2,tension:.2}]},options:{responsive:true,scales:{y:{title:{display:true,text:row.unit==="sec"?"Minutes":(row.unit==="xBW"?"x Bodyweight":row.unit)}},x:{title:{display:true,text:"Date"}}},plugins:{legend:{display:false}}}});
}

// No global bridges here; temporary assignment happens in bootstrap.js
