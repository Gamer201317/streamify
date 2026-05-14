import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";

const router = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

const NL_PROVIDER_MAP: Record<number, { name: string; logo: string; urlTemplate: string }> = {
  8:   { name: "Netflix",      logo: "netflix",     urlTemplate: "https://www.netflix.com/search?q={title}" },
  337: { name: "Disney+",      logo: "disney",      urlTemplate: "https://www.disneyplus.com/search/{title}" },
  384: { name: "HBO Max",      logo: "hbomax",      urlTemplate: "https://www.max.com/search?q={title}" },
  2:   { name: "Apple TV+",    logo: "appletv",     urlTemplate: "https://tv.apple.com/search?term={title}" },
  283: { name: "Crunchyroll",  logo: "crunchyroll", urlTemplate: "https://www.crunchyroll.com/search?q={title}" },
  531: { name: "Paramount+",   logo: "paramount",   urlTemplate: "https://www.paramountplus.com/search/{title}" },
  619: { name: "Amazon",       logo: "prime",       urlTemplate: "https://www.amazon.nl/s?k={title}" },
  10:  { name: "Amazon",       logo: "prime",       urlTemplate: "https://www.amazon.nl/s?k={title}" },
  11:  { name: "Mubi",         logo: "mubi",        urlTemplate: "https://mubi.com/search?q={title}" },
  257: { name: "Mubi",         logo: "mubi",        urlTemplate: "https://mubi.com/search?q={title}" },
};

async function tmdbFetch(path: string) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not configured");

  // TMDB supports two auth styles:
  // - Read Access Token (JWT, starts with "ey"): Authorization: Bearer <token>
  // - v3 API key (short string): ?api_key=<key>
  const isBearer = key.startsWith("ey");
  const separator = path.includes("?") ? "&" : "?";
  const url = isBearer
    ? `${TMDB_BASE}${path}`
    : `${TMDB_BASE}${path}${separator}api_key=${key}`;

  const res = await fetch(url, {
    headers: isBearer
      ? { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

function buildWatchUrl(template: string, title: string): string {
  return template.replace("{title}", encodeURIComponent(title));
}

// GET /api/search?q=...&type=movie|tv
router.get("/search", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const q = String(req.query.q || "").trim();
  const type = String(req.query.type || "multi");
  if (!q) {
    res.json([]);
    return;
  }

  try {
    const path = `/search/${type}?query=${encodeURIComponent(q)}&language=nl-NL&region=NL&include_adult=false`;
    const data = await tmdbFetch(path) as { results: Record<string, unknown>[] };
    const results = (data.results || []).slice(0, 20).map((item) => {
      const mediaType = (item.media_type as string) || type;
      const title = (item.title as string) || (item.name as string) || "";
      const year = ((item.release_date as string) || (item.first_air_date as string) || "").slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.id,
        mediaType,
        title,
        year,
        overview: item.overview || "",
        poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        rating: item.vote_average ? Math.round((item.vote_average as number) * 10) / 10 : null,
        genres: [],
        providers: [],
      };
    });
    res.json(results);
  } catch (err) {
    req.log?.error?.({ err }, "Search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/search/:tmdbId/providers?mediaType=movie|tv
router.get("/search/:tmdbId/providers", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const tmdbId = String(req.params.tmdbId);
  const mediaType = String(req.query.mediaType || "movie");

  try {
    const [detailData, providerData] = await Promise.all([
      tmdbFetch(`/${mediaType}/${tmdbId}?language=nl-NL`),
      tmdbFetch(`/${mediaType}/${tmdbId}/watch/providers`),
    ]) as [Record<string, unknown>, { results: Record<string, unknown> }];

    const nlProviders = (providerData.results as Record<string, {
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
      link?: string;
    }>)?.NL || {};

    const title = (detailData.title as string) || (detailData.name as string) || "";

    const flatrate = nlProviders.flatrate || [];
    const rent = nlProviders.rent || [];
    const buy = nlProviders.buy || [];
    const justWatchLink = nlProviders.link || `https://www.justwatch.com/nl/search?q=${encodeURIComponent(title)}`;

    const mapProviders = (list: { provider_id: number; provider_name: string; logo_path: string }[], mode: string) =>
      list.map((p) => {
        const known = NL_PROVIDER_MAP[p.provider_id];
        return {
          id: p.provider_id,
          name: known?.name || p.provider_name,
          logo: known?.logo || "generic",
          logoUrl: `https://image.tmdb.org/t/p/original${p.logo_path}`,
          watchUrl: known ? buildWatchUrl(known.urlTemplate, title) : justWatchLink,
          mode,
        };
      });

    const genres = ((detailData.genres as { id: number; name: string }[]) || []).map((g) => g.name);

    res.json({
      tmdbId,
      mediaType,
      title,
      overview: detailData.overview || "",
      poster: detailData.poster_path ? `${TMDB_IMAGE}${detailData.poster_path}` : null,
      year: ((detailData.release_date as string) || (detailData.first_air_date as string) || "").slice(0, 4),
      rating: detailData.vote_average ? Math.round((detailData.vote_average as number) * 10) / 10 : null,
      runtime: detailData.runtime || null,
      genres,
      providers: {
        stream: mapProviders(flatrate, "stream"),
        rent: mapProviders(rent, "rent"),
        buy: mapProviders(buy, "buy"),
      },
      justWatchLink,
    });
  } catch (err) {
    req.log?.error?.({ err }, "Provider fetch failed");
    res.status(500).json({ error: "Provider fetch failed" });
  }
});

// GET /api/trending?type=movie|tv
router.get("/trending", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const type = String(req.query.type || "movie");
  const mediaType = type === "tv" ? "tv" : "movie";

  try {
    const data = await tmdbFetch(`/trending/${mediaType}/week?language=nl-NL&region=NL`) as { results: Record<string, unknown>[] };
    const results = (data.results || []).slice(0, 20).map((item) => {
      const title = (item.title as string) || (item.name as string) || "";
      const year = ((item.release_date as string) || (item.first_air_date as string) || "").slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.id,
        mediaType,
        title,
        year,
        overview: item.overview || "",
        poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        rating: item.vote_average ? Math.round((item.vote_average as number) * 10) / 10 : null,
      };
    });
    res.json(results);
  } catch (err) {
    req.log?.error?.({ err }, "Trending fetch failed");
    res.status(500).json({ error: "Trending fetch failed" });
  }
});

// GET /api/popular?type=movie|tv
router.get("/popular", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const type = String(req.query.type || "movie");
  const mediaType = type === "tv" ? "tv" : "movie";

  try {
    const data = await tmdbFetch(`/${mediaType}/popular?language=nl-NL&region=NL`) as { results: Record<string, unknown>[] };
    const results = (data.results || []).slice(0, 20).map((item) => {
      const title = (item.title as string) || (item.name as string) || "";
      const year = ((item.release_date as string) || (item.first_air_date as string) || "").slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.id,
        mediaType,
        title,
        year,
        overview: item.overview || "",
        poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        rating: item.vote_average ? Math.round((item.vote_average as number) * 10) / 10 : null,
      };
    });
    res.json(results);
  } catch (err) {
    req.log?.error?.({ err }, "Popular fetch failed");
    res.status(500).json({ error: "Popular fetch failed" });
  }
});

