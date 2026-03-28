// Player State & API Module
window.playerPos = { x: 0, y: 0 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

window.updatePlayerPosition = function () {
  if (!window.PLAYER_ELEM) return;
  const cellSize =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--cell-size",
      ),
    ) || 60;
  window.PLAYER_ELEM.style.transform = `translate(${window.playerPos.x * cellSize}px, ${window.playerPos.y * cellSize}px)`;
};

window.resetPlayer = function () {
  if (!window.PLAYER_ELEM) return;

  // Restore happy player image
  const playerImg = window.PLAYER_ELEM.querySelector("img");
  if (playerImg) {
    playerImg.src = "imges/player-smail.png";
  }

  // Temporarily disable transition for instant snap-back
  const originalTransition = window.PLAYER_ELEM.style.transition;
  window.PLAYER_ELEM.style.transition = "none";

  // Reset to level start position
  const level = window.LEVELS ? window.LEVELS[window.currentLevel] : null;
  if (level) {
    window.playerPos = { x: level.start.x, y: level.start.y };
  } else {
    window.playerPos = { x: 0, y: 0 };
  }
  window.updatePlayerPosition();

  // Force reflow/repaint
  window.PLAYER_ELEM.offsetHeight;

  // Restore transition
  window.PLAYER_ELEM.style.transition = originalTransition;

  // Reset collected items
  window.collectedItems = [];

  // Restore items visibility
  document.querySelectorAll(".grid-item").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "scale(1)";
  });

  // Re-lock door if needed
  const level2 = window.LEVELS ? window.LEVELS[window.currentLevel] : null;
  if (level2 && level2.goal.locked) {
    const goalEl = document.getElementById("level-goal");
    if (goalEl) {
      goalEl.innerHTML = `<img src="imges/looked.png" alt="Locked Door" />`;
      goalEl.classList.add("locked");
      window.doorUnlocked = false;
    }
  }

  // Reset boxes
  if (level2 && level2.boxes) {
    window.activeBoxes = JSON.parse(JSON.stringify(level2.boxes));
    window.activeBoxes.forEach((box, idx) => {
      const el = document.getElementById(`box-${idx}`);
      if (el) {
        el.style.gridColumn = box.x + 1;
        el.style.gridRow = box.y + 1;
      }
    });
  } else {
    window.activeBoxes = [];
  }
};

window.stopExecution = false;

function checkStop() {
  if (window.stopExecution) {
    throw new Error("STOPPED_BY_USER");
  }
}

window.canMove = function (dir) {
  const d = dir?.charAt(0).toLowerCase();
  const moves = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };

  if (!moves[d]) return false;

  const [dx, dy] = moves[d];
  const nx = window.playerPos.x + dx;
  const ny = window.playerPos.y + dy;

  // Check grid boundaries
  if (nx < 0 || nx >= window.GRID_SIZE || ny < 0 || ny >= window.GRID_SIZE) {
    return false;
  }

  // Check walls
  if (window.isWall && window.isWall(nx, ny)) {
    return false;
  }
  
  if (window.isBoxAt && window.isBoxAt(nx, ny)) {
    return false;
  }

  return true;
};

