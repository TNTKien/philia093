const GLYPHS = ".,:;!*+x%$#";
const TAU = Math.PI * 2;

export class MobiusBackdrop {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.running = false;
    this.raf = 0;
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.glow = "off";
    this.brokenAt = 0;
    this.lastDraw = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setGlow(value) {
    this.glow = value;
    this.canvas.dataset.glow = value;
    if (value === "off") {
      this.stop();
      this.context.clearRect(0, 0, this.width, this.height);
    } else {
      this.start();
    }
  }

  reset() {
    this.brokenAt = 0;
    this.canvas.removeAttribute("data-broken");
    this.setGlow("off");
  }

  break() {
    this.brokenAt = performance.now();
    this.canvas.dataset.broken = "true";
    this.setGlow("lit");
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame((time) => this.draw(time));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  draw(time) {
    if (!this.running) return;
    if (time - this.lastDraw < 32) {
      this.raf = requestAnimationFrame((next) => this.draw(next));
      return;
    }
    this.lastDraw = time;

    const ctx = this.context;
    const { width, height } = this;
    const day = document.body.dataset.stage === "day";
    const scale = Math.min(width / 1100, height / 620);
    ctx.clearRect(0, 0, width, height);
    if (this.glow === "off") return;

    ctx.save();
    ctx.translate(width / 2, height / 2 + Math.sin(time / 2600) * 3 * scale);
    ctx.scale(scale, scale);
    ctx.font = "11px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const rotation = time * .00008;
    const rows = width < 700 ? 19 : 27;
    const columns = width < 700 ? 76 : 126;
    const radius = 315;
    const halfWidth = 112;
    const broken = this.canvas.hasAttribute("data-broken");
    const age = broken ? (time - this.brokenAt) / 1000 : 0;

    for (let row = 0; row < rows; row += 1) {
      const v = (row / (rows - 1)) * 2 - 1;
      for (let column = 0; column < columns; column += 1) {
        const u = (column / columns) * TAU + rotation;
        const twist = v * halfWidth;
        const ring = radius + twist * Math.cos(u / 2);
        const x0 = ring * Math.cos(u);
        const y0 = ring * Math.sin(u);
        const z0 = twist * Math.sin(u / 2);
        const tilt = .88;
        const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
        const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
        const perspective = 1 / (1 + z1 / 1500);
        const depth = Math.max(.12, Math.min(1, .62 + z1 / 520));
        const tear = broken ? Math.min(1, Math.max(0, age / 1.9)) : 0;
        const displacement = tear * Math.sin(u * 9 + time / 100) * 90;
        const x = x0 * perspective + displacement * Math.cos(u * 3);
        const y = y1 * perspective + displacement * Math.sin(u * 2);
        const alpha = (day ? .35 : .23) + depth * (day ? .44 : .3);
        const glyph = GLYPHS[(row * columns + column + Math.floor(time / 90)) % GLYPHS.length];
        ctx.fillStyle = "rgba(240, 0, 147, " + alpha + ")";
        ctx.fillText(glyph, x, y);
      }
    }

    this.drawRail(ctx, width, time, -height * .31, "#83c4d4");
    this.drawRail(ctx, width, time, height * .31, "#88d697");
    ctx.restore();
    this.raf = requestAnimationFrame((next) => this.draw(next));
  }

  drawRail(ctx, width, time, y, color) {
    const half = Math.min(520, width / 2 - 45);
    const pulseX = Math.sin(time / 1500) * 120;
    ctx.beginPath();
    ctx.moveTo(-half - 420, y);
    ctx.lineTo(pulseX - 140, y);
    ctx.lineTo(pulseX - 55, y + (y < 0 ? 13 : -11));
    ctx.lineTo(pulseX, y + (y < 0 ? -20 : 17));
    ctx.lineTo(pulseX + 55, y);
    ctx.lineTo(half + 420, y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = .82;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
