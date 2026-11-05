const TRACKS = {
  TruE: '/audio/TruE.aac',
  WithYouOnceMore: '/audio/WithYouOnceMore.aac',
};

export class AudioPlayer {
  #context = null;
  #buffers = new Map();
  #current = null;
  #loadPromise = null;

  load() {
    if (this.#loadPromise) return this.#loadPromise;

    this.#loadPromise = Promise.all(
      Object.entries(TRACKS).map(async ([name, url]) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
          const data = await response.arrayBuffer();
          const buffer = await this.#getContext().decodeAudioData(data);
          this.#buffers.set(name, buffer);
        } catch (error) {
          console.info(`[audio] ${name} is not available yet:`, error.message);
        }
      }),
    );

    return this.#loadPromise;
  }

  unlock() {
    try {
      const context = this.#getContext();
      if (context.state !== 'running') return context.resume().catch(() => {});
    } catch (error) {
      console.info('[audio] Web Audio is unavailable:', error.message);
    }
    return Promise.resolve();
  }

  async play(name, { loop = false, offset = 0, fadeIn = 0.35 } = {}) {
    await this.load();
    const buffer = this.#buffers.get(name);
    if (!buffer) return false;

    const context = this.#getContext();
    if (context.state !== 'running') await context.resume().catch(() => {});
    this.stop(0.25);

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + fadeIn);
    source.start(now, Math.max(0, Math.min(offset, Math.max(0, buffer.duration - 0.05))));
    this.#current = { source, gain };
    source.addEventListener('ended', () => {
      if (this.#current?.source === source) this.#current = null;
    }, { once: true });
    return true;
  }

  stop(fadeOut = 0.3) {
    if (!this.#current) return;
    const { source, gain } = this.#current;
    const now = this.#getContext().currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeOut);
    try {
      source.stop(now + fadeOut + 0.02);
    } catch {
      // The source may already have ended.
    }
    this.#current = null;
  }

  #getContext() {
    if (!this.#context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Web Audio API is not supported in this browser.');
      this.#context = new Context();
    }
    return this.#context;
  }
}