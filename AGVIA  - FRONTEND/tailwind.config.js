/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official Lokesh Lingam Weaver Brand System
        weaver: {
          maroon: '#651B2B',
          'maroon-deep': '#4A111D',
          'maroon-rich': '#7D2437',
          gold: '#B58A45',
          'gold-soft': '#C9A15E',
          'gold-light': '#E7D4B9',
          'gold-dark': '#8F6A2E',
          ivory: '#FBF5EA',
          beige: '#E7D4B9',
          brown: '#38271F',
          green: '#65704B',
          muted: '#6E5A4F',
          border: '#E7D4B9',
        },
        burgundy: {
          DEFAULT: '#651B2B',
          deep: '#4A111D',
          rich: '#7D2437',
          soft: '#8E3548',
        },
        maroon: {
          DEFAULT: '#651B2B',
          light: '#7D2437',
          dark: '#4A111D',
        },
        gold: {
          DEFAULT: '#B58A45',
          light: '#E7D4B9',
          dark: '#8F6A2E',
        },
        ivory: '#FBF5EA',
        cream: '#FBF5EA',
        blush: '#E7D4B9',
        chocolate: '#38271F',
        beige: '#E7D4B9',
        charcoal: '#38271F',
        accent: '#B58A45',
        sage: '#65704B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        body: ['"Manrope"', '"Poppins"', 'sans-serif'],
        sans: ['"Manrope"', '"Poppins"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(101, 27, 43, 0.08)',
        luxury: '0 20px 40px -15px rgba(56, 39, 31, 0.09)',
      },
    },
  },
  plugins: [],
}
