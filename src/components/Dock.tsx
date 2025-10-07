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
      className="group relative size-[92px] sm:size-[104px] rounded-full overflow-hidden dock-ring bg-white/6 hover:scale-[1.02] transition"
      aria-label={item.name}
      aria-busy={isBusy ? "true" : "false"}
      data-testid={`dock-avatar-${item.id}`}
      title={item.name}
    >
      {/* thumb video > thumbMp4 > image fallback */}
      {item.thumbMp4 || item.thumbVideo ? (
        <video
          ref={videoRef}
          src={item.thumbMp4 || item.thumbVideo}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/60 text-xs">
          {item.name.slice(0, 8)}
        </div>
      )}

      {/* white ring always */}
      <span className={`pointer-events-none absolute inset-0 rounded-full ring-2 ${isBusy ? "ring-white" : "ring-white/85"}`} />

      {/* fog/"in service" state */}
      {isBusy && <span className="dock-fog absolute inset-0 rounded-full" />}

      {/* label */}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center text-[11px] text-white/85">
        {item.name}
      </span>

      {/* pulse when busy */}
      <span className={`absolute -inset-[2px] rounded-full ${isBusy ? "dock-active" : ""}`} />
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