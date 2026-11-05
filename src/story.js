const timeline = [
  { at: 0, type: "begin" },
  { at: 5600, type: "verse", text: "Sweet Hesper, double name", style: "typed", ruby: true },
  { at: 7200, type: "glow", value: "dim" },
  { at: 8500, type: "verse", text: "For what is one, the first, the last," },
  { at: 12200, type: "verse", text: "Thou, like my present and my past," },
  { at: 17400, type: "verse", text: "Thy place is changed;" },
  { at: 20400, type: "append", text: " thou art the same." },
  { at: 23000, type: "clear" },
  { at: 26000, type: "morning" },
  { at: 34000, type: "heartbeat" },
  { at: 34000, type: "verse", text: "I dream of a star,", style: "running" },
  { at: 37540, type: "verse", text: "a land of eternity,", style: "running" },
  { at: 39850, type: "verse", text: "where I shall be born—", style: "running" },
  { at: 43310, type: "verse", text: "and in the depth of its iterant flame", style: "running" },
  { at: 46800, type: "verse", text: "my ripples will embrace a world,", style: "running" },
  { at: 50000, type: "verse", text: "like the wheatfield in the blazing sun.", style: "running" },
  { at: 58000, type: "clear" },
  { at: 62910, type: "break" },
  { at: 63200, type: "verse", text: "Hello, world!", style: "typed" },
];

const splitText = (text) => {
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)]
      .map((item) => item.segment);
  }
  return Array.from(text);
};

export class StoryEngine {
  constructor({ audio, mobius, heartbeat }) {
    this.audio = audio;
    this.mobius = mobius;
    this.heartbeat = heartbeat;
    this.stage = document.querySelector("#stage");
    this.credit = document.querySelector("#credit");
    this.timers = [];
    this.activePage = null;
  }

  start() {
    this.stop();
    this.stage.replaceChildren();
    this.activePage = null;
    document.querySelector("#title").replaceChildren();
    document.body.style.setProperty("--daybreak", "0s");
    document.body.dataset.stage = "night";
    this.credit.hidden = false;
    this.credit.toggleAttribute("data-shown", true);

    for (const event of timeline) {
      this.timers.push(setTimeout(() => this.dispatch(event), event.at));
    }
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.heartbeat.stop();
    this.mobius.reset();
    this.audio.stop();
  }

  dispatch(event) {
    switch (event.type) {
      case "begin":
        this.mobius.setGlow("lit");
        this.audio.play("TruE").catch((error) => console.info("[audio]", error.message));
        break;
      case "glow":
        this.mobius.setGlow(event.value);
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
        this.audio.play("WithYouOnceMore", { loop: true }).catch((error) => console.info("[audio]", error.message));
        break;
      case "heartbeat":
        this.heartbeat.start();
        break;
      case "break":
        this.mobius.break();
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

  showVerse({ text, style = "", ruby = false }) {
    const paragraph = document.createElement("p");
    paragraph.className = "lane verse" + (style ? " style-" + style : "");
    if (style === "typed") paragraph.classList.add("typed");
    this.createPage().append(paragraph);

    if (ruby) {
      this.appendGlyphs(paragraph, "Sweet ");
      const rubyElement = document.createElement("ruby");
      const base = document.createElement("span");
      const annotation = document.createElement("rt");
      annotation.className = "annotation is-shown";
      annotation.textContent = "Phosphor";
      rubyElement.append(base, annotation);
      paragraph.append(rubyElement);
      this.appendGlyphs(base, "Hesper", 6);
      this.appendGlyphs(paragraph, ", double name", 12);
      return;
    }

    this.appendGlyphs(paragraph, text, 0, style);
  }

  appendVerse(text) {
    const paragraph = this.activePage?.lastElementChild;
    if (paragraph) this.appendGlyphs(paragraph, text, splitText(paragraph.textContent).length, "running");
  }

  appendGlyphs(container, text, startIndex = 0, style = "plain") {
    const characters = splitText(text);
    const interval = style === "typed" ? 100 : style === "running" ? 65 : 62;
    const fragment = document.createDocumentFragment();

    characters.forEach((character, index) => {
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.textContent = character;
      fragment.append(glyph);
      setTimeout(() => glyph.classList.add("is-shown"), (startIndex + index) * interval);
    });
    container.append(fragment);
  }
}
