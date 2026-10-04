import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const discordStartSchema = z.object({
  accessToken: z.string().min(1),
  origin: z.string().url(),
});

const discordCallbackSchema = z.object({
  accessToken: z.string().min(1),
  code: z.string().min(1),
  state: z.string().min(1),
});

const discordSyncSchema = z.object({
  accessToken: z.string().min(1),
});

type DiscordTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

type ProvisionDiscordOptions =
  | { kind: "mentorship"; planSlug: "one_to_one" | "group" }
  | { kind: "live" }
  | { kind: "news" };

type ExistingPaidMembershipRow = {
  plan_slug: string | null;
  status: string;
  access_expires_at: string | null;
};

type ExistingNewsSubscriptionRow = {
  status: string;
  access_expires_at: string | null;
};

type ExistingLiveTradingAccessRow = {
  status: string;
  access_expires_at: string | null;
};

type ExpiredMentorshipRow = {
  user_id: string;
  plan_slug: string | null;
};

type ExpiredAccessRow = {
  user_id: string;
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

  if (name.startsWith("VITE_")) {
    return (import.meta.env as Record<string, string | undefined>)[name];
  }

  return undefined;
}

function normalizeMentorshipPlanSlug(value: unknown): "one_to_one" | "group" | null {
  if (value === "one_to_one" || value === "group") return value;
  return null;
}

function discordAllowPendingAccess() {
  return readServerEnv("DISCORD_ALLOW_PENDING_ACCESS") === "true";
}

function discordEligibleStatuses() {
  return discordAllowPendingAccess() ? ["paid", "pending"] : ["paid"];
}

function getDiscordRedirectUri(origin: string) {
  return readServerEnv("DISCORD_REDIRECT_URI") ?? `${origin.replace(/\/$/, "")}/discord/callback`;
}

function discordAvatarUrl(user: DiscordUserResponse) {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

function discordDisplayName(user: DiscordUserResponse) {
  return user.global_name || user.username;
}

function isDiscordAlreadyConnectedError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";

  return (
    error.code === "23505" &&
    (message.includes("discord_connections_discord_user_id_key") ||
      message.includes("discord_user_id"))
  );
}

async function getAuthenticatedUser(accessToken: string) {
  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = readServerEnv("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: "Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      userId: null,
    };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
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

  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return { error: "Please sign in again before connecting Discord.", userId: null };
  }

  return { error: null, userId: data.user.id };
}

function getAdminClient() {
  const supabaseUrl = readServerEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const startDiscordConnection = createServerFn({ method: "POST" })
  .inputValidator(discordStartSchema)
  .handler(async ({ data }) => {
    const clientId = readServerEnv("DISCORD_CLIENT_ID");
    const adminClient = getAdminClient();

    if (!clientId || !adminClient) {
      const missing = [
        !clientId ? "DISCORD_CLIENT_ID" : null,
        !readServerEnv("VITE_SUPABASE_URL") ? "VITE_SUPABASE_URL" : null,
        !readServerEnv("SUPABASE_SERVICE_ROLE_KEY") ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean);

      return {
        ok: false,
        status: "discord_not_configured",
        message: `Discord connection is not configured yet. Missing: ${missing.join(", ")}. Restart the dev server after editing .env.local.`,
      };
    }

    const auth = await getAuthenticatedUser(data.accessToken);

    if (auth.error || !auth.userId) {
      return { ok: false, status: "auth_required", message: auth.error };
    }

    const state = crypto.randomUUID();
    const redirectUri = getDiscordRedirectUri(data.origin);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await adminClient.from("discord_oauth_states").insert({
      state,
      user_id: auth.userId,
      redirect_uri: redirectUri,
      expires_at: expiresAt,
    });

    if (error) {
      return {
        ok: false,
        status: "state_save_failed",
        message: error.message,
      };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds.join",
      state,
      prompt: "consent",
    });

    return {
      ok: true,
      status: "redirect_required",
      url: `https://discord.com/oauth2/authorize?${params.toString()}`,
    };
  });

