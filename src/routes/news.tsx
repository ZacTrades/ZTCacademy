import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  Filter,
  Lock,
  LogIn,
  Loader2,
  Newspaper,
  Radio,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News | ZacTrades" },
      {
        name: "description",
        content: "Latest market headlines for traders.",
      },
      { property: "og:title", content: "News | ZacTrades" },
      {
        property: "og:description",
        content: "Market-moving headlines for ZacTrades traders.",
      },
    ],
  }),
  component: NewsPage,
});

type NewsItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  category: string;
  impact: NewsImpact;
  impactTags: string[];
};

type NewsFeedResponse = {
  items: NewsItem[];
  fetchedAt: string;
  sourceUrl: string;
  error?: string;
  isStale?: boolean;
};

type NewsImpact = "high" | "watch";

type CalendarImpact = "high" | "medium" | "low";

type EconomicCalendarItem = {
  id: string;
  dateLabel: string;
  dateKey: string;
  time: string;
  title: string;
  countryCode: string;
  impact: CalendarImpact;
  actual: string;
  forecast: string;
  previous: string;
  actualTone: "positive" | "negative" | "neutral";
  realDate: string;
  sortValue: number;
};

type EconomicCalendarResponse = {
  items: EconomicCalendarItem[];
  fetchedAt: string;
  sourceUrl: string;
  error?: string;
  isStale?: boolean;
};

const FINANCIAL_JUICE_HOME = "https://www.financialjuice.com/";
const FINANCIAL_JUICE_RSS = "https://www.financialjuice.com/feed.ashx?xy=rss";
const FINANCIAL_JUICE_STARTUP = "https://www.financialjuice.com/FJService.asmx/Startup";
const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const NEWS_RATE_LIMIT_TTL_MS = 15 * 60 * 1000;
const CALENDAR_CACHE_TTL_MS = 5 * 60 * 1000;
const FINANCIAL_JUICE_TIME_OFFSET = "-60";
const NEWS_COMING_SOON = true;
const NEWS_SUBSCRIPTION_PACKAGES = [
  {
    duration: "Monthly",
    price: "$5",
    monthly: "$5/mo",
    badge: "News desk",
  },
];
const NEWS_SUBSCRIPTION_FEATURES = [
  "Live market-moving headlines",
  "FinancialJuice-style economic calendar",
  "High-impact news highlighting",
  "Member-only news desk access",
];
const ALLOWED_CALENDAR_COUNTRIES = new Set([
  "AU",
  "CA",
  "CN",
  "EU",
  "FR",
  "DE",
  "HK",
  "IN",
  "IT",
  "JP",
  "NL",
  "NZ",
  "NO",
  "RU",
  "SG",
  "KR",
  "ES",
  "SE",
  "CH",
  "TR",
  "GB",
  "US",
]);

type NewsCacheState = {
  response: NewsFeedResponse;
  expiresAt: number;
};

type NewsGlobalCache = typeof globalThis & {
  __zactradesNewsCache?: NewsCacheState;
  __zactradesNewsPending?: Promise<NewsFeedResponse>;
};

type CalendarCacheState = {
  response: EconomicCalendarResponse;
  expiresAt: number;
};

type CalendarGlobalCache = typeof globalThis & {
  __zactradesCalendarCache?: CalendarCacheState;
  __zactradesCalendarPending?: Promise<EconomicCalendarResponse>;
};

const fetchFinancialJuiceNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsFeedResponse> => {
    const cacheHost = globalThis as NewsGlobalCache;
    const now = Date.now();
    const cached = cacheHost.__zactradesNewsCache;

    if (cached && cached.expiresAt > now) {
      return cached.response;
    }

    if (cacheHost.__zactradesNewsPending) {
      return cacheHost.__zactradesNewsPending;
    }

    cacheHost.__zactradesNewsPending = fetchFreshFinancialJuiceNews();

    try {
      const freshFeed = await cacheHost.__zactradesNewsPending;
      cacheHost.__zactradesNewsCache = {
        response: freshFeed,
        expiresAt: Date.now() + NEWS_CACHE_TTL_MS,
      };
      return freshFeed;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch market headlines right now.";
      const fallbackFeed: NewsFeedResponse = cached
        ? {
            ...cached.response,
            isStale: true,
            error: "Showing recently cached headlines while the live feed cools down.",
          }
        : {
            items: [],
            fetchedAt: new Date().toISOString(),
            sourceUrl: FINANCIAL_JUICE_HOME,
            error: message,
          };

      cacheHost.__zactradesNewsCache = {
        response: fallbackFeed,
        expiresAt:
          Date.now() + (isRateLimitError(error) ? NEWS_RATE_LIMIT_TTL_MS : NEWS_CACHE_TTL_MS),
      };

      return fallbackFeed;
    } finally {
      cacheHost.__zactradesNewsPending = undefined;
    }
  },
);

