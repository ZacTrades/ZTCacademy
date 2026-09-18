import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { provisionDiscordAccess } from "@/lib/discord-server";

const paymentMethodSchema = z.enum(["card", "crypto"]);
const checkoutCurrencySchema = z.enum(["USD", "MAD"]).default("USD");
const safeNameSchema = z.string().trim().min(1).max(120);
const safeEmailSchema = z.string().trim().email().max(254);
const discountCodeSchema = z.string().trim().max(50).optional();

const liveTradingCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  packageSlug: z.enum(["one_month", "three_months", "six_months", "twelve_months"]),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  currency: checkoutCurrencySchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
  discountCode: discountCodeSchema,
});

const mentorshipCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  planSlug: z.enum(["one_to_one", "group"]),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  currency: checkoutCurrencySchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
  discountCode: discountCodeSchema,
});

const newsSubscriptionCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  currency: checkoutCurrencySchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
  discountCode: discountCodeSchema,
});

const discountPreviewSchema = z.object({
  accessToken: z.string().min(1),
  checkoutKind: z.enum(["live", "mentorship", "news"]),
  packageSlug: z.enum(["one_month", "three_months", "six_months", "twelve_months"]).optional(),
  planSlug: z.enum(["one_to_one", "group"]).optional(),
  discountCode: z.string().trim().min(1).max(50),
});

type CheckoutKind = "live" | "mentorship" | "news";
type PaymentMethod = z.infer<typeof paymentMethodSchema>;

type GatewayCheckoutResponse = {
  checkoutUrl?: string;
  checkout_url?: string;
  url?: string;
  checkoutId?: string;
  checkout_id?: string;
  id?: string;
  customerId?: string;
  customer_id?: string;
};

type NowPaymentsInvoiceResponse = {
  id?: string | number;
  invoice_id?: string | number;
  invoice_url?: string;
  order_id?: string;
};

type NowPaymentsIpnPayload = {
  payment_id?: string | number;
  invoice_id?: string | number;
  order_id?: string;
  payment_status?: string;
  pay_address?: string;
  price_amount?: string | number;
  price_currency?: string;
  actually_paid?: string | number;
  pay_currency?: string;
  purchase_id?: string | number;
  outcome_amount?: string | number;
  outcome_currency?: string;
};

type PayzoneTransaction = {
  gatewayProvidedId?: string;
  type?: string;
  state?: string;
  amount?: string | number;
  currency?: string;
  resultCode?: string | number;
  responseText?: string;
};

type PayzoneCallbackPayload = {
  id?: string;
  orderId?: string;
  internalId?: string;
  status?: string;
  merchantAccount?: string;
  lineItem?: {
    amount?: string | number;
    currency?: string;
    description?: string;
  };
  transactions?: PayzoneTransaction[];
  paymentType?: string;
  paymentMethod?: string;
};

type PaymentProduct = {
  kind: CheckoutKind;
  name: string;
  slug: string | null;
  durationLabel: string;
  amountLabel: string;
  amount: number;
  metadata: Record<string, string | null>;
};

type DiscountApplyTarget =
  | "all"
  | "live"
  | "mentorship"
  | "mentorship_one_to_one"
  | "mentorship_group"
  | "news";

type DiscountCodeRow = {
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number | string;
  applies_to: string | null;
  is_active: boolean;
  max_redemptions: number | null;
  redeemed_count: number;
  starts_at: string | null;
  expires_at: string | null;
};

type AppliedDiscount = {
  code: string;
  originalAmountLabel: string;
  discountAmountLabel: string;
  discountedAmountLabel: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

type PaymentConfirmation = {
  providerLabel: string;
  providerReference: string;
};

type PaymentFailure = {
  providerLabel: string;
  rawStatus: string;
  status: "expired" | "cancelled";
};

type PaymentTarget =
  | {
      kind: "live";
      table: "user_live_trading_access";
      userId: string;
      packageSlug: string | null;
      amountLabel: string | null;
      status: string;
      notes?: string | null;
    }
  | {
      kind: "mentorship";
      table: "user_memberships";
      userId: string;
      planSlug: "one_to_one" | "group";
      amountLabel: string | null;
      status: string;
      notes?: string | null;
    }
  | {
      kind: "news";
      table: "user_news_subscriptions";
      userId: string;
      amountLabel: string | null;
      status: string;
      notes?: string | null;
    };

const NEWS_SUBSCRIPTION_PRODUCT: PaymentProduct = {
  kind: "news",
  name: "ZacTrades News Desk",
  slug: "news_subscription",
  durationLabel: "Monthly",
  amountLabel: "$5",
  amount: 5,
  metadata: { product: "news_subscription" },
};

function readServerEnv(name: string) {
  const runtimeValue = (
    globalThis as typeof globalThis & {
      __ZACTRADES_SERVER_ENV__?: Record<string, string | undefined>;
    }
  ).__ZACTRADES_SERVER_ENV__?.[name];
  const processEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];

  if (runtimeValue ?? processEnv) {
    return runtimeValue ?? processEnv;
  }

  // Only browser-safe VITE_* names may fall back to import.meta.env.
  if (name.startsWith("VITE_")) {
    return (import.meta.env as Record<string, string | undefined>)[name];
  }

  return undefined;
}

function createCheckoutReference() {
  return `ztc_${crypto.randomUUID()}`;
}

function parseAmountLabel(amountLabel: string) {
  const amount = Number(amountLabel.replace(/[^0-9.]/g, ""));

  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : null;
}

