import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export const Route = createFileRoute("/payment/success")({
  head: () => ({
    meta: [
      { title: "Payment Received | ZacTrades" },
      {
        name: "description",
        content: "Your ZacTrades payment was received. Access updates after gateway confirmation.",
      },
    ],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="grid-bg absolute inset-0 -z-10" />
        <section className="mx-auto grid min-h-[52vh] max-w-2xl place-items-center px-4 md:px-6">
          <div className="glass-strong w-full rounded-3xl border border-bull/30 p-6 text-center sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-bull/15 text-bull ring-1 ring-bull/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-bull">
              Payment success
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Your payment was received.
            </h1>
            <Button
              asChild
              className="mt-7 text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Link to="/">
                Back to home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
