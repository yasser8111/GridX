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
    window.stopExecution = false; // Reset for new run
    window.RUN_BTN.innerText = 'Stop Code';
    window.RUN_BTN.classList.add('btn-danger'); // Add red color for stop
    
    // Start from beginning each time code runs
    window.resetPlayer(); 
    
    window.clearLog();
    window.log('Executing code from start...', 'info');
    
    // Give user a moment to see the reset
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(300);

    try {
        let processedCode = code;
        
        // repeat
        let loopId = 0;
        processedCode = processedCode.replace(/repeat\s*\(\s*([^)]+)\s*\)\s*\{/g, (match, count) => {
            const id = loopId++;
            return `for (let __r${id} = 0; __r${id} < ${count}; __r${id}++) {`;
        });
        
        // player
        processedCode = processedCode.replace(/(player\.(move|run|move[RLUD])\(.*\))/g, "await $1");
        
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        // Inject global helpers
        const execute = new AsyncFunction("canMove", processedCode);
        
        await execute(window.canMove);
        
        if (window.stopExecution) {
            window.log('Execution stopped by user.', 'info');
        } else {
            window.log('Code execution completed successfully!', 'success');
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
