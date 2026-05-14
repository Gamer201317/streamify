import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface MobileNavProps {
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

const MobileNav = ({ currentView, onNavigate, user, onSignOut, stats }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  const initials = (user.user_metadata?.full_name || user.email || "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  const navigate = (view: View) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <>
      <nav className="md:hidden flex items-center justify-between px-4 h-[52px] border-b border-border bg-background relative z-30">
        <div className="font-display text-[22px] tracking-[2px] text-primary">
          STREAM<span className="text-accent">IFY</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 text-foreground">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-20 bg-background pt-[52px]"
          >
            <div className="flex flex-col p-6 gap-2">
              {(["home", "upload", "library"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => navigate(view)}
                  className={`text-left px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                    currentView === view
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/5"
                  }`}
                >
                  {view === "home" ? "Browse" : view === "upload" ? "Upload" : "My Library"}
                </button>
              ))}

              <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProfileStatsDialog
                    email={user.email}
                    totalTitles={stats.totalTitles}
                    movieCount={stats.movieCount}
                    seriesCount={stats.seriesCount}
                    liveCount={stats.liveCount}
                    topGenre={stats.topGenre}
                    trigger={
                      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {initials}
                      </button>
                    }
                  />
                  <span className="text-sm text-muted-foreground">{user.email?.split("@")[0]}</span>
                </div>
                <button onClick={onSignOut} className="text-muted-foreground hover:text-foreground p-2">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
