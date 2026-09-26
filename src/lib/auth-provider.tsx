import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  AuthContext,
  type AuthContextValue,
  type DiscordConnection,
  type SignUpParams,
} from "@/lib/auth-context";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const missingConfigMessage =
  "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"admin" | "moderator" | "member" | null>(null);
  const [discordConnection, setDiscordConnection] = useState<DiscordConnection | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!supabase || !nextSession?.user) {
      setRole(null);
      setDiscordConnection(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role,discord_user_id,discord_username,discord_avatar_url,discord_connected_at")
      .eq("id", nextSession.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setRole("member");
      setDiscordConnection(null);
      return;
    }

    setRole(data?.role === "admin" || data?.role === "moderator" ? data.role : "member");

    if (data?.discord_user_id) {
      setDiscordConnection({
        userId: data.discord_user_id,
        username: data.discord_username ?? "Discord connected",
        avatarUrl: data.discord_avatar_url ?? null,
        connectedAt: data.discord_connected_at ?? null,
      });
    } else {
      setDiscordConnection(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error(error);
      }

      if (mounted) {
        setSession(data.session ?? null);
        await loadProfile(data.session ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async ({ email, password, fullName, phoneNumber }: SignUpParams) => {
    if (!supabase) {
      throw new Error(missingConfigMessage);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      throw error;
    }

    return { needsEmailConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(missingConfigMessage);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error(missingConfigMessage);
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) {
      throw new Error(missingConfigMessage);
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      role,
      discordConnection,
      isAdmin: role === "admin",
      isStaff: role === "admin" || role === "moderator",
      loading,
      isConfigured: isSupabaseConfigured,
      refreshProfile,
      signUp,
      signIn,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [
      discordConnection,
      loading,
      refreshProfile,
      requestPasswordReset,
      role,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
