import { supabase } from "@/lib/supabase";

export type IndicatorRow = {
  slug: string;
  name: string;
  description: string;
  tag: string;
  stats_label: string;
  tradingview_url: string;
  video_url?: string | null;
  is_active: boolean;
  display_order: number;
};

export type TradingToolRow = {
  slug: string;
  name: string;
  category: string;
  description: string;
  promo_code: string;
  discount: string;
  url: string;
  logo_url?: string | null;
  highlights: string[];
  is_active: boolean;
  display_order: number;
};

export type PropFirmRow = {
  slug: string;
  name: string;
  description: string;
  logo: string;
  logo_url?: string | null;
  discount: string;
  promo_code: string;
  color: string;
  rating: number;
  reviews: number;
  max_capital: string;
  profit_split: string;
  payout: string;
  features: string[];
  url: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
};

export type CommunitySocialRow = {
  slug: string;
  name: string;
  handle: string;
  description: string;
  icon_key: string;
  url: string;
  tone_key: string;
  is_active: boolean;
  display_order: number;
};

export type OfferHeadlineTone = "gold" | "electric" | "bull" | "violet";

export type OfferHeadlineRow = {
  slug: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  cta_label: string;
  cta_url: string;
  tone: OfferHeadlineTone;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  display_order: number;
};

export const defaultIndicators: IndicatorRow[] = [
  {
    slug: "zac_trend_pro",
    name: "ZTC SESSION",
    description: "Multi-timeframe trend confirmation with smart filter.",
    tag: "Pro",
    stats_label: "",
    tradingview_url:
      "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BEMA%2CSTD%3BVWAP",
    is_active: true,
    display_order: 1,
  },
  {
    slug: "liquidity_sweep",
    name: "Liquidity Sweep",
    description: "Detects institutional stop hunts before reversals.",
    tag: "Pro",
    stats_label: "",
    tradingview_url:
      "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BVolume%2CSTD%3BVWAP",
    is_active: true,
    display_order: 2,
  },
  {
    slug: "smart_entry_ai",
    name: "Smart Entry AI",
    description: "AI-scored entries with risk/reward auto-calc.",
    tag: "Pro",
    stats_label: "",
    tradingview_url:
      "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BMACD%2CSTD%3BRSI",
    is_active: true,
    display_order: 3,
  },
];

export const defaultTradingTools: TradingToolRow[] = [
  {
    slug: "fxreplay",
    name: "FX Replay",
    category: "Backtesting",
    description: "Replay market sessions, test setups, and build confidence before trading live.",
    promo_code: "ZACTRADES",
    discount: "Partner link",
    url: "https://fxreplay.com/?via=ZACTRADES",
    logo_url: null,
    highlights: ["Market replay", "Backtesting", "Strategy practice"],
    is_active: true,
    display_order: 1,
  },
  {
    slug: "tradesyncer",
    name: "TradeSyncer",
    category: "Trading Journal",
    description:
      "Sync trades, review performance, and understand your execution with clean analytics.",
    promo_code: "TS2537E28A",
    discount: "Referral access",
    url: "https://app.tradesyncer.com/?ref=TS2537E28A",
    logo_url: null,
    highlights: ["Trade journal", "Performance analytics", "Execution review"],
    is_active: true,
    display_order: 2,
  },
  {
    slug: "tradingview",
    name: "TradingView",
    category: "Charting",
    description: "Professional charting, alerts, watchlists, and multi-timeframe market analysis.",
    promo_code: "Zac_Hr",
    discount: "Official pricing",
    url: "https://www.tradingview.com/pricing/?share_your_love=Zac_Hr",
    logo_url: null,
    highlights: ["Advanced charts", "Alerts", "Watchlists"],
    is_active: true,
    display_order: 3,
  },
];

const curatedTradingToolUrls = new Map(defaultTradingTools.map((tool) => [tool.slug, tool.url]));

