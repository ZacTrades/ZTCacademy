import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BadgePercent,
  Copy,
  ExternalLink,
  Gift,
  Search,
  Shield,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  defaultPropFirms,
  fetchPropFirms,
  type PropFirmRow,
} from "@/components/site/editableContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/propfirms")({
  head: () => ({
    meta: [
      { title: "Prop Firms — Max Discount Partners | ZacTrades" },
      {
        name: "description",
        content: "Get ZacTrades partner codes and max discount access on top prop trading firms.",
      },
      { property: "og:title", content: "Prop Firms — Max Discount Partners | ZacTrades" },
      {
        property: "og:description",
        content: "Get ZacTrades partner codes and max discount access on top prop trading firms.",
      },
    ],
  }),
  component: PropFirmsPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const originOverrides: Record<string, { flag: string; label: string }> = {
  "alpha-futures": { flag: "🌐", label: "Global" },
  earn2trade: { flag: "🇺🇸", label: "US" },
  fundednext: { flag: "🇦🇪", label: "UAE" },
  "alpha-capital-group": { flag: "🇬🇧", label: "UK" },
  "funding-pips": { flag: "🌐", label: "Global" },
};

function getFirmOrigin(firm: PropFirmRow) {
  return originOverrides[firm.slug] ?? { flag: "🌐", label: "Global" };
}

function getAssetLabel(firm: PropFirmRow) {
  const searchable = [firm.name, firm.description, ...firm.features].join(" ").toLowerCase();

  if (searchable.includes("crypto")) return "Crypto";
  if (searchable.includes("futures") || searchable.includes("nq") || searchable.includes("es")) {
    return "Futures";
  }
  if (
    searchable.includes("forex") ||
    searchable.includes("mt5") ||
    searchable.includes("spreads")
  ) {
    return "Forex";
  }

  return "Multi-asset";
}

function getPlatformLabels(firm: PropFirmRow) {
  const labels = firm.features.map((feature) => feature.trim()).filter(Boolean);

  return labels.length ? labels.slice(0, 3) : ["Web"];
}

function getMaxDiscountLabel(firm: PropFirmRow) {
  const percent = firm.discount.match(/(\d+(?:\.\d+)?)\s*%/)?.[1];
  return percent ? "MAX DISCOUNT " + percent + "%" : "MAX DISCOUNT";
}

function FirmLogo({
  firm,
  className = "",
  imageClassName = "p-2",
}: {
  firm: PropFirmRow;
  className?: string;
  imageClassName?: string;
}) {
  const logoUrl = firm.logo_url?.trim();

  return (
    <div
      className={className}
      style={{ boxShadow: `0 0 28px color-mix(in oklab, ${firm.color} 34%, transparent)` }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${firm.name} logo`}
          className={`h-full w-full rounded-[inherit] object-contain ${imageClassName}`}
          loading="lazy"
        />
      ) : (
        <span style={{ color: firm.color }}>{firm.logo}</span>
      )}
    </div>
  );
}

function PropFirmsPage() {
  const [propFirms, setPropFirms] = useState<PropFirmRow[]>(defaultPropFirms);
  const [searchTerm, setSearchTerm] = useState("");
  const [capitalFilter, setCapitalFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    fetchPropFirms().then((items) => {
      if (mounted) {
        setPropFirms(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const capitalOptions = useMemo(
    () => Array.from(new Set(propFirms.map((firm) => firm.max_capital).filter(Boolean))),
    [propFirms],
  );

  const filteredPropFirms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return propFirms.filter((firm) => {
      const matchesSearch =
        !query ||
        [
          firm.name,
          firm.description,
          firm.promo_code,
          firm.discount,
          firm.max_capital,
          firm.profit_split,
          firm.payout,
          getFirmOrigin(firm).label,
          getAssetLabel(firm),
          ...getPlatformLabels(firm),
          ...firm.features,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCapital = capitalFilter === "all" || firm.max_capital === capitalFilter;

      return matchesSearch && matchesCapital;
    });
  }, [capitalFilter, propFirms, searchTerm]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/70 to-background" />

        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="glass mb-6 gap-2 border-primary/30 px-4 py-1.5 text-xs font-medium"
            >
              <Gift className="h-3.5 w-3.5 text-gold" />
              Prop Firm Discounts
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
              The Best Trusted  <span className="text-gradient">PropFirms with</span>
              <br />
              <span className="text-gradient-gold">Max Discount.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              I've secured discount codes for the ZTC community with the best propfirms, so you can get a better price when signing up.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-accent" />
                <span>Verified partners</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span>4.7/5 average rating</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BadgePercent className="h-4 w-4 text-bull" />
                <span>Max Discount</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Firms */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Featured <span className="text-gradient">Prop Firms</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              My selection of trusted firms, with exclusive ZACTRADES discounts.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {propFirms
              .filter((f) => f.is_featured)
              .map((firm, i) => (
                <motion.div
                  key={firm.name}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                >
                  <FeaturedCard firm={firm} />
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* All Firms Table */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              All <span className="text-gradient-gold">Prop Firms</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Compare every partner and grab the best available ZacTrades discount code.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-h-14 flex-1 items-center overflow-hidden rounded-2xl border border-primary/20 bg-background/80 shadow-[0_0_28px_rgba(168,85,247,0.10)] lg:max-w-xl">
              <div className="grid h-14 w-14 shrink-0 place-items-center text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search firms, codes, payouts, capital..."
                className="h-14 min-w-0 flex-1 bg-transparent pr-4 text-sm outline-none placeholder:text-muted-foreground/70"
              />
              <button
                type="button"
                className="hidden h-8 items-center gap-2 border-l border-border/60 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
              <div className="rounded-2xl border border-primary/25 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_0_24px_rgba(168,85,247,0.10)]">
                All Partners
              </div>
              <select
                value={capitalFilter}
                onChange={(event) => setCapitalFilter(event.target.value)}
                className="h-12 rounded-2xl border border-primary/25 bg-background/80 px-4 text-sm font-semibold text-foreground outline-none shadow-[0_0_24px_rgba(168,85,247,0.10)]"
              >
                <option value="all">All capital</option>
                {capitalOptions.map((capital) => (
                  <option key={capital} value={capital}>
                    {capital}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-7 space-y-4 lg:hidden">
            {filteredPropFirms.map((firm, i) => (
              <motion.div
                key={firm.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              >
                <MobileFirmCard firm={firm} index={i} />
              </motion.div>
            ))}
          </div>

          <div className="mt-7 hidden overflow-x-auto pb-2 lg:block">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[2.25fr_1fr_1.35fr_1fr_1.15fr_1.2fr] gap-5 px-6 pb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                <span>Firm</span>
                <span>Max Allocations</span>
                <span>Platforms</span>
                <span>Payouts</span>
                <span>Discount Code</span>
                <span className="text-right">Action</span>
              </div>

              <div className="space-y-3">
                {filteredPropFirms.map((firm, i) => (
                  <motion.div
                    key={firm.slug}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                  >
                    <FirmRow firm={firm} index={i} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {filteredPropFirms.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
              No prop firms match your search yet.
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              How <span className="text-gradient">It Works</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Three simple steps to get funded at a discount.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BadgePercent,
                step: "01",
                title: "Choose a Firm",
                desc: "Browse our vetted list of prop firms and pick the one that matches your trading style.",
              },
              {
                icon: Gift,
                step: "02",
                title: "Apply Promo Code",
                desc: "Enter your ZacTrades promo code at checkout to unlock instant savings.",
              },
              {
                icon: TrendingUp,
                step: "03",
                title: "Start Trading",
                desc: "Pass the evaluation, get funded, and trade with real capital while keeping up to 100% profits.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="glass relative rounded-2xl p-8 text-center"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </div>
                <div className="mx-auto mt-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeaturedCard({ firm }: { firm: PropFirmRow }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(firm.promo_code);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass-strong group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40">
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: firm.color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <FirmLogo
            firm={firm}
            className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] font-display text-xl font-bold text-white"
          />
          <Badge
            className="border-0 font-semibold"
            style={{
              background: `color-mix(in oklab, ${firm.color} 20%, transparent)`,
              color: firm.color,
            }}
          >
            <Zap className="mr-1 h-3 w-3" />
            {getMaxDiscountLabel(firm)}
          </Badge>
        </div>

        <h3 className="mt-4 font-display text-xl font-bold">{firm.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{firm.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniInfo label="Max" value={firm.max_capital} />
          <MiniInfo label="Payout" value={firm.payout} />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={copyCode}
            className="group/code relative inline-flex h-10 flex-1 min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-sky-400/25 bg-slate-950/70 px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_18px_rgba(14,165,233,0.10)] transition-all hover:-translate-y-0.5 hover:border-gold/55 hover:bg-slate-900/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_22px_rgba(245,158,11,0.16)]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 via-primary to-gold opacity-80" />
            <span className="flex min-w-0 flex-col pl-1 leading-none">
              <span className="text-[7px] font-black uppercase tracking-[0.18em] text-gold/90">
                Max Discount
              </span>
              <span className={`mt-1 truncate font-mono text-xs font-black transition-colors ${copied ? "text-bull" : "text-foreground"}`}>
                {copied ? "Copied" : firm.promo_code}
              </span>
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300 transition-all group-hover/code:border-gold/45 group-hover/code:bg-gold/10 group-hover/code:text-gold">
              <Copy className={`h-3 w-3 transition-transform group-hover/code:scale-110 ${copied ? "text-bull" : ""}`} />
            </span>
          </button>
          <Button
            size="sm"
            className="flex-1 text-primary-foreground hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
            onClick={() => window.open(firm.url, "_blank")}
          >
            Get Funded
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <span className="flex items-center gap-0.5" aria-label={`${normalizedRating.toFixed(1)} out of 5 rating`}>
      {Array.from({ length: 5 }).map((_, starIndex) => {
        const fillPercent = Math.max(0, Math.min(100, (normalizedRating - starIndex) * 100));

        return (
          <span key={starIndex} className="relative grid h-3.5 w-3.5 place-items-center">
            <Star className="h-3.5 w-3.5 fill-muted/25 text-muted/40" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
              aria-hidden="true"
            >
              <Star className="h-3.5 w-3.5 fill-bull text-bull" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function MobileFirmCard({ firm, index }: { firm: PropFirmRow; index: number }) {
  const highlighted = firm.is_featured || index === 1;
  const origin = getFirmOrigin(firm);
  const platforms = getPlatformLabels(firm);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(firm.promo_code);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-4 transition-all ${
        highlighted
          ? "border-primary/35 bg-primary/[0.045] shadow-[0_0_32px_rgba(168,85,247,0.16)]"
          : "border-border/55 bg-background/65"
      }`}
    >
      <div
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: firm.color }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <FirmLogo
            firm={firm}
            className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] font-display text-base font-bold text-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-bold text-foreground">
                  {firm.name}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="text-base leading-none">{origin.flag}</span>
                  <span>{origin.label}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 gap-1 rounded-full border-bull/35 bg-bull/10 font-mono text-[10px] font-black uppercase tracking-wide text-bull"
              >
                <TrendingUp className="h-3 w-3" />
                {getMaxDiscountLabel(firm)}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RatingStars rating={firm.rating} />
              <span className="font-mono text-xs font-semibold text-foreground">
                {firm.rating.toFixed(1)}/5
              </span>
              <span className="text-xs text-muted-foreground">
                {firm.reviews.toLocaleString()} reviews
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-background/55 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Payouts
            </div>
            <div className="mt-2 font-mono text-xl font-black leading-none text-bull">
              {firm.payout}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/55 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Platforms
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="grid h-5 min-w-7 place-items-center rounded-md border border-border/60 bg-background/70 px-1.5 font-mono text-[10px] font-bold text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 font-mono text-sm font-bold text-foreground transition-colors hover:bg-primary/20"
          >
            <span className="truncate">{copied ? "Copied" : firm.promo_code}</span>
            <Copy className={`h-3.5 w-3.5 shrink-0 transition-colors ${copied ? "text-bull" : "text-primary"}`} />
          </button>
          <Button
            size="sm"
            className="h-12 rounded-2xl px-5 font-bold text-primary-foreground shadow-[0_0_24px_rgba(0,149,255,0.20)] hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
            onClick={() => window.open(firm.url, "_blank")}
          >
            Get Funded
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
function FirmRow({ firm, index }: { firm: PropFirmRow; index: number }) {
  const highlighted = firm.is_featured || index === 1;
  const platforms = getPlatformLabels(firm);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(firm.promo_code);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`group grid grid-cols-[2.25fr_1fr_1.35fr_1fr_1.15fr_1.2fr] items-center gap-5 rounded-2xl border px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.035] ${
        highlighted
          ? "border-primary/35 bg-primary/[0.045] shadow-[0_0_36px_rgba(168,85,247,0.14)]"
          : "border-border/55 bg-background/55"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <FirmLogo
          firm={firm}
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] font-display text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold text-foreground">{firm.name}</h3>
          <div className="mt-2 flex items-center gap-2">
<RatingStars rating={firm.rating} />
            <span className="font-mono text-xs font-semibold text-foreground">
              {firm.rating.toFixed(1)}/5
            </span>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-mono text-2xl font-black leading-none text-foreground">
          {firm.max_capital}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="grid h-5 min-w-7 place-items-center rounded-md border border-border/60 bg-background/70 px-1.5 font-mono text-[10px] font-bold text-muted-foreground"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="font-mono text-xl font-black leading-none text-bull drop-shadow-[0_0_10px_rgba(16,185,129,0.20)]">
          {firm.payout}
        </div>
      </div>

      <button
        type="button"
        onClick={copyCode}
        className="group/code relative inline-flex min-h-12 min-w-36 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-sky-400/25 bg-slate-950/70 px-3.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_20px_rgba(14,165,233,0.10)] transition-all hover:-translate-y-0.5 hover:border-gold/55 hover:bg-slate-900/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(245,158,11,0.16)]"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 via-primary to-gold opacity-80" />
        <span className="flex min-w-0 flex-col pl-1 leading-none">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gold/90">
            Max Discount
          </span>
          <span className={`mt-1.5 truncate font-mono text-sm font-black transition-colors ${copied ? "text-bull" : "text-foreground"}`}>
            {copied ? "Copied" : firm.promo_code}
          </span>
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300 transition-all group-hover/code:border-gold/45 group-hover/code:bg-gold/10 group-hover/code:text-gold">
          <Copy className={`h-3.5 w-3.5 transition-transform group-hover/code:scale-110 ${copied ? "text-bull" : ""}`} />
        </span>
      </button>

      <div className="flex justify-self-end">
        <Button
          size="sm"
          className="h-12 min-w-36 rounded-xl px-6 font-bold text-primary-foreground shadow-[0_0_24px_rgba(0,149,255,0.20)] hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
          onClick={() => window.open(firm.url, "_blank")}
        >
          Get Funded
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
