import { clearVisit, hasVisited, markVisited } from "./visit-store.js";
import { createAbortError, delay, throwIfAborted } from "./delay.js";
import { playTerminalSequence } from "../terminal/sequence-player.js";
import { TerminalView } from "../terminal/terminal-view.js";
import { AFTER_CONFIRMATION, BOOT_SEQUENCE, CONTINUE_PROMPT } from "../content/boot-sequence.js";

const BLOCKED_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"]);

function isUsableKey(event) {
  return event.type !== "keydown"
    || (!event.repeat && !event.isComposing && !BLOCKED_KEYS.has(event.key));
}

function waitForInput(target, signal, onNudge, onInput) {
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    const nudges = [
      [8_000, "(It's just Y. Or any key, really.)"],
      [20_000, "(A click counts too. I'm not picky~)"],
      [45_000, "(Still here? Me too~)"],
      [65_000, "(Y. The one between T and U.)"],
      [90_000, "(You'll run out of patience before I run out of lines.)"],
    ];
    const timers = onNudge
      ? nudges.map(([after, message]) => setTimeout(() => onNudge(message), after))
      : [];

    const cleanup = () => {
      target.removeEventListener("keydown", complete);
      target.removeEventListener("pointerdown", complete);
      signal.removeEventListener("abort", abort);
      timers.forEach(clearTimeout);
    };

    const complete = (event) => {
      if (!isUsableKey(event)) return;
      try { onInput?.(event); } catch (error) {
        console.info("[philia093] Input unlock hook failed:", error);
      }
      cleanup();
      resolve(event);
    };

    const abort = () => {
      cleanup();
      reject(createAbortError(signal));
    };

    target.addEventListener("keydown", complete);
    target.addEventListener("pointerdown", complete);
    signal.addEventListener("abort", abort, { once: true });
  });
}

function createContinuePrompt(element) {
  element.replaceChildren();
  const prompt = document.createElement("div");
  prompt.className = "continue-prompt";
  prompt.setAttribute("role", "button");
  prompt.setAttribute("aria-label", CONTINUE_PROMPT);

  const label = document.createElement("span");
  const touchInput = matchMedia("(hover: none) and (pointer: coarse)").matches;
  label.textContent = touchInput ? "Tap anywhere to continue" : CONTINUE_PROMPT;

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = "_";
  prompt.append(label, cursor);
  element.append(prompt);
  return prompt;
}

/**
 * Handles first-visit onboarding and the returning-visitor shortcut.
 * Scene rendering is injected through onStart and remains independent.
 */
export function createExperienceController({
  terminalElement,
  titleElement,
  bootSequence = BOOT_SEQUENCE,
  afterConfirmation = AFTER_CONFIRMATION,
  onStart = () => {},
  onInput,
  storage,
  inputTarget = globalThis.document,
  typeSpeed = 7,
  exitDelay = 900,
} = {}) {
  if (!terminalElement || !titleElement || !inputTarget) {
    throw new TypeError("ExperienceController requires terminalElement, titleElement, and inputTarget.");
  }

  const terminal = new TerminalView(terminalElement);
  const abortController = new AbortController();
  const firstVisit = !hasVisited(storage);
  let state = "idle";
  let startPromise = null;
  let continuePrompt = null;

  async function finish() {
    throwIfAborted(abortController.signal);
    state = "starting";
    markVisited(storage);

    if (firstVisit) {
      await playTerminalSequence(terminal, afterConfirmation, {
        signal: abortController.signal,
        defaultSpeed: typeSpeed,
      });
      terminalElement.classList.add("terminal-exit");
      await delay(exitDelay, abortController.signal);
      terminalElement.remove();
    } else {
      continuePrompt?.remove();
      titleElement.replaceChildren();
    }

    await onStart({ firstVisit, terminal });
    state = "playing";
  }

  async function start() {
    if (state !== "idle") return startPromise;
    state = "booting";

    startPromise = (async () => {
      try {
        if (firstVisit) {
          await playTerminalSequence(terminal, bootSequence, {
            signal: abortController.signal,
            defaultSpeed: typeSpeed,
          });

          throwIfAborted(abortController.signal);
          state = "waiting-confirmation";
          terminal.appendPrompt("DEPLOY hello_world? (Y/y) ");
          await waitForInput(inputTarget, abortController.signal, (message) => {
            terminal.appendLine(message, { tone: "comment" });
          }, onInput);
        } else {
          terminalElement.remove();
          continuePrompt = createContinuePrompt(titleElement);
          state = "waiting";
          await waitForInput(inputTarget, abortController.signal, undefined, onInput);
        }

        await finish();
      } catch (error) {
        if (error?.name !== "AbortError") {
          state = "error";
          terminal.appendLine("The experience could not be started.", { tone: "alert" });
          console.error("[philia093] Experience startup failed:", error);
        }
      }
    })();

    return startPromise;
  }

  function destroy() {
    if (!abortController.signal.aborted) abortController.abort();
    continuePrompt?.remove();
    terminal.freeze();
    if (state !== "playing") state = "destroyed";
  }

  return Object.freeze({
    start,
    destroy,
    get state() { return state; },
    get firstVisit() { return firstVisit; },
    terminal,
  });
}

// Exposed only for the local reset helper; production behavior uses the store API.
export { clearVisit };
