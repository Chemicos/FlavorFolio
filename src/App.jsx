// import { useEffect, useState } from 'react'
import Login from './components/Login'
import Home from './components/Home'
import Cookies from 'universal-cookie'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Register from './components/Register'

const cookies = new Cookies()

function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // useEffect(() => {
  //   const authToken = cookies.get('auth-token');
  //   if (authToken) {
  //     setIsAuthenticated(true);
  //   }
  // }, [])

  const isAuthenticated = !!cookies.get('auth-token')

  // const handleAuthentication = (isUserAuthenticated) => {
  //   setIsAuthenticated(isUserAuthenticated);
  // }

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


    // <div className="">
    //   { isAuthenticated ? 
    //   <Home /> : 
    //   <Login onAuthenticate={handleAuthentication} /> 
    //   }
    // </div>
  )
}

export default App
