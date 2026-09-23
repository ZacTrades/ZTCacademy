import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeDollarSign,
  BadgePercent,
  BookOpen,
  Check,
  History,
  Loader2,
  Lock,
  Megaphone,
  MessageCircle,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Plus,
  Printer,
  Radio,
  Star,
  UserCog,
  UserPlus,
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
  defaultCommunitySocials,
  defaultIndicators,
  defaultOfferHeadlines,
  defaultPropFirms,
  defaultTradingTools,
  type CommunitySocialRow,
  type IndicatorRow,
  type OfferHeadlineRow,
  type OfferHeadlineTone,
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
import {
  defaultEducationArticleRows,
  type EducationArticleCategory,
  type EducationArticleRow,
} from "@/lib/education-content";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | ZacTrades" },
      {
        name: "description",
        content: "ZacTrades admin controls for site content, discounts, members, and reviews.",
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

const PROP_FIRM_LOGO_BUCKET = "propfirm-logos";
const TRADING_TOOL_LOGO_BUCKET = "trading-tool-logos";
const MAX_PROP_FIRM_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_TRADING_TOOL_LOGO_BYTES = 2 * 1024 * 1024;
const PROP_FIRM_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type EditablePlan = CoachingPlanRow & {
  featuresText: string;
};

type EditableTool = TradingToolRow & {
  highlightsText: string;
};

type EditablePropFirm = PropFirmRow & {
  featuresText: string;
};

type EditableCommunitySocial = CommunitySocialRow;
type EditableOfferHeadline = OfferHeadlineRow;

type EditableEducationArticle = EducationArticleRow;

type MemberReviewStatus = "pending" | "approved" | "hidden";

type MemberReviewRow = {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  message: string;
  rating: number;
  status: MemberReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  image_urls: string[] | null;
};

type DiscountType = "percent" | "fixed";
type DiscountApplyTarget = "all" | "live" | "mentorship_one_to_one" | "mentorship_group" | "news";
type DiscountAppliesTo = string;

type DiscountCodeRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: DiscountAppliesTo;
  is_active: boolean;
  max_redemptions: number | null;
  redeemed_count: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at?: string;
  updated_at?: string;
};

type EditableDiscountCode = DiscountCodeRow & {
  maxRedemptionsText: string;
  startsAtText: string;
  expiresAtText: string;
};

type ProfileRole = "member" | "moderator" | "admin";
type StaffPromoteRole = Exclude<ProfileRole, "member">;
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

