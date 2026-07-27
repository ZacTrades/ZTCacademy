import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { provisionDiscordAccess } from "@/lib/discord-server";

const liveTradingCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  packageSlug: z.enum(["one_month", "three_months", "six_months", "twelve_months"]),
  packageDuration: z.string().min(1),
  amountLabel: z.string().min(1),
  customerEmail: z.string().email(),
  cardholderName: z.string().min(1),
  paymentMethod: z.enum(["card", "crypto"]),
  paymentReference: z.string().min(1),
  cryptoAsset: z.string().optional(),
  cryptoNetwork: z.string().optional(),
});

const mentorshipCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  planSlug: z.enum(["one_to_one", "group"]),
  planName: z.string().min(1),
  packageDuration: z.string().min(1),
  amountLabel: z.string().min(1),
  customerEmail: z.string().email(),
  cardholderName: z.string().min(1),
  paymentMethod: z.enum(["card", "crypto"]),
  paymentReference: z.string().min(1),
  cryptoAsset: z.string().optional(),
  cryptoNetwork: z.string().optional(),
});

const newsSubscriptionCheckoutSchema = z.object({
  accessToken: z.string().min(1),
  amountLabel: z.string().min(1),
  customerEmail: z.string().email(),
  cardholderName: z.string().min(1),
  paymentMethod: z.enum(["card", "crypto"]),
  paymentReference: z.string().min(1),
  cryptoAsset: z.string().optional(),
  cryptoNetwork: z.string().optional(),
});

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

function readServerEnv(name: string) {
  const runtimeValue = (
    globalThis as typeof globalThis & {
      __ZACTRADES_SERVER_ENV__?: Record<string, string | undefined>;
    }
  ).__ZACTRADES_SERVER_ENV__?.[name];
  const viteValue = (import.meta.env as Record<string, string | undefined>)[name];
  const processEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;

  return runtimeValue ?? viteValue ?? processEnv?.[name];
}

function createCheckoutReference() {
  return `ztc_${crypto.randomUUID()}`;
}

function parseAmountLabel(amountLabel: string) {
  const amount = Number(amountLabel.replace(/[^0-9.]/g, ""));

  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : null;
}

