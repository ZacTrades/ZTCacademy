import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { provisionDiscordAccess } from "@/lib/discord-server";

const paymentMethodSchema = z.enum(["card", "crypto"]);
const safeNameSchema = z.string().trim().min(1).max(120);
const safeEmailSchema = z.string().trim().email().max(254);

const liveTradingCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  packageSlug: z.enum(["one_month", "three_months", "six_months", "twelve_months"]),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
});

const mentorshipCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  planSlug: z.enum(["one_to_one", "group"]),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
});

const newsSubscriptionCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  customerEmail: safeEmailSchema,
  cardholderName: safeNameSchema,
  paymentMethod: paymentMethodSchema,
  cryptoAsset: z.string().trim().max(20).optional(),
  cryptoNetwork: z.string().trim().max(40).optional(),
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

type PaymentProduct = {
  kind: CheckoutKind;
  name: string;
  slug: string | null;
  durationLabel: string;
  amountLabel: string;
  amount: number;
  metadata: Record<string, string | null>;
};

type AdminClient = ReturnType<typeof createAdminClient>;

type PaymentTarget =
  | {
      kind: "live";
      table: "user_live_trading_access";
      userId: string;
      packageSlug: string | null;
      amountLabel: string | null;
      status: string;
    }
  | {
      kind: "mentorship";
      table: "user_memberships";
      userId: string;
      planSlug: "one_to_one" | "group";
      amountLabel: string | null;
      status: string;
    }
  | {
      kind: "news";
      table: "user_news_subscriptions";
      userId: string;
      amountLabel: string | null;
      status: string;
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
  const gatewayApiUrl = readServerEnv("PAYMENT_GATEWAY_API_URL");
  const gatewaySecretKey = readServerEnv("PAYMENT_GATEWAY_SECRET_KEY");
  const hasExternalGateway = Boolean(gatewayApiUrl && gatewaySecretKey);

  if (paymentMethod === "crypto" && nowPaymentsApiKey) {
    return { provider: "nowpayments" as const, nowPaymentsApiKey };
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
}) {
  const now = new Date().toISOString();
  const notes = `Checkout started at ${now}. ${paymentNote(data.paymentMethod, data.provider)}`;

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
        provider_subscription_id: null,
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
        provider_subscription_id: null,
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
      provider_subscription_id: null,
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
    notes: "NOWPayments invoice created. Awaiting verified IPN confirmation.",
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

  const checkoutId = createCheckoutReference();
  const { error: pendingError } = await createPendingRecord({
    adminClient: data.adminClient,
    userId: data.userId,
    product: data.product,
    provider: configuredProvider.provider,
    checkoutId,
    customerEmail: data.customerEmail,
    paymentMethod: data.paymentMethod,
  });

  if (pendingError) {
    return {
      ok: false as const,
      status: "pending_status_failed",
      message: "Unable to prepare checkout. Please contact support.",
    };
  }

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
    notes: "Hosted checkout created. Awaiting verified provider webhook confirmation.",
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

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product,
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

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product,
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

    return startHostedCheckout({
      adminClient: context.adminClient,
      userId: context.user.id,
      customerEmail: context.user.email ?? data.customerEmail,
      cardholderName: data.cardholderName,
      paymentMethod: data.paymentMethod,
      product: NEWS_SUBSCRIPTION_PRODUCT,
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
) {
  await adminClient
    .from("payment_webhook_events")
    .update({
      processed,
      error_message: errorMessage ? errorMessage.slice(0, 500) : null,
      processed_at: new Date().toISOString(),
    })
    .eq("provider", "nowpayments")
    .eq("event_id", eventId);
}

async function maybeSingleTarget<T extends Record<string, unknown>>(
  query: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>,
) {
  const { data, error } = await query;
  if (error || !data) return null;
  return data;
}

async function findPaymentTarget(adminClient: AdminClient, payload: NowPaymentsIpnPayload) {
  const orderId = payload.order_id;
  const invoiceId = payload.invoice_id ? String(payload.invoice_id) : null;
  const candidateValues = [orderId, invoiceId].filter((value): value is string => Boolean(value));

  for (const value of candidateValues) {
    const live = await maybeSingleTarget(
      adminClient
        .from("user_live_trading_access")
        .select("user_id,package_slug,status,amount_label")
        .eq("payment_provider", "nowpayments")
        .eq("provider_checkout_id", value)
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
      } satisfies PaymentTarget;
    }

    const membership = await maybeSingleTarget(
      adminClient
        .from("user_memberships")
        .select("user_id,plan_slug,status,amount_label")
        .eq("payment_provider", "nowpayments")
        .eq("provider_checkout_id", value)
        .maybeSingle(),
    );
    if (membership) {
      return {
        kind: "mentorship" as const,
        table: "user_memberships" as const,
        userId: String(membership.user_id),
        planSlug: membership.plan_slug === "one_to_one" ? "one_to_one" : "group",
        amountLabel: membership.amount_label ? String(membership.amount_label) : null,
        status: String(membership.status),
      } satisfies PaymentTarget;
    }

    const news = await maybeSingleTarget(
      adminClient
        .from("user_news_subscriptions")
        .select("user_id,status,amount_label")
        .eq("payment_provider", "nowpayments")
        .eq("provider_checkout_id", value)
        .maybeSingle(),
    );
    if (news) {
      return {
        kind: "news" as const,
        table: "user_news_subscriptions" as const,
        userId: String(news.user_id),
        amountLabel: news.amount_label ? String(news.amount_label) : null,
        status: String(news.status),
      } satisfies PaymentTarget;
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
  payload: NowPaymentsIpnPayload,
) {
  const now = new Date().toISOString();
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
    notes: `NOWPayments payment confirmed by verified IPN. Payment ID: ${payload.payment_id ?? "unknown"}.`,
  };

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
  payload: NowPaymentsIpnPayload,
) {
  const failedStatus = payload.payment_status === "expired" ? "expired" : "cancelled";
  const patch = {
    status: failedStatus,
    notes: `NOWPayments payment ended with status ${payload.payment_status ?? "unknown"}.`,
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

    await applyPaidTarget(adminClient, target, payload);
    await markWebhookEventProcessed(adminClient, eventId, true);
    return Response.json({ ok: true });
  }

  if (isNowPaymentsTerminalFailure(payload.payment_status)) {
    await applyFailedTarget(adminClient, target, payload);
    await markWebhookEventProcessed(adminClient, eventId, true);
    return Response.json({ ok: true });
  }

  await markWebhookEventProcessed(adminClient, eventId, true);
  return Response.json({ ok: true, pending: true });
}
