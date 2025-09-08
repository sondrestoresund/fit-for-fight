// Squad module (phase 2 small extraction)
// Provides bindings for Squad UI and exposes render functions if needed.

// Prefer existing global renderers if defined in classic script
export function renderFireteam(){
  if(typeof window.renderFireteam === 'function') return window.renderFireteam();
}

export function renderCompare(uid){
  if(typeof window.renderCompare === 'function') return window.renderCompare(uid);
}

// Bind Friends list remove handler once
export function bindFriendsList(){
  const fl = document.getElementById('friendsList');
  if(!fl || window.__friendsListBound) return; window.__friendsListBound = true;
  fl.addEventListener('click', async (e)=>{
    const b = e.target.closest('button[data-remove]'); if(!b) return;
    const friendUid=b.dataset.remove; const me=window.fsUid; if(!me) return;
    if(confirm('Remove this friend?')){ try{ await window.removeFriend?.(me,friendUid); await window.refreshFs?.(); }catch{} }
  });
}

// Auto-bind after import
try{ bindFriendsList(); }catch{}

