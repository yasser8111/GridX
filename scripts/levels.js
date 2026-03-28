// Levels System Module
// Each level has: grid size, player start, goal, walls, hint, and description

window.LEVELS = [];

window.initLevels = async function () {
  try {
    const response = await fetch("levels.json");
    if (!response.ok) throw new Error("Could not load levels.json");
    window.LEVELS = await response.json();
  } catch (err) {
    console.error("Error loading levels:", err);
    window.log("Error loading levels. Are you running this via a local server (e.g. Live Server)?", "error");
  }
};

// Current Level State
window.currentLevel = 0;
window.collectedItems = [];

// Save/Load Progress
window.saveProgress = function () {
  localStorage.setItem("gridx_level", window.currentLevel);
};

window.loadProgress = function () {
  const saved = localStorage.getItem("gridx_level");
  if (saved !== null) {
    window.currentLevel = parseInt(saved);
  }
};

// Load a specific level
window.loadLevel = function (levelIndex) {
  const level = window.LEVELS[levelIndex];
  if (!level) return;

  window.currentLevel = levelIndex;
  window.collectedItems = [];
  window.saveProgress();

  // Update grid size
  window.GRID_SIZE = level.gridSize;
  document.documentElement.style.setProperty("--grid-cols", level.gridSize);
  document.documentElement.style.setProperty("--grid-rows", level.gridSize);

  // Set player start position
  window.playerPos = { x: level.start.x, y: level.start.y };
  
  // Reset player image
  const playerElem = document.getElementById("player");
  if (playerElem) {
    const img = playerElem.querySelector("img");
    if (img) img.src = "imges/player-smail.png";
  }

  // Clear grid overlays
  const grid = document.getElementById("grid");
  grid
    .querySelectorAll(".grid-wall, .grid-goal, .grid-item")
    .forEach((el) => el.remove());

  // Render walls
  level.walls.forEach((wall) => {
    const div = document.createElement("div");
    div.className = "grid-wall";
    div.style.gridColumn = wall.x + 1;
    div.style.gridRow = wall.y + 1;
    // User wants it to just be a square in the background color (#f8fafc)
    div.style.backgroundColor = "#f8fafc";
    div.style.border = "1px solid var(--border-light)";
    grid.appendChild(div);
  });

  // Render boxes
  if (level.boxes) {
    window.activeBoxes = JSON.parse(JSON.stringify(level.boxes));
    window.activeBoxes.forEach((box, idx) => {
      const div = document.createElement("div");
      div.className = "grid-box";
      div.id = `box-${idx}`;
      div.style.gridColumn = box.x + 1;
      div.style.gridRow = box.y + 1;
      div.innerHTML = `<img src="imges/box.png" alt="Box" />`;
      grid.appendChild(div);
    });
  } else {
    window.activeBoxes = [];
  }

  // Render goal
  const goalDiv = document.createElement("div");
  goalDiv.className = "grid-goal";
  goalDiv.id = "level-goal";
  goalDiv.style.gridColumn = level.goal.x + 1;
  goalDiv.style.gridRow = level.goal.y + 1;
  if (level.goal.locked) {
    goalDiv.innerHTML = `<img src="imges/looked.png" alt="Locked Door" />`;
    goalDiv.classList.add("locked");
  } else {
    goalDiv.innerHTML = `<img src="imges/door.png" alt="Door" />`;
  }
  grid.appendChild(goalDiv);

  // Render collectible items
  level.items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "grid-item";
    div.dataset.itemIndex = idx;
    div.dataset.itemType = item.type;
    div.style.gridColumn = item.x + 1;
    div.style.gridRow = item.y + 1;
    if (item.type === "key") {
      div.innerHTML = `<img src="imges/key.png" alt="Key" />`;
    }
    grid.appendChild(div);
  });

  // Update UI
  window.updatePlayerPosition();
  window.updateLevelUI(level);

  // Clear editor hint
  if (window.editor) {
    window.editor.setValue("// " + level.description + "\n");
  }

  window.clearLog();
  window.log(`Level ${level.id}: ${level.title}`, "info");
  window.log(level.description, "info");
};

// Update header/UI with level info
window.updateLevelUI = function (level) {
  const levelTitle = document.getElementById("level-title");
  const levelDesc = document.getElementById("level-desc");
  const levelNum = document.getElementById("level-num");
  const hintBtn = document.getElementById("hint-btn");

  if (levelTitle) levelTitle.textContent = level.id + " - " + level.title;
  if (levelDesc) levelDesc.textContent = level.description;
  if (levelNum) levelNum.textContent = `${level.id} / ${window.LEVELS.length}`;

  // Update level selector active state
  document.querySelectorAll(".level-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === window.currentLevel);
    dot.classList.toggle("completed", i < window.currentLevel);
  });
};

// Check if player reached goal
window.checkWinCondition = function () {
  const level = window.LEVELS[window.currentLevel];
  if (!level) return false;

  const atGoal =
    window.playerPos.x === level.goal.x && window.playerPos.y === level.goal.y;

  if (!atGoal) return false;

  // If goal is locked, check if it was unlocked manually by open()
  if (level.goal.locked && !window.doorUnlocked) {
    window.log("The door is locked! Use player.open('door') when near and you have a key.", "error");
    return false;
  }

  return true;
};

// Auto item pickup is disabled because user wants manual `player.take("key")`
window.checkItemPickup = function () {
  // Logic moved to `player.take()`
};

// Check if a wall is at position
window.isWall = function (x, y) {
  const level = window.LEVELS[window.currentLevel];
  if (!level) return false;
  return level.walls.some((w) => w.x === x && w.y === y);
};

// Check if a box is at position
window.isBoxAt = function (x, y) {
  if (!window.activeBoxes) return false;
  return window.activeBoxes.some((b) => b.x === x && b.y === y);
};

// Win celebration & next level
window.winLevel = function () {
  const playerImg = window.PLAYER_ELEM.querySelector("img");
  if (playerImg) {
    playerImg.src = "imges/player-win.png";
  }

  window.log("🎉 Level Complete!", "success");

  const nextIndex = window.currentLevel + 1;
  const overlay = document.getElementById("win-overlay");
  const winMsg = document.getElementById("win-message");
  const nextBtn = document.getElementById("next-level-overlay-btn");

  if (overlay) {
    if (nextIndex < window.LEVELS.length) {
      if (winMsg) winMsg.textContent = `Ready for Level ${nextIndex + 1}?`;
      if (nextBtn) nextBtn.textContent = "Next Level";
      if (nextBtn) nextBtn.style.display = "";
    } else {
      if (winMsg) winMsg.textContent = "🏆 You completed all levels!";
      if (nextBtn) nextBtn.style.display = "none";
    }
    setTimeout(() => {
      overlay.classList.add("active");
    }, 600);
  }
};

// Navigate levels
window.nextLevel = function () {
  if (window.currentLevel < window.LEVELS.length - 1) {
    window.loadLevel(window.currentLevel + 1);
  }
};

window.prevLevel = function () {
  if (window.currentLevel > 0) {
    window.loadLevel(window.currentLevel - 1);
  }
};

// Show hint
window.showHint = function () {
  const level = window.LEVELS[window.currentLevel];
  if (!level) return;
  window.log("💡 Hint: " + level.hint, "info");
};