function mergeCuratedTradingTools(data: TradingToolRow[] | null | undefined) {
  const rowsBySlug = new Map((data ?? []).map((tool) => [tool.slug, tool]));
  const curatedSlugs = new Set(defaultTradingTools.map((tool) => tool.slug));
  const customRows = (data ?? []).filter((tool) => !curatedSlugs.has(tool.slug));

  return [
    ...defaultTradingTools.map((fallback) => {
      const stored = rowsBySlug.get(fallback.slug);

      if (!stored) return fallback;

      return {
        ...fallback,
        ...stored,
        url: curatedTradingToolUrls.get(fallback.slug) ?? fallback.url,
        display_order: fallback.display_order,
      };
    }),
    ...customRows,
  ].sort((first, second) => first.display_order - second.display_order);
}

export const defaultPropFirms: PropFirmRow[] = [
  {
    slug: "alpha-futures",
    name: "Alpha Futures",
    description: "Futures funding platform for traders who want structured evaluation access.",
    logo: "AF",
    logo_url: null,
    discount: "Max Discount",
    promo_code: "ZACTRADES",
    color: "#22c55e",
    rating: 4.4,
    reviews: 3200,
    max_capital: "$150K",
    profit_split: "90%",
    payout: "Bi-weekly",
    features: ["TV", "Web"],
    url: "https://app.alpha-futures.com",
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    slug: "earn2trade",
    name: "Earn2Trade",
    description: "Education-first futures evaluation platform with structured trader development.",
    logo: "E2T",
    logo_url: null,
    discount: "Max Discount",
    promo_code: "ZACTRADES",
    color: "#38bdf8",
    rating: 4.4,
    reviews: 4100,
    max_capital: "$200K",
    profit_split: "80%",
    payout: "Monthly",
    features: ["TV", "Web"],
    url: "https://www.earn2trade.com",
    is_featured: true,
    is_active: true,
    display_order: 2,
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    description: "Multi-asset prop firm with flexible challenges and a modern trader dashboard.",
    logo: "FN",
    logo_url: null,
    discount: "Max Discount",
    promo_code: "ZACTRADES",
    color: "#ec4899",
    rating: 4.3,
    reviews: 6700,
    max_capital: "$200K",
    profit_split: "95%",
    payout: "Bi-weekly",
    features: ["MT5", "App", "Web"],
    url: "https://app.fundednext.com",
    is_featured: true,
    is_active: true,
    display_order: 3,
  },
  {
    slug: "alpha-capital-group",
    name: "Alpha Capital Group",
    description:
      "Professional prop trading firm with challenge accounts and scaling opportunities.",
    logo: "ACG",
    logo_url: null,
    discount: "Max Discount",
    promo_code: "ZACTRADES",
    color: "#a855f7",
    rating: 4.4,
    reviews: 2800,
    max_capital: "$200K",
    profit_split: "80%",
    payout: "Bi-weekly",
    features: ["MT5", "Web"],
    url: "https://app.alphacapitalgroup.uk",
    is_featured: false,
    is_active: true,
    display_order: 4,
  },
  {
    slug: "funding-pips",
    name: "Funding Pips",
    description: "Popular prop firm for forex traders with flexible rules and fast account access.",
    logo: "FP",
    logo_url: null,
    discount: "Max Discount",
    promo_code: "ZACTRADES",
    color: "#f59e0b",
    rating: 4.2,
    reviews: 5200,
    max_capital: "$100K",
    profit_split: "80%",
    payout: "Bi-weekly",
    features: ["MT5", "Web"],
    url: "https://app.fundingpips.com",
    is_featured: false,
    is_active: true,
    display_order: 5,
  },
];