export const completeDiscordConnection = createServerFn({ method: "POST" })
  .inputValidator(discordCallbackSchema)
  .handler(async ({ data }) => {
    const clientId = readServerEnv("DISCORD_CLIENT_ID");
    const clientSecret = readServerEnv("DISCORD_CLIENT_SECRET");
    const adminClient = getAdminClient();

    if (!clientId || !clientSecret || !adminClient) {
      return {
        ok: false,
        status: "discord_not_configured",
        message:
          "Discord callback is not configured yet. Add DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and SUPABASE_SERVICE_ROLE_KEY.",
      };
    }

    const auth = await getAuthenticatedUser(data.accessToken);

    if (auth.error || !auth.userId) {
      return { ok: false, status: "auth_required", message: auth.error };
    }

    const { data: stateRow, error: stateError } = await adminClient
      .from("discord_oauth_states")
      .select("state,user_id,redirect_uri,expires_at")
      .eq("state", data.state)
      .maybeSingle();

    if (stateError || !stateRow) {
      return {
        ok: false,
        status: "invalid_state",
        message: stateError?.message ?? "Discord connection expired. Please try again.",
      };
    }

    if (stateRow.user_id !== auth.userId || new Date(stateRow.expires_at) < new Date()) {
      await adminClient.from("discord_oauth_states").delete().eq("state", data.state);

      return {
        ok: false,
        status: "invalid_state",
        message: "Discord connection expired. Please try again.",
      };
    }

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: data.code,
        redirect_uri: stateRow.redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const message = await tokenResponse.text();
      return {
        ok: false,
        status: "discord_token_failed",
        message: message || `Discord token exchange failed with ${tokenResponse.status}.`,
      };
    }

    const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const message = await userResponse.text();
      return {
        ok: false,
        status: "discord_user_failed",
        message: message || `Discord user lookup failed with ${userResponse.status}.`,
      };
    }

    const discordUser = (await userResponse.json()) as DiscordUserResponse;
    const now = new Date().toISOString();
    const tokenExpiresAt =
      typeof tokenData.expires_in === "number"
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;
    const username = discordDisplayName(discordUser);
    const avatarUrl = discordAvatarUrl(discordUser);

    const { data: existingConnection, error: existingConnectionError } = await adminClient
      .from("discord_connections")
      .select("user_id")
      .eq("discord_user_id", discordUser.id)
      .maybeSingle();

    if (existingConnectionError) {
      return {
        ok: false,
        status: "connection_lookup_failed",
        message: existingConnectionError.message,
      };
    }

    if (existingConnection && existingConnection.user_id !== auth.userId) {
      await adminClient.from("discord_oauth_states").delete().eq("state", data.state);

      return {
        ok: false,
        status: "discord_already_connected",
        message: "This Discord account is already connected to another ZacTrades account.",
      };
    }

    const { error: connectionError } = await adminClient.from("discord_connections").upsert(
      {
        user_id: auth.userId,
        discord_user_id: discordUser.id,
        discord_username: discordUser.username,
        discord_global_name: discordUser.global_name ?? null,
        discord_avatar_url: avatarUrl,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        scopes: tokenData.scope ?? null,
        connected_at: now,
      },
      { onConflict: "user_id" },
    );

    if (connectionError) {
      if (isDiscordAlreadyConnectedError(connectionError)) {
        await adminClient.from("discord_oauth_states").delete().eq("state", data.state);

        return {
          ok: false,
          status: "discord_already_connected",
          message: "This Discord account is already connected to another ZacTrades account.",
        };
      }

      return {
        ok: false,
        status: "connection_save_failed",
        message: connectionError.message,
      };
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        discord_user_id: discordUser.id,
        discord_username: username,
        discord_avatar_url: avatarUrl,
        discord_connected_at: now,
        discord_role_sync_status: null,
        discord_role_sync_error: null,
      })
      .eq("id", auth.userId);

    await adminClient.from("discord_oauth_states").delete().eq("state", data.state);

    if (profileError) {
      return {
        ok: false,
        status: "profile_save_failed",
        message: profileError.message,
      };
    }

    const joinResult = await ensureDiscordGuildMember(adminClient, auth.userId);
    const syncResult = await syncPaidDiscordAccess(adminClient, auth.userId);
    const syncWarning =
      syncResult.failedMessages.length > 0
        ? " Some paid roles could not sync yet: " + syncResult.failedMessages.join("; ")
        : "";
    const joinWarning =
      !joinResult.ok && syncResult.syncedCount === 0
        ? " Discord server join could not be completed yet: " + joinResult.message
        : "";
    const connectedMessage =
      syncResult.syncedCount > 0
        ? "Discord connected as " + username + ". Your paid Discord access has been synced."
        : joinResult.ok
          ? "Discord connected as " +
            username +
            ". You have joined the server. Paid roles will be assigned after payment."
          : "Discord connected as " + username + ". Paid roles will be assigned after payment.";

    return {
      ok: true,
      status: "connected",
      username,
      message: connectedMessage + joinWarning + syncWarning,
    };
  });

