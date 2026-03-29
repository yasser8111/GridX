/**
 * GridX Player Control System
 * --------------------------
 * Core logic for player movement, collision detection, and interaction.
 */

window.GridX.PlayerControl = {
  // --- Movement Internal Helpers ---
  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

  updateView() {
    const { DOM, State } = window.GridX;
    if (!DOM.player) return;

    const cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--cell-size")) || 60;
    DOM.player.style.transform = `translate(${State.playerPos.x * cellSize}px, ${State.playerPos.y * cellSize}px)`;
  },

  resetRepresentation() {
    this.updateView();
    // Happy player img
    const img = window.GridX.DOM.player?.querySelector("img");
    if (img) img.src = "imges/player-smail.png";
  },

  resetPlayer() {
    const { State, DOM, LevelManager } = window.GridX;
    const level = State.levels[State.currentLevelIndex];
    if (!level) return;

    this.resetRepresentation();

    // Snap back instantly
    const originalTransition = DOM.player.style.transition;
    DOM.player.style.transition = "none";
    State.playerPos = { ...level.start };
    this.updateView();
    DOM.player.offsetHeight; // Force reflow
    DOM.player.style.transition = originalTransition;

    // reset items
    State.collectedItems = [];
    document.querySelectorAll(".grid-item").forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
    });

    // reset door
    if (level.goal.locked) {
      const goalEl = document.getElementById("level-goal");
      if (goalEl) {
        goalEl.innerHTML = `<img src="imges/looked.png" alt="Locked Door" />`;
        goalEl.classList.add("locked");
        State.doorUnlocked = false;
      }
    }

    // reset boxes
    State.activeBoxes = JSON.parse(JSON.stringify(level.boxes || []));
    State.activeBoxes.forEach((box, i) => {
      const el = document.getElementById(`box-${i}`);
      if (el) {
        el.style.gridColumn = box.x + 1;
        el.style.gridRow = box.y + 1;
      }
    });
  },

  // --- Core API Methods ---
  canMove(dir) {
    const moves = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };
    const d = dir?.charAt(0).toLowerCase();
    if (!moves[d]) return false;

    const [dx, dy] = moves[d];
    const { State, LevelManager } = window.GridX;
    const nx = State.playerPos.x + dx;
    const ny = State.playerPos.y + dy;

    return LevelManager.isValidPosition(nx, ny) && 
           !LevelManager.isWall(nx, ny) && 
           !LevelManager.isBoxAt(nx, ny);
  },

  async move(dir) {
    this.checkStop();
    const moves = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };
    const d = dir?.charAt(0).toLowerCase();
    if (!moves[d]) {
        window.GridX.Logger.log("Invalid move direction.", "error");
        return;
    }

    const [dx, dy] = moves[d];
    const { State, LevelManager } = window.GridX;
    const nx = State.playerPos.x + dx;
    const ny = State.playerPos.y + dy;

    // Detect collision/out of bounds
    if (!LevelManager.isValidPosition(nx, ny) || LevelManager.isWall(nx, ny) || LevelManager.isBoxAt(nx, ny)) {
      this.handleCrash(LevelManager.isWall(nx, ny) ? "WALL" : LevelManager.isBoxAt(nx, ny) ? "BOX" : "BOUNDARY");
      throw new Error("CRASHED");
    }

    State.playerPos = { x: nx, y: ny };
    this.updateView();
    await this.sleep(window.GridX.Config.animationSpeed);
  },

  async run(dir) {
    await this.move(dir);
    await this.move(dir);
  },

  async take(itemName) {
    this.checkStop();
    const { State, LevelManager } = window.GridX;
    const level = State.levels[State.currentLevelIndex];
    if (!level) return;

    const itemIdx = level.items.findIndex(it => it.type === itemName && it.x === State.playerPos.x && it.y === State.playerPos.y);
    
    if (itemIdx !== -1 && !State.collectedItems.includes(itemName)) {
        State.collectedItems.push(itemName);
        const el = document.querySelector(`.grid-item[data-item-index="${itemIdx}"]`);
        if (el) { el.style.opacity = "0"; el.style.transform = "scale(0)"; }
        window.GridX.Logger.log(`Picked up: ${itemName}!`, "success");
    } else {
        window.GridX.Logger.log(`No ${itemName} here to take.`, "error");
    }
    await this.sleep(window.GridX.Config.animationSpeed);
  },

  async open(target) {
    this.checkStop();
    const { State, LevelManager } = window.GridX;
    const level = State.levels[State.currentLevelIndex];
    
    if ((target === "door" || target === "locked") && level.goal.locked) {
        const dist = Math.abs(State.playerPos.x - level.goal.x) + Math.abs(State.playerPos.y - level.goal.y);
        if (dist <= 1 && State.collectedItems.includes("key")) {
            const goalEl = document.getElementById("level-goal");
            if (goalEl) {
                goalEl.innerHTML = `<img src="imges/door.png" alt="Door" />`;
                goalEl.classList.remove("locked");
                State.doorUnlocked = true;
                window.GridX.Logger.log("Unlocked the door!", "success");
            }
        } else {
            window.GridX.Logger.log(dist > 1 ? "Not close enough to door!" : "Need a key!", "error");
        }
    }
    await this.sleep(window.GridX.Config.animationSpeed);
  },

  async pushBox(target) {
    this.checkStop();
    const { State, LevelManager } = window.GridX;
    
    for (let i = 0; i < State.activeBoxes.length; i++) {
        const b = State.activeBoxes[i];
        const dx = b.x - State.playerPos.x;
        const dy = b.y - State.playerPos.y;

        if (Math.abs(dx) + Math.abs(dy) === 1) { // adjacent
            const oldBoxPos = { x: b.x, y: b.y };
            const nx = b.x + dx;
            const ny = b.y + dy;

            if (LevelManager.isValidPosition(nx, ny) && !LevelManager.isWall(nx, ny) && !LevelManager.isBoxAt(nx, ny)) {
                // Move Player forward to original box position
                State.playerPos = { x: oldBoxPos.x, y: oldBoxPos.y };
                this.updateView();

                // Move Box forward
                b.x = nx; b.y = ny;
                const el = document.getElementById(`box-${i}`);
                if (el) { el.style.gridColumn = nx + 1; el.style.gridRow = ny + 1; }
                
                window.GridX.Logger.log("Pushed box", "success");
                await this.sleep(window.GridX.Config.animationSpeed);
                return;
            }
        }
    }
    window.GridX.Logger.log("No box nearby to push or path blocked.", "error");
    await this.sleep(window.GridX.Config.animationSpeed);
  },

  async pullBox(target) {
    this.checkStop();
    const { State, LevelManager } = window.GridX;
    
    for (let i = 0; i < State.activeBoxes.length; i++) {
        const b = State.activeBoxes[i];
        const dx = b.x - State.playerPos.x;
        const dy = b.y - State.playerPos.y;

        if (Math.abs(dx) + Math.abs(dy) === 1) { // adjacent
            const nPx = State.playerPos.x - dx;
            const nPy = State.playerPos.y - dy;
            const nBx = State.playerPos.x;
            const nBy = State.playerPos.y;

            if (LevelManager.isValidPosition(nPx, nPy) && !LevelManager.isWall(nPx, nPy) && !LevelManager.isBoxAt(nPx, nPy)) {
                State.playerPos = { x: nPx, y: nPy };
                b.x = nBx; b.y = nBy;
                this.updateView();
                const el = document.getElementById(`box-${i}`);
                if (el) { el.style.gridColumn = nBx + 1; el.style.gridRow = nBy + 1; }
                window.GridX.Logger.log("Pulled box", "success");
                await this.sleep(window.GridX.Config.animationSpeed);
                return;
            }
        }
    }
    window.GridX.Logger.log("Cannot pull any box from here.", "error");
    await this.sleep(window.GridX.Config.animationSpeed);
  },

  // --- Runtime Support ---
  checkStop() {
    if (window.GridX.State.stopExecution) throw new Error("STOPPED_BY_USER");
  },

  handleCrash(type) {
    const img = window.GridX.DOM.player?.querySelector("img");
    if (img) img.src = "imges/player-lost.png";
    window.GridX.State.stopExecution = true;
    window.GridX.Logger.log(`💥 CRASH! You hit ${type}.`, "error");
  }
};

