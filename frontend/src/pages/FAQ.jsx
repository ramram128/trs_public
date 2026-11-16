import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, HelpCircle, ShoppingBag, CreditCard, Truck, RotateCcw, UserCircle } from 'lucide-react';

const faqSections = [
  {
    title: 'Orders',
    icon: ShoppingBag,
    questions: [
      { q: 'How do I place an order?', a: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay online or choose Cash on Delivery.' },
      { q: 'Can I modify my order after placing it?', a: 'You can modify or cancel your order only if it is still in "Pending" or "Confirmed" status. Contact us immediately for changes.' },
      { q: 'How do I track my order?', a: 'Go to Track Order page and enter your order number and email/phone to see real-time status updates.' },
    ],
  },
  {
    title: 'Payment',
    icon: CreditCard,
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD) and online payments via PayHere (Visa, Mastercard, bank transfer).' },
      { q: 'Is online payment secure?', a: 'Yes. All online payments are processed through PayHere, a PCI-DSS compliant payment gateway used by leading Sri Lankan businesses.' },
      { q: 'Can I pay in installments?', a: 'Currently we offer single payments. Installment options may be available through PayHere for eligible purchases.' },
    ],
  },
  {
    title: 'Delivery',
    icon: Truck,
    questions: [
      { q: 'How long does delivery take?', a: 'Standard delivery within Colombo takes 1-3 business days. Outstation deliveries take 3-7 business days depending on location.' },
      { q: 'Is there free delivery?', a: 'Yes! Orders above Rs. 5,000 qualify for free delivery within Sri Lanka.' },
      { q: 'Do you deliver island-wide?', a: 'Yes, we deliver to all districts in Sri Lanka. Delivery charges may vary for remote areas.' },
    ],
  },
  {
    title: 'Returns & Refunds',
    icon: RotateCcw,
    questions: [
      { q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for damaged or incorrect items. Items must be unused and in original packaging.' },
      { q: 'How long does a refund take?', a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item.' },
      { q: 'Can I return opened products?', a: 'Unopened products in original condition can be returned. Opened food or personal care items cannot be returned for hygiene reasons.' },
    ],
  },
  {
    title: 'Account',
    icon: UserCircle,
    questions: [
      { q: 'Do I need an account to order?', a: 'You can checkout as a guest, but creating an account lets you track orders, manage your wishlist, and save addresses.' },
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.' },
      { q: 'How do I update my profile?', a: 'Log in and go to Account > Profile to update your name, phone, and default address.' },
    ],
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-green-700 transition-colors"
      >
        <span className="font-medium text-gray-800 pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-gray-600 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>FAQ - TRS Products</title>
        <meta name="description" content="Frequently asked questions about orders, payments, delivery, returns, and your TRS Products account." />
      </Helmet>

      <section className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
        {/* Background curve */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
          <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-[#d8ad38]" />
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-3 tracking-tight text-white">Frequently Asked Questions</h1>
          <p className="text-[#edd58c] text-sm md:text-base font-medium max-w-lg mx-auto">Find quick and clear answers to common questions about orders, payments, and deliveries</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {faqSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-700" />
                  </div>
                  <h2 className="text-xl font-bold text-green-900">{section.title}</h2>
                </div>
                {section.questions.map((item, i) => (
                  <FaqItem key={i} question={item.q} answer={item.a} />
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
