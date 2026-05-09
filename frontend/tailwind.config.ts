import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        paperlogy: ['Paperlogy', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
