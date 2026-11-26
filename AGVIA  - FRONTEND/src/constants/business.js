// Authoritative Single Source of Truth for Lokesh Lingam Weaver
export const BUSINESS = {
  name: 'Lokesh Lingam Weaver',
  shortName: 'Lokesh Lingam Weaver',
  tagline: 'HANDLOOM SAREES & TRADITIONAL WEAVES',
  category: 'Clothing & Handloom Sarees',
  businessType: 'Direct handloom weaver',
  experienceYears: 15,
  experienceClaim: '15 years of weaving experience',
  establishedYear: 2019,
  establishedClaim: 'Since 2019',
  description:
    'Rooted in the weaving traditions of Dharmavaram, Lokesh Lingam Weaver celebrates the beauty of Indian handloom sarees. With 15 years of weaving experience, our focus is on traditional designs, intricate details and bringing handloom collections directly from the weaver to the customer.',

  logo: {
    png: '/images/lokesh-lingam-logo.png',
    webp: '/images/lokesh-lingam-logo.webp',
    favicon: '/images/lokesh-lingam-favicon.png',
    alt: 'Lokesh Lingam Weaver — Handloom Sarees & Traditional Weaves, Dharmavaram',
  },

  contact: {
    phone: '+91 7799349294',
    phoneRaw: '+917799349294',
    whatsapp: '+91 7799349294',
    whatsappRaw: '917799349294',
    whatsappUrl: 'https://wa.me/917799349294',
    // Official email & workshop street address are intentionally omitted until provided by the business owner
    email: null,
    supportEmail: null,
  },
  phoneDisplay: '+91 7799349294',

  location: {
    city: 'Dharmavaram',
    state: 'Andhra Pradesh',
    postalCode: '515671',
    country: 'India',
    full: 'Dharmavaram, Andhra Pradesh, India – 515671',
    short: 'Dharmavaram, Andhra Pradesh – 515671',
    fullAddress: 'Dharmavaram, Andhra Pradesh, India – 515671',
    shortAddress: 'Dharmavaram, Andhra Pradesh – 515671',
    googleMapsUrl: 'https://maps.google.com/?q=Dharmavaram,+Andhra+Pradesh+515671,+India',
  },

  social: {
    instagramHandle: '@shivani_handlooms_dharmavaram',
    instagram: 'https://www.instagram.com/shivani_handlooms_dharmavaram/',
    instagramUrl: 'https://www.instagram.com/shivani_handlooms_dharmavaram/',
    whatsappUrl: 'https://wa.me/917799349294',
  },

  productCategories: [
    'Dharmavaram Silk Sarees',
    'Kanchi-Style Silk Sarees',
    'Traditional Handloom Weaves',
  ],

  seo: {
    // Preserve existing domain until a new domain is explicitly approved
    siteUrl:
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://agvia-ecommerce.vercel.app',
    defaultImage: '/images/dharmavaram_hero_campaign.jpg',
    defaultTitle: 'Lokesh Lingam Weaver | Dharmavaram Handloom Sarees',
    titleTemplate: '%s | Lokesh Lingam Weaver',
    defaultDescription:
      'Explore traditional Dharmavaram silk sarees, Kanchi-style silk sarees and handloom collections from Lokesh Lingam Weaver.',
    keywords:
      'Lokesh Lingam Weaver, Dharmavaram handloom sarees, Dharmavaram silk sarees, Kanchi-style silk sarees, traditional handloom weaves, Andhra Pradesh handloom weaver, direct handloom weaver',
  },
}

export function buildWhatsAppUrl(message = '') {
  const base = BUSINESS.contact.whatsappUrl
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
