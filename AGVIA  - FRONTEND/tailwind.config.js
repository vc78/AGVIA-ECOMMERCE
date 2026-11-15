/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official NOOLU Brand Color System
        noolu: {
          maroon: '#800020', // Official Deep Maroon
          'maroon-deep': '#5A0016',
          'maroon-rich': '#9B1135',
          gold: '#F5B900', // Official Loom Gold
          'gold-soft': '#F7C93E',
          'gold-light': '#FCE9A6',
          'gold-dark': '#C69500',
          ivory: '#FFF8EB', // Official Ivory
          charcoal: '#211B1B', // Official Charcoal
          rose: '#C98D91', // Official Muted Rose
          beige: '#E8D8C3', // Official Warm Beige
          text: '#211B1B',
          muted: '#6E6259',
          border: '#E8D8C3',
        },
        // Backwards-compatible brand mappings
        agvia: {
          burgundy: '#800020',
          'burgundy-deep': '#5A0016',
          'burgundy-rich': '#9B1135',
          'burgundy-soft': '#B0264A',
          gold: '#F5B900',
          'gold-soft': '#F7C93E',
          'gold-light': '#FCE9A6',
          'gold-dark': '#C69500',
          ivory: '#FFF8EB',
          cream: '#FFF8EB',
          blush: '#C98D91',
          text: '#211B1B',
          muted: '#6E6259',
          border: '#E8D8C3',
        },
        burgundy: {
          DEFAULT: '#800020',
          deep: '#5A0016',
          rich: '#9B1135',
          soft: '#B0264A',
        },
        maroon: {
          DEFAULT: '#800020',
          light: '#9B1135',
          dark: '#5A0016',
        },
        gold: {
          DEFAULT: '#F5B900',
          light: '#FCE9A6',
          dark: '#C69500',
        },
        ivory: '#FFF8EB',
        cream: '#FFF8EB',
        blush: '#C98D91',
        chocolate: '#211B1B',
        beige: '#E8D8C3',
        charcoal: '#211B1B',
        accent: '#F5B900',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        body: ['"Inter"', '"Manrope"', 'sans-serif'],
        sans: ['"Inter"', '"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(128, 0, 32, 0.08)',
        luxury: '0 20px 40px -15px rgba(33, 27, 27, 0.07)',
      },
    },
  },
  plugins: [],
}
