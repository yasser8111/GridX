// Execution Engine Module
window.isRunning = false;

window.runCode = async function() {
    if (window.isRunning) {
        window.stopExecution = true;
        window.RUN_BTN.innerText = 'Stopping...';
        return;
    }
    
    if (!window.CODE_INPUT) return;
    const code = window.editor ? window.editor.getValue() : window.CODE_INPUT.value;
    
    if (!code.trim()) {
        window.log('Error: No code to run!', 'error');
        return;
    }

    window.isRunning = true;
    window.stopExecution = false;
    window.RUN_BTN.innerText = 'Stop Code';
    window.RUN_BTN.classList.add('btn-danger');
    
    // Reset player to level start
    window.resetPlayer(); 
    
    window.clearLog();
    window.log('Executing code...', 'info');
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(300);

    try {
        let processedCode = code;
        
        // loop
        let loopId = 0;
        processedCode = processedCode.replace(/for\s*\(\s*([^)]+)\s*\)\s*\{/g, (match, count) => {
            const id = loopId++;
            return `for (let __r${id} = 0; __r${id} < ${count}; __r${id}++) {`;
        });
        
        // Functions support
        const customFuncs = [...processedCode.matchAll(/function\s+([a-zA-Z0-9_]+)/g)].map(m => m[1]);
        processedCode = processedCode.replace(/function\s+([a-zA-Z0-9_]+)\s*\(/g, "async function $1(");
        customFuncs.forEach(fn => {
            const callRegex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
            processedCode = processedCode.replace(callRegex, `await ${fn}(`);
        });
        // Cleanup replacements
        processedCode = processedCode.replace(/async\s+function\s+await\s+/g, "async function ");
        processedCode = processedCode.replace(/await\s+await\s+/g, "await ");
        
        // player
        processedCode = processedCode.replace(/(player\.(move|run|take|open|push|pull)\(.*\))/g, "await $1");
        
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const execute = new AsyncFunction("canMove", processedCode);
        
        await execute(window.canMove);
        
        if (window.stopExecution) {
            window.log('Execution stopped.', 'info');
        } else {
            // Check win condition
            if (window.checkWinCondition && window.checkWinCondition()) {
                window.winLevel();
            } else {
                window.log('Code finished. But you didn\'t reach the goal!', 'error');
            }
        }
    } catch (err) {
        if (err.message === "STOPPED_BY_USER") {
            window.log('Execution stopped by user.', 'info');
        } else if (err.message === "CRASHED_INTO_WALL") {
            window.log('Error: Crash! The player hit a wall!', 'error');
        } else {
            window.log('Execution Error: ' + err.message, 'error');
        }
    } finally {
        window.isRunning = false;
        window.stopExecution = false;
        window.RUN_BTN.disabled = false;
        window.RUN_BTN.innerText = 'Run Code';
        window.RUN_BTN.classList.remove('btn-danger');
    }
}
