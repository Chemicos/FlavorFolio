import Home from './features/home/pages/Home'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import AdminUsersPage from './features/admin-dashboard/pages/AdminUsersPage'
import AdminReportsPage from './features/admin-dashboard/pages/AdminReportsPage'
import MessagesPage from './features/messages/pages/MessagesPage'
import ReelsPage from './features/reels/pages/ReelsPage'
import PresenceHeartbeat from './features/messages/components/PresenceHeartbeat'
import AppThemeController from './features/account-settings/components/AppThemeController'
import AppLayout from './AppLayout'

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser)
    })
    
    return () => unsubscribe()
  }, [])

  return (
    <>
      <AppThemeController />
    
      {user === undefined ? (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200" />
      ): (
      <Router>
        <PresenceHeartbeat currentUserId={user?.uid} />
        
          <Routes>
            <Route path='/' element={user ? <Navigate replace to="/home" /> : <Login />} />

            {user && (
              <Route element={<AppLayout />}>
                <Route path='/home' element={<Home />} />
                <Route path='/reels' element={<ReelsPage />} />
                <Route path='/pending' element={<PendingRecipesPage />} />
                <Route path='/needs-revision' element={<NeedsRevisionPage />} />
                <Route path='/profile' element={<MyProfilePage />} />
                <Route path='/users/:userId' element={<UserProfilePage />} />
                <Route path='/settings' element={<AccountSettingsPage />} />
                <Route path='/admin/dashboard' element={<AdminDashboardPage />} />
                <Route path='/admin/recipes' element={<AdminRecipesPage />} />
                <Route path='/admin/users' element={<AdminUsersPage />} />
                <Route path='/admin/reports' element={<AdminReportsPage />} />
                <Route path='/messages' element={<MessagesPage />} />
                <Route path='/messages/:conversationId' element={<MessagesPage />} />
              </Route>
            )}

            {!user && (
              <Route path='*' element={<Navigate replace to="/" />} />
            )}
          </Routes>
      </Router>
      )}
    </>

  )
}

export default App
