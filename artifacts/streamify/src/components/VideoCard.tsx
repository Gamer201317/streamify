import { Play, Star, Heart } from "lucide-react";
import type { VideoItem } from "@/lib/types";
import PosterArtwork from "./PosterArtwork";

interface VideoCardProps {
  item: VideoItem;
  index: number;
  onPlay: (item: VideoItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: VideoItem) => void;
  onDetail?: (item: VideoItem) => void;
}

function getQualityBadge(item: VideoItem): "4K" | "HD" | null {
  if (!item.rating) return "HD";
  if (item.rating >= 8.5) return "4K";
  if (item.rating >= 6) return "HD";
  return null;
}

const VideoCard = ({ item, index: _index, onPlay, isFavorite, onToggleFavorite, onDetail }: VideoCardProps) => {
  const quality = getQualityBadge(item);

  return (
    <div
      onClick={() => onDetail ? onDetail(item) : onPlay(item)}
      className="bg-card rounded-2xl overflow-hidden cursor-pointer border border-border transition-all duration-300 group
        hover:-translate-y-1.5 hover:border-primary/40
        hover:shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.35),0_0_0_1px_hsl(var(--primary)/0.15)]"
    >
      <div className="relative overflow-hidden">
        <div className="group-hover:scale-105 transition-transform duration-500 ease-out">
          <PosterArtwork item={item} />
        </div>

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_-2px_hsl(var(--primary)/0.6)] group-hover:scale-110 transition-transform duration-200">
              <Play size={18} className="text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Quality badge - top left */}
        {quality && (
          <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider
            ${quality === "4K"
              ? "bg-yellow-400/90 text-yellow-900"
              : "bg-sky-400/90 text-sky-900"
            } backdrop-blur-sm shadow-sm`}
          >
            {quality}
          </div>
        )}

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all z-10 ${
              isFavorite
                ? "bg-red-500/30 text-red-400 opacity-100"
                : "bg-background/40 text-foreground/50 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/20"
            }`}
          >
            <Heart size={13} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}

        {/* Type badge */}
        <div className={`absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm
          ${item.type === "Series" ? "bg-orange-500/80 text-white" : "bg-primary/80 text-primary-foreground"}`}>
          {item.type === "Series" ? "SERIE" : "FILM"}
        </div>
      </div>

      <div className="p-3">
        <div className="text-[13px] font-semibold mb-1 truncate">{item.title}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {item.genre && (
            <>
              <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold tracking-wide uppercase">
                {item.genre}
              </span>
              <span className="opacity-30">·</span>
            </>
          )}
          {item.year && (
            <>
              <span>{item.year}</span>
              <span className="opacity-30">·</span>
            </>
          )}
          {item.rating ? (
            <span className="flex items-center gap-0.5 text-accent font-bold">
              <Star size={9} fill="currentColor" />
              {item.rating}
            </span>
          ) : (
            <span className="text-muted-foreground/50">–</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
