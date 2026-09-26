import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
};

export type DiscordConnection = {
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  connectedAt: string | null;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: "admin" | "moderator" | "member" | null;
  discordConnection: DiscordConnection | null;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  isConfigured: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (params: SignUpParams) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
