/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. 字体配置 (配合 Geist 字体)
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      // 2. 颜色系统
      colors: {
        // 品牌主色 (Violet - 代表 AI 与 跨境)
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // 主按钮、高亮文字
          700: '#6d28d9', // 悬停状态
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // 辅助色 (Rose - 用于家纺产品的温馨提示/促销)
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // 中性色 (Zinc - 高级灰，用于文字和边框)
        gray: {
          50: '#fafafa', // 页面背景
          100: '#f4f4f5', // 卡片背景/Hover
          200: '#e4e4e7', // 边框
          300: '#d4d4d8',
          400: '#a1a1aa', // 次要文字
          500: '#71717a',
          600: '#52525b', // 正文
          700: '#3f3f46',
          800: '#27272a', // 标题
          900: '#18181b',
        }
      },
      // 3. 圆角系统 (更圆润，更有亲和力)
      borderRadius: {
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px - 卡片标准圆角
        '3xl': '1.5rem',    // 24px - 模态框/大容器
      },
      // 4. 阴影系统 (更柔和)
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(124, 58, 237, 0.3)', // 品牌色发光
      }
    },
  },
  plugins: [],
}
