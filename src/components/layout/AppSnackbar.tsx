import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded"
import InfoRoundedIcon from "@mui/icons-material/InfoRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { Alert, Snackbar } from "@mui/material"

export type SnackbarType = | "success" | "error" | "warning" | "info"

interface AppSnackbarProps {
  open: boolean
  type: SnackbarType
  message: string
  onClose: () => void
}

const snackbarConfig = {
  success: {
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "bg-emerald-500/10 text-emerald-300",
    borderClass: "border-emerald-400/20",
  },
  error: {
    icon: <ErrorRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "bg-red-500/10 text-red-300",
    borderClass: "border-red-400/20",
  },
  warning: {
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "bg-orange-500/10 text-orange-200",
    borderClass: "border-orange-400/20",
  },
  info: {
    icon: <InfoRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "bg-sky-500/10 text-sky-300",
    borderClass: "border-sky-400/20",
  },
}

export default function AppSnackbar({
    open,
    type,
    message,
    onClose,
}:AppSnackbarProps) {
    const config = snackbarConfig[type]

    return (
        <Snackbar
            open={open}
            autoHideDuration={4000}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            sx={{ zIndex: 9999 }}
            >
            <div
                className={[
                "flex min-w-[340px] max-w-[440px] items-start gap-3 rounded-2xl border bg-[#1b1d22] px-4 py-3 text-[#d7def0]",
                "shadow-[0_24px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl",
                config.borderClass,
                ].join(" ")}
            >
                <div
                className={[
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    config.iconClass,
                ].join(" ")}
                >
                {config.icon}
                </div>

                <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                    {type === "success"
                    ? "Success"
                    : type === "error"
                        ? "Something went wrong"
                        : type === "warning"
                        ? "Warning"
                        : "Info"}
                </p>

                <p className="mt-0.5 text-sm leading-5 text-[#a8b3cf]">
                    {message}
                </p>
                </div>

                <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close snackbar"
                >
                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                </button>
            </div>
        </Snackbar>
    )
}
