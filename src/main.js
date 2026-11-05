import { AudioPlayer } from './audio.js';
import { Heartbeat } from './canvas/heartbeat.js';
import { MobiusBackdrop } from './canvas/mobius.js';
import { runTerminal, showContinuePrompt } from './terminal.js';
import { StoryEngine } from './story.js';
import { isFirstVisit, rememberVisitor, resetVisitor } from './storage.js';
import './styles.css';

const audio = new AudioPlayer();
const mobius = new MobiusBackdrop(document.querySelector('#backdrop'));
const heartbeat = new Heartbeat(document.querySelector('#heartbeat'));
const story = new StoryEngine({ audio, mobius, heartbeat });

const params = new URLSearchParams(location.search);
const fastMode = params.has('fast');
if (params.has('reset')) resetVisitor();

// Begin fetching media before the sequence reaches its first music cue.
audio.load();

if (isFirstVisit()) {
  runTerminal({
    fast: fastMode,
    onConfirmed: () => {
      // Resume the audio context inside the user's input gesture.
      audio.unlock();
      rememberVisitor();
    },
  }).then(() => story.start());
} else {
  showContinuePrompt(() => {
    audio.unlock();
    story.start();
  });
}

// Useful during visual checks without adding a visible settings menu.
window.philia093 = {
  reset: resetVisitor,
  start: () => story.start(),
  stop: () => story.stop(),
};
