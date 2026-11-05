const TRACKS = Object.freeze({
  true: "/audio/TruE.aac",
  withYouOnceMore: "/audio/WithYouOnceMore.aac",
});

function getAudioContextConstructor() {
  return globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null;
}

/** Small Web Audio manager with lazy decoding and explicit source ownership. */
export class AudioEngine {
  constructor({ fetcher = globalThis.fetch?.bind(globalThis), contextFactory } = {}) {
    this.fetcher = fetcher;
    this.contextFactory = contextFactory;
    this.context = null;
    this.masterGain = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.activeSources = new Map();
    this.disposed = false;
  }

  getContext() {
    if (this.disposed) throw new Error("AudioEngine has been disposed.");
    if (this.context) return this.context;

    const Context = getAudioContextConstructor();
    if (!this.contextFactory && !Context) {
      throw new Error("Web Audio API is not supported by this browser.");
    }

    this.context = this.contextFactory ? this.contextFactory() : new Context();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  async unlock() {
    const context = this.getContext();
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  }

  async loadTrack(id) {
    if (!Object.hasOwn(TRACKS, id)) {
      throw new RangeError(`Unknown soundtrack: ${id}`);
    }
    if (this.buffers.has(id)) return this.buffers.get(id);
    if (this.loading.has(id)) return this.loading.get(id);

    if (typeof this.fetcher !== "function") {
      throw new Error("Fetch is not available; soundtrack assets cannot be loaded.");
    }

    const promise = (async () => {
      const response = await this.fetcher(TRACKS[id]);
      if (!response.ok) {
        throw new Error(`Unable to load ${TRACKS[id]} (HTTP ${response.status}).`);
      }

      const context = this.getContext();
      const bytes = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(bytes);
      this.buffers.set(id, buffer);
      return buffer;
    })();

    this.loading.set(id, promise);
    try {
      return await promise;
    } finally {
      this.loading.delete(id);
    }
  }

  async play(id, {
    offset = 0,
    delay = 0,
    loop = false,
    volume = 1,
  } = {}) {
    const context = this.getContext();
    await this.unlock();
    const buffer = await this.loadTrack(id);
    this.stopAll(0.25);

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = Boolean(loop);
    const targetVolume = Math.max(0, Number(volume) || 0);
    source.connect(gain);
    gain.connect(this.masterGain);

    const startAt = context.currentTime + Math.max(0, Number(delay) || 0);
    const safeOffset = Math.max(0, Math.min(Math.max(0, buffer.duration - 0.05), Number(offset) || 0));
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(targetVolume, startAt + 0.35);
    const handle = {
      source,
      gain,
      startAt,
      offset: safeOffset,
      stop: () => this.stop(id),
    };

    this.activeSources.set(id, handle);
    source.addEventListener("ended", () => {
      if (this.activeSources.get(id) === handle) this.activeSources.delete(id);
      source.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start(startAt, safeOffset);
    return handle;
  }

  stop(id, fadeSeconds = 0) {
    const handle = this.activeSources.get(id);
    if (!handle) return false;

    this.activeSources.delete(id);
    const now = this.context?.currentTime ?? 0;
    const fade = Math.max(0, Number(fadeSeconds) || 0);

    try {
      if (fade > 0) {
        handle.gain.gain.cancelScheduledValues(now);
        handle.gain.gain.setValueAtTime(handle.gain.gain.value, now);
        handle.gain.gain.linearRampToValueAtTime(0, now + fade);
        handle.source.stop(now + fade);
      } else {
        handle.source.stop();
      }
    } catch {
      // A source may already have ended between the map lookup and stop().
    }

    return true;
  }

  stopAll(fadeSeconds = 0) {
    for (const id of [...this.activeSources.keys()]) this.stop(id, fadeSeconds);
  }

  async suspend() {
    if (this.context?.state === "running") await this.context.suspend();
  }

  async resume() {
    if (this.context?.state === "suspended") await this.context.resume();
  }

  setVolume(value) {
    if (!this.context) return;
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.02);
  }

  async dispose() {
    if (this.disposed) return;
    this.stopAll();
    this.disposed = true;
    await this.context?.close();
    this.context = null;
    this.masterGain = null;
    this.buffers.clear();
    this.loading.clear();
  }
}

export { TRACKS };