function formatUsdAmount(amount: number) {
  const rounded = Number(amount.toFixed(2));
  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded)}`;
}

function normalizeDiscountCode(code: string | undefined | null) {
  return (code ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function discountCodeFromNotes(notes: string | null | undefined) {
  return notes?.match(/Discount ([A-Z0-9_-]{2,50}) applied:/)?.[1] ?? null;
}

function discountNoteForProduct(product: PaymentProduct) {
  return product.metadata.discount_code
    ? ` Discount ${product.metadata.discount_code} applied: ${product.metadata.discount_amount_label ?? "$0"} off (${product.metadata.original_amount_label ?? product.amountLabel} -> ${product.amountLabel}).`
    : "";
}

function discountPreviewMessage(discount: AppliedDiscount) {
  return `${discount.code} applied. You saved ${discount.discountAmountLabel}.`;
}

function discountIsCurrentlyValid(row: DiscountCodeRow) {
  const now = Date.now();
  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;

  if (!row.is_active) return false;
  if (startsAt && !Number.isNaN(startsAt) && startsAt > now) return false;
  if (expiresAt && !Number.isNaN(expiresAt) && expiresAt < now) return false;
  if (row.max_redemptions !== null && row.redeemed_count >= row.max_redemptions) return false;

  return true;
}

function parseDiscountApplyTargets(value: string | null | undefined): DiscountApplyTarget[] {
  const allowedTargets: DiscountApplyTarget[] = [
    "all",
    "live",
    "mentorship",
    "mentorship_one_to_one",
    "mentorship_group",
    "news",
  ];
  const raw = value?.trim();

  if (!raw) return ["all"];

  const targets = raw
    .split(",")
    .map((target) => target.trim())
    .filter((target): target is DiscountApplyTarget =>
      allowedTargets.includes(target as DiscountApplyTarget),
    );

  return targets.length ? [...new Set(targets)] : ["all"];
}

function discountTargetsForProduct(product: PaymentProduct): DiscountApplyTarget[] {
  if (product.kind === "live") return ["live"];
  if (product.kind === "news") return ["news"];

  if (product.slug === "one_to_one") return ["mentorship", "mentorship_one_to_one"];
  if (product.slug === "group") return ["mentorship", "mentorship_group"];

  return ["mentorship"];
}

function discountAppliesToProduct(row: DiscountCodeRow, product: PaymentProduct) {
  const couponTargets = parseDiscountApplyTargets(row.applies_to);
  if (couponTargets.includes("all")) return true;

  const productTargets = discountTargetsForProduct(product);

  return productTargets.some((target) => couponTargets.includes(target));
}

async function applyDiscountCodeToProduct(
  adminClient: AdminClient,
  product: PaymentProduct,
  rawCode: string | undefined,
) {
  const code = normalizeDiscountCode(rawCode);
  if (!code) {
    return { ok: true as const, product, discount: null as AppliedDiscount | null };
  }

  const { data, error } = await adminClient
    .from("discount_codes")
    .select(
      "code,description,discount_type,discount_value,applies_to,is_active,max_redemptions,redeemed_count,starts_at,expires_at",
    )
    .eq("code", code)
    .maybeSingle();

  const row = data as DiscountCodeRow | null;

  if (error || !row || !discountIsCurrentlyValid(row) || !discountAppliesToProduct(row, product)) {
    return {
      ok: false as const,
      status: "discount_invalid",
      message: "This discount code is not valid for the selected checkout.",
    };
  }

  const rawValue = Number(row.discount_value);
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return {
      ok: false as const,
      status: "discount_invalid",
      message: "This discount code is not valid for the selected checkout.",
    };
  }

  const requestedDiscount =
    row.discount_type === "percent" ? product.amount * Math.min(rawValue, 100) * 0.01 : rawValue;
  const discountAmount = Number(Math.min(requestedDiscount, product.amount - 0.01).toFixed(2));
  const discountedAmount = Number(Math.max(product.amount - discountAmount, 0.01).toFixed(2));

  if (discountAmount <= 0) {
    return {
      ok: false as const,
      status: "discount_invalid",
      message: "This discount code cannot be applied to the selected checkout.",
    };
  }

  const discount: AppliedDiscount = {
    code,
    originalAmountLabel: product.amountLabel,
    discountAmountLabel: formatUsdAmount(discountAmount),
    discountedAmountLabel: formatUsdAmount(discountedAmount),
  };

  return {
    ok: true as const,
    product: {
      ...product,
      amount: discountedAmount,
      amountLabel: discount.discountedAmountLabel,
      metadata: {
        ...product.metadata,
        discount_code: code,
        discount_amount_label: discount.discountAmountLabel,
        original_amount_label: discount.originalAmountLabel,
      },
    },
    discount,
  };
}

function parseProviderAmount(value: string | number | undefined) {
  const amount = typeof value === "number" ? value : Number(value);

  return Number.isFinite(amount) && amount >= 0 ? Number(amount.toFixed(2)) : null;
}

function optionalUrlEnv(name: string) {
  const value = readServerEnv(name);

  return value && /^https:\/\//i.test(value) ? value : undefined;
}

function userSafePaymentError(
  message = "Payment checkout is not configured yet. Please contact support.",
) {
  return {
    ok: false as const,
    status: "payment_provider_not_configured",
    message,
  };
}

function providerFor(paymentMethod: PaymentMethod) {
  const nowPaymentsApiKey = readServerEnv("NOWPAYMENTS_API_KEY");
  const payzoneMerchantAccount = readServerEnv("PAYZONE_MERCHANT_ACCOUNT");
  const payzonePaywallSecretKey = readServerEnv("PAYZONE_PAYWALL_SECRET_KEY");
  const payzonePaywallUrl = readServerEnv("PAYZONE_PAYWALL_URL");
  const gatewayApiUrl = readServerEnv("PAYMENT_GATEWAY_API_URL");
  const gatewaySecretKey = readServerEnv("PAYMENT_GATEWAY_SECRET_KEY");
  const hasExternalGateway = Boolean(gatewayApiUrl && gatewaySecretKey);

  if (paymentMethod === "crypto" && nowPaymentsApiKey) {
    return { provider: "nowpayments" as const, nowPaymentsApiKey };
  }

  if (
    paymentMethod === "card" &&
    payzoneMerchantAccount &&
    payzonePaywallSecretKey &&
    payzonePaywallUrl
  ) {
    return {
      provider: "payzone" as const,
      payzoneMerchantAccount,
      payzonePaywallSecretKey,
      payzonePaywallUrl,
    };
  }

  if (hasExternalGateway && gatewayApiUrl && gatewaySecretKey) {
    return {
      provider: readServerEnv("PAYMENT_GATEWAY_PROVIDER") || "external_gateway",
      gatewayApiUrl,
      gatewaySecretKey,
    };
  }

  return null;
}

async function createNowPaymentsInvoice(data: {
  apiKey: string;
  orderId: string;
  amount: number;
  customerEmail: string;
  description: string;
}) {
  const invoiceResponse = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": data.apiKey,
    },
    body: JSON.stringify({
      price_amount: data.amount,
      price_currency: "usd",
      order_id: data.orderId,
      order_description: data.description,
      ipn_callback_url: optionalUrlEnv("NOWPAYMENTS_IPN_CALLBACK_URL"),
      success_url: optionalUrlEnv("NOWPAYMENTS_SUCCESS_URL"),
      cancel_url: optionalUrlEnv("NOWPAYMENTS_CANCEL_URL"),
    }),
  });

  if (!invoiceResponse.ok) {
    return {
      ok: false as const,
      status: "nowpayments_rejected",
      message: "NOWPayments could not create a secure invoice. Please try again later.",
    };
  }

  const invoiceData = (await invoiceResponse.json()) as NowPaymentsInvoiceResponse;
  const checkoutUrl = invoiceData.invoice_url;
  const providerCheckoutId = String(invoiceData.id ?? invoiceData.invoice_id ?? "");

  if (!checkoutUrl || !providerCheckoutId) {
    return {
      ok: false as const,
      status: "nowpayments_missing_invoice_url",
      message: "NOWPayments did not return a usable checkout URL.",
    };
  }

  return {
    ok: true as const,
    checkoutUrl,
    providerCheckoutId,
  };
}

function createAdminClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createAuthClient(supabaseUrl: string, supabaseAnonKey: string, accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function requireCheckoutContext(accessToken: string) {
  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = readServerEnv("VITE_SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return {
      ok: false as const,
      response: {
        ok: false,
        status: "backend_not_configured",
        message: "Secure checkout is not configured yet. Please contact support.",
      },
    };
  }

  const authClient = createAuthClient(supabaseUrl, supabaseAnonKey, accessToken);
  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return {
      ok: false as const,
      response: {
        ok: false,
        status: "auth_required",
        message: "Please sign in again before starting checkout.",
      },
    };
  }

  return {
    ok: true as const,
    adminClient: createAdminClient(supabaseUrl, supabaseServiceRoleKey),
    user: userData.user,
  };
}

function paymentNote(paymentMethod: PaymentMethod, provider: string) {
  return `Payment method ${paymentMethod} via ${provider} hosted checkout.`;
}

function isActivePaidAccess(access: { status: string; access_expires_at: string | null }) {
  if (access.status !== "paid") return false;
  if (!access.access_expires_at) return true;

  const expiresAt = new Date(access.access_expires_at);

  return Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();
}

function normalizeMentorshipPlanSlug(value: unknown): "one_to_one" | "group" | null {
  if (value === "one_to_one" || value === "group") return value;
  return null;
}

function discordAllowPendingAccess() {
  return readServerEnv("DISCORD_ALLOW_PENDING_ACCESS") === "true";
}

async function provisionPendingDiscordAccess(
  adminClient: AdminClient,
  userId: string,
  product: PaymentProduct,
) {
  if (!discordAllowPendingAccess()) return;

  if (product.kind === "live") {
    await provisionDiscordAccess(adminClient, userId, { kind: "live" });
    return;
  }

  if (product.kind === "news") {
    await provisionDiscordAccess(adminClient, userId, { kind: "news" });
    return;
  }

  const planSlug = normalizeMentorshipPlanSlug(product.slug);
  if (planSlug) {
    await provisionDiscordAccess(adminClient, userId, { kind: "mentorship", planSlug });
  }
}

async function loadLiveProduct(adminClient: AdminClient, packageSlug: string) {
  const { data, error } = await adminClient
    .from("live_trading_packages")
    .select("slug,duration,price,is_active")
    .eq("slug", packageSlug)
    .eq("is_active", true)
    .maybeSingle();

  const amount = data?.price ? parseAmountLabel(String(data.price)) : null;

  if (error || !data || !amount) {
    return null;
  }

  return {
    kind: "live" as const,
    name: "ZacTrades Live Trading Room",
    slug: data.slug as string,
    durationLabel: String(data.duration),
    amountLabel: String(data.price),
    amount,
    metadata: { product: "live_trading", package_slug: String(data.slug) },
  } satisfies PaymentProduct;
}

async function loadMentorshipProduct(adminClient: AdminClient, planSlug: "one_to_one" | "group") {
  const { data, error } = await adminClient
    .from("coaching_plans")
    .select("slug,title,duration,checkout_price,is_active")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .maybeSingle();

  const amount = data?.checkout_price ? parseAmountLabel(String(data.checkout_price)) : null;

  if (error || !data || !amount) {
    return null;
  }

  return {
    kind: "mentorship" as const,
    name: String(data.title),
    slug: data.slug as string,
    durationLabel: String(data.duration),
    amountLabel: String(data.checkout_price),
    amount,
    metadata: { product: "mentorship", plan_slug: String(data.slug) },
  } satisfies PaymentProduct;
}

function paidAccessExpiresAt(product: Pick<PaymentProduct, "kind" | "slug">) {
  if (product.kind === "news") return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (product.kind === "mentorship") {
    if (product.slug === "one_to_one")
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();
  }

  const monthsBySlug: Record<string, number> = {
    one_month: 1,
    three_months: 3,
    six_months: 6,
    twelve_months: 12,
  };
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (product.slug ? (monthsBySlug[product.slug] ?? 1) : 1));
  return expiresAt.toISOString();
}

async function createPendingRecord(data: {
  adminClient: AdminClient;
  userId: string;
  product: PaymentProduct;
  provider: string;
  checkoutId: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  providerPublicOrderId?: string | null;
}) {
  const now = new Date().toISOString();
  const notes = `Checkout started at ${now}. ${paymentNote(data.paymentMethod, data.provider)}${discountNoteForProduct(data.product)}`;

  if (data.product.kind === "live") {
    return data.adminClient.from("user_live_trading_access").upsert(
      {
        user_id: data.userId,
        package_slug: data.product.slug,
        duration_label: data.product.durationLabel,
        status: "pending",
        payment_provider: data.provider,
        provider_customer_id: data.customerEmail,
        provider_checkout_id: data.checkoutId,
        provider_subscription_id: data.providerPublicOrderId ?? null,
        amount_label: data.product.amountLabel,
        paid_at: null,
        access_starts_at: null,
        access_expires_at: null,
        notes,
      },
      { onConflict: "user_id" },
    );
  }

  if (data.product.kind === "mentorship") {
    return data.adminClient.from("user_memberships").upsert(
      {
        user_id: data.userId,
        plan_slug: data.product.slug,
        status: "pending",
        payment_provider: data.provider,
        provider_customer_id: data.customerEmail,
        provider_checkout_id: data.checkoutId,
        provider_subscription_id: data.providerPublicOrderId ?? null,
        amount_label: data.product.amountLabel,
        paid_at: null,
        access_starts_at: null,
        access_expires_at: null,
        notes,
      },
      { onConflict: "user_id,plan_slug" },
    );
  }

  return data.adminClient.from("user_news_subscriptions").upsert(
    {
      user_id: data.userId,
      status: "pending",
      payment_provider: data.provider,
      provider_customer_id: data.customerEmail,
      provider_checkout_id: data.checkoutId,
      provider_subscription_id: data.providerPublicOrderId ?? null,
      amount_label: data.product.amountLabel,
      paid_at: null,
      access_starts_at: null,
      access_expires_at: null,
      notes,
    },
    { onConflict: "user_id" },
  );
}

async function updateNowPaymentsInvoiceId(data: {
  adminClient: AdminClient;
  product: PaymentProduct;
  userId: string;
  invoiceId: string;
}) {
  const patch = {
    provider_subscription_id: data.invoiceId,
    notes: `NOWPayments invoice created. Awaiting verified IPN confirmation.${discountNoteForProduct(data.product)}`,
  };

  if (data.product.kind === "live") {
    return data.adminClient
      .from("user_live_trading_access")
      .update(patch)
      .eq("user_id", data.userId);
  }

  if (data.product.kind === "mentorship") {
    return data.adminClient
      .from("user_memberships")
      .update(patch)
      .eq("user_id", data.userId)
      .eq("plan_slug", data.product.slug);
  }

  return data.adminClient.from("user_news_subscriptions").update(patch).eq("user_id", data.userId);
}

async function startHostedCheckout(data: {
  adminClient: AdminClient;
  userId: string;
  customerEmail: string;
  cardholderName: string;
  paymentMethod: PaymentMethod;
  product: PaymentProduct;
}) {
  const configuredProvider = providerFor(data.paymentMethod);

  if (!configuredProvider) {
    return userSafePaymentError(
      data.paymentMethod === "card"
        ? "Card checkout is not connected yet. Please contact support."
        : "Crypto checkout is not connected yet. Please contact support.",
    );
  }

  const maxPendingAttempts = configuredProvider.provider === "payzone" ? 8 : 1;
  let checkoutId = createCheckoutReference();
  let payzonePublicOrderId: string | null = null;
  let pendingError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < maxPendingAttempts; attempt += 1) {
    checkoutId = createCheckoutReference();
    payzonePublicOrderId =
      configuredProvider.provider === "payzone" ? createPayzonePublicOrderId() : null;

    const { error } = await createPendingRecord({
      adminClient: data.adminClient,
      userId: data.userId,
      product: data.product,
      provider: configuredProvider.provider,
      checkoutId,
      providerPublicOrderId: payzonePublicOrderId,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
    });

    pendingError = error;
    if (!pendingError) break;
    if (configuredProvider.provider !== "payzone" || pendingError.code !== "23505") break;
  }

  if (pendingError) {
    return {
      ok: false as const,
      status: "pending_status_failed",
      message: "Unable to prepare checkout. Please contact support.",
    };
  }

  await provisionPendingDiscordAccess(data.adminClient, data.userId, data.product);

  if (configuredProvider.provider === "nowpayments") {
    const invoiceResult = await createNowPaymentsInvoice({
      apiKey: configuredProvider.nowPaymentsApiKey,
      orderId: checkoutId,
      amount: data.product.amount,
      customerEmail: data.customerEmail,
      description: `${data.product.name} - ${data.product.durationLabel}`,
    });

    if (!invoiceResult.ok) {
      return invoiceResult;
    }

    await updateNowPaymentsInvoiceId({
      adminClient: data.adminClient,
      product: data.product,
      userId: data.userId,
      invoiceId: invoiceResult.providerCheckoutId,
    });

    return {
      ok: true as const,
      status: "redirect_required",
      checkoutUrl: invoiceResult.checkoutUrl,
      providerCheckoutId: checkoutId,
      message: "NOWPayments invoice created. Complete payment in the secure crypto checkout tab.",
    };
  }

  if (configuredProvider.provider === "payzone") {
    return {
      ok: true as const,
      status: "redirect_required",
      checkoutUrl: payzoneCheckoutUrl(checkoutId),
      providerCheckoutId: checkoutId,
      message: "Payzone checkout prepared. Complete payment in the secure Payzone tab.",
    };
  }

  const gatewayResponse = await fetch(configuredProvider.gatewayApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${configuredProvider.gatewaySecretKey}`,
    },
    body: JSON.stringify({
      reference: checkoutId,
      amount: data.product.amount,
      currency: "usd",
      customer: {
        email: data.customerEmail,
        name: data.cardholderName,
        user_id: data.userId,
      },
      product: {
        type: data.product.kind,
        name: data.product.name,
        slug: data.product.slug,
        duration: data.product.durationLabel,
        amount_label: data.product.amountLabel,
        payment_method: data.paymentMethod,
      },
      metadata: {
        source: "zactrades_checkout",
        user_id: data.userId,
        ...data.product.metadata,
        payment_method: data.paymentMethod,
      },
    }),
  });

  if (!gatewayResponse.ok) {
    return {
      ok: false as const,
      status: "gateway_rejected",
      message: "Payment gateway could not create checkout. Please try again later.",
    };
  }

  const gatewayData = (await gatewayResponse.json()) as GatewayCheckoutResponse;
  const checkoutUrl = gatewayData.checkoutUrl ?? gatewayData.checkout_url ?? gatewayData.url;
  const providerCheckoutId =
    gatewayData.checkoutId ?? gatewayData.checkout_id ?? gatewayData.id ?? checkoutId;
  const providerCustomerId = gatewayData.customerId ?? gatewayData.customer_id ?? null;

  if (!checkoutUrl || !/^https:\/\//i.test(checkoutUrl)) {
    return {
      ok: false as const,
      status: "gateway_missing_checkout_url",
      message: "Payment gateway did not return a secure checkout URL.",
    };
  }

  await updateProviderCheckoutMetadata({
    adminClient: data.adminClient,
    product: data.product,
    userId: data.userId,
    providerCheckoutId: String(providerCheckoutId),
    providerCustomerId: providerCustomerId ? String(providerCustomerId) : null,
  });

  return {
    ok: true as const,
    status: "redirect_required",
    checkoutUrl,
    providerCheckoutId: checkoutId,
    message: "Checkout created. Complete payment in the secure gateway tab.",
  };
}

