/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色板：奶油/暖咖/柔杏
        brand: {
          creamy: '#fcfbf9',
          coffee: '#443d3a',
          apricot: '#fdf3e7',
          warm: '#9e8a78',
          sunlight: '#fff9f0',
        },
      },
      fontFamily: {
        serif: ['var(--font-geist-mono)', 'serif'], // 使用 Geist Mono 作为 Serif 的替代或引入真实的 Serif 字体
        sans: ['var(--font-geist-sans)', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'magazine': '0 10px 40px -10px rgba(158, 138, 120, 0.15)', // 杂志感阴影
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
