import { useState } from 'react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { ChevronDown, ChevronUp } from 'lucide-react'

/* ─── Shared luxury page wrapper ─── */
function PageHero({ tag, title, subtitle }) {
  return (
    <div className="relative overflow-hidden text-center py-16 px-4"
      style={{ background: 'linear-gradient(160deg,#3D0C18 0%,#1E0509 100%)' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,164,92,0.15),transparent_60%)]"/>
      {/* Decorative arch line */}
      <svg viewBox="0 0 900 60" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 Q450,0 900,60" fill="#FAF7F2"/>
      </svg>
      <div className="relative z-10">
        <span className="text-[9px] tracking-[0.35em] font-bold text-[#C9A45C] uppercase block mb-3">
          ✦ {tag} ✦
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-bold mb-3">{title}</h1>
        {subtitle && <p className="font-sans text-xs text-white/60 max-w-lg mx-auto leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  )
}

function PolicySection({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-lg font-bold text-[#5A1020] mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-0.5 bg-[#C9A45C]"/>
        {title}
      </h2>
      <div className="font-sans text-[12.5px] text-[#211D1E]/75 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════
   PRIVACY POLICY
═══════════════════════════════════════ */
export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body">
      <Navbar />
      <PageHero tag="Confidentiality" title="Privacy Policy"
        subtitle="Your trust is our highest commitment. Here's how we protect your data."/>
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <PolicySection title="Information We Collect">
          <p>We collect your name, email address, phone number, and delivery address solely to fulfil your orders, manage your AGVIA Haute Circle membership, and provide personalised styling consultations. We may also collect browsing data through cookies to improve your boutique experience.</p>
        </PolicySection>
        <PolicySection title="How We Use Your Information">
          <p>Your personal details are used exclusively for order fulfilment, Razorpay payment verification, concierge support communication, and AGVIA newsletter updates (only if you opt in). We never use your data for unsolicited third-party marketing.</p>
        </PolicySection>
        <PolicySection title="Data Security">
          <p>All patron profiles, measurement notes, and order histories are stored behind end-to-end encrypted databases with JWT authentication. Payment data is processed securely via Razorpay PCI-DSS compliant gateways — we never store your card details.</p>
        </PolicySection>
        <PolicySection title="Third-Party Sharing">
          <p>We do not sell, rent, or trade your personal information to third parties. Data is shared only with our logistics partners (Blue Dart, DTDC) strictly for delivery purposes, and with Razorpay for payment processing.</p>
        </PolicySection>
        <PolicySection title="Cookies">
          <p>Our website uses cookies to remember your preferences, wishlist items, and cart contents. You may disable cookies in your browser settings; however, some boutique features may not function optimally.</p>
        </PolicySection>
        <PolicySection title="Your Rights">
          <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, please contact our Privacy Desk at <span className="text-[#7B1030] font-semibold">agvia.boutique@gmail.com</span> or WhatsApp us at +91 90323 06961.</p>
        </PolicySection>
        <PolicySection title="Updates to This Policy">
          <p>We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. The revised policy will be posted on this page with an updated effective date. Continued use of AGVIA after changes constitutes acceptance.</p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#211D1E]/40 mt-8 border-t border-[#C9A45C]/15 pt-4">
          Effective Date: January 2024 · AGVIA Women's Wear Boutique, Jubilee Hills, Hyderabad
        </p>
      </div>
      <Footer />
    </div>
  )
}

/* ═══════════════════════════════════════
   TERMS & CONDITIONS
═══════════════════════════════════════ */
export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body">
      <Navbar />
      <PageHero tag="Legal" title="Terms & Conditions"
        subtitle="Please read these terms carefully before placing your order with AGVIA."/>
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <PolicySection title="Acceptance of Terms">
          <p>By accessing or using the AGVIA website and placing orders, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
        </PolicySection>
        <PolicySection title="Product Descriptions">
          <p>We make every effort to accurately display product colours, textures, and embroidery details. However, due to monitor variances, actual colours may differ slightly. Handloom and hand-embroidered pieces may have minor natural variations — these are features of authentic artisanal craftsmanship, not defects.</p>
        </PolicySection>
        <PolicySection title="Pricing & Payment">
          <p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. Prices may change without prior notice. Orders are confirmed only upon successful Razorpay payment. AGVIA reserves the right to cancel orders in case of pricing errors.</p>
        </PolicySection>
        <PolicySection title="Order Cancellation">
          <p>Orders may be cancelled within 12 hours of placement at no charge. Bespoke and made-to-measure orders cannot be cancelled once tailoring has commenced. Please WhatsApp us at +91 90323 06961 for urgent cancellation requests.</p>
        </PolicySection>
        <PolicySection title="Intellectual Property">
          <p>All content on this website — including photographs, design motifs, descriptions, logos, and brand identity — is the exclusive intellectual property of AGVIA Women's Wear Boutique. Reproduction or commercial use without written permission is strictly prohibited.</p>
        </PolicySection>
        <PolicySection title="Governing Law">
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.</p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#211D1E]/40 mt-8 border-t border-[#C9A45C]/15 pt-4">
          Effective Date: January 2024 · AGVIA Women's Wear Boutique, Jubilee Hills, Hyderabad
        </p>
      </div>
      <Footer />
    </div>
  )
}

