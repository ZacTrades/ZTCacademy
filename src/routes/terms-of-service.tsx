import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service | ZacTrades" },
      {
        name: "description",
        content: "Terms of Service for ZacTrades website visitors, members, and subscribers.",
      },
    ],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms govern your access to the ZacTrades website, community, education content, mentorship, indicators, and related services."
      sections={[
        {
          title: "Educational purpose",
          body: [
            "ZacTrades provides trading education, commentary, tools, and community support for informational purposes only.",
            "Nothing on this website or inside our services is financial, investment, tax, legal, or professional advice. You are responsible for your own trading decisions and risk management.",
          ],
        },
        {
          title: "Accounts and access",
          body: [
            "You agree to provide accurate account information, keep login details secure, and notify us if you suspect unauthorized account access.",
            "We may suspend or terminate access if a member violates these terms, abuses the community, shares paid content without permission, or uses the service unlawfully.",
          ],
        },
        {
          title: "Payments and subscriptions",
          body: [
            "Paid plans, mentorship, indicators, live-room access, and other services are billed according to the offer presented at checkout.",
            "You are responsible for reviewing pricing, billing frequency, included features, and cancellation terms before purchase.",
          ],
        },
        {
          title: "Intellectual property",
          body: [
            "All ZacTrades content, branding, lessons, recordings, indicators, templates, and materials are owned by ZacTrades or its licensors.",
            "You may not copy, resell, redistribute, record, publish, or share paid materials without written permission.",
          ],
        },
        {
          title: "Trading risk",
          body: [
            "Trading futures, forex, crypto, and other financial markets involves substantial risk and may result in the loss of capital.",
            "Past performance, examples, testimonials, or trade results do not guarantee future outcomes.",
          ],
        },
      ]}
    />
  );
}