export const syncDiscordPaidAccess = createServerFn({ method: "POST" })
  .inputValidator(discordSyncSchema)
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    if (!adminClient) {
      return {
        ok: false,
        status: "discord_not_configured",
        message:
          "Discord sync is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY and restart the dev server.",
      };
    }

    const auth = await getAuthenticatedUser(data.accessToken);

    if (auth.error || !auth.userId) {
      return { ok: false, status: "auth_required", message: auth.error };
    }

    const syncResult = await syncPaidDiscordAccess(adminClient, auth.userId);

    if (syncResult.failedMessages.length > 0) {
      return {
        ok: false,
        status: "discord_sync_failed",
        message: syncResult.failedMessages.join("; "),
      };
    }

    if (syncResult.syncedCount === 0) {
      return {
        ok: true,
        status: "no_paid_access",
        message: "Discord is connected, but no active paid access was found yet.",
      };
    }

    return {
      ok: true,
      status: "synced",
      message: "Discord paid roles synced successfully.",
    };
  });

async function syncPaidDiscordAccess(adminClient: SupabaseClient, userId: string) {
  const failedMessages: string[] = [];
  let syncedCount = 0;

  const { data: memberships, error: membershipsError } = await adminClient
    .from("user_memberships")
    .select("plan_slug,status,access_expires_at")
    .eq("user_id", userId)
    .in("status", discordEligibleStatuses());

  if (membershipsError) {
    failedMessages.push(membershipsError.message);
  } else {
    for (const membership of ((memberships ?? []) as ExistingPaidMembershipRow[]).filter(
      isActiveDiscordAccess,
    )) {
      const planSlug = normalizeMentorshipPlanSlug(membership.plan_slug);
      if (!planSlug) continue;

      const result = await provisionDiscordAccess(adminClient, userId, {
        kind: "mentorship",
        planSlug,
      });

      if (result.ok) {
        syncedCount += 1;
      } else {
        failedMessages.push(result.message);
      }
    }
  }

  const { data: newsSubscription, error: newsError } = await adminClient
    .from("user_news_subscriptions")
    .select("status,access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (newsError) {
    failedMessages.push(newsError.message);
  } else if (
    newsSubscription &&
    isActiveDiscordAccess(newsSubscription as ExistingNewsSubscriptionRow)
  ) {
    const result = await provisionDiscordAccess(adminClient, userId, { kind: "news" });

    if (result.ok) {
      syncedCount += 1;
    } else {
      failedMessages.push(result.message);
    }
  }

  const { data: liveAccess, error: liveError } = await adminClient
    .from("user_live_trading_access")
    .select("status,access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (liveError) {
    failedMessages.push(liveError.message);
  } else if (liveAccess && isActiveDiscordAccess(liveAccess as ExistingLiveTradingAccessRow)) {
    const result = await provisionDiscordAccess(adminClient, userId, { kind: "live" });

    if (result.ok) {
      syncedCount += 1;
    } else {
      failedMessages.push(result.message);
    }
  }

  return { syncedCount, failedMessages };
}

function isActivePaidAccess(access: { status: string; access_expires_at: string | null }) {
  if (access.status !== "paid") return false;
  if (!access.access_expires_at) return true;

  const expiresAt = new Date(access.access_expires_at);

  return Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();
}

