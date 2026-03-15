import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { useEffect, useMemo, useState } from "react"
import { auth, provider } from "../../../../firebase-config"
import { getAuthErrorMessage } from "../../utils/authErrorMessages"

import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import IconButton from "@mui/material/IconButton"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import googleIcon from '../../../../assets/google-icon.webp'

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

export default function SignInForm() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    const [showPassword, setShowPassword] = useState(true)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const canTogglePassword = useMemo(() => password.length > 0, [password])

    const getSelectedPersistence = () => {
        return rememberMe ? browserLocalPersistence : browserSessionPersistence
    }

    // ascunde showPasswordIcon
    useEffect(() => {
        if (!password) setShowPassword(false)
    }, [password])

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (loading || googleLoading) return

        setError("")
        setLoading(true)
        try {
            await setPersistence(auth, getSelectedPersistence())
            await signInWithEmailAndPassword(auth, email, password)

            sessionStorage.setItem("authFeedback", JSON.stringify({
                type: "success",
                message: "Welcome back! You have signed in successfully."
            }))

            navigate("/home")
        } catch (err) {
            setError(getAuthErrorMessage(err))
            console.error(err)
        }
        finally {
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        if (googleLoading || loading) return

        setError("")
        setGoogleLoading(true)
        try {
            await setPersistence(auth, getSelectedPersistence())
            await signInWithPopup(auth, provider)

            sessionStorage.setItem(
                "authFeedback",
                JSON.stringify({
                    type: "success",
                    message: "Signed in with Google successfully."
                })
            )

            navigate("/home")
        } catch (err) {
            setError(getAuthErrorMessage(err))
            console.error(err)
        } finally {
            setGoogleLoading(false)
        }
    }
  return (
    <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-6 mt-14">
            {error && (
            <div className="w-full rounded-lg border text-sm border-red-500/25 bg-red-500/10 px-4 py-3 text-red-400">
                {error}
            </div>
            )}
            <TextField
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                }}
                label="Email address"
                type="email"
                variant="outlined"
                fullWidth
                autoComplete="email"
                sx={muiFieldSx}
            />

            <TextField
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("")
                }}
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                autoComplete="current-password"
                variant="outlined"
                InputProps={{
                    endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                        edge="end"
                        disabled={!canTogglePassword}
                        onClick={() => setShowPassword((v) => !v)}
                        sx={{
                            color: "rgba(168,179,207,1.0)",
                            "&:hover": { color: "rgba(168,179,207,1.00)" },
                            "&.Mui-disabled": { color: "rgba(168,179,207,0.25)" },
                            
                        }}
                        >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </InputAdornment>
                    ),
                }}
                sx={muiFieldSx}
            />
        </div>

        <div className="flex items-center justify-between">
            <FormControlLabel
            control={
                <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{
                    color: "rgba(168,179,207,0.50)",
                    "&.Mui-checked": { color: "#f59e0b" },
                }}
                />
            }
            label={<span className="text-[#a8b3cf]/70 hover:text-white transition text-sm">Remember me</span>}
            />

            <button
            type="button"
            className="text-[#a8b3cf]/55 hover:text-white/85 transition text-sm hover:underline underline-offset-4"
            // onClick={() => navigate("/forgot-password")}
            >
            Forgot password?
            </button>
        </div>

        <Button
            type="submit"
            fullWidth
            loading={loading}
            loadingPosition="start"
            variant="text"
            sx={{
            textTransform: "none",
            borderRadius: "8px",
            py: "12px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#e17e00",
            border: "1px solid transparent",

            "&:hover": {
                borderColor: "#e17e00",
                backgroundColor: "transparent",
            },

            "&:active": {
                backgroundColor: "#e17e00",
                borderColor: "#e17e00",
                color: "#fff",
            },

            "&.Mui-disabled": {
                color: "rgba(225,126,0,0.5)",
            },

            // culoarea spinnerului
            "& .MuiCircularProgress-root": {
                color: "#e17e00",
            },
            }}
        >
            Sign in
        </Button>

        <div className="flex items-center m-auto gap-3 my-2">
            <div className="h-px w-5 flex-1 bg-[#a8b3cf]/30" />
            <span className="text-[#3f424a] text-md">OR</span>
            <div className="h-px w-5 flex-1 bg-[#a8b3cf]/30" />
        </div>

        <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full rounded-lg border border-[#3f424a] bg-[#0b0b0c]/40 hover:bg-[#16181d] transition px-4 py-3 flex items-center justify-center gap-3 text-white/90 disabled:opacity-60"
        >
            {googleLoading ? (
            <CircularProgress size={18} sx={{color: "#a8b3cf"}} />
            ) : (
            <img className="w-5 h-5" src={googleIcon} alt="google-icon" />
            )}
            <span className="text-[15px] text-[#a8b3cf]">
            {googleLoading ? "Signing in..." : "Sign in with Google"}
            </span>
        </button>
    </form>
  )
}
