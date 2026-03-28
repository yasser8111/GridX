# GridX - Code Your Way 🕹️

GridX is an interactive, educational coding game designed to teach the fundamentals of logic and JavaScript through movement. Control your character in a grid-based environment using real-time code execution.

---

## 🚀 Live Demo
**[GridX Live](https://yasser8111.github.io/Javascript/)** 
*(Note: Replace with your actual deployment link if different)*

---

## ✨ Key Features

- **Real-Time Execution:** Write JavaScript and see the results instantly on the grid.
- **Premium Documentation:** A full, interactive command reference integrated into the app.
- **Advanced Logic Support:** Use `repeat()` loops, `if/else` conditions, and `canMove()` detection.
- **Modern UI/UX:** A sleek, minimalist dashboard with glassmorphism effects and smooth animations.
- **Responsive Design:** Fully optimized for both desktop and mobile developers.
- **Integrated Terminal:** Real-time logging of your script's progress and errors.

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Code Editor:** [CodeMirror 5](https://codemirror.net/) for syntax highlighting and auto-completion.
- **Typography:** Outfit & Fira Code (via Google Fonts).
- **Icons:** SVG-based custom illustrations.

## 🕹️ Quick Start: Basic Commands

To get started, try entering these commands in the terminal:

```javascript
// Basic Move
player.move('right');

// Fast Movement
player.run('down');

// Intelligent Looping
repeat(5) {
  player.move('r');
  if (canMove('d')) {
    player.move('d');
  }
}
```

## 📂 Project Structure

- `index.html`: The main dashboard and game grid.
- `commands.html`: The interactive documentation.
- `styles/`: Custom CSS architecture (style, commands, about).
- `scripts/`: Modular JS engine (player API, execution engine, UI handler).

## 📖 License

This project was created with ❤️ by [Yasser811](https://github.com/yasser8111).

---
© 2026 GridX