const fetchFinancialJuiceCalendar = createServerFn({ method: "GET" }).handler(
  async (): Promise<EconomicCalendarResponse> => {
    const cacheHost = globalThis as CalendarGlobalCache;
    const now = Date.now();
    const cached = cacheHost.__zactradesCalendarCache;

    if (cached && cached.expiresAt > now) {
      return cached.response;
    }

    if (cacheHost.__zactradesCalendarPending) {
      return cacheHost.__zactradesCalendarPending;
    }

    cacheHost.__zactradesCalendarPending = fetchFreshFinancialJuiceCalendar();

    try {
      const freshCalendar = await cacheHost.__zactradesCalendarPending;
      cacheHost.__zactradesCalendarCache = {
        response: freshCalendar,
        expiresAt: Date.now() + CALENDAR_CACHE_TTL_MS,
      };
      return freshCalendar;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch economic calendar right now.";
      const fallbackCalendar: EconomicCalendarResponse = cached
        ? {
            ...cached.response,
            isStale: true,
            error: "Showing recently cached calendar events while the live feed cools down.",
          }
        : {
            items: [],
            fetchedAt: new Date().toISOString(),
            sourceUrl: FINANCIAL_JUICE_HOME,
            error: message,
          };

      cacheHost.__zactradesCalendarCache = {
        response: fallbackCalendar,
        expiresAt:
          Date.now() + (isRateLimitError(error) ? NEWS_RATE_LIMIT_TTL_MS : CALENDAR_CACHE_TTL_MS),
      };

      return fallbackCalendar;
    } finally {
      cacheHost.__zactradesCalendarPending = undefined;
    }
  },
);

async function fetchFreshFinancialJuiceNews(): Promise<NewsFeedResponse> {
  const response = await fetch(FINANCIAL_JUICE_RSS, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, text/plain",
      "User-Agent": "ZacTrades news reader",
    },
  });

  if (!response.ok) {
    throw new Error(`News feed returned ${response.status}`);
  }

  const xml = await response.text();
  const rssItems = getCurrentFinancialJuiceDayItems(parseRssItems(xml));
  const items = await enrichNewsItemsWithFinancialJuiceImpact(rssItems);

  return {
    items,
    fetchedAt: new Date().toISOString(),
    sourceUrl: FINANCIAL_JUICE_HOME,
  };
}

async function fetchFreshFinancialJuiceCalendar(): Promise<EconomicCalendarResponse> {
  const homeResponse = await fetch(FINANCIAL_JUICE_HOME, {
    headers: {
      Accept: "text/html, text/plain",
    },
  });

  if (!homeResponse.ok) {
    throw new Error(`FinancialJuice calendar shell returned ${homeResponse.status}`);
  }

  const homeHtml = await homeResponse.text();
  const info = parseFinancialJuiceInfoToken(homeHtml);

  if (!info) {
    throw new Error("FinancialJuice calendar token was not found.");
  }

  const startupUrl = new URL(FINANCIAL_JUICE_STARTUP);
  startupUrl.search = new URLSearchParams({
    info,
    TimeOffset: FINANCIAL_JUICE_TIME_OFFSET,
    tabID: "0",
    oldID: "0",
    TickerID: "0",
    FeedCompanyID: "0",
    strSearch: "",
    extraNID: "0",
  }).toString();

  const startupResponse = await fetch(startupUrl, {
    headers: {
      Accept: "application/json, application/xml, text/xml, text/plain",
    },
  });

  if (!startupResponse.ok) {
    throw new Error(`FinancialJuice calendar returned ${startupResponse.status}`);
  }

  const rawStartup = await startupResponse.text();
  const startupJson = parseFinancialJuiceStartupJson(rawStartup);
  const startupData = parseFinancialJuiceStartupData(startupJson);
  const items = parseFinancialJuiceCalendarItems(getFinancialJuiceCalendarRows(startupData));

  if (!items.length) {
    throw new Error("FinancialJuice returned no calendar rows.");
  }

  return {
    items,
    fetchedAt: new Date().toISOString(),
    sourceUrl: FINANCIAL_JUICE_HOME,
  };
}

