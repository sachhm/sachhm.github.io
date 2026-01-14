// Terminal typing effect
const terminalLines = [
  "$ whoami",
  "> sachh moka // bachelor of IT @ JCU",
  "$ cat about.txt",
  "> driven new grad with a growing portfolio in software development. previous experience as it intern in 2 countries",
  "$ grep -r 'passion' ~/interests/",
  "> ai-driven systems | aviation tech | solving problems in remote regions",
  "$ ls skills/",
  "> python/  swift/  web_dev/  it_support/  hardware_repair/",
  "$ echo $LANGUAGES",
  "> english | hindi | tok pisin | python | swift | javascript",
  "$ cat status.txt",
  "> building tech that works where it matters most.",
  "_",
];

let currentLine = 0;
let currentChar = 0;
let isDeleting = false;

function typeTerminal() {
  const terminal = document.getElementById("terminal-output");
  if (!terminal) return;

  if (currentLine < terminalLines.length) {
    const line = terminalLines[currentLine];
    const isCommand = line.startsWith("$");
    const isPrompt = line.startsWith(">");

    if (currentChar < line.length) {
      // Typing out current line
      currentChar++;
      const textSoFar = line.substring(0, currentChar);

      // Build the HTML for all completed lines plus current line
      let html = "";
      for (let i = 0; i < currentLine; i++) {
        const prevLine = terminalLines[i];
        const prevIsCommand = prevLine.startsWith("$");
        const prevIsPrompt = prevLine.startsWith(">");

        if (prevIsCommand) {
          html += `<div class="terminal-line command">${prevLine}</div>`;
        } else if (prevIsPrompt) {
          html += `<div class="terminal-line output">${prevLine}</div>`;
        } else {
          html += `<div class="terminal-line">${prevLine}</div>`;
        }
      }

      // Add current line being typed
      if (isCommand) {
        html += `<div class="terminal-line command">${textSoFar}<span class="cursor">|</span></div>`;
      } else if (isPrompt) {
        html += `<div class="terminal-line output">${textSoFar}<span class="cursor">|</span></div>`;
      } else {
        html += `<div class="terminal-line">${textSoFar}<span class="cursor">|</span></div>`;
      }

      terminal.innerHTML = html;

      // Faster typing for commands, slower for output
      const typingSpeed = isCommand ? 50 : 30;
      setTimeout(typeTerminal, typingSpeed);
    } else {
      // Finished current line, move to next
      currentLine++;
      currentChar = 0;
      setTimeout(typeTerminal, 600); // Pause between lines
    }
  } else {
    // All lines typed, show blinking cursor
    let html = "";
    for (let i = 0; i < terminalLines.length; i++) {
      const line = terminalLines[i];
      const lineIsCommand = line.startsWith("$");
      const lineIsPrompt = line.startsWith(">");

      if (lineIsCommand) {
        html += `<div class="terminal-line command">${line}</div>`;
      } else if (lineIsPrompt) {
        html += `<div class="terminal-line output">${line}</div>`;
      } else {
        html += `<div class="terminal-line">${line}</div>`;
      }
    }
    terminal.innerHTML = html;
  }
}

// Start typing when page loads
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(typeTerminal, 500);
});
