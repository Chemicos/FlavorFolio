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
  action?: {label: string, onClick: () => void}
  onClose: () => void
}

const snackbarConfig = {
  success: {
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]",
    borderClass: "border-[var(--success-border)]",
  },
  error: {
    icon: <ErrorRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]",
    borderClass: "border-[var(--danger-border)]",
  },
  warning: {
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "border border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]",
    borderClass: "border-[var(--warning-border)]",
  },
  info: {
    icon: <InfoRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: "border border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]",
    borderClass: "border-[var(--info-border)]",
  },
}

export default function AppSnackbar({
    open,
    type,
    message,
    action,
    onClose,
}:AppSnackbarProps) {
    const config = snackbarConfig[type]

    return (
        <Snackbar
            open={open}
            autoHideDuration={action ? 7000 : 4000}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            sx={{ zIndex: 9999 }}
            >
            <div
                className={[
                    "flex w-full min-w-0 items-start gap-3 rounded-2xl border px-4 py-3",
                    "bg-[var(--bg-elevated)] text-[var(--text-primary)]",
                    "shadow-[var(--shadow-dropdown)] transition-colors duration-200",
                    "sm:min-w-[340px] sm:max-w-[440px]",
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
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {type === "success"
                        ? "Success"
                        : type === "error"
                            ? "Something went wrong"
                            : type === "warning"
                            ? "Warning"
                            : "Info"}
                    </p>

                    <p className="mt-0.5 text-sm leading-5 text-[var(--text-secondary)]">
                        {message}
                    </p>

                    {action && (
                        <button
                            type="button"
                            onClick={() => {
                                action.onClick()
                                onClose()
                            }}
                            className="mt-2 text-sm font-semibold text-[var(--accent-text)] transition hover:text-[var(--accent-hover)]"
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-95"
                aria-label="Close snackbar"
                >
                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                </button>
            </div>
        </Snackbar>
    )
}
