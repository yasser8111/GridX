/**
 * GridX Execution Engine
 * ----------------------
 * Parsers and executes user code in an async context.
 */

window.GridX.Engine = {
  // --- Code Processor ---
  processCode(code) {
    let processed = code;

    // 1. Convert simple for(N) loops to standard JS loops
    let loopId = 0;
    processed = processed.replace(/for\s*\(\s*([^;{]+)\s*\)\s*\{/g, (match, count) => {
      const id = loopId++;
      return `for (let __r${id} = 0; __r${id} < ${count}; __r${id}++) {`;
    });

    // 2. Wrap player commands with 'await'
    // This allows users to write 'player.move("right")' instead of 'await player.move("right")'
    const commands = ["move", "run", "take", "open", "push", "pull"];
    commands.forEach(cmd => {
      const regex = new RegExp(`(?<!await\\s+)player\\.${cmd}\\(`, "g");
      processed = processed.replace(regex, `await player.${cmd}(`);
    });

    // 3. Convert user functions to 'async function' and 'await' their calls
    // Note: Simple regex based - won't handle complex scoping but good for gaming.
    const userFunctions = [...processed.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
    processed = processed.replace(/function\s+([a-zA-Z0-9_]+)\s*\(/g, "async function $1(");
    
    userFunctions.forEach(fn => {
        const callRegex = new RegExp(`(?<!await\\s+|async\\s+function\\s+)${fn}\\s*\\(`, "g");
        processed = processed.replace(callRegex, `await ${fn}(`);
    });

    // Cleanup double await if it happened
    processed = processed.replace(/await\s+await\s+/g, "await ");
    processed = processed.replace(/async\s+function\s+await\s+/g, "async function ");

    return processed;
  },

  // --- Runner ---
  async run() {
    const { State, DOM, Logger, PlayerControl } = window.GridX;

    if (State.isRunning) {
        State.stopExecution = true;
        DOM.runBtn.innerText = 'Stopping...';
        return;
    }

    const code = window.editor ? window.editor.getValue() : DOM.codeInput.value;
    if (!code.trim()) {
        Logger.log('Error: Code is empty!', 'error');
        return;
    }

    // Auto-Format if beautifier is available
    if (window.js_beautify) {
       const formatted = window.js_beautify(code, { indent_size: 4, indent_with_tabs: true });
       if (formatted !== code) {
           if (window.editor) window.editor.setValue(formatted);
           else DOM.codeInput.value = formatted;
       }
    }

    // Prepare state
    State.isRunning = true;
    State.stopExecution = false;
    DOM.runBtn.innerText = 'Stop';
    DOM.runBtn.classList.add('btn-danger');

    // Reset game world
    PlayerControl.resetPlayer();
    Logger.clear();
    Logger.log('Executing code...', 'info');
    
    // Give the player a moment to settle at the start
    await PlayerControl.sleep(300);

    try {
        const finalCode = this.processCode(code);
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const execute = new AsyncFunction("player", "canMove", finalCode);

        await execute(window.player, window.canMove);

        // check results
        if (State.stopExecution) {
            Logger.log('Execution halted.', 'info');
        } else {
            if (window.checkWinCondition && window.checkWinCondition()) {
                window.winLevel();
            } else {
                Logger.log('Finished. Path missed the goal!', 'error');
            }
        }
    } catch (err) {
        if (err.message === "STOPPED_BY_USER") {
            Logger.log('Stopped by user.', 'info');
        } else if (err.message === "CRASHED") {
           // handled in player.js
        } else {
            Logger.log('Execution Error: ' + err.message, 'error');
        }
    } finally {
        State.isRunning = false;
        State.stopExecution = false;
        DOM.runBtn.innerText = 'Run Code';
        DOM.runBtn.classList.remove('btn-danger');
    }
  }
};

window.runCode = window.GridX.Engine.run.bind(window.GridX.Engine);
window.isRunning = window.GridX.State.isRunning; // compatibility
window.stopExecution = window.GridX.State.stopExecution; // compatibility