function isRateLimitError(error: unknown) {
  return error instanceof Error && /\b429\b/.test(error.message);
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function NewsPage() {
  const { user, loading: authLoading, isConfigured, isStaff } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [hasPaidNews, setHasPaidNews] = useState(false);
  const [feed, setFeed] = useState<NewsFeedResponse>({
    items: [],
    fetchedAt: "",
    sourceUrl: FINANCIAL_JUICE_HOME,
  });
  const [calendar, setCalendar] = useState<EconomicCalendarResponse>({
    items: [],
    fetchedAt: "",
    sourceUrl: FINANCIAL_JUICE_HOME,
  });
  const [newsLoading, setNewsLoading] = useState(false);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const loadNewsSubscription = useCallback(async () => {
    if (!user || !supabase) {
      setHasPaidNews(false);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);

    const { data, error } = await supabase
      .from("user_news_subscriptions")
      .select("status,access_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setHasPaidNews(false);
      setSubscriptionLoading(false);
      return;
    }

    const expiresAt =
      typeof data?.access_expires_at === "string" ? new Date(data.access_expires_at) : null;
    const active =
      data?.status === "paid" &&
      (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date());

    setHasPaidNews(active);
    setSubscriptionLoading(false);
  }, [user]);

  const loadNews = useCallback(async () => {
    if (!user || (!hasPaidNews && !isStaff)) return;

    setNewsLoading(true);
    const [nextFeed, nextCalendar] = await Promise.all([
      fetchFinancialJuiceNews(),
      fetchFinancialJuiceCalendar(),
    ]);
    setFeed(nextFeed);
    setCalendar(nextCalendar);
    setNewsLoading(false);
  }, [hasPaidNews, isStaff, user]);

  useEffect(() => {
    if (user) {
      void loadNewsSubscription();
      return;
    }

    setHasPaidNews(false);
    setSubscriptionLoading(false);
  }, [loadNewsSubscription, user]);

  useEffect(() => {
    if (!NEWS_COMING_SOON && user && (hasPaidNews || isStaff)) {
      void loadNews();
      return;
    }

    setFeed({
      items: [],
      fetchedAt: "",
      sourceUrl: FINANCIAL_JUICE_HOME,
    });
    setCalendar({
      items: [],
      fetchedAt: "",
      sourceUrl: FINANCIAL_JUICE_HOME,
    });
    setNewsLoading(false);
  }, [hasPaidNews, isStaff, loadNews, user]);

  const featuredItem = feed.items[0];
  const remainingItems = useMemo(() => feed.items.slice(1), [feed.items]);
  const canAccessNews = !NEWS_COMING_SOON && Boolean(user && (hasPaidNews || isStaff));
  const isCheckingNewsAccess = authLoading || (Boolean(user) && !isStaff && subscriptionLoading);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/75 to-background" />

          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="glass mb-6 gap-2 border-primary/40 text-xs">
                <Radio className="h-3.5 w-3.5 text-electric" />
                Market News
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Market-moving <span className="text-gradient">news</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Member-only headlines for traders who want the title, timing, and market context
                without extra noise.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {NEWS_COMING_SOON ? (
                  <Button
                    type="button"
                    disabled
                    className="text-primary-foreground opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Radio className="h-4 w-4" />
                    Coming soon
                  </Button>
                ) : canAccessNews ? (
                  <Button
                    type="button"
                    onClick={loadNews}
                    disabled={newsLoading}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {newsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                ) : user ? (
                  <Button
                    type="button"
                    onClick={() => setCheckoutOpen(true)}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                    disabled={!isConfigured || subscriptionLoading}
                  >
                    <Lock className="h-4 w-4" />
                    Unlock news for $5
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => openAuth("signin")}
                      className="text-primary-foreground glow-primary hover:opacity-90"
                      style={{ background: "var(--gradient-primary)" }}
                      disabled={!isConfigured || authLoading}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="glass border-border/60"
                      onClick={() => openAuth("join")}
                      disabled={!isConfigured || authLoading}
                    >
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </Button>
                  </>
                )}
              </div>
              {canAccessNews ? <ImpactLegend /> : null}
            </motion.div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {NEWS_COMING_SOON ? (
              <NewsComingSoonCard />
            ) : isCheckingNewsAccess ? (
              <StatusCard
                icon={Loader2}
                title="Checking access"
                description="Verifying your paid ZacTrades news subscription before loading the news desk."
                spinning
              />
            ) : canAccessNews ? (
              <NewsWorkspaceTabs
                loading={newsLoading}
                feed={feed}
                calendar={calendar}
                featuredItem={featuredItem}
                remainingItems={remainingItems}
              />
            ) : user ? (
              isStaff ? (
                <StaffCheckoutNotice description="News checkout is hidden for admin and moderator accounts. Staff can preview the news desk without creating a paid subscription record." />
              ) : (
                <NewsSubscriptionGate onCheckout={() => setCheckoutOpen(true)} />
              )
            ) : (
              <motion.div
                {...fadeUp}
                className="mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-card/35 p-6 text-center shadow-[0_0_70px_-45px_oklch(0.68_0.19_250/0.9)] md:p-10"
              >
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
                  <Lock className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="glass mt-6 border-gold/40 text-xs">
                  Members only
                </Badge>
                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Sign in before subscribing to the news desk.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  The live news feed and economic calendar require an account and an active $5 news
                  subscription.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => openAuth("signin")}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                    disabled={!isConfigured}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="glass border-border/60"
                    onClick={() => openAuth("join")}
                    disabled={!isConfigured}
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Button>
                </div>
                {!isConfigured && (
                  <p className="mt-4 text-xs text-destructive">
                    Supabase is not configured, so authentication is unavailable.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setAuthOpen}
        onModeChange={setAuthMode}
      />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={(nextOpen) => {
          setCheckoutOpen(nextOpen);
          if (!nextOpen) {
            setTimeout(() => {
              void loadNewsSubscription();
            }, 250);
          }
        }}
        checkoutKind="news"
        planName="ZacTrades News Desk"
        features={NEWS_SUBSCRIPTION_FEATURES}
        packages={NEWS_SUBSCRIPTION_PACKAGES}
      />
    </div>
  );
}

function NewsComingSoonCard() {
  return (
    <motion.div
      {...fadeUp}
      className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-card/35 p-6 text-center shadow-[0_0_90px_-45px_oklch(0.68_0.19_250/0.95)] md:p-10"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.68_0.19_250/0.18),transparent_42%),linear-gradient(135deg,oklch(0.78_0.16_85/0.08),transparent_48%)]" />
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
        <Newspaper className="h-7 w-7" />
      </div>
      <Badge variant="outline" className="glass mt-6 border-primary/40 text-xs">
        News Desk
      </Badge>
      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Coming soon
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
        The ZacTrades live news desk is being prepared. The page background and structure stay
        ready, but the live feed and calendar will open when the news section launches.
      </p>
      <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        {["Live market headlines", "Economic calendar", "Clean trader-focused layout"].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/60 bg-background/45 p-4 text-sm text-muted-foreground"
            >
              <div className="mb-3 h-1.5 w-10 rounded-full bg-electric/70" />
              {item}
            </div>
          ),
        )}
      </div>
    </motion.div>
  );
}

