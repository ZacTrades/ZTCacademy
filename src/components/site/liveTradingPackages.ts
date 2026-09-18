import { supabase } from "@/lib/supabase";

export type CheckoutPackage = {
  slug?: string;
  duration: string;
  price: string;
  monthly: string;
  badge?: string;
  originalPrice?: string;
};

export type LiveTradingPackageRow = {
  slug: string;
  duration: string;
  price: string;
  monthly_label: string;
  original_price: string | null;
  badge: string | null;
  is_active: boolean;
  display_order: number;
};

export const liveTradingPackages: CheckoutPackage[] = [
  { slug: "one_month", duration: "1 month", price: "$39.99", monthly: "$39.99/mo" },
  {
    slug: "three_months",
    duration: "3 months",
    price: "$100",
    monthly: "$33.33/mo",
    originalPrice: "$120",
    badge: "Discount",
  },
  {
    slug: "six_months",
    duration: "6 months",
    price: "$180",
    monthly: "$30/mo",
    originalPrice: "$240",
    badge: "Discount",
  },
  {
    slug: "twelve_months",
    duration: "12 months",
    price: "$348",
    monthly: "$29/mo",
    originalPrice: "$480",
    badge: "Best value",
  },
];

export const defaultLiveTradingPackageRows: LiveTradingPackageRow[] = [
  {
    slug: "one_month",
    duration: "1 month",
    price: "$39.99",
    monthly_label: "$39.99/mo",
    original_price: null,
    badge: null,
    is_active: true,
    display_order: 1,
  },
  {
    slug: "three_months",
    duration: "3 months",
    price: "$100",
    monthly_label: "$33.33/mo",
    original_price: "$120",
    badge: "Discount",
    is_active: true,
    display_order: 2,
  },
  {
    slug: "six_months",
    duration: "6 months",
    price: "$180",
    monthly_label: "$30/mo",
    original_price: "$240",
    badge: "Discount",
    is_active: true,
    display_order: 3,
  },
  {
    slug: "twelve_months",
    duration: "12 months",
    price: "$348",
    monthly_label: "$29/mo",
    original_price: "$480",
    badge: "Best value",
    is_active: true,
    display_order: 4,
  },
];

export function mapLiveTradingPackageRow(row: LiveTradingPackageRow): CheckoutPackage {
  return {
    slug: row.slug,
    duration: row.duration,
    price: row.price,
    monthly: row.monthly_label,
    originalPrice: row.original_price || undefined,
    badge: row.badge || undefined,
  };
}

export async function fetchLiveTradingPackages() {
  if (!supabase) {
    return liveTradingPackages;
  }

  const { data, error } = await supabase
    .from("live_trading_packages")
    .select("slug,duration,price,monthly_label,original_price,badge,is_active,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return liveTradingPackages;
  }

  return data?.length
    ? data.map((row) => mapLiveTradingPackageRow(row as LiveTradingPackageRow))
    : liveTradingPackages;
}
