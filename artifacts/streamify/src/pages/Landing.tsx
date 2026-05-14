import { useEffect, useRef, useState } from "react";
import { Link, Redirect } from "wouter";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Play,
  Sparkles,
  Search,
  Heart,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Star,
  Wand2,
  Eye,
  Users,
  Film,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PosterArtwork from "@/components/PosterArtwork";
import { SAMPLE_VIDEOS, type VideoItem } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

const HERO_POSTERS: VideoItem[] = SAMPLE_VIDEOS;

const MOODS = [
  { label: "Cozy night in", emoji: "🌧️", count: 142 },
  { label: "Mind-bending", emoji: "🌀", count: 87 },
  { label: "Pure adrenaline", emoji: "⚡", count: 211 },
  { label: "Slow burn", emoji: "🕯️", count: 64 },
  { label: "Make me cry", emoji: "💧", count: 39 },
  { label: "Belly laughs", emoji: "🍿", count: 178 },
];

const TRENDING_FEED = [
  { user: "mila_k", action: "added to watchlist", title: "Shogun", time: "now" },
  { user: "jens.42", action: "rated 5★", title: "The Bear S3", time: "2m" },
  { user: "saraD", action: "is watching", title: "Dune: Part Two", time: "4m" },
  { user: "nikola__", action: "loved", title: "Poor Things", time: "6m" },
  { user: "amelie", action: "started", title: "True Detective S4", time: "8m" },
];

const TESTIMONIALS = [
  {
    quote: "I deleted three streaming apps. Streamifu just tells me what to watch. It's almost rude how good it is.",
    name: "Mila Kovač",
    role: "film critic",
  },
  {
    quote: "Found a Korean thriller I'd never have surfaced in a year of scrolling. One tap. Done.",
    name: "Jens van Dijk",
    role: "designer, Amsterdam",
  },
  {
    quote: "The 'mood' search ruined Netflix for me. In the best possible way.",
    name: "Sara Demir",
    role: "screenwriter",
  },
];

const STATS = [
  { value: 1200000, display: "1.2M", label: "titles indexed" },
  { value: 89, display: "89s", label: "avg. time to pick" },
  { value: 23, display: "23", label: "platforms unified" },
  { value: 4.9, display: "4.9★", label: "App Store rating" },
];

/* -------------------------------------------------------------------------- */
/* Shared animation variants                                                   */
/* -------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const wordReveal = {
  hidden: { opacity: 0, y: 24, rotateX: -20 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

/* -------------------------------------------------------------------------- */
/* Word-split title                                                             */
/* -------------------------------------------------------------------------- */

