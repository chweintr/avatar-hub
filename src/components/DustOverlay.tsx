export default function DustOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: `
          radial-gradient(60% 50% at 50% 35%, rgba(255,255,255,.16), transparent 60%),
          radial-gradient(40% 35% at 70% 60%, rgba(173,216,230,.14), transparent 60%),
          radial-gradient(38% 35% at 35% 65%, rgba(255,182,193,.14), transparent 60%)
        `,
        mixBlendMode: "screen",
        filter: "saturate(110%) brightness(105%)",
        opacity: 0.65,
      }}
    />
  );
}
