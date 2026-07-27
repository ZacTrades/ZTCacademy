import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  ExternalLink,
  Star,
  Shield,
  TrendingUp,
  Zap,
  Clock,
  Users,
  BarChart3,
  Crown,
  Gift,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

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
      { title: "Prop Firms — Exclusive Promo Codes | ZacTrades" },
      {
        name: "description",
        content:
          "Get exclusive promo codes and discounts on top prop trading firms. ZacTrades partners with the best funded trader programs.",
      },
      { property: "og:title", content: "Prop Firms — Exclusive Promo Codes | ZacTrades" },
      {
        property: "og:description",
        content: "Get exclusive promo codes and discounts on top prop trading firms.",
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

function PropFirmsPage() {
  const [propFirms, setPropFirms] = useState<PropFirmRow[]>(defaultPropFirms);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              Exclusive Partnerships
            </Badge>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Funded with <span className="text-gradient">Better Terms.</span>
              <br />
              <span className="text-gradient-gold">Lower Costs.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              We have negotiated exclusive promo codes with the world&apos;s top prop trading firms.
              Pass your evaluation cheaper — keep more of your profits.
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
                <span>Up to 50% off</span>
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
              Featured <span className="text-gradient">Partners</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Our highest-recommended firms with the best trader outcomes.
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
              Compare every partner and grab your exclusive discount code.
            </p>
          </motion.div>

          <div className="space-y-4">
            {propFirms.map((firm, i) => (
              <motion.div
                key={firm.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              >
                <FirmRow firm={firm} />
              </motion.div>
            ))}
          </div>
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
                desc: "Enter your exclusive ZacTrades promo code at checkout to unlock instant savings.",
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

      {/* Trust Banner */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            {...fadeUp}
            className="glass-strong relative overflow-hidden rounded-3xl p-8 md:p-12 text-center"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Ready to get <span className="text-gradient">funded?</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Join thousands of ZacTrades members who passed their evaluations faster and cheaper
                using our exclusive codes.
              </p>
              <Button
                size="lg"
                className="mt-8 glow-primary text-primary-foreground hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
                asChild
              >
                <Link to="/">
                  Back to Homepage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeaturedCard({ firm }: { firm: PropFirmRow }) {
  return (
    <div className="glass-strong group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40">
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: firm.color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className="grid h-14 w-14 place-items-center rounded-xl font-display text-xl font-bold text-white"
            style={{ backgroundColor: firm.color }}
          >
            {firm.logo}
          </div>
          <Badge
            className="border-0 font-semibold"
            style={{
              background: `color-mix(in oklab, ${firm.color} 20%, transparent)`,
              color: firm.color,
            }}
          >
            <Zap className="mr-1 h-3 w-3" />
            {firm.discount}
          </Badge>
        </div>

        <h3 className="mt-4 font-display text-xl font-bold">{firm.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{firm.description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniInfo label="Max" value={firm.max_capital} />
          <MiniInfo label="Split" value={firm.profit_split} />
          <MiniInfo label="Payout" value={firm.payout} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {firm.features.slice(0, 2).map((f) => (
            <Badge key={f} variant="outline" className="text-[10px]">
              {f}
            </Badge>
          ))}
          {firm.features.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{firm.features.length - 2}
            </Badge>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-background/60 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Code</div>
            <div className="font-mono text-sm font-bold text-gold">{firm.promo_code}</div>
          </div>
          <Button
            size="sm"
            className="flex-1 text-primary-foreground hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
            onClick={() => window.open(firm.url, "_blank")}
          >
            Access Platform
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FirmRow({ firm }: { firm: PropFirmRow }) {
  return (
    <div className="glass group flex flex-col gap-4 rounded-2xl p-5 transition-all hover:border-primary/30 md:flex-row md:items-center md:gap-6">
      <div className="flex items-center gap-4 md:w-64">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-base font-bold text-white"
          style={{ backgroundColor: firm.color }}
        >
          {firm.logo}
        </div>
        <div>
          <h3 className="font-display text-base font-bold">{firm.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="text-foreground font-medium">{firm.rating}</span>
            <span>({firm.reviews.toLocaleString()} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 text-center md:grid-cols-3">
        <StatPill icon={BarChart3} label="Max Capital" value={firm.max_capital} />
        <StatPill icon={Crown} label="Profit Split" value={firm.profit_split} />
        <StatPill icon={Clock} label="Payout" value={firm.payout} />
      </div>

      <div className="flex items-center gap-3 md:w-auto">
        <div className="flex-1 rounded-lg bg-background/60 px-3 py-2 text-center md:flex-none">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Promo Code
          </div>
          <div className="font-mono text-sm font-bold text-gold">{firm.promo_code}</div>
        </div>
        <Badge
          className="border-0 font-semibold whitespace-nowrap"
          style={{
            background: `color-mix(in oklab, ${firm.color} 20%, transparent)`,
            color: firm.color,
          }}
        >
          {firm.discount}
        </Badge>
        <Button
          size="sm"
          className="shrink-0 text-primary-foreground hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
          onClick={() => window.open(firm.url, "_blank")}
        >
          Access
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
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

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-background/40 px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
