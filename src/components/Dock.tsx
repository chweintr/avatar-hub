import { motion } from "framer-motion";

export type DockAvatar = {
  id: string;
  name: string;
  thumbnail?: string;
  simliUrl?: string;   // when present, this avatar can go to stage in simli mode
  heygenUrl?: string;  // when present, this avatar can go to stage in heygen mode
  provider?: 'simli' | 'heygen';
  disabled?: boolean;  // coming soon
};

type DockProps = {
  avatars: DockAvatar[];
  activeId?: string;
  onSelect: (a: DockAvatar) => void;
};

export function Dock({ avatars, activeId, onSelect }: DockProps) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-6" data-testid="dock">
      {avatars.map(a => {
        const isActive = a.id === activeId;
        const disabled = !!a.disabled;
        return (
          <li key={a.id}>
            <button
              onClick={() => (!disabled ? onSelect(a) : undefined)}
              disabled={disabled}
              className={`group flex flex-col items-center text-center select-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              aria-label={a.name}
              data-testid={`dock-avatar-${a.id}`}
            >
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="relative aspect-square w-20 sm:w-24 md:w-28 rounded-full overflow-hidden bg-neutral-100 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
              >
                {isActive ? (
                  <div className="h-full w-full grid place-items-center bg-neutral-200">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-neutral-400" fill="currentColor" aria-hidden>
                      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
                    </svg>
                  </div>
                ) : a.thumbnail ? (
                  <img src={a.thumbnail} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center">
                    <span className="text-xs text-neutral-500">{initials(a.name)}</span>
                  </div>
                )}
                {!disabled && !isActive && (
                  <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-black/10" />
                )}
              </motion.div>
              <span className="mt-2 text-[11px] text-neutral-700 leading-snug max-w-[7.5rem] truncate">{a.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "");
}