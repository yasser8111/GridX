/**
 * GridX Core Configuration & State
 * --------------------------------
 * Centralized namespace to avoid global scope pollution.
 */

window.GridX = {
  // DOM Cache
  DOM: {
    player: document.getElementById('player'),
    codeInput: document.getElementById('code-input'),
    runBtn: document.getElementById('run-btn'),
    resetBtn: document.getElementById('reset-btn'),
    outputLog: document.getElementById('output-log'),
    grid: document.getElementById('grid'),
    winOverlay: document.getElementById('win-overlay'),
    levelTitle: document.getElementById('level-title'),
    levelDesc: document.getElementById('level-desc'),
    levelNum: document.getElementById('level-num')
  },

  // Game Constants
  Config: {
    animationSpeed: 500,
    defaultGridSize: 8
  },

  // Live Game State
  State: {
    levels: [],
    currentLevelIndex: 0,
    playerPos: { x: 0, y: 0 },
    activeBoxes: [],
    collectedItems: [],
    doorUnlocked: false,
    isRunning: false,
    stopExecution: false,
    gridSize: 8
  }
};

// Backward compatibility (optional, but safer during refactor)
window.GRID_SIZE = window.GridX.State.gridSize;
window.PLAYER_ELEM = window.GridX.DOM.player;
window.CODE_INPUT = window.GridX.DOM.codeInput;
window.RUN_BTN = window.GridX.DOM.runBtn;
window.OUTPUT_LOG = window.GridX.DOM.outputLog;
