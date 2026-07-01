/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'hwtArtz': ['myriad-vf', 'sans-serif'],
        'ubuntu': ['Ubuntu', 'sans-serif'],
        'myriad-vf': ['Myriad VF', 'sans-serif'],
        'filson-soft': ['Filson Soft', 'Filson Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

