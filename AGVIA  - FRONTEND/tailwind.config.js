/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official AGVIA Brand System
        agvia: {
          burgundy: '#5A1020',
          'burgundy-deep': '#420B16',
          'burgundy-rich': '#7A1F32',
          'burgundy-soft': '#943147',
          gold: '#C9A45C',
          'gold-soft': '#D8B978',
          'gold-light': '#EBD7A7',
          'gold-dark': '#9A7836',
          ivory: '#FAF7F2',
          cream: '#F2ECE4',
          blush: '#E8C7C3',
          text: '#211D1E',
          muted: '#756B6C',
          border: '#E4D8D2',
        },
        burgundy: {
          DEFAULT: '#5A1020',
          deep: '#420B16',
          rich: '#7A1F32',
          soft: '#943147',
        },
        maroon: {
          DEFAULT: '#5A1020',
          light: '#7A1F32',
          dark: '#420B16',
        },
        gold: {
          DEFAULT: '#C9A45C',
          light: '#D8B978',
          dark: '#9A7836',
        },
        ivory: '#FAF7F2',
        cream: '#FAF7F2',
        blush: '#E8C7C3',
        chocolate: '#211D1E',
        beige: '#F2ECE4',
        charcoal: '#211D1E',
        accent: '#C9A45C',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        body: ['"Manrope"', '"Poppins"', 'sans-serif'],
        sans: ['"Manrope"', '"Poppins"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(90, 16, 32, 0.08)',
        luxury: '0 20px 40px -15px rgba(33, 29, 30, 0.07)',
      },
    },
  },
  plugins: [],
}
