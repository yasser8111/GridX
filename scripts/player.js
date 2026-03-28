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
  const playerImg = window.PLAYER_ELEM.querySelector('img');
  if (playerImg) {
      playerImg.src = "imges/player-smail.png";
  }

  // Temporarily disable transition for instant snap-back
  const originalTransition = window.PLAYER_ELEM.style.transition;
  window.PLAYER_ELEM.style.transition = "none";

  window.playerPos = { x: 0, y: 0 };
  window.updatePlayerPosition();

  // Force reflow/repaint
  window.PLAYER_ELEM.offsetHeight;

  // Restore transition
  window.PLAYER_ELEM.style.transition = originalTransition;
};

window.stopExecution = false;

function checkStop() {
  if (window.stopExecution) {
    throw new Error("STOPPED_BY_USER");
  }
}

window.canMove = function(dir) {
  const d = dir?.charAt(0).toLowerCase();
  const moves = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };

  if (!moves[d]) return false;

  const [dx, dy] = moves[d];
  const nx = window.playerPos.x + dx;
  const ny = window.playerPos.y + dy;

  // Check if inside grid boundaries
  return (nx >= 0 && nx < window.GRID_SIZE && ny >= 0 && ny < window.GRID_SIZE);
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

    if (nx >= 0 && nx < window.GRID_SIZE && ny >= 0 && ny < window.GRID_SIZE) {
      window.playerPos.x = nx;
      window.playerPos.y = ny;
      window.updatePlayerPosition();
      await sleep(window.ANIMATION_SPEED);
    } else {
      const playerImg = window.PLAYER_ELEM.querySelector('img');
      if (playerImg) {
          playerImg.src = "imges/player-lost.png";
      }
      window.stopExecution = true;
      throw new Error("CRASHED_INTO_WALL");
    }
  },

  async run(dir) {
    checkStop();
    await this.move(dir);
    await this.move(dir);
  },
};
