import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

export const metadata: Metadata = {
  title: "Contact ZedBeatz - Zambian Music Platform Support",
  description: "Get in touch with ZedBeatz support team. Questions about Zambian music downloads, streaming, or submissions? Contact us today.",
  keywords: [
    "Contact ZedBeatz", "ZedBeatz support email", "ZedBeatz WhatsApp number",
    "upload music ZedBeatz", "Zambian music platform help"
  ],
  openGraph: {
    title: "Contact ZedBeatz - Zambian Music Platform Support | ZedBeatz",
    description: "Get in touch with ZedBeatz support team. Questions about Zambian music downloads, streaming, or submissions? Contact us today.",
    url: "https://zedbeatz.com/contact",
    siteName: "ZedBeatz",
    locale: "en_ZM",
    countryName: "Zambia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ZedBeatz - Zambian Music Platform Support",
    description: "Get in touch with ZedBeatz support team. Questions about Zambian music downloads, streaming, or submissions? Contact us today.",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-bold mb-6">Contact Us</h1>
        
        <div className="space-y-8">
          <p className="text-[var(--muted)] leading-relaxed text-sm md:text-base">
            Have questions, feedback, or need support? We'd love to hear from you!
          </p>
          
          {/* Support Email */}
          <div className="glass-card p-6 rounded-2xl border border-[var(--border)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                <Mail className="text-[var(--primary)]" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Email Support</h2>
                <p className="text-[var(--muted)] mb-3">
                  For general inquiries, technical support, or feedback
                </p>
                <a 
                  href="mailto:support@zedbeatz.com"
                  className="text-[var(--primary)] hover:underline font-semibold"
                >
                  support@zedbeatz.com
                </a>
              </div>
            </div>
          </div>
          
          {/* WhatsApp for Artists */}
          <div className="glass-card p-6 rounded-2xl border border-[var(--border)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Music Upload Inquiries</h2>
                <p className="text-[var(--muted)] mb-3">
                  Artists looking to upload music to ZedBeatz
                </p>
                <a 
                  href="https://wa.me/260971185807"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-500 hover:underline font-semibold"
                >
                  <Phone size={16} />
                  +260 971 185807
                </a>
              </div>
            </div>
          </div>
          
          {/* Response Time */}
          <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
            <p className="text-sm text-[var(--muted)]">
              <strong className="text-white">Response Time:</strong> We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
