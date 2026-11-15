// Local fallback data for AGVIA Women's Wear Boutique
export const CATEGORIES = [
  'Sarees',
  'Lehengas',
  'Anarkalis & Kurtas',
  'Dresses & Gowns',
  'Western Wear',
  'Kurtis',
  'Dupattas'
]

export const PRODUCTS = [
  // ── 1-10: Core Collection ──────────────────────────────────
  {
    id: 1, name: 'AGVIA Classic Silk Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 4999, unit: 'piece', rating: 4.8, stock: 25, bestseller: true,
    image: '/images/classic_silk_saree.jpg', imageUrl: '/images/classic_silk_saree.jpg',
    description: 'Elegant silk saree for festive occasions, family functions and traditional celebrations.'
  },
  {
    id: 2, name: 'AGVIA Floral Organza Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 3999, unit: 'piece', rating: 4.5, stock: 20, bestseller: false,
    image: '/images/floral_organza_saree.jpg', imageUrl: '/images/floral_organza_saree.jpg',
    description: 'Lightweight organza saree with a soft floral look, ideal for festivals and evening occasions.'
  },
  {
    id: 3, name: 'AGVIA Embroidered Anarkali Set',
    category: 'Anarkalis & Kurtas', categoryName: 'Anarkalis & Kurtas',
    price: 3499, unit: 'set', rating: 4.7, stock: 30, bestseller: true,
    image: '/images/anarkali_set.jpg', imageUrl: '/images/anarkali_set.jpg',
    description: 'Comfortable flowing Anarkali with delicate embroidery for festive and family occasions.'
  },
  {
    id: 4, name: 'AGVIA Everyday Kurta Set',
    category: 'Anarkalis & Kurtas', categoryName: 'Anarkalis & Kurtas',
    price: 1999, unit: 'set', rating: 4.3, stock: 40, bestseller: false,
    image: '/images/everyday_kurta_set.jpg', imageUrl: '/images/everyday_kurta_set.jpg',
    description: 'Simple and comfortable kurta set designed for everyday wear, college, office and casual occasions.'
  },
  {
    id: 5, name: 'AGVIA Festive Lehenga Set',
    category: 'Lehengas', categoryName: 'Lehengas',
    price: 5999, unit: 'set', rating: 4.9, stock: 15, bestseller: true,
    image: '/images/festive_lehenga_set.jpg', imageUrl: '/images/festive_lehenga_set.jpg',
    description: 'Beautiful festive lehenga set with elegant detailing for weddings and celebrations.'
  },
  {
    id: 6, name: 'AGVIA Embroidered Wedding Lehenga',
    category: 'Lehengas', categoryName: 'Lehengas',
    price: 8999, unit: 'set', rating: 5.0, stock: 12, bestseller: true,
    image: '/images/wedding_lehenga.jpg', imageUrl: '/images/wedding_lehenga.jpg',
    description: 'Premium embroidered lehenga designed for weddings, receptions and special celebrations.'
  },
  {
    id: 7, name: 'AGVIA Evening Gown',
    category: 'Dresses & Gowns', categoryName: 'Dresses & Gowns',
    price: 3499, unit: 'piece', rating: 4.4, stock: 18, bestseller: false,
    image: '/images/evening_gown.jpg', imageUrl: '/images/evening_gown.jpg',
    description: 'Elegant evening gown with a graceful silhouette for parties, dinners and celebrations.'
  },
  {
    id: 8, name: 'AGVIA Co-ord Set',
    category: 'Western Wear', categoryName: 'Western Wear',
    price: 1799, unit: 'set', rating: 4.2, stock: 35, bestseller: false,
    image: '/images/coord_set.jpg', imageUrl: '/images/coord_set.jpg',
    description: 'Modern matching outfit designed for a clean, comfortable and stylish everyday look.'
  },
  {
    id: 9, name: 'AGVIA Festive Kurti',
    category: 'Kurtis', categoryName: 'Kurtis',
    price: 1499, unit: 'piece', rating: 4.1, stock: 45, bestseller: false,
    image: '/images/festive_kurti.jpg', imageUrl: '/images/festive_kurti.jpg',
    description: 'Easy-to-wear festive kurti with a simple ethnic design for everyday Indian occasions.'
  },
  {
    id: 10, name: 'AGVIA Bridal Dupatta',
    category: 'Dupattas', categoryName: 'Dupattas',
    price: 1299, unit: 'piece', rating: 4.6, stock: 30, bestseller: false,
    image: '/images/bridal_dupatta.jpg', imageUrl: '/images/bridal_dupatta.jpg',
    description: 'Elegant embellished dupatta designed to complement festive and bridal outfits.'
  },

  // ── 11-20: Extended Collection ─────────────────────────────
  {
    id: 11, name: 'AGVIA Kanjeevaram Gold Silk Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 6499, unit: 'piece', rating: 4.9, stock: 15, bestseller: true,
    image: '/images/classic_silk_saree.jpg', imageUrl: '/images/classic_silk_saree.jpg',
    description: 'Heirloom pure Kanjeevaram silk saree with rich zari border and pallu.'
  },
  {
    id: 12, name: 'AGVIA Pastel Banarasi Georgette Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 4599, unit: 'piece', rating: 4.5, stock: 18, bestseller: false,
    image: '/images/floral_organza_saree.jpg', imageUrl: '/images/floral_organza_saree.jpg',
    description: 'Soft drape pastel saree with hand-woven zari buttas for day festivities.'
  },
  {
    id: 13, name: 'AGVIA Royal Crimson Velvet Lehenga',
    category: 'Lehengas', categoryName: 'Lehengas',
    price: 9999, unit: 'set', rating: 5.0, stock: 10, bestseller: true,
    image: '/images/wedding_lehenga.jpg', imageUrl: '/images/wedding_lehenga.jpg',
    description: 'Exquisite bridal crimson velvet lehenga with handcrafted zardozi embroidery.'
  },
  {
    id: 14, name: 'AGVIA Champagne Mirror-Work Lehenga',
    category: 'Lehengas', categoryName: 'Lehengas',
    price: 6999, unit: 'set', rating: 4.7, stock: 14, bestseller: false,
    image: '/images/festive_lehenga_set.jpg', imageUrl: '/images/festive_lehenga_set.jpg',
    description: 'Light-catching festive lehenga with intricate mirror and threadwork detailing.'
  },
  {
    id: 15, name: 'AGVIA Chikankari Angrakha Anarkali',
    category: 'Anarkalis & Kurtas', categoryName: 'Anarkalis & Kurtas',
    price: 3899, unit: 'set', rating: 4.6, stock: 22, bestseller: false,
    image: '/images/anarkali_set.jpg', imageUrl: '/images/anarkali_set.jpg',
    description: 'Graceful Lucknowi Chikankari angrakha style set with matching churidar.'
  },
  {
    id: 16, name: 'AGVIA Chanderi Silk Festive Kurta',
    category: 'Anarkalis & Kurtas', categoryName: 'Anarkalis & Kurtas',
    price: 2499, unit: 'set', rating: 4.4, stock: 28, bestseller: false,
    image: '/images/everyday_kurta_set.jpg', imageUrl: '/images/everyday_kurta_set.jpg',
    description: 'Breathable Chanderi silk kurta with foil print and delicate gotta patti work.'
  },
  {
    id: 17, name: 'AGVIA Emerald Pleated Cocktail Gown',
    category: 'Dresses & Gowns', categoryName: 'Dresses & Gowns',
    price: 4299, unit: 'piece', rating: 4.5, stock: 16, bestseller: false,
    image: '/images/evening_gown.jpg', imageUrl: '/images/evening_gown.jpg',
    description: 'Floor-sweeping pleated gown with an asymmetric neckline for gala receptions.'
  },
  {
    id: 18, name: 'AGVIA Satin Wrap Resort Dress',
    category: 'Dresses & Gowns', categoryName: 'Dresses & Gowns',
    price: 2799, unit: 'piece', rating: 4.3, stock: 20, bestseller: false,
    image: '/images/pexels-ron-lach-8386651.jpg', imageUrl: '/images/pexels-ron-lach-8386651.jpg',
    description: 'Sleek flowing satin wrap dress designed for modern evening soirées.'
  },
  {
    id: 19, name: 'AGVIA Linen Blazer & Trousers Set',
    category: 'Western Wear', categoryName: 'Western Wear',
    price: 3199, unit: 'set', rating: 4.4, stock: 24, bestseller: false,
    image: '/images/coord_set.jpg', imageUrl: '/images/coord_set.jpg',
    description: 'Sophisticated contemporary co-ord set with clean lines and tailored fit.'
  },
  {
    id: 20, name: 'AGVIA Organza Zari Scalloped Dupatta',
    category: 'Dupattas', categoryName: 'Dupattas',
    price: 1699, unit: 'piece', rating: 4.3, stock: 35, bestseller: false,
    image: '/images/bridal_dupatta.jpg', imageUrl: '/images/bridal_dupatta.jpg',
    description: 'Airy sheer organza dupatta with golden scalloped border embroidery.'
  },

  // ── 21-30: Premium & Pexels Extended ──────────────────────
  {
    id: 21, name: 'AGVIA Midnight Blue Sequin Gown',
    category: 'Dresses & Gowns', categoryName: 'Dresses & Gowns',
    price: 5499, unit: 'piece', rating: 4.8, stock: 10, bestseller: true,
    image: '/images/pexels-ron-lach-8306359.jpg', imageUrl: '/images/pexels-ron-lach-8306359.jpg',
    description: 'Breathtaking sequin gown for grand festive galas and reception nights.'
  },
  {
    id: 22, name: 'AGVIA Ivory Georgette Kurta Set',
    category: 'Anarkalis & Kurtas', categoryName: 'Anarkalis & Kurtas',
    price: 2199, unit: 'set', rating: 4.3, stock: 32, bestseller: false,
    image: '/images/pexels-rdne-5698851.jpg', imageUrl: '/images/pexels-rdne-5698851.jpg',
    description: 'Flowy ivory georgette kurta set for summer celebrations and family gatherings.'
  },
  {
    id: 23, name: 'AGVIA Blush Pink Lace Dress',
    category: 'Dresses & Gowns', categoryName: 'Dresses & Gowns',
    price: 3299, unit: 'piece', rating: 4.6, stock: 14, bestseller: false,
    image: '/images/pexels-arina-krasnikova-5418894.jpg', imageUrl: '/images/pexels-arina-krasnikova-5418894.jpg',
    description: 'Romantic blush pink lace dress for engagements, photoshoots, and evening events.'
  },
  {
    id: 24, name: 'AGVIA Crimson Bridal Silk Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 7499, unit: 'piece', rating: 4.9, stock: 10, bestseller: true,
    image: '/images/pexels-duynod-19092930.jpg', imageUrl: '/images/pexels-duynod-19092930.jpg',
    description: 'Rich deep crimson bridal silk with intricate zari pallu for wedding ceremonies.'
  },
  {
    id: 25, name: 'AGVIA Contemporary Printed Kurti',
    category: 'Kurtis', categoryName: 'Kurtis',
    price: 1699, unit: 'piece', rating: 4.2, stock: 50, bestseller: false,
    image: '/images/pexels-arina-krasnikova-5418928.jpg', imageUrl: '/images/pexels-arina-krasnikova-5418928.jpg',
    description: 'Vibrant contemporary printed kurti with subtle embroidery for daily and casual wear.'
  },
  {
    id: 26, name: 'AGVIA Pearl White Sharara Set',
    category: 'Lehengas', categoryName: 'Lehengas',
    price: 4999, unit: 'set', rating: 4.7, stock: 18, bestseller: false,
    image: '/images/pexels-izafi-18600910.jpg', imageUrl: '/images/pexels-izafi-18600910.jpg',
    description: 'Pearlescent sharara set with intricate border detailing for mehndi and haldi ceremonies.'
  },
  {
    id: 27, name: 'AGVIA Terracotta Block Print Co-ord',
    category: 'Western Wear', categoryName: 'Western Wear',
    price: 2399, unit: 'set', rating: 4.1, stock: 28, bestseller: false,
    image: '/images/pexels-umudicreative-16440831.jpg', imageUrl: '/images/pexels-umudicreative-16440831.jpg',
    description: 'Earthy block-printed co-ord set for a bohemian and contemporary everyday look.'
  },
  {
    id: 28, name: 'AGVIA Olive Linen Palazzo Set',
    category: 'Western Wear', categoryName: 'Western Wear',
    price: 2799, unit: 'set', rating: 4.3, stock: 20, bestseller: false,
    image: '/images/pexels-matreding-13532891.jpg', imageUrl: '/images/pexels-matreding-13532891.jpg',
    description: 'Relaxed linen palazzo co-ord set offering effortless style for summer days.'
  },
  {
    id: 29, name: 'AGVIA Rose Organza Dupatta',
    category: 'Dupattas', categoryName: 'Dupattas',
    price: 1499, unit: 'piece', rating: 4.4, stock: 40, bestseller: false,
    image: '/images/bridal_dupatta.jpg', imageUrl: '/images/bridal_dupatta.jpg',
    description: 'Delicate rose-hued organza dupatta with golden embroidered motifs and tassel ends.'
  },
  {
    id: 30, name: 'AGVIA Zari Tissue Saree',
    category: 'Sarees', categoryName: 'Sarees',
    price: 5499, unit: 'piece', rating: 4.7, stock: 12, bestseller: true,
    image: '/images/classic_silk_saree.jpg', imageUrl: '/images/classic_silk_saree.jpg',
    description: 'Gossamer tissue saree with gold zari weave — designed for evening galas and receptions.'
  },
]

export const ORDERS = []

export const CUSTOMERS = []

export const REVIEWS = []

export const SALES_TREND = [
  { month: 'Apr', sales: 48000 },
  { month: 'May', sales: 67000 },
  { month: 'Jun', sales: 54000 },
  { month: 'Jul', sales: 89000 },
  { month: 'Aug', sales: 112000 },
  { month: 'Sep', sales: 95000 },
]

export const OFFERS = []
