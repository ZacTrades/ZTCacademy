import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | ZacTrades" },
      {
        name: "description",
        content: "Privacy Policy for ZacTrades website visitors, members, and subscribers.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      intro="This policy explains how ZacTrades collects, uses, and protects information when you visit our website, join our newsletter, or use our trading education services."
      sections={[
        {
          title: "Information we collect",
          body: [
            "We may collect contact details such as your name, email address, billing details, account information, and messages you send to our team.",
            "We may also collect technical information such as device type, browser, pages visited, referral source, and general usage data to help improve the website.",
          ],
        },
        {
          title: "How we use information",
          body: [
            "We use your information to provide access to our services, process purchases, send account updates, deliver newsletter content, improve the platform, and respond to support requests.",
            "We may use aggregated or de-identified information to understand site performance, product demand, and member engagement.",
          ],
        },
        {
          title: "Sharing and service providers",
          body: [
            "We may share limited information with trusted providers that help us operate payments, analytics, email delivery, hosting, customer support, and fraud prevention.",
            "We do not sell personal information. We may disclose information if required by law, to enforce our policies, or to protect ZacTrades, our members, or the public.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "You can unsubscribe from marketing emails at any time by using the unsubscribe link in an email or contacting us directly.",
            "You may request access, correction, or deletion of personal information where applicable, subject to legal, security, and operational requirements.",
          ],
        },
        {
          title: "Security",
          body: [
            "We use reasonable administrative, technical, and organizational measures to protect information. No online system can be guaranteed to be completely secure.",
          ],
        },
      ]}
    />
  );
}