function isActiveDiscordAccess(access: { status: string; access_expires_at: string | null }) {
  if (access.status === "pending" && discordAllowPendingAccess()) return true;
  return isActivePaidAccess(access);
}

async function ensureDiscordGuildMember(adminClient: SupabaseClient, userId: string) {
  const botToken = readServerEnv("DISCORD_BOT_TOKEN");
  const guildId = readServerEnv("DISCORD_GUILD_ID");

  if (!botToken || !guildId) {
    return {
      ok: false,
      status: "discord_bot_not_configured",
      message: "Discord bot is not configured yet.",
    };
  }

  const { data: connection, error } = await adminClient
    .from("discord_connections")
    .select("discord_user_id,access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: "discord_connection_lookup_failed", message: error.message };
  }

  if (!connection?.discord_user_id || !connection?.access_token) {
    return {
      ok: false,
      status: "discord_not_connected",
      message: "Discord is not connected yet.",
    };
  }

  const memberResponse = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${connection.discord_user_id}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${botToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        access_token: connection.access_token,
      }),
    },
  );

  if (!memberResponse.ok && memberResponse.status !== 204) {
    const message = await memberResponse.text();
    await saveDiscordSyncFailure(adminClient, userId, message || "Unable to add Discord member.");

    return {
      ok: false,
      status: "discord_member_add_failed",
      message: message || `Discord member add failed with ${memberResponse.status}.`,
    };
  }

  const now = new Date().toISOString();
  await adminClient
    .from("profiles")
    .update({
      discord_guild_joined_at: now,
      discord_last_role_sync_at: now,
      discord_role_sync_status: "server_joined",
      discord_role_sync_error: null,
    })
    .eq("id", userId);

  return {
    ok: true,
    status: "server_joined",
    message: "Discord server joined.",
  };
}

export async function provisionDiscordAccess(
  adminClient: SupabaseClient,
  userId: string,
  options: ProvisionDiscordOptions,
) {
  const botToken = readServerEnv("DISCORD_BOT_TOKEN");
  const guildId = readServerEnv("DISCORD_GUILD_ID");

  if (!botToken || !guildId) {
    return {
      ok: false,
      status: "discord_bot_not_configured",
      message: "Discord bot is not configured yet.",
    };
  }

  const { data: connection, error } = await adminClient
    .from("discord_connections")
    .select("discord_user_id,access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: "discord_connection_lookup_failed", message: error.message };
  }

  if (!connection?.discord_user_id || !connection?.access_token) {
    await adminClient
      .from("profiles")
      .update({
        discord_role_sync_status: "discord_not_connected",
        discord_role_sync_error: "User has not connected Discord yet.",
      })
      .eq("id", userId);

    return {
      ok: false,
      status: "discord_not_connected",
      message: "Discord is not connected yet.",
    };
  }

  const verifiedMemberRoleId = getDiscordVerifiedMemberRoleId();
  const roleIds = getDiscordRoleIds(options);

  if (!verifiedMemberRoleId) {
    const message =
      "DISCORD_VERIFIED_MEMBER_ROLE_ID is not configured, so the ZTC member role cannot be assigned.";
    await saveDiscordSyncFailure(adminClient, userId, message);

    return {
      ok: false,
      status: "discord_verified_role_not_configured",
      message,
    };
  }

  if (!roleIds.length) {
    return {
      ok: false,
      status: "discord_roles_not_configured",
      message: "Discord role IDs are not configured yet.",
    };
  }

  const rolesToAssign = Array.from(new Set([verifiedMemberRoleId, ...roleIds]));

  const memberResponse = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${connection.discord_user_id}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${botToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        access_token: connection.access_token,
        roles: rolesToAssign,
      }),
    },
  );

  if (!memberResponse.ok && memberResponse.status !== 204) {
    const message = await memberResponse.text();
    await saveDiscordSyncFailure(adminClient, userId, message || "Unable to add Discord member.");

    return {
      ok: false,
      status: "discord_member_add_failed",
      message: message || `Discord member add failed with ${memberResponse.status}.`,
    };
  }

  for (const roleId of rolesToAssign) {
    const roleAssignment = await assignDiscordRole(
      botToken,
      guildId,
      connection.discord_user_id,
      roleId,
    );

    if (!roleAssignment.ok) {
      await saveDiscordSyncFailure(adminClient, userId, roleAssignment.message);

      return {
        ok: false,
        status: "discord_role_failed",
        message: roleAssignment.message,
      };
    }
  }

  const unverifiedRoleRemoval = await removeDiscordUnverifiedRole(
    botToken,
    guildId,
    connection.discord_user_id,
  );

  if (!unverifiedRoleRemoval.ok) {
    await saveDiscordSyncFailure(adminClient, userId, unverifiedRoleRemoval.message);

    return {
      ok: false,
      status: "discord_unverified_role_remove_failed",
      message: unverifiedRoleRemoval.message,
    };
  }

  const now = new Date().toISOString();
  await markPaidAccessDiscordRoleSynced(adminClient, userId, options, now);

  await adminClient
    .from("profiles")
    .update({
      discord_guild_joined_at: now,
      discord_last_role_sync_at: now,
      discord_role_sync_status: "synced",
      discord_role_sync_error: null,
    })
    .eq("id", userId);

  return {
    ok: true,
    status: "synced",
    message: "Discord server access and roles were assigned.",
  };
}

