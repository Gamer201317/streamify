import type { VideoItem } from "@/lib/types";

interface PosterArtworkProps {
  item: VideoItem;
  compact?: boolean;
}

const GENRE_TONES = {
  "Sci-Fi": "poster-tone-sci-fi",
  Drama: "poster-tone-drama",
  Thriller: "poster-tone-thriller",
  Fantasy: "poster-tone-fantasy",
  Comedy: "poster-tone-comedy",
  Action: "poster-tone-action",
} as const;

const getToneClass = (item: VideoItem) => {
  if (item.genre && item.genre in GENRE_TONES) {
    return GENRE_TONES[item.genre as keyof typeof GENRE_TONES];
  }
  const fallbackTones = Object.values(GENRE_TONES);
  const seed = `${item.title}${item.type}`
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackTones[seed % fallbackTones.length];
};

const PosterArtwork = ({ item, compact = false }: PosterArtworkProps) => {
  if (item.posterUrl) {
    return (
      <div className={`relative overflow-hidden ${compact ? "aspect-[2/3]" : "aspect-[2/3]"}`}>
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`poster-frame ${getToneClass(item)} ${compact ? "poster-frame-compact" : ""}`}
      aria-hidden="true"
    >
      <div className="poster-noise" />
      <div className="poster-sheen" />
      <div className="poster-content">
        <div className="flex items-start justify-between gap-2">
          <span className="poster-pill">{item.genre || item.type}</span>
          <span className="poster-meta">{item.year}</span>
        </div>

        <div className="mt-auto space-y-2">
          <div className="poster-kicker">{item.type === "Series" ? "Binge certified" : "Movie night approved"}</div>
          <div className={`font-display leading-none text-balance ${compact ? "text-[20px]" : "text-[34px]"}`}>
            {item.title}
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70">
            <span>{item.type === "Series" ? `${item.seasons || 1} seizoen${item.seasons === 1 ? "" : "en"}` : "Feature"}</span>
            <span>{item.rating ? `${item.rating} ★` : "Fresh drop"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterArtwork;
