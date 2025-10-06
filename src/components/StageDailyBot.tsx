import { useCallback, useEffect, useRef, useState } from "react";
import { SimliClient } from "simli-client";
import {
  RTVIClient,
  RTVIClientConfigOption,
  RTVIError,
} from "realtime-ai";
import { DailyTransport } from "realtime-ai-daily";

type Props = {
  faceId: string;
  agentId?: string;
  scale?: number;
  stt?: string;
  llm?: string;
  tts?: string;
  config?: RTVIClientConfigOption[];
};

const simliClient = new SimliClient();

export default function StageDailyBot({
  faceId,
  agentId,
  scale = 0.82,
  stt = "deepgram",
  llm = "anthropic",
  tts = "cartesia",
  config = []
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [voiceClient, setVoiceClient] = useState<RTVIClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Ready");

  // Initialize Simli client
  const initializeSimliClient = useCallback(async () => {
    if (!videoRef.current || !audioRef.current) return;

    try {
      setStatus("Fetching Simli config…");
      const r = await fetch("/api/simli-config", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to get Simli config");
      const { apiKey } = await r.json();

      const SimliConfig = {
        apiKey,
        faceID: faceId,
        handleSilence: true,  // true for Daily Bot audio
        videoRef: videoRef,
        audioRef: audioRef,
        enableConsoleLogs: true,
      };

      await simliClient.Initialize(SimliConfig as any);
      console.log("Simli Client initialized");
    } catch (e: any) {
      throw new Error("Simli init failed: " + e.message);
    }
  }, [faceId]);

  // Initialize Daily Voice Client
  const initializeDailyVoiceClient = useCallback(() => {
    if (voiceClient) return voiceClient;

    const newVoiceClient = new RTVIClient({
      transport: new DailyTransport(),
      params: {
        baseUrl: `/api/dailybot`,
        requestData: {
          services: { stt, tts, llm },
        },
        endpoints: {
          connect: "/connect",
        },
        config: [
          {
            service: "llm",
            options: [
              { name: "model", value: "claude-3-5-sonnet-latest" },
              {
                name: "initial_messages",
                value: agentId ? [
                  {
                    role: "user",
                    content: [{
                      type: "text",
                      text: `You are a helpful AI assistant. Agent ID: ${agentId}`
                    }]
                  }
                ] : []
              },
              { name: "run_on_config", value: true }
            ]
          },
          ...config
        ],
      },
      callbacks: {
        onBotReady: () => {
          console.log("Daily Voice Client connected");
          setIsConnected(true);
          setStatus("Connected");
          getAudioTrackAndSendToSimli(newVoiceClient);
        },
      },
    });

    setVoiceClient(newVoiceClient);
    return newVoiceClient;
  }, [stt, llm, tts, agentId, config, voiceClient]);

  // Connect Daily Voice Client
  const connectDailyVoiceClient = async (client: RTVIClient) => {
    if (!client) return;

    try {
      setStatus("Connecting to Daily…");
      await client.connect();
    } catch (e) {
      setError((e as RTVIError).message || "Unknown error occurred");
      console.error("Error connecting to Daily Voice Client:", e);
      client.disconnect();
      setIsLoading(false);
    }
  };

  // Get bot audio track and send to Simli for lip-sync
  const getAudioTrackAndSendToSimli = (client: RTVIClient) => {
    if (simliClient) {
      const botAudioTrack = client.tracks().bot?.audio;
      if (botAudioTrack) {
        simliClient?.listenToMediastreamTrack(botAudioTrack);
        console.log("Sending bot audio to Simli for lip-sync");
      } else {
        console.error("Daily Bot audio track not found");
      }
    }
  };

  // Simli event listeners
  const setupSimliEvents = useCallback(() => {
    if (simliClient) {
      simliClient?.on("connected", () => {
        console.log("SimliClient connected");
        // Send initial silence to start connection
        const audioData = new Uint8Array(6000).fill(0);
        simliClient?.sendAudioData(audioData);
      });

      simliClient?.on("disconnected", () => {
        console.log("SimliClient disconnected");
      });

      simliClient?.on("error", (e: any) => {
        console.error("Simli error:", e);
      });
    }
  }, []);

  // Handle start
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize Simli
      await initializeSimliClient();

      // Start Simli client
      setStatus("Starting Simli…");
      await simliClient?.start();
      setupSimliEvents();

      // Initialize and connect Daily
      const client = initializeDailyVoiceClient();
      await connectDailyVoiceClient(client);
    } catch (error: any) {
      console.error("Error starting interaction:", error);
      setError(`Error: ${error.message}`);
      setIsLoading(false);
    }
  }, [initializeSimliClient, setupSimliEvents, initializeDailyVoiceClient]);

  // Handle stop
  const handleStop = useCallback(() => {
    console.log("Stopping interaction...");
    setIsLoading(false);
    setError("");
    setIsConnected(false);
    setStatus("Ready");

    // Clean up clients
    simliClient?.close();
    voiceClient?.disconnect();
  }, [voiceClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      simliClient?.close();
      voiceClient?.disconnect();
    };
  }, [voiceClient]);

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      {/* Circular crop */}
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(${scale})` }}
        />
        <audio ref={audioRef} autoPlay playsInline />

        {/* Status overlay */}
        <div className="absolute inset-x-0 bottom-2 text-center text-[11px] text-white/75 pointer-events-none">
          {!isConnected && status}
        </div>
      </div>

      {/* Ring/frame */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 shadow-[0_40px_120px_rgba(0,0,0,0.15)] pointer-events-none" />

      {/* Control button */}
      {!isConnected ? (
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow disabled:opacity-50"
        >
          {isLoading ? status : "Start"}
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-red-500 text-white px-5 py-2.5 text-sm shadow"
        >
          Stop
        </button>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-x-0 top-4 text-center text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
