import type { ReactNode } from "react";
import { BarChart3, Clapperboard, Flame, Sparkles, Tv2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileStatsDialogProps {
  trigger: ReactNode;
  email?: string;
  totalTitles: number;
  movieCount: number;
  seriesCount: number;
  liveCount: number;
  topGenre: string;
}

const getRoast = (totalTitles: number) => {
  if (totalTitles === 0) return "Je watchlist heeft momenteel de energie van een lege chipszak.";
  if (totalTitles < 4) return "Netjes begin. Je bank vertrouwt je nog niet helemaal.";
  if (totalTitles < 10) return "Sterke collectie. De popcorn voelt hier veilig.";
  return "Officieel cinefiel niveau: je afstandsbediening heeft overuren aangevraagd.";
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string | number }) => (
  <div className="rounded-xl border border-border bg-secondary/60 p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
      <Icon size={18} />
    </div>
    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-[28px] leading-none tracking-wide text-accent">{value}</p>
  </div>
);

const ProfileStatsDialog = ({
  trigger,
  email,
  totalTitles,
  movieCount,
  seriesCount,
  liveCount,
  topGenre,
}: ProfileStatsDialogProps) => {
  const alias = email?.split("@")[0] || "stream-beest";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-card p-0 sm:max-w-2xl overflow-hidden">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_42%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.18),transparent_38%)]" />
          <div className="relative">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-[40px] tracking-[0.08em] text-accent">{alias} stats</DialogTitle>
              <DialogDescription className="max-w-xl text-sm text-foreground/75">
                {getRoast(totalTitles)}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <StatCard icon={Clapperboard} label="Titels" value={totalTitles} />
          <StatCard icon={Flame} label="Live now" value={liveCount} />
          <StatCard icon={Sparkles} label="Top genre" value={topGenre} />
          <StatCard icon={Tv2} label="Series vs films" value={`${seriesCount}/${movieCount}`} />
        </div>

        <div className="border-t border-border bg-secondary/40 px-6 py-4 text-sm text-muted-foreground">
          Bonus-insight: jouw bibliotheek is {movieCount > seriesCount ? "film-first" : seriesCount > movieCount ? "serie-verslaafd" : "perfect in balans en een tikje verdacht netjes"}.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileStatsDialog;