import { useEffect, useRef } from "react";
import { gradientThumb } from "../utils/placeholder";
import type { DockAvatar } from '../config/avatars';

type DockProps = {
  avatars: DockAvatar[];
  activeId?: string;
  busyId?: string;
  onSelect: (id: string) => void;
};

function DockChip({
  item,
  activeId,
  busyId,
  onClick,
}: {
  item: DockAvatar;
  activeId?: string;
  busyId?: string;
  onClick: (id: string) => void;
}) {
  const isActive = item.id === activeId;
  const isBusy = item.id === busyId;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    const onVisibility = () => document.visibilityState === "visible" && tryPlay();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <button
      onClick={() => onClick(item.id)}
      className="dock-btn"
      aria-label={item.name}
      aria-busy={isBusy ? "true" : "false"}
      data-testid={`dock-avatar-${item.id}`}
    >
      {item.thumbVideo ? (
        <video
          ref={videoRef}
          src={item.thumbVideo}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          className={`dock-media ${isBusy ? "dock-media--busy" : ""}`}
        />
      ) : item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.name}
          className={`dock-media ${isBusy ? "dock-media--busy" : ""}`}
        />
      ) : (
        <div className="dock-media grid place-items-center text-white/60 text-xs">
          {isActive ? (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
            </svg>
          ) : (
            item.name.slice(0, 8)
          )}
        </div>
      )}

      <span className={`dock-glow ${isBusy ? "dock-glow--on" : ""}`} />
      {isBusy && <span className="dock-fog" />}
      <span className="dock-label" title={item.name}>{item.name}</span>
    </button>
  );
}

export function Dock({ avatars, activeId, busyId, onSelect }: DockProps) {
  return (
    <ul
      className="flex items-center justify-center gap-4"
      data-testid="dock"
    >
      {avatars.map((a) => (
        <li key={a.id}>
          <DockChip item={a} activeId={activeId} busyId={busyId} onClick={onSelect} />
        </li>
      ))}
    </ul>
  );
}