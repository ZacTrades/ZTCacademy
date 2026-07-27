import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Play,
  Radio,
  Users,
  LineChart,
  Mail,
  Brain,
  Shield,
  MessageSquareText,
  GraduationCap,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Star,
  ChevronDown,
  Trophy,
  Zap,
  TrendingUp,
  Crown,
  Copy,
  ExternalLink,
  Instagram,
  Maximize,
  MessageCircle,
  Mic,
  Music2,
  Newspaper,
  Phone,
  Plus,
  Smile,
  Volume2,
  Wrench,
  Send,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/Navbar";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { TickerTape } from "@/components/site/TickerTape";
import { CandleChart } from "@/components/site/CandleChart";
import { Counter } from "@/components/site/Counter";
import { Footer } from "@/components/site/Footer";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { defaultCoachingPlans, fetchCoachingPlans } from "@/components/site/coachingPlans";
import {
  defaultCommunitySocials,
  fetchCommunitySocials,
  fetchIndicators,
  fetchTradingTools,
  type CommunitySocialRow,
} from "@/components/site/editableContent";
import {
  fetchLiveTradingPackages,
  liveTradingPackages,
} from "@/components/site/liveTradingPackages";
import hero from "@/assets/hero-trading.jpg";
import tradingViewPreview from "@/assets/zactrades-tradingview-preview.jpeg";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZacTrades — Trade Like Professionals. Master the Markets." },
      {
        name: "description",
        content:
          "Join 10,000+ elite traders. Live trading sessions, 1-on-1 mentorship, premium TradingView indicators, and a VIP community. Become consistently profitable.",
      },
      { property: "og:title", content: "ZacTrades — Elite Trading Coaching" },
      {
        property: "og:description",
        content: "Live trading rooms, mentorship, premium indicators.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
  }),
  component: Home,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <TickerTape />
      <LogoStrip />
      <Features />
      <LiveRoom />
      <Mentorship />
      <Indicators />
      <TradingTools />
      <Stats />
      <Testimonials />
      <ConnectWithUs />
      <Newsletter />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ============================ HERO ============================ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-10 md:pt-32 md:pb-20">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />
      <img
        src={hero}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/70 to-background" />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <Badge
              variant="outline"
              className="glass mb-6 gap-2 border-primary/30 px-4 py-1.5 text-xs font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
              </span>
              Live trading session in progress
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl"
          >
            Trade Like <span className="text-gradient-gold">Professionals.</span>
            <br />
            Master the <span className="text-gradient">Markets.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Join elite traders in daily live sessions, 1-on-1 mentorship, and access premium
            indicators engineered to make you consistently profitable.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-10"
          >
            <Button
              asChild
              size="lg"
              style={{ background: "var(--gradient-primary)" }}
              className="group h-12 px-8 text-base font-semibold text-primary-foreground glow-primary hover:opacity-90"
            >
              <a href="#mentorship">
                Start Mentorship
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground md:mt-8"
          >
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span>4.9/5 from 2,400+ reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Trusted by 10,000+ traders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-gold" />
              <span>+34.7% avg monthly ROI</span>
            </div>
          </motion.div>
        </div>

        {/* Floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative mx-auto mt-8 max-w-5xl md:mt-10"
        >
          <motion.div
            className="glass-strong relative rounded-3xl p-3 md:p-4 glow-primary"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-bear/70" />
              <span className="h-3 w-3 rounded-full bg-gold/70" />
              <span className="h-3 w-3 rounded-full bg-bull/70" />
              <div className="ml-0 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:ml-4">
                tradingview.com / ZacTrades execution replay
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-electric">
                Live chart study
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#080b10] shadow-[0_24px_80px_-34px_oklch(0.68_0.19_250/0.7)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-gold/10" />
              <div className="relative aspect-[4/3] w-full md:aspect-[1.4/1]">
                <img
                  src={tradingViewPreview}
                  alt="TradingView chart setup from ZacTrades showing a NASDAQ execution replay."
                  className="h-full w-full object-contain"
                  loading="eager"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
          </motion.div>

          {/* Floating accents */}
          <motion.div
            className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/30 blur-3xl"
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.18, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-accent/30 blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.12, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ LOGO STRIP ============================ */
function LogoStrip() {
  const logos = ["BLOOMBERG", "FORBES", "BENZINGA", "YAHOO FINANCE", "REUTERS", "CNBC"];
  return (
    <section className="py-7 md:py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          As featured in
        </p>
        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:mt-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.06 }}
        >
          {logos.map((l) => (
            <motion.span
              key={l}
              variants={{
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -3, color: "hsl(var(--gold))" }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="font-display text-sm font-semibold text-muted-foreground/60 tracking-widest"
            >
              {l}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FEATURES ============================ */
function Features() {
  const items = [
    {
      icon: Radio,
      title: "Live Trading Sessions",
      desc: "Trade alongside pros in real-time, 5 days a week.",
    },
    {
      icon: LineChart,
      title: "Real-Time Analysis",
      desc: "Daily market breakdowns, setups, and outlooks.",
    },
    {
      icon: Crown,
      title: "VIP Mentorship",
      desc: "1-on-1 coaching with verified profitable traders.",
    },
    {
      icon: Zap,
      title: "Smart Indicators",
      desc: "Premium TradingView indicators with proven edge.",
    },
    {
      icon: Shield,
      title: "Risk Management",
      desc: "Master position sizing and capital preservation.",
    },
    { icon: Users, title: "Elite Community", desc: "Private Discord with 10,000+ active traders." },
    {
      icon: MessageSquareText,
      title: "Trade Recaps",
      desc: "Daily recaps of every winning and losing trade.",
    },
    {
      icon: Brain,
      title: "Psychology Coaching",
      desc: "Build the mindset of a consistently profitable trader.",
    },
  ];
  return (
    <section id="features" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/30 text-xs">
            <Sparkles className="mr-1.5 h-3 w-3 text-gold" />
            Everything you need
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            The complete ecosystem to <span className="text-gradient">trade smarter</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for serious traders. Engineered for consistent results.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-9">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              {...fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="group glass relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/0 blur-2xl transition-all group-hover:bg-primary/30" />
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)]/20 text-electric ring-1 ring-primary/30">
                  <it.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ LIVE ROOM ============================ */
function LiveRoom() {
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedLivePackage, setSelectedLivePackage] = useState(0);
  const [livePackages, setLivePackages] = useState(liveTradingPackages);

  useEffect(() => {
    let mounted = true;

    fetchLiveTradingPackages().then((packages) => {
      if (mounted) {
        setLivePackages(packages);
        setSelectedLivePackage((current) => Math.min(current, packages.length - 1));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="live" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="glass mb-4 border-bull/40 text-xs">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-bull animate-pulse-glow" />
              Live Now
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Premium membership for <span className="text-gradient">live traders.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Trade live with Zac every day, prepare before the session, review the market, ask
              questions, and stay connected through the private Discord community.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Live trading every day during the New York session",
                "Daily and weekly market analysis: Nasdaq, gold, FX, and more",
                "Pre-market live prep: plan, prepare, execute",
                "Q&A access: ask, learn, and get answers",
                "Extra psychology talks for mindset, discipline, and control",
                "Exclusive access to the Discord community",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-bull/15 text-bull">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  {t}
                </li>
              ))}
            </ul>
            {isStaff ? (
              <div className="mt-8">
                <StaffCheckoutNotice description="Live trading checkout is hidden for admin and moderator accounts. Staff can manage live-room package pricing from the admin page." />
              </div>
            ) : (
              <>
                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold">
                      Choose your live trading access
                    </h3>
                    <Badge variant="outline" className="glass border-bull/40 text-[10px] text-bull">
                      Flexible duration
                    </Badge>
                  </div>
                  <p className="mb-3 text-xs leading-5 text-muted-foreground">
                    Students after formation receive 20% off all live trading packages.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {livePackages.map((option, index) => (
                      <button
                        key={option.duration}
                        type="button"
                        onClick={() => {
                          setSelectedLivePackage(index);
                          setOpen(true);
                        }}
                        className={`group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                          selectedLivePackage === index
                            ? "border-gold/60 bg-gold/10 ring-1 ring-gold/30"
                            : "border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-base font-bold">
                              {option.duration}
                            </div>
                          </div>
                          {option.badge && (
                            <span className="rounded-full bg-bull/15 px-2 py-1 text-[10px] font-semibold text-bull">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span>
                            {option.originalPrice && (
                              <span className="mb-1 block font-mono text-xs text-muted-foreground line-through">
                                Before {option.originalPrice}
                              </span>
                            )}
                            <span className="block font-mono text-2xl font-bold text-gradient-gold">
                              {option.price}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-electric group-hover:underline">
                            Select
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setOpen(true)}
                  style={{ background: "var(--gradient-primary)" }}
                  className="mt-8 glow-primary hover:opacity-90 text-primary-foreground"
                >
                  Access Live Trading Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <CheckoutDialog
                  open={open}
                  onOpenChange={setOpen}
                  initialPackageIndex={selectedLivePackage}
                  packages={livePackages}
                />
              </>
            )}
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
            <div className="glass-strong relative overflow-hidden rounded-2xl p-2 glow-emerald md:p-3">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-bull/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-[#111016] shadow-2xl">
                <div className="grid min-h-[620px] gap-0 lg:grid-cols-[minmax(0,1fr)_290px]">
                  <div className="flex min-w-0 flex-col bg-black">
                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-bear shadow-[0_0_12px_hsl(var(--bear))]" />
                        <div className="truncate font-display text-sm font-bold md:text-base">
                          LIVE Day Trading NewYork Session
                        </div>
                        <span className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
                          <BarChart3 className="h-3.5 w-3.5" />
                          <TrendingUp className="h-3.5 w-3.5" />
                          <MessageSquareText className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="hidden items-center gap-1 sm:flex">
                          <Mic className="h-3.5 w-3.5" />2 speaking
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          43 listening
                        </span>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3">
                      <div className="group relative overflow-hidden rounded-md bg-[#080808] ring-1 ring-white/10">
                        <img
                          src={tradingViewPreview}
                          alt="ZacTrades live TradingView screen share"
                          className="aspect-[16/8.6] w-full object-cover opacity-80 grayscale-[0.15] transition-transform duration-700 group-hover:scale-[1.015]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />
                        <div className="absolute left-4 top-4 flex max-w-[80%] items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                          <span className="h-2.5 w-2.5 rounded-full bg-bear shadow-[0_0_12px_hsl(var(--bear))]" />
                          LIVE market screen share
                        </div>
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                          <LineChart className="h-4 w-4 text-electric" />
                          Zac Trades
                        </div>
                        <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
                          09:44:33 UTC-4 · ETH
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            Intervenants — 2
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          {[
                            { name: "ZacTrades", color: "bg-primary/20 text-electric" },
                            { name: "Suffy94", color: "bg-bull/20 text-bull" },
                          ].map((speaker) => (
                            <div key={speaker.name} className="flex items-center gap-2">
                              <div
                                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ring-2 ring-background ${speaker.color}`}
                              >
                                {speaker.name[0]}
                              </div>
                              <Badge className="border-bear/40 bg-bear/80 px-2 py-0.5 text-[10px] text-white">
                                EN DIRECT
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Audience — 43
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="grid max-h-44 grid-cols-5 gap-3 overflow-hidden sm:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7">
                          {[
                            "aziz",
                            "Suffy94",
                            "MaowZ13",
                            "Dahaytam",
                            "Issaac",
                            "Fox",
                            "Hatimsp",
                            "RA-SM-AM",
                            "Leouf32",
                            "ayoub",
                            "simo",
                            "Badre",
                            "Khalid",
                            "mariam",
                            "BRADA",
                            "imad",
                            "Youssef",
                            "Spooox",
                            "S",
                            "Ilham",
                            "MOD",
                          ].map((avatar, index) => (
                            <div key={`${avatar}-${index}`} className="text-center">
                              <div
                                className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white ring-1 ring-white/10 ${
                                  index % 5 === 0
                                    ? "bg-[#5865f2]"
                                    : index % 4 === 0
                                      ? "bg-[#ed4fa8]"
                                      : index % 3 === 0
                                        ? "bg-[#2f855a]"
                                        : "bg-muted/40"
                                }`}
                              >
                                {avatar[0].toUpperCase()}
                              </div>
                              <div className="mx-auto mt-1 w-12 truncate text-[10px] text-muted-foreground">
                                {avatar}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto mb-4 mt-auto flex w-fit items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-xl ring-1 ring-border/60">
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Mic className="h-4 w-4" />
                      </button>
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button className="grid h-10 w-12 place-items-center rounded-md bg-bear text-white">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Maximize className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <aside className="flex min-h-[360px] flex-col border-t border-white/10 bg-[#1d1b22] lg:border-l lg:border-t-0">
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 font-display text-sm font-bold">
                        <span className="h-3 w-3 rounded-full bg-bear" />
                        Premium LIVE
                      </div>
                      <div className="text-[11px] text-muted-foreground">Live room chat</div>
                    </div>
                    <div className="border-b border-white/10 p-4">
                      <div className="mx-auto max-w-32 overflow-hidden rounded-md border border-white/10 bg-black/40">
                        <img
                          src={tradingViewPreview}
                          alt=""
                          className="h-24 w-full object-cover object-right opacity-80"
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted/30 px-2 py-1">3 reactions</span>
                        <span className="rounded-md bg-muted/30 px-2 py-1">live chat</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-hidden p-4 text-xs">
                      {[
                        { u: "Oussama Touati", m: "Khoya zac chno bank wch nkhliha tp" },
                        { u: "imad", m: "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh" },
                        { u: "THE.OUTIS.LAMANI", m: "independent thinking !!", pro: true },
                        { u: "Hatimsp", m: "tema cpi high o london high" },
                        { u: "ZTC Radio", m: "Started playing I'm Your Poison", app: true },
                        { u: "THE.OUTIS.LAMANI", m: "i still see lower prices before 4H sibi" },
                      ].map((msg) => (
                        <div key={`${msg.u}-${msg.m}`} className="flex items-start gap-2">
                          <div
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                              msg.pro
                                ? "bg-bull/20 text-bull"
                                : msg.app
                                  ? "bg-[#5865f2]/30 text-[#9fb0ff]"
                                  : "bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {msg.u[0]}
                          </div>
                          <div>
                            <div
                              className={`font-semibold ${msg.pro ? "text-gold" : "text-electric"}`}
                            >
                              {msg.u}
                            </div>
                            <div className="leading-5 text-foreground/80">{msg.m}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/10 bg-background/45 p-3">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                        Message Premium LIVE
                      </div>
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================ MENTORSHIP ============================ */
function Mentorship() {
  const { isStaff } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCoachingIndex, setSelectedCoachingIndex] = useState(0);
  const [coachingOptions, setCoachingOptions] = useState(defaultCoachingPlans);
  const selectedCoaching = coachingOptions[selectedCoachingIndex] ?? coachingOptions[0];

  useEffect(() => {
    let mounted = true;

    fetchCoachingPlans().then((plans) => {
      if (mounted) {
        setCoachingOptions(plans);
        setSelectedCoachingIndex((current) => Math.min(current, plans.length - 1));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="mentorship" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
            <GraduationCap className="mr-1.5 h-3 w-3 text-gold" />
            Elite Mentorship
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Coached by <span className="text-gradient-gold">verified profitable</span> traders
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not gurus. Not influencers. Real traders with real track records.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2">
          {coachingOptions.map((option, i) => (
            <motion.div
              key={option.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className={`glass relative overflow-hidden rounded-2xl p-6 md:p-8 ${
                option.featured ? "border-gold/35 glow-gold" : "border-primary/20"
              }`}
            >
              <div
                className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
                  option.featured ? "bg-gold/20" : "bg-primary/20"
                }`}
                aria-hidden
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${
                      option.featured ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <option.icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`mb-4 text-[10px] uppercase tracking-[0.2em] ${
                      option.featured
                        ? "border-gold/40 text-gold"
                        : "border-primary/40 text-primary"
                    }`}
                  >
                    {option.promotionEnabled && option.promotionLabel
                      ? option.promotionLabel
                      : "Coaching Path"}
                  </Badge>
                  <h3 className="font-display text-2xl font-bold">{option.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    {option.desc}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Price
                      </div>
                      <div
                        className={`mt-1 font-display text-2xl font-bold ${option.featured ? "text-gold" : "text-primary"}`}
                      >
                        {option.price}
                      </div>
                      {option.promotionEnabled && option.originalPrice && (
                        <div className="mt-1 font-mono text-xs text-muted-foreground line-through">
                          {option.originalPrice}
                        </div>
                      )}
                      {option.promotionEnabled &&
                        (option.promotionNote || option.promotionEndsAt) && (
                          <div className="mt-2 text-[11px] leading-4 text-gold">
                            {[option.promotionNote, option.promotionEndsAt]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                    </div>
                    <div className="rounded-xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Duration
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {option.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                {option.details.map((detail) => (
                  <div
                    key={detail}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${option.featured ? "text-gold" : "text-primary"}`}
                    />
                    {detail}
                  </div>
                ))}
              </div>
              {isStaff ? (
                <div className="relative mt-7">
                  <StaffCheckoutNotice description="Coaching checkout is hidden for admin and moderator accounts. Staff can manage coaching prices and promotions from the admin page." />
                </div>
              ) : (
                <Button
                  type="button"
                  className={`group relative mt-7 ${
                    option.featured
                      ? "bg-gold text-background hover:bg-gold/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => {
                    setSelectedCoachingIndex(i);
                    setCheckoutOpen(true);
                  }}
                >
                  {option.cta}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        {!isStaff && (
          <CheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            mentorshipPlanSlug={selectedCoaching.slug}
            planName={selectedCoaching.title}
            features={selectedCoaching.details}
            packages={selectedCoaching.checkoutPackages}
          />
        )}
      </div>
    </section>
  );
}

/* ============================ INDICATORS ============================ */
function Indicators() {
  const createTradingViewChartUrl = (studies: string[]) => {
    const params = new URLSearchParams({
      symbol: "OANDA:XAUUSD",
      interval: "60",
      studies: studies.join(","),
    });

    return `https://www.tradingview.com/chart/?${params.toString()}`;
  };

  const [items, setItems] = useState<
    Array<{
      name: string;
      description: string;
      tag: string;
      stats_label: string;
      tradingview_url: string;
    }>
  >([]);

  useEffect(() => {
    let mounted = true;

    fetchIndicators().then((indicators) => {
      if (mounted) {
        setItems(indicators);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="indicators" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <BarChart3 className="mr-1.5 h-3 w-3 text-electric" />
            Premium Indicators
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Indicators built by <span className="text-gradient">traders, for traders</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Battle-tested algorithms. Native TradingView integration. Zero noise.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-6 md:mt-9 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="glass group rounded-2xl p-5 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{it.name}</h3>
                <Badge className="bg-gold/15 text-gold border-gold/30">{it.tag}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>
              <div className="mt-4 h-36 overflow-hidden rounded-lg bg-background/60 ring-1 ring-border/60">
                <CandleChart count={40} height={140} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{it.stats_label}</span>
              </div>
              <Button
                asChild
                size="sm"
                className="mt-4 w-full font-semibold text-primary-foreground glow-primary hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <a href={it.tradingview_url} target="_blank" rel="noreferrer">
                  Open on TradingView
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">
            Works seamlessly with <span className="font-semibold text-foreground">TradingView</span>
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="glass border-primary/40 text-foreground hover:text-foreground"
          >
            <a
              href={createTradingViewChartUrl(["STD;EMA", "STD;VWAP", "STD;MACD", "STD;RSI"])}
              target="_blank"
              rel="noreferrer"
            >
              Open TradingView Chart
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ============================ TRADING TOOLS ============================ */
function TradingTools() {
  const toolTones = [
    "text-electric border-primary/40 bg-primary/10",
    "text-foreground border-border/60 bg-background/40",
    "text-bear border-bear/40 bg-bear/10",
    "text-bull border-bull/40 bg-bull/10",
    "text-gold border-gold/40 bg-gold/10",
    "text-primary border-primary/40 bg-primary/10",
  ];
  const [tools, setTools] = useState<
    Array<{
      name: string;
      category: string;
      description: string;
      promo_code: string;
      discount: string;
      url: string;
      highlights: string[];
    }>
  >([]);

  useEffect(() => {
    let mounted = true;

    fetchTradingTools().then((items) => {
      if (mounted) {
        setTools(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="tools" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <Wrench className="mr-1.5 h-3 w-3 text-electric" />
            Trading Tools
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Top trading tools I use for <span className="text-gradient">consistent execution</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A practical stack for charting, journaling, news prep, tracking performance, and market
            research.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="glass group flex min-h-80 flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className={`mb-4 ${toolTones[i % toolTones.length]}`}>
                    <Newspaper className="mr-1.5 h-3.5 w-3.5" />
                    {tool.category}
                  </Badge>
                  <h3 className="font-display text-2xl font-bold">{tool.name}</h3>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Deal
                  </div>
                  <div className="text-xs font-semibold text-bull">{tool.discount}</div>
                </div>
              </div>

              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                {tool.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {tool.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Promo Code
                    </div>
                    <div className="mt-1 font-mono text-base font-bold text-gold">
                      {tool.promo_code}
                    </div>
                  </div>
                  <Copy className="h-4 w-4 text-gold" />
                </div>
              </div>

              <Button
                asChild
                className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <a href={tool.url} target="_blank" rel="noreferrer">
                  Access {tool.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ STATS ============================ */
function Stats() {
  const stats = [
    { label: "Active members", value: 10240, suffix: "+" },
    { label: "Avg monthly ROI", value: 34.7, suffix: "%", decimals: 1 },
    { label: "Trades analyzed", value: 1280000, suffix: "+" },
    { label: "Hours streamed live", value: 12500, suffix: "+" },
  ];
  return (
    <section className="relative py-12 md:py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="glass-strong grid gap-8 rounded-3xl px-6 py-10 md:grid-cols-4 md:px-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-bold md:text-5xl text-gradient">
                <Counter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ TESTIMONIALS ============================ */
function Testimonials() {
  const t = [
    {
      name: "James W.",
      role: "Funded Trader · $200K",
      quote:
        "Went from blowing accounts to passing my first funded challenge in 6 weeks. The live room is gold.",
      profit: "+$48,210",
      time: "09:42",
    },
    {
      name: "Priya S.",
      role: "Swing Trader",
      quote:
        "The mentorship completely rewired how I think about risk. My drawdowns shrunk by 60%.",
      profit: "+$22,540",
      time: "10:18",
    },
    {
      name: "Tomás R.",
      role: "Day Trader · ES",
      quote:
        "Zac Trend Pro alone paid for the subscription 10x over in my first month. Insane value.",
      profit: "+$15,890",
      time: "11:03",
    },
    {
      name: "Aisha M.",
      role: "Crypto Trader",
      quote: "The community is unmatched. Real traders sharing real setups — no LARPing.",
      profit: "+$31,420",
      time: "13:27",
    },
    {
      name: "Liam O.",
      role: "Forex Trader",
      quote: "I finally understand market structure. The psychology coaching changed everything.",
      profit: "+$19,070",
      time: "15:54",
    },
    {
      name: "Yuki T.",
      role: "Options Trader",
      quote:
        "Daily recaps make every losing trade a lesson. I'm a completely different trader now.",
      profit: "+$27,830",
      time: "18:12",
    },
  ];
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-bull/40 text-xs">
            <Trophy className="mr-1.5 h-3 w-3 text-bull" />
            Member Results
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Real traders. <span className="text-gradient-gold">Real profits.</span>
          </h2>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2 lg:grid-cols-3">
          {t.map((x, i) => (
            <motion.div
              key={x.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 3) * 0.05 }}
              className="glass overflow-hidden rounded-2xl border-border/60"
            >
              <div className="flex items-center gap-3 border-b border-border/50 bg-[#13382f]/80 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-bull/20 text-sm font-bold text-bull ring-1 ring-bull/30">
                  {x.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{x.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{x.role}</div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3 w-3 fill-gold text-gold" />
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-[radial-gradient(circle_at_15%_20%,rgba(34,197,94,0.12),transparent_26%),linear-gradient(135deg,rgba(19,56,47,0.65),rgba(6,12,11,0.85))] p-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-background/85 px-4 py-3 text-sm leading-6 shadow-sm ring-1 ring-border/50">
                  Hey ZacTrades, quick update from my side.
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">{x.time}</div>
                </div>

                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-bull/20 px-4 py-3 text-sm leading-6 text-foreground shadow-sm ring-1 ring-bull/25">
                  {x.quote}
                  <div className="mt-1 text-right text-[10px] text-bull">read · {x.time}</div>
                </div>

                <div className="ml-auto w-fit rounded-xl bg-gold/15 px-3 py-2 font-mono text-xs font-semibold text-gold ring-1 ring-gold/30">
                  Shared result: {x.profit}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/50">
                  <span className="h-2 w-2 rounded-full bg-bull" />
                  Review received on WhatsApp
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ CONNECT ============================ */
function ConnectWithUs() {
  const [socials, setSocials] = useState<CommunitySocialRow[]>(defaultCommunitySocials);

  useEffect(() => {
    let mounted = true;

    fetchCommunitySocials().then((items) => {
      if (mounted) {
        setSocials(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const socialIcons = {
    youtube: Youtube,
    instagram: Instagram,
    music: Music2,
    message: MessageCircle,
  };

  const socialTones = {
    bear: "text-bear border-bear/40 bg-bear/10",
    gold: "text-gold border-gold/40 bg-gold/10",
    primary: "text-electric border-primary/40 bg-primary/10",
    bull: "text-bull border-bull/40 bg-bull/10",
  };

  return (
    <section id="connect" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <MessageCircle className="mr-1.5 h-3 w-3 text-electric" />
            Connect with us
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Follow the <span className="text-gradient">ZacTrades</span> community
          </h2>
          <p className="mt-4 text-muted-foreground">
            Keep up with lessons, live updates, member wins, and community discussions.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 md:mt-9 lg:grid-cols-4">
          {socials.map((social, i) => {
            const Icon = socialIcons[social.icon_key as keyof typeof socialIcons] ?? MessageCircle;
            const tone =
              socialTones[social.tone_key as keyof typeof socialTones] ?? socialTones.primary;

            return (
              <motion.div
                key={social.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="glass group flex min-h-64 flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl border ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{social.name}</h3>
                <p className="mt-1 text-sm font-semibold text-electric">{social.handle}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {social.description}
                </p>
                <Button
                  asChild
                  className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <a href={social.url} target="_blank" rel="noreferrer">
                    Open {social.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ NEWSLETTER ============================ */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <section id="newsletter" className="relative overflow-hidden py-12 md:py-20">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <motion.div
          {...fadeUp}
          className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-10"
        >
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                <Mail className="mr-1.5 h-3 w-3 text-gold" />
                Newsletter
              </Badge>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Join <span className="text-gradient-gold">ZTC newsletter</span>
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
                Get weekly market notes, trade recaps, and mindset prompts from the ZacTrades team.
              </p>
            </div>

            <form
              className="rounded-xl border border-border/60 bg-background/55 p-3 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setJoined(true);
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setJoined(false);
                  }}
                  placeholder="you@example.com"
                  className="min-h-12 flex-1 rounded-lg border border-border/70 bg-card/80 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <Button
                  type="submit"
                  size="lg"
                  style={{ background: "var(--gradient-gold)" }}
                  className="h-12 shrink-0 px-6 font-semibold text-background glow-gold hover:opacity-90"
                >
                  Subscribe
                  <Send className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {joined
                  ? "You're on the list. Watch your inbox for the next ZTC update."
                  : "No spam. Just sharp trading insights and community updates."}
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
function FAQ() {
  const faqs = [
    {
      q: "Do I need trading experience to join?",
      a: "No. Our curriculum covers everything from beginner fundamentals to advanced strategies. Many of our most successful members started with zero experience.",
    },
    {
      q: "What's your refund policy?",
      a: "We offer a 7-day money-back guarantee on all plans. If you're not satisfied, email us within 7 days for a full refund — no questions asked.",
    },
    {
      q: "When are live trading sessions held?",
      a: "Live sessions run Monday–Friday at 9:30 AM EST (NY market open) and 8:00 PM EST (Asian session). All sessions are recorded and added to the library.",
    },
    {
      q: "Which brokers do you support?",
      a: "Our strategies and indicators work with any broker that supports TradingView, including Interactive Brokers, Tradovate, OANDA, Binance, Bybit, and more.",
    },
    {
      q: "How do I install the indicators?",
      a: "After subscribing, you'll get instant access via our dashboard. Our setup guides walk you through TradingView installation in under 2 minutes.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Cancel anytime from your dashboard with one click. You'll retain access until the end of your billing period.",
    },
  ];
  return (
    <section id="faq" className="py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <motion.div {...fadeUp} className="text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            FAQ
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Questions, <span className="text-gradient">answered.</span>
          </h2>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass rounded-xl border-0 px-5">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FINAL CTA ============================ */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
        <motion.div {...fadeUp}>
          <ChevronDown className="mx-auto h-6 w-6 text-electric animate-bounce" />
          <h2 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Your trading <br />
            <span className="text-gradient-gold">transformation</span> starts today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground md:text-lg">
            Join thousands of traders who finally turned the corner. The market doesn't wait — and
            neither should you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              style={{ background: "var(--gradient-gold)" }}
              className="group h-14 px-10 text-base font-semibold text-background glow-gold hover:opacity-90"
            >
              <a href="#mentorship">
                Join The Elite Traders Club
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            7-day money-back guarantee · Cancel anytime · Instant access
          </p>
        </motion.div>
      </div>
    </section>
  );
}
