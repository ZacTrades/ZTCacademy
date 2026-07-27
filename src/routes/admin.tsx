import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeDollarSign,
  BadgePercent,
  Check,
  Loader2,
  Lock,
  MessageCircle,
  Newspaper,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Plus,
  Printer,
  Radio,
  UserCog,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  defaultCoachingPlans,
  type CoachingPlanRow,
  type CoachingPlanSlug,
} from "@/components/site/coachingPlans";
import {
  defaultBlogPosts,
  defaultCommunitySocials,
  defaultIndicators,
  defaultPropFirms,
  defaultTradingTools,
  type BlogPostRow,
  type CommunitySocialRow,
  type IndicatorRow,
  type PropFirmRow,
  type TradingToolRow,
} from "@/components/site/editableContent";
import { AuthDialog } from "@/components/site/AuthDialog";
import { Footer } from "@/components/site/Footer";
import {
  defaultLiveTradingPackageRows,
  type LiveTradingPackageRow,
} from "@/components/site/liveTradingPackages";
import { Navbar } from "@/components/site/Navbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import logoUrl from "@/assets/zactrades-logo4-clean.png";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | ZacTrades" },
      {
        name: "description",
        content: "ZacTrades admin controls for coaching plan pricing.",
      },
    ],
  }),
  component: AdminPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const BLOG_PDF_BUCKET = "blog-pdfs";

type EditablePlan = CoachingPlanRow & {
  featuresText: string;
};

type EditableTool = TradingToolRow & {
  highlightsText: string;
};

type EditablePropFirm = PropFirmRow & {
  featuresText: string;
};

type EditableBlogPost = BlogPostRow;

type EditableCommunitySocial = CommunitySocialRow;

type ProfileRole = "member" | "moderator" | "admin";
type MembershipStatus = "unpaid" | "pending" | "paid" | "expired" | "cancelled";

