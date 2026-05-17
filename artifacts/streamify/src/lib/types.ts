export interface VideoItem {
  id: string;
  title: string;
  type: "Movie" | "Series";
  genre: string;
  year: string | number;
  rating: number | null;
  seasons?: number | null;
  eps?: number | null;
  desc?: string;
  tags?: string[];
  size: string;
  date: string;
  status: "live" | "processing";
  videoUrl?: string;
  posterUrl?: string;
  tmdbId?: number;
}

export const SAMPLE_VIDEOS: VideoItem[] = [
  { id: "s1", title: "Dune: Part Two", type: "Movie", genre: "Sci-Fi", year: 2024, rating: 8.5, size: "2.1 GB", date: "12 Mar 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg" },
  { id: "s2", title: "The Bear", type: "Series", genre: "Drama", year: 2022, rating: 9.1, seasons: 3, eps: 28, size: "18 GB total", date: "22 Jan 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg" },
  { id: "s3", title: "Oppenheimer", type: "Movie", genre: "Thriller", year: 2023, rating: 8.9, size: "3.0 GB", date: "5 Feb 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: "s4", title: "Shogun", type: "Series", genre: "Drama", year: 2024, rating: 9.3, seasons: 1, eps: 10, size: "8.4 GB total", date: "18 Mar 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg" },
  { id: "s5", title: "Poor Things", type: "Movie", genre: "Fantasy", year: 2023, rating: 8.1, size: "1.8 GB", date: "2 Apr 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg" },
  { id: "s6", title: "True Detective S4", type: "Series", genre: "Thriller", year: 2024, rating: 8.0, seasons: 4, eps: 6, size: "4.2 GB total", date: "9 Apr 2024", status: "live", posterUrl: "https://image.tmdb.org/t/p/w500/aowr5fLjSqLb7teJt5gg6XNk0IO.jpg" },
];