export const defaultCommunitySocials: CommunitySocialRow[] = [
  {
    slug: "youtube",
    name: "YouTube",
    handle: "@ZacTrades",
    description: "Watch market breakdowns, trading lessons, and live-room recaps.",
    icon_key: "youtube",
    url: "https://www.youtube.com",
    tone_key: "bear",
    is_active: true,
    display_order: 1,
  },
  {
    slug: "instagram",
    name: "Instagram",
    handle: "@apextraders",
    description: "Follow trade ideas, member wins, and behind-the-scenes updates.",
    icon_key: "instagram",
    url: "https://www.instagram.com",
    tone_key: "gold",
    is_active: true,
    display_order: 2,
  },
  {
    slug: "tiktok",
    name: "TikTok",
    handle: "@apextraders",
    description: "Short trading tips, quick lessons, and psychology reminders.",
    icon_key: "music",
    url: "https://www.tiktok.com",
    tone_key: "primary",
    is_active: true,
    display_order: 3,
  },
  {
    slug: "discord",
    name: "Discord",
    handle: "ZacTrades Community",
    description: "Join the private community for chat, questions, and trader support.",
    icon_key: "message",
    url: "https://discord.gg/sJ8jC3n2H3",
    tone_key: "bull",
    is_active: true,
    display_order: 4,
  },
];

export const defaultOfferHeadlines: OfferHeadlineRow[] = [
  {
    slug: "live-room-launch",
    eyebrow: "Live Trading Access",
    headline: "Join the next live room cycle before seats reset.",
    subheadline: "Premium access, Discord role, and structured live-market sessions.",
    cta_label: "Get access",
    cta_url: "/live-trading",
    tone: "gold",
    is_active: true,
    starts_at: null,
    expires_at: null,
    display_order: 1,
  },
];

const curatedPropFirmUrls = new Map(defaultPropFirms.map((firm) => [firm.slug, firm.url]));

function mergeCuratedPropFirms(data: PropFirmRow[] | null | undefined) {
  const rowsBySlug = new Map((data ?? []).map((firm) => [firm.slug, firm]));
  const curatedSlugs = new Set(defaultPropFirms.map((firm) => firm.slug));
  const customRows = (data ?? []).filter((firm) => !curatedSlugs.has(firm.slug));

  return [
    ...defaultPropFirms.map((fallback) => {
      const stored = rowsBySlug.get(fallback.slug);

      if (!stored) return fallback;

      return {
        ...fallback,
        ...stored,
        url: curatedPropFirmUrls.get(fallback.slug) ?? fallback.url,
        display_order: fallback.display_order,
      };
    }),
    ...customRows,
  ].sort((first, second) => first.display_order - second.display_order);
}

export async function fetchIndicators() {
  if (!supabase) return defaultIndicators;

  const { data, error } = await supabase
    .from("premium_indicators")
    .select(
      "slug,name,description,tag,stats_label,tradingview_url,video_url,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultIndicators;
  }

  return data?.length ? (data as IndicatorRow[]) : defaultIndicators;
}

export async function fetchTradingTools() {
  if (!supabase) return defaultTradingTools;

  const { data, error } = await supabase
    .from("trading_tools")
    .select(
      "slug,name,category,description,promo_code,discount,url,logo_url,highlights,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultTradingTools;
  }

  return mergeCuratedTradingTools(data as TradingToolRow[] | null);
}

export async function fetchPropFirms() {
  if (!supabase) return defaultPropFirms;

  const { data, error } = await supabase
    .from("prop_firms")
    .select(
      "slug,name,description,logo,logo_url,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultPropFirms;
  }

  return mergeCuratedPropFirms(data as PropFirmRow[] | null);
}

export async function fetchCommunitySocials() {
  if (!supabase) return defaultCommunitySocials;

  const { data, error } = await supabase
    .from("community_socials")
    .select("slug,name,handle,description,icon_key,url,tone_key,is_active,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultCommunitySocials;
  }

  return data?.length ? (data as CommunitySocialRow[]) : defaultCommunitySocials;
}

export async function fetchOfferHeadlines() {
  if (!supabase) return defaultOfferHeadlines;

  const { data, error } = await supabase
    .from("offer_headlines")
    .select(
      "slug,eyebrow,headline,subheadline,cta_label,cta_url,tone,is_active,starts_at,expires_at,display_order",
    )
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data as OfferHeadlineRow[] | null) ?? [];
}
