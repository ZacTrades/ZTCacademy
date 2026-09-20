import { UserCheck, Users } from "lucide-react";

import type { CheckoutPackage } from "@/components/site/liveTradingPackages";
import { supabase } from "@/lib/supabase";

export type CoachingPlanSlug = "one_to_one" | "group";

export type CoachingPlan = {
  slug: CoachingPlanSlug;
  icon: typeof UserCheck;
  title: string;
  desc: string;
  price: string;
  originalPrice?: string;
  promotionLabel?: string;
  promotionNote?: string;
  promotionEndsAt?: string;
  promotionEnabled: boolean;
  duration: string;
  details: string[];
  checkoutPackages: CheckoutPackage[];
  cta: string;
  featured: boolean;
};

export type CoachingPlanRow = {
  slug: CoachingPlanSlug;
  title: string;
  description: string;
  display_price: string;
  promotion_enabled: boolean;
  promotion_label: string | null;
  promotion_original_price: string | null;
  promotion_note: string | null;
  promotion_ends_at: string | null;
  duration: string;
  checkout_price: string;
  checkout_monthly_label: string;
  features: string[];
  cta_label: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
};

export const defaultCoachingPlans: CoachingPlan[] = [
  {
    slug: "one_to_one",
    icon: UserCheck,
    title: "1-to-1 Coaching",
    desc: "The elite private coaching experience, tailored to you with live sessions, a personal trading framework, mindset work, and prop-firm accountability.",
    price: "$980.99",
    promotionEnabled: false,
    duration: "Private 1-to-1 coaching journey",
    details: [
      "Private live sessions with Zac",
      "Personal trading framework built for you",
      "Mindset and performance coaching",
      "Prop-firm and account mastery",
      "No deadlines, just focused results",
      "Clarity, control, and confidence",
    ],
    checkoutPackages: [
      {
        duration: "Private 1-to-1 coaching journey",
        price: "$980.99",
        monthly: "$980.99",
      },
    ],
    cta: "Start Your 1-to-1 Journey",
    featured: true,
  },
  {
    slug: "group",
    icon: Users,
    title: "Formation Group Mentoring",
    desc: "A 4-month structured A-to-Z path from beginner to independent trader with live sessions, strategy, risk management, and validation roadmap.",
    price: "$429.99",
    promotionEnabled: false,
    duration: "4-month structured journey",
    details: [
      "2 live sessions per week with Zac",
      "Proven strategy: understand, execute, repeat",
      "Trading basics: read the market like a pro",
      "Daily and weekly market analysis",
      "Risk and money management",
      "Challenge validation roadmap",
    ],
    checkoutPackages: [
      {
        duration: "4-month structured journey",
        price: "$429.99",
        monthly: "$429.99",
      },
    ],
    cta: "Join the Formation",
    featured: false,
  },
];

export function mapCoachingPlanRow(row: CoachingPlanRow): CoachingPlan {
  const fallback =
    defaultCoachingPlans.find((plan) => plan.slug === row.slug) ?? defaultCoachingPlans[0];

  return {
    slug: row.slug,
    icon: fallback.icon,
    title: row.title || fallback.title,
    desc: row.description || fallback.desc,
    price: row.display_price || fallback.price,
    originalPrice: undefined,
    promotionLabel: undefined,
    promotionNote: undefined,
    promotionEndsAt: undefined,
    promotionEnabled: false,
    duration: row.duration || fallback.duration,
    details: row.features?.length ? row.features : fallback.details,
    checkoutPackages: [
      {
        duration: row.duration || fallback.duration,
        price: row.checkout_price || fallback.checkoutPackages[0].price,
        monthly: row.checkout_monthly_label || fallback.checkoutPackages[0].monthly,
        originalPrice: undefined,
        badge: undefined,
      },
    ],
    cta: row.cta_label || fallback.cta,
    featured: row.is_featured,
  };
}

export async function fetchCoachingPlans() {
  if (!supabase) {
    return defaultCoachingPlans;
  }

  const { data, error } = await supabase
    .from("coaching_plans")
    .select(
      "slug,title,description,display_price,promotion_enabled,promotion_label,promotion_original_price,promotion_note,promotion_ends_at,duration,checkout_price,checkout_monthly_label,features,cta_label,is_featured,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return defaultCoachingPlans;
  }

  return data?.length
    ? data.map((row) => mapCoachingPlanRow(row as CoachingPlanRow))
    : defaultCoachingPlans;
}
