/**
 * GridX UI & Editor System
 * ------------------------
 * Initializes the CodeMirror editor and binding UI actions.
 */

window.GridX.UI = {
  init() {
    const { DOM, Engine, LevelManager } = window.GridX;
    if (!DOM.codeInput) return;

    // --- Configure CodeMirror ---
    if (window.CodeMirror) {
      window.editor = CodeMirror.fromTextArea(DOM.codeInput, {
        mode: "javascript",
        theme: "gridx",
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: true,
        viewportMargin: Infinity,
        extraKeys: {"Ctrl-Space": "autocomplete"},
        hintOptions: {
          completeSingle: false,
          hint: (cm) => this.getHints(cm)
        }
      });

      // Auto-trigger hints on typing
      window.editor.on("inputRead", (cm, change) => {
          if (change.origin === "+input" && /^[a-zA-Z0-9.]$/.test(change.text[0])) {
              CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
          }
      });
    }

    // --- Action Listeners ---
    if (DOM.runBtn) DOM.runBtn.addEventListener("click", () => window.runCode());

    // Fullscreen Toggle
    const fullscreenToggle = document.getElementById("fullscreen-toggle");
    const codePanel = document.getElementById("code-panel");
    if (fullscreenToggle && codePanel) {
      fullscreenToggle.addEventListener("click", () => {
        if (window.innerWidth >= 1024) codePanel.classList.toggle("fullscreen");
      });
    }

    // Toggle Console/Terminal log View
    const toggleLogBtn = document.getElementById("toggle-log-btn");
    const outputLog = DOM.outputLog;
    if (toggleLogBtn && outputLog) {
      toggleLogBtn.addEventListener("click", () => outputLog.classList.toggle("hidden"));
    }

    // Reset Game button logic
    if (window.GridX.DOM.resetBtn) {
       window.GridX.DOM.resetBtn.addEventListener("click", () => {
          window.resetPlayer();
          window.GridX.Logger.clear();
          window.GridX.Logger.log("Reset successful. Ready!", "info");
          if (window.editor) window.editor.setValue("");
       });
    }
  },

  getHints(cm) {
    const cur = cm.getCursor();
    const lineText = cm.getLine(cur.line);
    const end = cur.ch;
    
    // Look back to find the start of the current expression (word + dot)
    let start = end;
    while (start > 0 && /[\w.]/.test(lineText.charAt(start - 1))) {
      start--;
    }
    const currentWord = lineText.slice(start, end);

    const snippets = [
      { text: "player.move('')", display: "player.move('direction')", offset: 13 },
      { text: "player.run('')", display: "player.run('direction')", offset: 12 },
      { text: "player.take('')", display: "player.take('item')", offset: 13 },
      { text: "player.open('')", display: "player.open('target')", offset: 13 },
      { text: "player.push('box')", display: "player.push('box')", offset: 17 },
      { text: "player.pull('box')", display: "player.pull('box')", offset: 17 },
      { text: "canMove('')", display: "canMove('direction')", offset: 9 },
      { text: "for( ) {\n\n}", display: "for(n) { ... }", offset: 4 },
      { text: "if( ) {\n\n}", display: "if(condition) { ... }", offset: 3 },
      { text: "else {\n\n}", display: "else { ... }", offset: 8 },
      { text: "function name() {\n\n}", display: "function name() { ... }", offset: 9 },
      { text: "console.log()", display: "console.log()", offset: 12 }
    ];

    // Filter snippets based on currentWord
    const filtered = snippets
      .filter(s => s.display.toLowerCase().includes(currentWord.toLowerCase()) || 
                   s.text.toLowerCase().includes(currentWord.toLowerCase()))
      .map(s => ({
        text: s.text,
        displayText: s.display,
        hint: function(cm, data, completion) {
          cm.replaceRange(completion.text, data.from, data.to);
          cm.setCursor(data.from.line, data.from.ch + s.offset);
        }
      }));

    if (filtered.length > 0) {
      return {
        list: filtered,
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
      };
    }
  }
};

window.setupUI = window.GridX.UI.init.bind(window.GridX.UI);
