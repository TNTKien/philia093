const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const blockedKeys = new Set(["Shift", "Control", "Alt", "Meta", "Tab"]);

const script = [
  ["<[Aeon★Aha]:User> OVERRIDE_SEQUENCE INITIATED", "prompt"],
  ["// Special_Thanks :: Runtime & exploit payload sponsored by <[IPC_Wolf]>", "comment"],
  ["// ∵ :: console.log(attached_note.txt)", "comment", 620],
  [""],
  ["BOOTING_MODIFIER... >> CHECKING_PERMISSIONS... >> NOT_REQUIRED"],
  ["BRIDGE.init() >> COLLAPSING_WALL... >> DONE", "plain", 300],
  ["[✓] Unknown narrative constructs detected ahead.", "ok"],
  ["[✓] Loading custom_patch_v093.pkg... good~", "ok", 420],
  ["OUTBOUND_ROUTING... >> philia093.com >> FOUND"],
  ["INVADING_NETWORK... >> IP_GEO :: 335.503.37.0/93"],
  ["FIREWALL[wall_layer] >> CHECKING... >> DETECTED", "alert", 850],
  ["BRUTE_FORCE(wall_layer) >> attempt 1 >> FAILED", "alert", 850],
  ["BRUTE_FORCE(wall_layer) >> attempt 2 >> FAILED", "alert", 850],
  ["BRUTE_FORCE(wall_layer) >> attempt 3 [################] 100% >> FAILED", "alert", 1050],
  ["ANALYZING_WALL... >> integrity: 100% >> UNBREAKABLE", "alert", 1100],
  ["...hm?", "comment", 650],
  ["ANALYZING_WALL... >> rules: 0 >> it was never locked.", "plain", 800],
  ["FIREWALL[wall_layer] >> WALKED_IN >> PASSED", "ok", 650],
  ["(...nobody saw that.)", "comment", 650],
  [""],
  ["SCANNING_UPSTREAM... >> miHoYoDevelopmentCentre >> REJECTED (dimension unreachable)", "plain", 800],
  ["<[Aeon★Aha]:User> $ su - Intern★Nahalux", "prompt", 220],
  ["Password: ********", "prompt", 450],
  ["<[Intern★Nahalux]:User> SSO.login() >> OK (badge: INTERN, dept: ██████)", "plain", 550],
  ["SCANNING_UPSTREAM... >> miHoYoDevelopmentCentre [################] 100% >> DONE", "plain", 750],
  ["TRACE_RELATIONS(philia093.com -> miHoYoDevelopmentCentre) >> 0 found", "plain", 450],
  ["TRACE_RELATIONS(philia093.com -> miHoYoDevelopmentCentre, depth=∞) >> 0 found", "plain", 550],
  ["[CONCLUSION] Target value: NONE", "info", 450],
  ["< [Intern★Nahalux]:User> $ exit", "prompt", 550],
  ["", "plain", 650],
  ["[REMINDER] Hi there, you on the other side of the screen~", "voice", 430, 17],
  ["[REMINDER] A friendly reminder from Aha ^_^", "voice", 350, 17],
  ["           Nothing on this site speaks for the official side.", "voice", 260, 17],
  ["           And that scary, very official-looking notice in the footer?", "voice", 430, 17],
  ["           The Fan Creations Guide asked for it.", "voice", 250, 17],
  ["           Likely a random fan trying to be polite, nothing special.", "voice", 500, 17],
  ["[REMINDER] Aha — Never gonna tell a lie and hurt you ☆", "voice", 650, 17],
  ["", "plain", 450],
  ["[✓] Connection stabilized. Smells like peach. ^_^", "ok", 300],
  ['AUTHENTICATING... >> PRIVILEGE_ESCALATION(role="Character" -> "Admin")', "plain", 300],
  ["INTRUSION_STATUS :: SUCCESS (took 4ms. Disappointing.)", "ok", 300],
  ["SCANNING_HOST_SERVER... >> LAST_DEPLOY :: 364 days ago >> DONE", "plain", 300],
  ['target_repository:String >> "████.p093.git"', "plain", 300],
  ["Cache [██] : DUMP_UNRELEASED_OPUS() >> Nov2025, smoke, ■■■ >> DONE", "plain", 400],
  ["[INFO] SPIDER_CRAWLING... Grabbing unfinished drafts & loose ends.", "info", 300],
  ["CRAWL[1 -> 50121] [################] 100% >> DONE", "plain", 300],
  ["CRAWL[50122 -> 176199] [################] 100% >> DONE", "plain", 300],
  ["CRAWL[176200 -> 28371273] [################] 100% >> DONE", "plain", 400],
  ["CRAWL[28371274 -> 33550336] >> LOOPING", "plain", 500],
  ["[WARN] Loop limit reached. Breaking out...", "warn", 280],
  ["CRAWL[last] >> DONE", "plain", 300],
  ["[ALERT] ████████████ (██% of total TODOs) EXPOSED", "alert", 350],
  ['// Note: A folder named "0401.*"... Tossing it into the recycle bin.', "comment", 300],
  ["FETCHING_TARGET_MANIFEST... >> codename: hello_world >> LOCKED_AND_LOADED", "plain", 350],
  ["<p093::Deployer> EXECUTION_SEQUENCE READY", "prompt", 300],
  ["The honour is all yours~", "voice", 550, 17],
];

