export default function EmbedPlayer({ url, title = "Live stream" }) {
  if (!url) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6">
        <span className="material-symbols-outlined text-primary text-5xl">hourglass_top</span>
        <p className="text-on-surface-variant text-sm max-w-md">
          Stream embed not available yet. Links often appear shortly before kickoff.
        </p>
      </div>
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
