import { supabase } from "@/lib/supabase";

export type EducationArticleCategory = "study" | "psychology" | "risk" | "premium";

export type EducationArticle = {
  slug: string;
  title: string;
  description: string;
  category: EducationArticleCategory;
  level: string;
  readTime: string;
  access: "Free" | "Members";
  date: string;
  coverTitle: string;
  coverSubtitle: string;
  coverImageUrl?: string | null;
  content: string[];
};

export type EducationArticleRow = {
  slug: string;
  title: string;
  description: string;
  category: EducationArticleCategory;
  level: string;
  read_time: string;
  access: "Free" | "Members";
  published_date: string;
  cover_title: string;
  cover_subtitle: string;
  cover_image_url?: string | null;
  content: string;
  is_published: boolean;
  display_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export const educationArticles: EducationArticle[] = [
  {
    slug: "liquidity-buy-side-sell-side-stop-hunts",
    title: "Liquidity: Buy Side, Sell Side, and Stop Hunts",
    description: "Identify where liquidity rests and how price often moves before real expansion.",
    category: "study",
    level: "Core",
    readTime: "20 min read",
    access: "Free",
    date: "September 5, 2026",
    coverTitle: "Liquidity Map",
    coverSubtitle: "Where stops become fuel",
    content: [
      "Liquidity is the fuel that allows price to move. In practical terms, liquidity often sits around obvious highs, obvious lows, equal highs, equal lows, and clean consolidation ranges where many traders place stops or breakout orders.",
      "Buy side liquidity usually rests above highs. Sell side liquidity usually rests below lows. When price pushes into those areas, it can trigger orders, create volatility, and then either continue or reverse depending on the higher timeframe context.",
      "The mistake many traders make is entering only because liquidity was taken. A liquidity sweep is not automatically a trade. It becomes useful when it appears in the right location, at the right time, and after price gives confirmation that the sweep has served its purpose.",
      "Before using liquidity in a setup, mark the draw on liquidity, note the session timing, and define what would prove your idea wrong. That keeps liquidity analysis from becoming a random entry signal.",
    ],
  },
  {
    slug: "fair-value-gaps-and-imbalance-explained",
    title: "Fair Value Gaps and Imbalance Explained Simply",
    description: "Use imbalance as context, not as a blind entry button.",
    category: "study",
    level: "Core",
    readTime: "15 min read",
    access: "Free",
    date: "September 5, 2026",
    coverTitle: "Imbalance",
    coverSubtitle: "Trade context before entries",
    content: [
      "A fair value gap is an area where price moved aggressively enough to leave an inefficient delivery between candles. Traders watch these zones because price can return to rebalance part of that move before continuing.",
      "The important part is context. A fair value gap near a strong draw on liquidity or inside a clear higher timeframe bias is more meaningful than a random gap in the middle of noise.",
      "Do not treat every gap as a buy or sell button. First ask where price is likely trying to go, what liquidity has already been taken, and whether the current session timing supports continuation.",
      "A cleaner model is simple: identify bias, wait for displacement, mark the imbalance, then require confirmation and clear invalidation before taking risk.",
    ],
  },
  {
    slug: "how-to-backtest-without-lying-to-yourself",
    title: "How to Backtest Without Lying to Yourself",
    description: "Build a sample size, write rules, and review results with discipline.",
    category: "study",
    level: "Study",
    readTime: "16 min read",
    access: "Free",
    date: "September 5, 2026",
    coverTitle: "Backtest Rules",
    coverSubtitle: "Proof before confidence",
    content: [
      "Backtesting is not about finding perfect screenshots. It is about testing whether a repeatable idea holds up across enough examples to deserve your attention.",
      "Start by writing the rule set before opening the chart. Define market, session, timeframe, entry condition, stop placement, target logic, and invalidation. If the rules are not written, the test becomes emotional.",
      "A good backtest includes wins, losses, breakeven trades, missed trades, and examples where the setup looked almost right but failed. Those details help you understand the real behavior of the model.",
      "Track screenshots and notes. After a sample size, review the data honestly. The goal is not to prove that you are right. The goal is to discover what is worth trading with real risk.",
    ],
  },
  {
    slug: "weekly-review-template",
    title: "Weekly Review Template",
    description: "A simple checklist for reviewing screenshots, emotions, mistakes, and execution quality.",
    category: "study",
    level: "PDF",
    readTime: "Download",
    access: "Members",
    date: "September 5, 2026",
    coverTitle: "Weekly Review",
    coverSubtitle: "Grade the process",
    content: [
      "A weekly review helps you see patterns that are invisible during the trading day. One trade can feel emotional. A full week shows behavior.",
      "Review each trade by plan quality, execution quality, risk control, emotional state, and whether you respected the invalidation. Do not only mark profit or loss.",
      "Then group the week into themes: best setups, worst decisions, repeated mistakes, missed opportunities, and one rule to focus on next week.",
      "The goal is simple: make the next week cleaner than the last one. Progress comes from removing repeated mistakes, not from adding more indicators.",
    ],
  },
  {
    slug: "trading-psychology-patience-fear-overtrading",
    title: "Trading Psychology: Patience, Fear, and Overtrading",
    description: "Recognize the emotional loops that destroy consistency and learn how to reset.",
    category: "psychology",
    level: "Mindset",
    readTime: "14 min read",
    access: "Free",
    date: "September 5, 2026",
    coverTitle: "Mindset Reset",
    coverSubtitle: "Patience before execution",
    content: [
      "Most trading mistakes are not caused by a lack of information. They are caused by reacting too quickly when fear, greed, boredom, or revenge takes control.",
      "Patience is not passive. It is the skill of waiting for your exact conditions instead of forcing a trade because the market is moving without you.",
      "Fear often appears after a loss or before a high quality entry. Overtrading often appears after a win, when confidence turns into urgency. Both problems are solved by rules that are written before the session starts.",
      "A strong trader learns to pause, breathe, check the plan, and accept that no trade is better than a trade taken from emotion.",
    ],
  },
  {
    slug: "risk-management-position-sizing-daily-loss-limits",
    title: "Risk Management: Position Sizing and Daily Loss Limits",
    description: "Protect the account first, then focus on execution quality.",
    category: "risk",
    level: "Risk",
    readTime: "17 min read",
    access: "Free",
    date: "September 5, 2026",
    coverTitle: "Risk First",
    coverSubtitle: "Survive every session",
    content: [
      "Risk management is the part of trading that keeps you in the game long enough to improve. A good setup means very little if the risk is too large for your account or your emotions.",
      "Position size should be calculated before entry. Your stop loss, account size, and risk percentage decide the size, not confidence or excitement.",
      "A daily loss limit protects you from the worst version of yourself. Once you hit the limit, the session is over. This rule is not punishment. It is protection.",
      "The best traders are not the ones who never lose. They are the ones who can take losses without losing control of the account.",
    ],
  },
  {
    slug: "daily-bias-simple-pre-market-plan",
    title: "Daily Bias: Building a Simple Pre-Market Plan",
    description: "Create a repeatable process for mapping the day before the New York session starts.",
    category: "premium",
    level: "Advanced",
    readTime: "24 min read",
    access: "Members",
    date: "September 5, 2026",
    coverTitle: "Daily Bias",
    coverSubtitle: "Prepare before the bell",
    content: [
      "A daily bias gives structure to the session. It does not predict the future. It helps you decide what you are willing to trade and what you should ignore.",
      "Start with higher timeframe direction, key liquidity, previous day high and low, session highs and lows, and major news. Then decide which side of the market has the cleaner story.",
      "A good pre-market plan also includes conditions that would cancel your bias. If price does something that invalidates the idea, you do not argue with it. You update or step aside.",
      "The purpose of planning is to reduce decisions during live price action. Less improvisation usually means cleaner execution.",
    ],
  },
  {
    slug: "entry-model-confirmation-invalidation-risk",
    title: "Entry Model: Confirmation, Invalidation, and Risk",
    description: "Connect setup quality with clear risk so every trade has a reason and an exit point.",
    category: "premium",
    level: "Advanced",
    readTime: "28 min read",
    access: "Members",
    date: "September 5, 2026",
    coverTitle: "Entry Model",
    coverSubtitle: "Reason, risk, invalidation",
    content: [
      "An entry model is a repeatable sequence. It should tell you what must happen before entry, where the trade is wrong, and how risk will be managed after entry.",
      "Confirmation can come from displacement, a structural shift, a clean retest, or another rule inside your model. The exact rule matters less than consistency.",
      "Invalidation is the price or condition that proves the idea is no longer valid. Without invalidation, a trader can keep moving the stop emotionally and turn a small loss into a large one.",
      "When confirmation and invalidation are clear, execution becomes calmer because the trade has boundaries before money is at risk.",
    ],
  },
  {
    slug: "pre-market-checklist",
    title: "Pre-Market Checklist",
    description: "Map bias, liquidity, news, key levels, and the setups you are allowed to take.",
    category: "premium",
    level: "PDF",
    readTime: "Download",
    access: "Members",
    date: "September 5, 2026",
    coverTitle: "Checklist",
    coverSubtitle: "Session rules before entries",
    content: [
      "A pre-market checklist keeps your attention on the few things that matter before volatility starts. It should be short enough to use every day.",
      "Mark higher timeframe direction, key liquidity, major levels, expected session, news risk, and the setups that are allowed for the day.",
      "Also write what you are not allowed to do. For many traders, the no-trade rules are more valuable than the entry rules.",
      "The checklist is complete when you know where you want price to trade, what confirmation you need, and what would make you stay flat.",
    ],
  },
  {
    slug: "trade-recap-framework",
    title: "Trade Recap Framework",
    description: "Grade every trade by plan, execution, risk, and emotional control.",
    category: "premium",
    level: "Review",
    readTime: "22 min read",
    access: "Members",
    date: "September 5, 2026",
    coverTitle: "Trade Recap",
    coverSubtitle: "Review the decision",
    content: [
      "A trade recap should judge the decision, not only the result. A winning trade can be badly executed, and a losing trade can still be a correct decision.",
      "Screenshot the before, entry, management, and exit. Then write the reason for entry, risk taken, emotional state, and whether the trade followed the plan.",
      "Grade each trade with simple categories: A for clean plan and execution, B for minor mistakes, C for emotional or unclear execution, and D for rule breaking.",
      "Over time, your goal is to take more A and B trades, reduce C trades, and eliminate D trades completely.",
    ],
  },
];

export function educationArticlePath(slug: string) {
  return `/education/${slug}`;
}

export const ADMIN_EDUCATION_PREVIEW_STORAGE_KEY = "zactrades-admin-education-preview";

export function adminEducationPreviewPath(slug: string) {
  return `/admin/education/preview?slug=${encodeURIComponent(slug)}`;
}

export function findEducationArticle(slug: string) {
  return educationArticles.find((article) => article.slug === slug);
}

export const defaultEducationArticleRows: EducationArticleRow[] = educationArticles.map(
  (article, index) => ({
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: article.category,
    level: article.level,
    read_time: article.readTime,
    access: article.access,
    published_date: article.date,
    cover_title: article.coverTitle,
    cover_subtitle: article.coverSubtitle,
    cover_image_url: null,
    content: article.content.join("\n\n"),
    is_published: true,
    display_order: index + 1,
    created_at: null,
    updated_at: null,
  }),
);

export function educationArticleFromRow(row: EducationArticleRow): EducationArticle {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    level: row.level,
    readTime: row.read_time,
    access: row.access,
    date: row.published_date,
    coverTitle: row.cover_title,
    coverSubtitle: row.cover_subtitle,
    coverImageUrl: row.cover_image_url ?? getFirstArticleImageUrl(row.content),
    content: isRichHtmlContent(row.content)
      ? [row.content.trim()]
      : row.content
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
  };
}

