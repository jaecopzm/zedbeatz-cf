import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

export const metadata: Metadata = {
  title: "DMCA Policy - ZedBeatz Zambian Music",
  description: "ZedBeatz DMCA compliance and copyright infringement policy for Zambian music content. Report copyright claims.",
  keywords: [
    "DMCA ZedBeatz", "Zambian music copyright", "ZedBeatz copyright report"
  ],
  openGraph: {
    title: "DMCA Policy - ZedBeatz Zambian Music | ZedBeatz",
    description: "ZedBeatz DMCA compliance and copyright infringement policy for Zambian music content. Report copyright claims.",
    url: "https://zedbeatz.com/dmca",
    siteName: "ZedBeatz",
    locale: "en_ZM",
    countryName: "Zambia",
  },
  twitter: {
    card: "summary_large_image",
    title: "DMCA Policy - ZedBeatz Zambian Music",
    description: "ZedBeatz DMCA compliance and copyright infringement policy for Zambian music content. Report copyright claims.",
  },
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-bold mb-6">DMCA Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-8">Digital Millennium Copyright Act</p>
        
        <div className="space-y-6 text-[var(--muted)] leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-lg md:text-lg md:text-2xl font-bold text-white mb-3">Copyright Infringement Notice</h2>
            <p>
              ZedBeatz respects the intellectual property rights of others and expects our users to do the same. We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">Filing a DMCA Notice</h2>
            <p>
              If you believe that your copyrighted work has been uploaded to ZedBeatz without authorization, please send a written notice to our designated copyright agent with the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>A physical or electronic signature of the copyright owner or authorized representative</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the material that is claimed to be infringing, with sufficient detail to locate it on our platform</li>
              <li>Your contact information (address, telephone number, and email address)</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner</li>
              <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">Contact Information</h2>
            <p>
              Send DMCA notices to:
            </p>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] mt-3">
              <p className="font-semibold text-white">Email:</p>
              <a href="mailto:support@zedbeatz.com" className="text-[var(--primary)] hover:underline">
                support@zedbeatz.com
              </a>
              <p className="mt-2 text-sm">Subject: DMCA Takedown Request</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">Counter-Notification</h2>
            <p>
              If you believe that your content was removed by mistake or misidentification, you may file a counter-notification with our copyright agent. The counter-notification must include:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Your physical or electronic signature</li>
              <li>Identification of the material that was removed and its location before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification</li>
              <li>Your name, address, telephone number, and a statement that you consent to jurisdiction of the federal court</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">Repeat Infringers</h2>
            <p>
              ZedBeatz will terminate the accounts of users who are repeat infringers of copyright in appropriate circumstances.
            </p>
          </section>
          
          <section>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-3">Processing Time</h2>
            <p>
              We will review and process valid DMCA notices within 48-72 hours. Upon receipt of a valid notice, we will remove or disable access to the allegedly infringing material.
            </p>
          </section>
          
          <section className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
            <p className="text-sm">
              <strong className="text-yellow-500">Important:</strong> Submitting a false or fraudulent DMCA notice may result in legal consequences. Please ensure all information provided is accurate.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
