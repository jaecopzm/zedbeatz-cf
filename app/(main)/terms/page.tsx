export default function TermsPage() {
  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-[var(--muted)] mb-8">Last updated: April 7, 2026</p>
        
        <div className="space-y-6 text-[var(--muted)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using ZedBeatz, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Use of Service</h2>
            <p>You agree to use ZedBeatz only for lawful purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Content</h2>
            <p>
              All music and content on ZedBeatz is protected by copyright and other intellectual property laws. You may stream and download content for personal, non-commercial use only.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Artist Content Upload</h2>
            <p>
              Artists who upload content to ZedBeatz represent and warrant that they own or have the necessary rights to the content. By uploading, you grant ZedBeatz a license to distribute and promote your content.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Prohibited Activities</h2>
            <p>You may not:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Redistribute or resell content from ZedBeatz</li>
              <li>Remove copyright notices or watermarks</li>
              <li>Use content for commercial purposes without authorization</li>
              <li>Create derivative works without permission</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>
              ZedBeatz is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              ZedBeatz shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">10. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of Zambia. Any disputes shall be resolved in the courts of Zambia.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">12. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
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
