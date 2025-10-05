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
        className="fixed inset-0 w-screen h-screen z-0 border-0"
        allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
      />
    );
  }
);

export default SimliBackdrop;
