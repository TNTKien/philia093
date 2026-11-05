import "./styles.css";
import { AudioEngine } from "./audio/audio-engine.js";
import { createExperienceController, clearVisit } from "./runtime/experience-controller.js";
import { StoryDirector } from "./scene/story-director.js";

const elements = {
  backdrop: document.querySelector("#backdrop"),
  heartbeat: document.querySelector("#heartbeat"),
  stage: document.querySelector("#stage"),
  title: document.querySelector("#title"),
  credit: document.querySelector("#credit"),
};

if (Object.values(elements).some((element) => !element)) {
  throw new Error("The page is missing one or more required experience elements.");
}

const audio = new AudioEngine();
const story = new StoryDirector({
  audio,
  backdropCanvas: elements.backdrop,
  heartbeatCanvas: elements.heartbeat,
  stage: elements.stage,
  title: elements.title,
  credit: elements.credit,
});

const terminalElement = document.createElement("div");
terminalElement.setAttribute("aria-label", "Terminal sequence");
elements.stage.append(terminalElement);

const experience = createExperienceController({
  terminalElement,
  titleElement: elements.title,
  onInput: () => {
    void audio.unlock().catch((error) => console.info("[audio]", error.message));
  },
  onStart: () => story.start(),
});

let wasPlayingBeforeHide = false;
function handleVisibilityChange() {
  if (document.hidden) {
    wasPlayingBeforeHide = story.clock.state === "running";
    if (wasPlayingBeforeHide) story.pause();
    void audio.suspend().catch((error) => console.info("[audio]", error.message));
    return;
  }

  if (wasPlayingBeforeHide) story.resume();
  void audio.resume().catch((error) => console.info("[audio]", error.message));
  wasPlayingBeforeHide = false;
}

function teardown() {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  experience.destroy();
  story.destroy();
  void audio.dispose();
}

document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", teardown, { once: true });

// Useful local test helpers; they are intentionally absent from production builds.
if (import.meta.env.DEV) {
  window.resetPhiliaVisit = () => {
    clearVisit();
    location.reload();
  };
  window.philia093 = Object.freeze({
    seek: (milliseconds) => story.seek(milliseconds),
    pause: () => story.pause(),
    resume: () => story.resume(),
    get state() { return experience.state; },
    get timelineSeconds() { return story.clock.currentTime; },
  });
}

void experience.start();