/* ═══════════════════════════════════════
   REFUND / RETURN POLICY
═══════════════════════════════════════ */
export function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body">
      <Navbar />
      <PageHero tag="Returns & Refunds" title="Refund & Return Policy"
        subtitle="Easy hassle-free returns within 7 days. Your satisfaction is our promise."/>
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">

        {/* Quick highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon:'↩️', title:'7-Day Returns', desc:'Return within 7 days of delivery' },
            { icon:'⚡', title:'Fast Refunds', desc:'Processed within 5–7 business days' },
            { icon:'🚚', title:'Free Return Pickup', desc:'We arrange courier at no cost' },
          ].map(b => (
            <div key={b.title} className="bg-white border border-[#C9A45C]/20 rounded-2xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">{b.icon}</div>
              <p className="font-serif text-sm font-bold text-[#5A1020]">{b.title}</p>
              <p className="font-sans text-[11px] text-[#211D1E]/55 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        <PolicySection title="Return Eligibility">
          <p>Items are eligible for return within 7 days of delivery if they are unused, unwashed, and returned in original packaging with all tags intact. Sarees must be returned with the unstitched blouse piece.</p>
          <p className="mt-2"><strong className="text-[#5A1020]">Non-returnable:</strong> Bespoke and made-to-measure garments, custom blouses, items marked "Final Sale", and Gift Cards.</p>
        </PolicySection>
        <PolicySection title="How to Initiate a Return">
          <ol className="list-decimal pl-5 space-y-1">
            <li>WhatsApp us at +91 90323 06961 with your Order ID and photos of the item.</li>
            <li>Our concierge team will approve your return within 24 hours.</li>
            <li>We will schedule a free pickup from your registered address.</li>
            <li>Refund is initiated within 2 business days of receiving the returned item.</li>
          </ol>
        </PolicySection>
        <PolicySection title="Refund Timeline">
          <p>Approved refunds are credited to your original payment method within 5–7 business days. UPI and bank transfers are typically processed in 2–3 days. Credit/debit card refunds may take up to 7 working days depending on your bank.</p>
        </PolicySection>
        <PolicySection title="Exchange Policy">
          <p>We offer free size exchanges within 7 days. If your preferred size is unavailable, we will offer a full refund or store credit. Contact us via WhatsApp at +91 90323 06961 to arrange an exchange.</p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#211D1E]/40 mt-8 border-t border-[#C9A45C]/15 pt-4">
          Effective Date: January 2024 · AGVIA Women's Wear Boutique, Jubilee Hills, Hyderabad
        </p>
      </div>
      <Footer />
    </div>
  )
}

/* ═══════════════════════════════════════
   FAQ
═══════════════════════════════════════ */
const FAQ_DATA = [
  {
    category: 'Orders & Delivery',
    faqs: [
      { q: 'What is your standard delivery timeline?', a: 'Ready-to-wear silhouettes are dispatched within 24–48 hours via premium insured courier (2–4 business days across India). Bespoke bridal orders take 10–14 days for hand-embroidery and precision fitting.' },
      { q: 'Do you ship internationally?', a: 'Yes! We ship to USA, UK, UAE, Canada, Australia, and Singapore. International delivery takes 7–14 business days. Customs duties and taxes are borne by the customer.' },
      { q: 'How do I track my order?', a: 'Once dispatched, you will receive a tracking number via SMS. You can also track your order on our Track Order page using your Order ID.' },
      { q: 'Can I change my delivery address after placing an order?', a: 'Address changes can be made within 6 hours of placing the order. Please WhatsApp us immediately at +91 90323 06961.' },
    ]
  },
  {
    category: 'Products & Sizing',
    faqs: [
      { q: 'Are your handloom sarees Silk Mark certified?', a: 'Yes, all our pure Kanjeevaram, Banarasi, and Chanderi sarees carry authentic Silk Mark certification, woven on traditional Indian pit looms with certified zari.' },
      { q: 'Do you offer custom sizing?', a: 'Absolutely. All lehengas and anarkalis are crafted with generous 3–4 inch internal margins. We also offer complimentary made-to-measure blouse tailoring upon request.' },
      { q: 'How do I determine my size?', a: 'Please refer to our detailed Size Guide page with full bust, waist, hip, and length measurement instructions. For personal assistance, WhatsApp our styling team.' },
      { q: 'Are the product colours accurate?', a: 'We shoot all products in natural lighting for accuracy. However, slight colour variations may occur due to monitor settings. Handloom weave patterns may also have natural minor variations.' },
    ]
  },
  {
    category: 'Returns & Refunds',
    faqs: [
      { q: 'What is your return policy?', a: 'We offer hassle-free returns within 7 days of delivery for unused items in original packaging. Bespoke garments are non-returnable.' },
      { q: 'How long does a refund take?', a: 'Refunds are processed within 5–7 business days of receiving the returned item. UPI transfers are faster (2–3 days).' },
    ]
  },
  {
    category: 'Bridal & Bespoke',
    faqs: [
      { q: 'Can I schedule a bridal consultation?', a: 'Yes! You can visit our Jubilee Hills atelier or book a virtual 1-on-1 video consultation via WhatsApp concierge at +91 90323 06961.' },
      { q: 'What is the turnaround for bespoke bridal lehengas?', a: 'Bespoke bridal pieces require 10–21 days depending on embroidery complexity. We recommend booking at least 6 weeks before your wedding date.' },
      { q: 'How are garments packaged?', a: 'Every AGVIA ensemble is wrapped in breathable archival muslin, protected inside a gold-embossed keepsake trunk, and shipped in weather-sealed outer packaging.' },
    ]
  },
]

function FaqAccordion({ faqs }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-2">
      {faqs.map((f, i) => (
        <div key={i} className="bg-white border border-[#C9A45C]/20 rounded-xl overflow-hidden shadow-sm">
          <button
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
            onClick={() => setOpen(open === i ? null : i)}>
            <span className="font-serif text-sm font-semibold text-[#5A1020]">{f.q}</span>
            {open === i ? <ChevronUp size={16} className="text-[#C9A45C] shrink-0"/> : <ChevronDown size={16} className="text-[#C9A45C] shrink-0"/>}
          </button>
          {open === i && (
            <div className="px-5 pb-4 font-sans text-[12.5px] text-[#211D1E]/70 leading-relaxed border-t border-[#C9A45C]/10 pt-3">
              {f.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body">
      <Navbar />
      <PageHero tag="Atelier Assistance" title="Frequently Asked Questions"
        subtitle="Everything you need to know about AGVIA — from sizing to shipping, bridal to bespoke."/>
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        {FAQ_DATA.map((cat) => (
          <div key={cat.category} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="font-serif text-base font-bold text-[#7B1030]">{cat.category}</span>
              <span className="flex-1 h-px bg-[#C9A45C]/25"/>
            </div>
            <FaqAccordion faqs={cat.faqs}/>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-[#3D0C18] to-[#5A1020] rounded-3xl p-8 text-center text-white">
          <p className="text-[10px] tracking-[0.3em] text-[#C9A45C] uppercase mb-2">Still have questions?</p>
          <h3 className="font-serif text-xl font-bold mb-3">Chat with Our Concierge</h3>
          <p className="font-sans text-xs text-white/65 mb-5">Our styling team is available 10 AM – 8 PM, 7 days a week.</p>
          <a href="https://wa.me/919032306961" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#C9A45C] hover:bg-[#E6C687] text-[#1E0509] font-bold text-xs px-6 py-2.5 rounded-full transition-colors">
            WhatsApp Us Now
          </a>
        </div>
      </div>
      <Footer />
    </div>
  )
}
/* ---------------------------------------
   GENERIC PAGES
--------------------------------------- */
function GenericPage({ tag, title, children }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body">
      <Navbar />
      <PageHero tag={tag} title={title} />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24 font-sans text-[12.5px] leading-relaxed space-y-4">
        {children}
        <p className="text-[10.5px] text-[#211D1E]/40 mt-8 border-t border-[#C9A45C]/15 pt-4">
          AGVIA Women's Wear Boutique, Jubilee Hills, Hyderabad
        </p>
      </div>
      <Footer />
    </div>
  )
}

export function ShippingPolicyPage() {
  return <GenericPage tag="Delivery" title="Shipping Policy"><p>Detailed shipping terms will be published soon.</p></GenericPage>
}
export function CancellationPolicyPage() {
  return <GenericPage tag="Orders" title="Cancellation Policy"><p>Cancellation policies apply to all orders placed via our website.</p></GenericPage>
}
export function CookiePolicyPage() {
  return <GenericPage tag="Privacy" title="Cookie Policy"><p>We use cookies to improve your boutique experience.</p></GenericPage>
}
export function IntellectualPropertyPage() {
  return <GenericPage tag="Legal" title="Intellectual Property"><p>All designs and assets are copyright of AGVIA.</p></GenericPage>
}
export function DisclaimerPage() {
  return <GenericPage tag="Legal" title="Disclaimer"><p>Please read our terms carefully before purchasing.</p></GenericPage>
}
export function CraftsmanshipPage() {
  return <GenericPage tag="Our Heritage" title="Craftsmanship"><p>Discover the artisanal techniques behind every AGVIA ensemble.</p></GenericPage>
}
export function SustainabilityPage() {
  return <GenericPage tag="Our Commitment" title="Sustainability"><p>Our dedication to sustainable, ethical fashion.</p></GenericPage>
}
export function ProductCarePage() {
  return <GenericPage tag="Aftercare" title="Product Care"><p>Preserve your heirlooms with our detailed care instructions.</p></GenericPage>
}
export function BlogsPage() {
  return <GenericPage tag="Journal" title="Blogs & Style Guide"><p>Styling tips and the latest trends from AGVIA.</p></GenericPage>
}
export function StoreLocationsPage() {
  return <GenericPage tag="Visit Us" title="Store Locations"><p>Find our flagship boutiques and partner stores.</p></GenericPage>
}
export function CareersPage() {
  return <GenericPage tag="Join Us" title="Careers"><p>Explore career opportunities at AGVIA.</p></GenericPage>
}
export function BulkOrdersPage() {
  return <GenericPage tag="Wholesale" title="Bulk Orders"><p>Please contact us via WhatsApp for bulk or wholesale inquiries.</p></GenericPage>
}
export function StylingPage() {
  return <GenericPage tag="Consultation" title="Styling Consultation"><p>Book a private session with our styling experts.</p></GenericPage>
}
export function AppointmentsPage() {
  return <GenericPage tag="Bespoke" title="Atelier Appointments"><p>Book a virtual or in-person bridal appointment at our Jubilee Hills atelier.</p></GenericPage>
}
