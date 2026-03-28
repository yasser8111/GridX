/**
 * GridX - Main Application Entry Point
 * -----------------------------------
 * Initializes the game: loads saved progress, sets up UI, and loads the current level.
 */

(function () {
  async function init() {
    // Setup UI first (CodeMirror, buttons, etc.)
    if (window.setupUI) {
      window.setupUI();
    }
    
    // Fetch levels JSON
    if (window.initLevels) {
      await window.initLevels();
    }

    // Load saved progress
    if (window.loadProgress) {
      window.loadProgress();
    }

    // Generate level dots
    const dotsContainer = document.getElementById("level-dots");
    if (dotsContainer && window.LEVELS) {
      window.LEVELS.forEach((level, i) => {
        const dot = document.createElement("button");
        dot.className = "level-dot";
        dot.title = `Level ${level.id}: ${level.title}`;
        dot.addEventListener("click", () => {
          window.loadLevel(i);
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Level nav buttons
    const prevBtn = document.getElementById("prev-level-btn");
    const nextBtn = document.getElementById("next-level-btn");
    const hintBtn = document.getElementById("hint-btn");
    const nextOverlay = document.getElementById("next-level-overlay-btn");

    if (prevBtn) prevBtn.addEventListener("click", window.prevLevel);
    if (nextBtn) nextBtn.addEventListener("click", window.nextLevel);
    if (hintBtn) hintBtn.addEventListener("click", window.showHint);
    if (nextOverlay) {
      nextOverlay.addEventListener("click", () => {
        document.getElementById("win-overlay").classList.remove("active");
        window.nextLevel();
      });
    }

    const winOverlay = document.getElementById("win-overlay");
    if (winOverlay) {
      winOverlay.addEventListener("click", (e) => {
        if (e.target === winOverlay) {
          winOverlay.classList.remove("active");
        }
      });
    }

    // Load the current level
    if (window.loadLevel) {
      window.loadLevel(window.currentLevel || 0);
    }

    console.log("GridX initialized with levels system.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