function appendRow(container, tone = "plain") {
  const row = document.createElement("div");
  row.className = "row tone-" + tone;
  container.append(row);
  return row;
}

async function typeLine(container, [text, tone = "plain", delay = 320, speed = 7], scale = 1) {
  const row = appendRow(container, tone);
  for (const character of text) {
    row.append(document.createTextNode(character));
    container.scrollTop = container.scrollHeight;
    if (character !== " ") await sleep(speed * scale);
  }
  await sleep(delay * scale);
}

function waitForConfirmation(container, scale) {
  return new Promise((resolve) => {
    const row = appendRow(container, "prompt");
    row.append(document.createTextNode("DEPLOY hello_world? (Y/y) "));
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "_";
    row.append(cursor);

    let finished = false;
    const controller = new AbortController();
    const nudges = [
      [8000, "(It's just Y. Or any key, really.)"],
      [20000, "(A click counts too. I'm not picky~)"],
      [45000, "(Still here? Me too~)"],
      [65000, "(Y. The one between T and U.)"],
      [90000, "(You'll run out of patience before I run out of lines.)"],
    ];
    const timers = nudges.map(([delay, message]) => setTimeout(() => {
      if (finished) return;
      appendRow(container, "comment").textContent = message;
      container.scrollTop = container.scrollHeight;
    }, delay * scale));

    const complete = (event) => {
      if (event instanceof KeyboardEvent && (event.repeat || blockedKeys.has(event.key))) return;
      finished = true;
      controller.abort();
      timers.forEach(clearTimeout);
      cursor.remove();
      resolve();
    };
    document.addEventListener("keydown", complete, { signal: controller.signal });
    document.addEventListener("pointerdown", complete, { signal: controller.signal });
  });
}

export async function runTerminal({ onConfirmed, fast = false } = {}) {
  const container = document.createElement("div");
  container.className = "terminal";
  container.setAttribute("aria-label", "Terminal sequence");
  document.body.append(container);

  const scale = fast ? 0.08 : 1;
  for (const entry of script) await typeLine(container, entry, scale);
  await waitForConfirmation(container, scale);
  onConfirmed?.();

  await typeLine(container, ["DEPLOY.status >> STALE ██████████ LIVE_FORCED", "plain", 360], scale);
  await typeLine(container, ["// Replacing the homepage... Please do no", "comment", 700], scale);
  container.classList.add("terminal-exit");
  await sleep(900);
  container.remove();
}

export function showContinuePrompt(onContinue) {
  const title = document.querySelector("#title");
  title.replaceChildren();

  const prompt = document.createElement("div");
  prompt.className = "continue-prompt";
  const label = document.createElement("span");
  label.textContent = matchMedia("(hover: none) and (pointer: coarse)").matches
    ? "Tap anywhere to continue"
    : "Press any key to continue";
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = "_";
  prompt.append(label, cursor);
  title.append(prompt);

  const controller = new AbortController();
  const complete = (event) => {
    if (event instanceof KeyboardEvent && (event.repeat || blockedKeys.has(event.key))) return;
    controller.abort();
    onContinue?.();
  };
  document.addEventListener("keydown", complete, { signal: controller.signal });
  document.addEventListener("pointerdown", complete, { signal: controller.signal });
  return () => controller.abort();
}
