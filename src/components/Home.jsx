import { getAuth, signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import Cookies from "universal-cookie"

const cookies = new Cookies()
const auth = getAuth()

export default function Home() {
  let navigate = useNavigate()

  const signOutUser = () => {
    signOut(auth).then(() => {
      cookies.remove('auth-token')
      navigate("/")
    }).catch((error) => {
      console.error("Sign out error", error)
    })
  }

  return (
    <div>
      Welcome to FlavorFolio
      <button onClick={signOutUser}>Sign out</button>
    </div>
  )
}
