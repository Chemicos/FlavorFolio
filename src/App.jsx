// import { useEffect, useState } from 'react'
import Login from './components/Login'
import Home from './components/Home'
import Cookies from 'universal-cookie'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Register from './components/Register'

const cookies = new Cookies()

function App() {

  //TODO: de scos cookie-urile
  const isAuthenticated = !!cookies.get('auth-token')

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate replace to="/home" /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