type UserMembershipRow = {
  user_id: string;
  plan_slug: CoachingPlanSlug;
  status: MembershipStatus;
  payment_provider: string | null;
  provider_customer_id: string | null;
  provider_checkout_id: string | null;
  provider_subscription_id: string | null;
  amount_label: string | null;
  paid_at: string | null;
  access_starts_at: string | null;
  access_expires_at: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type UserNewsSubscriptionRow = {
  user_id: string;
  status: MembershipStatus;
  payment_provider: string | null;
  provider_customer_id: string | null;
  provider_checkout_id: string | null;
  provider_subscription_id: string | null;
  amount_label: string | null;
  paid_at: string | null;
  access_starts_at: string | null;
  access_expires_at: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type UserLiveTradingAccessRow = {
  user_id: string;
  package_slug: string | null;
  duration_label: string | null;
  status: MembershipStatus;
  payment_provider: string | null;
  provider_customer_id: string | null;
  provider_checkout_id: string | null;
  amount_label: string | null;
  paid_at: string | null;
  access_starts_at: string | null;
  access_expires_at: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type UserProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  discord_username: string | null;
  discord_user_id: string | null;
  discord_avatar_url: string | null;
  discord_connected_at: string | null;
  discord_guild_joined_at: string | null;
  discord_last_role_sync_at: string | null;
  discord_role_sync_status: string | null;
  discord_role_sync_error: string | null;
  role: ProfileRole;
  memberships: Record<CoachingPlanSlug, UserMembershipRow>;
  newsSubscription: UserNewsSubscriptionRow;
  liveTradingAccess: UserLiveTradingAccessRow;
  created_at: string;
  updated_at: string;
};

type BasicProfileRow = Omit<
  UserProfileRow,
  "memberships" | "newsSubscription" | "liveTradingAccess"
>;

type AdminPanelKey =
  | "blog"
  | "staff"
  | "communityMembers"
  | "community"
  | "propfirms"
  | "coaching"
  | "live"
  | "indicators"
  | "tools";

const mentorshipMembershipPlans = [
  { slug: "one_to_one" as const, label: "1-to-1 Coaching" },
  { slug: "group" as const, label: "Training Group Coaching" },
];

const membershipStatusOptions: Array<{ value: MembershipStatus; label: string }> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const staffVisiblePanelKeys: AdminPanelKey[] = ["communityMembers"];

function AdminPage() {
  const { user, loading, isConfigured, isAdmin, isStaff, role } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [livePackages, setLivePackages] = useState<LiveTradingPackageRow[]>([]);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [tools, setTools] = useState<EditableTool[]>([]);
  const [propFirms, setPropFirms] = useState<EditablePropFirm[]>([]);
  const [blogPosts, setBlogPosts] = useState<EditableBlogPost[]>([]);
  const [communitySocials, setCommunitySocials] = useState<EditableCommunitySocial[]>([]);
  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [activePanel, setActivePanel] = useState<AdminPanelKey>("staff");
  const [blogCreateOpen, setBlogCreateOpen] = useState(false);
  const [propFirmDeleteTarget, setPropFirmDeleteTarget] = useState<EditablePropFirm | null>(null);
  const [fetching, setFetching] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase || !user || !isStaff) return;

    let mounted = true;
    setFetching(true);
    setErrorMessage("");

    async function loadAdminContent() {
      if (!supabase) return;

      try {
        const [
          coachingResult,
          liveResult,
          indicatorsResult,
          toolsResult,
          blogResult,
          firmsResult,
          communityResult,
          profilesResult,
          membershipsResult,
          newsSubscriptionsResult,
          liveAccessResult,
        ] = await Promise.all([
          supabase
            .from("coaching_plans")
            .select(
              "slug,title,description,display_price,promotion_enabled,promotion_label,promotion_original_price,promotion_note,promotion_ends_at,duration,checkout_price,checkout_monthly_label,features,cta_label,is_featured,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("live_trading_packages")
            .select(
              "slug,duration,price,monthly_label,original_price,badge,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("premium_indicators")
            .select("slug,name,description,tag,stats_label,tradingview_url,is_active,display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("trading_tools")
            .select(
              "slug,name,category,description,promo_code,discount,url,highlights,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("blog_posts")
            .select(
              "slug,title,category,published_date,read_time,excerpt,content,pdf_url,is_featured,is_published,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("prop_firms")
            .select(
              "slug,name,description,logo,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("community_socials")
            .select("slug,name,handle,description,icon_key,url,tone_key,is_active,display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("profiles")
            .select(
              "id,full_name,email,phone_number,discord_username,discord_user_id,discord_avatar_url,discord_connected_at,discord_guild_joined_at,discord_last_role_sync_at,discord_role_sync_status,discord_role_sync_error,role,created_at,updated_at",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("user_memberships")
            .select(
              "user_id,plan_slug,status,payment_provider,provider_customer_id,provider_checkout_id,provider_subscription_id,amount_label,paid_at,access_starts_at,access_expires_at,notes,created_at,updated_at",
            )
            .order("updated_at", { ascending: false }),
          supabase
            .from("user_news_subscriptions")
            .select(
              "user_id,status,payment_provider,provider_customer_id,provider_checkout_id,provider_subscription_id,amount_label,paid_at,access_starts_at,access_expires_at,notes,created_at,updated_at",
            )
            .order("updated_at", { ascending: false }),
          supabase
            .from("user_live_trading_access")
            .select(
              "user_id,package_slug,duration_label,status,payment_provider,provider_customer_id,provider_checkout_id,amount_label,paid_at,access_starts_at,access_expires_at,notes,created_at,updated_at",
            )
            .order("updated_at", { ascending: false }),
        ]);

        if (!mounted) return;

        const firstError =
          coachingResult.error ||
          liveResult.error ||
          indicatorsResult.error ||
          toolsResult.error ||
          blogResult.error ||
          firmsResult.error ||
          communityResult.error ||
          profilesResult.error ||
          membershipsResult.error ||
          newsSubscriptionsResult.error ||
          liveAccessResult.error;

        if (firstError) {
          console.error(firstError);
          setErrorMessage(firstError.message);
        }

        setPlans(
          coachingResult.data?.length
            ? coachingResult.data.map((row) => toEditablePlan(row as CoachingPlanRow))
            : defaultEditablePlans(),
        );
        setLivePackages(
          liveResult.data?.length
            ? (liveResult.data as LiveTradingPackageRow[])
            : defaultLiveTradingPackageRows,
        );
        setIndicators(
          indicatorsResult.data?.length
            ? (indicatorsResult.data as IndicatorRow[])
            : defaultIndicators,
        );
        setTools(
          toolsResult.data?.length
            ? (toolsResult.data as TradingToolRow[]).map(toEditableTool)
            : defaultTradingTools.map(toEditableTool),
        );
        setBlogPosts(
          blogResult.data?.length ? (blogResult.data as BlogPostRow[]) : defaultBlogPosts,
        );
        setPropFirms(
          firmsResult.data?.length
            ? (firmsResult.data as PropFirmRow[]).map(toEditablePropFirm)
            : defaultPropFirms.map(toEditablePropFirm),
        );
        setCommunitySocials(
          communityResult.data?.length
            ? (communityResult.data as CommunitySocialRow[])
            : defaultCommunitySocials,
        );
        setProfiles(
          buildUserProfiles(
            (profilesResult.data as BasicProfileRow[]) ?? [],
            (membershipsResult.data as UserMembershipRow[]) ?? [],
            (newsSubscriptionsResult.data as UserNewsSubscriptionRow[]) ?? [],
            (liveAccessResult.data as UserLiveTradingAccessRow[]) ?? [],
          ),
        );
      } catch (error) {
        console.error(error);
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load admin content.");
          setPlans(defaultEditablePlans());
          setLivePackages(defaultLiveTradingPackageRows);
          setIndicators(defaultIndicators);
          setTools(defaultTradingTools.map(toEditableTool));
          setBlogPosts(defaultBlogPosts);
          setPropFirms(defaultPropFirms.map(toEditablePropFirm));
          setCommunitySocials(defaultCommunitySocials);
          setProfiles([]);
        }
      } finally {
        if (mounted) {
          setFetching(false);
        }
      }
    }

    void loadAdminContent();

    return () => {
      mounted = false;
    };
  }, [isStaff, user]);

  const updatePlan = (slug: CoachingPlanSlug, patch: Partial<EditablePlan>) => {
    setPlans((current) =>
      current.map((plan) => (plan.slug === slug ? { ...plan, ...patch } : plan)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateLivePackage = (slug: string, patch: Partial<LiveTradingPackageRow>) => {
    setLivePackages((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateIndicator = (slug: string, patch: Partial<IndicatorRow>) => {
    setIndicators((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateTool = (slug: string, patch: Partial<EditableTool>) => {
    setTools((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updatePropFirm = (slug: string, patch: Partial<EditablePropFirm>) => {
    setPropFirms((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateBlogPost = (slug: string, patch: Partial<EditableBlogPost>) => {
    setBlogPosts((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateCommunitySocial = (slug: string, patch: Partial<EditableCommunitySocial>) => {
    setCommunitySocials((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateProfile = (id: string, patch: Partial<UserProfileRow>) => {
    setProfiles((current) =>
      current.map((profile) => (profile.id === id ? { ...profile, ...patch } : profile)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateMembership = (
    id: string,
    planSlug: CoachingPlanSlug,
    patch: Partial<UserMembershipRow>,
  ) => {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === id
          ? {
              ...profile,
              memberships: {
                ...profile.memberships,
                [planSlug]: {
                  ...profile.memberships[planSlug],
                  ...patch,
                },
              },
            }
          : profile,
      ),
    );
    setMessage("");
    setErrorMessage("");
  };

  const addBlogPost = () => {
    setBlogCreateOpen(true);
    setMessage("");
    setErrorMessage("");
  };

  const createBlogPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const manualSlug = String(formData.get("slug") ?? "").trim();
    const slug = slugify(manualSlug || title);
    const pdfFile = formData.get("pdf_file");
    const manualPdfUrl = String(formData.get("pdf_url") ?? "").trim();
    const nextOrder = blogPosts.length
      ? Math.max(...blogPosts.map((post) => post.display_order)) + 1
      : 1;

    setSavingKey("blog:create");
    setMessage("");
    setErrorMessage("");

    let pdfUrl = manualPdfUrl || null;

    try {
      pdfUrl = (await uploadBlogPdf(pdfFile, slug)) ?? pdfUrl;
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload blog PDF.");
      setSavingKey(null);
      return;
    }

    const payload: BlogPostRow = {
      slug,
      title,
      category: String(formData.get("category") ?? "").trim(),
      published_date: String(formData.get("published_date") ?? "").trim(),
      read_time: String(formData.get("read_time") ?? "").trim(),
      excerpt: String(formData.get("excerpt") ?? "").trim(),
      content: String(formData.get("content") ?? "").trim(),
      pdf_url: pdfUrl,
      is_featured: formData.get("is_featured") === "on",
      is_published: formData.get("is_published") === "on",
      display_order: nextOrder,
    };

    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select(
        "slug,title,category,published_date,read_time,excerpt,content,pdf_url,is_featured,is_published,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setBlogPosts((current) => [data as BlogPostRow, ...current]);
      setMessage(`${payload.title} blog post created.`);
      setBlogCreateOpen(false);
    }

    setSavingKey(null);
  };

  const savePlan = async (event: FormEvent<HTMLFormElement>, plan: EditablePlan) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`coaching:${plan.slug}`);
    setMessage("");
    setErrorMessage("");

    const features = plan.featuresText
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    const payload: CoachingPlanRow = {
      slug: plan.slug,
      title: plan.title.trim(),
      description: plan.description.trim(),
      display_price: plan.display_price.trim(),
      promotion_enabled: plan.promotion_enabled,
      promotion_label: plan.promotion_label?.trim() || null,
      promotion_original_price: plan.promotion_original_price?.trim() || null,
      promotion_note: plan.promotion_note?.trim() || null,
      promotion_ends_at: plan.promotion_ends_at?.trim() || null,
      duration: plan.duration.trim(),
      checkout_price: plan.checkout_price.trim(),
      checkout_monthly_label: plan.checkout_monthly_label.trim(),
      features,
      cta_label: plan.cta_label.trim(),
      is_featured: plan.is_featured,
      is_active: plan.is_active,
      display_order: plan.display_order,
    };

    const { data, error } = await supabase
      .from("coaching_plans")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,title,description,display_price,promotion_enabled,promotion_label,promotion_original_price,promotion_note,promotion_ends_at,duration,checkout_price,checkout_monthly_label,features,cta_label,is_featured,is_active,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setPlans((current) =>
        current.map((item) => (item.slug === plan.slug ? toEditablePlan(data) : item)),
      );
      setMessage(`${payload.title} updated.`);
    }

    setSavingKey(null);
  };

  const saveLivePackage = async (
    event: FormEvent<HTMLFormElement>,
    item: LiveTradingPackageRow,
  ) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`live:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const payload: LiveTradingPackageRow = {
      ...item,
      duration: item.duration.trim(),
      price: item.price.trim(),
      monthly_label: item.monthly_label.trim(),
      original_price: item.original_price?.trim() || null,
      badge: item.badge?.trim() || null,
    };

    const { data, error } = await supabase
      .from("live_trading_packages")
      .upsert(payload, { onConflict: "slug" })
      .select("slug,duration,price,monthly_label,original_price,badge,is_active,display_order")
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setLivePackages((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? (data as LiveTradingPackageRow) : currentItem,
        ),
      );
      setMessage(`${payload.duration} live access updated.`);
    }

    setSavingKey(null);
  };

  const saveIndicator = async (event: FormEvent<HTMLFormElement>, item: IndicatorRow) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`indicator:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const payload: IndicatorRow = {
      ...item,
      name: item.name.trim(),
      description: item.description.trim(),
      tag: item.tag.trim(),
      stats_label: item.stats_label.trim(),
      tradingview_url: item.tradingview_url.trim(),
    };

    const { data, error } = await supabase
      .from("premium_indicators")
      .upsert(payload, { onConflict: "slug" })
      .select("slug,name,description,tag,stats_label,tradingview_url,is_active,display_order")
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setIndicators((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? (data as IndicatorRow) : currentItem,
        ),
      );
      setMessage(`${payload.name} indicator updated.`);
    }

    setSavingKey(null);
  };

  const saveTool = async (event: FormEvent<HTMLFormElement>, item: EditableTool) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`tool:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const highlights = item.highlightsText
      .split("\n")
      .map((highlight) => highlight.trim())
      .filter(Boolean);

    const payload: TradingToolRow = {
      slug: item.slug,
      name: item.name.trim(),
      category: item.category.trim(),
      description: item.description.trim(),
      promo_code: item.promo_code.trim(),
      discount: item.discount.trim(),
      url: item.url.trim(),
      highlights,
      is_active: item.is_active,
      display_order: item.display_order,
    };

    const { data, error } = await supabase
      .from("trading_tools")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,name,category,description,promo_code,discount,url,highlights,is_active,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setTools((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? toEditableTool(data as TradingToolRow) : currentItem,
        ),
      );
      setMessage(`${payload.name} tool updated.`);
    }

    setSavingKey(null);
  };

  const savePropFirm = async (event: FormEvent<HTMLFormElement>, item: EditablePropFirm) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`propfirm:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const features = item.featuresText
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    const payload: PropFirmRow = {
      slug: item.slug,
      name: item.name.trim(),
      description: item.description.trim(),
      logo: item.logo.trim(),
      discount: item.discount.trim(),
      promo_code: item.promo_code.trim(),
      color: item.color.trim(),
      rating: Number(item.rating) || 0,
      reviews: Number(item.reviews) || 0,
      max_capital: item.max_capital.trim(),
      profit_split: item.profit_split.trim(),
      payout: item.payout.trim(),
      features,
      url: item.url.trim(),
      is_featured: item.is_featured,
      is_active: item.is_active,
      display_order: item.display_order,
    };

    const { data, error } = await supabase
      .from("prop_firms")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,name,description,logo,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setPropFirms((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? toEditablePropFirm(data as PropFirmRow) : currentItem,
        ),
      );
      setMessage(`${payload.name} prop firm updated.`);
    }

    setSavingKey(null);
  };

  const deletePropFirm = async (item: EditablePropFirm) => {
    if (!supabase) return;

    setSavingKey(`propfirm:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("prop_firms").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setPropFirms((current) => current.filter((currentItem) => currentItem.slug !== item.slug));
      setMessage(`${item.name} deleted.`);
    }

    setPropFirmDeleteTarget(null);
    setSavingKey(null);
  };

  const saveBlogPost = async (event: FormEvent<HTMLFormElement>, item: EditableBlogPost) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`blog:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const pdfFile = formData.get("pdf_file");
    const manualPdfUrl = String(formData.get("pdf_url") ?? "").trim();
    const nextSlug = item.slug.trim();
    let pdfUrl = manualPdfUrl || item.pdf_url || null;

    try {
      pdfUrl = (await uploadBlogPdf(pdfFile, nextSlug)) ?? pdfUrl;
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload blog PDF.");
      setSavingKey(null);
      return;
    }

    const payload: BlogPostRow = {
      ...item,
      slug: nextSlug,
      title: item.title.trim(),
      category: item.category.trim(),
      published_date: item.published_date.trim(),
      read_time: item.read_time.trim(),
      excerpt: item.excerpt.trim(),
      content: item.content.trim(),
      pdf_url: pdfUrl,
    };

    const { data, error } = await supabase
      .from("blog_posts")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,title,category,published_date,read_time,excerpt,content,pdf_url,is_featured,is_published,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setBlogPosts((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? (data as BlogPostRow) : currentItem,
        ),
      );
      setMessage(`${payload.title} blog post updated.`);
    }

    setSavingKey(null);
  };

  const saveCommunitySocial = async (
    event: FormEvent<HTMLFormElement>,
    item: EditableCommunitySocial,
  ) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`community:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const payload: CommunitySocialRow = {
      ...item,
      slug: item.slug.trim(),
      name: item.name.trim(),
      handle: item.handle.trim(),
      description: item.description.trim(),
      icon_key: item.icon_key.trim(),
      url: item.url.trim(),
      tone_key: item.tone_key.trim(),
    };

    const { data, error } = await supabase
      .from("community_socials")
      .upsert(payload, { onConflict: "slug" })
      .select("slug,name,handle,description,icon_key,url,tone_key,is_active,display_order")
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setCommunitySocials((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? (data as CommunitySocialRow) : currentItem,
        ),
      );
      setMessage(`${payload.name} community card updated.`);
    }

    setSavingKey(null);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`profile:${profile.id}`);
    setMessage("");
    setErrorMessage("");

    const payload = {
      full_name: profile.full_name?.trim() || null,
      phone_number: profile.phone_number?.trim() || null,
      discord_username: profile.discord_username?.trim() || null,
      role: profile.role,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id)
      .select(
        "id,full_name,email,phone_number,discord_username,discord_user_id,discord_avatar_url,discord_connected_at,discord_guild_joined_at,discord_last_role_sync_at,discord_role_sync_status,discord_role_sync_error,role,created_at,updated_at",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSavingKey(null);
      return;
    }

    const membershipPayload = mentorshipMembershipPlans.map(({ slug }) => {
      const membership = profile.memberships[slug];

      return {
        user_id: profile.id,
        plan_slug: slug,
        status: membership.status,
        payment_provider: membership.payment_provider?.trim() || null,
        provider_customer_id: membership.provider_customer_id?.trim() || null,
        provider_checkout_id: membership.provider_checkout_id?.trim() || null,
        provider_subscription_id: membership.provider_subscription_id?.trim() || null,
        amount_label: membership.amount_label?.trim() || null,
        paid_at:
          membership.status === "paid" && !membership.paid_at
            ? new Date().toISOString()
            : membership.paid_at,
        access_starts_at: membership.access_starts_at || null,
        access_expires_at: membership.access_expires_at || null,
        notes: membership.notes?.trim() || null,
      };
    });

    const { data: membershipData, error: membershipError } = await supabase
      .from("user_memberships")
      .upsert(membershipPayload, { onConflict: "user_id,plan_slug" })
      .select(
        "user_id,plan_slug,status,payment_provider,provider_customer_id,provider_checkout_id,provider_subscription_id,amount_label,paid_at,access_starts_at,access_expires_at,notes,created_at,updated_at",
      );

    if (membershipError) {
      console.error(membershipError);
      setErrorMessage(membershipError.message);
    } else if (data) {
      const nextProfile = {
        ...(data as BasicProfileRow),
        memberships: membershipsFromRows(profile.id, (membershipData as UserMembershipRow[]) ?? []),
        newsSubscription: profile.newsSubscription,
      };

      setProfiles((current) =>
        current.map((currentProfile) =>
          currentProfile.id === profile.id ? nextProfile : currentProfile,
        ),
      );
      setMessage(`${profile.email ?? profile.full_name ?? "User"} updated.`);
    }

    setSavingKey(null);
  };

  const openAuth = () => {
    setAuthMode("signin");
    setAuthOpen(true);
  };

  const teamProfiles = profiles.filter((profile) => profile.role !== "member");
  const memberProfiles = profiles.filter((profile) => profile.role === "member");
  const paidMemberProfiles = memberProfiles.filter(hasPaidMentorship);
  const paidNewsProfiles = memberProfiles.filter(hasPaidNewsSubscription);
  const registeredMemberProfiles = memberProfiles.filter((profile) => !hasPaidMentorship(profile));

  const adminPanels = [
    {
      key: "staff" as const,
      title: "Staff Members",
      description: "Give members moderator or admin access.",
      count: teamProfiles.length,
      icon: ShieldCheck,
    },
    {
      key: "communityMembers" as const,
      title: "Community Members",
      description: "Registered, paid, and news members in one place.",
      count: memberProfiles.length,
      icon: UserCog,
    },
    {
      key: "blog" as const,
      title: "ZacTrades Blog",
      description: "Publish market notes and education posts.",
      count: blogPosts.length,
      icon: Newspaper,
    },
    {
      key: "community" as const,
      title: "ZacTrades Community",
      description: "Edit social cards and community links.",
      count: communitySocials.length,
      icon: MessageCircle,
    },
    {
      key: "propfirms" as const,
      title: "Propfirms",
      description: "Edit partner firms, codes, and discounts.",
      count: propFirms.length,
      icon: BadgePercent,
    },
    {
      key: "coaching" as const,
      title: "Coaching Promos",
      description: "Manage coaching prices and limited offers.",
      count: plans.length,
      icon: BadgeDollarSign,
    },
    {
      key: "live" as const,
      title: "Live Trading Access",
      description: "Control live-room package pricing.",
      count: livePackages.length,
      icon: Radio,
    },
    {
      key: "indicators" as const,
      title: "Premium Indicators",
      description: "Edit indicator cards and links.",
      count: indicators.length,
      icon: SlidersHorizontal,
    },
    {
      key: "tools" as const,
      title: "Trading Tools",
      description: "Manage tools, discounts, and promo codes.",
      count: tools.length,
      icon: Wrench,
    },
  ];
  const visibleAdminPanels = isAdmin
    ? adminPanels
    : adminPanels.filter((panel) => staffVisiblePanelKeys.includes(panel.key));
  const visibleActivePanel =
    !isAdmin && !staffVisiblePanelKeys.includes(activePanel) ? "communityMembers" : activePanel;

  useEffect(() => {
    if (!isAdmin && isStaff && !staffVisiblePanelKeys.includes(activePanel)) {
      setActivePanel("communityMembers");
    }
  }, [activePanel, isAdmin, isStaff]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/75 to-background" />

          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="max-w-3xl">
              <Badge variant="outline" className="glass mb-5 border-gold/40 text-xs">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-gold" />
                Admin
              </Badge>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Site content <span className="text-gradient-gold">control room.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Edit blog posts, prop firm partners, coaching prices, live trading access, premium
                indicators, trading tools, and member access across the site.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {!isConfigured ? (
              <StatusPanel
                icon={AlertCircle}
                title="Supabase is not configured"
                description="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local before using the admin editor."
              />
            ) : loading || (user && role === null) ? (
              <StatusPanel
                icon={Loader2}
                title="Checking access"
                description="We are verifying your account and admin permissions."
                spinning
              />
            ) : !user ? (
              <StatusPanel
                icon={Lock}
                title="Admin sign in required"
                description="Sign in with an account whose profile role is set to admin."
                action={
                  <Button
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                    onClick={openAuth}
                  >
                    Sign in
                  </Button>
                }
              />
            ) : !isStaff ? (
              <StatusPanel
                icon={Lock}
                title="You do not have staff access"
                description="Your account is signed in, but your profile role is not admin or moderator."
              />
            ) : (
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <AdminStat label="Editor status" value="Live" />
                  <AdminStat
                    label="Managed items"
                    value={`${
                      plans.length +
                      livePackages.length +
                      indicators.length +
                      tools.length +
                      blogPosts.length +
                      propFirms.length +
                      communitySocials.length +
                      profiles.length +
                      paidNewsProfiles.length
                    }`}
                  />
                  <AdminStat label="Role" value={profileRoleLabel(role ?? "member")} />
                </div>

                {message && (
                  <div className="flex items-center gap-2 rounded-xl border border-bull/30 bg-bull/10 p-4 text-sm text-bull">
                    <Check className="h-4 w-4" />
                    {message}
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                {fetching ? (
                  <StatusPanel
                    icon={Loader2}
                    title="Loading admin content"
                    description="Fetching the latest posts, partners, prices, indicators, and tools from Supabase."
                    spinning
                  />
                ) : (
                  <div className="grid gap-8">
                    <AdminPanelChooser
                      panels={visibleAdminPanels}
                      activePanel={visibleActivePanel}
                      onChange={setActivePanel}
                    />

                    {visibleActivePanel === "blog" && (
                      <AdminSection
                        title="ZacTrades Blog"
                        description="Add and edit published posts shown on the ZacTrades Blog page."
                        action={
                          <Button
                            type="button"
                            onClick={addBlogPost}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Blog Post
                          </Button>
                        }
                      >
                        {blogPosts.map((item) => (
                          <BlogPostEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `blog:${item.slug}`}
                            onChange={updateBlogPost}
                            onSubmit={saveBlogPost}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "coaching" && (
                      <AdminSection
                        title="Coaching Prices & Promotions"
                        description="Edit 1-to-1 coaching and group coaching pricing, promo labels, original prices, and campaign notes."
                      >
                        {plans.map((plan) => (
                          <PlanEditor
                            key={plan.slug}
                            plan={plan}
                            saving={savingKey === `coaching:${plan.slug}`}
                            onChange={updatePlan}
                            onSubmit={savePlan}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "staff" && (
                      <AdminSection
                        title="Staff Members"
                        description="Promote trusted users to moderator, manage admins, and keep staff access organized."
                        contentClassName="grid-cols-1"
                      >
                        <StaffMembersPanel
                          profiles={profiles}
                          currentUserId={user.id}
                          savingKey={savingKey}
                          onChange={updateProfile}
                          onSubmit={saveProfile}
                        />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "communityMembers" && (
                      <AdminSection
                        title="Community Members"
                        description="All registered members, paid mentorship members, and News Desk subscribers in one tab."
                        contentClassName="grid-cols-1"
                      >
                        <CommunityMembersPanel memberProfiles={memberProfiles} />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "community" && (
                      <AdminSection
                        title="ZacTrades Community"
                        description="Edit the social cards shown in the homepage community section."
                      >
                        {communitySocials.map((item) => (
                          <CommunitySocialEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `community:${item.slug}`}
                            onChange={updateCommunitySocial}
                            onSubmit={saveCommunitySocial}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "propfirms" && (
                      <AdminSection
                        title="Propfirms"
                        description="Edit partner firm cards, promo codes, discounts, ratings, and featured status."
                      >
                        {propFirms.map((item) => (
                          <PropFirmEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `propfirm:${item.slug}`}
                            deleting={savingKey === `propfirm:delete:${item.slug}`}
                            onChange={updatePropFirm}
                            onSubmit={savePropFirm}
                            onDelete={(propFirm) => setPropFirmDeleteTarget(propFirm)}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "live" && (
                      <AdminSection
                        title="Live Trading Access"
                        description="Edit live-room package prices and badges."
                      >
                        {livePackages.map((item) => (
                          <LivePackageEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `live:${item.slug}`}
                            onChange={updateLivePackage}
                            onSubmit={saveLivePackage}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "indicators" && (
                      <AdminSection
                        title="Premium Indicators"
                        description="Edit indicator names, tags, descriptions, stats, and TradingView links."
                      >
                        {indicators.map((item) => (
                          <IndicatorEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `indicator:${item.slug}`}
                            onChange={updateIndicator}
                            onSubmit={saveIndicator}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "tools" && (
                      <AdminSection
                        title="Trading Tools"
                        description="Edit the tools used for consistent execution, including discounts and promo codes."
                      >
                        {tools.map((item) => (
                          <ToolEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `tool:${item.slug}`}
                            onChange={updateTool}
                            onSubmit={saveTool}
                          />
                        ))}
                      </AdminSection>
                    )}
                  </div>
                )}
              </div>
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
      <BlogPostCreateDialog
        open={blogCreateOpen}
        saving={savingKey === "blog:create"}
        onOpenChange={setBlogCreateOpen}
        onSubmit={createBlogPost}
      />
      <AlertDialog
        open={Boolean(propFirmDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setPropFirmDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong max-w-md border-border/60 p-0 shadow-2xl">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-bear/20 blur-3xl" />
            <div className="relative p-6">
              <AlertDialogHeader>
                <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-bear/10 text-bear ring-1 ring-bear/30">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <AlertDialogTitle className="font-display text-2xl">
                  Delete prop firm?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {propFirmDeleteTarget?.name ?? "this prop firm"}
                  </span>{" "}
                  from the Propfirms page. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("propfirm:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!propFirmDeleteTarget || savingKey?.startsWith("propfirm:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (propFirmDeleteTarget) void deletePropFirm(propFirmDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("propfirm:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete prop firm
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanEditor({
  plan,
  saving,
  onChange,
  onSubmit,
}: {
  plan: EditablePlan;
  saving: boolean;
  onChange: (slug: CoachingPlanSlug, patch: Partial<EditablePlan>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, plan: EditablePlan) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, plan)}
      className={`glass relative overflow-hidden rounded-2xl p-5 md:p-6 ${
        plan.is_featured ? "border-gold/35" : "border-primary/20"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/40 text-xs">
              {plan.slug === "one_to_one" ? "1-to-1" : "Group"}
            </Badge>
            <h2 className="font-display text-2xl font-bold">{plan.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Visible on the homepage mentorship section.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor={`${plan.slug}-title`} className="text-xs">
              Plan title
            </Label>
            <Input
              id={`${plan.slug}-title`}
              value={plan.title}
              onChange={(event) => onChange(plan.slug, { title: event.target.value })}
              className="mt-1 bg-background/45"
            />
          </div>

          <div>
            <Label htmlFor={`${plan.slug}-description`} className="text-xs">
              Description
            </Label>
            <Textarea
              id={`${plan.slug}-description`}
              value={plan.description}
              onChange={(event) => onChange(plan.slug, { description: event.target.value })}
              className="mt-1 min-h-24 bg-background/45"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${plan.slug}-display-price`} className="text-xs">
                Promo/current homepage price
              </Label>
              <Input
                id={`${plan.slug}-display-price`}
                value={plan.display_price}
                onChange={(event) => onChange(plan.slug, { display_price: event.target.value })}
                placeholder="$499/mo"
                className="mt-1 bg-background/45"
              />
            </div>
            <div>
              <Label htmlFor={`${plan.slug}-checkout-price`} className="text-xs">
                Checkout price
              </Label>
              <Input
                id={`${plan.slug}-checkout-price`}
                value={plan.checkout_price}
                onChange={(event) => onChange(plan.slug, { checkout_price: event.target.value })}
                placeholder="$499"
                className="mt-1 bg-background/45"
              />
            </div>
            <div>
              <Label htmlFor={`${plan.slug}-duration`} className="text-xs">
                Duration
              </Label>
              <Input
                id={`${plan.slug}-duration`}
                value={plan.duration}
                onChange={(event) => onChange(plan.slug, { duration: event.target.value })}
                className="mt-1 bg-background/45"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gold/25 bg-gold/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-display text-lg font-bold">
                  <BadgePercent className="h-5 w-5 text-gold" />
                  Promotion
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Turn on a limited offer without losing the normal/original price.
                </p>
              </div>
              <ToggleButton
                active={plan.promotion_enabled}
                label="Promotion live"
                onClick={() => onChange(plan.slug, { promotion_enabled: !plan.promotion_enabled })}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${plan.slug}-promotion-label`} className="text-xs">
                  Promo badge
                </Label>
                <Input
                  id={`${plan.slug}-promotion-label`}
                  value={plan.promotion_label ?? ""}
                  onChange={(event) => onChange(plan.slug, { promotion_label: event.target.value })}
                  placeholder="Summer promo"
                  className="mt-1 bg-background/45"
                />
              </div>
              <div>
                <Label htmlFor={`${plan.slug}-promotion-original-price`} className="text-xs">
                  Original price
                </Label>
                <Input
                  id={`${plan.slug}-promotion-original-price`}
                  value={plan.promotion_original_price ?? ""}
                  onChange={(event) =>
                    onChange(plan.slug, { promotion_original_price: event.target.value })
                  }
                  placeholder="$699/mo"
                  className="mt-1 bg-background/45"
                />
              </div>
              <div>
                <Label htmlFor={`${plan.slug}-promotion-note`} className="text-xs">
                  Promo note
                </Label>
                <Input
                  id={`${plan.slug}-promotion-note`}
                  value={plan.promotion_note ?? ""}
                  onChange={(event) => onChange(plan.slug, { promotion_note: event.target.value })}
                  placeholder="Limited seats this month"
                  className="mt-1 bg-background/45"
                />
              </div>
              <div>
                <Label htmlFor={`${plan.slug}-promotion-ends`} className="text-xs">
                  Promo end label
                </Label>
                <Input
                  id={`${plan.slug}-promotion-ends`}
                  value={plan.promotion_ends_at ?? ""}
                  onChange={(event) =>
                    onChange(plan.slug, { promotion_ends_at: event.target.value })
                  }
                  placeholder="Ends June 30"
                  className="mt-1 bg-background/45"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor={`${plan.slug}-cta`} className="text-xs">
              Button label
            </Label>
            <Input
              id={`${plan.slug}-cta`}
              value={plan.cta_label}
              onChange={(event) => onChange(plan.slug, { cta_label: event.target.value })}
              className="mt-1 bg-background/45"
            />
          </div>

          <div>
            <Label htmlFor={`${plan.slug}-features`} className="text-xs">
              Features
            </Label>
            <Textarea
              id={`${plan.slug}-features`}
              value={plan.featuresText}
              onChange={(event) => onChange(plan.slug, { featuresText: event.target.value })}
              className="mt-1 min-h-28 bg-background/45"
              placeholder="One feature per line"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}

function AdminPanelChooser({
  panels,
  activePanel,
  onChange,
}: {
  panels: Array<{
    key: AdminPanelKey;
    title: string;
    description: string;
    count: number;
    icon: typeof SlidersHorizontal;
  }>;
  activePanel: AdminPanelKey;
  onChange: (panel: AdminPanelKey) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/25 p-3 md:p-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {panels.map((panel) => {
          const active = panel.key === activePanel;
          return (
            <button
              key={panel.key}
              type="button"
              onClick={() => onChange(panel.key)}
              className={`group min-h-36 rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-gold/50 bg-gold/10 shadow-[0_0_40px_-22px_oklch(0.82_0.14_85)]"
                  : "border-border/50 bg-background/35 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ${
                    active
                      ? "bg-gold/15 text-gold ring-gold/35"
                      : "bg-primary/10 text-electric ring-primary/25"
                  }`}
                >
                  <panel.icon className="h-4.5 w-4.5" />
                </div>
                <span
                  className={`rounded-full px-2 py-1 font-mono text-xs font-bold ${
                    active ? "bg-gold/15 text-gold" : "bg-background/60 text-muted-foreground"
                  }`}
                >
                  {panel.count}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold leading-tight">{panel.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{panel.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BlogPostCreateDialog({
  open,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-border/60 bg-card/35 px-5 py-5 md:px-6">
          <DialogHeader>
            <Badge variant="outline" className="mb-3 w-fit border-gold/40 text-xs text-gold">
              ZacTrades Blog
            </Badge>
            <DialogTitle className="font-display text-2xl font-bold">
              Add a new blog post
            </DialogTitle>
            <DialogDescription>
              Create the post shown on the ZacTrades Blog page and publish it when ready.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="create-blog-title" className="text-xs">
                Title
              </Label>
              <Input
                id="create-blog-title"
                name="title"
                required
                placeholder="How to prepare before market open"
                className="mt-1 bg-background/45"
              />
            </div>

            <div>
              <Label htmlFor="create-blog-slug" className="text-xs">
                Slug
              </Label>
              <Input
                id="create-blog-slug"
                name="slug"
                placeholder="auto-created-from-title"
                className="mt-1 bg-background/45"
              />
            </div>

            <div>
              <Label htmlFor="create-blog-category" className="text-xs">
                Category
              </Label>
              <Input
                id="create-blog-category"
                name="category"
                required
                defaultValue="Market Notes"
                className="mt-1 bg-background/45"
              />
            </div>

            <div>
              <Label htmlFor="create-blog-date" className="text-xs">
                Published date
              </Label>
              <Input
                id="create-blog-date"
                name="published_date"
                required
                defaultValue="May 28, 2026"
                className="mt-1 bg-background/45"
              />
            </div>

            <div>
              <Label htmlFor="create-blog-read-time" className="text-xs">
                Read time
              </Label>
              <Input
                id="create-blog-read-time"
                name="read_time"
                required
                defaultValue="4 min read"
                className="mt-1 bg-background/45"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="create-blog-excerpt" className="text-xs">
              Excerpt
            </Label>
            <Textarea
              id="create-blog-excerpt"
              name="excerpt"
              required
              placeholder="Short preview shown on the blog page"
              className="mt-1 min-h-24 bg-background/45"
            />
          </div>

          <div>
            <Label htmlFor="create-blog-content" className="text-xs">
              Body content
            </Label>
            <Textarea
              id="create-blog-content"
              name="content"
              required
              placeholder="Full article content"
              className="mt-1 min-h-40 bg-background/45"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="create-blog-pdf-url" className="text-xs">
                PDF URL
              </Label>
              <Input
                id="create-blog-pdf-url"
                name="pdf_url"
                type="url"
                placeholder="Optional existing PDF link"
                className="mt-1 bg-background/45"
              />
            </div>
            <div>
              <PdfFileInput id="create-blog-pdf-file" label="Upload PDF" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/45 px-4 py-3 text-sm font-semibold">
              Featured post
              <input
                name="is_featured"
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--gold))]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-bull/35 bg-bull/10 px-4 py-3 text-sm font-semibold text-bull">
              Published
              <input
                name="is_published"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[hsl(var(--bull))]"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create blog post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BlogPostEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: EditableBlogPost;
  saving: boolean;
  onChange: (slug: string, patch: Partial<EditableBlogPost>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableBlogPost) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className={`glass relative overflow-hidden rounded-2xl p-5 md:p-6 ${
        item.is_featured ? "border-gold/35" : "border-primary/20"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-gold/40 text-xs text-gold">
              {item.is_featured ? "Featured blog" : "Blog post"}
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls posts shown on the ZacTrades Blog page.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-blog-title`}
              label="Title"
              value={item.title}
              onChange={(value) => onChange(item.slug, { title: value })}
            />
            <Field
              id={`${item.slug}-blog-category`}
              label="Category"
              value={item.category}
              onChange={(value) => onChange(item.slug, { category: value })}
            />
            <Field
              id={`${item.slug}-blog-date`}
              label="Published date"
              value={item.published_date}
              onChange={(value) => onChange(item.slug, { published_date: value })}
            />
            <Field
              id={`${item.slug}-blog-read-time`}
              label="Read time"
              value={item.read_time}
              onChange={(value) => onChange(item.slug, { read_time: value })}
            />
          </div>

          <Field
            id={`${item.slug}-blog-slug`}
            label="Slug"
            value={item.slug}
            onChange={(value) => onChange(item.slug, { slug: slugify(value) })}
          />

          <TextareaField
            id={`${item.slug}-blog-excerpt`}
            label="Excerpt"
            value={item.excerpt}
            onChange={(value) => onChange(item.slug, { excerpt: value })}
          />

          <TextareaField
            id={`${item.slug}-blog-content`}
            label="Body content"
            value={item.content}
            onChange={(value) => onChange(item.slug, { content: value })}
            placeholder="Full article content"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-blog-pdf-url`}
              label="PDF URL"
              value={item.pdf_url ?? ""}
              onChange={(value) => onChange(item.slug, { pdf_url: value.trim() || null })}
              placeholder="Optional PDF link"
            />
            <div>
              <PdfFileInput id={`${item.slug}-blog-pdf-file`} label="Upload replacement PDF" />
              {item.pdf_url ? (
                <a
                  href={item.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xs font-semibold text-electric hover:text-primary"
                >
                  View current PDF
                </a>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No PDF attached yet.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleButton
              active={item.is_featured}
              label="Featured post"
              onClick={() => onChange(item.slug, { is_featured: !item.is_featured })}
            />
            <ToggleButton
              active={item.is_published}
              label="Published"
              onClick={() => onChange(item.slug, { is_published: !item.is_published })}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save blog post
        </Button>
      </div>
    </form>
  );
}

function LivePackageEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: LiveTradingPackageRow;
  saving: boolean;
  onChange: (slug: string, patch: Partial<LiveTradingPackageRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: LiveTradingPackageRow) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className="glass relative overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-bull/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-bull/40 text-xs text-bull">
              Live access
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.duration}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the live-room package card and checkout price.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-bull/15 text-bull ring-1 ring-bull/30">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            id={`${item.slug}-duration`}
            label="Duration"
            value={item.duration}
            onChange={(value) => onChange(item.slug, { duration: value })}
          />
          <Field
            id={`${item.slug}-price`}
            label="Price"
            value={item.price}
            onChange={(value) => onChange(item.slug, { price: value })}
          />
          <Field
            id={`${item.slug}-monthly-label`}
            label="Monthly label"
            value={item.monthly_label}
            onChange={(value) => onChange(item.slug, { monthly_label: value })}
            placeholder="$39.99/mo"
          />
          <Field
            id={`${item.slug}-original-price`}
            label="Before price"
            value={item.original_price ?? ""}
            onChange={(value) => onChange(item.slug, { original_price: value })}
            placeholder="Optional"
          />
          <Field
            id={`${item.slug}-badge`}
            label="Badge"
            value={item.badge ?? ""}
            onChange={(value) => onChange(item.slug, { badge: value })}
            placeholder="Optional"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save live package
        </Button>
      </div>
    </form>
  );
}

function IndicatorEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: IndicatorRow;
  saving: boolean;
  onChange: (slug: string, patch: Partial<IndicatorRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: IndicatorRow) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className="glass relative overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/40 text-xs">
              Indicator
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the premium indicators section and TradingView button.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-name`}
              label="Name"
              value={item.name}
              onChange={(value) => onChange(item.slug, { name: value })}
            />
            <Field
              id={`${item.slug}-tag`}
              label="Tag"
              value={item.tag}
              onChange={(value) => onChange(item.slug, { tag: value })}
            />
          </div>
          <TextareaField
            id={`${item.slug}-indicator-description`}
            label="Description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-stats`}
              label="Stats label"
              value={item.stats_label}
              onChange={(value) => onChange(item.slug, { stats_label: value })}
            />
            <Field
              id={`${item.slug}-url`}
              label="TradingView URL"
              value={item.tradingview_url}
              onChange={(value) => onChange(item.slug, { tradingview_url: value })}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save indicator
        </Button>
      </div>
    </form>
  );
}

function ToolEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: EditableTool;
  saving: boolean;
  onChange: (slug: string, patch: Partial<EditableTool>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableTool) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className="glass relative overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-gold/40 text-xs text-gold">
              Trading tool
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the tools stack, promo code, discount, and outbound link.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-tool-name`}
              label="Name"
              value={item.name}
              onChange={(value) => onChange(item.slug, { name: value })}
            />
            <Field
              id={`${item.slug}-category`}
              label="Category"
              value={item.category}
              onChange={(value) => onChange(item.slug, { category: value })}
            />
          </div>
          <TextareaField
            id={`${item.slug}-tool-description`}
            label="Description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-promo`}
              label="Promo code"
              value={item.promo_code}
              onChange={(value) => onChange(item.slug, { promo_code: value })}
            />
            <Field
              id={`${item.slug}-discount`}
              label="Discount"
              value={item.discount}
              onChange={(value) => onChange(item.slug, { discount: value })}
            />
          </div>
          <Field
            id={`${item.slug}-tool-url`}
            label="URL"
            value={item.url}
            onChange={(value) => onChange(item.slug, { url: value })}
          />
          <TextareaField
            id={`${item.slug}-highlights`}
            label="Highlights"
            value={item.highlightsText}
            onChange={(value) => onChange(item.slug, { highlightsText: value })}
            placeholder="One highlight per line"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save tool
        </Button>
      </div>
    </form>
  );
}

function PropFirmEditor({
  item,
  saving,
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: EditablePropFirm;
  saving: boolean;
  deleting: boolean;
  onChange: (slug: string, patch: Partial<EditablePropFirm>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditablePropFirm) => void;
  onDelete: (item: EditablePropFirm) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className={`glass relative overflow-hidden rounded-2xl p-5 md:p-6 ${
        item.is_featured ? "border-gold/35" : "border-primary/20"
      }`}
    >
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: item.color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-gold/40 text-xs text-gold">
              {item.is_featured ? "Featured prop firm" : "Prop firm"}
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the Propfirms page partner cards and promo code rows.
            </p>
          </div>
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white ring-1 ring-white/15"
            style={{ backgroundColor: item.color }}
          >
            {item.logo}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-firm-name`}
              label="Firm name"
              value={item.name}
              onChange={(value) => onChange(item.slug, { name: value })}
            />
            <Field
              id={`${item.slug}-firm-logo`}
              label="Logo initials"
              value={item.logo}
              onChange={(value) => onChange(item.slug, { logo: value })}
            />
            <Field
              id={`${item.slug}-firm-discount`}
              label="Discount"
              value={item.discount}
              onChange={(value) => onChange(item.slug, { discount: value })}
            />
            <Field
              id={`${item.slug}-firm-code`}
              label="Promo code"
              value={item.promo_code}
              onChange={(value) => onChange(item.slug, { promo_code: value })}
            />
          </div>

          <TextareaField
            id={`${item.slug}-firm-description`}
            label="Description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id={`${item.slug}-firm-color`}
              label="Brand color"
              value={item.color}
              onChange={(value) => onChange(item.slug, { color: value })}
              placeholder="#00d084"
            />
            <Field
              id={`${item.slug}-firm-rating`}
              label="Rating"
              value={`${item.rating}`}
              onChange={(value) => onChange(item.slug, { rating: Number(value) || 0 })}
            />
            <Field
              id={`${item.slug}-firm-reviews`}
              label="Reviews"
              value={`${item.reviews}`}
              onChange={(value) => onChange(item.slug, { reviews: Number(value) || 0 })}
            />
            <Field
              id={`${item.slug}-firm-capital`}
              label="Max capital"
              value={item.max_capital}
              onChange={(value) => onChange(item.slug, { max_capital: value })}
            />
            <Field
              id={`${item.slug}-firm-split`}
              label="Profit split"
              value={item.profit_split}
              onChange={(value) => onChange(item.slug, { profit_split: value })}
            />
            <Field
              id={`${item.slug}-firm-payout`}
              label="Payout"
              value={item.payout}
              onChange={(value) => onChange(item.slug, { payout: value })}
            />
          </div>

          <Field
            id={`${item.slug}-firm-url`}
            label="Partner URL"
            value={item.url}
            onChange={(value) => onChange(item.slug, { url: value })}
          />

          <TextareaField
            id={`${item.slug}-firm-features`}
            label="Features"
            value={item.featuresText}
            onChange={(value) => onChange(item.slug, { featuresText: value })}
            placeholder="One feature per line"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleButton
              active={item.is_featured}
              label="Featured"
              onClick={() => onChange(item.slug, { is_featured: !item.is_featured })}
            />
            <ToggleButton
              active={item.is_active}
              label="Visible"
              onClick={() => onChange(item.slug, { is_active: !item.is_active })}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button
            type="submit"
            size="lg"
            disabled={saving || deleting}
            className="w-full text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save prop firm
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={saving || deleting}
            onClick={() => onDelete(item)}
            className="border-bear/45 bg-bear/10 text-bear hover:bg-bear/15"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommunitySocialEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: EditableCommunitySocial;
  saving: boolean;
  onChange: (slug: string, patch: Partial<EditableCommunitySocial>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableCommunitySocial) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className="glass relative overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/40 text-xs">
              ZacTrades community
            </Badge>
            <h3 className="font-display text-2xl font-bold">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the social card shown in the homepage community section.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-community-name`}
              label="Card name"
              value={item.name}
              onChange={(value) => onChange(item.slug, { name: value })}
            />
            <Field
              id={`${item.slug}-community-handle`}
              label="Handle"
              value={item.handle}
              onChange={(value) => onChange(item.slug, { handle: value })}
            />
            <Field
              id={`${item.slug}-community-icon`}
              label="Icon key"
              value={item.icon_key}
              onChange={(value) => onChange(item.slug, { icon_key: value })}
              placeholder="youtube, instagram, music, message"
            />
            <Field
              id={`${item.slug}-community-tone`}
              label="Color style"
              value={item.tone_key}
              onChange={(value) => onChange(item.slug, { tone_key: value })}
              placeholder="bear, gold, primary, bull"
            />
          </div>

          <TextareaField
            id={`${item.slug}-community-description`}
            label="Description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
          />

          <Field
            id={`${item.slug}-community-url`}
            label="URL"
            value={item.url}
            onChange={(value) => onChange(item.slug, { url: value })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleButton
              active={item.is_active}
              label="Visible"
              onClick={() => onChange(item.slug, { is_active: !item.is_active })}
            />
            <Field
              id={`${item.slug}-community-order`}
              label="Display order"
              value={`${item.display_order}`}
              onChange={(value) => onChange(item.slug, { display_order: Number(value) || 0 })}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save community card
        </Button>
      </div>
    </form>
  );
}

function StaffMembersPanel({
  profiles,
  currentUserId,
  savingKey,
  onChange,
  onSubmit,
}: {
  profiles: UserProfileRow[];
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  const adminCount = profiles.filter((profile) => profile.role === "admin").length;
  const moderatorCount = profiles.filter((profile) => profile.role === "moderator").length;
  const memberProfiles = profiles.filter((profile) => profile.role === "member");
  const staffProfiles = profiles.filter((profile) => profile.role !== "member");

  if (!profiles.length) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/35 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-bold">No profiles found</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Profiles are created when users sign up. Once members exist, they will appear here for
          review and role management.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStat label="Admins" value={`${adminCount}`} />
        <AdminStat label="Moderators" value={`${moderatorCount}`} />
        <AdminStat label="Member candidates" value={`${memberProfiles.length}`} />
        <AdminStat label="Total profiles" value={`${profiles.length}`} />
      </div>

      <StaffRoleGroup
        title="Current Staff"
        description="Admins and moderators who can help operate the platform."
        emptyMessage="No moderators yet. Promote a trusted member below."
        profiles={staffProfiles}
        currentUserId={currentUserId}
        savingKey={savingKey}
        onChange={onChange}
        onSubmit={onSubmit}
      />

      <StaffRoleGroup
        title="Member Candidates"
        description="Choose a registered member and change their role to moderator or admin."
        emptyMessage="No regular members available to promote."
        profiles={memberProfiles}
        currentUserId={currentUserId}
        savingKey={savingKey}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function StaffRoleGroup({
  title,
  description,
  emptyMessage,
  profiles,
  currentUserId,
  savingKey,
  onChange,
  onSubmit,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  profiles: UserProfileRow[];
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/35 text-electric">
          {profiles.length} users
        </Badge>
      </div>

      {profiles.length ? (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <StaffRoleCard
              key={profile.id}
              profile={profile}
              currentUserId={currentUserId}
              saving={savingKey === `profile:${profile.id}`}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function StaffRoleCard({
  profile,
  currentUserId,
  saving,
  onChange,
  onSubmit,
}: {
  profile: UserProfileRow;
  currentUserId: string;
  saving: boolean;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  const isCurrentUser = profile.id === currentUserId;

  return (
    <form
      onSubmit={(event) => onSubmit(event, profile)}
      className="rounded-2xl border border-border/50 bg-background/35 p-4"
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={profileRoleClassName(profile.role)}>
              {profileRoleLabel(profile.role)}
            </Badge>
            {isCurrentUser && (
              <span className="text-[11px] font-semibold text-muted-foreground">Current admin</span>
            )}
          </div>
          <div className="mt-3 min-w-0">
            <div className="truncate font-display text-xl font-bold text-foreground">
              {profile.full_name || "No name"}
            </div>
            <div className="mt-1 truncate text-sm text-muted-foreground">
              {profile.email || "No email recorded"}
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <span className="truncate">Phone: {profile.phone_number || "Not provided"}</span>
            <div className="min-w-0">
              <DiscordIdentityCell profile={profile} />
            </div>
            <span className="truncate">Joined {formatAdminDate(profile.created_at)}</span>
          </div>
        </div>

        <div>
          <Label htmlFor={`${profile.id}-staff-role`} className="text-xs">
            Staff role
          </Label>
          <select
            id={`${profile.id}-staff-role`}
            value={profile.role}
            disabled={isCurrentUser}
            onChange={(event) => onChange(profile.id, { role: event.target.value as ProfileRole })}
            className="mt-1 h-11 w-full rounded-md border border-border/60 bg-card/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          {isCurrentUser && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Your own role is locked to protect your admin access.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={saving || isCurrentUser}
          className="text-primary-foreground glow-primary hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save role
        </Button>
      </div>
    </form>
  );
}

function CommunityMembersPanel({
  memberProfiles,
}: {
  memberProfiles: UserProfileRow[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const paidMemberProfiles = memberProfiles.filter(hasPaidMentorship);
  const paidNewsProfiles = memberProfiles.filter(hasPaidNewsSubscription);
  const filteredMemberProfiles = memberProfiles.filter((profile) =>
    memberMatchesSearch(profile, searchQuery),
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStat label="All members" value={String(memberProfiles.length)} />
        <AdminStat label="Paid members" value={String(paidMemberProfiles.length)} />
        <AdminStat label="Live trading" value={String(memberProfiles.filter(hasPaidLiveTradingAccess).length)} />
        <AdminStat label="News subscribers" value={String(paidNewsProfiles.length)} />
      </div>

      <CommunityMembersTable
        profiles={filteredMemberProfiles}
        totalCount={memberProfiles.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage={
          searchQuery.trim()
            ? "No members match this search."
            : "No community members right now. Members will appear here after signup."
        }
      />
    </div>
  );
}

function CommunityMembersTable({
  profiles,
  totalCount,
  searchQuery,
  onSearchChange,
  emptyMessage,
}: {
  profiles: UserProfileRow[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold">All Community Members</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Registered members, paid mentorship members, and News Desk subscribers in one table.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, email, phone, plan..."
              className="h-11 bg-background/45 pl-10"
            />
          </div>
          <Badge variant="outline" className="w-fit border-primary/35 text-electric">
            {profiles.length === totalCount
              ? `${profiles.length} users`
              : `${profiles.length} of ${totalCount} users`}
          </Badge>
        </div>
      </div>

      {profiles.length ? (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/35">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b border-border/60 bg-card/45 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Full name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Discord user / ID</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {profiles.map((profile) => (
                  <CommunityMembersTableRow key={profile.id} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function CommunityMembersTableRow({ profile }: { profile: UserProfileRow }) {
  const paidPlans = paidPlanItems(profile);
  const whatsappUrl = whatsAppMessageUrl(profile.phone_number);
  const paidMemberships = mentorshipMembershipPlans
    .map(({ slug, label }) => ({
      label,
      membership: profile.memberships[slug],
    }))
    .filter(({ membership }) => membership.status === "paid");

  return (
    <tr className="transition-colors hover:bg-card/35">
      <td className="px-4 py-4">
        <div className="font-semibold text-foreground">{profile.full_name || "No name"}</div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{profile.email || "Not provided"}</td>
      <td className="px-4 py-4">
        {profile.phone_number ? (
          <div className="grid gap-2">
            <span className="text-muted-foreground">{profile.phone_number}</span>
            {whatsappUrl ? (
              <Button
                asChild
                type="button"
                size="sm"
                variant="outline"
                className="w-fit border-bull/40 bg-bull/10 text-bull hover:bg-bull/15"
              >
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Invalid WhatsApp number</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </td>
      <td className="px-4 py-4">
        <DiscordIdentityCell profile={profile} />
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline" className={profileRoleClassName(profile.role)}>
          {profileRoleLabel(profile.role)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        {paidPlans.length ? (
          <div className="grid gap-1.5">
            {paidPlans.map((plan) => (
              <div key={plan.key} className="grid gap-1">
                <Badge variant="outline" className={plan.className}>
                  {plan.label}
                </Badge>
                {plan.detail && <span className="text-xs text-muted-foreground">{plan.detail}</span>}
              </div>
            ))}
          </div>
        ) : (
          <Badge variant="outline" className="border-muted-foreground/35 text-muted-foreground">
            No paid plan
          </Badge>
        )}
      </td>
      <td className="px-4 py-4 text-muted-foreground">{formatAdminDate(profile.created_at)}</td>
      <td className="px-4 py-4 text-right">
        {paidMemberships.length ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-gold/35 text-gold hover:bg-gold/10"
            aria-label={"Print invoice for " + (profile.full_name || profile.email || "paid member")}
            onClick={() => printPaidMemberInvoice(profile, paidMemberships)}
          >
            <Printer className="h-3.5 w-3.5" />
            Invoice
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No invoice</span>
        )}
      </td>
    </tr>
  );
}

function whatsAppMessageUrl(phoneNumber: string | null) {
  if (!phoneNumber) return null;

  const normalizedNumber = phoneNumber.replace(/[^\d]/g, "");
  if (!normalizedNumber) return null;

  return `https://wa.me/${normalizedNumber}`;
}

function memberMatchesSearch(profile: UserProfileRow, query: string) {
  const normalizedQuery = normalizeMemberSearch(query);
  if (!normalizedQuery) return true;

  const planItems = paidPlanItems(profile);
  const membershipFields = mentorshipMembershipPlans.flatMap(({ slug, label }) => {
    const membership = profile.memberships[slug];

    return [
      label,
      membership.status,
      membership.payment_provider,
      membership.provider_customer_id,
      membership.provider_checkout_id,
      membership.provider_subscription_id,
      membership.amount_label,
      membership.paid_at,
      membership.access_starts_at,
      membership.access_expires_at,
      membership.notes,
    ];
  });
  const newsSubscription = profile.newsSubscription;
  const liveAccess = profile.liveTradingAccess;
  const fields = [
    profile.id,
    profile.full_name,
    profile.email,
    profile.phone_number,
    profile.discord_username,
    profile.discord_user_id,
    profile.role,
    profileRoleLabel(profile.role),
    profile.created_at,
    formatAdminDate(profile.created_at),
    ...planItems.flatMap((plan) => [plan.label, plan.detail]),
    ...membershipFields,
    newsSubscription.status,
    newsSubscription.payment_provider,
    newsSubscription.provider_customer_id,
    newsSubscription.provider_checkout_id,
    newsSubscription.provider_subscription_id,
    newsSubscription.amount_label,
    newsSubscription.paid_at,
    newsSubscription.access_starts_at,
    newsSubscription.access_expires_at,
    newsSubscription.notes,
    liveAccess.package_slug,
    liveAccess.duration_label,
    liveAccess.status,
    liveAccess.payment_provider,
    liveAccess.provider_customer_id,
    liveAccess.provider_checkout_id,
    liveAccess.amount_label,
    liveAccess.paid_at,
    liveAccess.access_starts_at,
    liveAccess.access_expires_at,
    liveAccess.notes,
  ];

  return fields.some((field) => normalizeMemberSearch(String(field ?? "")).includes(normalizedQuery));
}

function normalizeMemberSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function paidPlanItems(profile: UserProfileRow) {
  const plans = mentorshipMembershipPlans
    .map(({ slug, label }) => {
      const membership = profile.memberships[slug];
      if (membership.status !== "paid") return null;

      return {
        key: slug,
        label: slug === "one_to_one" ? "Coaching" : "Mentorship",
        className: "w-fit border-bull/40 bg-bull/10 text-bull",
        detail: [label, membership.amount_label, membership.paid_at ? formatAdminDate(membership.paid_at) : null]
          .filter(Boolean)
          .join(" - "),
      };
    })
    .filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));

  const liveAccess = profile.liveTradingAccess;
  if (hasPaidLiveTradingAccess(profile)) {
    plans.push({
      key: "live_trading",
      label: "Live Trading",
      className: "w-fit border-primary/40 bg-primary/10 text-electric",
      detail: [
        liveAccess.duration_label,
        liveAccess.amount_label,
        liveAccess.paid_at ? formatAdminDate(liveAccess.paid_at) : null,
      ]
        .filter(Boolean)
        .join(" - "),
    });
  }

  const newsSubscription = profile.newsSubscription;
  if (hasPaidNewsSubscription(profile)) {
    plans.push({
      key: "news_subscribers",
      label: "News Subscribers",
      className: "w-fit border-gold/40 bg-gold/10 text-gold",
      detail: [
        newsSubscription.amount_label || "$5/mo",
        newsSubscription.paid_at ? formatAdminDate(newsSubscription.paid_at) : null,
      ]
        .filter(Boolean)
        .join(" - "),
    });
  }

  return plans;
}

function UserManagementPanel({
  profiles,
  groupProfiles,
  groupTitle,
  groupDescription,
  emptyMessage,
  currentUserId,
  savingKey,
  onChange,
  onMembershipChange,
  onSubmit,
}: {
  profiles: UserProfileRow[];
  groupProfiles: UserProfileRow[];
  groupTitle: string;
  groupDescription: string;
  emptyMessage: string;
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onMembershipChange: (
    id: string,
    planSlug: CoachingPlanSlug,
    patch: Partial<UserMembershipRow>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  const adminCount = profiles.filter((profile) => profile.role === "admin").length;
  const moderatorCount = profiles.filter((profile) => profile.role === "moderator").length;
  const memberProfiles = profiles.filter((profile) => profile.role === "member");
  const paidMemberProfiles = memberProfiles.filter(hasPaidMentorship);
  const registeredMemberProfiles = memberProfiles.filter((profile) => !hasPaidMentorship(profile));

  if (!profiles.length) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/35 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
          <UserCog className="h-6 w-6" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-bold">No profiles found</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Profiles are created when users sign up. Once members exist, they will appear here for
          review and role management.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStat label="Admins" value={`${adminCount}`} />
        <AdminStat label="Moderators" value={`${moderatorCount}`} />
        <AdminStat label="Paid members" value={`${paidMemberProfiles.length}`} />
        <AdminStat label="Registered" value={`${registeredMemberProfiles.length}`} />
      </div>

      <UserManagementGroup
        title={groupTitle}
        description={groupDescription}
        emptyMessage={emptyMessage}
        profiles={groupProfiles}
        currentUserId={currentUserId}
        savingKey={savingKey}
        onChange={onChange}
        onMembershipChange={onMembershipChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function RegisteredMembersTable({
  profiles,
  emptyMessage,
}: {
  profiles: UserProfileRow[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div />
        <Badge variant="outline" className="w-fit border-primary/35 text-electric">
          {profiles.length} users
        </Badge>
      </div>

      {profiles.length ? (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/35">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-border/60 bg-card/45 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Discord user / ID</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {profiles.map((profile) => (
                  <RegisteredMembersTableRow key={profile.id} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function PaidMembersTable({
  profiles,
  emptyMessage,
}: {
  profiles: UserProfileRow[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div />
        <Badge variant="outline" className="w-fit border-bull/40 bg-bull/10 text-bull">
          {profiles.length} users
        </Badge>
      </div>

      {profiles.length ? (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/35">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border/60 bg-card/45 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Discord user / ID</th>
                  <th className="px-4 py-3 font-semibold">Mentorship</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Paid date</th>
                  <th className="px-4 py-3 text-right font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {profiles.map((profile) => (
                  <PaidMembersTableRow key={profile.id} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function NewsSubscribersTable({
  profiles,
  emptyMessage,
}: {
  profiles: UserProfileRow[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div />
        <Badge variant="outline" className="w-fit border-gold/40 bg-gold/10 text-gold">
          {profiles.length} users
        </Badge>
      </div>

      {profiles.length ? (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/35">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-border/60 bg-card/45 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Discord user / ID</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Paid date</th>
                  <th className="px-4 py-3 font-semibold">Access expires</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {profiles.map((profile) => (
                  <NewsSubscribersTableRow key={profile.id} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function DiscordIdentityCell({ profile }: { profile: UserProfileRow }) {
  if (!profile.discord_username && !profile.discord_user_id) {
    return <span className="text-muted-foreground">Not connected</span>;
  }

  return (
    <div className="grid min-w-[180px] gap-1">
      <span className="font-medium text-foreground">
        {profile.discord_username || "Discord user"}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        ID: {profile.discord_user_id || "Not recorded"}
      </span>
      {profile.discord_connected_at && (
        <span className="text-[11px] text-muted-foreground">
          Connected {formatAdminDate(profile.discord_connected_at)}
        </span>
      )}
    </div>
  );
}

function NewsSubscribersTableRow({ profile }: { profile: UserProfileRow }) {
  const subscription = profile.newsSubscription;

  return (
    <tr className="transition-colors hover:bg-card/35">
      <td className="px-4 py-4">
        <div className="font-semibold text-foreground">{profile.full_name || "No name"}</div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{profile.email || "Not provided"}</td>
      <td className="px-4 py-4 text-muted-foreground">{profile.phone_number || "Not provided"}</td>
      <td className="px-4 py-4">
        <DiscordIdentityCell profile={profile} />
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold">
          News Desk
        </Badge>
      </td>
      <td className="px-4 py-4 font-mono text-gold">{subscription.amount_label || "$5/mo"}</td>
      <td className="px-4 py-4 text-muted-foreground">
        {subscription.paid_at ? formatAdminDate(subscription.paid_at) : "Paid date missing"}
      </td>
      <td className="px-4 py-4 text-muted-foreground">
        {subscription.access_expires_at
          ? formatAdminDate(subscription.access_expires_at)
          : "No expiry recorded"}
      </td>
      <td className="px-4 py-4 text-muted-foreground">
        {subscription.payment_provider || "local_checkout"}
      </td>
    </tr>
  );
}

type PaidMembershipInvoiceItem = {
  label: string;
  membership: UserMembershipRow;
};

function PaidMembersTableRow({ profile }: { profile: UserProfileRow }) {
  const paidMemberships = mentorshipMembershipPlans
    .map(({ slug, label }) => ({
      label,
      membership: profile.memberships[slug],
    }))
    .filter(({ membership }) => membership.status === "paid");

  return (
    <tr className="transition-colors hover:bg-card/35">
      <td className="px-4 py-4">
        <div className="font-semibold text-foreground">{profile.full_name || "No name"}</div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{profile.email || "Not provided"}</td>
      <td className="px-4 py-4 text-muted-foreground">{profile.phone_number || "Not provided"}</td>
      <td className="px-4 py-4">
        <DiscordIdentityCell profile={profile} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {paidMemberships.map(({ label }) => (
            <Badge key={label} variant="outline" className="border-bull/40 bg-bull/10 text-bull">
              {label}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{formatAdminDate(profile.created_at)}</td>
      <td className="px-4 py-4 text-muted-foreground">
        <div className="grid gap-1">
          {paidMemberships.map(({ label, membership }) => (
            <div key={label}>
              {membership.paid_at ? formatAdminDate(membership.paid_at) : "Paid date missing"}
            </div>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-primary/35 bg-primary/10 text-electric hover:bg-primary/15"
          aria-label={`Print invoice for ${profile.full_name || profile.email || "paid member"}`}
          onClick={() => printPaidMemberInvoice(profile, paidMemberships)}
        >
          <Printer className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

function printPaidMemberInvoice(
  profile: UserProfileRow,
  paidMemberships: PaidMembershipInvoiceItem[],
) {
  const invoiceWindow = window.open("", "_blank", "width=900,height=1100");

  if (!invoiceWindow) {
    return;
  }

  invoiceWindow.document.open();
  invoiceWindow.document.write(buildInvoiceHtml(profile, paidMemberships));
  invoiceWindow.document.close();
}

function buildInvoiceHtml(profile: UserProfileRow, paidMemberships: PaidMembershipInvoiceItem[]) {
  const memberName = profile.full_name || "Member";
  const invoiceNumber = `ZT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
  const generatedAt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  const lineItems = paidMemberships
    .map(({ label, membership }) => {
      const amount = membership.amount_label || "Recorded payment";
      const paidDate = membership.paid_at
        ? formatAdminDate(membership.paid_at)
        : "Paid date missing";

      return `
        <tr>
          <td>
            <strong>${escapeHtml(label)}</strong>
            <span>Mentorship access</span>
          </td>
          <td>${escapeHtml(amount)}</td>
          <td>${escapeHtml(paidDate)}</td>
          <td><strong>Paid</strong></td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ZacTrades Invoice - ${escapeHtml(memberName)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f4f7fb;
        color: #0b1220;
        font-family: Inter, Arial, sans-serif;
      }
      .invoice {
        width: min(860px, calc(100% - 32px));
        margin: 24px auto;
        border: 1px solid #d8e0ec;
        border-radius: 24px;
        background: #ffffff;
        overflow: hidden;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 28px 34px;
        background: #07111f;
        color: #ffffff;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .brand img {
        width: 72px;
        height: 72px;
        object-fit: contain;
      }
      .brand strong {
        display: block;
        font-size: 28px;
        line-height: 1;
      }
      .brand span {
        display: block;
        margin-top: 6px;
        color: #9aa8ba;
        font-size: 13px;
      }
      .invoice-label {
        text-align: right;
      }
      .invoice-label h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1;
      }
      .invoice-label p {
        margin: 8px 0 0;
        color: #9aa8ba;
        font-size: 13px;
      }
      main {
        padding: 34px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      .box {
        border: 1px solid #d8e0ec;
        border-radius: 18px;
        padding: 18px;
      }
      .eyebrow {
        margin: 0 0 10px;
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .line {
        margin: 7px 0;
        color: #334155;
        font-size: 14px;
      }
      .line strong {
        color: #0f172a;
      }
      table {
        width: 100%;
        margin-top: 26px;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 18px;
      }
      th {
        background: #eef4fb;
        color: #475569;
        font-size: 11px;
        letter-spacing: 0.16em;
        text-align: left;
        text-transform: uppercase;
      }
      th, td {
        border-bottom: 1px solid #d8e0ec;
        padding: 15px;
        vertical-align: top;
      }
      td {
        color: #334155;
        font-size: 14px;
      }
      td span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 12px;
      }
      .paid {
        margin-top: 22px;
        border-radius: 18px;
        background: #ecfdf5;
        color: #047857;
        padding: 16px 18px;
        font-weight: 800;
      }
      footer {
        padding: 0 34px 30px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.6;
      }
      @media print {
        body { background: #ffffff; }
        .invoice {
          width: 100%;
          margin: 0;
          border-radius: 0;
          border: 0;
        }
      }
    </style>
  </head>
  <body>
    <article class="invoice">
      <header>
        <div class="brand">
          <img src="${escapeHtml(logoUrl)}" alt="ZacTrades logo" />
          <div>
            <strong>ZacTrades</strong>
            <span>Mentorship invoice</span>
          </div>
        </div>
        <div class="invoice-label">
          <h1>Invoice</h1>
          <p>${escapeHtml(invoiceNumber)}</p>
        </div>
      </header>
      <main>
        <section class="grid">
          <div class="box">
            <p class="eyebrow">Billed to</p>
            <p class="line"><strong>${escapeHtml(memberName)}</strong></p>
            <p class="line">${escapeHtml(profile.email || "No email recorded")}</p>
            <p class="line">Phone: ${escapeHtml(profile.phone_number || "Not provided")}</p>
            <p class="line">Discord: ${escapeHtml(profile.discord_username || "Not provided")}</p>
          </div>
          <div class="box">
            <p class="eyebrow">Invoice details</p>
            <p class="line"><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
            <p class="line"><strong>Joined:</strong> ${escapeHtml(formatAdminDate(profile.created_at))}</p>
            <p class="line"><strong>Status:</strong> Paid</p>
          </div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Mentorship</th>
              <th>Amount</th>
              <th>Paid date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${lineItems}</tbody>
        </table>
        <div class="paid">Payment confirmed - mentorship access granted.</div>
      </main>
      <footer>
        This invoice confirms the recorded mentorship payment status inside ZacTrades admin.
        Trading education and mentorship services are subject to the site terms and policies.
      </footer>
    </article>
    <script>
      window.addEventListener("load", () => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 250);
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function RegisteredMembersTableRow({ profile }: { profile: UserProfileRow }) {
  const isPaid = hasPaidMentorship(profile);

  return (
    <tr className="transition-colors hover:bg-card/35">
      <td className="px-4 py-4">
        <div className="font-semibold text-foreground">{profile.full_name || "No name"}</div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{profile.email || "Not provided"}</td>
      <td className="px-4 py-4 text-muted-foreground">{profile.phone_number || "Not provided"}</td>
      <td className="px-4 py-4">
        <DiscordIdentityCell profile={profile} />
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline" className={profileRoleClassName(profile.role)}>
          {profileRoleLabel(profile.role)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Badge
          variant="outline"
          className={
            isPaid
              ? "border-bull/40 bg-bull/10 text-bull"
              : "border-muted-foreground/35 text-muted-foreground"
          }
        >
          {isPaid ? "Paid" : "Not paid"}
        </Badge>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{formatAdminDate(profile.created_at)}</td>
    </tr>
  );
}

function UserManagementGroup({
  title,
  description,
  emptyMessage,
  profiles,
  currentUserId,
  savingKey,
  onChange,
  onMembershipChange,
  onSubmit,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  profiles: UserProfileRow[];
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onMembershipChange: (
    id: string,
    planSlug: CoachingPlanSlug,
    patch: Partial<UserMembershipRow>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/35 text-electric">
          {profiles.length} users
        </Badge>
      </div>

      {profiles.length ? (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <UserProfileCard
              key={profile.id}
              profile={profile}
              currentUserId={currentUserId}
              saving={savingKey === `profile:${profile.id}`}
              onChange={onChange}
              onMembershipChange={onMembershipChange}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function UserProfileCard({
  profile,
  currentUserId,
  saving,
  onChange,
  onMembershipChange,
  onSubmit,
}: {
  profile: UserProfileRow;
  currentUserId: string;
  saving: boolean;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onMembershipChange: (
    id: string,
    planSlug: CoachingPlanSlug,
    patch: Partial<UserMembershipRow>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  const isCurrentUser = profile.id === currentUserId;
  const paidPlans = mentorshipMembershipPlans.filter(
    ({ slug }) => profile.memberships[slug].status === "paid",
  );

  return (
    <form
      onSubmit={(event) => onSubmit(event, profile)}
      className="rounded-2xl border border-border/50 bg-card/25 p-4"
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.6fr_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                paidPlans.length
                  ? "border-bull/40 bg-bull/10 text-bull"
                  : "border-muted-foreground/35 text-muted-foreground"
              }
            >
              {paidPlans.length ? "Paid mentorship" : "No mentorship payment"}
            </Badge>
            <Badge variant="outline" className={profileRoleClassName(profile.role)}>
              {profileRoleLabel(profile.role)}
            </Badge>
            {isCurrentUser && (
              <span className="text-[11px] font-semibold text-muted-foreground">Current admin</span>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <Label htmlFor={`${profile.id}-name`} className="text-xs">
                Full name
              </Label>
              <Input
                id={`${profile.id}-name`}
                value={profile.full_name ?? ""}
                onChange={(event) => onChange(profile.id, { full_name: event.target.value })}
                placeholder="Full name"
                className="mt-1 bg-background/45"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${profile.id}-phone`} className="text-xs">
                  Phone number
                </Label>
                <Input
                  id={`${profile.id}-phone`}
                  value={profile.phone_number ?? ""}
                  onChange={(event) => onChange(profile.id, { phone_number: event.target.value })}
                  placeholder="+1 555 000 0000"
                  className="mt-1 bg-background/45"
                />
              </div>

              <div>
                <Label htmlFor={`${profile.id}-discord`} className="text-xs">
                  Discord username
                </Label>
                <Input
                  id={`${profile.id}-discord`}
                  value={profile.discord_username ?? ""}
                  onChange={(event) =>
                    onChange(profile.id, { discord_username: event.target.value })
                  }
                  placeholder="@username"
                  className="mt-1 bg-background/45"
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`${profile.id}-role`} className="text-xs">
                Role
              </Label>
              <select
                id={`${profile.id}-role`}
                value={profile.role}
                disabled={isCurrentUser}
                onChange={(event) =>
                  onChange(profile.id, { role: event.target.value as ProfileRole })
                }
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-4 min-w-0 rounded-xl border border-border/45 bg-background/35 p-3">
            <div className="truncate text-sm font-medium text-foreground">
              {profile.email ?? "No email recorded"}
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <div className="truncate">Phone: {profile.phone_number || "Not provided"}</div>
              <DiscordIdentityCell profile={profile} />
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {profile.id}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Joined {formatAdminDate(profile.created_at)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {mentorshipMembershipPlans.map(({ slug, label }) => {
            const membership = profile.memberships[slug];

            return (
              <div key={slug} className="rounded-xl border border-border/50 bg-background/35 p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {membership.paid_at
                        ? `Paid ${formatAdminDate(membership.paid_at)}`
                        : "No paid date recorded"}
                    </div>
                  </div>
                  <Badge variant="outline" className={membershipStatusClassName(membership.status)}>
                    {membershipStatusLabel(membership.status)}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label htmlFor={`${profile.id}-${slug}-status`} className="text-xs">
                      Payment status
                    </Label>
                    <select
                      id={`${profile.id}-${slug}-status`}
                      value={membership.status}
                      onChange={(event) =>
                        onMembershipChange(profile.id, slug, {
                          status: event.target.value as MembershipStatus,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      {membershipStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`${profile.id}-${slug}-amount`} className="text-xs">
                      Amount / plan price
                    </Label>
                    <Input
                      id={`${profile.id}-${slug}-amount`}
                      value={membership.amount_label ?? ""}
                      onChange={(event) =>
                        onMembershipChange(profile.id, slug, {
                          amount_label: event.target.value,
                        })
                      }
                      placeholder="$499/mo"
                      className="mt-1 bg-background/45"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${profile.id}-${slug}-notes`} className="text-xs">
                      Admin notes
                    </Label>
                    <Input
                      id={`${profile.id}-${slug}-notes`}
                      value={membership.notes ?? ""}
                      onChange={(event) =>
                        onMembershipChange(profile.id, slug, {
                          notes: event.target.value,
                        })
                      }
                      placeholder="Gateway, invoice, manual note"
                      className="mt-1 bg-background/45"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <Button
            type="submit"
            disabled={saving}
            className="text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          {isCurrentUser && (
            <p className="max-w-xs text-xs leading-5 text-muted-foreground xl:text-right">
              Your own role is locked here to prevent accidentally removing your admin access.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function AdminSection({
  title,
  description,
  action,
  contentClassName = "lg:grid-cols-2",
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className={`grid gap-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
        active
          ? "border-bull/40 bg-bull/10 text-bull"
          : "border-border/60 bg-background/45 text-muted-foreground"
      }`}
    >
      {label}: {active ? "Yes" : "No"}
    </button>
  );
}

function buildUserProfiles(
  profiles: BasicProfileRow[],
  memberships: UserMembershipRow[],
  newsSubscriptions: UserNewsSubscriptionRow[],
  liveTradingAccessRows: UserLiveTradingAccessRow[],
): UserProfileRow[] {
  return profiles.map((profile) => ({
    ...profile,
    memberships: membershipsFromRows(profile.id, memberships),
    newsSubscription:
      newsSubscriptions.find((subscription) => subscription.user_id === profile.id) ??
      defaultNewsSubscription(profile.id),
    liveTradingAccess:
      liveTradingAccessRows.find((access) => access.user_id === profile.id) ??
      defaultLiveTradingAccess(profile.id),
  }));
}

function membershipsFromRows(
  userId: string,
  memberships: UserMembershipRow[],
): Record<CoachingPlanSlug, UserMembershipRow> {
  return mentorshipMembershipPlans.reduce(
    (next, { slug }) => {
      next[slug] =
        memberships.find(
          (membership) => membership.user_id === userId && membership.plan_slug === slug,
        ) ?? defaultMembership(userId, slug);

      return next;
    },
    {} as Record<CoachingPlanSlug, UserMembershipRow>,
  );
}

function defaultMembership(userId: string, planSlug: CoachingPlanSlug): UserMembershipRow {
  return {
    user_id: userId,
    plan_slug: planSlug,
    status: "unpaid",
    payment_provider: null,
    provider_customer_id: null,
    provider_checkout_id: null,
    provider_subscription_id: null,
    amount_label: null,
    paid_at: null,
    access_starts_at: null,
    access_expires_at: null,
    notes: null,
  };
}

function defaultNewsSubscription(userId: string): UserNewsSubscriptionRow {
  return {
    user_id: userId,
    status: "unpaid",
    payment_provider: null,
    provider_customer_id: null,
    provider_checkout_id: null,
    provider_subscription_id: null,
    amount_label: null,
    paid_at: null,
    access_starts_at: null,
    access_expires_at: null,
    notes: null,
  };
}

function defaultLiveTradingAccess(userId: string): UserLiveTradingAccessRow {
  return {
    user_id: userId,
    package_slug: null,
    duration_label: null,
    status: "unpaid",
    payment_provider: null,
    provider_customer_id: null,
    provider_checkout_id: null,
    amount_label: null,
    paid_at: null,
    access_starts_at: null,
    access_expires_at: null,
    notes: null,
  };
}

function membershipStatusLabel(status: MembershipStatus) {
  return membershipStatusOptions.find((option) => option.value === status)?.label ?? "Unpaid";
}

function membershipStatusClassName(status: MembershipStatus) {
  switch (status) {
    case "paid":
      return "border-bull/40 bg-bull/10 text-bull";
    case "pending":
      return "border-gold/40 bg-gold/10 text-gold";
    case "expired":
    case "cancelled":
      return "border-bear/40 bg-bear/10 text-bear";
    case "unpaid":
    default:
      return "border-muted-foreground/35 text-muted-foreground";
  }
}

function hasPaidMentorship(profile: UserProfileRow) {
  return mentorshipMembershipPlans.some(({ slug }) => profile.memberships[slug].status === "paid");
}

function hasPaidNewsSubscription(profile: UserProfileRow) {
  const subscription = profile.newsSubscription;
  const expiresAt = subscription.access_expires_at
    ? new Date(subscription.access_expires_at)
    : null;

  return (
    subscription.status === "paid" &&
    (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date())
  );
}

function hasPaidLiveTradingAccess(profile: UserProfileRow) {
  const access = profile.liveTradingAccess;
  const expiresAt = access.access_expires_at ? new Date(access.access_expires_at) : null;

  return (
    access.status === "paid" &&
    (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date())
  );
}

function profileRoleLabel(role: ProfileRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "moderator":
      return "Moderator";
    case "member":
    default:
      return "Member";
  }
}

function profileRoleClassName(role: ProfileRole) {
  switch (role) {
    case "admin":
      return "border-gold/40 bg-gold/10 text-gold";
    case "moderator":
      return "border-bull/40 bg-bull/10 text-bull";
    case "member":
    default:
      return "border-primary/40 text-electric";
  }
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 bg-background/45"
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-24 bg-background/45"
      />
    </div>
  );
}

function PdfFileInput({ id, label }: { id: string; label: string }) {
  const [fileName, setFileName] = useState("");

  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <label
        htmlFor={id}
        className="mt-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-electric transition hover:border-primary/70 hover:bg-primary/15"
      >
        <Upload className="h-4 w-4" />
        Upload PDF
      </label>
      <Input
        id={id}
        name="pdf_file"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
      />
      <p className="mt-2 truncate text-xs text-muted-foreground">
        {fileName || "No PDF selected yet."}
      </p>
    </div>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  description,
  action,
  spinning = false,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
  action?: React.ReactNode;
  spinning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
        <Icon className={`h-6 w-6 ${spinning ? "animate-spin" : ""}`} />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-gradient-gold">{value}</div>
    </div>
  );
}

function defaultEditablePlans(): EditablePlan[] {
  return defaultCoachingPlans.map((plan, index) => ({
    slug: plan.slug,
    title: plan.title,
    description: plan.desc,
    display_price: plan.price,
    promotion_enabled: plan.promotionEnabled,
    promotion_label: plan.promotionLabel ?? null,
    promotion_original_price: plan.originalPrice ?? null,
    promotion_note: plan.promotionNote ?? null,
    promotion_ends_at: plan.promotionEndsAt ?? null,
    duration: plan.duration,
    checkout_price: plan.checkoutPackages[0].price,
    checkout_monthly_label: plan.checkoutPackages[0].monthly,
    features: plan.details,
    featuresText: plan.details.join("\n"),
    cta_label: plan.cta,
    is_featured: plan.featured,
    is_active: true,
    display_order: index + 1,
  }));
}

function toEditablePlan(row: CoachingPlanRow): EditablePlan {
  return {
    ...row,
    features: row.features ?? [],
    featuresText: (row.features ?? []).join("\n"),
  };
}

function toEditableTool(row: TradingToolRow): EditableTool {
  return {
    ...row,
    highlights: row.highlights ?? [],
    highlightsText: (row.highlights ?? []).join("\n"),
  };
}

function toEditablePropFirm(row: PropFirmRow): EditablePropFirm {
  return {
    ...row,
    features: row.features ?? [],
    featuresText: (row.features ?? []).join("\n"),
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `blog-post-${Date.now()}`
  );
}

async function uploadBlogPdf(fileValue: FormDataEntryValue | null, slug: string) {
  if (!supabase || !(fileValue instanceof File) || fileValue.size === 0) return null;

  if (fileValue.type !== "application/pdf" && !fileValue.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a PDF file.");
  }

  const safeFileName = slugify(fileValue.name.replace(/\.pdf$/i, "")) || "blog-file";
  const storagePath = `${slug}/${Date.now()}-${safeFileName}.pdf`;
  const { error } = await supabase.storage
    .from(BLOG_PDF_BUCKET)
    .upload(storagePath, fileValue, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BLOG_PDF_BUCKET).getPublicUrl(storagePath);

  return data.publicUrl;
}

function formatAdminDate(value: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
