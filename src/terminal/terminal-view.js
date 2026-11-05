import { delay, throwIfAborted } from "../runtime/delay.js";

const TONES = new Set([
  "plain",
  "prompt",
  "ok",
  "info",
  "warn",
  "alert",
  "comment",
  "voice",
]);

function safeTone(tone) {
  return TONES.has(tone) ? tone : "plain";
}

export class TerminalView {
  constructor(element) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError("TerminalView requires a DOM element.");
    }

    this.element = element;
    this.element.classList.add("terminal");
    this.element.setAttribute("role", "log");
    this.element.setAttribute("aria-live", "polite");
  }

  clear() {
    this.element.replaceChildren();
    this.element.removeAttribute("data-frozen");
  }

  appendLine(text, { tone = "plain", hang = 0 } = {}) {
    const row = document.createElement("div");
    row.className = `row tone-${safeTone(tone)}`;
    row.style.setProperty("--hang", `${Math.max(0, Number(hang) || 0)}ch`);
    row.textContent = String(text);
    this.element.append(row);
    this.scrollToBottom();
    return row;
  }

  async typeLine(text, { tone = "plain", hang = 0, speed = 18, signal } = {}) {
    throwIfAborted(signal);

    const row = document.createElement("div");
    row.className = `row tone-${safeTone(tone)}`;
    row.style.setProperty("--hang", `${Math.max(0, Number(hang) || 0)}ch`);

    const output = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "▌";
    row.append(output, cursor);
    this.element.append(row);

    const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const characterDelay = reducedMotion ? 0 : Math.max(0, Number(speed) || 0);

    for (const character of Array.from(String(text))) {
      throwIfAborted(signal);
      output.appendData(character);
      this.scrollToBottom();
      if (character !== " " && characterDelay > 0) await delay(characterDelay, signal);
    }

    cursor.remove();
    this.scrollToBottom();
    return row;
  }

  appendPrompt(text) {
    const row = document.createElement("div");
    row.className = "row tone-prompt";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "_";
    row.append(document.createTextNode(String(text)), cursor);
    this.element.append(row);
    this.scrollToBottom();
    return row;
  }

  freeze() {
    this.element.dataset.frozen = "";
  }

  scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  }
}
