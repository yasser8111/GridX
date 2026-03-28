// UI & Interaction Module
window.setupUI = function () {
  if (!window.CODE_INPUT) return;

  // Initialize CodeMirror Editor
  if (window.CodeMirror) {
    window.editor = CodeMirror.fromTextArea(window.CODE_INPUT, {
      mode: "javascript",
      theme: "gridx",
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      tabSize: 4,
      indentUnit: 4,
      viewportMargin: Infinity
    });
  }

  if (window.RUN_BTN) {
    window.RUN_BTN.addEventListener("click", window.runCode);
  }

  // Fullscreen Toggle
  const fullscreenToggle = document.getElementById("fullscreen-toggle");
  const codePanel = document.getElementById("code-panel");
  if (fullscreenToggle && codePanel) {
    fullscreenToggle.addEventListener("click", () => {
      if (window.innerWidth >= 1024) {
        codePanel.classList.toggle("fullscreen");
      }
    });
  }

  const toggleLogBtn = document.getElementById("toggle-log-btn");
  const outputLog = document.getElementById("output-log");
  if (toggleLogBtn && outputLog) {
    toggleLogBtn.addEventListener("click", () => {
      outputLog.classList.toggle("hidden");
    });
  }

  if (window.RESET_BTN) {
    window.RESET_BTN.addEventListener("click", () => {
      window.resetPlayer();
      window.clearLog();
      window.log("Reset successful. Ready!", "info");
      if (window.editor) {
          window.editor.setValue("");
      } else {
          window.CODE_INPUT.value = "";
      }
    });
  }
};
