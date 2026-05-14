import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import BrowseView from "@/components/BrowseView";
import UploadView from "@/components/UploadView";
import LibraryView from "@/components/LibraryView";
import VideoPlayer from "@/components/VideoPlayer";
import VideoDetailModal from "@/components/VideoDetailModal";
import ParticleBackground from "@/components/ParticleBackground";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useAuth } from "@/hooks/useAuth";
import { SAMPLE_VIDEOS, type VideoItem } from "@/lib/types";

type View = "home" | "upload" | "library";

interface WatchHistoryEntry {
  video_id: string;
  progress: number;
  last_watched_at: string;
}

interface ApiVideo {
  id: string;
  title: string;
  type: string;
  genre: string | null;
  year: number | null;
  rating: number | null;
  seasons: number | null;
  episodes: number | null;
  description: string | null;
  tags: string[] | null;
  fileSize: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  tmdbId: number | null;
  status: string;
  createdAt: string;
}

interface ApiWatchHistoryEntry {
  videoId: string;
  progress: number;
  lastWatchedAt: string;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`API error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [playingItem, setPlayingItem] = useState<VideoItem | null>(null);
  const [detailItem, setDetailItem] = useState<VideoItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [watchHistory, setWatchHistory] = useState<Map<string, WatchHistoryEntry>>(new Map());
  const { rainbowMode } = useEasterEggs();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    apiFetch("/videos")
      .then((data: ApiVideo[]) => {
        if (data) {
          setUserVideos(
            data.map((v) => ({
              id: v.id,
              title: v.title,
              type: v.type as "Movie" | "Series",
              genre: v.genre || "",
              year: v.year || new Date().getFullYear(),
              rating: v.rating ?? null,
              seasons: v.seasons ?? undefined,
              eps: v.episodes ?? undefined,
              desc: v.description ?? undefined,
              tags: v.tags ?? [],
              size: v.fileSize ?? "",
              date: new Date(v.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }),
              status: v.status as "live" | "processing",
              videoUrl: v.videoUrl ?? undefined,
              posterUrl: v.posterUrl ?? undefined,
              tmdbId: v.tmdbId ?? undefined,
            }))
          );
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/favorites")
      .then((data: string[] | null) => {
        if (data) setFavorites(new Set(data));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/watch-history")
      .then((data: ApiWatchHistoryEntry[]) => {
        if (data) {
          const map = new Map<string, WatchHistoryEntry>();
          data.forEach((h) => map.set(h.videoId, { video_id: h.videoId, progress: h.progress, last_watched_at: h.lastWatchedAt }));
          setWatchHistory(map);
        }
      })
      .catch(() => {});
  }, [user]);

  const allItems = [...SAMPLE_VIDEOS, ...userVideos];

  const continueWatching = allItems.filter((item) => {
    const entry = watchHistory.get(item.id);
    return entry && entry.progress > 1 && entry.progress < 95;
  }).sort((a, b) => {
    const ea = watchHistory.get(a.id)!;
    const eb = watchHistory.get(b.id)!;
    return new Date(eb.last_watched_at).getTime() - new Date(ea.last_watched_at).getTime();
  });

  const handleUploaded = useCallback((item: VideoItem) => {
    setUserVideos((prev) => [item, ...prev]);
    toast.success(`"${item.title}" toegevoegd aan je library! 🎬`);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setUserVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleToggleFavorite = useCallback(async (item: VideoItem) => {
    if (!user) return;
    const isFav = favorites.has(item.id);
    if (isFav) {
      setFavorites((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
      await apiFetch(`/favorites/${item.id}`, { method: "DELETE" }).catch(() => {});
      toast("Verwijderd uit favorieten", { icon: "💔" });
    } else {
      setFavorites((prev) => new Set(prev).add(item.id));
      await apiFetch(`/favorites/${item.id}`, { method: "POST" }).catch(() => {});
      toast("Toegevoegd aan favorieten!", { icon: "❤️" });
    }
  }, [user, favorites]);

  const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number, videoDuration: number) => {
    if (!user || videoDuration <= 0) return;
    const progressPct = (currentTime / videoDuration) * 100;
    const now = new Date().toISOString();
    setWatchHistory((prev) => {
      const next = new Map(prev);
      next.set(videoId, { video_id: videoId, progress: progressPct, last_watched_at: now });
      return next;
    });
    await apiFetch(`/watch-history/${videoId}`, {
      method: "PUT",
      body: JSON.stringify({ progress: progressPct, lastWatchedAt: now }),
    }).catch(() => {});
  }, [user]);

  const handlePlay = useCallback((item: VideoItem) => {
    setDetailItem(null);
    setPlayingItem(item);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const genreCounts = userVideos.reduce<Record<string, number>>((acc, item) => {
    const key = item.genre || "Mysterie";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chaotisch goed";
  const stats = {
    totalTitles: userVideos.length,
    movieCount: userVideos.filter((item) => item.type === "Movie").length,
    seriesCount: userVideos.filter((item) => item.type === "Series").length,
    liveCount: userVideos.filter((item) => item.status === "live").length,
    topGenre,
  };

  return (
    <div id="root" className={`min-h-screen flex flex-col ${rainbowMode ? "rainbow-mode" : ""}`}>
      <ParticleBackground />
      <Navbar currentView={view} onNavigate={setView} user={user!} onSignOut={signOut} stats={stats} />
      <MobileNav currentView={view} onNavigate={setView} user={user!} onSignOut={signOut} stats={stats} />

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {view === "home" && (
            <BrowseView
              items={allItems}
              onPlay={handlePlay}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onDetail={setDetailItem}
              continueWatching={continueWatching}
              watchProgress={new Map(Array.from(watchHistory.entries()).map(([k, v]) => [k, v.progress]))}
            />
          )}
          {view === "upload" && <UploadView onUploaded={handleUploaded} userId={user!.id} />}
          {view === "library" && (
            <LibraryView
              items={userVideos}
              onPlay={handlePlay}
              onDelete={handleDelete}
              favorites={favorites}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
              continueWatching={continueWatching.filter(v => userVideos.some(uv => uv.id === v.id))}
              watchProgress={new Map(Array.from(watchHistory.entries()).map(([k, v]) => [k, v.progress]))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <VideoDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPlay={handlePlay}
        isFavorite={detailItem ? favorites.has(detailItem.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      {playingItem && (
        <VideoPlayer
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          onProgressUpdate={handleProgressUpdate}
          initialProgress={watchHistory.get(playingItem.id)?.progress}
        />
      )}
    </div>
  );
};

export default Index;
