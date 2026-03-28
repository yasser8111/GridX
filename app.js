/**
 * GridX - Main Application Entry Point
 * -----------------------------------
 * This script initializes GridX when it is loaded via script-tags.
 * Using a simple initialization approach for maximum universal compatibility.
 */

(function() {
    function init() {
        if (window.updatePlayerPosition) {
            window.updatePlayerPosition();
        }
        if (window.setupUI) {
            window.setupUI();
        }
        console.log('GridX initialized in classic mode.');
    }

    // Wait for the DOM and all other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
