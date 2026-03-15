import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import IconButton from "@mui/material/IconButton"
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import Button from "@mui/material/Button"
import PasswordStrength from "./PasswordStrength.js"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "../../../../firebase-config.js"
import { doc, serverTimestamp, setDoc } from "@firebase/firestore"

const muiFieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(168,179,207,0.50)", // label color
  },
  "&:hover .MuiInputLabel-root": {
    color: "rgba(168,179,207,1.00)", // label on hover
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgba(168,179,207,1.00)", // label on focus
  },
  
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(168,179,207,0.20)", // outline color
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(168,179,207,1.00)", // outline color on hover
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(168,179,207,1.00)", //outline focus
  },
  "& .MuiInputBase-input": {
    color: "rgba(255,255,255,100)", //input color
  },
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

const passwordCriteria = (password: string) => [
  { id: "minLength", text: "Use at least 8 characters", isValid: password.length >= 8 },
  { id: "upperCase", text: "Add at least 1 uppercase letter", isValid: /[A-Z]/.test(password) },
  { id: "number", text: "Add at least 1 number", isValid: /[0-9]/.test(password) },
  { id: "specialChar", text: "Add a special character (!@#$...)", isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
]

export default function SignUpForm() {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [loading, setLoading] = useState(false)

    const canTogglePassword = useMemo(() => password.length > 0, [password])
    const canToggleConfirm = useMemo(() => confirm.length > 0, [confirm])

    const criteria = useMemo(() => passwordCriteria(password), [password])
    const passedCount = useMemo(() => criteria.filter((c) => c.isValid).length, [criteria])
    const passwordOk = passedCount === 4

    const passwordsMatch = confirm.length === 0 ? true : password === confirm
    const confirmOk = confirm.length > 0 && passwordsMatch

    const usernameOk = username.trim().length >= 3
    const emailOk = isValidEmail(email)

    const isFormValid =
    usernameOk &&
    emailOk &&
    passwordOk &&
    confirmOk &&
    !loading

    const handleSignUp = async (e: { preventDefault: () => void }) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)
        try {
            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

            const user = cred.user
            await updateProfile( user, {displayName: username.trim() })

            await setDoc(doc(db, "users", user.uid), {
                userId: user.uid,
                username: username.trim(),
                email: user.email,
                admin: false,
                createdAt: serverTimestamp(),
            })

            sessionStorage.setItem("authFeedback", JSON.stringify({
                type: "success",
                message: "Your account has been created successfully."
            }))

            setUsername("")
            setEmail("")
            setPassword("")
            setConfirm("")

            navigate("/home")
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

  return (
    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-5 mt-12">

            <TextField
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value)
                }}
                label="Username"
                fullWidth
                sx={muiFieldSx}
                error={username.length > 0 && !usernameOk}
            />

            <TextField
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                }}
                label="Email address"
                type="email"
                fullWidth
                autoComplete="email"
                sx={muiFieldSx}
                error={email.trim().length > 0 && !emailOk}
            />

            <div className="flex flex-col gap-1">
                <TextField
                    value={password}
                    onChange={(e) => {
                    setPassword(e.target.value)
                    }}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
                    sx={muiFieldSx}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            edge="end"
                            disabled={!canTogglePassword}
                            onClick={() => setShowPassword((v) => !v)}
                            sx={{
                            color: "rgba(168,179,207,0.7)",
                            "&:hover": { color: "rgba(168,179,207,1.00)" },
                            "&.Mui-disabled": { color: "rgba(168,179,207,0.25)" },
                            }}
                        >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        </InputAdornment>
                    ),
                    }}
                />
                {password && (<PasswordStrength password={password} />)}
            </div>
            <div className="flex flex-col gap-1">
                <TextField
                    value={confirm}
                    onChange={(e) => {
                    setConfirm(e.target.value)
                    }}
                    label="Confirm password"
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
                    error={!passwordsMatch}
                    sx={muiFieldSx}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            edge="end"
                            disabled={!canToggleConfirm}
                            onClick={() => setShowConfirm((v) => !v)}
                            sx={{
                            color: "rgba(168,179,207,0.7)",
                            "&:hover": { color: "rgba(168,179,207,1.00)" },
                            "&.Mui-disabled": { color: "rgba(168,179,207,0.25)" },
                            }}
                        >
                            {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        </InputAdornment>
                    ),
                    }}
                />
                {!passwordsMatch && (<p className="text-red-400/80 text-xs">Passwords do not match</p>)}
            </div>
        </div>

        <Button
            type="submit"
            fullWidth
            loading={loading}
            loadingPosition="start"
            variant="text"
            disabled={!isFormValid}
            sx={{
            textTransform: "none",
            marginTop: "12px",
            borderRadius: "8px",
            py: "12px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#e17e00",
            border: "1px solid transparent",
            "&:hover": { borderColor: "#e17e00", backgroundColor: "transparent" },
            "&:active": { backgroundColor: "#e17e00", borderColor: "#e17e00", color: "#fff" },
            "&.Mui-disabled": { color: "rgba(225,126,0,0.5)" },
            "& .MuiCircularProgress-root": { color: "#e17e00" },
            }}
        >
            Sign up
        </Button>
    </form>
  )
}
