import { createTimelineClock } from "../runtime/clock.js";
import { STORY_TIMELINE } from "./story-timeline.js";
import { BackdropRenderer } from "./backdrop-renderer.js";
import { HeartbeatRenderer } from "./heartbeat-renderer.js";

const splitText = (text) => {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)]
      .map((part) => part.segment);
  }
  return Array.from(text);
};

const GLYPH_INTERVAL = Object.freeze({ typed: 0.1, running: 0.065, plain: 0.062 });

export class StoryDirector {
  constructor({ audio, backdropCanvas, heartbeatCanvas, stage, title, credit } = {}) {
    if (!backdropCanvas || !heartbeatCanvas || !stage || !title) {
      throw new TypeError("StoryDirector requires both canvases, stage, and title elements.");
    }

    this.audio = audio;
    this.backdropCanvas = backdropCanvas;
    this.stage = stage;
    this.title = title;
    this.credit = credit;
    this.backdrop = new BackdropRenderer(backdropCanvas);
    this.heartbeat = new HeartbeatRenderer(heartbeatCanvas);
    this.glow = "off";
    this.backdropCanvas.dataset.glow = "off";
    this.backdropCanvas.removeAttribute("data-broken");
    this.brokenAt = null;
    this.heartbeatStartedAt = null;
    this.nextEvent = 0;
    this.eventTime = 0;
    this.activePage = null;
    this.destroyed = false;
    this.replaying = false;
    this.clock = createTimelineClock({ onFrame: (time) => this.render(time) });
  }

  start() {
    if (this.destroyed) throw new Error("StoryDirector has been destroyed.");
    this.stop();
    this.nextEvent = 0;
    this.activePage = null;
    this.glow = "off";
    this.backdropCanvas.dataset.glow = "off";
    this.backdropCanvas.removeAttribute("data-broken");
    this.brokenAt = null;
    this.heartbeatStartedAt = null;
    this.stage.replaceChildren();
    this.title.replaceChildren();
    this.title.classList.remove("is-visible");
    document.body.style.setProperty("--daybreak", "0s");
    document.body.dataset.stage = "night";
    this.credit?.removeAttribute("hidden");
    this.credit?.setAttribute("data-shown", "");
    this.clock.start(0);
  }

  stop() {
    if (this.clock.state === "running" || this.clock.state === "paused") this.clock.stop();
    this.audio?.stopAll(0.2);
    this.glow = "off";
    this.backdropCanvas.dataset.glow = "off";
    this.backdropCanvas.removeAttribute("data-broken");
    this.backdrop.draw(0, 0);
    this.heartbeat.draw(0, 0);
  }

  seek(milliseconds) {
    const target = Math.max(0, Number(milliseconds) || 0) / 1000;
    this.nextEvent = 0;
    this.glow = "off";
    this.backdropCanvas.dataset.glow = "off";
    this.backdropCanvas.removeAttribute("data-broken");
    this.brokenAt = null;
    this.heartbeatStartedAt = null;
    this.stage.replaceChildren();
    this.activePage = null;
    document.body.style.setProperty("--daybreak", "0s");
    document.body.dataset.stage = "night";
    this.replaying = true;
    this.clock.seek(target);
    this.replaying = false;
  }

  render(timeSeconds) {
    const time = timeSeconds * 1000;
    while (this.nextEvent < STORY_TIMELINE.length && STORY_TIMELINE[this.nextEvent].at <= time) {
      this.dispatch(STORY_TIMELINE[this.nextEvent]);
      this.nextEvent += 1;
    }

    const intensity = this.glow === "lit" ? 0.85 : this.glow === "dim" ? 0.16 : 0;
    this.backdrop.draw(timeSeconds, intensity, this.brokenAt === null ? null : timeSeconds - this.brokenAt);
    const heartbeatIntensity = this.heartbeatStartedAt === null ? 0 : 1;
    this.heartbeat.draw(timeSeconds - (this.heartbeatStartedAt ?? 0), heartbeatIntensity);
    this.revealGlyphs(timeSeconds);
    document.body.style.setProperty("--scene-progress", String(Math.min(1, timeSeconds / 2.2)));
  }

  dispatch(event) {
    this.eventTime = event.at / 1000;
    switch (event.type) {
      case "begin":
        this.glow = "lit";
        this.backdropCanvas.dataset.glow = "lit";
        if (!this.replaying) {
          void this.audio?.play("true").catch((error) => console.info("[audio]", error.message));
        }
        break;
      case "glow":
        this.glow = event.value;
        this.backdropCanvas.dataset.glow = event.value;
        break;
      case "verse":
        this.showVerse(event);
        break;
      case "append":
        this.appendVerse(event.text);
        break;
      case "clear":
        this.stage.replaceChildren();
        this.activePage = null;
        break;
      case "morning":
        document.body.style.setProperty("--daybreak", "6s");
        document.body.dataset.stage = "day";
        if (!this.replaying) {
          void this.audio?.play("withYouOnceMore", { loop: true }).catch((error) => console.info("[audio]", error.message));
        }
        break;
      case "heartbeat":
        this.heartbeatStartedAt = event.at / 1000;
        break;
      case "break":
        this.brokenAt = event.at / 1000;
        this.backdropCanvas.dataset.broken = "true";
        break;
      default:
        break;
    }
  }

  createPage() {
    if (this.activePage) return this.activePage;
    this.activePage = document.createElement("section");
    this.activePage.className = "page";
    this.stage.append(this.activePage);
    return this.activePage;
  }

  showVerse({ text, style = "plain", ruby = false }) {
    const paragraph = document.createElement("p");
    paragraph.className = `lane verse style-${style}`;
    if (style === "typed") paragraph.classList.add("typed");
    this.createPage().append(paragraph);

    if (ruby) {
      this.appendGlyphs(paragraph, "Sweet ", 0, "typed");
      const rubyElement = document.createElement("ruby");
      const base = document.createElement("span");
      const annotation = document.createElement("rt");
      annotation.className = "annotation is-shown";
      annotation.textContent = "Phosphor";
      rubyElement.append(base, annotation);
      paragraph.append(rubyElement);
      this.appendGlyphs(base, "Hesper", 6, "typed");
      this.appendGlyphs(paragraph, ", double name", 12, "typed");
      return;
    }

    this.appendGlyphs(paragraph, text, 0, style);
  }

  appendVerse(text) {
    const paragraph = this.activePage?.lastElementChild;
    if (!paragraph) return;
    this.appendGlyphs(paragraph, text, paragraph.querySelectorAll(".glyph").length, "running");
  }

  appendGlyphs(container, text, startIndex = 0, style = "plain") {
    const interval = GLYPH_INTERVAL[style] ?? GLYPH_INTERVAL.plain;
    const fragment = document.createDocumentFragment();

    for (const [index, character] of splitText(text).entries()) {
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.textContent = character;
      glyph.dataset.revealAt = String(this.eventTime + (startIndex + index) * interval);
      fragment.append(glyph);
    }

    container.append(fragment);
  }

  revealGlyphs(timeSeconds) {
    for (const glyph of this.stage.querySelectorAll(".glyph:not(.is-shown)")) {
      if (timeSeconds >= Number(glyph.dataset.revealAt)) glyph.classList.add("is-shown");
    }
  }

  pause() {
    this.clock.pause();
  }

  resume() {
    this.clock.resume();
  }

  destroy() {
    if (this.destroyed) return;
    this.stop();
    this.clock.destroy();
    this.backdrop.destroy();
    this.heartbeat.destroy();
    this.destroyed = true;
  }
}