const AnimatedTitle = ({
  children,
  className,
  delay = 0,
}: {
  children: string;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const words = children.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.25em] ${className ?? ""}`} style={{ perspective: 800 }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={delay + i * 0.06}
          style={{ display: "inline-block", transformOrigin: "bottom center" }}
          transition={{ duration: 0.55, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const Landing = () => {
  const { user, loading } = useAuth();
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Redirect to="/app" />;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground overflow-x-hidden">
      <Nav />
      <Hero reduce={!!reduce} />
      <Marquee />
      <Discovery />
      <WhySection />
      <SocialProof />
      <StickyExperience />
      <MobileShowcase />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Landing;

/* -------------------------------------------------------------------------- */
/* NAV                                                                         */
/* -------------------------------------------------------------------------- */

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div
          className={`flex items-center justify-between h-14 px-4 sm:px-5 rounded-full transition-all duration-300 ${
            scrolled
              ? "bg-background/70 backdrop-blur-xl border border-border-highlight shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
              : "bg-transparent"
          }`}
        >
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-foreground">
            STREAMIFU<span className="text-primary">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
            <a href="#discover" className="hover:text-foreground transition-colors">Discover</a>
            <a href="#why" className="hover:text-foreground transition-colors">Why us</a>
            <a href="#proof" className="hover:text-foreground transition-colors">Loved by</a>
            <a href="#mobile" className="hover:text-foreground transition-colors">Mobile</a>
          </nav>
          <Link
            to="/sign-in"
            className="group inline-flex items-center gap-1.5 pl-4 pr-3 h-9 rounded-full bg-foreground text-background text-[13px] font-semibold hover:bg-primary transition-colors"
          >
            Get started
            <ArrowUpRight size={14} className="transition-transform group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/* HERO                                                                        */
/* -------------------------------------------------------------------------- */

const Hero = ({ reduce }: { reduce: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Multi-layer parallax at different rates
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const postersY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  return (
    <section ref={ref} className="relative pt-32 sm:pt-40 pb-24 sm:pb-32 overflow-hidden">
      {/* Layer 1 — slowest: background gradient */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ y: bgY }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, hsl(var(--primary) / 0.22) 0%, transparent 60%), radial-gradient(40% 30% at 80% 30%, hsl(var(--accent) / 0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          }}
        />
      </motion.div>

      {/* Layer 2 — medium: main content */}
      <motion.div style={{ y: contentY, opacity, scale }} className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Tag */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-border-highlight bg-card/50 backdrop-blur-md text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Now matching · 12,438 titles tonight
          </div>
        </motion.div>

        {/* Headline — word reveal */}
        <div className="mt-8 text-center font-display tracking-[-0.01em] leading-[0.85] overflow-hidden" style={{ perspective: 800 }}>
          <div className="text-[18vw] sm:text-[12vw] lg:text-[160px] text-foreground block">
            <AnimatedTitle delay={0.05}>Stop scrolling.</AnimatedTitle>
          </div>
          <div className="text-[18vw] sm:text-[12vw] lg:text-[160px] block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)",
              }}
            >
              <AnimatedTitle delay={0.25}>Start watching.</AnimatedTitle>
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="mt-8 text-center text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Streamifu reads the room — your mood, your time, your taste — and
          surfaces the one thing you actually want to watch tonight. Across every
          platform you already pay for.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.65}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/sign-in"
            className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold overflow-hidden shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_60px_-8px_hsl(var(--primary)/0.8)] transition-shadow"
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(110deg, transparent 30%, hsl(var(--accent) / 0.5) 50%, transparent 70%)",
              }}
            />
            <Play size={16} fill="currentColor" />
            <span className="relative">Get my recommendations</span>
            <ArrowUpRight size={16} className="relative transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href="#discover"
            className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full border border-border-highlight text-foreground text-[14px] font-medium hover:bg-card transition-colors"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.75}
          className="mt-5 text-center text-xs text-muted-foreground/70"
        >
          Free forever. No credit card. Works with Netflix, HBO, Apple TV+, Prime, Disney+ & 19 more.
        </motion.p>

        {/* Layer 3 — fastest: posters */}
        <motion.div style={{ y: postersY }}>
          <FloatingPosters reduce={reduce} />
        </motion.div>
      </motion.div>
    </section>
  );
};

const FloatingPosters = ({ reduce }: { reduce: boolean }) => {
  const layout = [
    { rot: -14, x: -340, y: 40, scale: 0.78, z: 0, delay: 0 },
    { rot: -7, x: -190, y: 12, scale: 0.88, z: 1, delay: 0.05 },
    { rot: -2, x: -55, y: -10, scale: 1.0, z: 3, delay: 0.1 },
    { rot: 2, x: 80, y: -8, scale: 1.0, z: 3, delay: 0.15 },
    { rot: 8, x: 215, y: 18, scale: 0.88, z: 1, delay: 0.2 },
    { rot: 14, x: 360, y: 48, scale: 0.78, z: 0, delay: 0.25 },
  ];

  return (
    <div className="relative mt-20 sm:mt-24 mx-auto" style={{ height: 320, perspective: 1400 }}>
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[60%] rounded-full"
        style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.2), transparent 70%)" }}
      />
      <div className="hidden md:block absolute inset-0">
        {HERO_POSTERS.map((p, i) => {
          const l = layout[i];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 80, rotate: l.rot, scale: l.scale * 0.85 }}
              animate={{ opacity: 1, y: l.y, rotate: l.rot, scale: l.scale }}
              transition={{ duration: 1.1, delay: 0.5 + l.delay, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: l.y - 18, scale: l.scale * 1.06, zIndex: 10 }}
              className="absolute left-1/2 top-1/2 w-[180px] -ml-[90px] -mt-[120px] rounded-xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-border-highlight"
              style={{ transform: `translateX(${l.x}px)`, zIndex: l.z }}
            >
              <PosterArtwork item={p} />
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                  }}
                  initial={{ x: "-120%" }}
                  animate={{ x: "120%" }}
                  transition={{ duration: 2.4, delay: 1.4 + i * 0.2, repeat: Infinity, repeatDelay: 6 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="md:hidden grid grid-cols-3 gap-3 px-2">
        {HERO_POSTERS.slice(0, 3).map((p) => (
          <div key={p.id} className="rounded-lg overflow-hidden ring-1 ring-border-highlight">
            <PosterArtwork item={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MARQUEE                                                                     */
/* -------------------------------------------------------------------------- */

const Marquee = () => {
  const platforms = ["NETFLIX", "HBO MAX", "APPLE TV+", "PRIME VIDEO", "DISNEY+", "MUBI", "PARAMOUNT+", "HULU", "PEACOCK", "CRITERION"];
  return (
    <div className="border-y border-border bg-card/30 py-5 overflow-hidden">
      <div className="flex items-center gap-12 whitespace-nowrap animate-[marquee_40s_linear_infinite]">
        {[...platforms, ...platforms].map((p, i) => (
          <span key={i} className="font-display text-xl tracking-[0.3em] text-muted-foreground/50">
            {p}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* DISCOVERY                                                                   */
/* -------------------------------------------------------------------------- */

const Discovery = () => {
  const [active, setActive] = useState(0);
  const [feed, setFeed] = useState(TRENDING_FEED);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % MOODS.length), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFeed((f) => [f[f.length - 1], ...f.slice(0, -1)]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="discover" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel>The interface</SectionLabel>
        <SectionTitle>
          <AnimatedTitle>A search bar that</AnimatedTitle>{" "}
          <em className="not-italic text-primary"><AnimatedTitle delay={0.3}>gets it.</AnimatedTitle></em>
        </SectionTitle>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0.15}
          className="mt-5 text-muted-foreground text-base sm:text-lg max-w-xl"
        >
          Type a feeling. Pick a mood. Or just stare. Streamifu replies in
          milliseconds with picks tuned to your taste history.
        </motion.p>

        <div className="mt-14 grid lg:grid-cols-[1.4fr_1fr] gap-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-border-highlight bg-card overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                background: "radial-gradient(60% 80% at 80% 0%, hsl(var(--primary) / 0.18), transparent 70%)",
              }}
            />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-background/60 border border-border-highlight">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <TypingText
                  texts={[
                    "something like Severance but warmer",
                    "movie under 100 minutes, sad ending ok",
                    "korean thriller, slow burn, 2020s",
                    "feel-good but not stupid",
                  ]}
                />
                <kbd className="ml-auto hidden sm:inline-flex items-center h-6 px-2 rounded-md border border-border bg-card text-[10px] font-mono text-muted-foreground">
                  ⌘ K
                </kbd>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {MOODS.map((m, i) => (
                  <button
                    key={m.label}
                    className={`group inline-flex items-center gap-2 h-9 px-4 rounded-full border text-[13px] transition-all ${
                      i === active
                        ? "bg-primary text-primary-foreground border-primary scale-[1.03]"
                        : "border-border bg-card hover:border-border-highlight"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="font-medium">{m.label}</span>
                    <span className={`text-[10px] tabular-nums ${i === active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {m.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                    Top match for {MOODS[active].emoji} {MOODS[active].label}
                  </span>
                  <span className="text-[11px] text-primary font-medium">98% confidence</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {SAMPLE_VIDEOS.slice(0, 5).map((v, i) => (
                    <motion.div
                      key={v.id}
                      whileHover={{ y: -4 }}
                      className={`relative rounded-xl overflow-hidden ring-1 transition-all ${
                        i === 0 ? "ring-primary shadow-[0_0_30px_-8px_hsl(var(--primary)/0.6)]" : "ring-border"
                      }`}
                    >
                      <PosterArtwork item={v} />
                      {i === 0 && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold tracking-wider uppercase">
                          <Sparkles size={9} /> Pick
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-border-highlight bg-card p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                <span className="font-display text-lg tracking-wide">Live tonight</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Streaming
              </span>
            </div>

            <ul className="space-y-2 flex-1">
              {feed.map((f, i) => (
                <motion.li
                  key={`${f.user}-${f.title}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1 - i * 0.12, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[12px] font-bold text-primary-foreground">
                    {f.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">
                      <span className="font-semibold">{f.user}</span>{" "}
                      <span className="text-muted-foreground">{f.action}</span>{" "}
                      <span className="font-medium text-foreground">{f.title}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{f.time}</div>
                  </div>
                  <Heart size={14} className="text-muted-foreground/60" />
                </motion.li>
              ))}
            </ul>

            <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
              <div>
                <div className="font-display text-2xl">312,944</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">decisions made today</div>
              </div>
              <Eye size={20} className="text-muted-foreground/50" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TypingText = ({ texts }: { texts: string[] }) => {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

  useEffect(() => {
    const target = texts[i];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (shown.length < target.length) {
        t = setTimeout(() => setShown(target.slice(0, shown.length + 1)), 35);
      } else {
        t = setTimeout(() => setPhase("pause"), 1800);
      }
    } else if (phase === "pause") {
      t = setTimeout(() => setPhase("deleting"), 400);
    } else {
      if (shown.length > 0) {
        t = setTimeout(() => setShown(shown.slice(0, -1)), 18);
      } else {
        setI((prev) => (prev + 1) % texts.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [shown, phase, i, texts]);

  return (
    <span className="flex-1 text-[14px] text-foreground font-medium">
      {shown}
      <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse" />
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* WHY SECTION                                                                 */
/* -------------------------------------------------------------------------- */

const WhySection = () => {
  const items = [
    {
      tag: "01 — Speed",
      title: "A pick in under 90 seconds.",
      body: "No algorithm theatre. No 'based on your activity' that misses entirely. A single confident answer — this one, tonight.",
      icon: Zap,
    },
    {
      tag: "02 — Taste",
      title: "Learns. Doesn't just index.",
      body: "Rate what you watch. Skip what you don't. The more you use it, the less you wait. That's the whole model.",
      icon: Wand2,
    },
    {
      tag: "03 — One library",
      title: "Every platform you pay for. One catalog.",
      body: "Netflix, HBO, Apple TV+, Mubi — search across all of them. Streamifu deep-links straight into the right app.",
      icon: Film,
    },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why" ref={ref} className="relative py-28 sm:py-36 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <SectionLabel>Why Streamifu</SectionLabel>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-[88px] leading-[0.92] tracking-tight">
            <AnimatedTitle>Every other app is built for the platform.</AnimatedTitle>
            <br />
            <span className="text-primary">
              <AnimatedTitle delay={0.3}>This one is built for you.</AnimatedTitle>
            </span>
          </h2>
        </div>

        <div className="mt-20 space-y-28 sm:space-y-36">
          {items.map((item, i) => (
            <WhyRow key={item.tag} item={item} flip={i % 2 === 1} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyRow = ({
  item,
  flip,
  index,
}: {
  item: { tag: string; title: string; body: string; icon: typeof Zap };
  flip: boolean;
  index: number;
}) => {
  const Icon = item.icon;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
        flip ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: flip ? 40 : -40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary mb-5">
          {item.tag}
        </div>
        <h3 className="font-display text-4xl sm:text-6xl leading-[0.95] tracking-tight">
          {item.title}
        </h3>
        <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
          {item.body}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: flip ? -40 : 40, scale: 0.96 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[5/4] rounded-3xl border border-border-highlight bg-card overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.18), transparent 60%)",
          }}
        />
        {index === 0 && <DecisionTimer />}
        {index === 1 && <TasteGraph />}
        {index === 2 && <PlatformGrid />}
        <div className="absolute bottom-5 left-5 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/20">
          <Icon size={16} />
        </div>
      </motion.div>
    </div>
  );
};

const DecisionTimer = () => (
  <div className="relative h-full w-full p-8 flex flex-col">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
      <span>Time to play</span>
      <span className="text-primary">live</span>
    </div>
    <div className="my-auto text-center">
      <div
        className="font-display text-[120px] sm:text-[180px] leading-none tabular-nums"
        style={{
          background: "linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--muted-foreground)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        00:47
      </div>
      <div className="text-xs text-muted-foreground mt-2">average across 312k users this week</div>
    </div>
    <div className="grid grid-cols-12 gap-1 h-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            background: i < 3 ? "hsl(var(--primary))" : "hsl(var(--muted))",
            opacity: i < 3 ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  </div>
);

const TasteGraph = () => (
  <div className="relative h-full w-full p-8">
    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6">Your taste, mapped</div>
    <svg viewBox="0 0 400 280" className="w-full h-[80%]">
      <defs>
        <radialGradient id="dot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[[80, 90, 180, 140], [180, 140, 260, 80], [180, 140, 250, 200], [250, 200, 330, 160]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border-highlight))" strokeWidth="1" />
      ))}
      {[
        { x: 80, y: 90, r: 6, label: "Sci-Fi" },
        { x: 180, y: 140, r: 14, label: "You" },
        { x: 260, y: 80, r: 5, label: "A24" },
        { x: 250, y: 200, r: 8, label: "Slow burn" },
        { x: 330, y: 160, r: 4, label: "K-thriller" },
        { x: 110, y: 220, r: 5, label: "Comedy" },
      ].map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={d.r * 3} fill="url(#dot)" opacity={0.4} />
          <circle cx={d.x} cy={d.y} r={d.r} fill={i === 1 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
          <text x={d.x} y={d.y + d.r + 14} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

const PlatformGrid = () => {
  const platforms = ["Netflix", "HBO", "Apple TV+", "Prime", "Disney+", "Mubi", "Hulu", "Paramount+", "Peacock"];
  return (
    <div className="relative h-full w-full p-8 flex flex-col">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6">All your subscriptions</div>
      <div className="grid grid-cols-3 gap-3 flex-1">
        {platforms.map((p, i) => (
          <div
            key={p}
            className="relative rounded-xl border border-border bg-background/40 flex items-center justify-center text-[12px] font-semibold tracking-wide"
            style={{ opacity: 0.4 + (i % 3) * 0.2 }}
          >
            {p}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary">
        <Sparkles size={12} /> unified into one search
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SOCIAL PROOF                                                                */
/* -------------------------------------------------------------------------- */

const AnimatedStat = ({ value, display, label }: { value: number; display: string; label: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const isDecimal = display.includes(".");
    const end = isDecimal ? parseFloat(display) : value;
    const steps = 50;
    let current = 0;
    const increment = end / steps;
    const timer = setInterval(() => {
      current = Math.min(current + increment, end);
      setCount(Math.round(current * 10) / 10);
      if (current >= end) clearInterval(timer);
    }, 900 / steps);
    return () => clearInterval(timer);
  }, [inView, value, display]);

  const suffix = display.replace(/[\d.]/g, "");
  const formatted = count >= 1000000
    ? (count / 1000000).toFixed(1) + "M"
    : count.toFixed(display.includes(".") ? 1 : 0);

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl sm:text-5xl text-foreground tracking-tight tabular-nums"
      >
        {inView ? formatted + suffix : display}
      </motion.div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
};

const SocialProof = () => (
  <section id="proof" className="py-28 sm:py-36 border-t border-border bg-card/20">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 items-end mb-16">
        <div>
          <SectionLabel>Loved by</SectionLabel>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-[88px] leading-[0.92] tracking-tight">
            <AnimatedTitle>312,944 people are deciding</AnimatedTitle>
            <br />
            <span className="text-muted-foreground"><AnimatedTitle delay={0.2}>what to watch</AnimatedTitle></span>{" "}
            <span className="text-primary"><AnimatedTitle delay={0.4}>right now.</AnimatedTitle></span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <AnimatedStat key={s.label} value={s.value} display={s.display} label={s.label} />
          ))}
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid md:grid-cols-3 gap-4"
      >
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            variants={fadeUp}
            custom={i * 0.07}
            className="relative p-7 rounded-3xl border border-border-highlight bg-background/60 group hover:border-primary/40 transition-colors"
          >
            <div className="flex gap-0.5 mb-5">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} size={13} className="text-primary" fill="currentColor" />
              ))}
            </div>
            <blockquote className="text-foreground/95 text-[15px] leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-border">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[12px] font-bold text-primary-foreground">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* STICKY EXPERIENCE — scroll-driven line reveal                               */
/* -------------------------------------------------------------------------- */

const StickyExperience = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const lines = [
    { text: "No more 40 minutes of trailers.", size: "text-[7vw] sm:text-[44px]" },
    { text: "No more 'what about this?' 'nah' 'this?' 'nah.'", size: "text-[7vw] sm:text-[44px]" },
    { text: "No more falling asleep on the menu screen.", size: "text-[7vw] sm:text-[44px]" },
    { text: "Just press play.", size: "text-[13vw] sm:text-[80px] text-primary" },
  ];

  // Each line is active in a 0.25 window of scroll progress
  const opacities = lines.map((_, i) => {
    const start = i * 0.22;
    const peak = start + 0.12;
    const end = start + 0.32;
    return useTransform(smooth, [start, peak, end, end + 0.1], [0.12, 1, i === lines.length - 1 ? 1 : 0.25, i === lines.length - 1 ? 1 : 0.12]);
  });

  const translateYs = lines.map((_, i) => {
    const start = i * 0.22;
    const peak = start + 0.12;
    return useTransform(smooth, [start, peak], [18, 0]);
  });

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: "350vh" }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background glow that grows with scroll */}
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.12), transparent 70%)",
            opacity: useTransform(smooth, [0, 0.5, 1], [0.3, 0.8, 1]),
            scale: useTransform(smooth, [0, 1], [0.8, 1.2]),
          }}
        />

        <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center w-full">
          <motion.div
            style={{ opacity: useTransform(smooth, [0, 0.05], [0, 1]) }}
            className="mb-8"
          >
            <SectionLabel center>The feeling</SectionLabel>
          </motion.div>

          {lines.map((l, i) => (
            <motion.p
              key={i}
              style={{ opacity: opacities[i], y: translateYs[i] }}
              className={`font-display tracking-tight leading-[0.95] ${l.size} ${i === lines.length - 1 ? "mt-6" : ""}`}
            >
              {l.text}
            </motion.p>
          ))}
        </div>

        {/* Scroll progress bar at bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-foreground/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full origin-left"
            style={{ scaleX: smooth }}
          />
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* MOBILE SHOWCASE                                                             */
/* -------------------------------------------------------------------------- */

const MobileShowcase = () => {
  return (
    <section id="mobile" className="py-28 sm:py-36 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionLabel>On the go</SectionLabel>
            <h2 className="font-display text-5xl sm:text-7xl lg:text-[88px] leading-[0.92] tracking-tight">
              <AnimatedTitle>Designed for the couch.</AnimatedTitle>
              <br />
              <span className="text-primary"><AnimatedTitle delay={0.25}>Perfected for the pocket.</AnimatedTitle></span>
            </h2>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
              Swipe right to save. Left to skip. Tap to play. The whole interface
              is a thumb-flick away — built for those 90 seconds before bed.
            </p>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {["iPhone", "Android", "iPad", "Apple TV", "Web"].map((p) => (
                <motion.span
                  key={p}
                  variants={fadeUp}
                  className="inline-flex items-center h-8 px-3.5 rounded-full border border-border-highlight text-[12px] text-muted-foreground"
                >
                  {p}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative h-[560px] flex items-center justify-center">
            <PhoneMock tilt={-8} offset={-90} z={1} item={SAMPLE_VIDEOS[0]} />
            <PhoneMock tilt={6} offset={90} z={2} item={SAMPLE_VIDEOS[2]} primary />
          </div>
        </div>
      </div>
    </section>
  );
};

const PhoneMock = ({
  tilt,
  offset,
  z,
  item,
  primary,
}: {
  tilt: number;
  offset: number;
  z: number;
  item: VideoItem;
  primary?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -12, scale: 1.02 }}
      className="absolute"
      style={{ transform: `translateX(${offset}px)`, zIndex: z }}
    >
      <div className="relative w-[260px] h-[520px] rounded-[44px] bg-black border-[10px] border-foreground/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-20" />
        <div className="absolute inset-0 bg-background">
          <div className="flex items-center justify-between px-7 pt-4 text-[10px] font-semibold">
            <span>9:41</span>
            <span className="flex gap-1 items-center">
              <span className="w-3 h-1.5 rounded-sm bg-foreground/60" />
              <span className="w-3 h-1.5 rounded-sm bg-foreground" />
            </span>
          </div>
          <div className="px-5 pt-6">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">For you · tonight</div>
            <div className="font-display text-2xl mt-1 leading-none">{item.title}</div>
          </div>
          <div className="mx-5 mt-4 aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-border-highlight">
            <PosterArtwork item={item} />
          </div>
          <div className="absolute bottom-7 left-0 right-0 px-5">
            {primary ? (
              <button className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[13px] font-bold inline-flex items-center justify-center gap-2 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)]">
                <Play size={14} fill="currentColor" /> Play on Netflix
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button className="flex-1 h-12 rounded-2xl border border-border-highlight bg-card text-[12px] font-semibold">✕ Skip</button>
                <button className="flex-1 h-12 rounded-2xl bg-foreground text-background text-[12px] font-semibold">♥ Save</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* FINAL CTA                                                                   */
/* -------------------------------------------------------------------------- */

const FinalCTA = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.82, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className="relative py-32 sm:py-44 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary) / 0.25), transparent 70%)",
          opacity: glowOpacity,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <motion.div style={{ scale, opacity }}>
          <h2 className="font-display text-[18vw] sm:text-[120px] leading-[0.85] tracking-tight">
            Tonight,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, hsl(var(--primary)), hsl(var(--accent)) 60%, hsl(var(--primary)))",
              }}
            >
              press play.
            </span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-muted-foreground text-base sm:text-lg max-w-md mx-auto"
        >
          Two seconds to sign up. Zero seconds wasted on the menu screen ever again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/sign-in"
            className="group relative inline-flex items-center justify-center gap-2 h-14 px-9 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold shadow-[0_12px_50px_-10px_hsl(var(--primary)/0.7)] hover:shadow-[0_16px_60px_-10px_hsl(var(--primary)/0.9)] transition-shadow"
          >
            <Play size={16} fill="currentColor" />
            Start free
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Users size={13} /> 312,944 already in
          </span>
        </motion.div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* FOOTER                                                                      */
/* -------------------------------------------------------------------------- */

const Footer = () => (
  <footer className="border-t border-border">
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
      <div className="grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="font-display text-2xl tracking-[0.2em]">
            STREAMIFU<span className="text-primary">.</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
            The discovery layer for everything you watch. Made by people who
            were tired of the menu screen.
          </p>
        </div>
        {[
          { title: "Product", links: ["Discover", "Mood search", "Watchlists", "Mobile app"] },
          { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
          { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-foreground/80 hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Streamifu. Built with too much popcorn.</div>
        <div>Crafted in the dark.</div>
      </div>
    </div>
  </footer>
);

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

const SectionLabel = ({ children, center = false }: { children: React.ReactNode; center?: boolean }) => (
  <div className={`inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-5 ${center ? "justify-center" : ""}`}>
    <span className="w-6 h-px bg-primary" />
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-5xl sm:text-7xl lg:text-[88px] leading-[0.92] tracking-tight">
    {children}
  </h2>
);
