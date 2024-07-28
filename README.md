# React + Vite
SETUP: 

# Step 1: 
npm create vite@latest project_name -- --template react
cd .
npm install

# Step 2: Firebase
npm install firebase
npm install firebase universal-cookie
npm install @firebase/firestore


# Step3: Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

//Configure your template paths. Add the paths to all of your template files in your tailwind.config.js file:
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

//Add the Tailwind directives to your CSS. Add the @tailwind directives for each of Tailwind’s layers to your ./src/index.css file:
@tailwind base;
@tailwind components;
@tailwind utilities;

# Step 4: FontAwsome
npm i --save @fortawesome/fontawesome-svg-core
npm i --save @fortawesome/free-solid-svg-icons
npm i --save @fortawesome/free-regular-svg-icons
npm i --save @fortawesome/free-brands-svg-icons
npm i --save @fortawesome/react-fontawesome@latest

# Step 5: React-Router
npm install react-router-dom

# Step 6: jsPDF
npm install jspdf jspdf-autotable
