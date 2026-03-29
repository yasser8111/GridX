/**
 * GridX Logger System
 * -------------------
 * Handles console-like output to the terminal element.
 */

window.GridX.Logger = {
  log(message, type = 'info') {
    const output = window.GridX.DOM.outputLog;
    if (!output) return;

    const p = document.createElement('p');
    p.className = `log-${type}`;
    p.innerText = `> ${message}`;
    
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
    
    // Also log to browser console for developer convenience
    if (type === 'error') console.error(message);
  },

  clear() {
    const output = window.GridX.DOM.outputLog;
    if (output) output.innerHTML = '';
  }
};

// Global shortcuts for easier internal calling
window.log = window.GridX.Logger.log;
window.clearLog = window.GridX.Logger.clear;
