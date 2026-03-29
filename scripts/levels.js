/**
 * GridX Level Management
 * ----------------------
 * Handles loading, progress saving, and rendering of levels.
 */

window.GridX.LevelManager = {
  // --- Data Loading & Progress ---
  async init() {
    try {
      const response = await fetch("levels.json");
      if (!response.ok) throw new Error("Could not load levels.json");
      window.GridX.State.levels = await response.json();
    } catch (err) {
      window.GridX.Logger.log("Error loading levels. Are you running this via a local server?", "error");
    }
  },

  saveProgress() {
    localStorage.setItem("gridx_level", window.GridX.State.currentLevelIndex);
  },

  loadProgress() {
    const saved = localStorage.getItem("gridx_level");
    if (saved !== null) {
      window.GridX.State.currentLevelIndex = parseInt(saved);
    }
  },

  // --- Level Rendering ---
  loadLevel(index) {
    const level = window.GridX.State.levels[index];
    if (!level) return;

    // Reset State
    const state = window.GridX.State;
    state.currentLevelIndex = index;
    state.collectedItems = [];
    state.doorUnlocked = false;
    state.gridSize = level.gridSize;
    state.playerPos = { ...level.start };
    this.saveProgress();

    // Reset UI
    this.setupGridDimensions(level.gridSize);
    this.renderLevelElements(level);
    this.updateLevelUI(level);

    if (window.GridX.PlayerControl) {
      window.GridX.PlayerControl.resetRepresentation();
    }
    
    if (window.editor) {
      window.editor.setValue("// " + level.description + "\n");
    }

    window.GridX.Logger.clear();
    window.GridX.Logger.log(`Level ${level.id}: ${level.title}`, "info");
    window.GridX.Logger.log(level.description, "info");
  },

  setupGridDimensions(size) {
    const grid = window.GridX.DOM.grid;
    document.documentElement.style.setProperty("--grid-cols", size);
    document.documentElement.style.setProperty("--grid-rows", size);
    
    // Clear old elements (keep player)
    const elementsToRemove = grid.querySelectorAll(".grid-wall, .grid-goal, .grid-item, .grid-box");
    elementsToRemove.forEach(el => el.remove());
  },

  renderLevelElements(level) {
    const grid = window.GridX.DOM.grid;

    // Walls
    level.walls.forEach(wall => {
      this.createGridElement("grid-wall", wall.x, wall.y, {
        backgroundColor: "#f8fafc",
        border: "1px solid var(--border-light)"
      });
    });

    // Boxes
    window.GridX.State.activeBoxes = JSON.parse(JSON.stringify(level.boxes || []));
    window.GridX.State.activeBoxes.forEach((box, i) => {
      const div = this.createGridElement("grid-box", box.x, box.y);
      div.id = `box-${i}`;
      div.innerHTML = `<img src="imges/box.png" alt="Box" />`;
    });

    // Goal
    const goalDiv = this.createGridElement("grid-goal", level.goal.x, level.goal.y);
    goalDiv.id = "level-goal";
    if (level.goal.locked) {
      goalDiv.innerHTML = `<img src="imges/looked.png" alt="Locked Door" />`;
      goalDiv.classList.add("locked");
    } else {
      goalDiv.innerHTML = `<img src="imges/door.png" alt="Door" />`;
    }

    // Items
    level.items.forEach((item, i) => {
      const div = this.createGridElement("grid-item", item.x, item.y);
      div.dataset.itemIndex = i;
      div.dataset.itemType = item.type;
      if (item.type === "key") div.innerHTML = `<img src="imges/key.png" alt="Key" />`;
    });
  },

  createGridElement(className, x, y, styles = {}) {
    const div = document.createElement("div");
    div.className = className;
    div.style.gridColumn = x + 1;
    div.style.gridRow = y + 1;
    Object.assign(div.style, styles);
    window.GridX.DOM.grid.appendChild(div);
    return div;
  },

  updateLevelUI(level) {
    const { DOM, State } = window.GridX;
    if (DOM.levelTitle) DOM.levelTitle.textContent = `${level.id} - ${level.title}`;
    if (DOM.levelDesc) DOM.levelDesc.textContent = level.description;
    if (DOM.levelNum) DOM.levelNum.textContent = `${level.id} / ${State.levels.length}`;

    document.querySelectorAll(".level-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === State.currentLevelIndex);
      dot.classList.toggle("completed", i < State.currentLevelIndex);
    });
  },

  // --- Grid Utilities ---
  isWall(x, y) {
    const level = window.GridX.State.levels[window.GridX.State.currentLevelIndex];
    return level?.walls.some(w => w.x === x && w.y === y);
  },

  isBoxAt(x, y) {
    return window.GridX.State.activeBoxes.some(b => b.x === x && b.y === y);
  },

  getBoxIndexAt(x, y) {
    return window.GridX.State.activeBoxes.findIndex(b => b.x === x && b.y === y);
  },

  isValidPosition(x, y) {
    const size = window.GridX.State.gridSize;
    return x >= 0 && x < size && y >= 0 && y < size;
  }
};

// Backward compatibility (optional, but safer during refactor)
window.initLevels = window.GridX.LevelManager.init.bind(window.GridX.LevelManager);
window.loadLevel = window.GridX.LevelManager.loadLevel.bind(window.GridX.LevelManager);
window.loadProgress = window.GridX.LevelManager.loadProgress.bind(window.GridX.LevelManager);
window.prevLevel = () => window.GridX.LevelManager.loadLevel(window.GridX.State.currentLevelIndex - 1);
window.nextLevel = () => window.GridX.LevelManager.loadLevel(window.GridX.State.currentLevelIndex + 1);
window.isWall = window.GridX.LevelManager.isWall.bind(window.GridX.LevelManager);
window.isBoxAt = window.GridX.LevelManager.isBoxAt.bind(window.GridX.LevelManager);
window.showHint = () => {
  const level = window.GridX.State.levels[window.GridX.State.currentLevelIndex];
  if (level) window.GridX.Logger.log("💡 Hint: " + level.hint, "info");
};
