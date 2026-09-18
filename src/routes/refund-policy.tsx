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
      intro="At ZacTrades, we want every customer to understand our refund policy before purchasing any product or service. By completing a purchase on ZacTrades.com, you acknowledge that you have read and accepted this Refund Policy."
      lastUpdated="September 5, 2026"
      sections={[
        {
          title: "1. General Refund Policy",
          body: [
            `All purchases made through ZacTrades.com are generally non-refundable once access to the purchased service, membership, digital content, training, or other product has been provided, or once the service has started.`,
            `This includes, but is not limited to:`,
            `- Premium Memberships`,
            `- Group Formation / Mentorship`,
            `- 1-to-1 Coaching`,
            `- Digital PDFs and educational materials`,
            `- Trading tools, indicators, or other digital products`,
            `- Other educational services offered through ZacTrades.com`,
            `Simply changing your mind, deciding not to use the service, missing sessions, or not achieving the results you expected does not automatically create a right to a refund.`,
          ],
        },
        {
          title: "2. Services That Have Started",
          body: [
            `For services that begin immediately or shortly after purchase, including memberships, coaching, mentoring, live trading sessions, and digital access, you acknowledge that the service may begin before the expiry of any applicable withdrawal period when you expressly request or agree to immediate access or performance.`,
            `Where applicable law allows the withdrawal right to be excluded after the service has started with your agreement, no refund will be provided once the service has begun.`,
          ],
        },
        {
          title: "3. Digital Products and Content",
          body: [
            `Digital products, PDFs, educational materials, recordings, indicators, tools, or other digital content may become available immediately after purchase.`,
            `Once digital content has been supplied, accessed, downloaded, or otherwise made available to you, purchases are generally non-refundable, except where a refund is required by applicable law.`,
          ],
        },
        {
          title: "4. Memberships",
          body: [
            `Membership payments are generally non-refundable once membership access has been activated.`,
            `Cancelling a membership does not create a right to a refund for the current billing period.`,
            `Where applicable, cancellation will prevent future renewal rather than refunding previous payments.`,
          ],
        },
        {
          title: "5. Coaching and Formation Programs",
          body: [
            `Payments for coaching, mentoring, and formation programs are generally non-refundable once the program has started or access to the program has been provided.`,
            `If you purchase a program and do not attend scheduled sessions or choose not to participate, this does not automatically create a right to a refund.`,
          ],
        },
        {
          title: "6. Exceptions Required by Law",
          body: [
            `Nothing in this Refund Policy is intended to remove or limit any consumer right that cannot legally be excluded.`,
            `Where applicable Moroccan consumer protection laws provide a statutory right of withdrawal, cancellation, or refund, those rights will continue to apply.`,
            `For certain distance contracts, Moroccan Law No. 31-08 provides a withdrawal period, subject to the exceptions and conditions established by the law. One important exception concerns services whose execution has already started with the consumer's agreement.`,
          ],
        },
        {
          title: "7. Service Unavailability",
          body: [
            `If ZacTrades is unable to provide a purchased service because the service becomes unavailable before it has been provided, we may provide an appropriate refund or other remedy in accordance with applicable law.`,
          ],
        },
        {
          title: "8. Duplicate or Incorrect Payments",
          body: [
            `If you believe you have been charged more than once for the same purchase or that a payment was processed incorrectly, please contact us as soon as possible.`,
            `We will review the transaction and, where an error is confirmed, take appropriate corrective action.`,
          ],
        },
        {
          title: "9. How to Contact Us",
          body: [
            `If you believe you are entitled to a refund under this policy or applicable law, please contact our support team through the official contact information provided on ZacTrades.com.`,
            `Please include:`,
            `- Your full name`,
            `- Email used for the purchase`,
            `- Order or transaction reference`,
            `- Product or service purchased`,
            `- Reason for your request`,
            `We will review each request based on the circumstances and applicable law.`,
          ],
        },
        {
          title: "10. Agreement to This Policy",
          body: [
            `By purchasing any product or service through ZacTrades.com, you confirm that you have had the opportunity to read and understand this Refund Policy and agree to its terms, subject to any rights that cannot legally be excluded.`,
            `ZacTrades Operated by Zactrix Limited, SARL AU`,
            `Website: ZacTrades.com`,
          ],
        },
      ]}
    />
  );
}
