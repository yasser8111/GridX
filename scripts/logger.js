// Logger Module
window.log = function(message, type = 'info') {
    if (!window.OUTPUT_LOG) return;
    const p = document.createElement('p');
    p.className = `log-${type}`;
    p.innerText = `> ${message}`;
    window.OUTPUT_LOG.appendChild(p);
    window.OUTPUT_LOG.scrollTop = window.OUTPUT_LOG.scrollHeight;
};

window.clearLog = function() {
    if (window.OUTPUT_LOG) {
        window.OUTPUT_LOG.innerHTML = '';
    }
};