type LiveTradingAccessAdjustmentRow = {
  id: string;
  admin_user_id: string | null;
  extra_days: number;
  reason: string | null;
  affected_user_ids: string[];
  affected_count: number;
  created_at: string;
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
  | "education"
  | "offers"
  | "staff"
  | "communityMembers"
  | "registeredAccounts"
  | "memberReviews"
  | "community"
  | "propfirms"
  | "coaching"
  | "discounts"
  | "live"
  | "liveHistory"
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

const educationCategoryOptions: Array<{ value: EducationArticleCategory; label: string }> = [
  { value: "study", label: "Study" },
  { value: "psychology", label: "Psychology" },
  { value: "risk", label: "Risk Management" },
  { value: "premium", label: "Premium" },
];

const staffVisiblePanelKeys: AdminPanelKey[] = ["communityMembers", "registeredAccounts"];

function AdminPage() {
  const { user, loading, isConfigured, isAdmin, isStaff, role } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [livePackages, setLivePackages] = useState<LiveTradingPackageRow[]>([]);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [tools, setTools] = useState<EditableTool[]>([]);
  const [propFirms, setPropFirms] = useState<EditablePropFirm[]>([]);
  const [educationArticles, setEducationArticles] = useState<EditableEducationArticle[]>(
    defaultEducationArticleRows,
  );
  const [offerHeadlines, setOfferHeadlines] =
    useState<EditableOfferHeadline[]>(defaultOfferHeadlines);
  const [communitySocials, setCommunitySocials] = useState<EditableCommunitySocial[]>([]);
  const [discountCodes, setDiscountCodes] = useState<EditableDiscountCode[]>([]);
  const [memberReviews, setMemberReviews] = useState<MemberReviewRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [liveAccessAdjustments, setLiveAccessAdjustments] = useState<
    LiveTradingAccessAdjustmentRow[]
  >([]);
  const [activePanel, setActivePanel] = useState<AdminPanelKey>("staff");
  const [liveExtensionDays, setLiveExtensionDays] = useState("7");
  const [indicatorDeleteTarget, setIndicatorDeleteTarget] = useState<IndicatorRow | null>(null);
  const [toolDeleteTarget, setToolDeleteTarget] = useState<EditableTool | null>(null);
  const [communitySocialDeleteTarget, setCommunitySocialDeleteTarget] =
    useState<EditableCommunitySocial | null>(null);
  const [offerHeadlineDeleteTarget, setOfferHeadlineDeleteTarget] =
    useState<EditableOfferHeadline | null>(null);
  const [educationDeleteTarget, setEducationDeleteTarget] =
    useState<EditableEducationArticle | null>(null);
  const [discountDeleteTarget, setDiscountDeleteTarget] = useState<EditableDiscountCode | null>(
    null,
  );
  const [propFirmDeleteTarget, setPropFirmDeleteTarget] = useState<EditablePropFirm | null>(null);
  const [memberReviewDeleteTarget, setMemberReviewDeleteTarget] = useState<MemberReviewRow | null>(
    null,
  );
  const [liveExtensionConfirmDays, setLiveExtensionConfirmDays] = useState<number | null>(null);
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
          educationResult,
          firmsResult,
          offerHeadlinesResult,
          communityResult,
          discountResult,
          memberReviewsResult,
          profilesResult,
          membershipsResult,
          newsSubscriptionsResult,
          liveAccessResult,
          liveAccessAdjustmentsResult,
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
            .select(
              "slug,name,description,tag,stats_label,tradingview_url,video_url,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("trading_tools")
            .select(
              "slug,name,category,description,promo_code,discount,url,logo_url,highlights,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("education_articles")
            .select("*")
            .order("display_order", { ascending: true }),
          supabase
            .from("prop_firms")
            .select(
              "slug,name,description,logo,logo_url,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("offer_headlines")
            .select(
              "slug,eyebrow,headline,subheadline,cta_label,cta_url,tone,is_active,starts_at,expires_at,display_order",
            )
            .order("display_order", { ascending: true }),
          supabase
            .from("community_socials")
            .select("slug,name,handle,description,icon_key,url,tone_key,is_active,display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("discount_codes")
            .select(
              "id,code,description,discount_type,discount_value,applies_to,is_active,max_redemptions,redeemed_count,starts_at,expires_at,created_at,updated_at",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("member_reviews")
            .select(
              "id,user_id,display_name,email,message,rating,status,reviewed_by,reviewed_at,created_at,updated_at,image_urls",
            )
            .order("created_at", { ascending: false }),
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
          supabase
            .from("live_trading_access_adjustments")
            .select(
              "id,admin_user_id,extra_days,reason,affected_user_ids,affected_count,created_at",
            )
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

        if (!mounted) return;

        const firstError =
          coachingResult.error ||
          liveResult.error ||
          indicatorsResult.error ||
          toolsResult.error ||
          educationResult.error ||
          firmsResult.error ||
          offerHeadlinesResult.error ||
          communityResult.error ||
          discountResult.error ||
          memberReviewsResult.error ||
          profilesResult.error ||
          membershipsResult.error ||
          newsSubscriptionsResult.error ||
          liveAccessResult.error ||
          liveAccessAdjustmentsResult.error;

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
        setEducationArticles(
          educationResult.data?.length
            ? (educationResult.data as EducationArticleRow[])
            : defaultEducationArticleRows,
        );
        setPropFirms(
          firmsResult.data?.length
            ? (firmsResult.data as PropFirmRow[]).map(toEditablePropFirm)
            : defaultPropFirms.map(toEditablePropFirm),
        );
        setOfferHeadlines(
          offerHeadlinesResult.data?.length
            ? (offerHeadlinesResult.data as OfferHeadlineRow[])
            : defaultOfferHeadlines,
        );
        setCommunitySocials(
          communityResult.data?.length
            ? (communityResult.data as CommunitySocialRow[])
            : defaultCommunitySocials,
        );
        setDiscountCodes(
          discountResult.data?.length
            ? (discountResult.data as DiscountCodeRow[]).map(toEditableDiscountCode)
            : [],
        );
        setMemberReviews((memberReviewsResult.data as MemberReviewRow[]) ?? []);
        setLiveAccessAdjustments(
          (liveAccessAdjustmentsResult.data as LiveTradingAccessAdjustmentRow[]) ?? [],
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
          setEducationArticles(defaultEducationArticleRows);
          setPropFirms(defaultPropFirms.map(toEditablePropFirm));
          setCommunitySocials(defaultCommunitySocials);
          setDiscountCodes([]);
          setMemberReviews([]);
          setLiveAccessAdjustments([]);
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

  const updateEducationArticle = (slug: string, patch: Partial<EditableEducationArticle>) => {
    setEducationArticles((current) =>
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

  const updateOfferHeadline = (slug: string, patch: Partial<EditableOfferHeadline>) => {
    setOfferHeadlines((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateDiscountCode = (id: string, patch: Partial<EditableDiscountCode>) => {
    setDiscountCodes((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setMessage("");
    setErrorMessage("");
  };

  const addDiscountCode = () => {
    const timestamp = Date.now();
    const nextDiscount: EditableDiscountCode = {
      id: `new-${timestamp}`,
      code: "NEWCODE",
      description: "",
      discount_type: "percent",
      discount_value: 10,
      applies_to: "all",
      is_active: true,
      max_redemptions: null,
      redeemed_count: 0,
      starts_at: null,
      expires_at: null,
      maxRedemptionsText: "",
      startsAtText: "",
      expiresAtText: "",
    };

    setDiscountCodes((current) => [nextDiscount, ...current]);
    setActivePanel("discounts");
    setMessage("New discount code added. Fill the details, then save it.");
    setErrorMessage("");
  };

  const addCommunitySocial = () => {
    setCommunitySocials((current) => {
      const existingSlugs = new Set(current.map((item) => item.slug));
      const baseSlug = slugify("social-link");
      let slug = baseSlug;
      let suffix = 2;

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const nextOrder = current.length
        ? Math.max(...current.map((item) => item.display_order)) + 1
        : 1;

      const newSocial: EditableCommunitySocial = {
        slug,
        name: "New social link",
        handle: "@yourhandle",
        description: "Add a short description for this social channel.",
        icon_key: "message",
        url: "https://",
        tone_key: "primary",
        is_active: true,
        display_order: nextOrder,
      };

      return [newSocial, ...current];
    });
    setActivePanel("community");
    setMessage("New social link added. Fill the details, then save it.");
    setErrorMessage("");
  };

  const addOfferHeadline = () => {
    setOfferHeadlines((current) => {
      const existingSlugs = new Set(current.map((item) => item.slug));
      const baseSlug = slugify("new-offer-headline");
      let slug = baseSlug;
      let suffix = 2;

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const nextOrder = current.length
        ? Math.max(...current.map((item) => item.display_order)) + 1
        : 1;

      const newOffer: EditableOfferHeadline = {
        slug,
        eyebrow: "Limited offer",
        headline: "Add a sharp offer headline here.",
        subheadline: "Use this line to explain the value in one clean sentence.",
        cta_label: "View offer",
        cta_url: "/live-trading",
        tone: "gold",
        is_active: true,
        starts_at: null,
        expires_at: null,
        display_order: nextOrder,
      };

      return [newOffer, ...current];
    });
    setActivePanel("offers");
    setMessage("New offer headline added. Fill the details, then save it.");
    setErrorMessage("");
  };

  const addTradingTool = () => {
    setTools((current) => {
      const existingSlugs = new Set(current.map((item) => item.slug));
      let slug = slugify("new-trading-tool");
      let suffix = 2;

      while (existingSlugs.has(slug)) {
        slug = slugify(`new-trading-tool-${suffix}`);
        suffix += 1;
      }

      const nextOrder = current.length
        ? Math.max(...current.map((item) => item.display_order)) + 1
        : 1;

      const newTool: EditableTool = {
        slug,
        name: "New Trading Tool",
        category: "Trading Tool",
        description: "Add a short description for this trading tool.",
        promo_code: "ZACTRADES",
        discount: "Partner link",
        url: "https://",
        logo_url: null,
        highlights: ["Main benefit"],
        highlightsText: "Main benefit",
        is_active: true,
        display_order: nextOrder,
      };

      return [newTool, ...current];
    });
    setActivePanel("tools");
    setMessage("New trading tool added. Fill the details, then save it.");
    setErrorMessage("");
  };

  const addPropFirm = () => {
    setPropFirms((current) => {
      const existingSlugs = new Set(current.map((item) => item.slug));
      let slug = slugify("new-prop-firm");
      let suffix = 2;

      while (existingSlugs.has(slug)) {
        slug = slugify(`new-prop-firm-${suffix}`);
        suffix += 1;
      }

      const nextOrder = current.length
        ? Math.max(...current.map((item) => item.display_order)) + 1
        : 1;

      const newPropFirm: EditablePropFirm = {
        slug,
        name: "New Prop Firm",
        description: "Add a short description for this prop firm.",
        logo: "PF",
        logo_url: null,
        discount: "Max Discount",
        promo_code: "ZACTRADES",
        color: "#38bdf8",
        rating: 4,
        reviews: 0,
        max_capital: "$100K",
        profit_split: "80%",
        payout: "Bi-weekly",
        features: ["MT5", "Web"],
        featuresText: "MT5\nWeb",
        url: "https://",
        is_featured: false,
        is_active: true,
        display_order: nextOrder,
      };

      return [newPropFirm, ...current];
    });
    setActivePanel("propfirms");
    setMessage("New prop firm added. Fill the details, then save it.");
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

  const addEducationArticle = () => {
    window.location.href = "/admin/education/new";
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
      promotion_enabled: false,
      promotion_label: null,
      promotion_original_price: null,
      promotion_note: null,
      promotion_ends_at: null,
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

  const extendLiveTradingAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const extraDays = Number.parseInt(liveExtensionDays, 10);

    if (!Number.isInteger(extraDays) || extraDays < 1 || extraDays > 365) {
      setErrorMessage("Choose between 1 and 365 extra days.");
      setMessage("");
      return;
    }

    setLiveExtensionConfirmDays(extraDays);
  };

  const confirmLiveTradingAccessExtension = async () => {
    if (!supabase || !liveExtensionConfirmDays) return;

    const extraDays = liveExtensionConfirmDays;

    setSavingKey("live:extension");
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase.rpc("extend_active_live_trading_access", {
      p_extra_days: extraDays,
      p_reason: null,
    });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSavingKey(null);
      setLiveExtensionConfirmDays(null);
      return;
    }

    const updatedRows = ((data ?? []) as UserLiveTradingAccessRow[]).filter(Boolean);
    const updatedByUserId = new Map(updatedRows.map((row) => [row.user_id, row]));

    if (updatedRows.length) {
      setProfiles((current) =>
        current.map((profile) => {
          const updatedAccess = updatedByUserId.get(profile.id);

          return updatedAccess
            ? {
                ...profile,
                liveTradingAccess: updatedAccess,
              }
            : profile;
        }),
      );
    }

    setLiveAccessAdjustments((current) =>
      [
        {
          id: `local-${Date.now()}`,
          admin_user_id: user?.id ?? null,
          extra_days: extraDays,
          reason: null,
          affected_user_ids: updatedRows.map((row) => row.user_id),
          affected_count: updatedRows.length,
          created_at: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 6),
    );

    setMessage(
      `Success: Live Trading access extended by ${extraDays} day${
        extraDays === 1 ? "" : "s"
      } for ${updatedRows.length} active paid user${updatedRows.length === 1 ? "" : "s"}.`,
    );
    setLiveExtensionConfirmDays(null);
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
      video_url: item.video_url?.trim() || null,
    };

    const { data, error } = await supabase
      .from("premium_indicators")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,name,description,tag,stats_label,tradingview_url,video_url,is_active,display_order",
      )
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

  const deleteIndicator = async (item: IndicatorRow) => {
    if (!supabase) return;

    setSavingKey(`indicator:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("premium_indicators").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setIndicators((current) => current.filter((currentItem) => currentItem.slug !== item.slug));
      setMessage(`${item.name} deleted.`);
    }

    setIndicatorDeleteTarget(null);
    setSavingKey(null);
  };

  const saveTool = async (event: FormEvent<HTMLFormElement>, item: EditableTool) => {
    event.preventDefault();
    if (!supabase) return;

    setSavingKey(`tool:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    let logoUrl = item.logo_url?.trim() || null;

    try {
      logoUrl = (await uploadTradingToolLogo(formData.get("logo_file"), item.slug)) ?? logoUrl;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload trading tool logo.",
      );
      setSavingKey(null);
      return;
    }

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
      logo_url: logoUrl,
      highlights,
      is_active: item.is_active,
      display_order: item.display_order,
    };

    const { data, error } = await supabase
      .from("trading_tools")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,name,category,description,promo_code,discount,url,logo_url,highlights,is_active,display_order",
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

  const deleteTool = async (item: EditableTool) => {
    if (!supabase) return;

    setSavingKey(`tool:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("trading_tools").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setTools((current) => current.filter((currentItem) => currentItem.slug !== item.slug));
      setMessage(`${item.name} deleted.`);
    }

    setToolDeleteTarget(null);
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

    const formData = new FormData(event.currentTarget);
    const logoFile = formData.get("logo_file");
    let logoUrl = item.logo_url?.trim() || null;

    try {
      logoUrl = (await uploadPropFirmLogo(logoFile, item.slug)) ?? logoUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload prop firm logo.");
      setSavingKey(null);
      return;
    }

    const payload: PropFirmRow = {
      slug: item.slug,
      name: item.name.trim(),
      description: item.description.trim(),
      logo: item.logo.trim(),
      logo_url: logoUrl,
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
        "slug,name,description,logo,logo_url,discount,promo_code,color,rating,reviews,max_capital,profit_split,payout,features,url,is_featured,is_active,display_order",
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

  const toggleEducationArticlePublished = async (item: EditableEducationArticle) => {
    if (!supabase) return;

    const nextPublished = !item.is_published;
    setSavingKey(`education:toggle:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("education_articles")
      .update({ is_published: nextPublished })
      .eq("slug", item.slug)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setEducationArticles((current) =>
        current.map((currentItem) =>
          currentItem.slug === item.slug ? (data as EducationArticleRow) : currentItem,
        ),
      );
      setMessage(
        `${item.title} is now ${nextPublished ? "active on the Education page" : "hidden from users"}.`,
      );
    }

    setSavingKey(null);
  };

  const deleteEducationArticle = async (item: EditableEducationArticle) => {
    if (!supabase) return;

    setSavingKey(`education:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("education_articles").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setEducationArticles((current) => current.filter((article) => article.slug !== item.slug));
      setMessage(`${item.title} education article deleted.`);
    }

    setEducationDeleteTarget(null);
    setSavingKey(null);
  };

  const updateMemberReviewStatus = async (item: MemberReviewRow, status: MemberReviewStatus) => {
    if (!supabase || !user) return;

    setSavingKey(`review:${item.id}`);
    setMessage("");
    setErrorMessage("");

    const result =
      status === "approved"
        ? await supabase.rpc("approve_member_review", { p_review_id: item.id })
        : await supabase
            .from("member_reviews")
            .update({
              status,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", item.id)
            .select(
              "id,user_id,display_name,email,message,rating,status,reviewed_by,reviewed_at,created_at,updated_at,image_urls",
            )
            .single();

    const { data, error } = result;

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      const updatedReview = data as MemberReviewRow;
      setMemberReviews((current) =>
        current
          .map((review) => (review.id === item.id ? updatedReview : review))
          .filter(
            (review) =>
              status !== "approved" ||
              review.id === updatedReview.id ||
              review.user_id !== updatedReview.user_id ||
              review.status !== "approved",
          ),
      );
      setMessage(
        `${item.display_name || "Member"} review ${
          status === "approved"
            ? "approved. Older approved review from this member was removed."
            : status === "hidden"
              ? "hidden"
              : "marked pending"
        }.`,
      );
    }

    setSavingKey(null);
  };

  const deleteMemberReview = async (item: MemberReviewRow) => {
    if (!supabase) return;

    setSavingKey(`review:delete:${item.id}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("member_reviews").delete().eq("id", item.id);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setMemberReviews((current) => current.filter((review) => review.id !== item.id));
      setMessage(`${item.display_name || "Member"} review deleted.`);
    }

    setMemberReviewDeleteTarget(null);
    setSavingKey(null);
  };

  const saveEducationArticle = async (
    event: FormEvent<HTMLFormElement>,
    item: EditableEducationArticle,
  ) => {
    event.preventDefault();
    if (!supabase) return;

    const previousSlug = item.slug;
    const nextSlug = slugify(item.slug || item.title);

    setSavingKey(`education:${previousSlug}`);
    setMessage("");
    setErrorMessage("");

    const payload: EducationArticleRow = {
      ...item,
      slug: nextSlug,
      title: item.title.trim(),
      description: item.description.trim(),
      category: item.category,
      level: item.level.trim(),
      read_time: item.read_time.trim(),
      access: item.access,
      published_date: item.published_date.trim(),
      cover_title: item.cover_title.trim(),
      cover_subtitle: item.cover_subtitle.trim(),
      content: item.content.trim(),
      display_order: item.display_order,
    };

    const { data, error } = await supabase
      .from("education_articles")
      .upsert(payload, { onConflict: "slug" })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setEducationArticles((current) =>
        current.map((currentItem) =>
          currentItem.slug === previousSlug ? (data as EducationArticleRow) : currentItem,
        ),
      );
      setMessage(`${payload.title} education article updated.`);
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

  const saveOfferHeadline = async (
    event: FormEvent<HTMLFormElement>,
    item: EditableOfferHeadline,
  ) => {
    event.preventDefault();
    if (!supabase) return;

    const previousSlug = item.slug;
    const nextSlug = slugify(item.slug || item.headline);

    setSavingKey(`offer:${previousSlug}`);
    setMessage("");
    setErrorMessage("");

    const payload: OfferHeadlineRow = {
      ...item,
      slug: nextSlug,
      eyebrow: item.eyebrow.trim(),
      headline: item.headline.trim(),
      subheadline: item.subheadline.trim(),
      cta_label: item.cta_label.trim(),
      cta_url: item.cta_url.trim() || "/",
      tone: item.tone,
      starts_at: item.starts_at?.trim() || null,
      expires_at: item.expires_at?.trim() || null,
      display_order: Number(item.display_order) || 0,
    };

    const { data, error } = await supabase
      .from("offer_headlines")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug,eyebrow,headline,subheadline,cta_label,cta_url,tone,is_active,starts_at,expires_at,display_order",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setOfferHeadlines((current) =>
        current.map((currentItem) =>
          currentItem.slug === previousSlug ? (data as OfferHeadlineRow) : currentItem,
        ),
      );
      setMessage(`${payload.headline} offer headline updated.`);
    }

    setSavingKey(null);
  };

  const deleteOfferHeadline = async (item: EditableOfferHeadline) => {
    if (!supabase) return;

    setSavingKey(`offer:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("offer_headlines").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setOfferHeadlines((current) =>
        current.filter((currentItem) => currentItem.slug !== item.slug),
      );
      setMessage(`${item.headline} offer headline deleted.`);
    }

    setOfferHeadlineDeleteTarget(null);
    setSavingKey(null);
  };

  const deleteCommunitySocial = async (item: EditableCommunitySocial) => {
    if (!supabase) return;

    setSavingKey(`community:delete:${item.slug}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("community_socials").delete().eq("slug", item.slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setCommunitySocials((current) =>
        current.filter((currentItem) => currentItem.slug !== item.slug),
      );
      setMessage(`${item.name} community card deleted.`);
    }

    setCommunitySocialDeleteTarget(null);
    setSavingKey(null);
  };

  const saveDiscountCode = async (
    event: FormEvent<HTMLFormElement>,
    item: EditableDiscountCode,
  ) => {
    event.preventDefault();
    if (!supabase) return;

    const code = normalizeAdminDiscountCode(item.code);
    const value = Number(item.discount_value);
    const maxRedemptions = item.maxRedemptionsText.trim()
      ? Number(item.maxRedemptionsText.trim())
      : null;

    if (!code) {
      setErrorMessage("Please enter a discount code.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setErrorMessage("Discount value must be greater than 0.");
      return;
    }

    if (item.discount_type === "percent" && value > 100) {
      setErrorMessage("Percent discounts cannot be more than 100%.");
      return;
    }

    if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions < 1)) {
      setErrorMessage("Max redemptions must be empty or at least 1.");
      return;
    }

    setSavingKey(`discount:${item.id}`);
    setMessage("");
    setErrorMessage("");

    const payload = {
      code,
      description: item.description?.trim() || null,
      discount_type: item.discount_type,
      discount_value: value,
      applies_to: item.applies_to,
      is_active: item.is_active,
      max_redemptions: maxRedemptions,
      starts_at: item.startsAtText.trim() || null,
      expires_at: item.expiresAtText.trim() || null,
    };

    const query = item.id.startsWith("new-")
      ? supabase.from("discount_codes").insert(payload)
      : supabase.from("discount_codes").update(payload).eq("id", item.id);

    const { data, error } = await query
      .select(
        "id,code,description,discount_type,discount_value,applies_to,is_active,max_redemptions,redeemed_count,starts_at,expires_at,created_at,updated_at",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      const saved = toEditableDiscountCode(data as DiscountCodeRow);
      setDiscountCodes((current) =>
        current.map((currentItem) => (currentItem.id === item.id ? saved : currentItem)),
      );
      setMessage(`${saved.code} discount code saved.`);
    }

    setSavingKey(null);
  };

  const deleteDiscountCode = async (item: EditableDiscountCode) => {
    if (!supabase) return;

    if (item.id.startsWith("new-")) {
      setDiscountCodes((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setDiscountDeleteTarget(null);
      setMessage("Unsaved discount code removed.");
      return;
    }

    setSavingKey(`discount:delete:${item.id}`);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("discount_codes").delete().eq("id", item.id);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setDiscountCodes((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setMessage(`${item.code} discount code deleted.`);
    }

    setDiscountDeleteTarget(null);
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

  const promoteProfileRole = async (
    profile: UserProfileRow,
    nextRole: Exclude<ProfileRole, "member">,
  ) => {
    if (!supabase) return false;

    setSavingKey(`profile:${profile.id}`);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", profile.id)
      .select(
        "id,full_name,email,phone_number,discord_username,discord_user_id,discord_avatar_url,discord_connected_at,discord_guild_joined_at,discord_last_role_sync_at,discord_role_sync_status,discord_role_sync_error,role,created_at,updated_at",
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSavingKey(null);
      return false;
    }

    if (data) {
      setProfiles((current) =>
        current.map((currentProfile) =>
          currentProfile.id === profile.id
            ? {
                ...currentProfile,
                ...(data as BasicProfileRow),
              }
            : currentProfile,
        ),
      );
      setMessage(
        `${profile.full_name || profile.email || "Member"} promoted to ${profileRoleLabel(nextRole)}.`,
      );
    }

    setSavingKey(null);
    return true;
  };

  const openAuth = () => {
    setAuthMode("signin");
    setAuthOpen(true);
  };

  const teamProfiles = profiles.filter((profile) => profile.role !== "member");
  const memberProfiles = profiles.filter((profile) => profile.role === "member");
  const paidMemberProfiles = memberProfiles.filter(hasAnyPaidAccess);
  const paidNewsProfiles = memberProfiles.filter(hasPaidNewsSubscription);
  const extendableLiveTradingProfiles = memberProfiles.filter(hasExtendableLiveTradingAccess);
  const registeredMemberProfiles = memberProfiles.filter((profile) => !hasAnyPaidAccess(profile));

  const adminPanels = [
    {
      key: "staff" as const,
      title: "Staff Members",
      description: "Give members moderator or admin access.",
      count: teamProfiles.length,
      icon: ShieldCheck,
    },
    {
      key: "offers" as const,
      title: "Offer Headlines",
      description: "Show sharp offer banners below the site header.",
      count: offerHeadlines.length,
      icon: Megaphone,
    },
    {
      key: "communityMembers" as const,
      title: "Community Members",
      description: "Only members with paid access.",
      count: paidMemberProfiles.length,
      icon: UserCog,
    },
    {
      key: "registeredAccounts" as const,
      title: "Registered Accounts",
      description: "Users who signed up but have not paid yet.",
      count: registeredMemberProfiles.length,
      icon: UserPlus,
    },
    {
      key: "memberReviews" as const,
      title: "Member Reviews",
      description: "Approve member testimonials.",
      count: memberReviews.filter((review) => review.status === "pending").length,
      icon: MessageCircle,
    },
    {
      key: "education" as const,
      title: "Education Articles",
      description: "Write Study, Psychology, Risk, and Premium lessons.",
      count: educationArticles.length,
      icon: BookOpen,
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
      title: "Mentorship Offers",
      description: "Edit 1-to-1 and formation group coaching.",
      count: plans.length,
      icon: BadgeDollarSign,
    },
    {
      key: "discounts" as const,
      title: "Discount Codes",
      description: "Create checkout promo codes.",
      count: discountCodes.length,
      icon: BadgePercent,
    },
    {
      key: "live" as const,
      title: "Live Trading Access",
      description: "Control live-room package pricing.",
      count: livePackages.length,
      icon: Radio,
    },
    {
      key: "liveHistory" as const,
      title: "Extension History",
      description: "Review Live Trading access extensions.",
      count: liveAccessAdjustments.length,
      icon: History,
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
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Site content <span className="text-gradient-gold">control room.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Edit prop firm partners, coaching prices, live trading access, premium indicators,
                trading tools, education articles, and member access across the site.
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
                      educationArticles.length +
                      propFirms.length +
                      offerHeadlines.length +
                      communitySocials.length +
                      profiles.length +
                      extendableLiveTradingProfiles.length +
                      paidNewsProfiles.length +
                      memberReviews.length +
                      discountCodes.length
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

                    {visibleActivePanel === "education" && (
                      <AdminSection
                        title="Education Articles"
                        description="Manage articles shown inside the Study, Psychology, Risk Management, and Premium tabs."
                        contentClassName="grid-cols-1"
                        action={
                          <Button
                            type="button"
                            onClick={addEducationArticle}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Education Article
                          </Button>
                        }
                      >
                        <EducationArticlesList
                          articles={educationArticles}
                          savingKey={savingKey}
                          onTogglePublished={toggleEducationArticlePublished}
                          onDelete={setEducationDeleteTarget}
                        />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "coaching" && (
                      <AdminSection
                        title="Mentorship Offers"
                        description="Edit the two mentorship offers shown on the site. Promo campaigns are handled only with discount codes."
                      >
                        {plans.map((plan) => (
                          <MentorshipPlanEditor
                            key={plan.slug}
                            plan={plan}
                            saving={savingKey === `coaching:${plan.slug}`}
                            onChange={updatePlan}
                            onSubmit={savePlan}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "discounts" && (
                      <AdminSection
                        title="Discount Codes"
                        description="Create codes users can apply during checkout for live trading, mentorship, or news access."
                        action={
                          <Button
                            type="button"
                            onClick={addDiscountCode}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Discount Code
                          </Button>
                        }
                      >
                        {discountCodes.length ? (
                          discountCodes.map((item) => (
                            <DiscountCodeEditor
                              key={item.id}
                              item={item}
                              saving={savingKey === `discount:${item.id}`}
                              deleting={savingKey === `discount:delete:${item.id}`}
                              onChange={updateDiscountCode}
                              onSubmit={saveDiscountCode}
                              onDelete={(discount) => setDiscountDeleteTarget(discount)}
                            />
                          ))
                        ) : (
                          <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
                            No discount codes yet. Add your first code to let users apply a checkout
                            discount.
                          </div>
                        )}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "offers" && (
                      <AdminSection
                        title="Offer Headlines"
                        description="Create the compact offer banners shown below the public site header."
                        contentClassName="grid-cols-1"
                        action={
                          <Button
                            type="button"
                            onClick={addOfferHeadline}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Offer Headline
                          </Button>
                        }
                      >
                        {offerHeadlines.length ? (
                          offerHeadlines.map((item) => (
                            <OfferHeadlineEditor
                              key={item.slug}
                              item={item}
                              saving={savingKey === `offer:${item.slug}`}
                              deleting={savingKey === `offer:delete:${item.slug}`}
                              onChange={updateOfferHeadline}
                              onSubmit={saveOfferHeadline}
                              onDelete={setOfferHeadlineDeleteTarget}
                            />
                          ))
                        ) : (
                          <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
                            No offer headlines yet. Add one to show a compact campaign banner below
                            the public header.
                          </div>
                        )}
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
                          onPromote={promoteProfileRole}
                        />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "communityMembers" && (
                      <AdminSection
                        title="Community Members"
                        description="Only users with verified paid access appear here."
                        contentClassName="grid-cols-1"
                      >
                        <CommunityMembersPanel memberProfiles={memberProfiles} />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "registeredAccounts" && (
                      <AdminSection
                        title="Registered Accounts"
                        description="Users who created an account but do not have paid access yet."
                        contentClassName="grid-cols-1"
                      >
                        <RegisteredAccountsPanel memberProfiles={memberProfiles} />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "memberReviews" && (
                      <AdminSection
                        title="Member Reviews"
                        description="Approve member-submitted reviews before they appear on the homepage."
                        contentClassName="grid-cols-1"
                      >
                        <MemberReviewsPanel
                          reviews={memberReviews}
                          savingKey={savingKey}
                          onStatusChange={updateMemberReviewStatus}
                          onDelete={setMemberReviewDeleteTarget}
                        />
                      </AdminSection>
                    )}

                    {visibleActivePanel === "community" && (
                      <AdminSection
                        title="ZacTrades Community"
                        description="Add and edit the social cards shown in the homepage community section."
                        action={
                          <Button
                            type="button"
                            onClick={addCommunitySocial}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Social Link
                          </Button>
                        }
                      >
                        {communitySocials.map((item) => (
                          <CommunitySocialEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `community:${item.slug}`}
                            deleting={savingKey === `community:delete:${item.slug}`}
                            onChange={updateCommunitySocial}
                            onSubmit={saveCommunitySocial}
                            onDelete={(social) => setCommunitySocialDeleteTarget(social)}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "propfirms" && (
                      <AdminSection
                        title="Propfirms"
                        description="Edit partner firm cards, promo codes, discounts, ratings, and featured status."
                        action={
                          <Button
                            type="button"
                            onClick={addPropFirm}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Prop Firm
                          </Button>
                        }
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
                        description="Edit live-room package prices, badges, and active access time."
                      >
                        <LiveAccessExtensionTool
                          activeCount={extendableLiveTradingProfiles.length}
                          days={liveExtensionDays}
                          saving={savingKey === "live:extension"}
                          onDaysChange={setLiveExtensionDays}
                          onSubmit={extendLiveTradingAccess}
                        />
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

                    {visibleActivePanel === "liveHistory" && (
                      <AdminSection
                        title="Live Trading Extension History"
                        description="See every recent admin extension made to active paid Live Trading access."
                        contentClassName="grid-cols-1"
                      >
                        <LiveAccessExtensionHistoryPanel adjustments={liveAccessAdjustments} />
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
                            deleting={savingKey === `indicator:delete:${item.slug}`}
                            onChange={updateIndicator}
                            onSubmit={saveIndicator}
                            onDelete={(indicator) => setIndicatorDeleteTarget(indicator)}
                          />
                        ))}
                      </AdminSection>
                    )}

                    {visibleActivePanel === "tools" && (
                      <AdminSection
                        title="Trading Tools"
                        description="Edit the tools used for consistent execution, including discounts and promo codes."
                        action={
                          <Button
                            type="button"
                            onClick={addTradingTool}
                            className="text-primary-foreground glow-primary hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Trading Tool
                          </Button>
                        }
                      >
                        {tools.map((item) => (
                          <ToolEditor
                            key={item.slug}
                            item={item}
                            saving={savingKey === `tool:${item.slug}`}
                            deleting={savingKey === `tool:delete:${item.slug}`}
                            onChange={updateTool}
                            onSubmit={saveTool}
                            onDelete={(tool) => setToolDeleteTarget(tool)}
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
      <AlertDialog
        open={liveExtensionConfirmDays !== null}
        onOpenChange={(open) => {
          if (!open && savingKey !== "live:extension") setLiveExtensionConfirmDays(null);
        }}
      >
        <AlertDialogContent className="glass-strong max-w-md border-border/60 p-0 shadow-2xl">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative p-6">
              <AlertDialogHeader>
                <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
                  <Plus className="h-5 w-5" />
                </div>
                <AlertDialogTitle className="font-display text-2xl">
                  Extend Live Trading access?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will add{" "}
                  <span className="font-semibold text-foreground">
                    {liveExtensionConfirmDays ?? 0} day
                    {liveExtensionConfirmDays === 1 ? "" : "s"}
                  </span>{" "}
                  to every active paid Live Trading user with a future expiry date.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey === "live:extension"}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={savingKey === "live:extension" || liveExtensionConfirmDays === null}
                  onClick={(event) => {
                    event.preventDefault();
                    void confirmLiveTradingAccessExtension();
                  }}
                  className="bg-gold text-background hover:bg-gold/90"
                >
                  {savingKey === "live:extension" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Confirm extension
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(memberReviewDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setMemberReviewDeleteTarget(null);
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
                  Delete member review?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will permanently remove the review from{" "}
                  <span className="font-semibold text-foreground">
                    {memberReviewDeleteTarget?.display_name ?? "this member"}
                  </span>
                  . This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("review:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!memberReviewDeleteTarget || savingKey?.startsWith("review:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (memberReviewDeleteTarget) void deleteMemberReview(memberReviewDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("review:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete review
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(educationDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setEducationDeleteTarget(null);
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
                  Delete education article?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {educationDeleteTarget?.title ?? "this education article"}
                  </span>{" "}
                  from the Education page. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("education:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!educationDeleteTarget || savingKey?.startsWith("education:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (educationDeleteTarget) void deleteEducationArticle(educationDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("education:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete education article
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(discountDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDiscountDeleteTarget(null);
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
                  Delete discount code?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {discountDeleteTarget?.code ?? "this discount code"}
                  </span>{" "}
                  from checkout. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("discount:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!discountDeleteTarget || savingKey?.startsWith("discount:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (discountDeleteTarget) void deleteDiscountCode(discountDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("discount:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete discount code
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(offerHeadlineDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setOfferHeadlineDeleteTarget(null);
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
                  Delete offer headline?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {offerHeadlineDeleteTarget?.headline ?? "this offer headline"}
                  </span>{" "}
                  from the public header offers. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("offer:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!offerHeadlineDeleteTarget || savingKey?.startsWith("offer:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (offerHeadlineDeleteTarget) {
                      void deleteOfferHeadline(offerHeadlineDeleteTarget);
                    }
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("offer:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete offer headline
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(communitySocialDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setCommunitySocialDeleteTarget(null);
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
                  Delete community card?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {communitySocialDeleteTarget?.name ?? "this community card"}
                  </span>{" "}
                  from the homepage ZacTrades Community section. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("community:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={
                    !communitySocialDeleteTarget || savingKey?.startsWith("community:delete")
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (communitySocialDeleteTarget) {
                      void deleteCommunitySocial(communitySocialDeleteTarget);
                    }
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("community:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete community card
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(indicatorDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setIndicatorDeleteTarget(null);
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
                  Delete indicator?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {indicatorDeleteTarget?.name ?? "this indicator"}
                  </span>{" "}
                  from the Premium Indicators page. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("indicator:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!indicatorDeleteTarget || savingKey?.startsWith("indicator:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (indicatorDeleteTarget) void deleteIndicator(indicatorDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("indicator:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete indicator
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(toolDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setToolDeleteTarget(null);
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
                  Delete trading tool?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This will remove{" "}
                  <span className="font-semibold text-foreground">
                    {toolDeleteTarget?.name ?? "this trading tool"}
                  </span>{" "}
                  from the Trading Tools section. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 gap-3 sm:space-x-0">
                <AlertDialogCancel
                  disabled={savingKey?.startsWith("tool:delete")}
                  className="mt-0 border-border/60 bg-background/45"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!toolDeleteTarget || savingKey?.startsWith("tool:delete")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (toolDeleteTarget) void deleteTool(toolDeleteTarget);
                  }}
                  className="bg-bear text-white hover:bg-bear/90"
                >
                  {savingKey?.startsWith("tool:delete") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete trading tool
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
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

function MentorshipPlanEditor({
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
  const label = plan.slug === "one_to_one" ? "1-to-1 Coaching" : "Formation Group Coaching";

  return (
    <form
      onSubmit={(event) => onSubmit(event, plan)}
      className={`glass relative overflow-hidden rounded-2xl p-5 md:p-6 ${
        plan.is_featured ? "border-gold/35" : "border-primary/20"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/40 text-xs text-electric">
              {label}
            </Badge>
            <h2 className="font-display text-xl font-bold sm:text-2xl">{plan.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Edit the offer content and checkout price. Use discount codes for promotions.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ToggleButton
              active={plan.is_active}
              label="Visible"
              onClick={() => onChange(plan.slug, { is_active: !plan.is_active })}
            />
            <ToggleButton
              active={plan.is_featured}
              label="Featured"
              onClick={() => onChange(plan.slug, { is_featured: !plan.is_featured })}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor={`${plan.slug}-title`} className="text-xs">
              Offer title
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
                Display price
              </Label>
              <Input
                id={`${plan.slug}-display-price`}
                value={plan.display_price}
                onChange={(event) => onChange(plan.slug, { display_price: event.target.value })}
                placeholder="$499"
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
              <Label htmlFor={`${plan.slug}-monthly-label`} className="text-xs">
                Checkout price label
              </Label>
              <Input
                id={`${plan.slug}-monthly-label`}
                value={plan.checkout_monthly_label}
                onChange={(event) =>
                  onChange(plan.slug, { checkout_monthly_label: event.target.value })
                }
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
              className="mt-1 min-h-32 bg-background/45"
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
            Save mentorship offer
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

function MemberReviewsPanel({
  reviews,
  savingKey,
  onStatusChange,
  onDelete,
}: {
  reviews: MemberReviewRow[];
  savingKey: string | null;
  onStatusChange: (item: MemberReviewRow, status: MemberReviewStatus) => void;
  onDelete: (item: MemberReviewRow) => void;
}) {
  const statusCounts = {
    pending: reviews.filter((review) => review.status === "pending").length,
    approved: reviews.filter((review) => review.status === "approved").length,
    hidden: reviews.filter((review) => review.status === "hidden").length,
  };

  if (!reviews.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-electric" />
        <h3 className="mt-4 font-display text-2xl font-bold">No member reviews yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          When a logged-in member writes a review from the homepage, it will appear here first for
          approval.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <ReviewStat label="Pending" value={statusCounts.pending} tone="gold" />
        <ReviewStat label="Approved" value={statusCounts.approved} tone="bull" />
        <ReviewStat label="Hidden" value={statusCounts.hidden} tone="muted" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => {
          const saving = savingKey === `review:${review.id}`;
          const deleting = savingKey === `review:delete:${review.id}`;

          return (
            <article
              key={review.id}
              className="group overflow-hidden rounded-3xl border border-border/55 bg-card/35 p-5 transition-all hover:border-primary/35 hover:bg-primary/5"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary ring-1 ring-primary/25">
                      {(review.display_name || "M")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-xl font-bold">
                        {review.display_name || "ZacTrades member"}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {review.email || "No email"} · {formatAdminDate(review.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${reviewStatusClass(review.status)}`}
                    >
                      {review.status}
                    </Badge>
                    <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold">
                      {review.rating}/5
                    </Badge>
                  </div>
                </div>

                <p className="whitespace-pre-line rounded-2xl border border-border/50 bg-background/35 p-4 text-sm leading-7 text-muted-foreground">
                  {review.message}
                </p>

                {review.image_urls?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {review.image_urls.map((imageUrl, imageIndex) => (
                      <a
                        key={`${review.id}-image-${imageIndex}`}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group/image overflow-hidden rounded-2xl border border-primary/20 bg-background/45"
                      >
                        <img
                          src={imageUrl}
                          alt={`${review.display_name || "Member"} review upload ${imageIndex + 1}`}
                          className="aspect-video w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    disabled={saving || deleting || review.status === "approved"}
                    onClick={() => onStatusChange(review, "approved")}
                    className="border border-bull/35 bg-bull/10 text-bull hover:bg-bull/15"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || deleting || review.status === "hidden"}
                    onClick={() => onStatusChange(review, "hidden")}
                    className="border border-gold/35 bg-gold/10 text-gold hover:bg-gold/15"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Hide
                  </Button>
                  {review.status !== "pending" && (
                    <Button
                      type="button"
                      disabled={saving || deleting}
                      onClick={() => onStatusChange(review, "pending")}
                      variant="outline"
                      className="border-border/60 bg-background/40"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Back to pending
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={saving || deleting}
                    onClick={() => onDelete(review)}
                    className="border border-bear/35 bg-bear/10 text-bear hover:bg-bear/15 sm:ml-auto"
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
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "gold" | "bull" | "muted";
}) {
  const toneClass =
    tone === "gold" ? "text-gold" : tone === "bull" ? "text-bull" : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border/55 bg-card/35 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className={`mt-3 font-display text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function reviewStatusClass(status: MemberReviewStatus) {
  if (status === "approved") return "border-bull/40 bg-bull/10 text-bull";
  if (status === "hidden") return "border-muted-foreground/35 bg-muted/20 text-muted-foreground";
  return "border-gold/40 bg-gold/10 text-gold";
}

function EducationArticlesList({
  articles,
  savingKey,
  onTogglePublished,
  onDelete,
}: {
  articles: EditableEducationArticle[];
  savingKey: string | null;
  onTogglePublished: (item: EditableEducationArticle) => void;
  onDelete: (item: EditableEducationArticle) => void;
}) {
  if (!articles.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-electric" />
        <h3 className="mt-4 font-display text-2xl font-bold">No education articles yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Add your first article from the dedicated editor page, then manage visibility here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {articles.map((item) => {
        const categoryLabel =
          educationCategoryOptions.find((option) => option.value === item.category)?.label ??
          "Education";
        const toggleSaving = savingKey === `education:toggle:${item.slug}`;
        const deleteSaving = savingKey === `education:delete:${item.slug}`;

        return (
          <article
            key={item.slug}
            className="group overflow-hidden rounded-2xl border border-border/55 bg-card/35 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 md:p-5"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 text-electric">
                    {categoryLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      item.is_published
                        ? "border-bull/40 bg-bull/10 text-bull"
                        : "border-bear/40 bg-bear/10 text-bear"
                    }
                  >
                    {item.is_published ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="border-border/60 text-muted-foreground">
                    {item.access}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.read_time}</span>
                </div>
                <h3 className="mt-3 truncate font-display text-xl font-bold text-foreground md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground/80">/{item.slug}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:min-w-[520px] lg:justify-end">
                <Button asChild variant="outline" className="border-border/60 bg-background/40">
                  <a href={`/education/${item.slug}`} target="_blank" rel="noreferrer">
                    <BookOpen className="h-4 w-4" />
                    Preview
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-primary/45 bg-primary/10 text-electric hover:bg-primary/15"
                >
                  <a href={`/admin/education/edit/${item.slug}`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </a>
                </Button>
                <Button
                  type="button"
                  disabled={toggleSaving || deleteSaving}
                  onClick={() => onTogglePublished(item)}
                  className={
                    item.is_published
                      ? "border border-bear/35 bg-bear/10 text-bear hover:bg-bear/15"
                      : "border border-bull/35 bg-bull/10 text-bull hover:bg-bull/15"
                  }
                >
                  {toggleSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {item.is_published ? "Make inactive" : "Make active"}
                </Button>
                <Button
                  type="button"
                  disabled={toggleSaving || deleteSaving}
                  onClick={() => onDelete(item)}
                  className="border border-bear/35 bg-bear/10 text-bear hover:bg-bear/15"
                >
                  {deleteSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EducationArticleEditor({
  item,
  saving,
  onChange,
  onSubmit,
}: {
  item: EditableEducationArticle;
  saving: boolean;
  onChange: (slug: string, patch: Partial<EditableEducationArticle>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableEducationArticle) => void;
}) {
  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className={`glass relative overflow-hidden rounded-2xl p-5 md:p-6 ${
        item.access === "Members" ? "border-gold/35" : "border-primary/20"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/40 text-xs text-electric">
              {educationCategoryOptions.find((option) => option.value === item.category)?.label ??
                "Education"}
            </Badge>
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls articles shown on the Education Center tabs.
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30 sm:grid">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-education-title`}
              label="Title"
              value={item.title}
              onChange={(value) => onChange(item.slug, { title: value })}
            />
            <div>
              <Label htmlFor={`${item.slug}-education-category`} className="text-xs">
                Education tab
              </Label>
              <select
                id={`${item.slug}-education-category`}
                value={item.category}
                onChange={(event) =>
                  onChange(item.slug, {
                    category: event.target.value as EducationArticleCategory,
                  })
                }
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                {educationCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id={`${item.slug}-education-level`}
              label="Label"
              value={item.level}
              onChange={(value) => onChange(item.slug, { level: value })}
              placeholder="Core, Mindset, Risk, Advanced"
            />
            <Field
              id={`${item.slug}-education-read-time`}
              label="Read time"
              value={item.read_time}
              onChange={(value) => onChange(item.slug, { read_time: value })}
              placeholder="12 min read"
            />
          </div>

          <Field
            id={`${item.slug}-education-slug`}
            label="Slug"
            value={item.slug}
            onChange={(value) => onChange(item.slug, { slug: slugify(value) })}
          />

          <TextareaField
            id={`${item.slug}-education-description`}
            label="Card description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
            placeholder="Short description shown on the Education card."
          />

          <Field
            id={`${item.slug}-education-cover-title`}
            label="Cover title"
            value={item.cover_title}
            onChange={(value) => onChange(item.slug, { cover_title: value })}
            placeholder="Liquidity Map"
          />

          <TextareaField
            id={`${item.slug}-education-content`}
            label="Full article content"
            value={item.content}
            onChange={(value) => onChange(item.slug, { content: value })}
            placeholder="Write paragraphs separated by a blank line."
          />

          <div>
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
          Save education article
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
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.duration}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the live-room package card and checkout price.
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 sm:grid place-items-center rounded-xl bg-bull/15 text-bull ring-1 ring-bull/30">
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

function LiveAccessExtensionTool({
  activeCount,
  days,
  saving,
  onDaysChange,
  onSubmit,
}: {
  activeCount: number;
  days: string;
  saving: boolean;
  onDaysChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="glass relative overflow-hidden rounded-2xl p-5 md:p-6">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <Badge variant="outline" className="mb-4 w-fit border-gold/40 bg-gold/10 text-gold">
            Live Trading pause
          </Badge>
          <h3 className="font-display text-xl font-bold sm:text-2xl">Extend active paid access</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Adds days only to current paid Live Trading users with a future expiry date.
          </p>
        </div>

        <div className="grid gap-4">
          <Field
            id="live-extension-days"
            label="Extra days"
            value={days}
            onChange={onDaysChange}
            placeholder="7"
          />

          <Button
            type="submit"
            size="lg"
            disabled={saving || activeCount === 0}
            className="w-full text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Extend Live Trading access
          </Button>
        </div>
      </div>
    </form>
  );
}

function LiveAccessExtensionHistoryPanel({
  adjustments,
}: {
  adjustments: LiveTradingAccessAdjustmentRow[];
}) {
  const latestAdjustment = adjustments[0] ?? null;
  const totalRecentDays = adjustments.reduce(
    (total, adjustment) => total + adjustment.extra_days,
    0,
  );
  const totalAffectedMembers = adjustments.reduce(
    (total, adjustment) => total + adjustment.affected_count,
    0,
  );

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5 md:p-6">
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Extension History</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track the recent Live Trading access extensions already applied by the admin team.
            </p>
          </div>
          {latestAdjustment && (
            <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 lg:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                Last extension
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">
                +{latestAdjustment.extra_days} day
                {latestAdjustment.extra_days === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatAdminDateTime(latestAdjustment.created_at)}
              </p>
            </div>
          )}
        </div>

        {adjustments.length ? (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MiniMetric label="Extensions" value={String(adjustments.length)} />
              <MiniMetric label="Days added" value={`+${totalRecentDays}`} />
              <MiniMetric label="Affected users" value={String(totalAffectedMembers)} />
            </div>

            <div className="mt-6 space-y-3">
              {adjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="rounded-2xl border border-border/45 bg-background/35 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-sm font-bold text-gold">
                        +{adjustment.extra_days} day
                        {adjustment.extra_days === 1 ? "" : "s"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatAdminDateTime(adjustment.created_at)}
                      </span>
                    </div>
                    <span className="rounded-full border border-border/45 bg-card/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {adjustment.affected_count} active paid user
                      {adjustment.affected_count === 1 ? "" : "s"} affected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-background/25 p-6 text-sm leading-6 text-muted-foreground">
            No extension has been recorded yet. After you extend active paid access, the historique
            will appear here with the date, extra days, affected members, and admin details.
          </div>
        )}
      </div>
    </div>
  );
}

function IndicatorEditor({
  item,
  saving,
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: IndicatorRow;
  saving: boolean;
  deleting: boolean;
  onChange: (slug: string, patch: Partial<IndicatorRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: IndicatorRow) => void;
  onDelete: (item: IndicatorRow) => void;
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
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the premium indicators section and TradingView button.
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 sm:grid place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
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
          <Field
            id={`${item.slug}-video-url`}
            label="Video URL"
            value={item.video_url ?? ""}
            onChange={(value) => onChange(item.slug, { video_url: value.trim() || null })}
            placeholder="https://.../indicator-video.mp4"
          />
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
            Save indicator
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

function ToolEditor({
  item,
  saving,
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: EditableTool;
  saving: boolean;
  deleting: boolean;
  onChange: (slug: string, patch: Partial<EditableTool>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableTool) => void;
  onDelete: (item: EditableTool) => void;
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
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the tools stack, promo code, discount, and outbound link.
            </p>
          </div>
          <div className="hidden h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white p-1.5 ring-1 ring-gold/30 sm:grid">
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={`${item.name} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              <SlidersHorizontal className="h-5 w-5 text-gold" />
            )}
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
          <LogoFileInput
            id={`${item.slug}-tool-logo-file`}
            label="Upload logo"
            saveHint="click Save tool to upload."
          />
          <TextareaField
            id={`${item.slug}-highlights`}
            label="Highlights"
            value={item.highlightsText}
            onChange={(value) => onChange(item.slug, { highlightsText: value })}
            placeholder="One highlight per line"
          />
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
            Save tool
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
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the Propfirms page partner cards and promo code rows.
            </p>
          </div>
          <div
            className="hidden h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] font-display text-sm font-bold text-white ring-1 ring-white/15 sm:grid"
            style={{ boxShadow: `0 0 22px color-mix(in oklab, ${item.color} 35%, transparent)` }}
          >
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={`${item.name} logo`}
                className="h-full w-full object-contain p-1.5"
                loading="lazy"
              />
            ) : (
              item.logo
            )}
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

          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Prop firm logo</p>
                <p className="text-xs text-muted-foreground">
                  Upload a logo from your laptop, then click Save prop firm.
                </p>
              </div>
              {item.logo_url ? (
                <span className="rounded-full border border-bull/30 bg-bull/10 px-3 py-1 text-xs font-semibold text-bull">
                  Logo saved
                </span>
              ) : (
                <span className="rounded-full border border-border/50 bg-background/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Initials fallback
                </span>
              )}
            </div>
            <LogoFileInput id={`${item.slug}-firm-logo-file`} label="Upload logo" />
          </div>

          <TextareaField
            id={`${item.slug}-firm-description`}
            label="Description"
            value={item.description}
            onChange={(value) => onChange(item.slug, { description: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StarRatingEditor
              id={`${item.slug}-firm-rating`}
              value={Number(item.rating) || 0}
              onChange={(value) => onChange(item.slug, { rating: value })}
            />
            <Field
              id={`${item.slug}-firm-capital`}
              label="Max capital"
              value={item.max_capital}
              onChange={(value) => onChange(item.slug, { max_capital: value })}
            />
            <Field
              id={`${item.slug}-firm-payout`}
              label="Payouts"
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
            label="Platforms"
            value={item.featuresText}
            onChange={(value) => onChange(item.slug, { featuresText: value })}
            placeholder="One platform per line, e.g. TV, MT5, Web"
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

function DiscountCodeEditor({
  item,
  saving,
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: EditableDiscountCode;
  saving: boolean;
  deleting: boolean;
  onChange: (id: string, patch: Partial<EditableDiscountCode>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableDiscountCode) => void;
  onDelete: (item: EditableDiscountCode) => void;
}) {
  const selectedDiscountTargets = getDiscountApplyTargets(item.applies_to);
  const selectedDiscountTargetSummary = formatDiscountApplyTargets(item.applies_to);

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
              Checkout discount
            </Badge>
            <h3 className="font-display text-xl font-bold sm:text-2xl">
              {item.code || "New discount code"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Users enter this code in checkout before paying. Final discounts are verified
              server-side.
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 sm:grid place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
            <BadgePercent className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.id}-discount-code`}
              label="Code"
              value={item.code}
              onChange={(value) => onChange(item.id, { code: value })}
              placeholder="ZAC10"
            />
            <Field
              id={`${item.id}-discount-description`}
              label="Description"
              value={item.description ?? ""}
              onChange={(value) => onChange(item.id, { description: value })}
              placeholder="Launch offer"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor={`${item.id}-discount-type`} className="text-xs">
                Discount type
              </Label>
              <select
                id={`${item.id}-discount-type`}
                value={item.discount_type}
                onChange={(event) =>
                  onChange(item.id, { discount_type: event.target.value as DiscountType })
                }
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed USD</option>
              </select>
            </div>

            <div>
              <Label htmlFor={`${item.id}-discount-value`} className="text-xs">
                Value {item.discount_type === "percent" ? "(%)" : "(USD)"}
              </Label>
              <Input
                id={`${item.id}-discount-value`}
                type="number"
                min="0"
                step="0.01"
                value={`${item.discount_value}`}
                onChange={(event) =>
                  onChange(item.id, { discount_value: Number(event.target.value) || 0 })
                }
                className="mt-1 bg-background/45"
              />
            </div>

            <Field
              id={`${item.id}-discount-max`}
              label="Max uses"
              value={item.maxRedemptionsText}
              onChange={(value) => onChange(item.id, { maxRedemptionsText: value })}
              placeholder="Unlimited"
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/25 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Coupon scope
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose one or more products where this code can be used.
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-gold/35 bg-gold/10 text-gold">
                {selectedDiscountTargetSummary}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {discountApplyTargetOptions.map((option) => {
                const isSelected = selectedDiscountTargets.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onChange(item.id, {
                        applies_to: toggleDiscountApplyTarget(item.applies_to, option.value),
                      })
                    }
                    className={`group relative min-h-11 min-w-[104px] overflow-hidden rounded-full border px-3.5 py-2 text-left transition-all duration-200 sm:min-w-[116px] ${
                      isSelected
                        ? "border-gold/70 bg-gradient-to-br from-gold/20 via-gold/10 to-primary/10 text-foreground shadow-[0_0_24px_rgba(245,184,63,0.14)]"
                        : "border-border/60 bg-card/25 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`absolute inset-x-3 top-0 h-px transition-opacity ${
                        isSelected
                          ? "bg-gradient-to-r from-transparent via-gold/80 to-transparent opacity-100"
                          : "bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100"
                      }`}
                    />
                    <span className="flex items-start gap-2.5">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-gold bg-gold text-background"
                            : "border-border/70 bg-background/45 text-transparent group-hover:border-primary/60"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 text-sm font-semibold leading-tight">
                        {option.shortLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              id={item.id + "-discount-start"}
              label="Starts at"
              value={item.startsAtText}
              onChange={(value) => onChange(item.id, { startsAtText: value })}
            />
            <DateField
              id={item.id + "-discount-expires"}
              label="Expires at"
              value={item.expiresAtText}
              onChange={(value) => onChange(item.id, { expiresAtText: value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleButton
              active={item.is_active}
              label="Active"
              onClick={() => onChange(item.id, { is_active: !item.is_active })}
            />
            <div className="rounded-xl border border-border/60 bg-background/35 px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Used</div>
              <div className="mt-1 font-display text-xl font-bold text-gold">
                {item.redeemed_count}
                {item.max_redemptions ? ` / ${item.max_redemptions}` : ""}
              </div>
            </div>
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
            Save discount
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

function OfferHeadlineEditor({
  item,
  saving,
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: EditableOfferHeadline;
  saving: boolean;
  deleting: boolean;
  onChange: (slug: string, patch: Partial<EditableOfferHeadline>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableOfferHeadline) => void;
  onDelete: (item: EditableOfferHeadline) => void;
}) {
  const toneClass = offerToneClassName(item.tone);

  return (
    <form
      onSubmit={(event) => onSubmit(event, item)}
      className="glass relative overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div
        className={`absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${toneClass.glow}`}
      />
      <div className="relative">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:items-start">
          <div className="min-w-0">
            <Badge variant="outline" className={`mb-4 text-xs ${toneClass.badge}`}>
              Header offer
            </Badge>
            <h3 className="max-w-3xl text-wrap font-display text-2xl font-bold leading-tight sm:text-3xl">
              {item.headline || "New offer headline"}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This appears below the public site header for visitors. Keep it sharp, useful, and
              linked to the right checkout or page.
            </p>
          </div>

          <div className={`w-full rounded-2xl border p-3 sm:p-4 ${toneClass.preview}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${toneClass.icon}`}
              >
                <Megaphone className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${toneClass.text}`}
                >
                  {item.eyebrow || "Limited offer"}
                </div>
                <p className="truncate text-sm font-bold text-foreground sm:text-base">
                  {item.headline || "Offer headline preview"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.subheadline || "Offer subheadline preview"}
                </p>
              </div>
              <span
                className={`hidden max-w-40 shrink-0 truncate rounded-full border border-current/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] md:inline-block ${toneClass.text}`}
              >
                {item.cta_label || "View offer"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${item.slug}-offer-slug`}
              label="Slug"
              value={item.slug}
              onChange={(value) => onChange(item.slug, { slug: slugify(value) })}
              placeholder="black-friday-live-room"
            />
            <Field
              id={`${item.slug}-offer-eyebrow`}
              label="Small label"
              value={item.eyebrow}
              onChange={(value) => onChange(item.slug, { eyebrow: value })}
              placeholder="Limited offer"
            />
          </div>

          <Field
            id={`${item.slug}-offer-headline`}
            label="Headline"
            value={item.headline}
            onChange={(value) => onChange(item.slug, { headline: value })}
            placeholder="Join before the next live-room cycle starts."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              id={`${item.slug}-offer-cta-label`}
              label="Button label"
              value={item.cta_label}
              onChange={(value) => onChange(item.slug, { cta_label: value })}
              placeholder="Get access"
            />
            <Field
              id={`${item.slug}-offer-cta-url`}
              label="Button URL"
              value={item.cta_url}
              onChange={(value) => onChange(item.slug, { cta_url: value })}
              placeholder="/live-trading"
            />
            <div>
              <Label htmlFor={`${item.slug}-offer-tone`} className="text-xs">
                Tone
              </Label>
              <select
                id={`${item.slug}-offer-tone`}
                value={item.tone}
                onChange={(event) =>
                  onChange(item.slug, { tone: event.target.value as OfferHeadlineTone })
                }
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="gold">Gold</option>
                <option value="electric">Electric blue</option>
                <option value="bull">Green</option>
                <option value="violet">Violet</option>
              </select>
            </div>
            <Field
              id={`${item.slug}-offer-order`}
              label="Order"
              value={`${item.display_order}`}
              onChange={(value) => onChange(item.slug, { display_order: Number(value) || 0 })}
              placeholder="1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              id={`${item.slug}-offer-starts`}
              label="Starts at"
              value={dateInputValue(item.starts_at)}
              onChange={(value) => onChange(item.slug, { starts_at: value || null })}
            />
            <DateField
              id={`${item.slug}-offer-expires`}
              label="Expires at"
              value={dateInputValue(item.expires_at)}
              onChange={(value) => onChange(item.slug, { expires_at: value || null })}
            />
          </div>

          <ToggleButton
            active={item.is_active}
            label="Visible"
            onClick={() => onChange(item.slug, { is_active: !item.is_active })}
          />
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
            Save offer headline
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
  deleting,
  onChange,
  onSubmit,
  onDelete,
}: {
  item: EditableCommunitySocial;
  saving: boolean;
  deleting: boolean;
  onChange: (slug: string, patch: Partial<EditableCommunitySocial>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: EditableCommunitySocial) => void;
  onDelete: (item: EditableCommunitySocial) => void;
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
            <h3 className="font-display text-xl font-bold sm:text-2xl">{item.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Controls the social card shown in the homepage community section.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Icon keys: youtube, instagram, music, message. Color styles: bear, gold, primary,
              bull.
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 sm:grid place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
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

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button
            type="submit"
            size="lg"
            disabled={saving || deleting}
            className="w-full text-primary-foreground glow-primary hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save community card
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

function StaffMembersPanel({
  profiles,
  currentUserId,
  savingKey,
  onChange,
  onSubmit,
  onPromote,
}: {
  profiles: UserProfileRow[];
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
  onPromote: (profile: UserProfileRow, role: StaffPromoteRole) => Promise<boolean>;
}) {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteSearch, setPromoteSearch] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffPromoteRole>("moderator");
  const visibleStaffProfiles = profiles.filter(
    (profile) => profile.role !== "member" && profile.id !== currentUserId,
  );
  const adminCount = visibleStaffProfiles.filter((profile) => profile.role === "admin").length;
  const moderatorCount = visibleStaffProfiles.filter(
    (profile) => profile.role === "moderator",
  ).length;
  const memberProfiles = profiles.filter((profile) => profile.role === "member");
  const normalizedSearch = promoteSearch.trim().toLowerCase();
  const filteredMemberProfiles = normalizedSearch
    ? memberProfiles.filter((profile) =>
        [
          profile.full_name,
          profile.email,
          profile.phone_number,
          profile.discord_username,
          profile.discord_user_id,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch)),
      )
    : memberProfiles.slice(0, 8);
  const selectedProfile =
    memberProfiles.find((profile) => profile.id === selectedProfileId) ?? filteredMemberProfiles[0];

  const resetPromoteDialog = () => {
    setPromoteSearch("");
    setSelectedProfileId("");
    setSelectedRole("moderator");
  };

  const handlePromoteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProfile) return;

    const promoted = await onPromote(selectedProfile, selectedRole);

    if (promoted) {
      setPromoteOpen(false);
      resetPromoteDialog();
    }
  };

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
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Badge variant="outline" className="border-primary/45 bg-primary/10 text-electric">
              Staff control center
            </Badge>
            <Button
              type="button"
              onClick={() => setPromoteOpen(true)}
              className="w-fit text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <UserPlus className="h-4 w-4" />
              Promote Member
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[280px]">
            <StaffMetric label="Admins" value={`${adminCount}`} tone="gold" />
            <StaffMetric label="Moderators" value={`${moderatorCount}`} tone="green" />
          </div>
        </div>
      </div>

      <StaffRoleGroup
        title="Current Staff"
        description="Admins and moderators who can help operate the platform."
        emptyMessage="No other staff members yet. Promote a trusted member below."
        profiles={visibleStaffProfiles}
        icon="staff"
        currentUserId={currentUserId}
        savingKey={savingKey}
        onChange={onChange}
        onSubmit={onSubmit}
      />

      <Dialog
        open={promoteOpen}
        onOpenChange={(open) => {
          setPromoteOpen(open);
          if (!open) resetPromoteDialog();
        }}
      >
        <DialogContent className="glass-strong max-w-3xl border-border/60 p-0">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative p-6">
              <DialogHeader>
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-primary/35 bg-primary/10 text-electric">
                  <UserPlus className="h-5 w-5" />
                </div>
                <DialogTitle className="font-display text-3xl">Promote Member</DialogTitle>
                <DialogDescription>
                  Search a registered member, choose the staff role, and confirm the promotion.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePromoteSubmit} className="mt-6 grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="staff-promote-search">Search member</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="staff-promote-search"
                      value={promoteSearch}
                      onChange={(event) => setPromoteSearch(event.target.value)}
                      placeholder="Search name, email, phone, Discord..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid max-h-[340px] gap-2 overflow-y-auto pr-1">
                  {filteredMemberProfiles.length ? (
                    filteredMemberProfiles.map((profile) => {
                      const selected = selectedProfile?.id === profile.id;

                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => setSelectedProfileId(profile.id)}
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            selected
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/45 bg-background/45 hover:border-primary/25"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 font-display font-bold text-electric">
                              {getProfileInitials(profile)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-display text-lg font-bold text-foreground">
                                {profile.full_name || "No name"}
                              </div>
                              <div className="truncate text-sm text-muted-foreground">
                                {profile.email || "No email recorded"}
                              </div>
                            </div>
                            {selected && (
                              <Badge
                                variant="outline"
                                className="border-primary/40 bg-primary/10 text-electric"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/55 bg-background/35 p-6 text-sm text-muted-foreground">
                      No registered member matches this search.
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff-promote-role">Role to assign</Label>
                  <select
                    id="staff-promote-role"
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value as StaffPromoteRole)}
                    className="h-11 w-full rounded-md border border-border/60 bg-card/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPromoteOpen(false);
                      resetPromoteDialog();
                    }}
                    className="border-border/60 bg-background/45"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedProfile || savingKey === `profile:${selectedProfile.id}`}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {selectedProfile && savingKey === `profile:${selectedProfile.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Promote to {profileRoleLabel(selectedRole)}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffRoleGroup({
  title,
  description,
  emptyMessage,
  profiles,
  icon,
  currentUserId,
  savingKey,
  onChange,
  onSubmit,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  profiles: UserProfileRow[];
  icon: "staff" | "candidate";
  currentUserId: string;
  savingKey: string | null;
  onChange: (id: string, patch: Partial<UserProfileRow>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, profile: UserProfileRow) => void;
}) {
  const GroupIcon = icon === "staff" ? ShieldCheck : UserPlus;

  return (
    <section className="rounded-[1.75rem] border border-border/50 bg-card/25 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-electric">
            <GroupIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit border-primary/35 bg-primary/10 text-electric">
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
        <div className="rounded-2xl border border-dashed border-border/55 bg-background/35 p-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted/10 text-muted-foreground">
              <UserCog className="h-4 w-4" />
            </div>
            {emptyMessage}
          </div>
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
  const initials = getProfileInitials(profile);

  return (
    <form
      onSubmit={(event) => onSubmit(event, profile)}
      className="rounded-2xl border border-border/45 bg-background/45 p-4 transition-colors hover:border-primary/25 hover:bg-background/60"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.65fr)_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 font-display text-lg font-bold text-electric">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={profileRoleClassName(profile.role)}>
                  {profileRoleLabel(profile.role)}
                </Badge>
                {isCurrentUser && (
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                    You
                  </span>
                )}
              </div>
              <div className="mt-2 truncate font-display text-xl font-bold text-foreground">
                {profile.full_name || "No name"}
              </div>
              <div className="mt-1 truncate text-sm text-muted-foreground">
                {profile.email || "No email recorded"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-card/25 px-3 py-2">
              <div className="font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Phone
              </div>
              <div className="mt-1 truncate text-sm text-foreground/90">
                {profile.phone_number || "Not provided"}
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-border/40 bg-card/25 px-3 py-2">
              <div className="font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Discord
              </div>
              <DiscordIdentityCell profile={profile} />
            </div>
            <div className="rounded-xl border border-border/40 bg-card/25 px-3 py-2">
              <div className="font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Joined
              </div>
              <div className="mt-1 truncate text-sm text-foreground/90">
                {formatAdminDate(profile.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/25 p-3">
          <Label
            htmlFor={`${profile.id}-staff-role`}
            className="text-xs uppercase tracking-[0.16em]"
          >
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
          className="h-12 min-w-[150px] text-primary-foreground glow-primary hover:opacity-90 xl:justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save role
        </Button>
      </div>
    </form>
  );
}

function StaffMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "green" | "blue" | "neutral";
}) {
  const toneClassName =
    tone === "gold"
      ? "border-gold/35 bg-gold/10 text-gold"
      : tone === "green"
        ? "border-bull/35 bg-bull/10 text-bull"
        : tone === "blue"
          ? "border-primary/35 bg-primary/10 text-electric"
          : "border-border/50 bg-background/35 text-foreground";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function CommunityMembersPanel({ memberProfiles }: { memberProfiles: UserProfileRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const paidMemberProfiles = memberProfiles.filter(hasAnyPaidAccess);
  const paidMentorshipProfiles = memberProfiles.filter(hasPaidMentorship);
  const paidNewsProfiles = memberProfiles.filter(hasPaidNewsSubscription);
  const paidLiveTradingProfiles = memberProfiles.filter(hasPaidLiveTradingAccess);
  const filteredPaidProfiles = paidMemberProfiles.filter((profile) =>
    memberMatchesSearch(profile, searchQuery),
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStat label="Paid members" value={String(paidMemberProfiles.length)} />
        <AdminStat label="Mentorship" value={String(paidMentorshipProfiles.length)} />
        <AdminStat label="Live trading" value={String(paidLiveTradingProfiles.length)} />
        <AdminStat label="Premium" value={String(paidNewsProfiles.length)} />
      </div>

      <CommunityMembersTable
        title="Paid Community Members"
        description="Members with an active paid plan, Live Trading access, or Premium access."
        profiles={filteredPaidProfiles}
        totalCount={paidMemberProfiles.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage={
          searchQuery.trim()
            ? "No paid members match this search."
            : "No paid community members yet. They will appear here after a verified payment."
        }
      />
    </div>
  );
}

function RegisteredAccountsPanel({ memberProfiles }: { memberProfiles: UserProfileRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const registeredMemberProfiles = memberProfiles.filter((profile) => !hasAnyPaidAccess(profile));
  const filteredRegisteredProfiles = registeredMemberProfiles.filter((profile) =>
    memberMatchesSearch(profile, searchQuery),
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Registered only" value={String(registeredMemberProfiles.length)} />
        <AdminStat label="All members" value={String(memberProfiles.length)} />
        <AdminStat
          label="Paid members"
          value={String(memberProfiles.filter(hasAnyPaidAccess).length)}
        />
      </div>
      <CommunityMembersTable
        title="Registered Accounts - Not Paid Yet"
        description="Members who created an account but do not have paid access yet."
        profiles={filteredRegisteredProfiles}
        totalCount={registeredMemberProfiles.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage={
          searchQuery.trim()
            ? "No unpaid registered accounts match this search."
            : "No unpaid registered accounts right now."
        }
      />
    </div>
  );
}

function CommunityMembersTable({
  title,
  description,
  profiles,
  totalCount,
  searchQuery,
  onSearchChange,
  showSearch = true,
  emptyMessage,
}: {
  title: string;
  description: string;
  profiles: UserProfileRow[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold sm:text-2xl">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showSearch && (
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
          )}
          <Badge variant="outline" className="w-fit border-primary/35 text-electric">
            {profiles.length === totalCount
              ? `${profiles.length} users`
              : `${profiles.length} of ${totalCount} users`}
          </Badge>
        </div>
      </div>

      {profiles.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {profiles.map((profile) => (
              <CommunityMemberMobileCard key={profile.id} profile={profile} />
            ))}
          </div>
          <div className="hidden rounded-xl border border-border/50 bg-background/35 md:block">
            <div className="max-w-full overflow-x-auto pb-2">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead className="border-b border-border/60 bg-card/45 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Full name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Discord user / ID</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
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
        </>
      ) : (
        <div className="rounded-xl border border-border/45 bg-background/35 p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function CommunityMemberMobileCard({ profile }: { profile: UserProfileRow }) {
  const paidPlans = paidPlanItems(profile);
  const whatsappUrl = whatsAppMessageUrl(profile.phone_number);
  const invoiceItems = paidInvoiceItems(profile);

  return (
    <article className="rounded-2xl border border-border/50 bg-background/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate font-display text-lg font-bold">
            {profile.full_name || "No name"}
          </h4>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {profile.email || "No email recorded"}
          </p>
        </div>
        <Badge variant="outline" className={profileRoleClassName(profile.role)}>
          {profileRoleLabel(profile.role)}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-xl border border-border/40 bg-card/25 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Phone
          </div>
          {profile.phone_number ? (
            <div className="mt-2 flex flex-col gap-2">
              <span className="break-words text-muted-foreground">{profile.phone_number}</span>
              {whatsappUrl ? (
                <Button
                  asChild
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-bull/40 bg-bull/10 text-bull hover:bg-bull/15"
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
            <p className="mt-2 text-muted-foreground">Not provided</p>
          )}
        </div>

        <div className="rounded-xl border border-border/40 bg-card/25 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Discord
          </div>
          <div className="mt-2 min-w-0">
            <DiscordIdentityCell profile={profile} />
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/25 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Plan
          </div>
          {paidPlans.length ? (
            <div className="mt-2 grid gap-2">
              {paidPlans.map((plan) => (
                <div key={plan.key} className="grid gap-1">
                  <Badge variant="outline" className={plan.className}>
                    {plan.label}
                  </Badge>
                  <PaidPlanDetails plan={plan} />
                </div>
              ))}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="mt-2 border-muted-foreground/35 text-muted-foreground"
            >
              No paid plan
            </Badge>
          )}
        </div>

        <div className="rounded-xl border border-border/40 bg-card/25 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Access
          </div>
          <PaidPlanAccessList plans={paidPlans} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span>Joined {formatAdminDate(profile.created_at)}</span>
        {invoiceItems.length ? (
          <InvoicePrintActions profile={profile} paidMemberships={invoiceItems} fullWidth />
        ) : (
          <span>No invoice</span>
        )}
      </div>
    </article>
  );
}

function CommunityMembersTableRow({ profile }: { profile: UserProfileRow }) {
  const paidPlans = paidPlanItems(profile);
  const whatsappUrl = whatsAppMessageUrl(profile.phone_number);
  const invoiceItems = paidInvoiceItems(profile);

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
        {paidPlans.length ? (
          <div className="grid gap-1.5">
            {paidPlans.map((plan) => (
              <div key={plan.key} className="grid gap-1">
                <Badge variant="outline" className={plan.className}>
                  {plan.label}
                </Badge>
                <PaidPlanDetails plan={plan} />
              </div>
            ))}
          </div>
        ) : (
          <Badge variant="outline" className="border-muted-foreground/35 text-muted-foreground">
            No paid plan
          </Badge>
        )}
      </td>
      <td className="px-4 py-4">
        <PaidPlanAccessList plans={paidPlans} />
      </td>
      <td className="px-4 py-4 text-muted-foreground">{formatAdminDate(profile.created_at)}</td>
      <td className="px-4 py-4 text-right">
        {invoiceItems.length ? (
          <InvoicePrintActions profile={profile} paidMemberships={invoiceItems} />
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
    ...planItems.flatMap((plan) => [
      plan.label,
      plan.detail,
      plan.accessStartsAt,
      plan.accessExpiresAt,
    ]),
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

  return fields.some((field) =>
    normalizeMemberSearch(String(field ?? "")).includes(normalizedQuery),
  );
}

function normalizeMemberSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

type PaidPlanItem = ReturnType<typeof paidPlanItems>[number];

function PaidPlanDetails({ plan }: { plan: PaidPlanItem }) {
  return (
    <div className="grid gap-1 text-xs text-muted-foreground">
      {plan.detail && <span>{plan.detail}</span>}
    </div>
  );
}

function PaidPlanAccessList({ plans }: { plans: PaidPlanItem[] }) {
  if (!plans.length) {
    return <span className="mt-2 block text-sm text-muted-foreground">No paid access</span>;
  }

  return (
    <div className="mt-2 grid min-w-[260px] gap-2">
      {plans.map((plan) => {
        const remaining = accessRemainingMeta(plan.accessExpiresAt);

        return (
          <div
            key={plan.key}
            className="grid gap-2 rounded-xl border border-border/35 bg-background/30 p-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline" className={plan.className}>
                {plan.label}
              </Badge>
              <span className={remaining.className}>{remaining.label}</span>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <span>
                <span className="font-mono text-[10px] text-muted-foreground/80">
                  access_starts_at
                </span>
                {": "}
                <span className="text-foreground">
                  {formatOptionalAdminDateTime(plan.accessStartsAt)}
                </span>
              </span>
              <span>
                <span className="font-mono text-[10px] text-muted-foreground/80">
                  access_expires_at
                </span>
                {": "}
                <span className="text-foreground">
                  {formatOptionalAdminDateTime(plan.accessExpiresAt, "No expiry")}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function accessRemainingMeta(expiresAt: string | null) {
  if (!expiresAt) {
    return {
      label: "No expiry",
      className: "font-semibold text-muted-foreground",
    };
  }

  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) {
    return {
      label: "Unknown",
      className: "font-semibold text-muted-foreground",
    };
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const rawDays = (expiry.getTime() - Date.now()) / millisecondsPerDay;

  if (rawDays < 0) {
    const expiredDays = Math.max(1, Math.ceil(Math.abs(rawDays)));
    return {
      label: `${expiredDays} day${expiredDays === 1 ? "" : "s"} expired`,
      className: "font-semibold text-bear",
    };
  }

  const remainingDays = Math.max(1, Math.ceil(rawDays));
  return {
    label: `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`,
    className: remainingDays <= 7 ? "font-semibold text-gold" : "font-semibold text-bull",
  };
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
        detail: [
          label,
          membership.amount_label,
          membership.paid_at ? formatAdminDate(membership.paid_at) : null,
        ]
          .filter(Boolean)
          .join(" - "),
        accessStartsAt: membership.access_starts_at,
        accessExpiresAt: membership.access_expires_at,
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
      accessStartsAt: liveAccess.access_starts_at,
      accessExpiresAt: liveAccess.access_expires_at,
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
      accessStartsAt: newsSubscription.access_starts_at,
      accessExpiresAt: newsSubscription.access_expires_at,
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
    <div className="grid min-w-0 gap-1 md:min-w-[180px]">
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

type PaidInvoiceItem = {
  label: string;
  accessType: string;
  amountLabel: string | null;
  paidAt: string | null;
  accessStartsAt: string | null;
  accessExpiresAt: string | null;
  paymentProvider: string | null;
  providerCustomerId: string | null;
  providerCheckoutId: string | null;
  providerSubscriptionId: string | null;
  notes: string | null;
};

type InvoiceModel = "admin" | "member";

function paidInvoiceItems(profile: UserProfileRow) {
  const items: PaidInvoiceItem[] = mentorshipMembershipPlans
    .map(({ slug, label }) => {
      const membership = profile.memberships[slug];
      if (membership.status !== "paid") return null;

      return {
        label,
        accessType: "Mentorship access",
        amountLabel: membership.amount_label,
        paidAt: membership.paid_at,
        accessStartsAt: membership.access_starts_at,
        accessExpiresAt: membership.access_expires_at,
        paymentProvider: membership.payment_provider,
        providerCustomerId: membership.provider_customer_id,
        providerCheckoutId: membership.provider_checkout_id,
        providerSubscriptionId: membership.provider_subscription_id,
        notes: membership.notes,
      };
    })
    .filter((item): item is PaidInvoiceItem => Boolean(item));

  const liveAccess = profile.liveTradingAccess;
  if (hasPaidLiveTradingAccess(profile)) {
    items.push({
      label: "Live Trading",
      accessType: liveAccess.duration_label || "Live Trading access",
      amountLabel: liveAccess.amount_label,
      paidAt: liveAccess.paid_at,
      accessStartsAt: liveAccess.access_starts_at,
      accessExpiresAt: liveAccess.access_expires_at,
      paymentProvider: liveAccess.payment_provider,
      providerCustomerId: liveAccess.provider_customer_id,
      providerCheckoutId: liveAccess.provider_checkout_id,
      providerSubscriptionId: null,
      notes: liveAccess.notes,
    });
  }

  const newsSubscription = profile.newsSubscription;
  if (hasPaidNewsSubscription(profile)) {
    items.push({
      label: "Premium Access",
      accessType: "Premium education/news access",
      amountLabel: newsSubscription.amount_label || "$5/mo",
      paidAt: newsSubscription.paid_at,
      accessStartsAt: newsSubscription.access_starts_at,
      accessExpiresAt: newsSubscription.access_expires_at,
      paymentProvider: newsSubscription.payment_provider,
      providerCustomerId: newsSubscription.provider_customer_id,
      providerCheckoutId: newsSubscription.provider_checkout_id,
      providerSubscriptionId: newsSubscription.provider_subscription_id,
      notes: newsSubscription.notes,
    });
  }

  return items;
}

function InvoicePrintActions({
  profile,
  paidMemberships,
  fullWidth = false,
}: {
  profile: UserProfileRow;
  paidMemberships: PaidInvoiceItem[];
  fullWidth?: boolean;
}) {
  const memberLabel = profile.full_name || profile.email || "paid member";
  const wrapperClassName = fullWidth
    ? "grid grid-cols-2 gap-2"
    : "flex flex-wrap justify-end gap-2";

  return (
    <div className={wrapperClassName}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={
          fullWidth
            ? "w-full border-primary/35 text-electric hover:bg-primary/10"
            : "border-primary/35 text-electric hover:bg-primary/10"
        }
        aria-label={`Print admin invoice for ${memberLabel}`}
        onClick={() => printPaidMemberInvoice(profile, paidMemberships, "admin")}
      >
        <Printer className="h-3.5 w-3.5" />
        Admin
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={
          fullWidth
            ? "w-full border-gold/35 text-gold hover:bg-gold/10"
            : "border-gold/35 text-gold hover:bg-gold/10"
        }
        aria-label={`Print member invoice for ${memberLabel}`}
        onClick={() => printPaidMemberInvoice(profile, paidMemberships, "member")}
      >
        <Printer className="h-3.5 w-3.5" />
        Member
      </Button>
    </div>
  );
}

function PaidMembersTableRow({ profile }: { profile: UserProfileRow }) {
  const paidMemberships = paidInvoiceItems(profile).filter(
    (item) => item.accessType === "Mentorship access",
  );

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
          {paidMemberships.map(({ label, paidAt }) => (
            <div key={label}>{paidAt ? formatAdminDate(paidAt) : "Paid date missing"}</div>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <InvoicePrintActions profile={profile} paidMemberships={paidMemberships} />
      </td>
    </tr>
  );
}

function printPaidMemberInvoice(
  profile: UserProfileRow,
  paidMemberships: PaidInvoiceItem[],
  model: InvoiceModel,
) {
  const invoiceWindow = window.open("", "_blank", "width=900,height=1100");

  if (!invoiceWindow) {
    return;
  }

  invoiceWindow.document.open();
  invoiceWindow.document.write(buildInvoiceHtml(profile, paidMemberships, model));
  invoiceWindow.document.close();
}

function buildInvoiceHtml(
  profile: UserProfileRow,
  paidMemberships: PaidInvoiceItem[],
  model: InvoiceModel,
) {
  const isAdminCopy = model === "admin";
  const memberName = profile.full_name || "Member";
  const invoiceNumber = `ZT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
  const copyLabel = isAdminCopy ? "Admin copy" : "Member copy";
  const generatedAt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  const lineItems = paidMemberships
    .map((item) => {
      const amount = item.amountLabel || "Recorded payment";
      const paidDate = item.paidAt ? formatAdminDate(item.paidAt) : "Paid date missing";
      const accessStart = formatOptionalAdminDateTime(item.accessStartsAt);
      const accessExpiry = formatOptionalAdminDateTime(item.accessExpiresAt, "No expiry");
      const internalDetails = isAdminCopy
        ? `
            <span>Provider: ${escapeHtml(item.paymentProvider || "Not recorded")}</span>
            <span>Customer ID: ${escapeHtml(item.providerCustomerId || "Not recorded")}</span>
            <span>Checkout ID: ${escapeHtml(item.providerCheckoutId || "Not recorded")}</span>
            <span>Subscription / order: ${escapeHtml(item.providerSubscriptionId || "Not recorded")}</span>
            <span>Admin notes: ${escapeHtml(item.notes || "No notes")}</span>
          `
        : "";

      return `
        <tr>
          <td>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.accessType)}</span>
            <span>access_starts_at: ${escapeHtml(accessStart)}</span>
            <span>access_expires_at: ${escapeHtml(accessExpiry)}</span>
            ${internalDetails}
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
    <title>ZacTrades ${escapeHtml(copyLabel)} Invoice - ${escapeHtml(memberName)}</title>
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
      .copy-badge {
        display: inline-flex;
        margin-top: 12px;
        border: 1px solid ${isAdminCopy ? "#38bdf8" : "#f5c542"};
        border-radius: 999px;
        padding: 6px 12px;
        color: ${isAdminCopy ? "#38bdf8" : "#f5c542"};
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
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
            <span>${escapeHtml(copyLabel)} paid access invoice</span>
          </div>
        </div>
        <div class="invoice-label">
          <h1>Invoice</h1>
          <p>${escapeHtml(invoiceNumber)}</p>
          <span class="copy-badge">${escapeHtml(copyLabel)}</span>
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
            ${isAdminCopy ? `<p class="line">Discord ID: ${escapeHtml(profile.discord_user_id || "Not recorded")}</p>` : ""}
          </div>
          <div class="box">
            <p class="eyebrow">Invoice details</p>
            <p class="line"><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
            <p class="line"><strong>Joined:</strong> ${escapeHtml(formatAdminDate(profile.created_at))}</p>
            <p class="line"><strong>Status:</strong> Paid</p>
            ${isAdminCopy ? `<p class="line"><strong>Member ID:</strong> ${escapeHtml(profile.id)}</p>` : ""}
            ${isAdminCopy ? `<p class="line"><strong>Admin role:</strong> ${escapeHtml(profileRoleLabel(profile.role))}</p>` : ""}
          </div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Access</th>
              <th>Amount</th>
              <th>Paid date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${lineItems}</tbody>
        </table>
        <div class="paid">${
          isAdminCopy
            ? "Internal copy - payment confirmed and paid access recorded."
            : "Payment confirmed - paid access granted."
        }</div>
      </main>
      <footer>
        ${
          isAdminCopy
            ? "Admin copy: this document includes internal payment references and should be kept for ZacTrades records."
            : "Member copy: this invoice confirms your recorded payment with ZacTrades."
        }
        Trading education, mentorship, and community access services are subject to the site terms and policies.
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
          <h3 className="font-display text-xl font-bold sm:text-2xl">{title}</h3>
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

function offerToneClassName(tone: OfferHeadlineTone) {
  switch (tone) {
    case "electric":
      return {
        badge: "border-primary/40 bg-primary/10 text-electric",
        glow: "bg-primary/25",
        preview: "border-primary/35 bg-primary/10",
        icon: "border border-primary/35 bg-primary/15 text-electric",
        text: "text-electric",
      };
    case "bull":
      return {
        badge: "border-bull/40 bg-bull/10 text-bull",
        glow: "bg-bull/25",
        preview: "border-bull/35 bg-bull/10",
        icon: "border border-bull/35 bg-bull/15 text-bull",
        text: "text-bull",
      };
    case "violet":
      return {
        badge: "border-violet-300/40 bg-violet-500/10 text-violet-200",
        glow: "bg-violet-400/25",
        preview: "border-violet-300/35 bg-violet-500/10",
        icon: "border border-violet-300/35 bg-violet-400/15 text-violet-200",
        text: "text-violet-200",
      };
    case "gold":
    default:
      return {
        badge: "border-gold/40 bg-gold/10 text-gold",
        glow: "bg-gold/25",
        preview: "border-gold/35 bg-gold/10",
        icon: "border border-gold/35 bg-gold/15 text-gold",
        text: "text-gold",
      };
  }
}

function hasPaidMentorship(profile: UserProfileRow) {
  return mentorshipMembershipPlans.some(({ slug }) => profile.memberships[slug].status === "paid");
}

function hasAnyPaidAccess(profile: UserProfileRow) {
  return (
    hasPaidMentorship(profile) ||
    hasPaidLiveTradingAccess(profile) ||
    hasPaidNewsSubscription(profile)
  );
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

function hasExtendableLiveTradingAccess(profile: UserProfileRow) {
  const access = profile.liveTradingAccess;
  const expiresAt = access.access_expires_at ? new Date(access.access_expires_at) : null;

  if (!expiresAt) return false;

  return access.status === "paid" && !Number.isNaN(expiresAt.getTime()) && expiresAt > new Date();
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

function getProfileInitials(profile: UserProfileRow) {
  const source = profile.full_name || profile.email || "Member";
  const words = source.replace(/@.*/, "").split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "M";
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

function StarRatingEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const rating = clampRating(value);

  const updateRating = (nextValue: number) => {
    onChange(clampRating(nextValue));
  };

  return (
    <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-xs">
          Star rating
        </Label>
        <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 font-mono text-xs font-bold text-gold">
          {rating.toFixed(1)}/5
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {Array.from({ length: 5 }, (_, index) => {
          const fillPercent = Math.max(0, Math.min(100, (rating - index) * 100));

          return (
            <button
              key={index}
              type="button"
              onClick={() => updateRating(index + 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border/55 bg-background/45 transition hover:border-gold/50 hover:bg-gold/10"
              aria-label={`Set rating to ${index + 1} stars`}
            >
              <span className="relative grid h-5 w-5 place-items-center">
                <Star className="h-5 w-5 fill-muted/20 text-muted/45" />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star className="h-5 w-5 fill-gold text-gold" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <input
        id={id}
        type="range"
        min="0"
        max="5"
        step="0.1"
        value={rating}
        onChange={(event) => updateRating(Number(event.target.value))}
        className="mt-3 w-full accent-[#f6c44d]"
      />

      <Input
        type="number"
        min="0"
        max="5"
        step="0.1"
        value={rating.toFixed(1)}
        onChange={(event) => updateRating(Number(event.target.value))}
        className="mt-2 h-10 border-border/60 bg-background/45 font-mono"
      />
    </div>
  );
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(5, Math.round(value * 10) / 10));
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 bg-background/45 text-foreground [color-scheme:dark]"
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

function LogoFileInput({
  id,
  label,
  saveHint = "click Save prop firm to upload.",
}: {
  id: string;
  label: string;
  saveHint?: string;
}) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <label
        htmlFor={id}
        className="mt-1 flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-gold/45 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:border-gold/70 hover:bg-gold/15"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected prop firm logo preview"
            className="h-8 w-8 rounded-lg object-contain ring-1 ring-white/10"
          />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {previewUrl ? "Logo selected" : "Upload logo"}
      </label>
      <Input
        id={id}
        name="logo_file"
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setFileName(file?.name ?? "");
          setPreviewUrl((currentPreviewUrl) => {
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
            return file ? URL.createObjectURL(file) : "";
          });
        }}
      />
      <p className="mt-2 truncate text-xs text-muted-foreground">
        {fileName ? `${fileName} - ${saveHint}` : "No logo selected yet."}
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/45 bg-background/35 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

function defaultEditablePlans(): EditablePlan[] {
  return defaultCoachingPlans.map((plan, index) => ({
    slug: plan.slug,
    title: plan.title,
    description: plan.desc,
    display_price: plan.price,
    promotion_enabled: false,
    promotion_label: null,
    promotion_original_price: null,
    promotion_note: null,
    promotion_ends_at: null,
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

const discountApplyTargetOptions: {
  value: DiscountApplyTarget;
  label: string;
  shortLabel: string;
}[] = [
  { value: "all", label: "All checkout", shortLabel: "All" },
  { value: "live", label: "Live Trading", shortLabel: "Live" },
  { value: "mentorship_one_to_one", label: "1-to-1 Coaching", shortLabel: "1-to-1" },
  { value: "mentorship_group", label: "Training Group Coaching", shortLabel: "Group" },
  { value: "news", label: "News Subscription", shortLabel: "News" },
];

function getDiscountApplyTargets(value: string | null | undefined): DiscountApplyTarget[] {
  const rawTargets = (value || "all")
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean);

  if (rawTargets.includes("all")) return ["all"];

  const targets = rawTargets.flatMap((target) =>
    target === "mentorship" ? ["mentorship_one_to_one", "mentorship_group"] : [target],
  );
  const allowed = new Set(discountApplyTargetOptions.map((option) => option.value));
  const cleanedTargets = targets.filter((target): target is DiscountApplyTarget =>
    allowed.has(target as DiscountApplyTarget),
  );

  return cleanedTargets.length ? [...new Set(cleanedTargets)] : ["all"];
}

function encodeDiscountApplyTargets(targets: DiscountApplyTarget[]) {
  const cleanedTargets = targets.filter((target) => target !== "all");

  return cleanedTargets.length ? [...new Set(cleanedTargets)].join(",") : "all";
}

function toggleDiscountApplyTarget(currentValue: string, target: DiscountApplyTarget) {
  if (target === "all") return "all";

  const currentTargets = getDiscountApplyTargets(currentValue).filter(
    (current) => current !== "all",
  );
  const nextTargets = currentTargets.includes(target)
    ? currentTargets.filter((current) => current !== target)
    : [...currentTargets, target];

  return encodeDiscountApplyTargets(nextTargets);
}

function formatDiscountApplyTargets(value: string | null | undefined) {
  const targets = getDiscountApplyTargets(value);
  const labelByValue = new Map(
    discountApplyTargetOptions.map((option) => [option.value, option.label] as const),
  );

  return targets.map((target) => labelByValue.get(target) ?? target).join(", ");
}

function normalizeAdminDiscountCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function toEditableDiscountCode(row: DiscountCodeRow): EditableDiscountCode {
  return {
    ...row,
    description: row.description ?? "",
    maxRedemptionsText: row.max_redemptions ? String(row.max_redemptions) : "",
    startsAtText: dateInputValue(row.starts_at),
    expiresAtText: dateInputValue(row.expires_at),
  };
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
      .replace(/^-+|-+$/g, "") || `item-${Date.now()}`
  );
}

function getLogoFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["png", "jpg", "jpeg", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "png";
}

function isAcceptedPropFirmLogo(file: File) {
  const extension = getLogoFileExtension(file);

  return (
    (!file.type || PROP_FIRM_LOGO_TYPES.has(file.type)) &&
    ["png", "jpg", "webp"].includes(extension)
  );
}

function getLogoContentType(file: File) {
  if (PROP_FIRM_LOGO_TYPES.has(file.type)) return file.type;

  const extension = getLogoFileExtension(file);
  if (extension === "jpg") return "image/jpeg";
  if (extension === "webp") return "image/webp";

  return "image/png";
}

async function uploadLogoFile({
  fileValue,
  slug,
  bucket,
  maxBytes,
  fallbackName,
}: {
  fileValue: FormDataEntryValue | null;
  slug: string;
  bucket: string;
  maxBytes: number;
  fallbackName: string;
}) {
  if (!supabase || !(fileValue instanceof File) || fileValue.size === 0) return null;

  if (fileValue.size > maxBytes) {
    throw new Error("Please upload a logo smaller than 2 MB.");
  }

  if (!isAcceptedPropFirmLogo(fileValue)) {
    throw new Error("Please upload a PNG, JPG, or WEBP logo.");
  }

  const safeFileName = slugify(fileValue.name.replace(/\.[^.]+$/i, "")) || fallbackName;
  const extension = getLogoFileExtension(fileValue);
  const storagePath = `${slug}/${crypto.randomUUID()}-${safeFileName}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileValue, {
    cacheControl: "86400",
    contentType: getLogoContentType(fileValue),
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return data.publicUrl;
}

async function uploadPropFirmLogo(fileValue: FormDataEntryValue | null, slug: string) {
  return uploadLogoFile({
    fileValue,
    slug,
    bucket: PROP_FIRM_LOGO_BUCKET,
    maxBytes: MAX_PROP_FIRM_LOGO_BYTES,
    fallbackName: "prop-firm-logo",
  });
}

async function uploadTradingToolLogo(fileValue: FormDataEntryValue | null, slug: string) {
  return uploadLogoFile({
    fileValue,
    slug,
    bucket: TRADING_TOOL_LOGO_BUCKET,
    maxBytes: MAX_TRADING_TOOL_LOGO_BYTES,
    fallbackName: "trading-tool-logo",
  });
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

function formatOptionalAdminDate(value: string | null | undefined, fallback = "Not recorded") {
  if (!value) return fallback;

  return formatAdminDate(value);
}

function formatOptionalAdminDateTime(value: string | null | undefined, fallback = "Not recorded") {
  if (!value) return fallback;

  return formatAdminDateTime(value);
}

function formatAdminDateTime(value: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
