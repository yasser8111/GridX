/**
 * GridX - Main Application Entry Point
 * -----------------------------------
 * Initializes the game: loads saved progress, sets up UI, and loads the current level.
 */

(function () {
  async function init() {
    const { UI, LevelManager, DOM, State } = window.GridX;

    // 1. Setup UI (CodeMirror, buttons, etc.)
    if (UI) UI.init();
    
    // 2. Load levels from JSON
    if (LevelManager) await LevelManager.init();

    // 3. Load saved progress
    if (LevelManager) LevelManager.loadProgress();

    // 4. Generate level dots
    const dotsContainer = document.getElementById("level-dots");
    if (dotsContainer && State.levels) {
      State.levels.forEach((level, i) => {
        const dot = document.createElement("button");
        dot.className = "level-dot";
        dot.title = `Level ${level.id}: ${level.title}`;
        dot.addEventListener("click", () => LevelManager.loadLevel(i));
        dotsContainer.appendChild(dot);
      });
    }

    // 5. Global Actions
    const binds = [
        { id: "prev-level-btn", action: window.prevLevel },
        { id: "next-level-btn", action: window.nextLevel },
        { id: "hint-btn", action: window.showHint }
    ];

    binds.forEach(bind => {
        const el = document.getElementById(bind.id);
        if (el) el.addEventListener("click", bind.action);
    });

    const winOverlay = DOM.winOverlay;
    if (winOverlay) {
      winOverlay.addEventListener("click", (e) => {
        if (e.target === winOverlay) winOverlay.classList.remove("active");
      });
    }

    // 6. Start the game!
    if (LevelManager) LevelManager.loadLevel(State.currentLevelIndex || 0);

    console.log("GridX Core initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
