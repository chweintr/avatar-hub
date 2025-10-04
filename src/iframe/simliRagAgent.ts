// Bundled entry for RAG-powered Simli avatar
const root = document.getElementById("root") as HTMLElement;
const videoContainer = document.getElementById("video-container") as HTMLElement;

function fail(msg: string) {
  console.error(msg);
  root.textContent = msg;
  throw new Error(msg);
}

// Parse URL parameters
const qp = new URLSearchParams(location.search);
const avatarId = (qp.get("id") || "").trim();
const faceId = (qp.get("faceId") || "").trim();
const useRag = qp.get("useRag") === "true";

// Railway → Vite: VITE_* variables are exposed to client code
const apiKey = (import.meta.env.VITE_SIMLI_API_KEY as string | undefined)?.trim();

if (!faceId) fail("Missing faceId");
if (!apiKey) fail("Missing Simli API key");

// Load Simli client from CDN
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

    root.textContent = "Connecting to avatar...";

    // Create video element for Simli
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    videoContainer.appendChild(video);

    // Initialize Simli client
    const client = new SimliClient(apiKey);
    let ragWebSocket: WebSocket | null = null;

    client.on("connected", () => {
      console.log("Connected to Simli");
      root.style.display = "none";
      videoContainer.style.display = "flex";

      // Connect to RAG backend if enabled
      if (useRag && avatarId === "grants") {
        connectToRAGBackend();
      }
    });

    client.on("disconnected", () => {
      console.log("Disconnected from Simli");
      root.style.display = "grid";
      root.textContent = "Disconnected";
      if (ragWebSocket) {
        ragWebSocket.close();
      }
    });

    client.on("error", (e: any) => {
      console.error("Simli error:", e);
      root.style.display = "grid";
      root.textContent = `Connection error: ${e.message || "Unknown error"}`;
    });

    // Handle speech-to-text from Simli
    client.on("speech", (data: any) => {
      console.log("User said:", data.text);
      if (useRag && ragWebSocket && ragWebSocket.readyState === WebSocket.OPEN) {
        sendToRAGBackend(data.text);
      }
    });

    // Start the Simli session
    await client.start(faceId, video);

    // RAG backend connection
    async function connectToRAGBackend() {
      try {
        const response = await fetch("/api/rag/ws");
        const { wsUrl } = await response.json();

        ragWebSocket = new WebSocket(wsUrl);

        ragWebSocket.onopen = () => {
          console.log("Connected to RAG backend");
        };

        ragWebSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "response" && client) {
            // Have avatar speak the RAG response
            client.sendText(data.text);
          }
        };

        ragWebSocket.onerror = (error) => {
          console.error("RAG WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect to RAG backend:", error);
      }
    }

    function sendToRAGBackend(query: string) {
      if (!ragWebSocket || ragWebSocket.readyState !== WebSocket.OPEN) {
        console.error("RAG backend not connected");
        return;
      }

      ragWebSocket.send(
        JSON.stringify({
          type: "query",
          text: query,
        })
      );
    }
  } catch (error: any) {
    fail(`Initialization failed: ${error.message}`);
  }
})();
