import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export const Route = createFileRoute("/payment/failure")({
  head: () => ({
    meta: [
      { title: "Payment Failed | ZacTrades" },
      {
        name: "description",
        content: "Your ZacTrades payment was not completed.",
      },
    ],
  }),
  component: PaymentFailurePage,
});

function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="grid-bg absolute inset-0 -z-10" />
        <section className="mx-auto grid min-h-[52vh] max-w-2xl place-items-center px-4 md:px-6">
          <div className="glass-strong w-full rounded-3xl border border-destructive/30 p-6 text-center sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/30">
              <AlertCircle className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-destructive">
              Payment failed
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              The payment was not completed.
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              Your access was not activated. You can return to the offer page and try again, or
              contact support if your bank shows a charge.
            </p>
            <Button asChild variant="outline" className="mt-7 border-border/60 bg-background/45">
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
