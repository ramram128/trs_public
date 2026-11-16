import { Helmet } from 'react-helmet-async';

export function ShippingPolicyPage() {
  return (
    <>
      <Helmet><title>Shipping Policy — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 text-white tracking-tight">Shipping Policy</h1>
            <p className="text-[#edd58c] text-sm md:text-base font-medium">Island-wide delivery details, rates, and timelines</p>
          </div>
        </div>
        <div className="container-custom py-12 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-card p-8 prose prose-sm max-w-none">
            <h3>Delivery Coverage</h3>
            <p>We deliver island-wide across Sri Lanka. All orders are carefully packed and shipped from our warehouse.</p>
            <h3>Delivery Time</h3>
            <ul>
              <li><strong>Colombo & suburbs:</strong> 1-2 business days</li>
              <li><strong>Other major cities:</strong> 2-4 business days</li>
              <li><strong>Rural areas:</strong> 3-5 business days</li>
            </ul>
            <h3>Delivery Charges</h3>
            <ul>
              <li>Standard delivery: Rs. 350</li>
              <li><strong>Free delivery</strong> on orders above Rs. 5,000</li>
            </ul>
            <h3>Order Processing</h3>
            <p>Orders placed before 2:00 PM on business days are processed the same day. Orders placed after 2:00 PM or on weekends/holidays are processed the next business day.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function ReturnPolicyPage() {
  return (
    <>
      <Helmet><title>Return Policy — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 text-white tracking-tight">Return Policy</h1>
            <p className="text-[#edd58c] text-sm md:text-base font-medium">Easy returns and refund guidelines</p>
          </div>
        </div>
        <div className="container-custom py-12 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-card p-8 prose prose-sm max-w-none">
            <h3>Returns</h3>
            <p>We want you to be completely satisfied with your purchase. If you're not, we're here to help.</p>
            <h3>Eligibility</h3>
            <ul>
              <li>Items can be returned within 7 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Perishable items and personal care products cannot be returned once opened</li>
            </ul>
            <h3>How to Request a Return</h3>
            <ol>
              <li>Contact our support team via WhatsApp or email</li>
              <li>Provide your order number and reason for return</li>
              <li>Our team will guide you through the process</li>
            </ol>
            <h3>Refunds</h3>
            <p>Refunds are processed within 5-7 business days after we receive and inspect the returned item. The refund will be credited to your original payment method.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function PrivacyPolicyPage() {
  return (
    <>
      <Helmet><title>Privacy Policy — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 text-white tracking-tight">Privacy Policy</h1>
            <p className="text-[#edd58c] text-sm md:text-base font-medium">How we handle and protect your personal data</p>
          </div>
        </div>
        <div className="container-custom py-12 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-card p-8 prose prose-sm max-w-none">
            <h3>Information We Collect</h3>
            <p>We collect information you provide directly, including name, email, phone number, delivery address, and payment details.</p>
            <h3>How We Use Your Information</h3>
            <ul>
              <li>To process and fulfill your orders</li>
              <li>To communicate about your orders and account</li>
              <li>To improve our products and services</li>
              <li>To send promotional communications (with your consent)</li>
            </ul>
            <h3>Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information. Payment details are encrypted and never stored on our servers.</p>
            <h3>Third-Party Sharing</h3>
            <p>We do not sell or rent your personal information to third parties. We may share data with delivery partners solely to fulfill your orders.</p>
            <h3>Contact</h3>
            <p>For privacy-related inquiries, contact us at support@trsimports.com.</p>
          </div>
        </div>
      </div>
    </>
  );
}
