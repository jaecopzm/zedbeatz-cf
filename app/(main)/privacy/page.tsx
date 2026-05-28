import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

export const metadata: Metadata = {
  title: "Privacy Policy - ZedBeatz Zambian Music",
  description: "ZedBeatz privacy policy. Learn how we collect, use, and protect your personal data when you stream and download Zambian music.",
  keywords: [
    "Zambian music streaming", "free Zambian music", "Zambia songs download",
    "listen to Zambian music online", "new Zambian songs today", "Zambian music 2026 hits",
    "top Zambian songs", "Zambian music charts", "Kopala music", "Zambian artists list",
    "Kalindula music", "Zamdancehall", "Zambian hip hop", "Zambian gospel music",
    "Zambian Afrobeat", "Lusaka music", "Copperbelt music", "Ndola music",
    "Zambian music platform", "best Zambian music site", "Zambia mp3 streaming",
    "Zambian music online", "Zambian songs mp3", "Zambia urban music",
    "Zambian dancehall", "Zambian R&B", "Zambian traditional music",
    "ZedBeatz Zambian music", "Zambian music download mp3 2026",
  ],
  openGraph: {
    title: "Privacy Policy - ZedBeatz Zambian Music | ZedBeatz",
    description: "ZedBeatz privacy policy. Learn how we collect, use, and protect your personal data when you stream and download Zambian music.",
    url: `${siteUrl}/privacy`,
    siteName: "ZedBeatz",
    locale: "en_ZM",
    countryName: "Zambia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - ZedBeatz Zambian Music",
    description: "ZedBeatz privacy policy. Learn how we collect, use, and protect your personal data when you stream and download Zambian music.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-8">Last updated: April 7, 2026</p>
        
        <div className="space-y-6 text-[var(--muted)] leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-lg md:text-lg md:text-2xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, use our services, or contact us. This may include your name, email address, and listening preferences.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your music experience</li>
              <li>Send you updates and promotional materials</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns and trends</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with service providers who assist us in operating our platform, conducting our business, or serving our users.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">4. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">7. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">8. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@zedbeatz.com" className="text-[var(--primary)] hover:underline">
                support@zedbeatz.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
