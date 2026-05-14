import { X, Play, Heart, Star, Calendar, Film, Tv, Clock, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { VideoItem } from "@/lib/types";
import PosterArtwork from "./PosterArtwork";

interface Provider {
  id: number;
  name: string;
  logo: string;
  logoUrl: string;
  watchUrl: string;
  mode: string;
}

interface ProviderData {
  providers: { stream: Provider[]; rent: Provider[] };
  justWatchLink: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  netflix:    "bg-red-600",
  disney:     "bg-blue-700",
  hbomax:     "bg-purple-700",
  appletv:    "bg-gray-800",
  prime:      "bg-sky-600",
  mubi:       "bg-orange-600",
  paramount:  "bg-blue-600",
  crunchyroll:"bg-orange-500",
  generic:    "bg-zinc-700",
};

interface VideoDetailModalProps {
  item: VideoItem | null;
  onClose: () => void;
  onPlay: (item: VideoItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (item: VideoItem) => void;
  onDelete?: (id: string) => void;
}

async function apiFetch(path: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const VideoDetailModal = ({ item, onClose, onPlay, isFavorite, onToggleFavorite, onDelete }: VideoDetailModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    if (!item?.tmdbId) { setProviderData(null); return; }
    setLoadingProviders(true);
    const mediaType = item.type === "Series" ? "tv" : "movie";
    apiFetch(`/search/${item.tmdbId}/providers?mediaType=${mediaType}`)
      .then((data) => setProviderData(data))
      .catch(() => setProviderData(null))
      .finally(() => setLoadingProviders(false));
  }, [item?.tmdbId, item?.type]);

  if (!item) return null;

  const canDelete = onDelete && !item.id.startsWith("s");

  const handleDelete = async () => {
    if (!item) return;
    const confirmed = window.confirm(`Weet je zeker dat je "${item.title}" wilt verwijderen?`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${item.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      onDelete?.(item.id);
      toast.success(`"${item.title}" verwijderd`);
      onClose();
    } catch {
      toast.error("Verwijderen mislukt.");
    } finally {
      setDeleting(false);
    }
  };

  const streamProviders = providerData?.providers.stream || [];
  const rentProviders = providerData?.providers.rent || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border-highlight rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Poster header */}
          <div className="relative h-[200px] overflow-hidden">
            {item.posterUrl ? (
              <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <PosterArtwork item={item} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 -mt-8 relative z-10">
            {/* Title + meta */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-[28px] leading-none tracking-wide text-accent">{item.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {item.type === "Movie" ? <Film size={12} /> : <Tv size={12} />}
                    {item.type}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {item.year}</span>
                  {item.rating && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-accent font-semibold">
                        <Star size={12} fill="currentColor" /> {item.rating}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => onToggleFavorite(item)}
                className={`p-2 rounded-full transition-all ${
                  isFavorite ? "bg-red-500/15 text-red-400" : "bg-foreground/5 text-muted-foreground hover:text-red-400"
                }`}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {item.genre && (
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
                {item.genre}
              </span>
            )}

            {item.desc && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.desc}</p>
            )}

            {item.type === "Series" && (
              <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                {item.seasons && <span>{item.seasons} seizoen{item.seasons > 1 ? "en" : ""}</span>}
                {item.eps && <span>{item.eps} afleveringen</span>}
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground font-medium">{tag}</span>
                ))}
              </div>
            )}

            {/* Streaming platforms */}
            {item.tmdbId && (
              <div className="mb-4">
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Waar kijken</div>
                {loadingProviders ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 size={12} className="animate-spin" /> Beschikbaarheid laden...
                  </div>
                ) : streamProviders.length > 0 ? (
                  <div className="space-y-1.5 mb-2">
                    {streamProviders.slice(0, 3).map((p) => (
                      <a
                        key={p.id}
                        href={p.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-85 transition-opacity ${PLATFORM_COLORS[p.logo] || PLATFORM_COLORS.generic}`}
                      >
                        {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-5 h-5 rounded object-cover" />}
                        <span>Kijk op {p.name}</span>
                        <ExternalLink size={11} className="ml-auto opacity-70" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mb-2">Niet beschikbaar via Nederlandse streamingdiensten.</div>
                )}
                {rentProviders.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {rentProviders.slice(0, 3).filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).map((p) => (
                      <a key={p.id} href={p.watchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border border-border-highlight text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                        {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-3.5 h-3.5 rounded object-cover" />}
                        Huur op {p.name}
                      </a>
                    ))}
                  </div>
                )}
                {providerData?.justWatchLink && (
                  <a href={providerData.justWatchLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink size={10} /> Alle opties op JustWatch
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onPlay(item)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Play size={16} fill="currentColor" /> Afspelen
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} className={deleting ? "animate-pulse" : ""} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground/60">
              <Clock size={10} />
              <span>Toegevoegd op {item.date}</span>
              {item.size && <span>· {item.size}</span>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoDetailModal;
