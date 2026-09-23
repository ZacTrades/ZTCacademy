import { Link } from "@tanstack/react-router";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";
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
  }
> = {
  gold: {
    shell: "border-gold/35 bg-gold/10 shadow-[0_16px_45px_-28px_hsl(var(--gold)/0.9)]",
    icon: "border-gold/35 bg-gold/15 text-gold",
    eyebrow: "text-gold",
    cta: "text-gold",
    glow: "bg-gold/25",
  },
  electric: {
    shell: "border-primary/35 bg-primary/10 shadow-[0_16px_45px_-28px_hsl(var(--primary)/0.9)]",
    icon: "border-primary/35 bg-primary/15 text-electric",
    eyebrow: "text-electric",
    cta: "text-electric",
    glow: "bg-primary/25",
  },
  bull: {
    shell: "border-bull/35 bg-bull/10 shadow-[0_16px_45px_-28px_hsl(var(--bull)/0.9)]",
    icon: "border-bull/35 bg-bull/15 text-bull",
    eyebrow: "text-bull",
    cta: "text-bull",
    glow: "bg-bull/25",
  },
  violet: {
    shell: "border-violet-400/35 bg-violet-500/10 shadow-[0_16px_45px_-28px_rgba(167,139,250,0.9)]",
    icon: "border-violet-300/35 bg-violet-400/15 text-violet-200",
    eyebrow: "text-violet-200",
    cta: "text-violet-200",
    glow: "bg-violet-400/25",
  },
};

function isInternalUrl(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

export function OfferHeadlineStrip({ hidden = false }: { hidden?: boolean }) {
  const [offers, setOffers] = useState<OfferHeadlineRow[]>([]);

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

  if (hidden || !offers.length) return null;

  return (
    <div className="mx-auto mt-2 max-w-7xl px-3 md:px-4">
      <div className="grid gap-2 lg:grid-cols-2">
        {offers.map((offer) => (
          <OfferHeadlineItem key={offer.slug} offer={offer} />
        ))}
      </div>
    </div>
  );
}

function OfferHeadlineItem({ offer }: { offer: OfferHeadlineRow }) {
  const tone = toneClasses[offer.tone] ?? toneClasses.gold;
  const content = (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border px-3 py-2.5 backdrop-blur-xl transition-all hover:bg-card/70 md:px-5 md:py-3 ${tone.shell}`}
    >
      <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${tone.glow}`} />
      <div className="relative flex min-w-0 items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border md:h-11 md:w-11 ${tone.icon}`}
        >
          <Megaphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-[0.2em] md:text-[11px] ${tone.eyebrow}`}
            >
              {offer.eyebrow}
            </span>
            <Sparkles className={`h-3.5 w-3.5 ${tone.eyebrow}`} />
          </div>
          <p className="truncate text-sm font-bold text-foreground md:text-base">
            {offer.headline}
          </p>
        </div>
        <span
          className={`hidden max-w-40 shrink-0 items-center gap-1.5 truncate rounded-full border border-current/25 bg-background/35 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] xl:inline-flex ${tone.cta}`}
        >
          {offer.cta_label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );

  return isInternalUrl(offer.cta_url) ? (
    <Link to={offer.cta_url} className="block">
      {content}
    </Link>
  ) : (
    <a href={offer.cta_url} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}