// Global Exposure (Same behavior for user code)
window.canMove = window.GridX.PlayerControl.canMove.bind(window.GridX.PlayerControl);
window.player = {
  move: window.GridX.PlayerControl.move.bind(window.GridX.PlayerControl),
  run: window.GridX.PlayerControl.run.bind(window.GridX.PlayerControl),
  take: window.GridX.PlayerControl.take.bind(window.GridX.PlayerControl),
  open: window.GridX.PlayerControl.open.bind(window.GridX.PlayerControl),
  push: window.GridX.PlayerControl.pushBox.bind(window.GridX.PlayerControl),
  pull: window.GridX.PlayerControl.pullBox.bind(window.GridX.PlayerControl)
};

// Internal shortcuts
window.updatePlayerPosition = window.GridX.PlayerControl.updateView.bind(window.GridX.PlayerControl);
window.resetPlayer = window.GridX.PlayerControl.resetPlayer.bind(window.GridX.PlayerControl);
window.checkWinCondition = () => {
  const { State, LevelManager } = window.GridX;
  const level = State.levels[State.currentLevelIndex];
  if (!level) return false;

  const atGoal = State.playerPos.x === level.goal.x && State.playerPos.y === level.goal.y;
  if (!atGoal) return false;
  if (level.goal.locked && !State.doorUnlocked) {
    window.GridX.Logger.log("Door locked! Unlock it first.", "error");
    return false;
  }
  return true;
};
window.winLevel = () => {
    const img = window.GridX.DOM.player?.querySelector("img");
    if (img) img.src = "imges/player-win.png";
    window.GridX.Logger.log("🎉 Level Complete!", "success");

    const overlay = window.GridX.DOM.winOverlay;
    if (overlay) {
        const nextIndex = window.GridX.State.currentLevelIndex + 1;
        const msg = document.getElementById("win-message");
        const btn = document.getElementById("next-level-overlay-btn");

        if (nextIndex < window.GridX.State.levels.length) {
            msg.textContent = `Ready for Level ${nextIndex + 1}?`;
            btn.textContent = "Next Level";
            btn.style.display = "";
            btn.onclick = () => {
                overlay.classList.remove("active");
                window.nextLevel();
            };
        } else {
            msg.textContent = "🏆 Master of GridX! All challenges completed.";
            btn.textContent = "View Final Reward";
            btn.style.display = "";
            btn.onclick = () => {
                window.location.href = "congratulations.html";
            };
        }
        setTimeout(() => overlay.classList.add("active"), 600);
    }
};
