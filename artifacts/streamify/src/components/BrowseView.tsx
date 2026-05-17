import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Star, Play, TrendingUp, Film, Tv, ExternalLink,
  Flame, Award, Gem, Clock, BarChart3, Zap, Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCard from "./VideoCard";
import HeroBanner, { type TmdbItem } from "./HeroBanner";
import type { VideoItem } from "@/lib/types";

const CATEGORIES = ["All", "Movie", "Series", "Action", "Drama", "Thriller", "Sci-Fi", "Comedy"];

interface BrowseViewProps {
  items: VideoItem[];
  onPlay: (item: VideoItem) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (item: VideoItem) => void;
  onDetail?: (item: VideoItem) => void;
  continueWatching?: VideoItem[];
  watchProgress?: Map<string, number>;
}

// Demo TMDB-like data for offline mode
const DEMO_MOVIES: TmdbItem[] = [
  { id: 1, title: "Dune: Part Two", poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg", year: "2024", rating: 8.5 },
  { id: 2, title: "Oppenheimer", poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", year: "2023", rating: 8.9 },
  { id: 3, title: "Poor Things", poster: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg", year: "2023", rating: 8.1 },
  { id: 4, title: "The Batman", poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", year: "2022", rating: 7.8 },
  { id: 5, title: "Everything Everywhere All at Once", poster: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", year: "2022", rating: 8.0 },
  { id: 6, title: "Top Gun: Maverick", poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", year: "2022", rating: 8.3 },
  { id: 7, title: "Avatar: The Way of Water", poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", year: "2022", rating: 7.7 },
  { id: 8, title: "Spider-Man: No Way Home", poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", year: "2021", rating: 8.2 },
  { id: 9, title: "The Holdovers", poster: "https://image.tmdb.org/t/p/w500/VHSzNBTwxV8vh7wylo7O9CLdac.jpg", year: "2023", rating: 8.0 },
  { id: 10, title: "Killers of the Flower Moon", poster: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", year: "2023", rating: 7.6 },
];

const DEMO_SERIES: TmdbItem[] = [
  { id: 101, title: "Shogun", poster: "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg", year: "2024", rating: 9.3 },
  { id: 102, title: "The Bear", poster: "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", year: "2022", rating: 9.1 },
  { id: 103, title: "True Detective", poster: "https://image.tmdb.org/t/p/w500/aowr5fLjSqLb7teJt5gg6XNk0IO.jpg", year: "2024", rating: 8.0 },
  { id: 104, title: "House of the Dragon", poster: "https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg", year: "2022", rating: 8.4 },
  { id: 105, title: "The Last of Us", poster: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", year: "2023", rating: 8.8 },
  { id: 106, title: "Fallout", poster: "https://image.tmdb.org/t/p/w500/AnsSKR4SHAIl0EpMnMxpbpyPll.jpg", year: "2024", rating: 8.5 },
  { id: 107, title: "Severance", poster: "https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", year: "2022", rating: 8.7 },
  { id: 108, title: "Succession", poster: "https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg", year: "2023", rating: 8.9 },
];

async function apiFetch(path: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`/api${path}`, { credentials: "include", signal: controller.signal });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } catch {
    // Return demo data when API is unavailable
    if (path.includes("trending") && path.includes("movie")) return DEMO_MOVIES;
    if (path.includes("trending") && path.includes("tv")) return DEMO_SERIES;
    if (path.includes("popular")) return DEMO_MOVIES.slice(0, 8);
    if (path.includes("top-rated")) return [...DEMO_MOVIES].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
    if (path.includes("hidden-gems")) return DEMO_SERIES.slice(3, 8);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setCount(0); return; }
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  active: boolean;
  delay?: number;
}

const StatCard = ({ icon, label, value, suffix = "", color, active, delay = 0 }: StatCardProps) => {
  const count = useCountUp(value, 1200, active);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-card/60 backdrop-blur-sm border rounded-2xl p-5 flex flex-col gap-3 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <div className="font-display text-4xl tracking-wide">
          {count}{suffix}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
      </div>
    </motion.div>
  );
};

const StatsSection = ({ items, watchProgress }: { items: VideoItem[]; watchProgress?: Map<string, number> }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const totalMovies = items.filter((i) => i.type === "Movie").length;
  const totalSeries = items.filter((i) => i.type === "Series").length;
  const watched = watchProgress ? [...watchProgress.values()].filter((p) => p > 5).length : 0;
  const avgRating = useMemo(() => {
    const rated = items.filter((i) => i.rating);
    if (!rated.length) return 0;
    return Math.round((rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length) * 10) / 10;
  }, [items]);
  const estimatedHours = Math.round(watched * 1.8);

  const genreCounts = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.genre || "Overig";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";

  if (items.length === 0) return null;

  return (
    <div ref={sectionRef} className="px-6 mt-10">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="font-display text-xl tracking-wide text-accent flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" /> Jouw Streamify Wrapped
        </h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Statistieken
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Film size={18} className="text-sky-400" />}
          label="Films in library"
          value={totalMovies}
          color="border-sky-500/20 text-sky-400"
          active={active}
          delay={0}
        />
        <StatCard
          icon={<Tv size={18} className="text-violet-400" />}
          label="Series in library"
          value={totalSeries}
          color="border-violet-500/20 text-violet-400"
          active={active}
          delay={0.08}
        />
        <StatCard
          icon={<Clock size={18} className="text-orange-400" />}
          label="Geschatte uren"
          value={estimatedHours || items.length * 2}
          suffix="u"
          color="border-orange-500/20 text-orange-400"
          active={active}
          delay={0.16}
        />
        <StatCard
          icon={<Star size={18} className="text-yellow-400" />}
          label="Gemiddelde rating"
          value={avgRating || 0}
          color="border-yellow-500/20 text-yellow-400"
          active={active}
          delay={0.24}
        />
        <div className={`bg-card/60 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 flex flex-col gap-3 text-primary col-span-2 sm:col-span-1`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="flex flex-col gap-3 h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wide text-accent leading-tight">
                {topGenre}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">Favoriete genre</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Personality card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-3 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <Zap size={22} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-accent">
            {items.length >= 20 ? "🎬 Cinematic Obsessive" : items.length >= 10 ? "🍿 Serious Watcher" : items.length >= 3 ? "🎥 Getting Started" : "✨ Fresh Start"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {items.length >= 20
              ? "Je hebt meer films dan sommige bioscopen. Respect."
              : items.length >= 10
              ? "Serieuze collectie — je bibliotheek groeit indrukwekkend."
              : items.length >= 3
              ? "Je bent op weg. Nog een paar films en je bent verslaafd."
              : "Voeg je eerste films toe en bouw je cinematic universe."}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  items: TmdbItem[];
  loading: boolean;
  badge?: string;
}

const CarouselSection = ({ title, icon, items, loading, badge }: CarouselSectionProps) => (
  <div className="px-6 mt-7">
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-display text-xl tracking-wide text-accent flex items-center gap-2">
        {icon} {title}
      </h2>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      )}
    </div>
    {loading ? (
      <div className="flex gap-3 overflow-x-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="min-w-[130px] aspect-[2/3] bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    ) : items.length === 0 ? null : (
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-blend">
        {items.map((item, idx) => (
          <a
            key={item.id}
            href={`https://www.justwatch.com/nl/search?q=${encodeURIComponent(item.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[130px] max-w-[130px] group relative cursor-pointer flex-shrink-0"
          >
            {item.poster ? (
              <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-all group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-xl bg-card border border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center px-2">{item.title}</span>
              </div>
            )}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
              {idx + 1}
            </div>
            {item.rating && (
              <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-bold text-accent">
                <Star size={8} fill="currentColor" /> {item.rating}
              </div>
            )}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 flex flex-col items-center justify-center gap-1 p-2">
              <ExternalLink size={16} className="text-primary" />
              <span className="text-[9px] text-center font-semibold text-foreground line-clamp-2">{item.title}</span>
            </div>
            <div className="mt-1.5 px-0.5">
              <div className="text-[11px] font-semibold truncate">{item.title}</div>
              <div className="text-[10px] text-muted-foreground">{item.year}</div>
            </div>
          </a>
        ))}
      </div>
    )}
  </div>
);

const BrowseView = ({ items, onPlay, favorites, onToggleFavorite, onDetail, continueWatching, watchProgress }: BrowseViewProps) => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [trendingMovies, setTrendingMovies] = useState<TmdbItem[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TmdbItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<TmdbItem[]>([]);
  const [topRated, setTopRated] = useState<TmdbItem[]>([]);
  const [hiddenGems, setHiddenGems] = useState<TmdbItem[]>([]);
  const [trendingTab, setTrendingTab] = useState<"movie" | "tv">("movie");
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [movies, series] = await Promise.all([
          apiFetch("/trending?type=movie"),
          apiFetch("/trending?type=tv"),
        ]);
        setTrendingMovies(movies || DEMO_MOVIES);
        setTrendingSeries(series || DEMO_SERIES);
      } catch {
        // Fallback to demo data if anything fails
        setTrendingMovies(DEMO_MOVIES);
        setTrendingSeries(DEMO_SERIES);
      } finally {
        setLoadingTrending(false);
      }

      try {
        const [popular, rated, gems] = await Promise.all([
          apiFetch("/popular?type=movie"),
          apiFetch("/top-rated?type=movie"),
          apiFetch("/hidden-gems"),
        ]);
        setPopularMovies(popular || DEMO_MOVIES.slice(0, 8));
        setTopRated(rated || [...DEMO_MOVIES].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8));
        setHiddenGems(gems || DEMO_SERIES.slice(3, 8));
      } catch {
        setPopularMovies(DEMO_MOVIES.slice(0, 8));
        setTopRated([...DEMO_MOVIES].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8));
        setHiddenGems(DEMO_SERIES.slice(3, 8));
      } finally {
        setLoadingMore(false);
      }
    };
    loadData();
  }, []);

  const featuredItem = useMemo(() => {
    const rated = items.filter((i) => i.rating && i.rating >= 8);
    return rated.length > 0 ? rated[Math.floor(Math.random() * rated.length)] : items[0];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const filtered = items.filter((item) => {
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (category === "All") return true;
    if (category === "Movie") return item.type === "Movie";
    if (category === "Series") return item.type === "Series";
    return item.genre === category;
  });

  const label = category === "All" ? "All titles" : category === "Movie" ? "Movies" : category === "Series" ? "Series" : category + " titles";
  const trendingList = trendingTab === "movie" ? trendingMovies : trendingSeries;

  return (
    <div className="relative z-10">
      {/* Fullscreen TMDB Spotlight Hero */}
      {!search && category === "All" && (
        <HeroBanner
          item={featuredItem!}
          onPlay={onPlay}
          onDetail={onDetail || (() => {})}
          tmdbSpotlight={trendingMovies.length > 0 ? trendingMovies : undefined}
        />
      )}

      {/* Continue Watching */}
      {continueWatching && continueWatching.length > 0 && !search && (
        <div className="px-6 mt-8">
          <h2 className="font-display text-xl tracking-wide mb-3 text-accent flex items-center gap-2">
            <Play size={14} fill="currentColor" className="text-primary" /> Verder kijken
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-blend">
            {continueWatching.map((item) => {
              const progress = watchProgress?.get(item.id) ?? 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onPlay(item)}
                  className="min-w-[160px] max-w-[160px] bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 cursor-pointer transition-all group hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]"
                >
                  {item.posterUrl ? (
                    <div className="h-[100px] overflow-hidden">
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-[100px] overflow-hidden bg-primary/10 flex items-center justify-center">
                      <span className="font-display text-sm text-primary/60 px-2 text-center line-clamp-2">{item.title}</span>
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="text-[11px] font-semibold truncate mb-1.5">{item.title}</div>
                    <div className="h-1 bg-foreground/10 rounded-full">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">{Math.round(progress)}% bekeken</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending from TMDB */}
      {!search && category === "All" && (
        <div className="px-6 mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl tracking-wide text-accent flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Trending in Nederland
            </h2>
            <div className="flex gap-1 bg-surface rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setTrendingTab("movie")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${trendingTab === "movie" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Film size={10} /> Films
              </button>
              <button
                onClick={() => setTrendingTab("tv")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${trendingTab === "tv" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Tv size={10} /> Series
              </button>
            </div>
          </div>

          {loadingTrending ? (
            <div className="flex gap-3 overflow-x-hidden">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="min-w-[130px] aspect-[2/3] bg-card rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-blend">
              {trendingList.map((item, idx) => (
                <a
                  key={item.id}
                  href={`https://www.justwatch.com/nl/search?q=${encodeURIComponent(item.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[130px] max-w-[130px] group relative cursor-pointer flex-shrink-0"
                >
                  {item.poster ? (
                    <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-all group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] rounded-xl bg-card border border-border flex items-center justify-center">
                      <span className="text-xs text-muted-foreground text-center px-2">{item.title}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
                    {idx + 1}
                  </div>
                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-bold text-accent">
                      <Star size={8} fill="currentColor" /> {item.rating}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 flex flex-col items-center justify-center gap-1 p-2">
                    <ExternalLink size={16} className="text-primary" />
                    <span className="text-[9px] text-center font-semibold text-foreground line-clamp-2">{item.title}</span>
                  </div>
                  <div className="mt-1.5 px-0.5">
                    <div className="text-[11px] font-semibold truncate">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground">{item.year}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popular Now */}
      {!search && category === "All" && (
        <CarouselSection
          title="Populair nu"
          icon={<Flame size={16} className="text-orange-400" />}
          items={popularMovies}
          loading={loadingMore}
          badge="Films"
        />
      )}

      {/* Top Rated */}
      {!search && category === "All" && (
        <CarouselSection
          title="Hoogst gewaardeerd"
          icon={<Award size={16} className="text-yellow-400" />}
          items={topRated}
          loading={loadingMore}
          badge="Alle tijden"
        />
      )}

      {/* Hidden Gems */}
      {!search && category === "All" && (
        <CarouselSection
          title="Verborgen parels"
          icon={<Gem size={16} className="text-emerald-400" />}
          items={hiddenGems}
          loading={loadingMore}
          badge="Onderschat"
        />
      )}

      {/* Stats / Wrapped section */}
      {!search && category === "All" && (
        <StatsSection items={items} watchProgress={watchProgress} />
      )}

      {/* Library section header */}
      <div className="px-6 pt-10 pb-2">
        <h1 className="font-display text-[38px] tracking-wide leading-none text-accent">
          Watch <span className="text-primary">anything.</span>
          <br />Upload everything.
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5">Jouw persoonlijke streaming library — films & series.</p>
      </div>

      {/* Search bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op titel..."
            className="w-full bg-secondary border border-border-highlight rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex gap-2 px-6 py-4 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
              category === cat
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]"
                : "border-border-highlight text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
            }`}
          >
            {cat === "Movie" ? "Movies" : cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-6 mb-3.5">
        <h2 className="font-display text-xl tracking-wide">{label}</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} resultaten</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search ? `Geen resultaten voor "${search}"` : "No titles in this category yet."}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={category + search}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5 px-6 pb-10"
          >
            {filtered.map((item, i) => (
              <VideoCard
                key={item.id}
                item={item}
                index={i}
                onPlay={onPlay}
                isFavorite={favorites?.has(item.id)}
                onToggleFavorite={onToggleFavorite}
                onDetail={onDetail}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default BrowseView;
