import "./styles.css";

// Load the original, self-contained production runtime from the supplied site bundle.
// Keeping it as a single module preserves its renderer, story parser, and audio clock.
const runtimeUrl = "/assets/site-runtime.js.gzbin";

async function loadOriginalRuntime() {
  const response = await fetch(runtimeUrl);
  if (!response.ok) {
    throw new Error(`Unable to load the animation runtime: HTTP ${response.status}`);
  }

  if (!("DecompressionStream" in window)) {
    throw new Error("This browser does not support gzip stream decompression.");
  }

  const source = await new Response(
    response.body.pipeThrough(new DecompressionStream("gzip")),
  ).text();

  const moduleUrl = URL.createObjectURL(
    new Blob([source], { type: "text/javascript" }),
  );

  try {
    await import(moduleUrl);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }
}

loadOriginalRuntime().catch((error) => {
  console.error("[philia093] Runtime could not start:", error);
  const status = document.createElement("p");
  status.className = "status";
  status.textContent = "Hello, world!\nThe experience could not be loaded.";
  document.body.append(status);
});