async function markPaidAccessDiscordRoleSynced(
  adminClient: SupabaseClient,
  userId: string,
  options: ProvisionDiscordOptions,
  syncedAt: string,
) {
  if (options.kind === "live") {
    const { error } = await adminClient
      .from("user_live_trading_access")
      .update({ discord_role_synced_at: syncedAt })
      .eq("user_id", userId)
      .eq("status", "paid");

    if (error) console.error(error);
    return;
  }

  if (options.kind === "news") {
    const { error } = await adminClient
      .from("user_news_subscriptions")
      .update({ discord_role_synced_at: syncedAt })
      .eq("user_id", userId)
      .eq("status", "paid");

    if (error) console.error(error);
    return;
  }

  const { error } = await adminClient
    .from("user_memberships")
    .update({ discord_role_synced_at: syncedAt })
    .eq("user_id", userId)
    .eq("plan_slug", options.planSlug)
    .eq("status", "paid");

  if (error) console.error(error);
}

export async function expireAndRevokeDiscordAccess(adminClient: SupabaseClient) {
  const now = new Date().toISOString();

  const { data: expiredMemberships } = await adminClient
    .from("user_memberships")
    .select("user_id,plan_slug")
    .eq("status", "paid")
    .lte("access_expires_at", now);

  const { data: expiredNewsSubscriptions } = await adminClient
    .from("user_news_subscriptions")
    .select("user_id")
    .eq("status", "paid")
    .lte("access_expires_at", now);

  const { data: expiredLiveAccess } = await adminClient
    .from("user_live_trading_access")
    .select("user_id")
    .eq("status", "paid")
    .lte("access_expires_at", now);

  await adminClient
    .from("user_memberships")
    .update({ status: "expired", notes: "Access expired automatically." })
    .eq("status", "paid")
    .lte("access_expires_at", now);

  await adminClient
    .from("user_news_subscriptions")
    .update({ status: "expired", notes: "Access expired automatically." })
    .eq("status", "paid")
    .lte("access_expires_at", now);

  await adminClient
    .from("user_live_trading_access")
    .update({ status: "expired", notes: "Access expired automatically." })
    .eq("status", "paid")
    .lte("access_expires_at", now);

  const expiredByUser = new Map<
    string,
    {
      mentorshipPlans: Set<"one_to_one" | "group">;
      news: boolean;
      live: boolean;
    }
  >();

  for (const row of (expiredMemberships ?? []) as ExpiredMentorshipRow[]) {
    const entry = expiredByUser.get(row.user_id) ?? {
      mentorshipPlans: new Set<"one_to_one" | "group">(),
      news: false,
      live: false,
    };
    const planSlug = normalizeMentorshipPlanSlug(row.plan_slug);
    if (!planSlug) continue;
    entry.mentorshipPlans.add(planSlug);
    expiredByUser.set(row.user_id, entry);
  }

  for (const row of (expiredNewsSubscriptions ?? []) as ExpiredAccessRow[]) {
    const entry = expiredByUser.get(row.user_id) ?? {
      mentorshipPlans: new Set<"one_to_one" | "group">(),
      news: false,
      live: false,
    };
    entry.news = true;
    expiredByUser.set(row.user_id, entry);
  }

  for (const row of (expiredLiveAccess ?? []) as ExpiredAccessRow[]) {
    const entry = expiredByUser.get(row.user_id) ?? {
      mentorshipPlans: new Set<"one_to_one" | "group">(),
      news: false,
      live: false,
    };
    entry.live = true;
    expiredByUser.set(row.user_id, entry);
  }

  let expiredCount = 0;
  let revokedCount = 0;
  const failedMessages: string[] = [];

  for (const [userId, expiredAccess] of expiredByUser) {
    expiredCount +=
      expiredAccess.mentorshipPlans.size + Number(expiredAccess.news) + Number(expiredAccess.live);

    const result = await revokeExpiredDiscordRoles(adminClient, userId, expiredAccess);

    if (result.ok) {
      revokedCount += result.revokedCount;
    } else {
      failedMessages.push(result.message);
    }
  }

  return { expiredCount, revokedCount, failedMessages };
}

