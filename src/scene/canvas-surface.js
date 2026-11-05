export class CanvasSurface {
  constructor(canvas, { maxPixelRatio = 2 } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("CanvasSurface requires a canvas element.");
    }

    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    if (!this.context) throw new Error("Canvas 2D is not available.");

    this.maxPixelRatio = maxPixelRatio;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => this.resize())
      : null;

    this.resizeObserver?.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect.height || window.innerHeight));
    const ratio = Math.min(this.maxPixelRatio, window.devicePixelRatio || 1);

    this.width = width;
    this.height = height;
    this.pixelRatio = ratio;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
