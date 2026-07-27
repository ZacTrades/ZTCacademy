import { supabase } from "@/lib/supabase";

export type IndicatorRow = {
  slug: string;
  name: string;
  description: string;
  tag: string;
  stats_label: string;
  tradingview_url: string;
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
  highlights: string[];
  is_active: boolean;
  display_order: number;
};

export type BlogPostRow = {
  slug: string;
  title: string;
  category: string;
  published_date: string;
  read_time: string;
  excerpt: string;
  content: string;
  pdf_url?: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
};

export type PropFirmRow = {
  slug: string;
  name: string;
  description: string;
  logo: string;
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

export const defaultIndicators: IndicatorRow[] = [
  {
    slug: "zac_trend_pro",
    name: "Zac Trend Pro",
    description: "Multi-timeframe trend confirmation with smart filter.",
    tag: "Most Popular",
    stats_label: "Win 72% · 1.8R avg",
    tradingview_url:
      "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BEMA%2CSTD%3BVWAP",
    is_active: true,
    display_order: 1,
  },
  {
    slug: "liquidity_sweep",
    name: "Liquidity Sweep",
    description: "Detects institutional stop hunts before reversals.",
    tag: "New",
    stats_label: "Win 72% · 1.8R avg",
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
    stats_label: "Win 72% · 1.8R avg",
    tradingview_url:
      "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BMACD%2CSTD%3BRSI",
    is_active: true,
    display_order: 3,
  },
];

export const defaultTradingTools: TradingToolRow[] = [
  {
    slug: "tradingview",
    name: "TradingView",
    category: "Charting",
    description: "My main charting workspace for multi-timeframe analysis, alerts, and watchlists.",
    promo_code: "ZACTV10",
    discount: "10% off",
    url: "https://www.tradingview.com",
    highlights: ["Advanced charts", "Alerts", "Watchlists"],
    is_active: true,
    display_order: 1,
  },
  {
    slug: "notion",
    name: "Notion",
    category: "Trading Journal",
    description:
      "A clean place to organize trade plans, journal notes, screenshots, and weekly reviews.",
    promo_code: "ZACNOTION",
    discount: "Free template",
    url: "https://www.notion.so",
    highlights: ["Trade journal", "Review pages", "Playbooks"],
    is_active: true,
    display_order: 2,
  },
  {
    slug: "forex_factory",
    name: "Forex Factory",
    category: "News Calendar",
    description: "Useful for checking high-impact economic events before entering a trade.",
    promo_code: "ZACNEWS",
    discount: "Member setup",
    url: "https://www.forexfactory.com/calendar",
    highlights: ["Economic news", "Impact filters", "Session planning"],
    is_active: true,
    display_order: 3,
  },
  {
    slug: "myfxbook",
    name: "Myfxbook",
    category: "Performance Tracking",
    description: "Track account performance, drawdown, win rate, and trading statistics.",
    promo_code: "ZACTRACK",
    discount: "Tracker setup",
    url: "https://www.myfxbook.com",
    highlights: ["Analytics", "Drawdown", "Account stats"],
    is_active: true,
    display_order: 4,
  },
  {
    slug: "edgewonk",
    name: "Edgewonk",
    category: "Deep Journaling",
    description:
      "A more advanced journal for tracking psychology, setups, mistakes, and improvement.",
    promo_code: "ZACEDGE",
    discount: "15% off",
    url: "https://edgewonk.com",
    highlights: ["Mistake tracking", "Trade tags", "Review dashboard"],
    is_active: true,
    display_order: 5,
  },
  {
    slug: "trendspider",
    name: "TrendSpider",
    category: "Market Scanning",
    description: "Helpful for scanning markets, automated trendlines, and technical alerts.",
    promo_code: "ZACTREND",
    discount: "Trial bonus",
    url: "https://trendspider.com",
    highlights: ["Scanners", "Alerts", "Technical research"],
    is_active: true,
    display_order: 6,
  },
];

export const defaultBlogPosts: BlogPostRow[] = [
  {
    slug: "build-trading-plan-before-market-open",
    title: "How to build a trading plan before the market opens",
    category: "Trading Process",
    published_date: "May 27, 2026",
    read_time: "6 min read",
    excerpt:
      "A practical pre-market routine for defining bias, levels, invalidation, risk, and the one or two setups worth waiting for.",
    content:
      "Start with higher-timeframe context, mark the key levels that would change your bias, define risk before entry, and write down exactly what would make you skip the session.",
    pdf_url: null,
    is_featured: true,
    is_published: true,
    display_order: 1,
  },
  {
    slug: "risk-rules-every-beginner-should-write-down",
    title: "The risk rules every beginner should write down",
    category: "Risk Management",
    published_date: "May 20, 2026",
    read_time: "5 min read",
    excerpt:
      "Simple limits for daily loss, position sizing, and max trades so one bad session does not become a damaged account.",
    content:
      "Risk rules should be visible before the first trade. Define max daily loss, risk per trade, max trades, and the exact point where the session ends.",
    pdf_url: null,
    is_featured: false,
    is_published: true,
    display_order: 2,
  },
  {
    slug: "journaling-beats-hunting-for-another-indicator",
    title: "Why journaling beats hunting for another indicator",
    category: "Study",
    published_date: "May 13, 2026",
    read_time: "4 min read",
    excerpt:
      "The fastest way to identify recurring mistakes is to review screenshots, emotions, timing, and execution quality.",
    content:
      "A journal turns vague frustration into evidence. Track setup quality, execution, emotion, and whether the trade matched your plan.",
    pdf_url: null,
    is_featured: false,
    is_published: true,
    display_order: 3,
  },
  {
    slug: "reading-market-structure-without-forcing-trades",
    title: "Reading market structure without forcing trades",
    category: "Market Notes",
    published_date: "May 6, 2026",
    read_time: "7 min read",
    excerpt:
      "A cleaner way to mark highs, lows, liquidity, and trend context before deciding whether a setup is actually present.",
    content:
      "Market structure is useful only when it reduces decisions. Mark clear swing points, identify liquidity, then wait for confirmation instead of inventing a trade.",
    pdf_url: null,
    is_featured: false,
    is_published: true,
    display_order: 4,
  },
];

export const defaultPropFirms: PropFirmRow[] = [
  {
    slug: "ftmo",
    name: "FTMO",
    description:
      "The industry leader in prop trading. Two-step evaluation with up to $400K accounts.",
    logo: "FTMO",
    discount: "10% OFF",
    promo_code: "ZAC10",
    color: "#00d084",
    rating: 4.9,
    reviews: 12400,
    max_capital: "$400K",
    profit_split: "90%",
    payout: "Bi-weekly",
    features: ["Two-step evaluation", "No time limit", "Free retry", "Mobile app"],
    url: "https://ftmo.com",
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    slug: "the5ers",
    name: "The5ers",
    description: "Instant funding available. Trade from day one with no evaluation period.",
    logo: "5ERS",
    discount: "20% OFF",
    promo_code: "ZAC20",
    color: "#f59e0b",
    rating: 4.8,
    reviews: 8900,
    max_capital: "$250K",
    profit_split: "80%",
    payout: "Instant",
    features: ["Instant funding", "Weekly payouts", "Low spreads", "News trading"],
    url: "https://the5ers.com",
    is_featured: true,
    is_active: true,
    display_order: 2,
  },
  {
    slug: "myforexfunds",
    name: "MyForexFunds",
    description: "Flexible account sizes from $10K to $300K with rapid evaluation.",
    logo: "MFF",
    discount: "15% OFF",
    promo_code: "ZAC15",
    color: "#6366f1",
    rating: 4.7,
    reviews: 10200,
    max_capital: "$300K",
    profit_split: "85%",
    payout: "Weekly",
    features: ["Rapid evaluation", "Scaling plan", "No minimum trading days", "Crypto payouts"],
    url: "https://myforexfunds.com",
    is_featured: false,
    is_active: true,
    display_order: 3,
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    description: "Industry-first profit sharing from day one with the Stellar Challenge.",
    logo: "FN",
    discount: "10% OFF",
    promo_code: "ZACFN10",
    color: "#ec4899",
    rating: 4.6,
    reviews: 6700,
    max_capital: "$200K",
    profit_split: "95%",
    payout: "Bi-weekly",
    features: ["Profit from challenge", "Stellar 1-step", "Express model", "Free trial"],
    url: "https://fundednext.com",
    is_featured: false,
    is_active: true,
    display_order: 4,
  },
  {
    slug: "true-forex-funds",
    name: "True Forex Funds",
    description: "Transparent pricing with no hidden fees. Beginner-friendly platform.",
    logo: "TFF",
    discount: "12% OFF",
    promo_code: "ZACTFF",
    color: "#10b981",
    rating: 4.5,
    reviews: 5400,
    max_capital: "$200K",
    profit_split: "80%",
    payout: "Weekly",
    features: ["No activation fee", "Raw spreads", "MT5 platform", "Fast support"],
    url: "https://trueforexfunds.com",
    is_featured: false,
    is_active: true,
    display_order: 5,
  },
  {
    slug: "apex-trader-funding",
    name: "Apex Trader Funding",
    description: "The original futures prop firm. Trade NQ, ES, CL with generous rules.",
    logo: "ATF",
    discount: "50% OFF",
    promo_code: "ZAC50",
    color: "#3b82f6",
    rating: 4.7,
    reviews: 15600,
    max_capital: "$300K",
    profit_split: "100%",
    payout: "Monthly",
    features: ["Futures only", "No daily loss limit", "Trailing threshold", "Reset discount"],
    url: "https://apextraderfunding.com",
    is_featured: true,
    is_active: true,
    display_order: 6,
  },
  {
    slug: "topstep",
    name: "Topstep",
    description: "The original prop firm since 2012. Futures and forex evaluations.",
    logo: "TS",
    discount: "20% OFF",
    promo_code: "ZACTS20",
    color: "#ef4444",
    rating: 4.6,
    reviews: 9200,
    max_capital: "$150K",
    profit_split: "90%",
    payout: "Monthly",
    features: ["Founded 2012", "Coaching included", "Combine rules", "Scaling to $2M"],
    url: "https://topstep.com",
    is_featured: false,
    is_active: true,
    display_order: 7,
  },
  {
    slug: "surgetrader",
    name: "SurgeTrader",
    description: "One-step evaluation with no minimum trading days. Simple and fast.",
    logo: "ST",
    discount: "10% OFF",
    promo_code: "ZACST10",
    color: "#f97316",
    rating: 4.4,
    reviews: 4100,
    max_capital: "$250K",
    profit_split: "85%",
    payout: "Bi-weekly",
    features: ["One-step eval", "No minimum days", "Add-ons available", "EA allowed"],
    url: "https://surgetrader.com",
    is_featured: false,
    is_active: true,
    display_order: 8,
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
    url: "https://discord.com",
    tone_key: "bull",
    is_active: true,
    display_order: 4,
  },
];

export async function fetchIndicators() {
  if (!supabase) return defaultIndicators;

  const { data, error } = await supabase
    .from("premium_indicators")
    .select("slug,name,description,tag,stats_label,tradingview_url,is_active,display_order")
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
      "slug,name,category,description,promo_code,discount,url,highlights,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultTradingTools;
  }

  return data?.length ? (data as TradingToolRow[]) : defaultTradingTools;
}

export async function fetchBlogPosts() {
  if (!supabase) return defaultBlogPosts;

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug,title,category,published_date,read_time,excerpt,content,pdf_url,is_featured,is_published,display_order",
    )
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultBlogPosts;
  }

  return data?.length ? (data as BlogPostRow[]) : defaultBlogPosts;
}

export async function fetchPropFirms() {
  if (!supabase) return defaultPropFirms;

  const { data, error } = await supabase
    .from("prop_firms")
    .select(
      "slug,name,description,logo,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultPropFirms;
  }

  return data?.length ? (data as PropFirmRow[]) : defaultPropFirms;
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
