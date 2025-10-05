import { motion } from "framer-motion";
import { gradientThumb } from "../utils/placeholder";
import type { DockAvatar } from '../config/avatars';

type DockProps = {
  avatars: DockAvatar[];
  activeId?: string;
  onSelect: (a: DockAvatar) => void;
};

function DockChip({
  item,
  activeId,
  onClick,
}: {
  item: DockAvatar;
  activeId?: string;
  onClick: (a: DockAvatar) => void;
}) {
  const isActive = item.id === activeId;
  const bg = item.thumbnail ? undefined : gradientThumb(item.name);

  return (
    <button
      onClick={() => onClick(item)}
      className="group flex w-[8.5rem] flex-col items-center text-center select-none"
      aria-label={item.name}
      data-testid={`dock-avatar-${item.id}`}
    >
      <motion.div
        initial={{ y: 0, scale: 1 }}
        whileHover={{
          y: -8,
          scale: isActive ? 1 : 1.05,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative aspect-square w-28 rounded-full overflow-hidden"
        style={{ background: bg }}
      >
        {/* Glassmorphic pill background */}
        <div className="absolute inset-0 bg-white/[.18] backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,.08)]" />

        {isActive ? (
          <div className="relative h-full w-full grid place-items-center">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 text-neutral-700"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
            </svg>
          </div>
        ) : item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.08]"
          />
        ) : null}

        {/* Enhanced ring glow on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-full ring-[1.5px] ring-white/40 mix-blend-overlay transition-all duration-300 group-hover:ring-white/60" />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_0_rgba(255,255,255,0)] transition-all duration-300 group-hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.3)]" />
      </motion.div>

      {/* Label under chip */}
      <div className="mt-3">
        <div className="text-balance line-clamp-2 text-[clamp(12px,1.6vw,13px)] font-medium text-neutral-800">
          {item.name}
        </div>
        <div className="mt-1 text-[11px] text-neutral-500">
          {item.id === "brainstormer" && "Ideas & prompts"}
          {item.id === "tax" && "Deductions, filing, 1099s"}
          {item.id === "grants" && "Eligibility & calendar"}
          {item.id === "crit" && "Structured feedback"}
        </div>
      </div>
    </button>
  );
}

export function Dock({ avatars, activeId, onSelect }: DockProps) {
  return (
    <ul
      className="flex flex-wrap items-center justify-center gap-7"
      data-testid="dock"
    >
      {avatars.map((a) => (
        <li key={a.id}>
          <DockChip item={a} activeId={activeId} onClick={onSelect} />
        </li>
      ))}
    </ul>
  );
}