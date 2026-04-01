/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chess-light': '#EBECD0',
        'chess-dark': '#779556',
        'chess-accent': '#81B64C',
      }
    },
  },
  plugins: [],
}