// GET /api/top-rated?type=movie|tv
router.get("/top-rated", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const type = String(req.query.type || "movie");
  const mediaType = type === "tv" ? "tv" : "movie";

  try {
    const data = await tmdbFetch(`/${mediaType}/top_rated?language=nl-NL&region=NL`) as { results: Record<string, unknown>[] };
    const results = (data.results || []).slice(0, 20).map((item) => {
      const title = (item.title as string) || (item.name as string) || "";
      const year = ((item.release_date as string) || (item.first_air_date as string) || "").slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.id,
        mediaType,
        title,
        year,
        overview: item.overview || "",
        poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        rating: item.vote_average ? Math.round((item.vote_average as number) * 10) / 10 : null,
      };
    });
    res.json(results);
  } catch (err) {
    req.log?.error?.({ err }, "Top rated fetch failed");
    res.status(500).json({ error: "Top rated fetch failed" });
  }
});

// GET /api/hidden-gems - Under-the-radar high-quality films
router.get("/hidden-gems", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await tmdbFetch(
      `/discover/movie?language=nl-NL&sort_by=vote_average.desc&vote_count.gte=300&vote_count.lte=5000&vote_average.gte=7.5&without_genres=99,10755&include_adult=false`
    ) as { results: Record<string, unknown>[] };
    const results = (data.results || []).slice(0, 20).map((item) => {
      const title = (item.title as string) || (item.name as string) || "";
      const year = ((item.release_date as string) || (item.first_air_date as string) || "").slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.id,
        mediaType: "movie",
        title,
        year,
        overview: item.overview || "",
        poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        rating: item.vote_average ? Math.round((item.vote_average as number) * 10) / 10 : null,
      };
    });
    res.json(results);
  } catch (err) {
    req.log?.error?.({ err }, "Hidden gems fetch failed");
    res.status(500).json({ error: "Hidden gems fetch failed" });
  }
});

export default router;
