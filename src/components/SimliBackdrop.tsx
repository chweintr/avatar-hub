type SimliBackdropProps = {
  url?: string; // e.g., "/simli-agent.html?agentId=...&faceId=..."
};

export default function SimliBackdrop({ url }: SimliBackdropProps) {
  if (!url) return null;
  return (
    <iframe
      title="Simli"
      src={url}
      className="fixed inset-0 w-screen h-screen z-0"
      allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
    />
  );
}
