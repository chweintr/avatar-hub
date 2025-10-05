export default function AgentPlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <div
        className="absolute -inset-10 blur-2xl opacity-80"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,.12), rgba(255,200,230,.10), rgba(210,220,255,.10), rgba(255,255,255,.12))",
          animation: "spinCone 28s linear infinite",
          filter: "saturate(1.05)",
        }}
      />
      <style>{`@keyframes spinCone { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
