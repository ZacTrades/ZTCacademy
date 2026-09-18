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
      intro="These Terms of Service govern your access to ZacTrades.com, your account, purchases, memberships, coaching, live trading sessions, educational content, community access, and related services."
      lastUpdated="September 3, 2026"
      sections={[
        {
          title: "1. Acceptance of Terms",
          body: [
            `By accessing ZacTrades.com, creating an account, purchasing any product or service, or using any content, community, coaching, live trading session, educational material, or other service provided through ZacTrades, you acknowledge that you have read, understood, and agreed to these Terms of Service.`,
            `If you do not agree with these Terms, you should not use the website or purchase our services.`,
            `When you complete a purchase through ZacTrades.com, your purchase constitutes your acceptance of these Terms.`,
          ],
        },
        {
          title: "2. About ZacTrades",
          body: [
            `ZacTrades is a trading education and content brand operated by Zactrix Limited, SARL AU.`,
            `ZacTrades provides educational content, trading education, market analysis, live trading sessions, coaching, digital educational materials, community access, and other related services.`,
          ],
        },
        {
          title: "3. Our Services",
          body: [
            `The services available through ZacTrades may include, but are not limited to:`,
            `- Premium memberships and community access`,
            `- Live trading and market analysis sessions`,
            `- Group trading education and mentorship`,
            `- One-to-one coaching`,
            `- Educational PDFs and digital materials`,
            `- Trading tools, indicators, and related products`,
            `- Other educational content or services offered through the website`,
            `The exact features, duration, pricing, and conditions of each service are displayed on the relevant product or purchase page.`,
          ],
        },
        {
          title: "4. Educational Purpose Only",
          body: [
            `All content provided by ZacTrades is intended for educational and informational purposes only.`,
            `Nothing provided through ZacTrades should be considered personalized financial, investment, legal, or tax advice.`,
            `Any market analysis, trade idea, chart, opinion, strategy, or live trading activity represents educational content and the views of the presenter at the time it is provided.`,
          ],
        },
        {
          title: "5. Trading Risk",
          body: [
            `Trading financial markets involves substantial risk and may result in the loss of capital.`,
            `Past performance, examples, hypothetical results, or the performance of any trader, strategy, indicator, or trading method do not guarantee future results.`,
            `ZacTrades does not guarantee that any customer will make profits, pass a trading challenge, receive a payout, become profitable, or achieve any particular financial result.`,
            `You are solely responsible for your own trading decisions and risk management.`,
          ],
        },
        {
          title: "6. Payments",
          body: [
            `Payments for products and services purchased through ZacTrades.com are processed through our available payment provider(s), including Payzone where applicable.`,
            `By completing a purchase, you authorize the applicable payment provider to process the amount displayed at checkout.`,
            `Prices and available payment methods may change from time to time. Any change will not affect an order that has already been completed.`,
          ],
        },
        {
          title: "7. Refund Policy",
          body: [
            `All purchases made through ZacTrades.com are generally non-refundable once the purchased service, access, or digital content has been provided or the service has begun, except where a refund is required by applicable law.`,
            `Because our products and services may provide immediate access to digital content, private communities, educational materials, live sessions, coaching, or other services, customers should carefully review the description of the service before completing their purchase.`,
            `Refunds will generally not be provided simply because a customer:`,
            `- changes their mind after purchasing;`,
            `- decides not to use the service;`,
            `- does not attend live sessions;`,
            `- does not complete a course or program;`,
            `- does not use their membership;`,
            `- does not achieve the results they expected; or`,
            `- believes the service is no longer suitable for them.`,
            `Nothing in this section is intended to remove or limit any consumer rights that cannot legally be excluded under applicable law.`,
          ],
        },
        {
          title: "8. Memberships and Access",
          body: [
            `Paid services provide access only for the period and under the conditions stated on the relevant product page.`,
            `Access may be provided through ZacTrades.com, Discord, Telegram, email, or another platform used to deliver the service.`,
            `Customers are responsible for maintaining the security of their account and access information.`,
          ],
        },
        {
          title: "9. Account Sharing",
          body: [
            `Your paid access is intended for you only.`,
            `You may not share, sell, transfer, reproduce, distribute, or provide access to your paid membership, coaching, course, community, PDFs, recordings, or other paid materials to another person without our written permission.`,
            `We reserve the right to suspend or terminate access if we reasonably believe that unauthorized sharing or misuse has occurred.`,
          ],
        },
        {
          title: "10. Intellectual Property",
          body: [
            `All content available through ZacTrades, including but not limited to videos, recordings, PDFs, courses, written materials, graphics, logos, branding, trading materials, educational content, website content, and original strategies or tools, belongs to ZacTrades or its respective licensors unless otherwise stated.`,
            `You may use purchased materials for your own personal educational purposes only.`,
            `You may not copy, reproduce, sell, distribute, publish, upload, record, or commercially exploit our content without prior written permission.`,
          ],
        },
        {
          title: "11. User Responsibilities",
          body: [
            `You agree to use ZacTrades.com and its services lawfully and respectfully.`,
            `You must not use our services to:`,
            `- commit fraud;`,
            `- impersonate another person;`,
            `- distribute unauthorized content;`,
            `- interfere with the website or community;`,
            `- harass other members;`,
            `- share private or paid materials without permission; or`,
            `- engage in any activity that could harm ZacTrades or its community.`,
          ],
        },
        {
          title: "12. Website Content",
          body: [
            `We make reasonable efforts to provide accurate and useful information.`,
            `However, market information, prices, charts, news, technical information, and other website content may contain errors, delays, omissions, or inaccuracies.`,
            `We reserve the right to correct, update, modify, or remove content at any time.`,
          ],
        },
        {
          title: "13. Third-Party Services and Links",
          body: [
            `ZacTrades may provide links to third-party websites, platforms, brokers, trading companies, payment providers, software, or other services.`,
            `We do not control these third-party services and are not responsible for their availability, content, policies, or actions.`,
            `Your use of third-party services is subject to their own terms and policies.`,
          ],
        },
        {
          title: "14. Limitation of Liability",
          body: [
            `To the extent permitted by applicable law, ZacTrades and its operators shall not be responsible for losses arising from your trading decisions, financial losses, loss of profits, loss of data, interruption of service, or reliance on educational or informational content provided through ZacTrades.`,
            `Nothing in these Terms excludes liability that cannot legally be excluded or limited under applicable law.`,
          ],
        },
        {
          title: "15. Service Changes or Termination",
          body: [
            `We reserve the right to modify, suspend, or discontinue any part of the website or services when reasonably necessary.`,
            `We may also suspend or terminate a user's access where there is a violation of these Terms, unauthorized sharing of paid content, fraudulent activity, abuse, or other serious misuse of our services.`,
          ],
        },
        {
          title: "16. Changes to These Terms",
          body: [
            `We may update these Terms of Service from time to time.`,
            `Updated Terms will be published on this page with a revised "Last Updated" date.`,
            `Your continued use of ZacTrades.com after an update means that you accept the updated Terms, subject to applicable law.`,
          ],
        },
        {
          title: "17. Governing Law",
          body: [
            `These Terms shall be interpreted in accordance with applicable laws and regulations governing the services and transactions provided by ZacTrades.`,
            `Nothing in these Terms is intended to limit any mandatory rights or protections available to consumers under applicable law.`,
          ],
        },
        {
          title: "18. Contact",
          body: [
            `If you have questions regarding these Terms, your purchase, or our services, please contact ZacTrades through the official support channel provided on ZacTrades.com.`,
          ],
        },
      ]}
    />
  );
}
