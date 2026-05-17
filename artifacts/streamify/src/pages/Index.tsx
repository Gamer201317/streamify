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

// Demo mode: use localStorage for persistence
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [userVideos, setUserVideos] = useState<VideoItem[]>(() => 
    loadFromStorage<VideoItem[]>("streamify-user-videos", [])
  );
  const [playingItem, setPlayingItem] = useState<VideoItem | null>(null);
  const [detailItem, setDetailItem] = useState<VideoItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => 
    new Set(loadFromStorage<string[]>("streamify-favorites", []))
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [watchHistory, setWatchHistory] = useState<Map<string, WatchHistoryEntry>>(() => {
    const stored = loadFromStorage<Record<string, WatchHistoryEntry>>("streamify-watch-history", {});
    return new Map(Object.entries(stored));
  });
  const { rainbowMode } = useEasterEggs();
  const { user, loading, signOut } = useAuth();

  // Persist to localStorage when data changes
  useEffect(() => {
    saveToStorage("streamify-user-videos", userVideos);
  }, [userVideos]);

  useEffect(() => {
    saveToStorage("streamify-favorites", Array.from(favorites));
  }, [favorites]);

  useEffect(() => {
    saveToStorage("streamify-watch-history", Object.fromEntries(watchHistory));
  }, [watchHistory]);

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
    toast.success(`"${item.title}" added to your library!`);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setUserVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video removed from library");
  }, []);

  const handleToggleFavorite = useCallback((item: VideoItem) => {
    const isFav = favorites.has(item.id);
    if (isFav) {
      setFavorites((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
      toast("Removed from favorites", { icon: "💔" });
    } else {
      setFavorites((prev) => new Set(prev).add(item.id));
      toast("Added to favorites!", { icon: "❤️" });
    }
  }, [favorites]);

  const handleProgressUpdate = useCallback((videoId: string, currentTime: number, videoDuration: number) => {
    if (videoDuration <= 0) return;
    const progressPct = (currentTime / videoDuration) * 100;
    const now = new Date().toISOString();
    setWatchHistory((prev) => {
      const next = new Map(prev);
      next.set(videoId, { video_id: videoId, progress: progressPct, last_watched_at: now });
      return next;
    });
  }, []);

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
    const key = item.genre || "Mystery";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chaotic good";
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
