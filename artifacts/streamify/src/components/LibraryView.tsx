import { useState, useMemo } from "react";
import { Trash2, Grid3X3, List, Search, Star, SortAsc, SortDesc, Film, Tv, Heart, Play, FolderOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PosterArtwork from "./PosterArtwork";
import type { VideoItem } from "@/lib/types";

interface LibraryViewProps {
  items: VideoItem[];
  onPlay: (item: VideoItem) => void;
  onDelete?: (id: string) => void;
  favorites?: Set<string>;
  showFavoritesOnly?: boolean;
  onToggleFavoritesFilter?: () => void;
  continueWatching?: VideoItem[];
  watchProgress?: Map<string, number>;
}

type SortKey = "date" | "title" | "year" | "rating";
type ViewMode = "grid" | "list" | "folder";
type FilterTab = "all" | "movies" | "series" | "favorites";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

const LibraryView = ({
  items,
  onPlay,
  onDelete,
  favorites,
  continueWatching,
  watchProgress,
}: LibraryViewProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, item: VideoItem) => {
    e.stopPropagation();
    if (deleting) return;
    const confirmed = window.confirm(`Weet je zeker dat je "${item.title}" wilt verwijderen?`);
    if (!confirmed) return;
    setDeleting(item.id);
    try {
      const res = await fetch(`/api/videos/${item.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      onDelete?.(item.id);
      toast.success(`"${item.title}" verwijderd uit je library`);
    } catch {
      toast.error("Verwijderen mislukt. Probeer het opnieuw.");
    } finally {
      setDeleting(null);
    }
  };

  const isUserItem = (item: VideoItem) => !item.id.startsWith("s");

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterTab === "movies") list = list.filter((i) => i.type === "Movie");
    else if (filterTab === "series") list = list.filter((i) => i.type === "Series");
    else if (filterTab === "favorites") list = list.filter((i) => favorites?.has(i.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.genre?.toLowerCase().includes(q) ||
          String(i.year).includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "year") cmp = Number(a.year) - Number(b.year);
      else if (sortKey === "rating") cmp = (a.rating ?? 0) - (b.rating ?? 0);
      else cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [items, filterTab, search, sortKey, sortAsc, favorites]);

  // Group by genre for folder view
  const folders = useMemo(() => {
    const map: Record<string, VideoItem[]> = {};
    filtered.forEach((item) => {
      const key = item.genre || "Overig";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const tabCounts = {
    all: items.length,
    movies: items.filter((i) => i.type === "Movie").length,
    series: items.filter((i) => i.type === "Series").length,
    favorites: items.filter((i) => favorites?.has(i.id)).length,
  };

  return (
    <div className="relative z-10 px-6 pt-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-[26px] tracking-wide text-accent">My Library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} titel{items.length !== 1 ? "s" : ""} opgeslagen · gesynchroniseerd via je account</p>
        </div>
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border">
          {([["list", List], ["grid", Grid3X3], ["folder", FolderOpen]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-all ${viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title={mode}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Search + sort bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-secondary border border-border-highlight rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek in je library..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-secondary border border-border-highlight rounded-lg px-2.5 py-2 text-xs text-foreground outline-none"
        >
          <option value="date">Datum</option>
          <option value="title">Titel</option>
          <option value="year">Jaar</option>
          <option value="rating">Rating</option>
        </select>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="p-2 rounded-lg border border-border-highlight text-muted-foreground hover:text-foreground transition-colors"
        >
          {sortAsc ? <SortAsc size={14} /> : <SortDesc size={14} />}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto scrollbar-hide">
        {([
          ["all", "Alles", null],
          ["movies", "Films", Film],
          ["series", "Series", Tv],
          ["favorites", "Favorieten", Heart],
        ] as [FilterTab, string, React.ElementType | null][]).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === tab
                ? "bg-primary text-primary-foreground"
                : "border border-border-highlight text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon && <Icon size={11} />}
            {label}
            <span className={`text-[10px] px-1 rounded-full ${filterTab === tab ? "bg-primary-foreground/20" : "bg-foreground/10"}`}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Continue watching strip */}
      {continueWatching && continueWatching.length > 0 && filterTab === "all" && (
        <div className="mb-6">
          <h3 className="font-display text-sm tracking-wide text-accent mb-2 flex items-center gap-1.5">
            <Play size={12} fill="currentColor" /> Verder kijken
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {continueWatching.map((item) => {
              const progress = watchProgress?.get(item.id) || 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onPlay(item)}
                  className="min-w-[160px] max-w-[160px] bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 cursor-pointer transition-all group"
                >
                  <div className="h-[70px] overflow-hidden flex items-center justify-center bg-primary/5 relative">
                    <span className="font-display text-sm text-primary/60 group-hover:text-primary transition-colors px-2 text-center line-clamp-2">{item.title}</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
                      <Play size={20} className="text-primary" fill="currentColor" />
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-semibold truncate mb-1">{item.title}</div>
                    <div className="h-1 bg-foreground/10 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">{Math.round(progress)}% bekeken</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-14 text-muted-foreground text-sm">
          {search ? `Geen resultaten voor "${search}"` : filterTab === "favorites" ? "Geen favorieten gevonden." : "Niets hier. Upload een film of serie!"}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onPlay(item)}
              className="bg-card rounded-xl overflow-hidden border border-border hover:border-border-highlight hover:-translate-y-0.5 transition-all cursor-pointer group relative"
            >
              <PosterArtwork item={item} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <Play size={14} className="text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
              {favorites?.has(item.id) && (
                <div className="absolute top-1.5 left-1.5">
                  <Heart size={11} className="text-red-400" fill="currentColor" />
                </div>
              )}
              {isUserItem(item) && (
                <button
                  onClick={(e) => handleDelete(e, item)}
                  disabled={deleting === item.id}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 size={10} className={deleting === item.id ? "animate-pulse" : ""} />
                </button>
              )}
              <div className="p-2">
                <div className="text-[11px] font-semibold truncate">{item.title}</div>
                <div className="text-[10px] text-muted-foreground">{item.year}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onPlay(item)}
              className="flex items-center gap-3.5 p-3 bg-card rounded-lg border border-border hover:border-border-highlight transition-colors cursor-pointer group"
            >
              <div className="w-[50px] shrink-0 overflow-hidden rounded-[7px] border border-border-highlight/60">
                <PosterArtwork item={item} compact />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-semibold truncate">{item.title}</div>
                  {favorites?.has(item.id) && <Heart size={11} className="text-red-400 shrink-0" fill="currentColor" />}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {item.genre}{item.year ? ` · ${item.year}` : ""}
                  {item.type === "Series" && item.seasons ? ` · S${item.seasons}` : ""} · {item.size}
                </div>
                {watchProgress?.has(item.id) && (
                  <div className="mt-1.5 h-0.5 bg-foreground/10 rounded-full w-24">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(watchProgress.get(item.id)!, 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === "Movie" ? "bg-primary/12 text-primary" : "bg-orange/12 text-orange"}`}>
                    {item.type}
                  </span>
                  {item.rating && (
                    <span className="text-[10px] text-accent flex items-center gap-0.5 font-semibold">
                      <Star size={9} fill="currentColor" /> {item.rating}
                    </span>
                  )}
                </div>
                {isUserItem(item) && (
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    disabled={deleting === item.id}
                    className="p-2 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={13} className={deleting === item.id ? "animate-pulse" : ""} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOLDER VIEW */}
      {viewMode === "folder" && filtered.length > 0 && (
        <div className="space-y-2">
          {folders.map(([genre, folderItems]) => (
            <div key={genre} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenFolder(openFolder === genre ? null : genre)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors"
              >
                <FolderOpen size={16} className="text-primary shrink-0" />
                <span className="flex-1 text-sm font-semibold text-left">{genre}</span>
                <span className="text-xs text-muted-foreground">{folderItems.length} titel{folderItems.length !== 1 ? "s" : ""}</span>
                <ChevronRight
                  size={14}
                  className={`text-muted-foreground transition-transform ${openFolder === genre ? "rotate-90" : ""}`}
                />
              </button>

              {openFolder === genre && (
                <div className="border-t border-border">
                  {folderItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onPlay(item)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors group border-b border-border/50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {item.type === "Movie" ? <Film size={14} className="text-primary" /> : <Tv size={14} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold truncate flex items-center gap-1.5">
                          {item.title}
                          {favorites?.has(item.id) && <Heart size={9} className="text-red-400 shrink-0" fill="currentColor" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.year} · {item.size}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.rating && (
                          <span className="text-[10px] text-accent flex items-center gap-0.5 font-semibold">
                            <Star size={9} fill="currentColor" /> {item.rating}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.status === "live" ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"}`}>
                          {item.status === "live" ? "Live" : "Laden"}
                        </span>
                        {isUserItem(item) && (
                          <button
                            onClick={(e) => handleDelete(e, item)}
                            disabled={deleting === item.id}
                            className="p-1.5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
};

export default LibraryView;