export function educationArticlesFromRows(rows: EducationArticleRow[]) {
  return rows.map(educationArticleFromRow);
}

export function sortEducationArticleRowsNewestFirst(rows: EducationArticleRow[]) {
  return [...rows].sort((articleA, articleB) => {
    const articleBTime = getEducationArticleSortTime(articleB);
    const articleATime = getEducationArticleSortTime(articleA);

    if (articleBTime !== articleATime) {
      return articleBTime - articleATime;
    }

    return (articleB.display_order ?? 0) - (articleA.display_order ?? 0);
  });
}

export async function fetchEducationArticleRows({
  includeUnpublished = false,
}: {
  includeUnpublished?: boolean;
} = {}) {
  if (!supabase) {
    return sortEducationArticleRowsNewestFirst(defaultEducationArticleRows);
  }

  let query = supabase
    .from("education_articles")
    .select(
      "*",
    )
    .order("created_at", { ascending: false })
    .order("display_order", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return sortEducationArticleRowsNewestFirst(defaultEducationArticleRows);
  }

  return sortEducationArticleRowsNewestFirst((data ?? []) as EducationArticleRow[]);
}

function getEducationArticleSortTime(row: EducationArticleRow) {
  const createdTime = row.created_at ? Date.parse(row.created_at) : Number.NaN;
  if (Number.isFinite(createdTime)) return createdTime;

  const publishedTime = row.published_date ? Date.parse(row.published_date) : Number.NaN;
  return Number.isFinite(publishedTime) ? publishedTime : 0;
}

function getFirstArticleImageUrl(content: string) {
  const legacyMatch = content.match(/\[image:([^|\]]+)/i);
  if (legacyMatch?.[1]) return legacyMatch[1].trim();

  const htmlMatch = content.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  return htmlMatch?.[1]?.trim() || null;
}

function isRichHtmlContent(content: string) {
  return /<\/?(?:p|h[1-6]|ul|ol|li|strong|em|u|a|img|blockquote|iframe|div|span|br)\b/i.test(content);
}
