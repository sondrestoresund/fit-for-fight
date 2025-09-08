// Progress module (phase 2 small extraction)
// Delegates to existing global functions while preparing for fuller extraction.

export function renderProgress(){
  if(typeof window.renderProgress === 'function') return window.renderProgress();
}

export function drawCalendar(){
  if(typeof window.drawCalendar === 'function') return window.drawCalendar();
}

// Nothing else yet; keeping footprint tiny for incremental migration.

