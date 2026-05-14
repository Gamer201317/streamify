import { useState, useRef, useCallback } from "react";
import { X, Film, Tv, Cloud, Search } from "lucide-react";
import type { VideoItem } from "@/lib/types";
import WatchFinderTab from "./WatchFinderTab";

interface UploadViewProps {
  onUploaded: (item: VideoItem) => void;
  userId: string;
}

type Tab = "upload" | "watchfinder";

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"];

const fmtSize = (bytes: number) => {
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
};

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

const UploadView = ({ onUploaded, userId }: UploadViewProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  // Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<"Movie" | "Series">("Movie");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [season, setSeason] = useState("");
  const [eps, setEps] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  void userId;

  const handleFile = useCallback((f: File) => {
    setError("");
    setSuccess("");
    if (!f.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    if (f.size > 3 * 1024 * 1024 * 1024) {
      setError(`File too large (${fmtSize(f.size)}). Maximum is 3 GB.`);
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_.]/g, " "));
  }, []);

  const removeFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, "");
      if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
      setTagInput("");
    }
  };

  const doSubmit = async () => {
    setError("");
    if (!file) { setError("Please select a video file first."); return; }
    if (!title.trim()) { setError("Please add a title."); return; }

    setUploading(true);
    setProgress(5);

    try {
      const { uploadURL, objectPath } = await apiFetch("/storage/uploads/request-url", {
        method: "POST",
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      setProgress(15);

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(15 + Math.round((e.loaded / e.total) * 70));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(90);

      const videoUrl = `/api/storage${objectPath}`;

      const dbData = await apiFetch("/videos", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          type: contentType,
          genre: genre || null,
          year: year ? parseInt(year) : null,
          rating: rating ? parseFloat(rating) : null,
          seasons: contentType === "Series" ? (parseInt(season) || null) : null,
          episodes: contentType === "Series" ? (parseInt(eps) || null) : null,
          description: desc || null,
          tags: tags.length ? tags : null,
          fileSize: fmtSize(file.size),
          videoUrl,
          status: "live",
        }),
      });

      setProgress(100);

      const entry: VideoItem = {
        id: dbData?.id || "u" + Date.now(),
        title: title.trim(),
        type: contentType,
        genre,
        year: year || new Date().getFullYear(),
        rating: rating ? parseFloat(rating) : null,
        seasons: contentType === "Series" ? (parseInt(season) || null) : null,
        eps: contentType === "Series" ? (parseInt(eps) || null) : null,
        desc,
        tags: [...tags],
        size: fmtSize(file.size),
        date: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }),
        status: "live",
        videoUrl,
      };

      setTimeout(() => {
        setUploading(false);
        setSuccess(`"${entry.title}" is toegevoegd aan je library!`);
        removeFile();
        setTitle(""); setDesc(""); setGenre(""); setYear(""); setRating("");
        setSeason(""); setEps(""); setTags([]); setContentType("Movie");
        onUploaded(entry);
      }, 400);
    } catch (err) {
      setUploading(false);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  };

  return (
    <div className="relative z-10 px-6 pt-7 max-w-[700px]">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border mb-7">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cloud size={15} />
          Upload Content
        </button>
        <button
          onClick={() => setActiveTab("watchfinder")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "watchfinder"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search size={15} />
          Watch Finder
        </button>
      </div>

      {/* Upload tab */}
      {activeTab === "upload" && (
        <>
          <h2 className="font-display text-[28px] tracking-wide text-accent mb-1">Add to your library</h2>
          <p className="text-sm text-muted-foreground mb-6">Upload movies or series. Max file size per upload: 3 GB.</p>

          {error && <div className="bg-orange/10 border border-orange/30 rounded-lg text-orange text-xs p-3 mb-3.5">{error}</div>}
          {success && <div className="bg-primary/10 border border-primary/25 rounded-lg text-accent text-xs p-3 mb-3.5">{success}</div>}

          {!uploading ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                className={`border-[1.5px] border-dashed rounded-xl px-5 py-11 text-center cursor-pointer transition-all ${
                  dragging ? "border-primary bg-primary/5" : "border-primary/30 bg-primary/[0.02]"
                }`}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3.5">
                  <Cloud size={22} className="text-primary" />
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5">Drop your video file here</h3>
                <p className="text-xs text-muted-foreground">or <span className="text-primary underline">browse files</span></p>
                <p className="text-[11px] text-muted-foreground/50 mt-1.5">MP4 · MOV · MKV · AVI · WEBM — up to 3 GB</p>
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {file && (
                <>
                  <div className="bg-card rounded-lg p-3.5 flex items-center gap-3 my-3.5 border border-border-highlight">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Film size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold break-all">{file.name}</div>
                      <div className="text-[11px] text-muted-foreground">{fmtSize(file.size)}</div>
                    </div>
                    <button onClick={removeFile} className="text-muted-foreground hover:text-foreground p-1">
                      <X size={17} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Type</label>
                      <div className="flex gap-2">
                        {(["Movie", "Series"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setContentType(t)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                              contentType === t ? "bg-primary text-primary-foreground border-primary" : "border-border-highlight text-muted-foreground"
                            }`}
                          >
                            {t === "Movie" ? <Film size={14} className="inline mr-1.5 -mt-0.5" /> : <Tv size={14} className="inline mr-1.5 -mt-0.5" />}
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Title</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..."
                        className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Description</label>
                      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short synopsis..."
                        className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors resize-y min-h-[74px]" />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Genre</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)}
                          className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors">
                          <option value="">Select genre</option>
                          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold tracking-widests text-muted-foreground mb-2 uppercase">Year</label>
                        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024"
                          className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                      </div>
                    </div>

                    {contentType === "Series" && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Season</label>
                          <input type="number" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="1"
                            className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Episodes</label>
                          <input type="number" value={eps} onChange={(e) => setEps(e.target.value)} placeholder="10"
                            className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Rating (1–10)</label>
                      <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="8.5" min={1} max={10} step={0.1}
                        className="w-full bg-secondary border border-border-highlight rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">Tags</label>
                      <div className="flex flex-wrap gap-1.5 bg-secondary border border-border-highlight rounded-lg p-2.5 min-h-[42px] items-center">
                        {tags.map((t, i) => (
                          <span key={i} className="bg-primary/10 text-primary text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            {t}
                            <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-primary text-sm leading-none">×</button>
                          </span>
                        ))}
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey}
                          placeholder="Add tags, press Enter..." className="bg-transparent border-none outline-none text-foreground text-xs flex-1 min-w-[70px] p-0.5" />
                      </div>
                    </div>

                    <button onClick={doSubmit}
                      className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold tracking-wide hover:opacity-85 transition-opacity">
                      Add to Library
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-[38px] h-[38px] border-[2.5px] border-primary/15 border-t-primary rounded-full animate-spin-slow mx-auto mb-3.5" />
              <p className="text-sm font-semibold text-accent mb-1.5">Uploading to cloud storage...</p>
              <p className="text-xs text-muted-foreground mb-4">{Math.round(progress)}%</p>
              <div className="bg-foreground/5 rounded-full h-[3px] max-w-xs mx-auto overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Watch Finder tab */}
      {activeTab === "watchfinder" && (
        <>
          <div className="mb-6">
            <h2 className="font-display text-[28px] tracking-wide text-accent mb-1">Watch Finder</h2>
            <p className="text-sm text-muted-foreground">Zoek elke film of serie en zie direct waar je het kan kijken in Nederland.</p>
          </div>
          <WatchFinderTab
            onAddedToLibrary={(addedTitle) => {
              onUploaded({
                id: "wf" + Date.now(),
                title: addedTitle,
                type: "Movie",
                genre: "",
                year: new Date().getFullYear(),
                rating: null,
                size: "",
                date: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }),
                status: "live",
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export default UploadView;
