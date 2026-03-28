// import { useEffect, useState } from 'react'
import Home from './features/home/pages/Home'
// import Cookies from 'universal-cookie'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import PendingRecipes from './components/PendingRecipes'
import ProfilePage from './components/myProfile/ProfilePage'
import AccountSettings from './components/AccountSettings/AccountSettings'
import ViewUserProfile from './components/UsersProfile/ViewUserProfile'
import Dashboard from './components/DashboardAdmin/Dashboard'
import ManageFeedback from './components/Feedback/ManageFeedback'
import Register from './features/auth/pages/Register'
import Login from './features/auth/pages/Login'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from './firebase-config'

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser)
    })
    
    return () => unsubscribe()
  }, [])

  if (user === undefined) {
    return <div className='min-h-screen bg-[#0b0b0c]'></div>
  }

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={user ? <Navigate replace to="/home" /> : <Login />} />
          {/* <Route path="/register" element={user ? <Navigate replace to="/home" /> : <Register />} /> */}
          <Route path="/home" element={user ? <Home /> : <Navigate replace to="/" />} />
          <Route path='/pending' element={user ? <PendingRecipes /> : <Navigate replace to="/" />} />
          <Route path='/profile' element={user ? <ProfilePage /> : <Navigate replace to="/" />} />
          <Route path='/settings' element={user ? <AccountSettings /> : <Navigate replace to="/" />} />
          <Route path='/userProfile/:userId' element={user ? <ViewUserProfile /> : <Navigate replace to="/" />} />
          <Route path='/dashboard' element={user ? <Dashboard /> : <Navigate replace to="/" />} />
          <Route path='/manage-feedback' element={user ? <ManageFeedback /> : <Navigate replace to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
