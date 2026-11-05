import test from "node:test";
import assert from "node:assert/strict";
import { createTimelineClock } from "../src/runtime/clock.js";
import { delay } from "../src/runtime/delay.js";
import { clearVisit, hasVisited, markVisited, VISIT_STORAGE_KEY } from "../src/runtime/visit-store.js";
import { STORY_TIMELINE } from "../src/scene/story-timeline.js";
import { playTerminalSequence } from "../src/terminal/sequence-player.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function fakeFrames() {
  let time = 0;
  let id = 0;
  const frames = new Map();
  return {
    now: () => time,
    requestFrame(callback) { frames.set(++id, callback); return id; },
    cancelFrame(frameId) { frames.delete(frameId); },
    advance(nextTime) {
      time = nextTime;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(time));
    },
  };
}

test("visitor marker persists and can be cleared", () => {
  const storage = memoryStorage();
  assert.equal(hasVisited(storage), false);
  assert.equal(markVisited(storage, new Date("2026-11-06T12:00:00Z")), true);
  assert.equal(storage.getItem(VISIT_STORAGE_KEY), "2026-11-06T12:00:00.000Z");
  assert.equal(hasVisited(storage), true);
  clearVisit(storage);
  assert.equal(hasVisited(storage), false);
});

test("timeline clock keeps elapsed seconds across pause and resume", () => {
  const scheduler = fakeFrames();
  const clock = createTimelineClock({
    now: scheduler.now,
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
  });
  clock.start(2);
  scheduler.advance(1000);
  assert.equal(clock.currentTime, 3);
  clock.pause();
  scheduler.advance(5000);
  clock.resume();
  scheduler.advance(6000);
  assert.equal(clock.currentTime, 4);
  clock.seek(12);
  assert.equal(clock.currentTime, 12);
  clock.destroy();
  assert.throws(() => clock.start(), /destroyed/);
});

test("story timeline preserves scene transition anchors", () => {
  assert.deepEqual(STORY_TIMELINE.map(({ at }) => at), [...STORY_TIMELINE].map(({ at }) => at).sort((a, b) => a - b));
  assert.ok(STORY_TIMELINE.some(({ at, type }) => at === 26_000 && type === "morning"));
  assert.ok(STORY_TIMELINE.some(({ at, type }) => at === 34_000 && type === "heartbeat"));
  assert.ok(STORY_TIMELINE.some(({ at, type }) => at === 62_910 && type === "break"));
});

test("abortable delays reject with AbortError", async () => {
  const controller = new AbortController();
  const pending = delay(10_000, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("terminal sequence player passes tones and per-line typing speeds", async () => {
  const calls = [];
  const view = { async typeLine(text, options) { calls.push([text, options.tone, options.speed]); } };
  await playTerminalSequence(view, [["first", "prompt", 0], ["second", "warn", 0, 3]], { defaultSpeed: 8 });
  assert.deepEqual(calls, [["first", "prompt", 8], ["second", "warn", 3]]);
});
