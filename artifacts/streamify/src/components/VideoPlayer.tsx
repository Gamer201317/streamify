import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Subtitles, Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { VideoItem } from "@/lib/types";

interface VideoPlayerProps {
  item: VideoItem;
  onClose: () => void;
  onProgressUpdate?: (videoId: string, progress: number, duration: number) => void;
  initialProgress?: number;
}

type QualityOption = "Auto" | "Data Saver" | "HD" | "Ultra";

const VideoPlayer = ({ item, onClose, onProgressUpdate, initialProgress }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [quality, setQuality] = useState<QualityOption>("HD");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [hoveredProgress, setHoveredProgress] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const progressTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const seekedToInitial = useRef(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (isFullscreen) document.exitFullscreen?.(); else onClose(); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") setMuted((m) => !m);
      if (e.key === "f") containerRef.current?.requestFullscreen?.();
      if (e.key === "t") setTheaterMode((t) => !t);
      if (e.key === "ArrowRight" && videoRef.current) videoRef.current.currentTime += 10;
      if (e.key === "ArrowLeft" && videoRef.current) videoRef.current.currentTime -= 10;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, togglePlay, isFullscreen]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!onProgressUpdate) return;
    progressTimer.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.duration > 0) {
        onProgressUpdate(item.id, videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 5000);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [item.id, onProgressUpdate]);

  useEffect(() => {
    return () => {
      if (videoRef.current && onProgressUpdate && videoRef.current.duration > 0) {
        onProgressUpdate(item.id, videoRef.current.currentTime, videoRef.current.duration);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (isFinite(dur) && dur > 0) {
      setDuration(dur);
      if (initialProgress && !seekedToInitial.current) {
        const seekTo = (initialProgress / 100) * dur;
        if (seekTo < dur - 2) videoRef.current.currentTime = seekTo;
        seekedToInitial.current = true;
      }
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => playing && setShowControls(false), 3000);
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setHoveredProgress(Math.max(0, Math.min(1, pct)));
  };

  const hasVideo = !!item.videoUrl && !videoError;
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  const qualities: QualityOption[] = ["Auto", "Data Saver", "HD", "Ultra"];
  const qualityColors: Record<QualityOption, string> = {
    "Auto": "text-foreground",
    "Data Saver": "text-sky-400",
    "HD": "text-sky-400",
    "Ultra": "text-yellow-400",
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-black flex flex-col ${showControls ? "cursor-default" : "cursor-none"}`}
        onMouseMove={handleMouseMove}
      >
        {/* Top bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10"
            >
              <div>
                <h2 className="font-display text-2xl tracking-wide text-white">{item.title}</h2>
                <p className="text-xs text-white/50">{item.genre} · {item.year} · {item.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheaterMode((t) => !t)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white text-xs font-semibold transition-all backdrop-blur-sm"
                >
                  {theaterMode ? "Normal" : "Theater"}
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video area */}
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-500 ${theaterMode ? "px-0" : "px-8"}`}
          onClick={togglePlay}
        >
          {hasVideo ? (
            <video
              ref={videoRef}
              src={item.videoUrl}
              muted={muted}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={() => {
                if (videoRef.current && isFinite(videoRef.current.duration)) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onError={() => setVideoError(true)}
              preload="metadata"
              className={`max-w-full max-h-full object-contain transition-all duration-500 ${theaterMode ? "w-full h-full" : "rounded-xl"}`}
            />
          ) : (
            <div className="w-full max-w-3xl aspect-video bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4">
              {item.posterUrl && (
                <img src={item.posterUrl} alt={item.title} className="w-32 rounded-xl opacity-30 mb-2" />
              )}
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <Play size={28} className="text-primary ml-1" />
              </div>
              <p className="text-white/40 text-sm text-center px-8 max-w-md">
                {videoError
                  ? "Video kon niet worden geladen."
                  : "Geen videobestand — upload je eigen video's om ze hier af te spelen."}
              </p>
            </div>
          )}

          {/* Centered play/pause animation */}
          <AnimatePresence>
            {!playing && hasVideo && (
              <motion.div
                key="paused"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.2 }}
                className="absolute pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Play size={32} className="text-white ml-1" fill="currentColor" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-16 pb-6 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              {hasVideo && (
                <div
                  onClick={seek}
                  onMouseMove={handleProgressHover}
                  onMouseLeave={() => setHoveredProgress(null)}
                  className="w-full h-1 bg-white/15 rounded-full mb-5 cursor-pointer group relative"
                >
                  {/* Buffered (fake) */}
                  <div className="absolute inset-y-0 left-0 bg-white/10 rounded-full" style={{ width: `${Math.min(progressPct + 15, 100)}%` }} />
                  {/* Played */}
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                  </div>
                  {/* Hover time tooltip */}
                  {hoveredProgress !== null && (
                    <div
                      className="absolute -top-8 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md pointer-events-none"
                      style={{ left: `${hoveredProgress * 100}%` }}
                    >
                      {formatTime(hoveredProgress * duration)}
                    </div>
                  )}
                  {/* Hover line */}
                  {hoveredProgress !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-white/50 pointer-events-none"
                      style={{ left: `${hoveredProgress * 100}%` }}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <SkipBack size={17} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-all shadow-lg"
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <SkipForward size={17} />
                  </button>

                  {/* Volume */}
                  <div
                    className="relative flex items-center gap-2"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={() => {
                        const newMuted = !muted;
                        setMuted(newMuted);
                        if (videoRef.current) videoRef.current.muted = newMuted;
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    </button>
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 80, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={muted ? 0 : volume}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setVolume(val);
                              setMuted(val === 0);
                              if (videoRef.current) {
                                videoRef.current.volume = val;
                                videoRef.current.muted = val === 0;
                              }
                            }}
                            className="w-20 accent-primary cursor-pointer"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <span className="text-xs text-white/60 ml-1 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1">
                  {/* Subtitles */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowSubMenu(!showSubMenu); setShowQualityMenu(false); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Subtitles size={17} />
                    </button>
                    <AnimatePresence>
                      {showSubMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-36 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                        >
                          <div className="px-3 py-2 text-[10px] text-white/40 font-bold tracking-widest uppercase">Ondertitels</div>
                          {["Uit", "Nederlands", "Engels"].map((sub) => (
                            <button key={sub} onClick={() => setShowSubMenu(false)}
                              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors">
                              {sub}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quality */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSubMenu(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition-all text-white/70 hover:text-white"
                    >
                      <Gauge size={14} />
                      <span className={`text-[11px] font-bold ${qualityColors[quality]}`}>{quality}</span>
                    </button>
                    <AnimatePresence>
                      {showQualityMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                        >
                          <div className="px-3 py-2 text-[10px] text-white/40 font-bold tracking-widest uppercase">Kwaliteit</div>
                          {qualities.map((q) => (
                            <button
                              key={q}
                              onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between
                                ${quality === q ? "text-primary bg-primary/10" : "text-white/70 hover:text-white hover:bg-white/8"}`}
                            >
                              <span className={qualityColors[q]}>{q}</span>
                              {quality === q && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Settings */}
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    <Settings size={16} />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={() => {
                      if (isFullscreen) document.exitFullscreen?.();
                      else containerRef.current?.requestFullscreen?.();
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPlayer;
