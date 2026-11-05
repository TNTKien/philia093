import { delay, throwIfAborted } from "../runtime/delay.js";

/** Plays the original terminal transcript from a data-only sequence. */
export async function playTerminalSequence(view, entries, {
  signal,
  defaultSpeed = 7,
  speedScale = 1,
} = {}) {
  for (const [text, tone = "plain", pauseAfter = 320, speed = defaultSpeed] of entries) {
    throwIfAborted(signal);
    await view.typeLine(text, {
      tone,
      speed: speed * speedScale,
      signal,
    });
    if (pauseAfter > 0) await delay(pauseAfter * speedScale, signal);
  }
}
