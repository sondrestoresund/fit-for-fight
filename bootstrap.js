// bootstrap.js — temporary bridge for classic code
import { renderFireteam, renderCompare } from './fireteam.js';
import { renderProgress, drawCalendar, drawProgChart } from './progress.js';

// Attach to window for existing inline script usage
window.renderFireteam = renderFireteam;
window.renderCompare  = renderCompare;
window.renderProgress = renderProgress;
window.drawCalendar   = drawCalendar;
window.drawProgChart  = drawProgChart;