function optionalUrlEnv(name: string) {
  const value = readServerEnv(name);

  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

async function createNowPaymentsInvoice(data: {
  apiKey: string;
  orderId: string;
  amountLabel: string;
  customerEmail: string;
  description: string;
}) {
  const priceAmount = parseAmountLabel(data.amountLabel);

  if (!priceAmount) {
    return {
      ok: false as const,
      status: "nowpayments_invalid_amount",
      message: "Unable to convert amount " + data.amountLabel + " for NOWPayments checkout.",
    };
  }

  const invoiceResponse = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": data.apiKey,
    },
    body: JSON.stringify({
      price_amount: priceAmount,
      price_currency: "usd",
      order_id: data.orderId,
      order_description: data.description,
      ipn_callback_url: optionalUrlEnv("NOWPAYMENTS_IPN_CALLBACK_URL"),
      success_url: optionalUrlEnv("NOWPAYMENTS_SUCCESS_URL"),
      cancel_url: optionalUrlEnv("NOWPAYMENTS_CANCEL_URL"),
    }),
  });

  if (!invoiceResponse.ok) {
    const message = await invoiceResponse.text();

    return {
      ok: false as const,
      status: "nowpayments_rejected",
      message: message || "NOWPayments returned " + invoiceResponse.status + ".",
    };
  }

  const invoiceData = (await invoiceResponse.json()) as NowPaymentsInvoiceResponse;
  const checkoutUrl = invoiceData.invoice_url;
  const providerCheckoutId = String(invoiceData.id ?? invoiceData.invoice_id ?? data.orderId);

  if (!checkoutUrl) {
    return {
      ok: false as const,
      status: "nowpayments_missing_invoice_url",
      message: "NOWPayments did not return an invoice URL.",
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

function paymentNote(data: {
  paymentMethod: "card" | "crypto";
  paymentReference: string;
  cryptoAsset?: string;
  cryptoNetwork?: string;
}) {
  if (data.paymentMethod === "crypto") {
    const route = [data.cryptoAsset, data.cryptoNetwork].filter(Boolean).join(" ");
    return `Payment method crypto${route ? ` (${route})` : ""}. Reference ${data.paymentReference}.`;
  }

  return `Payment method card. Card ending ${data.paymentReference}.`;
}

function isActivePaidAccess(access: { status: string; access_expires_at: string | null }) {
  if (access.status !== "paid") return false;
  if (!access.access_expires_at) return true;

  const expiresAt = new Date(access.access_expires_at);

  return Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();
}

export const startLiveTradingCheckout = createServerFn({ method: "POST" })
  .inputValidator(liveTradingCheckoutSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
    const supabaseAnonKey = readServerEnv("VITE_SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
    const gatewayApiUrl = readServerEnv("PAYMENT_GATEWAY_API_URL");
    const gatewaySecretKey = readServerEnv("PAYMENT_GATEWAY_SECRET_KEY");
    const nowPaymentsApiKey = readServerEnv("NOWPAYMENTS_API_KEY");
    const usesNowPayments = data.paymentMethod === "crypto" && Boolean(nowPaymentsApiKey);
    const hasExternalGateway = Boolean(gatewayApiUrl && gatewaySecretKey);
    const gatewayProvider = usesNowPayments
      ? "nowpayments"
      : readServerEnv("PAYMENT_GATEWAY_PROVIDER") ?? "external_gateway";

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        ok: false,
        status: "backend_not_configured",
        message: "Backend payment status is not configured. Add Supabase env vars on the server.",
      };
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(data.accessToken);

    if (userError || !userData.user) {
      return {
        ok: false,
        status: "auth_required",
        message: "Please sign in again before starting checkout.",
      };
    }

    const userId = userData.user.id;

    if (!supabaseServiceRoleKey || (!usesNowPayments && !hasExternalGateway)) {
      const { error: localPaymentError } = await authClient.rpc(
        "confirm_local_live_trading_payment",
        {
          p_package_slug: data.packageSlug,
          p_duration_label: data.packageDuration,
          p_amount_label: data.amountLabel,
          p_card_last4: paymentNote(data),
        },
      );

      if (localPaymentError) {
        return {
          ok: false,
          status: "local_payment_failed",
          message:
            localPaymentError.message ||
            "Unable to save live trading access. Run the confirm_local_live_trading_payment SQL function in Supabase.",
        };
      }

      let discordMessage = "";

      if (supabaseServiceRoleKey) {
        const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);
        const discordResult = await provisionDiscordAccess(adminClient, userId, {
          kind: "live",
        });

        discordMessage = discordResult.ok
          ? " Discord live trading role was assigned."
          : ` Discord sync pending: ${discordResult.message}`;
      }

      return {
        ok: true,
        status: "local_paid",
        message: `Temporary local checkout confirmed. Live trading access was saved as paid.${discordMessage}`,
      };
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: existingAccess, error: existingError } = await adminClient
      .from("user_live_trading_access")
      .select("status,access_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      return {
        ok: false,
        status: "live_access_lookup_failed",
        message: existingError.message,
      };
    }

    if (existingAccess && isActivePaidAccess(existingAccess)) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your live trading access is already active.",
      };
    }

    const localCheckoutId = createCheckoutReference();
    const checkoutStartedAt = new Date().toISOString();

    const { error: pendingError } = await adminClient.from("user_live_trading_access").upsert(
      {
        user_id: userId,
        package_slug: data.packageSlug,
        duration_label: data.packageDuration,
        status: "pending",
        payment_provider: gatewayProvider,
        provider_checkout_id: localCheckoutId,
        amount_label: data.amountLabel,
        paid_at: null,
        notes: `Live trading checkout started for ${data.packageDuration} at ${checkoutStartedAt}. ${paymentNote(data)}`,
      },
      { onConflict: "user_id" },
    );

    if (pendingError) {
      return {
        ok: false,
        status: "pending_status_failed",
        message: pendingError.message,
      };
    }

    if (usesNowPayments && nowPaymentsApiKey) {
      const invoiceResult = await createNowPaymentsInvoice({
        apiKey: nowPaymentsApiKey,
        orderId: localCheckoutId,
        amountLabel: data.amountLabel,
        customerEmail: data.customerEmail,
        description: "ZacTrades Live Trading Room - " + data.packageDuration,
      });

      if (!invoiceResult.ok) {
        return invoiceResult;
      }

      await adminClient
        .from("user_live_trading_access")
        .update({
          provider_checkout_id: invoiceResult.providerCheckoutId,
          provider_customer_id: data.customerEmail,
          notes: "NOWPayments invoice created. " + paymentNote(data),
        })
        .eq("user_id", userId);

      return {
        ok: true,
        status: "redirect_required",
        checkoutUrl: invoiceResult.checkoutUrl,
        providerCheckoutId: invoiceResult.providerCheckoutId,
        message: "NOWPayments invoice created. Complete payment in the secure crypto checkout tab.",
      };
    }

    const gatewayResponse = await fetch(gatewayApiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${gatewaySecretKey}`,
      },
      body: JSON.stringify({
        reference: localCheckoutId,
        customer: {
          email: data.customerEmail,
          name: data.cardholderName,
          user_id: userId,
        },
        product: {
          type: "live_trading",
          package_slug: data.packageSlug,
          name: "ZacTrades Live Trading Room",
          duration: data.packageDuration,
          amount_label: data.amountLabel,
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
        metadata: {
          source: "zactrades_checkout",
          user_id: userId,
          product: "live_trading",
          package_slug: data.packageSlug,
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
      }),
    });

    if (!gatewayResponse.ok) {
      const message = await gatewayResponse.text();
      return {
        ok: false,
        status: "gateway_rejected",
        message: message || `Payment gateway returned ${gatewayResponse.status}.`,
      };
    }

    const gatewayData = (await gatewayResponse.json()) as GatewayCheckoutResponse;
    const checkoutUrl = gatewayData.checkoutUrl ?? gatewayData.checkout_url ?? gatewayData.url;
    const providerCheckoutId =
      gatewayData.checkoutId ?? gatewayData.checkout_id ?? gatewayData.id ?? localCheckoutId;
    const providerCustomerId = gatewayData.customerId ?? gatewayData.customer_id ?? null;

    if (!checkoutUrl) {
      return {
        ok: false,
        status: "gateway_missing_checkout_url",
        message: "Payment gateway did not return a checkout URL.",
      };
    }

    await adminClient
      .from("user_live_trading_access")
      .update({
        provider_checkout_id: providerCheckoutId,
        provider_customer_id: providerCustomerId,
        notes: `Checkout URL created for ZacTrades Live Trading Room (${data.packageDuration}). ${paymentNote(data)}`,
      })
      .eq("user_id", userId);

    return {
      ok: true,
      status: "redirect_required",
      checkoutUrl,
      providerCheckoutId,
      message: "Checkout created. Complete payment in the secure gateway tab.",
    };
  });

export const startMentorshipCheckout = createServerFn({ method: "POST" })
  .inputValidator(mentorshipCheckoutSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
    const supabaseAnonKey = readServerEnv("VITE_SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
    const gatewayApiUrl = readServerEnv("PAYMENT_GATEWAY_API_URL");
    const gatewaySecretKey = readServerEnv("PAYMENT_GATEWAY_SECRET_KEY");
    const nowPaymentsApiKey = readServerEnv("NOWPAYMENTS_API_KEY");
    const usesNowPayments = data.paymentMethod === "crypto" && Boolean(nowPaymentsApiKey);
    const hasExternalGateway = Boolean(gatewayApiUrl && gatewaySecretKey);
    const gatewayProvider = usesNowPayments
      ? "nowpayments"
      : readServerEnv("PAYMENT_GATEWAY_PROVIDER") ?? "external_gateway";

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        ok: false,
        status: "backend_not_configured",
        message: "Backend payment status is not configured. Add Supabase env vars on the server.",
      };
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(data.accessToken);

    if (userError || !userData.user) {
      return {
        ok: false,
        status: "auth_required",
        message: "Please sign in again before starting checkout.",
      };
    }

    const userId = userData.user.id;

    if (!supabaseServiceRoleKey || (!usesNowPayments && !hasExternalGateway)) {
      const { error: localPaymentError } = await authClient.rpc(
        "confirm_local_mentorship_payment",
        {
          p_plan_slug: data.planSlug,
          p_amount_label: data.amountLabel,
          p_card_last4: paymentNote(data),
        },
      );

      if (localPaymentError) {
        return {
          ok: false,
          status: "local_payment_failed",
          message:
            localPaymentError.message ||
            "Unable to save paid status. Run the confirm_local_mentorship_payment SQL function in Supabase.",
        };
      }

      let discordMessage = "";

      if (supabaseServiceRoleKey) {
        const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);
        const discordResult = await provisionDiscordAccess(adminClient, userId, {
          kind: "mentorship",
          planSlug: data.planSlug,
        });

        discordMessage = discordResult.ok
          ? " Discord access was assigned."
          : ` Discord sync pending: ${discordResult.message}`;
      }

      return {
        ok: true,
        status: "local_paid",
        message: `Temporary local checkout confirmed. Mentorship status was saved as paid in admin user management.${discordMessage}`,
      };
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: existingMembership, error: existingError } = await adminClient
      .from("user_memberships")
      .select("status,access_expires_at")
      .eq("user_id", userId)
      .eq("plan_slug", data.planSlug)
      .maybeSingle();

    if (existingError) {
      return {
        ok: false,
        status: "membership_lookup_failed",
        message: existingError.message,
      };
    }

    const expiresAt =
      typeof existingMembership?.access_expires_at === "string"
        ? new Date(existingMembership.access_expires_at)
        : null;

    if (
      existingMembership?.status === "paid" &&
      (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date())
    ) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your mentorship access is already active.",
      };
    }

    const localCheckoutId = createCheckoutReference();
    const checkoutStartedAt = new Date().toISOString();

    const { error: pendingError } = await adminClient.from("user_memberships").upsert(
      {
        user_id: userId,
        plan_slug: data.planSlug,
        status: "pending",
        payment_provider: gatewayProvider,
        provider_checkout_id: localCheckoutId,
        amount_label: data.amountLabel,
        paid_at: null,
        notes: `Checkout started for ${data.planName} (${data.packageDuration}) at ${checkoutStartedAt}. ${paymentNote(data)}`,
      },
      { onConflict: "user_id,plan_slug" },
    );

    if (pendingError) {
      return {
        ok: false,
        status: "pending_status_failed",
        message: pendingError.message,
      };
    }

    if (usesNowPayments && nowPaymentsApiKey) {
      const invoiceResult = await createNowPaymentsInvoice({
        apiKey: nowPaymentsApiKey,
        orderId: localCheckoutId,
        amountLabel: data.amountLabel,
        customerEmail: data.customerEmail,
        description: data.planName + " - " + data.packageDuration,
      });

      if (!invoiceResult.ok) {
        return invoiceResult;
      }

      await adminClient
        .from("user_memberships")
        .update({
          provider_checkout_id: invoiceResult.providerCheckoutId,
          provider_customer_id: data.customerEmail,
          notes: "NOWPayments invoice created. " + paymentNote(data),
        })
        .eq("user_id", userId)
        .eq("plan_slug", data.planSlug);

      return {
        ok: true,
        status: "redirect_required",
        checkoutUrl: invoiceResult.checkoutUrl,
        providerCheckoutId: invoiceResult.providerCheckoutId,
        message: "NOWPayments invoice created. Complete payment in the secure crypto checkout tab.",
      };
    }

    const gatewayResponse = await fetch(gatewayApiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${gatewaySecretKey}`,
      },
      body: JSON.stringify({
        reference: localCheckoutId,
        customer: {
          email: data.customerEmail,
          name: data.cardholderName,
          user_id: userId,
        },
        product: {
          type: "mentorship",
          plan_slug: data.planSlug,
          name: data.planName,
          duration: data.packageDuration,
          amount_label: data.amountLabel,
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
        metadata: {
          source: "zactrades_checkout",
          user_id: userId,
          plan_slug: data.planSlug,
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
      }),
    });

    if (!gatewayResponse.ok) {
      const message = await gatewayResponse.text();
      return {
        ok: false,
        status: "gateway_rejected",
        message: message || `Payment gateway returned ${gatewayResponse.status}.`,
      };
    }

    const gatewayData = (await gatewayResponse.json()) as GatewayCheckoutResponse;
    const checkoutUrl = gatewayData.checkoutUrl ?? gatewayData.checkout_url ?? gatewayData.url;
    const providerCheckoutId =
      gatewayData.checkoutId ?? gatewayData.checkout_id ?? gatewayData.id ?? localCheckoutId;
    const providerCustomerId = gatewayData.customerId ?? gatewayData.customer_id ?? null;

    if (!checkoutUrl) {
      return {
        ok: false,
        status: "gateway_missing_checkout_url",
        message: "Payment gateway did not return a checkout URL.",
      };
    }

    await adminClient
      .from("user_memberships")
      .update({
        provider_checkout_id: providerCheckoutId,
        provider_customer_id: providerCustomerId,
        notes: `Checkout URL created for ${data.planName} (${data.packageDuration}). ${paymentNote(data)}`,
      })
      .eq("user_id", userId)
      .eq("plan_slug", data.planSlug);

    return {
      ok: true,
      status: "redirect_required",
      checkoutUrl,
      providerCheckoutId,
      message: "Checkout created. Complete payment in the secure gateway tab.",
    };
  });

