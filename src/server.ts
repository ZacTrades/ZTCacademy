import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

declare global {
  // Cloudflare passes runtime secrets through the fetch env argument. Server functions
  // read this object so non-VITE secrets do not need to be exposed to the client.
  var __ZACTRADES_SERVER_ENV__: Record<string, string | undefined> | undefined;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(request?: Request): Response {
  return withSecurityHeaders(
    new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    request,
  );
}

function isLocalDevelopmentRequest(request?: Request): boolean {
  if (!request) return false;

  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function withSecurityHeaders(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  const isLocalDevelopment = isLocalDevelopmentRequest(request);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (!isLocalDevelopment) {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  }
  headers.set(
    "content-security-policy",
    isLocalDevelopment
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:* https://s3.tradingview.com https://www.tradingview.com https://*.tradingview.com https://*.tradingview-widget.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: http://localhost:* http://127.0.0.1:* https://*.supabase.co https://cdn.discordapp.com https://*.ytimg.com https: https://*.tradingview.com https://www.tradingview.com https://*.tradingview-widget.com",
          "media-src 'self' blob: data: http://localhost:* http://127.0.0.1:* https://*.supabase.co",
          "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://*.supabase.co wss://*.supabase.co https://api.nowpayments.io https://discord.com https://*.tradingview.com https://*.tradingview-widget.com wss://*.tradingview.com wss://*.tradingview-widget.com",
          "frame-src 'self' http://localhost:* http://127.0.0.1:* https://*.tradingview.com https://www.tradingview.com https://*.tradingview-widget.com https://www.youtube.com https://www.youtube-nocookie.com https://*.supabase.co blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
        ].join("; ")
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com https://*.tradingview-widget.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.supabase.co https://cdn.discordapp.com https://*.ytimg.com https: https://*.tradingview.com https://*.tradingview-widget.com",
          "media-src 'self' blob: data: https://*.supabase.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.nowpayments.io https://discord.com https://*.tradingview.com https://*.tradingview-widget.com wss://*.tradingview.com wss://*.tradingview-widget.com",
          "frame-src 'self' https://*.tradingview.com https://*.tradingview-widget.com https://www.youtube.com https://www.youtube-nocookie.com https://*.supabase.co blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests",
        ].join("; "),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      globalThis.__ZACTRADES_SERVER_ENV__ =
        env && typeof env === "object" ? (env as Record<string, string | undefined>) : undefined;

      const url = new URL(request.url);

      if (url.pathname === "/api/discord/expire") {
        const { handleDiscordExpiryRequest } = await import("./lib/discord-server");
        return handleDiscordExpiryRequest(
          request,
          env && typeof env === "object" ? (env as Record<string, string | undefined>) : {},
        );
      }

      if (url.pathname === "/api/discord/reconcile-roles") {
        const { handleDiscordRoleReconcileRequest } = await import("./lib/discord-server");
        return handleDiscordRoleReconcileRequest(
          request,
          env && typeof env === "object" ? (env as Record<string, string | undefined>) : {},
        );
      }

      if (url.pathname === "/api/nowpayments/ipn") {
        const { handleNowPaymentsIpnRequest } = await import("./lib/payment-server");
        return handleNowPaymentsIpnRequest(
          request,
          env && typeof env === "object" ? (env as Record<string, string | undefined>) : {},
        );
      }

      if (url.pathname === "/api/payzone/launch") {
        const { handlePayzoneLaunchRequest } = await import("./lib/payment-server");
        return handlePayzoneLaunchRequest(
          request,
          env && typeof env === "object" ? (env as Record<string, string | undefined>) : {},
        );
      }

      if (url.pathname === "/api/payzone/theme.css") {
        const { handlePayzoneThemeCssRequest } = await import("./lib/payment-server");
        return handlePayzoneThemeCssRequest(request);
      }

      if (url.pathname === "/api/payzone/callback") {
        const { handlePayzoneCallbackRequest } = await import("./lib/payment-server");
        return handlePayzoneCallbackRequest(
          request,
          env && typeof env === "object" ? (env as Record<string, string | undefined>) : {},
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), request);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse(request);
    }
  },
};
