/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mozilla: ["Mozilla Headline", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
      keyframes: {
        seesaw: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '16.66%': { transform: 'rotate(3deg) scale(1.05)' },
          '33.33%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(-3deg) scale(1.05)' },
          '66.66%': { transform: 'rotate(0deg) scale(1)' },
          '83.33%': { transform: 'rotate(3deg) scale(1.05)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        chipBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        shakeOnce: 'seesaw 0.3s ease-in-out',
        slideIn: 'slideIn 0.5s ease-out forwards',
        fadeOut: 'fadeOut 0.5s ease-out forwards',
        chipBounce: 'chipBounce 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
