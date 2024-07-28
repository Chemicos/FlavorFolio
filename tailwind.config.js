/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        'ff-form': '#FDD9A4',
        "ff-close": '#ED6B28',
        "dark-bg": '#0E1217',
        "dark-content": '#1C1F26',
        "dark-btn": '#FFFFFF',
        "dark-border": '#A8B3CF',
        "dark-elements": '#1A1F25',
        "dark-highlight": '#20262D'
      },
      textColor: {
        'ff-flavor': '#02650C',
        'ff-folio': '#943500',
        'ff-googlebtn': '#0E0C22',
        'ff-blue': '#036CB8',
        'ff-placeholder': '#8F8A81',
        'ff-btn': '#FEAA2B',
        "dark-bg": '#0E1217',
        "dark-content": '#1C1F26',
        "dark-btn": '#FFFFFF',
        "dark-border": '#A8B3CF',
        "dark-highlight": '#20262D'
      },
      width: {
        '420': '420px',
        '140': '140px',
        'responsive-sm': '520px'
      },
      height: {
        '1px': '1px',
        'content': '700px',
        'post-form': '92%'
      },
      borderColor: {
        'ff-googlebtn': '#0E0C22',
        'ff-btn': '#FEAA2B',
        "dark-bg": '#0E1217',
        "dark-content": '#1C1F26',
        "dark-btn": '#FFFFFF',
        "dark-border": '#A8B3CF'
      },
      boxShadow: {
        'input': '0 0 3px 3px #FEAA2B',
        'input-error': '0 0 3px 3px rgb(239 68 68)'
      }
    },
  },
  plugins: [],
}

