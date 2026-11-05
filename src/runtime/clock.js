const defaultNow = () => globalThis.performance?.now?.() ?? Date.now();

const defaultRequestFrame = (callback) => {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    throw new Error("requestAnimationFrame is not available in this environment.");
  }

  return globalThis.requestAnimationFrame(callback);
};

const defaultCancelFrame = (id) => {
  globalThis.cancelAnimationFrame?.(id);
};

/**
 * A deterministic seconds-based clock for the experience timeline.
 * The scheduler and time source are injectable so the clock can be tested
 * without a browser or real timers.
 */
export function createTimelineClock({
  onFrame = () => {},
  now = defaultNow,
  requestFrame = defaultRequestFrame,
  cancelFrame = defaultCancelFrame,
} = {}) {
  let state = "idle";
  let currentTime = 0;
  let anchorTime = 0;
  let anchorPosition = 0;
  let frameId = null;

  function emit() {
    onFrame(currentTime, { state });
  }

  function cancelScheduledFrame() {
    if (frameId === null) return;
    cancelFrame(frameId);
    frameId = null;
  }

  function update(timestamp) {
    if (state !== "running") return;

    const frameTime = Number.isFinite(timestamp) ? timestamp : now();
    currentTime = anchorPosition + Math.max(0, (frameTime - anchorTime) / 1000);
    emit();
    if (state === "running") frameId = requestFrame(update);
  }

  function assertAlive() {
    if (state === "destroyed") {
      throw new Error("The timeline clock has been destroyed.");
    }
  }

  function start(seconds = 0) {
    assertAlive();
    cancelScheduledFrame();

    currentTime = Math.max(0, Number(seconds) || 0);
    anchorPosition = currentTime;
    anchorTime = now();
    state = "running";
    emit();
    frameId = requestFrame(update);
    return currentTime;
  }

  function pause() {
    assertAlive();
    if (state !== "running") return currentTime;

    currentTime = anchorPosition + Math.max(0, (now() - anchorTime) / 1000);
    state = "paused";
    cancelScheduledFrame();
    emit();
    return currentTime;
  }

  function resume() {
    assertAlive();
    if (state === "running") return currentTime;

    anchorPosition = currentTime;
    anchorTime = now();
    state = "running";
    emit();
    frameId = requestFrame(update);
    return currentTime;
  }

  function seek(seconds) {
    assertAlive();
    currentTime = Math.max(0, Number(seconds) || 0);

    if (state === "running") {
      anchorPosition = currentTime;
      anchorTime = now();
    }

    emit();
    return currentTime;
  }

  function stop() {
    assertAlive();
    cancelScheduledFrame();
    currentTime = 0;
    anchorPosition = 0;
    state = "idle";
    emit();
  }

  function destroy() {
    if (state === "destroyed") return;
    cancelScheduledFrame();
    state = "destroyed";
  }

  return Object.freeze({
    start,
    pause,
    resume,
    seek,
    stop,
    destroy,
    get currentTime() {
      return currentTime;
    },
    get state() {
      return state;
    },
  });
}
