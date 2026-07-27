import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { completeDiscordConnection } from "@/lib/discord-server";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/discord/callback")({
  head: () => ({
    meta: [
      { title: "Discord Connected | ZacTrades" },
      {
        name: "description",
        content: "Connect Discord to your ZacTrades account.",
      },
    ],
  }),
  component: DiscordCallbackPage,
});

function DiscordCallbackPage() {
  const { session, loading, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Finishing Discord connection...");
  const didRun = useRef(false);

  const { code, state } = useMemo(() => {
    if (typeof window === "undefined") return { code: "", state: "" };

    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get("code") ?? "",
      state: params.get("state") ?? "",
    };
  }, []);

  useEffect(() => {
    if (loading || didRun.current) return;

    if (!session?.access_token) {
      setStatus("error");
      setMessage("Please sign in again, then reconnect Discord from the header.");
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Discord did not return the required connection code. Please try again.");
      return;
    }

    didRun.current = true;

    completeDiscordConnection({
      data: {
        accessToken: session.access_token,
        code,
        state,
      },
    })
      .then(async (result) => {
        if (result.ok) {
          await refreshProfile();
          setStatus("success");
          setMessage(result.message);
          return;
        }

        setStatus("error");
        setMessage(result.message);
      })
      .catch((error) => {
        console.error(error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to connect Discord.");
      });
  }, [code, loading, refreshProfile, session?.access_token, state]);

  const Icon = status === "success" ? CheckCircle2 : status === "error" ? AlertCircle : Loader2;

  return (
    <main className="min-h-screen bg-background px-4 py-28 text-foreground">
      <section className="mx-auto grid min-h-[55vh] max-w-xl place-items-center">
        <div className="glass-strong w-full rounded-3xl border border-border/60 p-8 text-center">
          <div
            className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
              status === "success"
                ? "bg-bull/15 text-bull ring-1 ring-bull/30"
                : status === "error"
                  ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                  : "bg-[#5865f2]/15 text-[#b8c0ff] ring-1 ring-[#5865f2]/30"
            }`}
          >
            {status === "loading" ? (
              <Icon className="h-7 w-7 animate-spin" />
            ) : (
              <Icon className="h-7 w-7" />
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#b8c0ff]">
            <MessageCircle className="h-4 w-4" />
            Discord connection
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">
            {status === "success"
              ? "Discord connected"
              : status === "error"
                ? "Connection failed"
                : "Connecting Discord"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>

          <Button asChild className="mt-6 text-primary-foreground glow-primary hover:opacity-90">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
