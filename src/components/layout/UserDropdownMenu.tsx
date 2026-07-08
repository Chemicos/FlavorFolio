import {
    Badge,
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
import MailOutlineIcon from "@mui/icons-material/MailOutline"
import SettingsIcon from "@mui/icons-material/Settings"
import LogoutIcon from "@mui/icons-material/Logout"

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
        color: danger ? "#fca5a5" : "#d7def0",
        "& .MuiListItemIcon-root": {
          minWidth: 34,
          color: danger ? "#f87171" : "#a8b3cf",
          transition: "color 160ms ease",
        },
        "&:hover": {
          backgroundColor: danger
            ? "rgba(239,68,68,0.10)"
            : "rgba(254,170,43,0.10)",
          color: danger ? "#fecaca" : "#ffd28a",
          borderColor: danger
            ? "rgba(248,113,113,0.20)"
            : "rgba(254,170,43,0.20)",
        },
        "&:hover .MuiListItemIcon-root": {
          color: danger ? "#fca5a5" : "#feaa2b",
        },
        "&.Mui-selected": {
          backgroundColor: "rgba(254,170,43,0.12)",
          color: "#ffd28a",
        },
        "&.Mui-selected:hover": {
          backgroundColor: "rgba(254,170,43,0.16)",
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
            color: "#0d0e11",
            backgroundColor: "#feaa2b",
            boxShadow: "0 0 18px rgba(254,170,43,0.28)",
          }}
        >
          {badgeCount}
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
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "#1b1d22",
                    boxShadow: "0 24px 90px rgba(0,0,0,0.65)",
                    backdropFilter: "blur(18px)",
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
          label="Needs revision"
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
          onClick={onSettings}
        />

        <Divider
            sx={{
              my: 1.25,
              mx: 2,
              borderColor: "rgba(255,255,255,0.10)",
            }}
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
