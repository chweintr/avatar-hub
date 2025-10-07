import { ReactNode } from "react";

export default function Portal({ children }: { children: ReactNode }) {
  return (
    <div className="portal-frame">
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        {children}
      </div>
    </div>
  );
}
