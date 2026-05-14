import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Play, Plus, Check, Star, ExternalLink, Loader2, Tv, Film, X } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  id: number;
  tmdbId: number;
  mediaType: string;
  title: string;
  year: string;
  overview: string;
  poster: string | null;
  rating: number | null;
}

interface Provider {
  id: number;
  name: string;
  logo: string;
  logoUrl: string;
  watchUrl: string;
  mode: string;
}

interface ProviderDetail {
  tmdbId: string;
  mediaType: string;
  title: string;
  overview: string;
  poster: string | null;
  year: string;
  rating: number | null;
  runtime: number | null;
  genres: string[];
  providers: {
    stream: Provider[];
    rent: Provider[];
    buy: Provider[];
  };
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

async function apiFetch(path: string, options?: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
      credentials: "include",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface WatchFinderTabProps {
  onAddedToLibrary?: (title: string) => void;
}

const WatchFinderTab = ({ onAddedToLibrary }: WatchFinderTabProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearchError(""); return; }
    setSearching(true);
    setSearchError("");
    try {
      const data: SearchResult[] = await apiFetch(`/search?q=${encodeURIComponent(q)}&type=multi`);
      setResults(data || []);
    } catch (err) {
      setResults([]);
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      if (msg.includes("abort") || msg.includes("signal")) {
        setSearchError("Zoekopdracht duurde te lang. Probeer het opnieuw.");
      } else {
        setSearchError(`Zoeken mislukt: ${msg}`);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 380);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const openDetail = async (item: SearchResult) => {
    setSelected(item);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const mediaType = item.mediaType === "tv" ? "tv" : "movie";
      const data: ProviderDetail = await apiFetch(`/search/${item.tmdbId}/providers?mediaType=${mediaType}`);
      setDetail(data);
    } catch {
      toast.error("Kon streaminginfo niet laden.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const addToLibrary = async (item: SearchResult | null, det: ProviderDetail | null) => {
    if (!item) return;
    const id = item.tmdbId;
    setAddingId(id);
    try {
      const title = det?.title || item.title;
      const genre = det?.genres?.[0] || null;
      await apiFetch("/videos", {
        method: "POST",
        body: JSON.stringify({
          title,
          type: item.mediaType === "tv" ? "Series" : "Movie",
          genre,
          year: det?.year ? parseInt(det.year) : (item.year ? parseInt(item.year) : null),
          rating: det?.rating || item.rating,
          description: det?.overview || item.overview || null,
          posterUrl: det?.poster || item.poster || null,
          tmdbId: item.tmdbId || null,
          status: "live",
        }),
      });
      setAddedIds((prev) => new Set(prev).add(id));
      toast.success(`"${title}" toegevoegd aan je library! 🎬`);
      onAddedToLibrary?.(title);
    } catch {
      toast.error("Toevoegen mislukt. Probeer het opnieuw.");
    } finally {
      setAddingId(null);
    }
  };

  const allProviders = detail
    ? [...(detail.providers.stream || []), ...(detail.providers.rent || []), ...(detail.providers.buy || [])]
    : [];
  const uniqueProviders = allProviders.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

  return (
    <div className="relative z-10">
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="flex items-center gap-3 bg-secondary border border-border-highlight rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
          {searching ? (
            <Loader2 size={18} className="text-primary animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een film of serie..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Results grid */}
      {results.length > 0 && !selected && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item)}
              className="bg-card border border-border hover:border-border-highlight rounded-xl overflow-hidden text-left transition-all hover:-translate-y-0.5 group"
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-primary/10 flex items-center justify-center">
                  {item.mediaType === "tv" ? (
                    <Tv size={28} className="text-primary/40" />
                  ) : (
                    <Film size={28} className="text-primary/40" />
                  )}
                </div>
              )}
              <div className="p-2.5">
                <div className="text-[12px] font-semibold truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{item.year}</span>
                  {item.rating && (
                    <span className="text-[10px] text-accent flex items-center gap-0.5 font-semibold">
                      <Star size={9} fill="currentColor" /> {item.rating}
                    </span>
                  )}
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.mediaType === "tv" ? "bg-orange/10 text-orange" : "bg-primary/10 text-primary"}`}>
                    {item.mediaType === "tv" ? "Serie" : "Film"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {searchError && !selected && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive mb-3">
          {searchError}
        </div>
      )}

      {/* Empty state */}
      {!searching && query && results.length === 0 && !searchError && !selected && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Geen resultaten gevonden voor "{query}"
        </div>
      )}

      {!query && !selected && (
        <div className="text-center py-14">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search size={24} className="text-primary/60" />
          </div>
          <p className="text-sm font-semibold text-accent mb-1">Zoek elke film of serie</p>
          <p className="text-xs text-muted-foreground">Vind direct waar je het kan kijken in Nederland</p>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Back button */}
          <button
            onClick={closeDetail}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-4 pt-3 pb-0 transition-colors"
          >
            ← Terug naar resultaten
          </button>

          <div className="p-4 flex gap-4">
            {/* Poster */}
            <div className="shrink-0 w-[90px]">
              {selected.poster ? (
                <img src={selected.poster} alt={selected.title} className="w-full aspect-[2/3] object-cover rounded-lg" />
              ) : (
                <div className="w-full aspect-[2/3] bg-primary/10 rounded-lg flex items-center justify-center">
                  <Film size={24} className="text-primary/40" />
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg leading-tight mb-1">{selected.title}</h3>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {detail?.year && <span className="text-xs text-muted-foreground">{detail.year}</span>}
                {detail?.runtime && <span className="text-xs text-muted-foreground">{detail.runtime} min</span>}
                {detail?.rating && (
                  <span className="text-xs text-accent flex items-center gap-0.5 font-semibold">
                    <Star size={10} fill="currentColor" /> {detail.rating}
                  </span>
                )}
              </div>
              {detail?.genres && detail.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {detail.genres.map((g) => (
                    <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{g}</span>
                  ))}
                </div>
              )}
              {loadingDetail && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Loader2 size={12} className="animate-spin" /> Streaminginfo laden...
                </div>
              )}
            </div>
          </div>

          {detail?.overview && (
            <p className="text-xs text-muted-foreground px-4 pb-3 leading-relaxed line-clamp-3">{detail.overview}</p>
          )}

          {/* Streaming providers */}
          {detail && (
            <div className="px-4 pb-4">
              {detail.providers.stream.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Streamen</div>
                  <div className="space-y-2">
                    {detail.providers.stream.map((p) => (
                      <a
                        key={p.id}
                        href={p.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-85 ${PLATFORM_COLORS[p.logo] || PLATFORM_COLORS.generic}`}
                      >
                        {p.logoUrl && (
                          <img src={p.logoUrl} alt={p.name} className="w-6 h-6 rounded object-cover shrink-0" />
                        )}
                        <span>Kijk op {p.name}</span>
                        <ExternalLink size={13} className="ml-auto opacity-70" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detail.providers.rent.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Huren</div>
                  <div className="flex flex-wrap gap-2">
                    {detail.providers.rent.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).map((p) => (
                      <a
                        key={p.id}
                        href={p.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-highlight text-xs font-semibold hover:border-primary/40 transition-colors"
                      >
                        {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-4 h-4 rounded object-cover" />}
                        {p.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {uniqueProviders.length === 0 && !loadingDetail && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">Niet beschikbaar via Nederlandse streamingdiensten</p>
                  <a
                    href={detail.justWatchLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline flex items-center gap-1 justify-center"
                  >
                    Zoek op JustWatch <ExternalLink size={11} />
                  </a>
                </div>
              )}

              {/* Add to library */}
              <div className="pt-2 border-t border-border mt-2">
                <button
                  onClick={() => addToLibrary(selected, detail)}
                  disabled={addedIds.has(selected.tmdbId) || addingId === selected.tmdbId}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    addedIds.has(selected.tmdbId)
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-primary text-primary-foreground hover:opacity-85"
                  }`}
                >
                  {addingId === selected.tmdbId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : addedIds.has(selected.tmdbId) ? (
                    <><Check size={14} /> Toegevoegd aan library</>
                  ) : (
                    <><Plus size={14} /> Toevoegen aan library</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchFinderTab;
