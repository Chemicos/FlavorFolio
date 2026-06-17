import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

import SnackbarProvider from "./components/layout/SnackbarProvider"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SnackbarProvider>
      <App />
    </SnackbarProvider>
  </React.StrictMode>,
)
