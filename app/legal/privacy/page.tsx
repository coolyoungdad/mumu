export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-orange-950 mb-2">Privacy Policy</h1>
        <p className="text-orange-500 mb-10">Last updated: February 2026</p>

        <div className="prose prose-orange max-w-none space-y-8 text-orange-900">
          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use Mumu:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Account data:</strong> Email address and encrypted password</li>
              <li><strong>Transaction data:</strong> Balance top-ups, box openings, sellbacks, and shipping requests</li>
              <li><strong>Shipping data:</strong> Name and mailing address (only when you request physical shipment)</li>
              <li><strong>Payment data:</strong> Payment processing is handled by Stripe. We do not store card numbers.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and session information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Operate and provide the Mumu service</li>
              <li>Process payments and fulfill shipping requests</li>
              <li>Communicate with you about your account and orders</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Improve the service through analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Stripe:</strong> For payment processing (governed by Stripe's Privacy Policy)</li>
              <li><strong>Supabase:</strong> For database and authentication services</li>
              <li><strong>Shipping carriers:</strong> Your name and address when fulfilling shipments</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">4. Data Retention</h2>
            <p>We retain your account data while your account is active. Transaction history is retained for 7 years for financial compliance purposes. You may request account deletion by contacting support, subject to legal retention requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">5. Security</h2>
            <p>We use industry-standard security measures including encrypted connections (TLS), encrypted password storage, and Row Level Security on our database. No system is 100% secure; use a strong, unique password for your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">6. Cookies</h2>
            <p>We use cookies for authentication (session management) and analytics. Essential session cookies are required to use the Service. You may disable non-essential cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or port your personal data. To exercise these rights, contact us at <a href="mailto:support@mumu.shop" className="text-orange-600 hover:underline">support@mumu.shop</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">8. Children's Privacy</h2>
            <p>Mumu is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">10. Contact</h2>
            <p>For privacy questions: <a href="mailto:support@mumu.shop" className="text-orange-600 hover:underline">support@mumu.shop</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-orange-200">
          <a href="/" className="text-orange-600 hover:underline text-sm">← Back to Mumu</a>
        </div>
      </div>
    </div>
  );
}
