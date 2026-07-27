import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy | ZacTrades" },
      {
        name: "description",
        content: "Refund Policy for ZacTrades purchases, subscriptions, and services.",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refunds"
      title="Refund Policy"
      intro="This policy explains how refunds and cancellations are handled for ZacTrades subscriptions, mentorship, live rooms, indicators, and digital services."
      sections={[
        {
          title: "General refund window",
          body: [
            "Unless a specific offer states otherwise, eligible purchases may be requested for refund within 7 days of purchase.",
            "Refund requests must be submitted with the email address used at checkout and enough detail for us to locate the transaction.",
          ],
        },
        {
          title: "Subscriptions and cancellations",
          body: [
            "You may cancel a subscription according to the cancellation options available in your account or by contacting support.",
            "Cancellation stops future billing. It does not automatically refund past payments unless the purchase qualifies under this policy or a written offer guarantee.",
          ],
        },
        {
          title: "Digital products and access",
          body: [
            "Because ZacTrades provides digital education, indicators, recordings, community access, and live sessions, refunds may be denied when materials have been substantially accessed, downloaded, used, or shared.",
            "Abuse of refund requests, chargebacks, account sharing, or violation of the Terms of Service may make a purchase ineligible for refund.",
          ],
        },
        {
          title: "Mentorship and live services",
          body: [
            "Scheduled mentorship, coaching calls, and live services may have limited refund eligibility once sessions are booked, delivered, or missed without proper notice.",
            "If ZacTrades cancels a paid session and cannot provide a reasonable replacement, we may provide a credit, reschedule, or refund at our discretion.",
          ],
        },
        {
          title: "How to request a refund",
          body: [
            "Contact ZacTrades support with your full name, purchase email, order details, and reason for the request.",
            "Approved refunds are usually returned to the original payment method. Processing times depend on the payment provider and your bank.",
          ],
        },
      ]}
    />
  );
}