export async function reconcileDiscordRoleRemovals(adminClient: SupabaseClient) {
  void adminClient;

  return {
    disabled: true,
    checkedCount: 0,
    expiredCount: 0,
    graceSkippedCount: 0,
    failedMessages: [],
    message:
      "Discord role reconciliation is non-destructive. Paid access expires only at access_expires_at.",
  };
}

export async function handleDiscordExpiryRequest(
  request: Request,
  env: Record<string, string | undefined>,
) {
  const authError = validateDiscordCronRequest(request, env);
  if (authError) return authError;

  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      {
        ok: false,
        message: "Supabase service role is not configured.",
      },
      { status: 500 },
    );
  }

  const expiry = await expireAndRevokeDiscordAccess(adminClient);

  return Response.json({
    ok: true,
    ...expiry,
    roleReconciliation: {
      disabled: true,
      message:
        "Discord manual role removal audit is disabled. Paid access is expired only by its package expiry date.",
    },
  });
}

export async function handleDiscordRoleReconcileRequest(
  request: Request,
  env: Record<string, string | undefined>,
) {
  const authError = validateDiscordCronRequest(request, env);
  if (authError) return authError;

  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      {
        ok: false,
        message: "Supabase service role is not configured.",
      },
      { status: 500 },
    );
  }

  const result = await reconcileDiscordRoleRemovals(adminClient);

  return Response.json({ ok: true, ...result });
}

