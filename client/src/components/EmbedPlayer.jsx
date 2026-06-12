import { useState } from "react";

export default function EmbedPlayer({ url, title = "Live stream" }) {
  const [active, setActive] = useState(false);

  if (!url) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6">
        <span className="material-symbols-outlined text-primary text-5xl">hourglass_top</span>
        <p className="text-on-surface-variant text-sm max-w-md">
          Stream not available yet. Check back shortly before kickoff.
        </p>
      </div>
    );
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6 bg-black/80 hover:bg-black/70 transition-colors"
      >
        <span className="material-symbols-outlined text-primary text-5xl">play_circle</span>
        <p className="text-on-surface text-sm max-w-md font-medium">Click to load stream</p>
        <p className="text-on-surface-variant text-xs max-w-sm">
          Backup embed player. External ads may open in a new tab on first play.
        </p>
      </button>
    );
  }

  return (
    <iframe
      src={url}
      title={title}
      className="absolute inset-0 w-full h-full border-0 bg-black"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