window.player = {
  async move(dir) {
    checkStop();
    const d = dir?.charAt(0).toLowerCase();
    const moves = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };

    if (!moves[d]) return window.log("Error", "error");

    const [dx, dy] = moves[d];
    const nx = window.playerPos.x + dx;
    const ny = window.playerPos.y + dy;

    // Check boundaries
    if (nx < 0 || nx >= window.GRID_SIZE || ny < 0 || ny >= window.GRID_SIZE) {
      const playerImg = window.PLAYER_ELEM.querySelector("img");
      if (playerImg) {
        playerImg.src = "imges/player-lost.png";
      }
      window.stopExecution = true;
      throw new Error("CRASHED_INTO_WALL");
    }

    // Check walls
    if (window.isWall && window.isWall(nx, ny)) {
      const playerImg = window.PLAYER_ELEM.querySelector("img");
      if (playerImg) {
        playerImg.src = "imges/player-lost.png";
      }
      window.log("💥 Crashed into a wall!", "error");
      window.stopExecution = true;
      throw new Error("CRASHED_INTO_WALL");
    }

    // Check boxes
    if (window.isBoxAt && window.isBoxAt(nx, ny)) {
      const playerImg = window.PLAYER_ELEM.querySelector("img");
      if (playerImg) {
        playerImg.src = "imges/player-lost.png";
      }
      window.log("💥 Crashed into a box!", "error");
      window.stopExecution = true;
      throw new Error("CRASHED_INTO_BOX");
    }

    window.playerPos.x = nx;
    window.playerPos.y = ny;
    window.updatePlayerPosition();

    await sleep(window.ANIMATION_SPEED);
  },

  async run(dir) {
    checkStop();
    await this.move(dir);
    await this.move(dir);
  },

  async take(itemName) {
    checkStop();
    const level = window.LEVELS[window.currentLevel];
    if (!level) return;

    let found = false;
    level.items.forEach((item, idx) => {
      // Check if we are on the same cell and item matches
      if (item.type === itemName && window.playerPos.x === item.x && window.playerPos.y === item.y && !window.collectedItems.includes(item.type)) {
        window.collectedItems.push(item.type);
        const el = document.querySelector(`.grid-item[data-item-index="${idx}"]`);
        if (el) {
          el.style.opacity = "0";
          el.style.transform = "scale(0)";
        }
        window.log(`Picked up: ${item.type}!`, "success");
        found = true;
      }
    });

    if (!found) {
      window.log(`No ${itemName} here to take.`, "error");
    }
    await sleep(window.ANIMATION_SPEED);
  },

  async open(targetName) {
    checkStop();
    const level = window.LEVELS[window.currentLevel];
    if (!level) return;

    if ((targetName === "locked" || targetName === "door") && level.goal.locked) {
      const atOrNearGoal = Math.abs(window.playerPos.x - level.goal.x) <= 1 && Math.abs(window.playerPos.y - level.goal.y) <= 1;
      
      if (atOrNearGoal) {
        if (window.collectedItems.includes("key")) {
          const goalEl = document.getElementById("level-goal");
          if (goalEl && goalEl.classList.contains("locked")) {
            goalEl.innerHTML = `<img src="imges/door.png" alt="Door" />`;
            goalEl.classList.remove("locked");
            window.doorUnlocked = true;
            window.log("Unlocked the door!", "success");
          } else {
            window.log("Door is already open.", "info");
          }
        } else {
          window.log("You need a key to open this!", "error");
        }
      } else {
         window.log("You are not close enough to the door!", "error");
      }
    } else {
      window.log(`Cannot open ${targetName}.`, "error");
    }
    await sleep(window.ANIMATION_SPEED);
  },

  async push(targetName) {
    checkStop();
    if (targetName !== "box") {
        window.log("You can only push boxes.", "error");
        return;
    }
    if (!window.activeBoxes || window.activeBoxes.length === 0) {
        window.log("No boxes available to push.", "error"); return;
    }

    // Find first adjacent box
    let boxIndex = -1, dX = 0, dY = 0;
    for(let i = 0; i < window.activeBoxes.length; i++) {
        let b = window.activeBoxes[i];
        if (Math.abs(b.x - window.playerPos.x) + Math.abs(b.y - window.playerPos.y) === 1) {
             boxIndex = i;
             dX = b.x - window.playerPos.x;
             dY = b.y - window.playerPos.y;
             break;
        }
    }
    
    if (boxIndex === -1) {
         window.log("No box nearby to push!", "error"); return;
    }

    let nX = window.activeBoxes[boxIndex].x + dX;
    let nY = window.activeBoxes[boxIndex].y + dY;

    if (nX < 0 || nY < 0 || nX >= window.GRID_SIZE || nY >= window.GRID_SIZE || window.isWall(nX, nY) || window.isBoxAt(nX, nY)) {
         window.log("Box is blocked!", "error"); return;
    }

    window.activeBoxes[boxIndex].x = nX;
    window.activeBoxes[boxIndex].y = nY;
    const el = document.getElementById(`box-${boxIndex}`);
    if (el) {
        el.style.gridColumn = nX + 1;
        el.style.gridRow = nY + 1;
    }
    window.log("Pushed box", "success");
    await sleep(window.ANIMATION_SPEED);
  },

  async pull(targetName) {
    checkStop();
    if (targetName !== "box") {
        window.log("You can only pull boxes.", "error");
        return;
    }
    
    let boxIndex = -1, dX = 0, dY = 0;
    for(let i = 0; i < window.activeBoxes.length; i++) {
        let b = window.activeBoxes[i];
        if (Math.abs(b.x - window.playerPos.x) + Math.abs(b.y - window.playerPos.y) === 1) {
             boxIndex = i;
             dX = b.x - window.playerPos.x;
             dY = b.y - window.playerPos.y;
             break;
        }
    }
    
    if (boxIndex === -1) {
         window.log("No box nearby to pull!", "error"); return;
    }

    let newPx = window.playerPos.x - dX;
    let newPy = window.playerPos.y - dY;
    let newBx = window.playerPos.x;
    let newBy = window.playerPos.y;

    if (newPx < 0 || newPy < 0 || newPx >= window.GRID_SIZE || newPy >= window.GRID_SIZE || window.isWall(newPx, newPy) || window.isBoxAt(newPx, newPy)) {
         window.log("Cannot pull, something is blocking you behind!", "error"); return;
    }
    
    // Move player
    window.playerPos.x = newPx;
    window.playerPos.y = newPy;
    window.updatePlayerPosition();
    
    // Move box
    window.activeBoxes[boxIndex].x = newBx;
    window.activeBoxes[boxIndex].y = newBy;
    const el = document.getElementById(`box-${boxIndex}`);
    if (el) {
        el.style.gridColumn = newBx + 1;
        el.style.gridRow = newBy + 1;
    }
    
    window.log("Pulled box", "success");
    await sleep(window.ANIMATION_SPEED);
  }
};