function validateDiscordCronRequest(request: Request, env: Record<string, string | undefined>) {
  const cronSecret = env.DISCORD_CRON_SECRET ?? readServerEnv("DISCORD_CRON_SECRET");

  if (!cronSecret) {
    return Response.json(
      {
        ok: false,
        message: "DISCORD_CRON_SECRET is not configured.",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-cron-secret") ?? "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : headerSecret;

  if (providedSecret !== cronSecret) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function getDiscordRoleIds(options: ProvisionDiscordOptions) {
  const roleIds = new Set<string>();
  const verifiedMemberRoleId = getDiscordVerifiedMemberRoleId();
  const mentorshipRoleId = readServerEnv("DISCORD_MENTORSHIP_ROLE_ID");
  const oneToOneRoleId = readServerEnv("DISCORD_ONE_TO_ONE_ROLE_ID");
  const groupRoleId = readServerEnv("DISCORD_GROUP_ROLE_ID");
  const liveTradingRoleId = readServerEnv("DISCORD_LIVE_TRADING_ROLE_ID");
  const newsRoleId = readServerEnv("DISCORD_NEWS_ROLE_ID");

  if (verifiedMemberRoleId) roleIds.add(verifiedMemberRoleId);

  if (options.kind === "mentorship") {
    if (mentorshipRoleId) roleIds.add(mentorshipRoleId);
    if (options.planSlug === "one_to_one" && oneToOneRoleId) roleIds.add(oneToOneRoleId);
    if (options.planSlug === "group" && groupRoleId) roleIds.add(groupRoleId);
  }

  if (options.kind === "news" && newsRoleId) {
    roleIds.add(newsRoleId);
  }

  if (options.kind === "live" && liveTradingRoleId) {
    roleIds.add(liveTradingRoleId);
  }

  return Array.from(roleIds);
}

function getDiscordVerifiedMemberRoleId() {
  return (
    readServerEnv("DISCORD_VERIFIED_MEMBER_ROLE_ID") ??
    readServerEnv("DISCORD_VERIFIED_MEMBER") ??
    readServerEnv("DISCORD_ZTC_MEMBER_ROLE_ID")
  );
}

async function assignDiscordRole(
  botToken: string,
  guildId: string,
  discordUserId: string,
  roleId: string,
) {
  const roleResponse = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${botToken}`,
      },
    },
  );

  if (!roleResponse.ok && roleResponse.status !== 204) {
    const message = await roleResponse.text();

    return {
      ok: false as const,
      message: message || `Discord role assignment failed with ${roleResponse.status}.`,
    };
  }

  return { ok: true as const };
}

async function removeDiscordUnverifiedRole(
  botToken: string,
  guildId: string,
  discordUserId: string,
) {
  const unverifiedRoleId = readServerEnv("DISCORD_UNVERIFIED_MEMBER_ROLE_ID");

  if (!unverifiedRoleId) {
    return { ok: true as const, message: "No unverified Discord role configured." };
  }

  const roleResponse = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${unverifiedRoleId}`,
    {
      method: "DELETE",
      headers: {
        authorization: `Bot ${botToken}`,
      },
    },
  );

  if (!roleResponse.ok && roleResponse.status !== 204 && roleResponse.status !== 404) {
    const message = await roleResponse.text();

    return {
      ok: false as const,
      message: message || `Discord unverified role removal failed with ${roleResponse.status}.`,
    };
  }

  return { ok: true as const, message: "Discord unverified role was removed." };
}


async function revokeExpiredDiscordRoles(
  adminClient: SupabaseClient,
  userId: string,
  expiredAccess: {
    mentorshipPlans: Set<"one_to_one" | "group">;
    news: boolean;
    live: boolean;
  },
) {
  const botToken = readServerEnv("DISCORD_BOT_TOKEN");
  const guildId = readServerEnv("DISCORD_GUILD_ID");

  if (!botToken || !guildId) {
    return {
      ok: false,
      revokedCount: 0,
      message: "Discord bot is not configured yet.",
    };
  }

  const { data: connection, error } = await adminClient
    .from("discord_connections")
    .select("discord_user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, revokedCount: 0, message: error.message };
  }

  if (!connection?.discord_user_id) {
    return { ok: true, revokedCount: 0, message: "Discord is not connected." };
  }

  const activeState = await getActiveDiscordAccessState(adminClient, userId);
  const roleIdsToRemove = getDiscordRoleIdsToRemove(expiredAccess, activeState);

  let revokedCount = 0;

  for (const roleId of roleIdsToRemove) {
    const roleResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${connection.discord_user_id}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bot ${botToken}`,
        },
      },
    );

    if (!roleResponse.ok && roleResponse.status !== 204 && roleResponse.status !== 404) {
      const message = await roleResponse.text();
      await saveDiscordSyncFailure(
        adminClient,
        userId,
        message || "Unable to remove expired Discord role.",
      );

      return {
        ok: false,
        revokedCount,
        message: message || `Discord role removal failed with ${roleResponse.status}.`,
      };
    }

    revokedCount += 1;
  }

  if (readServerEnv("DISCORD_REMOVE_EXPIRED_MEMBERS") === "true" && !activeState.hasAnyPaidAccess) {
    const removeResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${connection.discord_user_id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bot ${botToken}`,
        },
      },
    );

    if (!removeResponse.ok && removeResponse.status !== 204 && removeResponse.status !== 404) {
      const message = await removeResponse.text();
      await saveDiscordSyncFailure(
        adminClient,
        userId,
        message || "Unable to remove expired Discord member.",
      );

      return {
        ok: false,
        revokedCount,
        message: message || `Discord member removal failed with ${removeResponse.status}.`,
      };
    }
  }

  await adminClient
    .from("profiles")
    .update({
      discord_last_role_sync_at: new Date().toISOString(),
      discord_role_sync_status: "expired_access_revoked",
      discord_role_sync_error: null,
    })
    .eq("id", userId);

  return { ok: true, revokedCount, message: "Expired Discord access was revoked." };
}

