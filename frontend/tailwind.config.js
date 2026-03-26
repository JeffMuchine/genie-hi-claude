/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6F38C5',
          secondary: '#87A2FB',
          hover: '#ADDDD0',
          error: '#FF5555',
          success: '#3DB6B1',
          disabled: '#EEEEEE',
        },
      },
    },
  },
  plugins: [],
}

