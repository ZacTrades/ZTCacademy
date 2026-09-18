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
      intro="At ZacTrades, we respect your privacy and are committed to protecting the personal information you provide when using our website, purchasing our services, or communicating with us. This Privacy Policy explains what information we collect, how we use it, how we protect it, and your rights regarding your personal information."
      lastUpdated="September 5, 2026"
      sections={[
        {
          title: "1. Who We Are",
          body: [
            `ZacTrades is a trading education and content brand operated by Zactrix Limited, SARL AU.`,
            `For the purposes of this Privacy Policy, “ZacTrades,” “we,” “us,” or “our” refers to ZacTrades and the company operating the services.`,
            `Our website is: ZacTrades.com`,
          ],
        },
        {
          title: "2. Information We Collect",
          body: [
            `Depending on how you use our website and services, we may collect information such as:`,
            `- Your name`,
            `- Email address`,
            `- Phone number`,
            `- Billing and transaction information`,
            `- Information provided when contacting our support team`,
            `- Information required to provide purchased services`,
            `- Account and membership information`,
            `- Information you voluntarily provide through forms or our community platforms`,
            `We only collect information that is reasonably necessary to provide and operate our services.`,
          ],
        },
        {
          title: "3. Payment Information",
          body: [
            `When you purchase a product or service through ZacTrades.com, your payment may be processed through our payment provider, including Payzone where applicable.`,
            `We do not intentionally store your complete bank card or payment card details on our own systems.`,
            `Payment information may be processed and handled by the applicable payment provider according to its own privacy policy and security procedures.`,
            `We may receive certain transaction information, such as the payment status, transaction reference, purchased service, amount, and information necessary to confirm and manage your purchase.`,
          ],
        },
        {
          title: "4. How We Use Your Information",
          body: [
            `We may use your information to:`,
            `- Process and confirm your purchases`,
            `- Provide access to products and services you purchased`,
            `- Manage memberships and accounts`,
            `- Provide customer support`,
            `- Communicate with you about your purchases or services`,
            `- Send important service-related information`,
            `- Improve our website and services`,
            `- Prevent fraud, abuse, or unauthorized access`,
            `- Maintain business, accounting, and legal records`,
            `- Comply with applicable legal and regulatory obligations`,
            `We do not use your personal information for purposes unrelated to the services we provide unless permitted or required by applicable law.`,
          ],
        },
        {
          title: "5. Marketing Communications",
          body: [
            `From time to time, we may send promotional or marketing communications about ZacTrades products, services, offers, educational content, or announcements where permitted by applicable law.`,
            `You may request to stop receiving marketing communications at any time by using the unsubscribe option provided in the communication or by contacting our support team.`,
            `Your decision to stop receiving marketing communications will not affect your access to services you have already purchased.`,
          ],
        },
        {
          title: "6. Third-Party Services",
          body: [
            `ZacTrades may use trusted third-party services to operate the website and provide our services.`,
            `These may include, depending on the services you use:`,
            `- Payment processors`,
            `- Website and hosting providers`,
            `- Email and communication services`,
            `- Community platforms such as Discord or Telegram`,
            `- Analytics and website tools`,
            `- Customer support tools`,
            `- Other service providers necessary to operate ZacTrades`,
            `These providers may process information on our behalf or independently according to their own terms and privacy policies.`,
            `We only use third-party services where reasonably necessary for operating our business and providing our services.`,
          ],
        },
        {
          title: "7. Cookies and Similar Technologies",
          body: [
            `ZacTrades may use cookies and similar technologies to help the website function properly, understand how visitors use the website, improve website performance, and support certain website features.`,
            `Where required by applicable law, we will request your consent before using cookies or similar technologies that require consent.`,
            `You may also be able to control or disable certain cookies through your browser settings.`,
          ],
        },
        {
          title: "8. How We Protect Your Information",
          body: [
            `We take reasonable technical and organizational measures to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure.`,
            `However, no website, online service, or method of electronic transmission can be guaranteed to be completely secure.`,
            `For this reason, while we take reasonable steps to protect your information, we cannot guarantee absolute security.`,
          ],
        },
        {
          title: "9. How Long We Keep Your Information",
          body: [
            `We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including providing services, maintaining business records, resolving disputes, preventing fraud, and complying with legal or regulatory obligations.`,
            `When information is no longer reasonably required, we may delete, anonymize, or securely dispose of it, subject to applicable legal requirements.`,
          ],
        },
        {
          title: "10. Your Personal Data Rights",
          body: [
            `Under applicable Moroccan data protection law, including Law No. 09-08, you may have rights concerning your personal information, including the right to access and correct your personal information and, where applicable, the right to object to certain processing.`,
            `The CNDP identifies these rights and also requires appropriate information to be provided to individuals when their personal data is collected.`,
            `If you would like to exercise your rights or ask a question about how we process your personal information, please contact our support team using the contact information provided on ZacTrades.com.`,
          ],
        },
        {
          title: "11. Children's Privacy",
          body: [
            `ZacTrades services are not intended for individuals who are not legally able to enter into the relevant agreement or purchase our services.`,
            `We do not knowingly collect personal information from children for purposes unrelated to providing a lawful service.`,
            `If you believe that a child has provided personal information to us without appropriate authorization, please contact us so that we can review and take appropriate action.`,
          ],
        },
        {
          title: "12. Links to Other Websites",
          body: [
            `Our website may contain links to third-party websites, platforms, brokers, payment providers, software, or other services.`,
            `We are not responsible for the privacy practices, security, or content of third-party websites.`,
            `We recommend reviewing the privacy policy of any third-party service you choose to use.`,
          ],
        },
        {
          title: "13. International Data Transfers",
          body: [
            `Some of the third-party services used by ZacTrades may process or store information outside Morocco.`,
            `Where personal information is transferred or processed outside Morocco, we will take the measures required by applicable data protection laws.`,
          ],
        },
        {
          title: "14. Changes to This Privacy Policy",
          body: [
            `We may update this Privacy Policy from time to time to reflect changes to our services, technology, legal requirements, or business practices.`,
            `When we make changes, we will update the “Last Updated” date at the top of this page.`,
            `We encourage you to review this Privacy Policy periodically.`,
          ],
        },
        {
          title: "15. Contact Us",
          body: [
            `If you have any questions about this Privacy Policy, your personal information, or how ZacTrades handles your data, please contact our support team through the official contact information provided on ZacTrades.com.`,
            `ZacTrades Operated by Zactrix Limited, SARL AU`,
            `Website: ZacTrades.com`,
          ],
        },
      ]}
    />
  );
}
