// import { useEffect, useState } from 'react'
import Login from './components/Login'
import Home from './components/Home'
import Cookies from 'universal-cookie'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Register from './components/Register'
import PendingRecipes from './components/PendingRecipes'
import ProfilePage from './components/myProfile/ProfilePage'
import AccountSettings from './components/AccountSettings/AccountSettings'
import ViewUserProfile from './components/UsersProfile/ViewUserProfile'
import Dashboard from './components/DashboardAdmin/Dashboard'
import ManageFeedback from './components/Feedback/ManageFeedback'

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
          <Route path='/pending' element={<PendingRecipes />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/settings' element={<AccountSettings />} />
          <Route path='/userProfile/:userId' element={<ViewUserProfile />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/manage-feedback' element={<ManageFeedback />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
