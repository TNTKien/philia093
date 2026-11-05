export class Heartbeat {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.running = false;
    this.raf = 0;
    this.startedAt = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    if (this.running) return;
    this.startedAt = performance.now();
    this.running = true;
    this.raf = requestAnimationFrame((time) => this.draw(time));
  }

  draw(time) {
    if (!this.running) return;
    const ctx = this.context;
    const elapsed = time - this.startedAt;
    ctx.clearRect(0, 0, this.width, this.height);
    const pulse = (elapsed / 1800) % 1;
    const pulseX = this.width * (.35 + pulse * .35);
    const amplitude = Math.min(22, this.height * .035);

    for (const rail of [
      { y: this.height * .185, color: "#83c4d4", invert: false },
      { y: this.height * .815, color: "#88d697", invert: true },
    ]) {
      const sign = rail.invert ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(0, rail.y);
      ctx.lineTo(pulseX - 48, rail.y);
      ctx.lineTo(pulseX - 12, rail.y + sign * amplitude);
      ctx.lineTo(pulseX + 18, rail.y - sign * amplitude * .7);
      ctx.lineTo(pulseX + 52, rail.y);
      ctx.lineTo(this.width, rail.y);
      ctx.strokeStyle = rail.color;
      ctx.globalAlpha = .8;
      ctx.lineWidth = 1.35;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.raf = requestAnimationFrame((next) => this.draw(next));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.context.clearRect(0, 0, this.width, this.height);
  }
}
