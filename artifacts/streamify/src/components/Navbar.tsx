import { useState, useEffect } from "react";
import { LogOut, Search, Bell } from "lucide-react";
import ProfileStatsDialog from "@/components/ProfileStatsDialog";

type View = "home" | "upload" | "library";

interface StreamifyUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    display_name: string;
  };
}

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  user: StreamifyUser;
  onSignOut: () => void;
  stats: {
    totalTitles: number;
    movieCount: number;
    seriesCount: number;
    liveCount: number;
    topGenre: string;
  };
}

const Navbar = ({ currentView, onNavigate, user, onSignOut, stats }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = (user.user_metadata?.full_name || user.email || "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  return (
    <nav
      className={`hidden md:flex items-center justify-between px-8 h-[64px] sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl border-b border-border shadow-[0_4px_40px_-4px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div
        className="font-display text-[28px] tracking-[3px] cursor-pointer select-none"
        onClick={() => onNavigate("home")}
      >
        <span className="text-primary">STREAM</span>
        <span className="text-accent">IFY</span>
        <span className="text-primary text-[10px] align-super tracking-wider">™</span>
      </div>

      <div className="flex gap-0.5 bg-surface/60 backdrop-blur-sm rounded-xl p-[3px] border border-border">
        {(["home", "upload", "library"] as const).map((view) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold tracking-wide transition-all duration-200 ${
              currentView === view
                ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary)/0.5)]"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/8"
            }`}
          >
            {view === "home" ? "Browse" : view === "upload" ? "Upload" : "My Library"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-all">
          <Search size={16} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-all relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <ProfileStatsDialog
          email={user.email}
          totalTitles={stats.totalTitles}
          movieCount={stats.movieCount}
          seriesCount={stats.seriesCount}
          liveCount={stats.liveCount}
          topGenre={stats.topGenre}
          trigger={
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_16px_-2px_hsl(var(--primary)/0.6)]"
              title="Bekijk je stats"
            >
              {initials}
            </button>
          }
        />
        <button
          onClick={onSignOut}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-all"
          title="Uitloggen"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
