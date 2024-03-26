/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        'ff-bg': '#F0DDC0',
        'ff-btn': '#FEAA2B',
        'ff-googlebtn': '#0E0C22',
        'ff-search': '#EFE6D7',
        'ff-content': '#FFE4BC',
        'ff-form': '#FDD9A4'
      },
      textColor: {
        'ff-flavor': '#02650C',
        'ff-folio': '#943500',
        'ff-googlebtn': '#0E0C22',
        'ff-blue': '#036CB8',
        'ff-placeholder': '#8F8A81'
      },
      width: {
        '420': '420px',
        '140': '140px'
      },
      height: {
        '1px': '1px',
        'content': '700px'
      },
      borderColor: {
        'ff-googlebtn': '#0E0C22',
        'ff-btn': '#FEAA2B'
      },
      boxShadow: {
        'input': '0 0 3px 3px #FEAA2B',
        'input-error': '0 0 3px 3px rgb(239 68 68)'
      }
    },
  },
  plugins: [],
}

