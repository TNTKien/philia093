import { CanvasSurface } from "./canvas-surface.js";

/** The paired diagnostic rails which pulse across the upper and lower frame. */
export class HeartbeatRenderer {
  constructor(canvas) {
    this.surface = new CanvasSurface(canvas);
  }

  draw(elapsedSeconds, intensity = 1) {
    const ctx = this.surface.context;
    const { width, height } = this.surface;
    const elapsed = Math.max(0, elapsedSeconds) * 1000;
    const pulse = (elapsed / 1800) % 1;
    const pulseX = width * (0.35 + pulse * 0.35);
    const amplitude = Math.min(22, height * 0.035) * Math.max(0, intensity);

    this.surface.clear();
    if (intensity <= 0) return;

    const rails = [
      { y: height * 0.185, color: "#83c4d4", direction: 1 },
      { y: height * 0.815, color: "#88d697", direction: -1 },
    ];

    for (const rail of rails) {
      const peak = amplitude * rail.direction;
      ctx.beginPath();
      ctx.moveTo(0, rail.y);
      ctx.lineTo(pulseX - 48, rail.y);
      ctx.lineTo(pulseX - 12, rail.y + peak);
      ctx.lineTo(pulseX + 18, rail.y - peak * 0.7);
      ctx.lineTo(pulseX + 52, rail.y);
      ctx.lineTo(width, rail.y);
      ctx.strokeStyle = rail.color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.35;
      ctx.shadowColor = rail.color;
      ctx.shadowBlur = 5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  destroy() {
    this.surface.destroy();
  }
}
