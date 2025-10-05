import { forwardRef } from "react";
import { DEBUG_SIMLI } from "../config/flags";

type SimliBackdropProps = {
  url?: string;
};

const SimliBackdrop = forwardRef<HTMLIFrameElement, SimliBackdropProps>(
  function SimliBackdrop({ url }, ref) {
    if (!url) return null;
    return (
      <iframe
        ref={ref}
        title="Simli"
        src={url}
        allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
        className={
          DEBUG_SIMLI
            ? "fixed inset-0 w-screen h-screen z-[50] border-4 border-lime-400"
            : "fixed border-0"
        }
        style={
          DEBUG_SIMLI
            ? undefined
            : {
                left: "50%",
                top: "40vh",
                transform: "translate(-50%, -50%)",
                width: "min(58vmin, 640px)",
                height: "min(58vmin, 640px)",
                borderRadius: "50%",
                zIndex: 16,
              }
        }
      />
    );
  }
);

export default SimliBackdrop;
