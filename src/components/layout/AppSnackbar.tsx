import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded"
import InfoRoundedIcon from "@mui/icons-material/InfoRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import { Alert, Snackbar } from "@mui/material"

export type SnackbarType = | "success" | "error" | "warning" | "info"

interface AppSnackbarProps {
  open: boolean
  type: SnackbarType
  message: string
  onClose: () => void
}

const icons = {
  success: <CheckCircleRoundedIcon />,
  error: <ErrorRoundedIcon />,
  warning: <WarningAmberRoundedIcon />,
  info: <InfoRoundedIcon />,
}

export default function AppSnackbar({
    open,
    type,
    message,
    onClose,
}:AppSnackbarProps) {
  return (
    <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={onClose}
        anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
        }}
        sx={{
            zIndex: 9999
        }}
    >
        <Alert
            severity={type}
            icon={icons[type]}
            variant="filled"
            onClose={onClose}
            sx={{
                minWidth: 320,
                borderRadius: "12px", 
            }}
        >
            {message}
        </Alert>
    </Snackbar>
  )
}
