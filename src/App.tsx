// import { useEffect, useState } from 'react'
import Home from './features/home/pages/Home'
// import Cookies from 'universal-cookie'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// import PendingRecipes from './components/PendingRecipes'
// import ProfilePage from './components/myProfile/ProfilePage'
// import AccountSettings from './components/AccountSettings/AccountSettings'
// import ViewUserProfile from './components/UsersProfile/ViewUserProfile'
// import Dashboard from './components/DashboardAdmin/Dashboard'
import ManageFeedback from './components/Feedback/ManageFeedback'
// import Register from './features/auth/pages/Register'
import Login from './features/auth/pages/Login'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from './firebase-config'
import PendingRecipesPage from './features/recipe-review/pages/PendingRecipesPage'
import NeedsRevisionPage from './features/needs-revision/pages/NeedsRevisionPage'
import MyProfilePage from './features/profile/pages/MyProfilePage'
import UserProfilePage from './features/profile/pages/UserProfilePage'
import AccountSettingsPage from './features/account-settings/pages/AccountSettingsPage'
import AdminDashboardPage from './features/admin-dashboard/pages/AdminDashboardPage'
import AdminRecipesPage from './features/admin-dashboard/pages/AdminRecipesPage'

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
          <Route path="/home" element={user ? <Home /> : <Navigate replace to="/" />} />
          <Route path='/pending' element={user ? <PendingRecipesPage /> : <Navigate replace to="/" />} />
          <Route path='/needs-revision' element={user ? <NeedsRevisionPage /> : <Navigate replace to="/" />} />
          <Route path='/profile' element={user ? <MyProfilePage /> : <Navigate replace to="/" />} />
          <Route path="/users/:userId" element={user ? <UserProfilePage /> : <Navigate replace to="/" />} />
          <Route path='/settings' element={user ? <AccountSettingsPage /> : <Navigate replace to="/" />} />
          <Route path='/admin/dashboard' element={user ? <AdminDashboardPage/> : <Navigate replace to="/" />} />
          <Route path="/admin/recipes" element={user ? <AdminRecipesPage /> : <Navigate replace to="/" />}/>
          <Route path='/manage-feedback' element={user ? <ManageFeedback /> : <Navigate replace to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
