/*
Example inputs / expected outputs:

Input:
3
5
Output:
8

Input:
4
7
Output:
11

Input:
10
20
Output:
30
*/

(function () {
  const codeEl = document.getElementById("code");
  const inputEl = document.getElementById("input");
  const outputEl = document.getElementById("output");
  const runBtn = document.getElementById("run");
  const clearBtn = document.getElementById("clear");

  function setOutput(text) {
    outputEl.textContent = text;
  }

  function appendOutput(text) {
    outputEl.textContent += text;
  }

  runBtn.addEventListener("click", () => {
    setOutput("");

    const source = codeEl.value;
    const lines = inputEl.value.split(/\r?\n/);
    let idx = 0;

    function readLine() {
      if (idx >= lines.length) return "";
      return lines[idx++];
    }

    const logBuffer = [];
    const sandboxConsole = {
      log: (...args) => {
        logBuffer.push(args.map(String).join(" "));
      },
    };

    try {
      window.readLine = readLine;

      const runner = new Function(
        "readLine",
        "console",
        String(source) + "\n\nif (typeof main === 'function') {\n  main();\n}"
      );

      runner(readLine, sandboxConsole);

      if (logBuffer.length === 0) {
        if (typeof window.main !== "function") {
          setOutput("(no output) Tip: define function main() and call readLine() inside it.");
        } else {
          setOutput("(no output)");
        }
      } else {
        setOutput(logBuffer.join("\n"));
      }
    } catch (err) {
      const message = err && err.stack ? err.stack : String(err);
      setOutput(message);
    }
  });

  clearBtn.addEventListener("click", () => {
    setOutput("");
  });
})();
