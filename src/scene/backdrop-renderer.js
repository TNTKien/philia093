import { CanvasSurface } from "./canvas-surface.js";
import { clamp } from "./math.js";

const GLYPHS = ".,:;!*+x%$#";
const TAU = Math.PI * 2;
const PALETTE = Object.freeze({
  glyph: [240, 0, 147],
  upperRail: "#83c4d4",
  lowerRail: "#88d697",
});

/** Draws the animated glyph ribbon and the two diagnostic rails. */
export class BackdropRenderer {
  constructor(canvas) {
    this.surface = new CanvasSurface(canvas);
    this.lastDraw = 0;
  }

  draw(time, intensity = 1, brokenAge = null) {
    const ctx = this.surface.context;
    const { width, height } = this.surface;
    const glow = clamp(intensity, 0, 1);

    if (glow <= 0) {
      this.surface.clear();
      return;
    }

    const elapsedSinceDraw = time * 1000 - this.lastDraw;
    if (elapsedSinceDraw >= 0 && elapsedSinceDraw < 28 && brokenAge === null) return;
    this.surface.clear();

    const scale = Math.min(width / 1100, height / 620);
    const centerY = height / 2 + Math.sin(time * 1000 / 2600) * 3 * scale;
    this.lastDraw = time * 1000;

    ctx.save();
    ctx.translate(width / 2, centerY);
    ctx.scale(scale, scale);
    ctx.font = "11px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const rotation = time * 0.00008 * 1000;
    const rows = width < 700 ? 19 : 27;
    const columns = width < 700 ? 76 : 126;
    const radius = 315;
    const halfWidth = 112;
    const broken = brokenAge !== null;
    const tear = broken ? clamp(brokenAge / 1.9, 0, 1) : 0;

    for (let row = 0; row < rows; row += 1) {
      const v = (row / (rows - 1)) * 2 - 1;
      for (let column = 0; column < columns; column += 1) {
        const u = (column / columns) * TAU + rotation;
        const twist = v * halfWidth;
        const ring = radius + twist * Math.cos(u / 2);
        const x0 = ring * Math.cos(u);
        const y0 = ring * Math.sin(u);
        const z0 = twist * Math.sin(u / 2);
        const tilt = 0.88;
        const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
        const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
        const perspective = 1 / (1 + z1 / 1500);
        const depth = clamp(0.62 + z1 / 520, 0.12, 1);
        const displacement = tear * Math.sin(u * 9 + time * 10) * 90;
        const x = x0 * perspective + displacement * Math.cos(u * 3);
        const y = y1 * perspective + displacement * Math.sin(u * 2);
        const alpha = (0.23 + depth * 0.3) * glow;
        const glyph = GLYPHS[(row * columns + column + Math.floor(time * 1000 / 90)) % GLYPHS.length];

        ctx.fillStyle = `rgba(${PALETTE.glyph.join(",")},${alpha})`;
        ctx.fillText(glyph, x, y);
      }
    }

    this.drawRail(ctx, width / scale, time * 1000, -height / scale * 0.31, PALETTE.upperRail);
    this.drawRail(ctx, width / scale, time * 1000, height / scale * 0.31, PALETTE.lowerRail);
    ctx.restore();
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
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  destroy() {
    this.surface.destroy();
  }
}