function NewsSubscriptionGate({ onCheckout }: { onCheckout: () => void }) {
  const { formatPrice } = useCurrency();
  const newsPrice = formatPrice(NEWS_SUBSCRIPTION_PACKAGES[0].price);

  return (
    <motion.div
      {...fadeUp}
      className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gold/35 bg-card/35 shadow-[0_0_80px_-48px_oklch(0.78_0.16_85/0.9)]"
    >
      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 md:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <Lock className="h-3.5 w-3.5" />
            Paid news desk
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Unlock live market news for <span className="text-gradient-gold">{newsPrice}/mo</span>.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Your account is registered, but the news desk is a paid subscription. Subscribe to view
            the live feed, high-impact headlines, and today&apos;s economic calendar.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {NEWS_SUBSCRIPTION_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-bull/15 text-bull">
                  <Newspaper className="h-3 w-3" />
                </div>
                {feature}
              </div>
            ))}
          </div>
          <Button
            type="button"
            size="lg"
            onClick={onCheckout}
            className="mt-8 text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            Pay {newsPrice} & Unlock News
          </Button>
        </div>

        <div className="border-t border-border/60 bg-background/45 p-6 md:border-l md:border-t-0 md:p-9">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Subscription
                </div>
                <div className="mt-2 font-display text-2xl font-bold">News Desk</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-4xl font-bold text-gradient-gold">{newsPrice}</div>
                <div className="text-xs text-muted-foreground">per month</div>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-muted-foreground">
              Paid members can refresh the feed and calendar directly from the page. Registered
              members without this subscription stay blocked from the news content.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NewsWorkspaceTabs({
  loading,
  feed,
  calendar,
  featuredItem,
  remainingItems,
}: {
  loading: boolean;
  feed: NewsFeedResponse;
  calendar: EconomicCalendarResponse;
  featuredItem?: NewsItem;
  remainingItems: NewsItem[];
}) {
  return (
    <Tabs defaultValue="live-news" className="w-full">
      <motion.div
        {...fadeUp}
        className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/35 p-2 shadow-[0_0_70px_-42px_oklch(0.68_0.19_250/0.8)]"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-2">
          <TabsTrigger
            value="live-news"
            className="group h-auto justify-start rounded-xl border border-transparent bg-background/45 p-4 text-left data-[state=active]:border-primary/45 data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-electric ring-1 ring-primary/25">
              <Newspaper className="h-5 w-5" />
            </span>
            <span className="ml-3 min-w-0">
              <span className="block font-display text-base font-bold text-foreground">
                Live news feed
              </span>
              <span className="mt-1 block whitespace-normal text-xs leading-5 text-muted-foreground">
                Real-time market headlines with red reserved for urgent high-impact rows.
              </span>
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="events"
            className="group h-auto justify-start rounded-xl border border-transparent bg-background/45 p-4 text-left data-[state=active]:border-gold/45 data-[state=active]:bg-gold/10 data-[state=active]:shadow-none"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/25">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="ml-3 min-w-0">
              <span className="block font-display text-base font-bold text-foreground">
                Today and next events
              </span>
              <span className="mt-1 block whitespace-normal text-xs leading-5 text-muted-foreground">
                Economic calendar with time, actual, forecast, and previous.
              </span>
            </span>
          </TabsTrigger>
        </TabsList>
      </motion.div>

      <TabsContent value="live-news" className="mt-0">
        <LiveNewsFeedSection
          loading={loading}
          feed={feed}
          featuredItem={featuredItem}
          remainingItems={remainingItems}
        />
      </TabsContent>

      <TabsContent value="events" className="mt-0">
        <EconomicCalendarSection loading={loading} calendar={calendar} />
      </TabsContent>
    </Tabs>
  );
}

