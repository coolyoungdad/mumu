export default function TermsPage() {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-orange-950 mb-2">Terms of Service</h1>
        <p className="text-orange-500 mb-10">Last updated: February 2026</p>

        <div className="prose prose-orange max-w-none space-y-8 text-orange-900">
          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using MuMu ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. You must be at least 18 years old to use MuMu.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">2. Description of Service</h2>
            <p>MuMu is a mystery box platform where users purchase credits ("balance") to open digital mystery boxes containing collectible items. Each box contains one randomly selected physical collectible. Users may choose to have items shipped to them, or sell items back to MuMu at a fixed buyback price.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">3. Account Registration</h2>
            <p>You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate, current information when registering.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">4. Purchases and Balance</h2>
            <p>All balance purchases are final and non-refundable once credited to your account. Each mystery box costs $25 USD and is deducted from your account balance at the time of opening. Unused balance does not expire and may be withdrawn subject to the conditions in Section 4a below.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">4a. Withdrawals</h2>
            <p>You may request a cash withdrawal of your account balance via PayPal, subject to the following conditions: (i) the minimum withdrawal amount is $10 USD; (ii) the maximum withdrawal amount is $500 USD per request; (iii) withdrawals are subject to a 7-day hold from the date of your most recent balance top-up, to protect against payment fraud and chargebacks; (iv) withdrawals are processed within 2–3 business days of approval. MuMu reserves the right to reject withdrawal requests if there is reasonable suspicion of fraudulent activity. MuMu is not responsible for delays caused by PayPal or other payment processors.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">5. Refund Policy</h2>
            <p>Opened mystery boxes are non-refundable. If you receive a damaged or incorrect item upon physical shipment, contact support within 7 days of delivery for a replacement or store credit. Balance added to your account is non-refundable; however, unspent balance may be withdrawn per Section 4a.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">6. Buyback Program</h2>
            <p>MuMu offers a voluntary buyback program where you may sell your items back to MuMu at the fixed buyback price displayed at time of opening. Buyback prices are set by MuMu and may change without notice. Proceeds are credited to your account balance. You may then withdraw that balance per Section 4a or spend it on additional boxes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">7. Shipping</h2>
            <p>Physical shipping is available for items in your collection. Processing times are 3–7 business days. Shipping fees may apply. MuMu is not responsible for delays caused by carriers. Risk of loss transfers to you upon carrier pickup.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">8. Odds Disclosure</h2>
            <p>Each mystery box contains one item randomly drawn according to the probabilities disclosed on our <a href="/legal/odds" className="text-orange-600 hover:underline">Odds Disclosure page</a>. Purchasing a box does not guarantee any specific item.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">9. Prohibited Uses</h2>
            <p>You may not use automated scripts, bots, or other tools to open boxes at scale. You may not create multiple accounts to abuse promotional offers. You may not use the Service for any unlawful purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">10. Limitation of Liability</h2>
            <p>MuMu's liability is limited to the amount you paid for the current transaction. We are not liable for indirect, incidental, or consequential damages. The Service is provided "as is" without warranties of any kind.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">11. Modifications</h2>
            <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-950 mb-3">12. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@mumu.shop" className="text-orange-600 hover:underline">support@mumu.shop</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-orange-200">
          <a href="/" className="text-orange-600 hover:underline text-sm">← Back to MuMu</a>
        </div>
      </div>
    </div>
  );
}
