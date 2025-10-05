import { forwardRef } from "react";

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
        className="fixed border-0"
        style={{
          left: "50%",
          top: "40vh",
          transform: "translate(-50%, -50%)",
          width: "min(58vmin, 640px)",
          height: "min(58vmin, 640px)",
          borderRadius: "50%",
          zIndex: 16,
        }}
        allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
      />
    );
  }
);

export default SimliBackdrop;