async function updateProviderCheckoutMetadata(data: {
  adminClient: AdminClient;
  product: PaymentProduct;
  userId: string;
  providerCheckoutId: string;
  providerCustomerId: string | null;
}) {
  const patch = {
    provider_subscription_id: data.providerCheckoutId,
    provider_customer_id: data.providerCustomerId,
    notes: `Hosted checkout created. Awaiting verified provider webhook confirmation.${discountNoteForProduct(data.product)}`,
  };

  if (data.product.kind === "live") {
    return data.adminClient
      .from("user_live_trading_access")
      .update(patch)
      .eq("user_id", data.userId);
  }

  if (data.product.kind === "mentorship") {
    return data.adminClient
      .from("user_memberships")
      .update(patch)
      .eq("user_id", data.userId)
      .eq("plan_slug", data.product.slug);
  }

  return data.adminClient.from("user_news_subscriptions").update(patch).eq("user_id", data.userId);
}

async function loadDiscountPreviewProduct(
  adminClient: AdminClient,
  data: z.infer<typeof discountPreviewSchema>,
) {
  if (data.checkoutKind === "live") {
    return data.packageSlug ? loadLiveProduct(adminClient, data.packageSlug) : null;
  }

  if (data.checkoutKind === "mentorship") {
    return data.planSlug ? loadMentorshipProduct(adminClient, data.planSlug) : null;
  }

  return NEWS_SUBSCRIPTION_PRODUCT;
}