export const startNewsSubscriptionCheckout = createServerFn({ method: "POST" })
  .inputValidator(newsSubscriptionCheckoutSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
    const supabaseAnonKey = readServerEnv("VITE_SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
    const gatewayApiUrl = readServerEnv("PAYMENT_GATEWAY_API_URL");
    const gatewaySecretKey = readServerEnv("PAYMENT_GATEWAY_SECRET_KEY");
    const nowPaymentsApiKey = readServerEnv("NOWPAYMENTS_API_KEY");
    const usesNowPayments = data.paymentMethod === "crypto" && Boolean(nowPaymentsApiKey);
    const hasExternalGateway = Boolean(gatewayApiUrl && gatewaySecretKey);
    const gatewayProvider = usesNowPayments
      ? "nowpayments"
      : readServerEnv("PAYMENT_GATEWAY_PROVIDER") ?? "external_gateway";

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        ok: false,
        status: "backend_not_configured",
        message: "Backend payment status is not configured. Add Supabase env vars on the server.",
      };
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(data.accessToken);

    if (userError || !userData.user) {
      return {
        ok: false,
        status: "auth_required",
        message: "Please sign in again before starting checkout.",
      };
    }

    const userId = userData.user.id;

    if (!supabaseServiceRoleKey || (!usesNowPayments && !hasExternalGateway)) {
      const { error: localPaymentError } = await authClient.rpc("confirm_local_news_subscription", {
        p_amount_label: data.amountLabel,
        p_card_last4: paymentNote(data),
      });

      if (localPaymentError) {
        return {
          ok: false,
          status: "local_payment_failed",
          message:
            localPaymentError.message ||
            "Unable to save news subscription. Run the confirm_local_news_subscription SQL function in Supabase.",
        };
      }

      let discordMessage = "";

      if (supabaseServiceRoleKey) {
        const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);
        const discordResult = await provisionDiscordAccess(adminClient, userId, { kind: "news" });

        discordMessage = discordResult.ok
          ? " Discord news role was assigned."
          : ` Discord sync pending: ${discordResult.message}`;
      }

      return {
        ok: true,
        status: "local_paid",
        message: `Temporary local checkout confirmed. News access was saved as paid.${discordMessage}`,
      };
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: existingSubscription, error: existingError } = await adminClient
      .from("user_news_subscriptions")
      .select("status,access_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      return {
        ok: false,
        status: "subscription_lookup_failed",
        message: existingError.message,
      };
    }

    const expiresAt =
      typeof existingSubscription?.access_expires_at === "string"
        ? new Date(existingSubscription.access_expires_at)
        : null;

    if (
      existingSubscription?.status === "paid" &&
      (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date())
    ) {
      return {
        ok: true,
        status: "already_paid",
        message: "Your news subscription is already active.",
      };
    }

    const localCheckoutId = createCheckoutReference();
    const checkoutStartedAt = new Date().toISOString();

    const { error: pendingError } = await adminClient.from("user_news_subscriptions").upsert(
      {
        user_id: userId,
        status: "pending",
        payment_provider: gatewayProvider,
        provider_checkout_id: localCheckoutId,
        amount_label: data.amountLabel,
        paid_at: null,
        notes: `News subscription checkout started at ${checkoutStartedAt}. ${paymentNote(data)}`,
      },
      { onConflict: "user_id" },
    );

    if (pendingError) {
      return {
        ok: false,
        status: "pending_status_failed",
        message: pendingError.message,
      };
    }

    if (usesNowPayments && nowPaymentsApiKey) {
      const invoiceResult = await createNowPaymentsInvoice({
        apiKey: nowPaymentsApiKey,
        orderId: localCheckoutId,
        amountLabel: data.amountLabel,
        customerEmail: data.customerEmail,
        description: "ZacTrades News Desk",
      });

      if (!invoiceResult.ok) {
        return invoiceResult;
      }

      await adminClient
        .from("user_news_subscriptions")
        .update({
          provider_checkout_id: invoiceResult.providerCheckoutId,
          provider_customer_id: data.customerEmail,
          notes: "NOWPayments invoice created. " + paymentNote(data),
        })
        .eq("user_id", userId);

      return {
        ok: true,
        status: "redirect_required",
        checkoutUrl: invoiceResult.checkoutUrl,
        providerCheckoutId: invoiceResult.providerCheckoutId,
        message: "NOWPayments invoice created. Complete payment in the secure crypto checkout tab.",
      };
    }

    const gatewayResponse = await fetch(gatewayApiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${gatewaySecretKey}`,
      },
      body: JSON.stringify({
        reference: localCheckoutId,
        customer: {
          email: data.customerEmail,
          name: data.cardholderName,
          user_id: userId,
        },
        product: {
          type: "news_subscription",
          name: "ZacTrades News Desk",
          duration: "Monthly",
          amount_label: data.amountLabel,
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
        metadata: {
          source: "zactrades_checkout",
          user_id: userId,
          product: "news_subscription",
          payment_method: data.paymentMethod,
          crypto_asset: data.cryptoAsset,
          crypto_network: data.cryptoNetwork,
        },
      }),
    });

    if (!gatewayResponse.ok) {
      const message = await gatewayResponse.text();
      return {
        ok: false,
        status: "gateway_rejected",
        message: message || `Payment gateway returned ${gatewayResponse.status}.`,
      };
    }

    const gatewayData = (await gatewayResponse.json()) as GatewayCheckoutResponse;
    const checkoutUrl = gatewayData.checkoutUrl ?? gatewayData.checkout_url ?? gatewayData.url;
    const providerCheckoutId =
      gatewayData.checkoutId ?? gatewayData.checkout_id ?? gatewayData.id ?? localCheckoutId;
    const providerCustomerId = gatewayData.customerId ?? gatewayData.customer_id ?? null;

    if (!checkoutUrl) {
      return {
        ok: false,
        status: "gateway_missing_checkout_url",
        message: "Payment gateway did not return a checkout URL.",
      };
    }

    await adminClient
      .from("user_news_subscriptions")
      .update({
        provider_checkout_id: providerCheckoutId,
        provider_customer_id: providerCustomerId,
        notes: `Checkout URL created for ZacTrades News Desk. ${paymentNote(data)}`,
      })
      .eq("user_id", userId);

    return {
      ok: true,
      status: "redirect_required",
      checkoutUrl,
      providerCheckoutId,
      message: "Checkout created. Complete payment in the secure gateway tab.",
    };
  });
