import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

function PageHero({ tag, title, subtitle }) {
  return (
    <div
      className="relative overflow-hidden text-center py-16 px-4"
      style={{ background: 'linear-gradient(160deg,#651B2B 0%,#38271F 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(181,138,69,0.18),transparent_60%)]" />
      <svg viewBox="0 0 900 60" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 Q450,0 900,60" fill="#FBF5EA" />
      </svg>
      <div className="relative z-10">
        <span className="text-[9px] tracking-[0.35em] font-bold text-[#B58A45] uppercase block mb-3">
          {tag}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-bold mb-3">{title}</h1>
        {subtitle && <p className="font-sans text-xs text-white/75 max-w-lg mx-auto leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  )
}

function PolicySection({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-lg font-bold text-[#651B2B] mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-0.5 bg-[#B58A45]" />
        {title}
      </h2>
      <div className="font-sans text-[12.5px] text-[#38271F]/80 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title="Privacy Policy" canonicalUrl="/privacy" />
      <Navbar />
      <PageHero
        tag="Information"
        title="Privacy Policy"
        subtitle={`How ${BUSINESS.name} handles customer account and order information.`}
      />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <PolicySection title="Information Collected">
          <p>
            When you create an account or place an order with {BUSINESS.name}, the website collects the contact and
            delivery details you provide (such as name, phone number, email if supplied, and shipping address) solely
            to process orders and support order tracking.
          </p>
        </PolicySection>
        <PolicySection title="How Information Is Used">
          <p>
            Order details are used for order confirmation, payment verification where enabled, dispatch updates, and
            customer assistance via phone or WhatsApp ({BUSINESS.phoneDisplay}).
          </p>
        </PolicySection>
        <PolicySection title="Contact & Data Requests">
          <p>
            For questions regarding your account or order records, please reach us directly by phone or WhatsApp at{' '}
            <a href={BUSINESS.social.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[#651B2B] font-semibold underline">
              {BUSINESS.phoneDisplay}
            </a>.
          </p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#38271F]/55 mt-8 border-t border-[#B58A45]/20 pt-4">
          {BUSINESS.name} · {BUSINESS.location.full}
        </p>
      </div>
      <Footer />
    </div>
  )
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title="Terms & Conditions" canonicalUrl="/terms" />
      <Navbar />
      <PageHero
        tag="Terms"
        title="Terms & Conditions"
        subtitle={`General ordering and website information for ${BUSINESS.name}.`}
      />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <PolicySection title="Handloom Product Representation">
          <p>
            Handloom sarees and woven textiles may show slight variations in zari sheen or thread texture due to traditional
            weaving processes and screen display differences. Customers may request live photographs or details on WhatsApp
            before ordering.
          </p>
        </PolicySection>
        <PolicySection title="Orders & Confirmation">
          <p>
            Orders and pricing are subject to real-time weave availability. Please contact {BUSINESS.name} on WhatsApp (
            {BUSINESS.phoneDisplay}) to confirm shipping charges, delivery timelines, or bulk enquiries before placing an order
            if not displayed at checkout.
          </p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#38271F]/55 mt-8 border-t border-[#B58A45]/20 pt-4">
          {BUSINESS.name} · {BUSINESS.location.full}
        </p>
      </div>
      <Footer />
    </div>
  )
}

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title="Return & Exchange Enquiry" canonicalUrl="/refund-policy" />
      <Navbar />
      <PageHero
        tag="Support"
        title="Return & Exchange Support"
        subtitle={`Direct guidance from ${BUSINESS.name} on order concerns and exchanges.`}
      />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <PolicySection title="Confirm Policy Before Ordering">
          <p>
            Official return, refund, and exchange terms are provided directly by {BUSINESS.name} for each order. For
            assistance with an existing order or to clarify return and exchange eligibility prior to purchase, please reach
            us on WhatsApp at{' '}
            <a
              href={buildWhatsAppUrl(`Namaste ${BUSINESS.name}, I have a query regarding your return and exchange terms.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#651B2B] font-semibold underline"
            >
              {BUSINESS.phoneDisplay}
            </a>.
          </p>
        </PolicySection>
        <p className="font-sans text-[10.5px] text-[#38271F]/55 mt-8 border-t border-[#B58A45]/20 pt-4">
          {BUSINESS.name} · {BUSINESS.location.full}
        </p>
      </div>
      <Footer />
    </div>
  )
}

function GenericPage({ tag, title, children }) {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title={title} />
      <Navbar />
      <PageHero tag={tag} title={title} />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24 font-sans text-[12.5px] leading-relaxed space-y-4">
        {children}
        <p className="text-[10.5px] text-[#38271F]/55 mt-8 border-t border-[#B58A45]/20 pt-4">
          {BUSINESS.name} · {BUSINESS.location.full} · WhatsApp: {BUSINESS.phoneDisplay}
        </p>
      </div>
      <Footer />
    </div>
  )
}

export function FaqPage() {
  return (
    <GenericPage tag="Help & Support" title="Frequently Asked Questions">
      <p>
        Explore our Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves directly from{' '}
        <strong>{BUSINESS.name}</strong> ({BUSINESS.location.full}).
      </p>
      <p>
        For saree availability, pricing, shipping charges, delivery timelines, or order tracking assistance, contact us on
        WhatsApp at{' '}
        <a href={BUSINESS.social.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[#651B2B] font-semibold underline">
          {BUSINESS.phoneDisplay}
        </a>{' '}
        or follow{' '}
        <a href={BUSINESS.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#651B2B] font-semibold underline">
          {BUSINESS.social.instagramHandle}
        </a>.
      </p>
    </GenericPage>
  )
}

export function ShippingPolicyPage() {
  return (
    <GenericPage tag="Dispatch" title="Shipping Information">
      <p>
        Shipping charges and delivery timelines are confirmed by {BUSINESS.name} per order destination. Message{' '}
        {BUSINESS.phoneDisplay} on WhatsApp for dispatch estimates for your pincode.
      </p>
    </GenericPage>
  )
}
export function CancellationPolicyPage() {
  return (
    <GenericPage tag="Orders" title="Cancellation Information">
      <p>
        For order cancellation enquiries, please contact {BUSINESS.name} immediately via WhatsApp at {BUSINESS.phoneDisplay}{' '}
        with your order reference number.
      </p>
    </GenericPage>
  )
}
export function CookiePolicyPage() {
  return <GenericPage tag="Privacy" title="Cookie Notice"><p>This website uses essential browser storage to maintain your shopping bag and sign-in session.</p></GenericPage>
}
export function IntellectualPropertyPage() {
  return <GenericPage tag="Brand" title="Brand Assets"><p>Official branding and media belong to {BUSINESS.name}.</p></GenericPage>
}
export function DisclaimerPage() {
  return <GenericPage tag="Notice" title="General Disclaimer"><p>All product availability and pricing are confirmed per current handloom inventory.</p></GenericPage>
}
export function CraftsmanshipPage() {
  return (
    <GenericPage tag="Heritage" title="Dharmavaram Handloom Weaving">
      <p>
        Rooted in {BUSINESS.location.short}, {BUSINESS.name} brings {BUSINESS.experienceClaim} directly from our looms to customers.
      </p>
    </GenericPage>
  )
}
export function SustainabilityPage() {
  return <GenericPage tag="Handloom" title="Direct Weaver Connection"><p>{BUSINESS.name} connects saree buyers directly with Dharmavaram weaving.</p></GenericPage>
}
export function ProductCarePage() {
  return <GenericPage tag="Care" title="Handloom Saree Care"><p>Store silk sarees folded in breathable cotton cloth away from direct moisture and heat.</p></GenericPage>
}
export function BlogsPage() {
  return (
    <GenericPage tag="Updates" title="Collections & Highlights">
      <p>
        View recent weaving highlights, reviews, and dispatch stories on Instagram{' '}
        <a href={BUSINESS.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#651B2B] font-semibold underline">
          {BUSINESS.social.instagramHandle}
        </a>.
      </p>
    </GenericPage>
  )
}
export function StoreLocationsPage() {
  return <GenericPage tag="Location" title="Weaving Location"><p>{BUSINESS.name} is based in {BUSINESS.location.full}. Contact {BUSINESS.phoneDisplay} before visiting.</p></GenericPage>
}
export function CareersPage() {
  return <GenericPage tag="Connect" title="Work With Us"><p>Contact {BUSINESS.name} at {BUSINESS.phoneDisplay} for enquiries.</p></GenericPage>
}
export function BulkOrdersPage() {
  return <GenericPage tag="Enquiries" title="Bulk & Festive Enquiries"><p>Please contact us on WhatsApp at {BUSINESS.phoneDisplay} for bulk or festive saree enquiries.</p></GenericPage>
}
export function StylingPage() {
  return <GenericPage tag="Enquiries" title="Saree Selection Help"><p>Message {BUSINESS.name} on WhatsApp ({BUSINESS.phoneDisplay}) to discuss colour, border, and weave preferences.</p></GenericPage>
}
export function AppointmentsPage() {
  return <GenericPage tag="Connect" title="Direct Weaver Contact"><p>Connect with {BUSINESS.name} in {BUSINESS.location.short} via phone or WhatsApp: {BUSINESS.phoneDisplay}.</p></GenericPage>
}
