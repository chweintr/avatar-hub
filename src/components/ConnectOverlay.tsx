import { useEffect } from "react";

export default function ConnectOverlay({
  iframeRef,
  visible,
  scale = 0.85,
  onReady,
  cx = "50%",
  cy = "40vh",
  d = "min(58vmin, 640px)",
}: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  visible: boolean;
  scale?: number;
  onReady?: () => void;
  cx?: string;
  cy?: string;
  d?: string;
}) {
  // Listen for SIMLI_READY to hide the button
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "SIMLI_READY" || e.data?.type === "SIMLI_CONNECTED") {
        onReady?.();
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onReady]);

  // Push initial scale whenever URL/iframe mounts
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (win)
      win.postMessage(
        { type: "SIMLI_SET_SCALE", payload: scale },
        window.location.origin
      );
  }, [iframeRef, scale]);

  if (!visible) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 25, pointerEvents: "none" }}
      aria-hidden
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const win = iframeRef.current?.contentWindow;
          if (!win) return;

          // Send message to trigger start
          win.postMessage({ type: "SIMLI_START" }, window.location.origin);

          try {
            // Also try to click the hidden button directly
            const startBtn = win.document?.getElementById("startBtn") as
              | HTMLButtonElement
              | null;
            if (startBtn) {
              startBtn.click();
            }
          } catch (error) {
            // Cross-origin - message should work
            console.warn("Cross-origin, using postMessage", error);
          }
        }}
        style={{
          position: "absolute",
          left: `calc(${cx} - 70px)`,
          top: `calc(${cy} + calc((${d})/2) - 60px)`,
          width: 140,
          height: 44,
          borderRadius: 9999,
          background: "white",
          color: "black",
          border: "0",
          fontSize: "14px",
          fontFamily: "system-ui",
          cursor: "pointer",
          pointerEvents: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,.18)",
        }}
      >
        Connect
      </button>
    </div>
  );
}