export const previewDiscountCode = createServerFn({ method: "POST" })
  .inputValidator(discountPreviewSchema)
  .handler(async ({ data }) => {
    const context = await requireCheckoutContext(data.accessToken);
    if (!context.ok) return context.response;

    const product = await loadDiscountPreviewProduct(context.adminClient, data);
    if (!product) {
      return {
        ok: false,
        status: "invalid_product",
        message: "Selected checkout item is unavailable.",
      };
    }

    const discountResult = await applyDiscountCodeToProduct(
      context.adminClient,
      product,
      data.discountCode,
    );

    if (!discountResult.ok) return discountResult;

    if (!discountResult.discount) {
      return { ok: false, status: "discount_invalid", message: "Enter a discount code first." };
    }

    return {
      ok: true,
      status: "discount_applied",
      code: discountResult.discount.code,
      originalAmountLabel: discountResult.discount.originalAmountLabel,
      discountAmountLabel: discountResult.discount.discountAmountLabel,
      discountedAmountLabel: discountResult.discount.discountedAmountLabel,
      message: discountPreviewMessage(discountResult.discount),
    };
  });

export const startLiveTradingCheckout = createServerFn({ method: "POST" })
  .inputValidator(liveTradingCheckoutSchema)
  .handler(async ({ data }) => {
    const context = await requireCheckoutContext(data.accessToken);
    if (!context.ok) return context.response;

    const product = await loadLiveProduct(context.adminClient, data.packageSlug);
    if (!product) {
      return {
        ok: false,
        status: "invalid_product",
        message: "Selected live package is unavailable.",
      };
    }

    const { data: existingAccess, error: existingError } = await context.adminClient
      .from("user_live_trading_access")
      .select("status,access_expires_at")
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (existingError) {
      return { ok: false, status: "live_access_lookup_failed", message: "Unable to check access." };
    }

    if (existingAccess && isActivePaidAccess(existingAccess)) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your live trading access is already active.",
      };
    }

    const discountResult = await applyDiscountCodeToProduct(
      context.adminClient,
      product,
      data.discountCode,
    );

    if (!discountResult.ok) return discountResult;

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product: discountResult.product,
    });
  });

export const startMentorshipCheckout = createServerFn({ method: "POST" })
  .inputValidator(mentorshipCheckoutSchema)
  .handler(async ({ data }) => {
    const context = await requireCheckoutContext(data.accessToken);
    if (!context.ok) return context.response;

    const product = await loadMentorshipProduct(context.adminClient, data.planSlug);
    if (!product) {
      return {
        ok: false,
        status: "invalid_product",
        message: "Selected mentorship plan is unavailable.",
      };
    }

    const { data: existingMembership, error: existingError } = await context.adminClient
      .from("user_memberships")
      .select("status,access_expires_at")
      .eq("user_id", context.user.id)
      .eq("plan_slug", data.planSlug)
      .maybeSingle();

    if (existingError) {
      return { ok: false, status: "membership_lookup_failed", message: "Unable to check access." };
    }

    if (existingMembership && isActivePaidAccess(existingMembership)) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your mentorship access is already active.",
      };
    }

    const discountResult = await applyDiscountCodeToProduct(
      context.adminClient,
      product,
      data.discountCode,
    );

    if (!discountResult.ok) return discountResult;

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product: discountResult.product,
    });
  });

export const startNewsSubscriptionCheckout = createServerFn({ method: "POST" })
  .inputValidator(newsSubscriptionCheckoutSchema)
  .handler(async ({ data }) => {
    const context = await requireCheckoutContext(data.accessToken);
    if (!context.ok) return context.response;

    const { data: existingSubscription, error: existingError } = await context.adminClient
      .from("user_news_subscriptions")
      .select("status,access_expires_at")
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (existingError) {
      return {
        ok: false,
        status: "subscription_lookup_failed",
        message: "Unable to check access.",
      };
    }

    if (existingSubscription && isActivePaidAccess(existingSubscription)) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your news subscription is already active.",
      };
    }

    const discountResult = await applyDiscountCodeToProduct(
      context.adminClient,
      NEWS_SUBSCRIPTION_PRODUCT,
      data.discountCode,
    );

    if (!discountResult.ok) return discountResult;

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product: discountResult.product,
    });
  });

function sortForNowPayments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForNowPayments);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((next, key) => {
      next[key] = sortForNowPayments((value as Record<string, unknown>)[key]);
      return next;
    }, {});
}

