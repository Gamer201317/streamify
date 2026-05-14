import { Play, Star, Info, ExternalLink, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { VideoItem } from "@/lib/types";
import PosterArtwork from "./PosterArtwork";

export interface TmdbItem {
  id: number;
  tmdbId: number;
  mediaType: string;
  title: string;
  year: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
}

interface HeroBannerProps {
  item: VideoItem;
  onPlay: (item: VideoItem) => void;
  onDetail: (item: VideoItem) => void;
  tmdbSpotlight?: TmdbItem[];
}

const HeroBanner = ({ item, onPlay, onDetail, tmdbSpotlight }: HeroBannerProps) => {
  const [spotlightIdx, setSpotlightIdx] = useState(0);

  useEffect(() => {
    if (!tmdbSpotlight || tmdbSpotlight.length === 0) return;
    const interval = setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % Math.min(tmdbSpotlight.length, 8));
    }, 10000);
    return () => clearInterval(interval);
  }, [tmdbSpotlight]);

  const spotlight = tmdbSpotlight?.[spotlightIdx];

  if (spotlight) {
    return (
      <div className="relative w-full overflow-hidden" style={{ height: "calc(92vh - 64px)", minHeight: 480, maxHeight: 900 }}>
        {/* Background image crossfade */}
        <AnimatePresence mode="sync">
          <motion.div
            key={spotlight.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {spotlight.backdrop ? (
              <img
                src={spotlight.backdrop}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : spotlight.poster ? (
              <img
                src={spotlight.poster}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: "blur(10px)", transform: "scale(1.1)" }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Layered cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-12 px-8 md:px-16 max-w-3xl">
          <motion.div
            key={spotlight.id + "badges"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-4 flex-wrap"
          >
            <span className="text-[10px] font-black tracking-[0.25em] uppercase px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
              🔥 Trending Spotlight
            </span>
            {spotlight.rating && (
              <span className="flex items-center gap-1 text-accent text-sm font-bold">
                <Star size={13} fill="currentColor" />
                {spotlight.rating}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{spotlight.year}</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-foreground/10 backdrop-blur-sm text-muted-foreground font-semibold">
              {spotlight.mediaType === "tv" ? "SERIE" : "FILM"}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={spotlight.id + "title"}
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-display text-[56px] sm:text-[80px] md:text-[96px] leading-none tracking-wide text-accent mb-3"
            >
              {spotlight.title}
            </motion.h1>
          </AnimatePresence>

          {spotlight.overview && (
            <AnimatePresence mode="wait">
              <motion.p
                key={spotlight.id + "desc"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-sm text-foreground/70 max-w-lg mb-8 leading-relaxed line-clamp-2"
              >
                {spotlight.overview}
              </motion.p>
            </AnimatePresence>
          )}

          <motion.div
            key={spotlight.id + "actions"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <a
              href={`https://www.justwatch.com/nl/search?q=${encodeURIComponent(spotlight.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all hover:scale-[1.02] shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)]"
            >
              <ExternalLink size={15} /> Waar kijken
            </a>
            <a
              href={`https://www.themoviedb.org/${spotlight.mediaType}/${spotlight.tmdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-foreground/10 text-foreground backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-foreground/18 transition-all border border-foreground/10"
            >
              <Info size={15} /> Meer info
            </a>

            {/* Dot indicators */}
            <div className="flex gap-1.5 ml-2">
              {(tmdbSpotlight ?? []).slice(0, 8).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSpotlightIdx(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === spotlightIdx
                      ? "bg-primary w-6 h-2"
                      : "bg-foreground/25 w-2 h-2 hover:bg-foreground/50"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/30"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} className="animate-bounce" />
        </motion.div>
      </div>
    );
  }

  // Fallback: library item hero
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mx-6 mt-6 rounded-2xl overflow-hidden border border-border-highlight"
      style={{ minHeight: 320 }}
    >
      <div className="absolute inset-0 opacity-30">
        <PosterArtwork item={item} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

      <div className="relative z-10 p-8 flex flex-col justify-end min-h-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
            ⭐ Featured
          </span>
          {item.rating && (
            <span className="flex items-center gap-1 text-accent text-xs font-semibold">
              <Star size={12} fill="currentColor" />
              {item.rating}
            </span>
          )}
        </div>
        <h2 className="font-display text-[48px] leading-none tracking-wide text-accent mb-2">
          {item.title}
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mb-1">
          {item.genre} · {item.year} · {item.type}
          {item.type === "Series" && item.seasons
            ? ` · ${item.seasons} seizoen${item.seasons > 1 ? "en" : ""}`
            : ""}
        </p>
        {item.desc && (
          <p className="text-xs text-muted-foreground/80 max-w-md mb-4 line-clamp-2">{item.desc}</p>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onPlay(item)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]"
          >
            <Play size={16} fill="currentColor" /> Afspelen
          </button>
          <button
            onClick={() => onDetail(item)}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/10 text-foreground rounded-xl text-sm font-semibold hover:bg-foreground/15 transition-colors border border-border-highlight"
          >
            <Info size={16} /> Meer info
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroBanner;
