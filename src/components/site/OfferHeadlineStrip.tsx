import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Megaphone, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  fetchOfferHeadlines,
  type OfferHeadlineRow,
  type OfferHeadlineTone,
} from "@/components/site/editableContent";

const toneClasses: Record<
  OfferHeadlineTone,
  {
    shell: string;
    icon: string;
    eyebrow: string;
    cta: string;
    glow: string;
    attentionShadow: [string, string, string];
  }
> = {
  gold: {
    shell: "border-gold/35 bg-gold/10 shadow-[0_16px_45px_-28px_hsl(var(--gold)/0.9)]",
    icon: "border-gold/35 bg-gold/15 text-gold",
    eyebrow: "text-gold",
    cta: "text-gold",
    glow: "bg-gold/25",
    attentionShadow: [
      "0 16px 45px -28px rgba(245,197,66,0.65)",
      "0 20px 60px -22px rgba(245,197,66,0.95)",
      "0 16px 45px -28px rgba(245,197,66,0.65)",
    ],
  },
  electric: {
    shell: "border-primary/35 bg-primary/10 shadow-[0_16px_45px_-28px_hsl(var(--primary)/0.9)]",
    icon: "border-primary/35 bg-primary/15 text-electric",
    eyebrow: "text-electric",
    cta: "text-electric",
    glow: "bg-primary/25",
    attentionShadow: [
      "0 16px 45px -28px rgba(14,165,233,0.65)",
      "0 20px 60px -22px rgba(14,165,233,0.95)",
      "0 16px 45px -28px rgba(14,165,233,0.65)",
    ],
  },
  bull: {
    shell: "border-bull/35 bg-bull/10 shadow-[0_16px_45px_-28px_hsl(var(--bull)/0.9)]",
    icon: "border-bull/35 bg-bull/15 text-bull",
    eyebrow: "text-bull",
    cta: "text-bull",
    glow: "bg-bull/25",
    attentionShadow: [
      "0 16px 45px -28px rgba(16,185,129,0.65)",
      "0 20px 60px -22px rgba(16,185,129,0.95)",
      "0 16px 45px -28px rgba(16,185,129,0.65)",
    ],
  },
  violet: {
    shell: "border-violet-400/35 bg-violet-500/10 shadow-[0_16px_45px_-28px_rgba(167,139,250,0.9)]",
    icon: "border-violet-300/35 bg-violet-400/15 text-violet-200",
    eyebrow: "text-violet-200",
    cta: "text-violet-200",
    glow: "bg-violet-400/25",
    attentionShadow: [
      "0 16px 45px -28px rgba(167,139,250,0.65)",
      "0 20px 60px -22px rgba(167,139,250,0.95)",
      "0 16px 45px -28px rgba(167,139,250,0.65)",
    ],
  },
};

function isInternalUrl(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

export function OfferHeadlineStrip({ hidden = false }: { hidden?: boolean }) {
  const [offers, setOffers] = useState<OfferHeadlineRow[]>([]);
  const [dismissedSlugs, setDismissedSlugs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (hidden) return;

    let mounted = true;

    fetchOfferHeadlines().then((rows) => {
      if (mounted) setOffers(rows);
    });

    return () => {
      mounted = false;
    };
  }, [hidden]);

  const visibleOffers = offers.filter((offer) => !dismissedSlugs.has(offer.slug));

  const dismissOffer = (slug: string) => {
    setDismissedSlugs((current) => {
      const next = new Set(current);
      next.add(slug);
      return next;
    });
  };

  if (hidden || !visibleOffers.length) return null;

  return (
    <div className="mx-auto mt-2 max-w-7xl px-3 md:px-4">
      <div className="grid gap-2">
        {visibleOffers.map((offer) => (
          <OfferHeadlineItem key={offer.slug} offer={offer} onDismiss={dismissOffer} />
        ))}
      </div>
    </div>
  );
}

function OfferHeadlineItem({
  offer,
  onDismiss,
}: {
  offer: OfferHeadlineRow;
  onDismiss: (slug: string) => void;
}) {
  const tone = toneClasses[offer.tone] ?? toneClasses.gold;

  const content = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border md:h-11 md:w-11 ${tone.icon}`}
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl border border-current/45"
          animate={{ opacity: [0.8, 0], scale: [1, 1.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_14px_currentColor]"
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.25, 0.85] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
        />
        <Megaphone className="relative h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] md:text-[11px] ${tone.eyebrow}`}
          >
            {offer.eyebrow}
          </span>
          <motion.span
            animate={{ rotate: [-8, 8, -8], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <Sparkles className={`h-3.5 w-3.5 ${tone.eyebrow}`} />
          </motion.span>
        </div>
        <p className="truncate text-sm font-bold text-foreground md:text-base">{offer.headline}</p>
      </div>
      <span
        className={`hidden max-w-40 shrink-0 items-center gap-1.5 truncate rounded-full border border-current/25 bg-background/35 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] xl:inline-flex ${tone.cta}`}
      >
        {offer.cta_label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.985 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: [1, 1.006, 1],
        boxShadow: tone.attentionShadow,
      }}
      transition={{
        opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`group relative h-full overflow-hidden rounded-2xl border backdrop-blur-xl transition-all hover:bg-card/70 ${tone.shell}`}
    >
      <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${tone.glow}`} />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent"
        initial={{ x: "-120%" }}
        animate={{ x: "430%" }}
        transition={{ delay: 0.45, duration: 1.25, ease: "easeOut" }}
      />
      <div className="relative flex min-w-0 items-center">
        {isInternalUrl(offer.cta_url) ? (
          <Link to={offer.cta_url} className="flex min-w-0 flex-1 px-3 py-2.5 md:px-5 md:py-3">
            {content}
          </Link>
        ) : (
          <a
            href={offer.cta_url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 px-3 py-2.5 md:px-5 md:py-3"
          >
            {content}
          </a>
        )}
        <button
          type="button"
          aria-label={`Hide offer: ${offer.headline}`}
          onClick={() => onDismiss(offer.slug)}
          className="mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/45 bg-background/35 text-muted-foreground transition-colors hover:border-foreground/35 hover:bg-background/60 hover:text-foreground md:mr-3"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
