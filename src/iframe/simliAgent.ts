// Bundled entry: reads import.meta.env.VITE_SIMLI_API_KEY at build/runtime
const root = document.getElementById("root") as HTMLElement;
const videoContainer = document.getElementById("video-container") as HTMLElement;

function fail(msg: string) {
  console.error(msg);
  root.textContent = msg;
  throw new Error(msg);
}

// Parse URL parameters
const qp = new URLSearchParams(location.search);
const agentId = (qp.get("agentId") || qp.get("id") || "").trim();
const faceId = (qp.get("faceId") || "").trim();

// Get API key from query param, env var, or window global
const apiKey = (
  qp.get("apiKey") ||
  (import.meta.env.VITE_SIMLI_API_KEY as string | undefined) ||
  ((window as any).SIMLI_API_KEY as string | undefined)
)?.trim();

if (!agentId || !faceId) fail("Missing agentId or faceId");
if (!apiKey) {
  fail(`Missing Simli API key. Env: ${import.meta.env.MODE}, HasKey: ${!!import.meta.env.VITE_SIMLI_API_KEY}`);
}

// Load Simli client from CDN (keeps bundle lean)
function loadSimliClient(): Promise<any> {
  if ((window as any).SimliClient) return Promise.resolve((window as any).SimliClient);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@simli-ai/simli-client@latest/dist/index.js";
    s.async = true;
    s.onload = () => resolve((window as any).SimliClient);
    s.onerror = () => reject(new Error("Failed to load Simli client"));
    document.head.appendChild(s);
  });
}

(async () => {
  try {
    root.textContent = "Loading Simli client...";
    const SimliClient = await loadSimliClient();

    root.textContent = "Connecting to Simli...";

    // Create video element for Simli
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    videoContainer.appendChild(video);

    // Initialize Simli client
    const client = new SimliClient(apiKey, {
      agentId,
      faceId,
    });

    client.on("connected", () => {
      console.log("Connected to Simli");
      root.style.display = "none";
      videoContainer.style.display = "flex";
    });

    client.on("disconnected", () => {
      console.log("Disconnected from Simli");
      root.style.display = "grid";
      root.textContent = "Disconnected";
    });

    client.on("error", (e: any) => {
      console.error("Simli error:", e);
      root.style.display = "grid";
      root.textContent = `Connection error: ${e.message || "Unknown error"}`;
    });

    // Start the Simli session with video element
    await client.start(faceId, video, {
      agentMode: true,
      agentId,
    });
  } catch (error: any) {
    fail(`Initialization failed: ${error.message}`);
  }
})();
