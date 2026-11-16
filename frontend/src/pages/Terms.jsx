import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - TRS Products</title>
        <meta name="description" content="Terms and conditions for using TRS Products e-commerce platform and services." />
      </Helmet>

      <section className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
        {/* Background curve */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
          <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[#d8ad38]" />
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-3 tracking-tight text-white">Terms & Conditions</h1>
          <p className="text-[#edd58c] text-sm md:text-base font-medium">Last updated: January 2025</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using the TRS Products website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">2. Account Registration</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your password and account credentials. TRS Products reserves the right to suspend or terminate accounts that violate these terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">3. Products & Pricing</h2>
            <p>All product descriptions, images, and specifications are provided as accurately as possible. However, we do not warrant that product descriptions are error-free. Prices are subject to change without notice. We reserve the right to cancel orders with incorrect pricing.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">4. Orders & Payments</h2>
            <p>Placing an order constitutes an offer to purchase. We reserve the right to accept or reject any order. Payment must be made in full before dispatch for online orders. Cash on Delivery orders must be paid in full at the time of delivery.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">5. Shipping & Delivery</h2>
            <p>Delivery timelines are estimates and not guaranteed. TRS Products is not liable for delays caused by third-party couriers or unforeseen circumstances. Risk of loss passes to you upon delivery.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">6. Returns & Cancellations</h2>
            <p>Orders may be cancelled before dispatch. Returns are accepted per our Return Policy. Refunds are processed to the original payment method within 5-7 business days of return approval.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">7. Intellectual Property</h2>
            <p>All content on this website, including text, images, logos, and trademarks, is the property of TRS Products and protected by applicable intellectual property laws. You may not reproduce or distribute any content without written permission.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">8. Limitation of Liability</h2>
            <p>TRS Products shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific product in question.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">9. Privacy</h2>
            <p>Your use of our services is also governed by our Privacy Policy. Please review it to understand how we collect, use, and protect your personal information.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of Sri Lanka. Any disputes shall be resolved in the courts of Colombo, Sri Lanka.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">11. Changes to Terms</h2>
            <p>TRS Products reserves the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the updated terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-900 mb-3">Contact</h2>
            <p>For questions about these Terms & Conditions, contact us at <strong>support@trsimports.com</strong> or <strong>+94 742 975 043</strong>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