async function getActiveDiscordAccessState(adminClient: SupabaseClient, userId: string) {
  const now = new Date().toISOString();

  const { data: memberships } = await adminClient
    .from("user_memberships")
    .select("plan_slug,status,access_expires_at")
    .eq("user_id", userId)
    .in("status", discordEligibleStatuses());

  const activeMemberships = ((memberships ?? []) as ExistingPaidMembershipRow[]).filter(
    (membership) =>
      membership.status === "pending" && discordAllowPendingAccess()
        ? true
        : !membership.access_expires_at ||
          Number.isNaN(new Date(membership.access_expires_at).getTime()) ||
          membership.access_expires_at > now,
  );

  const { data: newsSubscription } = await adminClient
    .from("user_news_subscriptions")
    .select("status,access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: liveAccess } = await adminClient
    .from("user_live_trading_access")
    .select("status,access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const hasNews = Boolean(
    newsSubscription && isActiveDiscordAccess(newsSubscription as ExistingNewsSubscriptionRow),
  );
  const hasLive = Boolean(
    liveAccess && isActiveDiscordAccess(liveAccess as ExistingLiveTradingAccessRow),
  );

  const activeMentorshipPlans = activeMemberships
    .map((membership) => normalizeMentorshipPlanSlug(membership.plan_slug))
    .filter((planSlug): planSlug is "one_to_one" | "group" => Boolean(planSlug));

  return {
    hasOneToOne: activeMentorshipPlans.includes("one_to_one"),
    hasGroup: activeMentorshipPlans.includes("group"),
    hasMentorship: activeMentorshipPlans.length > 0,
    hasNews,
    hasLive,
    hasAnyPaidAccess: activeMentorshipPlans.length > 0 || hasNews || hasLive,
  };
}

function getDiscordRoleIdsToRemove(
  expiredAccess: {
    mentorshipPlans: Set<"one_to_one" | "group">;
    news: boolean;
    live: boolean;
  },
  activeState: {
    hasOneToOne: boolean;
    hasGroup: boolean;
    hasMentorship: boolean;
    hasNews: boolean;
    hasLive: boolean;
  },
) {
  const roleIds = new Set<string>();
  const mentorshipRoleId = readServerEnv("DISCORD_MENTORSHIP_ROLE_ID");
  const oneToOneRoleId = readServerEnv("DISCORD_ONE_TO_ONE_ROLE_ID");
  const groupRoleId = readServerEnv("DISCORD_GROUP_ROLE_ID");
  const liveTradingRoleId = readServerEnv("DISCORD_LIVE_TRADING_ROLE_ID");
  const newsRoleId = readServerEnv("DISCORD_NEWS_ROLE_ID");

  if (
    expiredAccess.mentorshipPlans.has("one_to_one") &&
    !activeState.hasOneToOne &&
    oneToOneRoleId
  ) {
    roleIds.add(oneToOneRoleId);
  }

  if (expiredAccess.mentorshipPlans.has("group") && !activeState.hasGroup && groupRoleId) {
    roleIds.add(groupRoleId);
  }

  if (expiredAccess.mentorshipPlans.size > 0 && !activeState.hasMentorship && mentorshipRoleId) {
    roleIds.add(mentorshipRoleId);
  }

  if (expiredAccess.news && !activeState.hasNews && newsRoleId) {
    roleIds.add(newsRoleId);
  }

  if (expiredAccess.live && !activeState.hasLive && liveTradingRoleId) {
    roleIds.add(liveTradingRoleId);
  }

  return Array.from(roleIds);
}

async function saveDiscordSyncFailure(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
) {
  await adminClient
    .from("profiles")
    .update({
      discord_last_role_sync_at: new Date().toISOString(),
      discord_role_sync_status: "failed",
      discord_role_sync_error: message.slice(0, 500),
    })
    .eq("id", userId);
}