function EconomicCalendarSection({
  loading,
  calendar,
}: {
  loading: boolean;
  calendar: EconomicCalendarResponse;
}) {
  const groupedEvents = useMemo(() => groupCalendarEvents(calendar.items), [calendar.items]);

  return (
    <section className="min-w-0">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)] xl:items-start">
        <motion.div
          {...fadeUp}
          className="overflow-hidden rounded-2xl border border-border/60 bg-[#202630] shadow-[0_0_70px_-48px_oklch(0.68_0.19_250/0.9)]"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5rem_5rem_5rem_2rem] gap-2 border-b border-white/10 bg-[#1b212b] px-4 py-3 font-display text-sm font-bold text-[#c6cad3]">
                <span>Time</span>
                <span />
                <span className="text-right">Actual</span>
                <span className="text-right">Forecast</span>
                <span className="text-right">Previous</span>
                <span className="flex justify-end">
                  <Filter className="h-4 w-4 text-[#c6cad3]" />
                </span>
              </div>

              {loading ? (
                <div className="p-6">
                  <StatusCard
                    icon={Loader2}
                    title="Loading calendar"
                    description="Fetching the FinancialJuice economic calendar."
                    spinning
                  />
                </div>
              ) : calendar.error && !calendar.items.length ? (
                <div className="p-6">
                  <StatusCard
                    icon={AlertCircle}
                    title="Calendar unavailable"
                    description="The FinancialJuice economic calendar is unavailable right now."
                  />
                </div>
              ) : !calendar.items.length ? (
                <div className="p-6">
                  <StatusCard
                    icon={CalendarDays}
                    title="No events found"
                    description="FinancialJuice did not return calendar events at this moment."
                  />
                </div>
              ) : (
                <div className="max-h-[760px] overflow-y-auto px-4 py-3">
                  {calendar.isStale && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-gold/35 bg-gold/10 p-3 text-xs text-gold">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      Showing recently cached FinancialJuice calendar events while the live feed
                      cools down.
                    </div>
                  )}

                  {groupedEvents.map((group) => (
                    <div key={group.dateLabel} className="mb-4 last:mb-0">
                      <div className="mb-1 border-b border-white/35 pb-1 font-display text-sm font-bold text-[#d7dae0]">
                        {group.dateLabel}
                      </div>
                      <div className="grid gap-1">
                        {group.items.map((item) => (
                          <EconomicCalendarRow key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
        <div className="xl:sticky xl:top-28">
          <SectionHeader
            icon={CalendarDays}
            label="FinancialJuice Calendar"
            title="Today and next events"
            description="A FinancialJuice-style release tape with time, impact, actual, forecast, previous value, and the same selected country/importance filters."
          />
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-background/45 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-electric">
                Release Desk
              </div>
              <p className="mt-2 leading-6">
                Red means high-impact, amber means medium-impact, and yellow means low-impact.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="rounded-lg border border-bear/35 bg-bear/10 p-3 text-bear">High</div>
              <div className="rounded-lg border border-gold/35 bg-gold/10 p-3 text-gold">
                Medium
              </div>
              <div className="rounded-lg border border-primary/35 bg-primary/10 p-3 text-electric">
                Low
              </div>
            </div>
            {calendar.fetchedAt && (
              <div className="rounded-xl border border-border/50 bg-background/45 p-4 text-xs">
                Updated {formatDate(calendar.fetchedAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EconomicCalendarRow({ item }: { item: EconomicCalendarItem }) {
  const actualClass =
    item.actualTone === "positive"
      ? "text-bull"
      : item.actualTone === "negative"
        ? "text-bear"
        : "text-[#c6cad3]";

  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5rem_5rem_5rem_2rem] gap-2 rounded-md px-0 py-1.5 text-sm text-[#c6cad3] transition-colors hover:bg-white/5">
      <div className="font-mono tabular-nums text-[#c6cad3]">{item.time}</div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${calendarImpactDot(item.impact)}`} />
          <span className="truncate font-medium">{item.title}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 pl-4 font-mono text-xs">
          <span className={actualClass}>{item.actual}</span>
          <span className="text-[#8f96a3]">{item.countryCode}</span>
        </div>
      </div>
      <div className={`text-right font-mono tabular-nums ${actualClass}`}>{item.actual}</div>
      <div className="text-right font-mono tabular-nums text-[#c6cad3]">{item.forecast}</div>
      <div className="text-right font-mono tabular-nums text-[#c6cad3]">{item.previous}</div>
      <div className="flex justify-end pt-0.5">
        <span className="h-3.5 w-3.5 border-b-2 border-l-2 border-[#c6cad3]/80" />
      </div>
    </div>
  );
}

function LiveNewsFeedSection({
  loading,
  feed,
  featuredItem,
  remainingItems,
}: {
  loading: boolean;
  feed: NewsFeedResponse;
  featuredItem?: NewsItem;
  remainingItems: NewsItem[];
}) {
  return (
    <section className="min-w-0">
      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(260px,0.3fr)] lg:items-end">
        <SectionHeader
          icon={Newspaper}
          label="Market Headlines"
          title="Live news feed"
          description="Unscheduled headlines sit below the divider, with only urgent high-impact rows highlighted in red."
        />
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-electric">
            <span className="h-2 w-2 rounded-full bg-electric" />
            Breaking Desk
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Scan this section for reactive news after the scheduled calendar lane.
          </p>
        </div>
      </div>

      {loading ? (
        <StatusCard
          icon={Loader2}
          title="Loading headlines"
          description="Fetching the latest market headlines."
          spinning
        />
      ) : feed.error && !feed.items.length ? (
        <StatusCard
          icon={AlertCircle}
          title="News feed unavailable"
          description="The news feed is unavailable right now."
        />
      ) : !feed.items.length ? (
        <StatusCard
          icon={Newspaper}
          title="No headlines found"
          description="The feed did not return any headlines at this moment."
        />
      ) : (
        <div className="grid gap-5">
          {feed.isStale && (
            <div className="flex items-start gap-2 rounded-xl border border-gold/35 bg-gold/10 p-4 text-sm text-gold">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Showing recently cached headlines while the live feed cools down.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/45 shadow-[0_24px_80px_-48px_oklch(0.68_0.19_250/0.45)]">
            <div className="flex flex-col gap-2 border-b border-border/60 bg-card/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-bull animate-pulse" />
                Live tape
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] tracking-normal text-muted-foreground">
                  {feed.items.length} today
                </span>
              </div>
              {feed.fetchedAt && (
                <span className="text-xs text-muted-foreground">
                  Refreshed {formatDate(feed.fetchedAt)}
                </span>
              )}
            </div>
            <div className="max-h-[72vh] divide-y divide-border/60 overflow-y-auto overscroll-contain">
              {[featuredItem, ...remainingItems].filter(Boolean).map((item, index) => (
                <NewsCard key={(item as NewsItem).id} item={item as NewsItem} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div {...fadeUp} className="mb-5">
      <Badge variant="outline" className="glass mb-3 gap-2 border-primary/40 text-xs">
        <Icon className="h-3.5 w-3.5 text-electric" />
        {label}
      </Badge>
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const impact = item.impact;
  const isHighImpact = impact === "high";

  return (
    <motion.article
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: Math.min(index * 0.018, 0.16) }}
      className={`group relative grid gap-3 px-4 py-4 transition-colors hover:bg-white/[0.035] sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:px-5 ${
        isHighImpact ? "bg-bear/10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:block">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold ${
            isHighImpact
              ? "border-bear/45 bg-bear/15 text-bear"
              : "border-primary/35 bg-primary/10 text-electric"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isHighImpact ? "bg-bear" : "bg-electric"}`} />
          {isHighImpact ? "Urgent" : "News"}
        </div>
        {item.publishedAt && (
          <div className="mt-0 font-mono text-xs text-muted-foreground sm:mt-3">
            {formatDate(item.publishedAt)}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <NewsMeta item={item} impact={impact} inverted={false} />
        <h3
          className={`mt-2 font-display text-lg font-bold leading-snug tracking-tight sm:text-xl ${
            isHighImpact ? "text-bear" : "text-foreground"
          }`}
        >
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}

function NewsMeta({
  item,
  impact = item.impact,
  inverted = false,
}: {
  item: NewsItem;
  impact?: NewsImpact;
  inverted?: boolean;
}) {
  const labels = item.impactTags.length ? item.impactTags : [item.category || "Market News"];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <ImpactBadge impact={impact} inverted={inverted} />
      {labels.slice(0, 2).map((label) => (
        <Badge
          key={label}
          variant="outline"
          className={
            impact === "high"
              ? "border-bear/40 bg-bear/10 text-bear"
              : "border-primary/35 bg-primary/10 text-electric"
          }
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}

function ImpactLegend() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-2 rounded-full border border-bear/50 bg-bear px-3 py-1.5 font-semibold text-white">
        <span className="h-2.5 w-2.5 rounded-full bg-bear" />
        Urgent high-impact row
      </span>
    </div>
  );
}

function ImpactBadge({ impact, inverted = false }: { impact: NewsImpact; inverted?: boolean }) {
  const isHigh = impact === "high";

  if (!isHigh) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${
        inverted ? "border-white/30 bg-black/10 text-white" : "border-bear/40 bg-bear/10 text-bear"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${inverted ? "bg-white" : "bg-bear"}`} />
      High impact
    </span>
  );
}

function StatusCard({
  icon: Icon,
  title,
  description,
  spinning = false,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
  spinning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
        <Icon className={`h-6 w-6 ${spinning ? "animate-spin" : ""}`} />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function parseRssItems(xml: string): NewsItem[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches
    .map((itemXml, index) => {
      const title = cleanNewsTitle(cleanXmlText(readXmlTag(itemXml, "title")));
      const link = cleanXmlText(readXmlTag(itemXml, "link")) || FINANCIAL_JUICE_HOME;
      const description = cleanXmlText(readXmlTag(itemXml, "description"));
      const publishedAt = cleanXmlText(readXmlTag(itemXml, "pubDate"));
      const category = cleanXmlText(readXmlTag(itemXml, "category")) || "Market News";
      const guid = cleanXmlText(readXmlTag(itemXml, "guid")) || `${link}-${index}`;

      return {
        id: guid,
        title,
        description,
        link,
        publishedAt,
        category,
        impact: "watch",
        impactTags: [],
      };
    })
    .filter((item) => item.title);
}

function getCurrentFinancialJuiceDayItems(items: NewsItem[]) {
  if (!items.length) return [];

  const currentDayKey = getNewsDayKey(items[0].publishedAt);
  if (!currentDayKey) return items;

  const currentDayItems = items.filter((item) => getNewsDayKey(item.publishedAt) === currentDayKey);

  return currentDayItems.length ? currentDayItems : items;
}

function getNewsDayKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parseFinancialJuiceInfoToken(html: string) {
  return html.match(/var\s+info\s*=\s*'([^']+)'/)?.[1] ?? "";
}

function parseFinancialJuiceStartupJson(rawStartup: string) {
  const xmlStringMatch = rawStartup.match(/<string\b[^>]*>([\s\S]*?)<\/string>/i);
  const encodedJson = xmlStringMatch?.[1] ?? rawStartup;

  return decodeXmlEntities(encodedJson).trim();
}

function parseFinancialJuiceStartupData(startupJson: string) {
  const parsed = JSON.parse(startupJson) as Record<string, unknown>;

  if (typeof parsed.d === "string") {
    return JSON.parse(parsed.d) as Record<string, unknown>;
  }

  return parsed;
}

function getFinancialJuiceCalendarRows(startupData: Record<string, unknown>) {
  const filteredRows = startupData.CalFil;
  const calendarRows = startupData.Cal;
  const eventRows = startupData.CEvents;

  if (Array.isArray(filteredRows)) return filteredRows;
  if (Array.isArray(calendarRows)) return calendarRows;
  if (Array.isArray(eventRows)) return eventRows;

  return [];
}

function parseFinancialJuiceCalendarItems(items: unknown[]): EconomicCalendarItem[] {
  let currentDateLabel = "";
  let currentDateKey = "";

  return items
    .map((item) => {
      const dateFromSource = extractFinancialJuiceDisplayDate(item);

      if (dateFromSource) {
        const realDateFromSource =
          item && typeof item === "object"
            ? valueToString(
                (item as Record<string, unknown>).RealDate ||
                  (item as Record<string, unknown>).Date,
              )
            : "";

        currentDateLabel = dateFromSource;
        currentDateKey = buildFinancialJuiceDateKey(dateFromSource, realDateFromSource);
      }

      const parsedItem = parseFinancialJuiceCalendarItem(item, {
        dateLabel: currentDateLabel,
        dateKey: currentDateKey,
      });

      return parsedItem;
    })
    .filter((item): item is EconomicCalendarItem => Boolean(item))
    .filter((item) => ALLOWED_CALENDAR_COUNTRIES.has(item.countryCode));
}

function parseFinancialJuiceCalendarItem(
  item: unknown,
  inheritedDate: { dateLabel: string; dateKey: string },
): EconomicCalendarItem | null {
  if (!item || typeof item !== "object") return null;

  const event = item as Record<string, unknown>;
  const title = valueToString(event.Title || event.FJTitle);
  const id = valueToString(event.ID || `${title}-${event.RealDate || event.Time}`);

  if (!title || !id) return null;

  const actual = normalizeCalendarValue(event.Actual);
  const forecast = normalizeCalendarValue(event.Forecast);
  const previous = normalizeCalendarValue(event.Previous);
  const impact = parseCalendarImpact(event.ImpID);
  const displayDate = valueToString(event.DisplayDate);
  const realDate = valueToString(event.RealDate || event.Date);
  const fallbackDateLabel = formatCalendarDateLabel(realDate);
  const dateLabel = displayDate || inheritedDate.dateLabel || fallbackDateLabel;
  const dateKey =
    displayDate || !inheritedDate.dateKey
      ? buildFinancialJuiceDateKey(dateLabel, realDate)
      : inheritedDate.dateKey;
  const time = valueToString(event.Time) || "--:--";

  return {
    id,
    dateLabel,
    dateKey,
    time,
    title,
    countryCode: valueToString(event.CountryCode).toUpperCase() || "US",
    impact,
    actual,
    forecast,
    previous,
    actualTone: getActualTone(actual, forecast || previous),
    realDate,
    sortValue: buildCalendarSortValue(dateKey, time),
  };
}

function extractFinancialJuiceDisplayDate(item: unknown) {
  if (!item || typeof item !== "object") return "";

  const event = item as Record<string, unknown>;

  return valueToString(
    event.DisplayDate ||
      event.displayDate ||
      event.EventDateLabel ||
      event.DateLabel ||
      event.DateDisplay,
  );
}

function buildFinancialJuiceDateKey(dateLabel: string, realDate: string) {
  const labelDateKey = parseFinancialJuiceDateLabel(dateLabel, realDate);
  if (labelDateKey) return labelDateKey;

  const realDateValue = new Date(realDate);
  if (!Number.isNaN(realDateValue.getTime())) {
    return toDateKey(realDateValue);
  }

  return "upcoming";
}

function parseFinancialJuiceDateLabel(dateLabel: string, realDate: string) {
  const normalizedLabel = dateLabel.trim();
  if (!normalizedLabel) return "";

  const realDateValue = new Date(realDate);
  const currentDate = new Date();
  const referenceDate = Number.isNaN(realDateValue.getTime()) ? currentDate : realDateValue;

  if (/^today$/i.test(normalizedLabel)) {
    return toDateKey(referenceDate);
  }

  if (/^tomorrow$/i.test(normalizedLabel)) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateKey(tomorrow);
  }

  const parsedWithReferenceYear = new Date(`${normalizedLabel} ${referenceDate.getFullYear()}`);
  if (!Number.isNaN(parsedWithReferenceYear.getTime())) {
    return toDateKey(parsedWithReferenceYear);
  }

  return "";
}

function buildCalendarSortValue(dateKey: string, time: string) {
  if (dateKey === "upcoming") return Number.MAX_SAFE_INTEGER;

  const dateMatch = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return Number.MAX_SAFE_INTEGER;

  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  const hours = timeMatch ? Number.parseInt(timeMatch[1], 10) : 0;
  const minutes = timeMatch ? Number.parseInt(timeMatch[2], 10) : 0;

  return Date.UTC(
    Number.parseInt(dateMatch[1], 10),
    Number.parseInt(dateMatch[2], 10) - 1,
    Number.parseInt(dateMatch[3], 10),
    hours,
    minutes,
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function groupCalendarEvents(items: EconomicCalendarItem[]) {
  const groups: Array<{ dateLabel: string; items: EconomicCalendarItem[] }> = [];

  items.forEach((item) => {
    const existingGroup = groups.find((group) => group.dateLabel === item.dateLabel);

    if (existingGroup) {
      existingGroup.items.push(item);
      return;
    }

    groups.push({ dateLabel: item.dateLabel, items: [item] });
  });

  return groups;
}

function parseCalendarImpact(value: unknown): CalendarImpact {
  const impactId = valueToString(value);

  if (impactId === "1") return "high";
  if (impactId === "2") return "medium";

  return "low";
}

function calendarImpactDot(impact: CalendarImpact) {
  if (impact === "high") return "bg-bear";
  if (impact === "medium") return "bg-gold";
  return "bg-[#f5d142]";
}

function getActualTone(actual: string, benchmark: string) {
  const actualNumber = parseCalendarNumber(actual);
  const benchmarkNumber = parseCalendarNumber(benchmark);

  if (actualNumber === null || benchmarkNumber === null) return "neutral";
  if (actualNumber > benchmarkNumber) return "positive";
  if (actualNumber < benchmarkNumber) return "negative";

  return "neutral";
}

function parseCalendarNumber(value: string) {
  if (!value || value === "-") return null;

  const parsed = Number.parseFloat(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeCalendarValue(value: unknown) {
  const nextValue = valueToString(value);
  return nextValue || "-";
}

function valueToString(value: unknown) {
  if (value === null || typeof value === "undefined") return "";
  return cleanXmlText(String(value));
}

function formatCalendarDateLabel(value: unknown) {
  const date = new Date(valueToString(value));

  if (Number.isNaN(date.getTime())) return "Upcoming";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "2-digit",
  }).format(date);
}

async function enrichNewsItemsWithFinancialJuiceImpact(items: NewsItem[]) {
  return mapWithConcurrency(items, 4, enrichNewsItemWithFinancialJuiceImpact);
}

async function enrichNewsItemWithFinancialJuiceImpact(item: NewsItem): Promise<NewsItem> {
  try {
    const response = await fetch(item.link || FINANCIAL_JUICE_HOME, {
      headers: {
        Accept: "text/html, text/plain",
        "User-Agent": "ZacTrades news reader",
      },
    });

    if (!response.ok) {
      return item;
    }

    const html = await response.text();
    const labels = parseFinancialJuiceNewsLabels(html);
    const highImpactTags = getHighImpactNewsTags(labels);

    return {
      ...item,
      impact: highImpactTags.length ? "high" : "watch",
      impactTags: highImpactTags,
      category: highImpactTags[0] ?? item.category,
    };
  } catch {
    return item;
  }
}

async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<U>,
) {
  const results: U[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      }
    }),
  );

  return results;
}

function parseFinancialJuiceNewsLabels(html: string) {
  const labelMatches =
    html.match(/<span\b[^>]*class=["'][^"']*\bnews-label\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi) ??
    [];

  return Array.from(
    new Set(
      labelMatches
        .map((labelHtml) => cleanXmlText(labelHtml))
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  );
}

const HIGH_IMPACT_LABEL_PATTERNS = [
  /\bbreaking\b/i,
  /\burgent\b/i,
  /\balert\b/i,
  /\bhigh[-\s]?impact\b/i,
];

function getHighImpactNewsTags(labels: string[]) {
  const highImpactLabels = labels.filter((label) =>
    HIGH_IMPACT_LABEL_PATTERNS.some((pattern) => pattern.test(label)),
  );

  if (highImpactLabels.length) {
    return highImpactLabels.slice(0, 3);
  }

  return [];
}

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

function cleanXmlText(value: string) {
  return decodeHtml(stripHtml(value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, ""))).trim();
}

function cleanNewsTitle(value: string) {
  return value.replace(/^financial\s*juice\s*:\s*/i, "").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isNaN(parsed) ? entity : String.fromCharCode(parsed);
    }

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function decodeXmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isNaN(parsed) ? entity : String.fromCharCode(parsed);
    }

    const namedEntities: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      nbsp: " ",
    };

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
