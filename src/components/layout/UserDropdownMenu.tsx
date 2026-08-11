import { 
    Box,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem
} from "@mui/material"

import PersonIcon from "@mui/icons-material/Person"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"
import BlockIcon from "@mui/icons-material/Block"
import BarChartIcon from "@mui/icons-material/BarChart"
import SettingsIcon from "@mui/icons-material/Settings"
import LogoutIcon from "@mui/icons-material/Logout"
import { useLocation } from "react-router-dom"

export interface UserDropdownMenuProps {
    anchorEl: HTMLElement | null
    open: boolean
    onClose: () => void
    onProfile: () => void
    onPending: () => void
    onNeedsRevision: () => void
    onDashboard: () => void
    onFeedbacks: () => void
    onSettings: () => void
    onSignOut: () => void
    isAdmin: boolean
    pendingCount?: number
    feedbackCount?: number
    needsRevisionCount?: number
}

interface MenuActionItemProps {
    icon: React.ReactNode
    label: string
    onClick: () => void
    selected?: boolean
    badgeCount?: number
    danger?: boolean
}

function MenuActionItem({
  icon,
  label,
  onClick,
  selected = false,
  badgeCount,
  danger = false,
}: MenuActionItemProps) {
  return (
    <MenuItem
      onClick={onClick}
      selected={selected}
      sx={{
        minHeight: 48,
        borderRadius: "12px",
        mx: 1,
        my: 0.25,
        px: 1.5,
        color: danger ? "var(--danger-text)" : "var(--text-primary)",
        "& .MuiListItemIcon-root": {
          minWidth: 34,
          color: danger ? "var(--danger)" : "var(--text-secondary)",
          transition: "color 160ms ease",
        },
        "&:hover": {
          backgroundColor: danger
            ? "var(--danger-soft)"
            : "var(--accent-soft)",
          color: danger ? "var(--danger-text)" : "var(--accent-text)",
          borderColor: danger
            ? "rgba(248,113,113,0.20)"
            : "rgba(254,170,43,0.20)",
        },
        "&:hover .MuiListItemIcon-root": {
          color: danger ? "var(--danger)" : "var(--accent)",
        },
        "&.Mui-selected": {
          backgroundColor: "var(--accent-soft)",
          color: "var(--accent-text)",
        },
        "&.Mui-selected:hover": {
          backgroundColor: "var(--accent-soft-hover)",
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>

      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 13,
          fontWeight: 500,
          color: "inherit",
        }}
      />

      {typeof badgeCount === "number" && badgeCount > 0 && (
        <Box
          sx={{
            minWidth: 22,
            height: 22,
            px: 0.75,
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-on-accent)",
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 18px var(--accent-soft-hover)",
          }}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </Box>
      )}
    </MenuItem>
  )
}

export default function UserDropdownMenu({
    anchorEl,
    open,
    onClose,
    onProfile,
    onPending,
    onNeedsRevision,
    onDashboard,
    onFeedbacks,
    onSettings,
    onSignOut,
    isAdmin,
    pendingCount = 0,
    feedbackCount = 0,
    needsRevisionCount = 0,
}: UserDropdownMenuProps) {
  const location = useLocation()
  return (
    <Menu 
        anchorEl={anchorEl} 
        open={open} 
        onClose={onClose} 
        transformOrigin={{horizontal: "right", vertical: "top"}}
        anchorOrigin={{horizontal: "right", vertical: "bottom"}}
        slotProps={{
            paper: {
                elevation: 0,
                sx: {
                    mt: 1.5,
                    width: 270,
                    overflow: "hidden",
                    borderRadius: "18px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--account-dropdown-bg)",
                    boxShadow: "var(--shadow-dropdown)",
                    py: 1.5,
                }
            },
            list: {
                sx: {
                    py: 0,
                }
            }
        }}
    >
        <MenuActionItem     
          icon={<PersonIcon fontSize="small" />} 
          label="My profile"
          onClick={onProfile}
        />

        <MenuActionItem
          icon={<BlockIcon fontSize="small" />}
          label="Revisions/Drafts"
          onClick={onNeedsRevision}
          badgeCount={needsRevisionCount}
        />

        {isAdmin && [
          <MenuActionItem
            key="pending"
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending recipes"
            onClick={onPending}
            badgeCount={pendingCount}
          />,

          <MenuActionItem
            key="dashboard"
            icon={<BarChartIcon fontSize="small" />}
            label="Dashboard"
            onClick={onDashboard}
          />,

          // <MenuActionItem
          //   key="feedbacks"
          //   icon={<MailOutlineIcon fontSize="small" />}
          //   label="Feedbacks"
          //   onClick={onFeedbacks}
          //   badgeCount={feedbackCount}
          // />
        ]}

        <MenuActionItem
          icon={<SettingsIcon fontSize="small" />}
          label="Settings"
          selected={location.pathname === "/settings"}
          onClick={onSettings}
        />

        <Divider
            sx={{ my: 1.25, mx: 2, borderColor: "var(--border)" }}
        />

        <MenuActionItem
          icon={<LogoutIcon fontSize="small" />}
          label="Sign out"
          onClick={onSignOut}
          danger
        />
    </Menu>
  )
}