async function hmacSha512Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(message: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqualHex(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function optionalHttpsUrl(value: string | undefined) {
  return value && /^https:\/\//i.test(value) ? value : undefined;
}

async function verifyNowPaymentsSignature(payload: unknown, signature: string, secret: string) {
  const signedBody = JSON.stringify(sortForNowPayments(payload));
  const expected = await hmacSha512Hex(secret, signedBody);
  return safeEqualHex(expected, signature);
}

function nowPaymentsEventId(payload: NowPaymentsIpnPayload) {
  return [payload.payment_id, payload.invoice_id, payload.order_id, payload.payment_status]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .join(":");
}

function isNowPaymentsPaidStatus(status: string | undefined) {
  return status === "finished" || status === "confirmed";
}

function isNowPaymentsTerminalFailure(status: string | undefined) {
  return status === "failed" || status === "expired" || status === "refunded";
}

async function insertWebhookEvent(
  adminClient: AdminClient,
  payload: NowPaymentsIpnPayload,
  eventId: string,
) {
  const { error } = await adminClient.from("payment_webhook_events").insert({
    provider: "nowpayments",
    event_id: eventId,
    event_type: "ipn",
    payment_status: payload.payment_status ?? null,
    provider_payment_id: payload.payment_id ? String(payload.payment_id) : null,
    provider_invoice_id: payload.invoice_id ? String(payload.invoice_id) : null,
    provider_order_id: payload.order_id ?? null,
    processed: false,
  });

  if (error?.code === "23505") return { duplicate: true as const };
  if (error) return { duplicate: false as const, error };
  return { duplicate: false as const };
}

async function markWebhookEventProcessed(
  adminClient: AdminClient,
  eventId: string,
  processed: boolean,
  errorMessage?: string,
  provider = "nowpayments",
) {
  await adminClient
    .from("payment_webhook_events")
    .update({
      processed,
      error_message: errorMessage ? errorMessage.slice(0, 500) : null,
      processed_at: new Date().toISOString(),
    })
    .eq("provider", provider)
    .eq("event_id", eventId);
}

async function maybeSingleTarget<T extends Record<string, unknown>>(
  query: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>,
) {
  const { data, error } = await query;
  if (error || !data) return null;
  return data;
}

async function findPaymentTargetByColumn(
  adminClient: AdminClient,
  provider: string,
  column: "provider_checkout_id" | "provider_subscription_id",
  value: string,
) {
  const live = await maybeSingleTarget(
    adminClient
      .from("user_live_trading_access")
      .select("user_id,package_slug,status,amount_label,notes")
      .eq("payment_provider", provider)
      .eq(column, value)
      .maybeSingle(),
  );
  if (live) {
    return {
      kind: "live" as const,
      table: "user_live_trading_access" as const,
      userId: String(live.user_id),
      packageSlug: live.package_slug ? String(live.package_slug) : null,
      amountLabel: live.amount_label ? String(live.amount_label) : null,
      status: String(live.status),
      notes: live.notes ? String(live.notes) : null,
    } satisfies PaymentTarget;
  }

  const membership = await maybeSingleTarget(
    adminClient
      .from("user_memberships")
      .select("user_id,plan_slug,status,amount_label,notes")
      .eq("payment_provider", provider)
      .eq(column, value)
      .maybeSingle(),
  );
  if (membership) {
    const planSlug = normalizeMentorshipPlanSlug(membership.plan_slug);
    if (!planSlug) return null;

    return {
      kind: "mentorship" as const,
      table: "user_memberships" as const,
      userId: String(membership.user_id),
      planSlug,
      amountLabel: membership.amount_label ? String(membership.amount_label) : null,
      status: String(membership.status),
      notes: membership.notes ? String(membership.notes) : null,
    } satisfies PaymentTarget;
  }

  const news = await maybeSingleTarget(
    adminClient
      .from("user_news_subscriptions")
      .select("user_id,status,amount_label,notes")
      .eq("payment_provider", provider)
      .eq(column, value)
      .maybeSingle(),
  );
  if (news) {
    return {
      kind: "news" as const,
      table: "user_news_subscriptions" as const,
      userId: String(news.user_id),
      amountLabel: news.amount_label ? String(news.amount_label) : null,
      status: String(news.status),
      notes: news.notes ? String(news.notes) : null,
    } satisfies PaymentTarget;
  }

  return null;
}

async function findPaymentTarget(
  adminClient: AdminClient,
  payload: NowPaymentsIpnPayload,
  provider = "nowpayments",
) {
  const orderId = payload.order_id;
  const invoiceId = payload.invoice_id ? String(payload.invoice_id) : null;
  const rawCandidateValues = [orderId, invoiceId].filter((value): value is string =>
    Boolean(value),
  );
  const candidateValues = [
    ...rawCandidateValues,
    ...(provider === "payzone"
      ? rawCandidateValues
          .map((value) => payzonePublicOrderIdToCheckoutId(value))
          .filter((value): value is string => Boolean(value))
      : []),
  ].filter((value, index, values) => values.indexOf(value) === index);
  const columns =
    provider === "payzone"
      ? (["provider_checkout_id", "provider_subscription_id"] as const)
      : (["provider_checkout_id"] as const);

  for (const value of candidateValues) {
    for (const column of columns) {
      const target = await findPaymentTargetByColumn(adminClient, provider, column, value);
      if (target) return target;
    }
  }

  return null;
}

function validateNowPaymentsAmount(target: PaymentTarget, payload: NowPaymentsIpnPayload) {
  const expectedAmount = target.amountLabel ? parseAmountLabel(target.amountLabel) : null;
  const actualAmount = parseProviderAmount(payload.price_amount);
  const currency = payload.price_currency?.toLowerCase();

  return Boolean(
    expectedAmount &&
    actualAmount &&
    Math.abs(expectedAmount - actualAmount) < 0.01 &&
    currency === "usd",
  );
}

async function applyPaidTarget(
  adminClient: AdminClient,
  target: PaymentTarget,
  confirmation: PaymentConfirmation,
) {
  const now = new Date().toISOString();
  const appliedDiscountCode = discountCodeFromNotes(target.notes);
  const patch = {
    status: "paid",
    paid_at: now,
    access_starts_at: now,
    access_expires_at: paidAccessExpiresAt({
      kind: target.kind,
      slug:
        target.kind === "live"
          ? target.packageSlug
          : target.kind === "mentorship"
            ? target.planSlug
            : null,
    }),
    notes: `${confirmation.providerLabel} payment confirmed by verified webhook. Payment reference: ${confirmation.providerReference}.${
      appliedDiscountCode ? ` Discount ${appliedDiscountCode} applied.` : ""
    }`,
  };

  if (appliedDiscountCode) {
    await adminClient.rpc("increment_discount_code_redemption", { p_code: appliedDiscountCode });
  }

  if (target.kind === "live") {
    await adminClient.from("user_live_trading_access").update(patch).eq("user_id", target.userId);
    await provisionDiscordAccess(adminClient, target.userId, { kind: "live" });
    return;
  }

  if (target.kind === "mentorship") {
    await adminClient
      .from("user_memberships")
      .update(patch)
      .eq("user_id", target.userId)
      .eq("plan_slug", target.planSlug);
    await provisionDiscordAccess(adminClient, target.userId, {
      kind: "mentorship",
      planSlug: target.planSlug,
    });
    return;
  }

  await adminClient.from("user_news_subscriptions").update(patch).eq("user_id", target.userId);
  await provisionDiscordAccess(adminClient, target.userId, { kind: "news" });
}

async function applyFailedTarget(
  adminClient: AdminClient,
  target: PaymentTarget,
  failure: PaymentFailure,
) {
  const patch = {
    status: failure.status,
    notes: `${failure.providerLabel} payment ended with status ${failure.rawStatus || "unknown"}.`,
  };

  if (target.kind === "live") {
    await adminClient.from("user_live_trading_access").update(patch).eq("user_id", target.userId);
    return;
  }

  if (target.kind === "mentorship") {
    await adminClient
      .from("user_memberships")
      .update(patch)
      .eq("user_id", target.userId)
      .eq("plan_slug", target.planSlug);
    return;
  }

  await adminClient.from("user_news_subscriptions").update(patch).eq("user_id", target.userId);
}

type PayzoneLaunchTarget = PaymentTarget & {
  checkoutId: string;
  customerEmail: string | null;
  description: string;
  publicOrderId: string | null;
};

function payzoneCurrency() {
  return (readServerEnv("PAYZONE_CURRENCY") || "MAD").trim().toUpperCase();
}

function payzoneUsdToMadRate() {
  const configuredRate = Number(readServerEnv("PAYZONE_USD_TO_MAD_RATE"));
  return Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 10;
}

function amountForPayzone(amountUsd: number) {
  const payzoneAmount = payzoneCurrency() === "MAD" ? amountUsd * payzoneUsdToMadRate() : amountUsd;
  return Number(payzoneAmount.toFixed(2));
}

function payzoneCheckoutUrl(checkoutId: string) {
  return `/api/payzone/launch?checkoutId=${encodeURIComponent(checkoutId)}`;
}

const PAYZONE_PUBLIC_ORDER_PREFIX = "ZC-";

function createPayzonePublicOrderId() {
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `${PAYZONE_PUBLIC_ORDER_PREFIX}${randomPart}`;
}

function base64UrlEncode(bytes: Uint8Array) {
  const binary = [...bytes].map((byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function checkoutIdToPayzonePublicOrderId(checkoutId: string) {
  const uuidHex = checkoutId.match(/^ztc_([a-f0-9-]+)$/i)?.[1]?.replace(/-/g, "");

  if (!uuidHex || uuidHex.length !== 32) return checkoutId;

  const bytes = Uint8Array.from(uuidHex.match(/.{2}/g) ?? [], (part) => parseInt(part, 16));
  return `${PAYZONE_PUBLIC_ORDER_PREFIX}${base64UrlEncode(bytes)}`;
}

function payzonePublicOrderIdToCheckoutId(orderId: string | undefined | null) {
  const encoded = orderId?.trim();
  if (!encoded?.toUpperCase().startsWith(PAYZONE_PUBLIC_ORDER_PREFIX)) return null;

  const value = encoded.slice(PAYZONE_PUBLIC_ORDER_PREFIX.length);
  if (!/^[A-Za-z0-9_-]{22}$/.test(value)) return null;

  const bytes = base64UrlDecode(value);
  if (bytes.length !== 16) return null;

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `ztc_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function paymentResultUrl(origin: string, envName: string, fallbackPath: string) {
  return optionalUrlEnv(envName) ?? `${origin}${fallbackPath}`;
}

function originFromUrl(value: string | undefined) {
  if (!value || !/^https:\/\//i.test(value)) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function payzonePublicOrigin(requestOrigin: string) {
  return (
    originFromUrl(readServerEnv("PAYZONE_PUBLIC_SITE_URL")) ??
    originFromUrl(readServerEnv("PAYZONE_CALLBACK_URL")) ??
    originFromUrl(readServerEnv("PAYZONE_SUCCESS_URL")) ??
    originFromUrl(readServerEnv("PAYZONE_FAILURE_URL")) ??
    originFromUrl(readServerEnv("PAYZONE_CANCEL_URL")) ??
    originFromUrl(requestOrigin)
  );
}

function payzoneDescription(target: PaymentTarget) {
  if (target.kind === "live") {
    return `ZacTrades Live Trading - ${target.packageSlug ?? "Access"}`;
  }

  if (target.kind === "mentorship") {
    return `ZacTrades Mentorship - ${target.planSlug === "one_to_one" ? "1-to-1 Coaching" : "Training Group Coaching"}`;
  }

  return "ZacTrades News Desk";
}

async function findPayzoneLaunchTarget(adminClient: AdminClient, checkoutId: string) {
  const live = await maybeSingleTarget(
    adminClient
      .from("user_live_trading_access")
      .select(
        "user_id,package_slug,status,amount_label,provider_customer_id,provider_subscription_id",
      )
      .eq("payment_provider", "payzone")
      .eq("provider_checkout_id", checkoutId)
      .maybeSingle(),
  );
  if (live) {
    const target = {
      kind: "live" as const,
      table: "user_live_trading_access" as const,
      userId: String(live.user_id),
      packageSlug: live.package_slug ? String(live.package_slug) : null,
      amountLabel: live.amount_label ? String(live.amount_label) : null,
      status: String(live.status),
    } satisfies PaymentTarget;
    return {
      ...target,
      checkoutId,
      customerEmail: live.provider_customer_id ? String(live.provider_customer_id) : null,
      description: payzoneDescription(target),
      publicOrderId: live.provider_subscription_id ? String(live.provider_subscription_id) : null,
    } satisfies PayzoneLaunchTarget;
  }

  const membership = await maybeSingleTarget(
    adminClient
      .from("user_memberships")
      .select("user_id,plan_slug,status,amount_label,provider_customer_id,provider_subscription_id")
      .eq("payment_provider", "payzone")
      .eq("provider_checkout_id", checkoutId)
      .maybeSingle(),
  );
  if (membership) {
    const planSlug = normalizeMentorshipPlanSlug(membership.plan_slug);
    if (!planSlug) return null;

    const target = {
      kind: "mentorship" as const,
      table: "user_memberships" as const,
      userId: String(membership.user_id),
      planSlug,
      amountLabel: membership.amount_label ? String(membership.amount_label) : null,
      status: String(membership.status),
    } satisfies PaymentTarget;
    return {
      ...target,
      checkoutId,
      customerEmail: membership.provider_customer_id
        ? String(membership.provider_customer_id)
        : null,
      description: payzoneDescription(target),
      publicOrderId: membership.provider_subscription_id
        ? String(membership.provider_subscription_id)
        : null,
    } satisfies PayzoneLaunchTarget;
  }

  const news = await maybeSingleTarget(
    adminClient
      .from("user_news_subscriptions")
      .select("user_id,status,amount_label,provider_customer_id,provider_subscription_id")
      .eq("payment_provider", "payzone")
      .eq("provider_checkout_id", checkoutId)
      .maybeSingle(),
  );
  if (news) {
    const target = {
      kind: "news" as const,
      table: "user_news_subscriptions" as const,
      userId: String(news.user_id),
      amountLabel: news.amount_label ? String(news.amount_label) : null,
      status: String(news.status),
    } satisfies PaymentTarget;
    return {
      ...target,
      checkoutId,
      customerEmail: news.provider_customer_id ? String(news.provider_customer_id) : null,
      description: payzoneDescription(target),
      publicOrderId: news.provider_subscription_id ? String(news.provider_subscription_id) : null,
    } satisfies PayzoneLaunchTarget;
  }

  return null;
}

export function handlePayzoneThemeCssRequest(request: Request) {
  const url = new URL(request.url);
  const publicOrigin = payzonePublicOrigin(url.origin) ?? url.origin;
  const logoUrl = `${publicOrigin}/payzone-zactrades-logo.png`;

  const css = `body {
  padding-top: 132px !important;
  background: #ffffff !important;
}

body::before {
  content: "";
  position: absolute;
  top: 22px;
  left: 50%;
  z-index: 999999;
  display: block;
  width: 230px;
  height: 98px;
  transform: translateX(-50%);
  background-image: url("${logoUrl}");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  pointer-events: none;
}

body::after {
  content: "";
  position: absolute;
  top: 118px;
  left: 8%;
  right: 8%;
  z-index: 999998;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.18), transparent);
  pointer-events: none;
}

@media (max-width: 700px) {
  body {
    padding-top: 108px !important;
  }

  body::before {
    top: 16px;
    width: 170px;
    height: 76px;
  }

  body::after {
    top: 96px;
    left: 5%;
    right: 5%;
  }
}
`;

  return new Response(css, {
    headers: {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}

function payzoneLaunchHtml(paywallUrl: string, payload: string, signature: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to Payzone | ZacTrades</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #050914;
        color: #f8fafc;
        font-family: Inter, system-ui, sans-serif;
      }
      .card {
        width: min(92vw, 28rem);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1.5rem;
        padding: 2rem;
        text-align: center;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.72));
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        margin: 0 auto 1rem;
        border-radius: 999px;
        border: 3px solid rgba(56, 189, 248, 0.25);
        border-top-color: #38bdf8;
        animation: spin 0.8s linear infinite;
      }
      button {
        margin-top: 1rem;
        border: 0;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font-weight: 700;
        color: #020617;
        background: linear-gradient(135deg, #38bdf8, #8b5cf6);
        cursor: pointer;
      }
      p { color: #94a3b8; line-height: 1.6; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="spinner" aria-hidden="true"></div>
      <h1>Opening secure Payzone checkout</h1>
      <p>If the payment page does not open automatically, press the button below.</p>
      <form id="payzone-launch" action="${escapeHtml(paywallUrl)}" method="post">
        <input type="hidden" name="payload" value="${escapeHtml(payload)}" />
        <input type="hidden" name="signature" value="${escapeHtml(signature)}" />
        <button type="submit">Continue to Payzone</button>
      </form>
    </main>
    <script>
      document.getElementById("payzone-launch").submit();
    </script>
  </body>
</html>`;
}

export async function handlePayzoneLaunchRequest(
  request: Request,
  env: Record<string, string | undefined>,
) {
  globalThis.__ZACTRADES_SERVER_ENV__ = env;

  if (request.method !== "GET") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const merchantAccount = readServerEnv("PAYZONE_MERCHANT_ACCOUNT");
  const paywallSecretKey = readServerEnv("PAYZONE_PAYWALL_SECRET_KEY");
  const paywallUrl = optionalHttpsUrl(readServerEnv("PAYZONE_PAYWALL_URL"));

  if (!supabaseUrl || !serviceRoleKey || !merchantAccount || !paywallSecretKey || !paywallUrl) {
    return Response.json({ ok: false, error: "payzone_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const checkoutId = url.searchParams.get("checkoutId")?.trim();
  if (!checkoutId || !/^ztc_[a-f0-9-]+$/i.test(checkoutId)) {
    return Response.json({ ok: false, error: "invalid_checkout_id" }, { status: 400 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
  const target = await findPayzoneLaunchTarget(adminClient, checkoutId);
  const amount = target?.amountLabel ? parseAmountLabel(target.amountLabel) : null;

  if (!target || !amount) {
    return Response.json({ ok: false, error: "checkout_not_found" }, { status: 404 });
  }

  if (target.status === "paid") {
    return Response.redirect(
      paymentResultUrl(url.origin, "PAYZONE_SUCCESS_URL", "/payment/success"),
    );
  }

  const payzonePublicOrderId = target.publicOrderId ?? checkoutIdToPayzonePublicOrderId(checkoutId);
  const payzoneAmount = amountForPayzone(amount);
  const publicOrigin = payzonePublicOrigin(url.origin);
  const payzoneThemeCssUrl =
    optionalUrlEnv("PAYZONE_CSS_URL") ??
    (publicOrigin ? `${publicOrigin}/api/payzone/theme.css` : undefined);
  const payzoneMobileThemeCssUrl = optionalUrlEnv("PAYZONE_MOBILE_CSS_URL") ?? payzoneThemeCssUrl;

  const payload: Record<string, string | number | boolean | undefined> = {
    merchantAccount,
    timestamp: Math.floor(Date.now() / 1000),
    skin: readServerEnv("PAYZONE_SKIN") || "vps-1-vue",
    customerId: target.userId,
    customerCountry: readServerEnv("PAYZONE_CUSTOMER_COUNTRY") || "MA",
    customerLocale: readServerEnv("PAYZONE_CUSTOMER_LOCALE") || "en_US",
    customerEmail: target.customerEmail ?? undefined,
    chargeId: payzonePublicOrderId,
    orderId: payzonePublicOrderId,
    price: payzoneAmount.toFixed(2),
    currency: payzoneCurrency(),
    description: target.description,
    cssUrl: payzoneThemeCssUrl,
    cssURL: payzoneThemeCssUrl,
    mobileCssUrl: payzoneMobileThemeCssUrl,
    mobileCssURL: payzoneMobileThemeCssUrl,
    callbackUrl: paymentResultUrl(url.origin, "PAYZONE_CALLBACK_URL", "/api/payzone/callback"),
    successUrl: paymentResultUrl(url.origin, "PAYZONE_SUCCESS_URL", "/payment/success"),
    failureUrl: paymentResultUrl(url.origin, "PAYZONE_FAILURE_URL", "/payment/failure"),
    cancelUrl: paymentResultUrl(url.origin, "PAYZONE_CANCEL_URL", "/payment/cancel"),
  };

  payload.mode = "DEEP_LINK";
  payload.paymentMethod = "CREDIT_CARD";
  payload.showPaymentProfiles = false;
  const jsonPayload = JSON.stringify(payload);
  const signature = await sha256Hex(`${paywallSecretKey}${jsonPayload}`);
  const paywallOrigin = new URL(paywallUrl).origin;

  return new Response(payzoneLaunchHtml(paywallUrl, jsonPayload, signature), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "content-security-policy": [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        `form-action ${paywallOrigin}`,
        "base-uri 'none'",
        "frame-ancestors 'none'",
      ].join("; "),
    },
  });
}

function payzoneEventId(payload: PayzoneCallbackPayload) {
  const transactionId =
    payload.transactions?.find((transaction) => transaction.gatewayProvidedId)?.gatewayProvidedId ??
    payload.internalId ??
    "";

  return [payload.id, payload.orderId, payload.status, transactionId]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .join(":");
}

async function insertPayzoneWebhookEvent(
  adminClient: AdminClient,
  payload: PayzoneCallbackPayload,
  eventId: string,
) {
  const transaction = payload.transactions?.[payload.transactions.length - 1];
  const { error } = await adminClient.from("payment_webhook_events").insert({
    provider: "payzone",
    event_id: eventId,
    event_type: "callback",
    payment_status: payload.status ?? null,
    provider_payment_id: payload.id ?? payload.internalId ?? transaction?.gatewayProvidedId ?? null,
    provider_invoice_id: payload.internalId ?? null,
    provider_order_id: payload.orderId ?? null,
    processed: false,
  });

  if (error?.code === "23505") return { duplicate: true as const };
  if (error) return { duplicate: false as const, error };
  return { duplicate: false as const };
}

function normalizePayzoneStatus(status: string | undefined) {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

function normalizePayzoneTransactionState(state: string | undefined) {
  return String(state ?? "")
    .trim()
    .toUpperCase();
}

function normalizePayzoneTransactionType(type: string | undefined) {
  return String(type ?? "")
    .trim()
    .toUpperCase();
}

function payzoneApprovedTransaction(payload: PayzoneCallbackPayload) {
  return payload.transactions?.find((transaction) => {
    const type = normalizePayzoneTransactionType(transaction.type);

    return (
      normalizePayzoneTransactionState(transaction.state) === "APPROVED" &&
      Number(transaction.resultCode) === 0 &&
      (!type || type === "CHARGE" || type === "AUTHORIZATION" || type === "SETTLE")
    );
  });
}

function isPayzonePaidStatus(payload: PayzoneCallbackPayload) {
  return (
    normalizePayzoneStatus(payload.status) === "CHARGED" &&
    Boolean(payzoneApprovedTransaction(payload))
  );
}

function isPayzoneTerminalFailure(status: string | undefined) {
  return (
    normalizePayzoneStatus(status) === "DECLINED" ||
    normalizePayzoneStatus(status) === "CANCELLED" ||
    normalizePayzoneStatus(status) === "ERROR" ||
    normalizePayzoneStatus(status) === "REFUNDED" ||
    normalizePayzoneStatus(status) === "CHARGED_BACK"
  );
}

function validatePayzoneAmount(target: PaymentTarget, payload: PayzoneCallbackPayload) {
  const expectedAmount = target.amountLabel ? parseAmountLabel(target.amountLabel) : null;
  const approvedTransaction = payzoneApprovedTransaction(payload);
  const actualAmount = parseProviderAmount(payload.lineItem?.amount ?? approvedTransaction?.amount);
  const currency = String(payload.lineItem?.currency ?? approvedTransaction?.currency ?? "")
    .trim()
    .toUpperCase();

  const expectedPayzoneAmount = expectedAmount ? amountForPayzone(expectedAmount) : null;

  return Boolean(
    expectedPayzoneAmount &&
    actualAmount &&
    Math.abs(expectedPayzoneAmount - actualAmount) < 0.01 &&
    currency === payzoneCurrency(),
  );
}

function logPayzoneCallback(message: string, details: Record<string, unknown> = {}) {
  console.info(
    "[payzone-callback]",
    message,
    JSON.stringify({
      ...details,
      at: new Date().toISOString(),
    }),
  );
}

export async function handlePayzoneCallbackRequest(
  request: Request,
  env: Record<string, string | undefined>,
) {
  globalThis.__ZACTRADES_SERVER_ENV__ = env;

  if (request.method !== "POST") {
    logPayzoneCallback("method_not_allowed", { method: request.method });
    return Response.json({ status: "KO", message: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const notificationKey = readServerEnv("PAYZONE_NOTIFICATION_KEY");
  const merchantAccount = readServerEnv("PAYZONE_MERCHANT_ACCOUNT");
  const signature = request.headers.get("x-callback-signature") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !notificationKey || !merchantAccount) {
    logPayzoneCallback("webhook_not_configured", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasNotificationKey: Boolean(notificationKey),
      hasMerchantAccount: Boolean(merchantAccount),
    });
    return Response.json({ status: "KO", message: "Webhook not configured" }, { status: 503 });
  }

  if (!signature) {
    logPayzoneCallback("missing_signature");
    return Response.json({ status: "KO", message: "Missing signature" }, { status: 401 });
  }

  const rawBody = await request.text();
  logPayzoneCallback("received", { bodyLength: rawBody.length });
  const expectedSignature = await hmacSha256Hex(notificationKey, rawBody);
  if (!safeEqualHex(expectedSignature, signature)) {
    logPayzoneCallback("invalid_signature", { bodyLength: rawBody.length });
    return Response.json({ status: "KO", message: "Error signature" }, { status: 401 });
  }

  let payload: PayzoneCallbackPayload;
  try {
    payload = JSON.parse(rawBody) as PayzoneCallbackPayload;
  } catch {
    logPayzoneCallback("invalid_json");
    return Response.json({ status: "KO", message: "Invalid JSON" }, { status: 400 });
  }

  if (payload.merchantAccount && payload.merchantAccount !== merchantAccount) {
    logPayzoneCallback("merchant_mismatch", {
      payloadMerchantAccount: payload.merchantAccount,
      expectedMerchantAccount: merchantAccount,
      orderId: payload.orderId ?? null,
      status: payload.status ?? null,
    });
    return Response.json({ status: "KO", message: "Merchant mismatch" }, { status: 400 });
  }

  const eventId = payzoneEventId(payload);
  if (!eventId) {
    logPayzoneCallback("missing_event_id", {
      orderId: payload.orderId ?? null,
      status: payload.status ?? null,
    });
    return Response.json({ status: "KO", message: "Missing event id" }, { status: 400 });
  }

  logPayzoneCallback("validated", {
    eventId,
    orderId: payload.orderId ?? null,
    invoiceId: payload.id ?? null,
    status: payload.status ?? null,
  });

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
  const insertResult = await insertPayzoneWebhookEvent(adminClient, payload, eventId);

  if (insertResult.duplicate) {
    logPayzoneCallback("duplicate", { eventId });
    return Response.json({ status: "OK", message: "Duplicate callback ignored" });
  }

  if (insertResult.error) {
    logPayzoneCallback("event_record_failed", {
      eventId,
      error: insertResult.error.message,
    });
    return Response.json({ status: "KO", message: "Event record failed" }, { status: 500 });
  }

  const target = await findPaymentTarget(
    adminClient,
    {
      order_id: payload.orderId,
      invoice_id: payload.id,
      payment_status: payload.status,
    },
    "payzone",
  );

  if (!target) {
    logPayzoneCallback("target_not_found", {
      eventId,
      orderId: payload.orderId ?? null,
      invoiceId: payload.id ?? null,
      status: payload.status ?? null,
    });
    await markWebhookEventProcessed(
      adminClient,
      eventId,
      false,
      "No matching Payzone pending payment target.",
      "payzone",
    );
    return Response.json({ status: "OK", message: "Callback ignored" });
  }

  if (target.status === "paid") {
    logPayzoneCallback("already_paid", { eventId, targetKind: target.kind });
    await markWebhookEventProcessed(adminClient, eventId, true, undefined, "payzone");
    return Response.json({ status: "OK", message: "Already paid" });
  }

  if (isPayzonePaidStatus(payload)) {
    if (!validatePayzoneAmount(target, payload)) {
      logPayzoneCallback("amount_or_currency_mismatch", {
        eventId,
        targetKind: target.kind,
        targetAmountLabel: target.amountLabel,
        payloadAmount:
          payload.lineItem?.amount ?? payzoneApprovedTransaction(payload)?.amount ?? null,
        payloadCurrency:
          payload.lineItem?.currency ?? payzoneApprovedTransaction(payload)?.currency ?? null,
      });
      await markWebhookEventProcessed(
        adminClient,
        eventId,
        false,
        "Payzone amount or currency mismatch.",
        "payzone",
      );
      return Response.json({ status: "OK", message: "Callback ignored" });
    }

    await applyPaidTarget(adminClient, target, {
      providerLabel: "Payzone",
      providerReference: String(
        payload.id ??
          payload.internalId ??
          payzoneApprovedTransaction(payload)?.gatewayProvidedId ??
          "unknown",
      ),
    });
    await markWebhookEventProcessed(adminClient, eventId, true, undefined, "payzone");
    logPayzoneCallback("paid_recorded", { eventId, targetKind: target.kind });
    return Response.json({ status: "OK", message: "Status recorded successfully" });
  }

  if (isPayzoneTerminalFailure(payload.status)) {
    logPayzoneCallback("terminal_failure", {
      eventId,
      targetKind: target.kind,
      status: payload.status ?? null,
    });
    await applyFailedTarget(adminClient, target, {
      providerLabel: "Payzone",
      rawStatus: payload.status ?? "unknown",
      status: "cancelled",
    });
    await markWebhookEventProcessed(adminClient, eventId, true, undefined, "payzone");
    return Response.json({ status: "OK", message: "Status recorded successfully" });
  }

  await markWebhookEventProcessed(adminClient, eventId, true, undefined, "payzone");
  logPayzoneCallback("pending_or_unhandled_status", {
    eventId,
    targetKind: target.kind,
    status: payload.status ?? null,
  });
  return Response.json({ status: "OK", message: "Status recorded successfully" });
}

export async function handleNowPaymentsIpnRequest(
  request: Request,
  env: Record<string, string | undefined>,
) {
  globalThis.__ZACTRADES_SERVER_ENV__ = env;

  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const ipnSecret = readServerEnv("NOWPAYMENTS_IPN_SECRET");
  const signature = request.headers.get("x-nowpayments-sig") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !ipnSecret) {
    return Response.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }

  if (!signature) {
    return Response.json({ ok: false, error: "missing_signature" }, { status: 401 });
  }

  let payload: NowPaymentsIpnPayload;
  try {
    payload = (await request.json()) as NowPaymentsIpnPayload;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const isValid = await verifyNowPaymentsSignature(payload, signature, ipnSecret);
  if (!isValid) {
    return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const eventId = nowPaymentsEventId(payload);
  if (!eventId) {
    return Response.json({ ok: false, error: "missing_event_id" }, { status: 400 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
  const insertResult = await insertWebhookEvent(adminClient, payload, eventId);

  if (insertResult.duplicate) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (insertResult.error) {
    return Response.json({ ok: false, error: "event_record_failed" }, { status: 500 });
  }

  const target = await findPaymentTarget(adminClient, payload);
  if (!target) {
    await markWebhookEventProcessed(
      adminClient,
      eventId,
      false,
      "No matching pending payment target.",
    );
    return Response.json({ ok: true, ignored: true });
  }

  if (target.status === "paid") {
    await markWebhookEventProcessed(adminClient, eventId, true);
    return Response.json({ ok: true, alreadyPaid: true });
  }

  if (isNowPaymentsPaidStatus(payload.payment_status)) {
    if (!validateNowPaymentsAmount(target, payload)) {
      await markWebhookEventProcessed(
        adminClient,
        eventId,
        false,
        "Payment amount or currency mismatch.",
      );
      return Response.json({ ok: true, ignored: true });
    }

    await applyPaidTarget(adminClient, target, {
      providerLabel: "NOWPayments",
      providerReference: String(
        payload.payment_id ?? payload.invoice_id ?? payload.order_id ?? "unknown",
      ),
    });
    await markWebhookEventProcessed(adminClient, eventId, true);
    return Response.json({ ok: true });
  }

  if (isNowPaymentsTerminalFailure(payload.payment_status)) {
    await applyFailedTarget(adminClient, target, {
      providerLabel: "NOWPayments",
      rawStatus: payload.payment_status ?? "unknown",
      status: payload.payment_status === "expired" ? "expired" : "cancelled",
    });
    await markWebhookEventProcessed(adminClient, eventId, true);
    return Response.json({ ok: true });
  }

  await markWebhookEventProcessed(adminClient, eventId, true);
  return Response.json({ ok: true, pending: true });
}
