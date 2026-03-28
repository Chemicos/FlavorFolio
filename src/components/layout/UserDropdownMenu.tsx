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
        borderRadius: "10px",
        mx: 1,
        py: 1.2,
        px: 1.5,
        color: danger ? "#f87171" : "#d7def0",
        "& .MuiListItemIcon-root": {
          minWidth: 34,
          color: danger ? "#f87171" : "#a8b3cf",
        },
        "&:hover": {
          backgroundColor: "#16181d",
        },
        "&.Mui-selected": {
          backgroundColor: "rgba(255,255,255,0.06)",
        },
        "&.Mui-selected:hover": {
          backgroundColor: "rgba(255,255,255,0.08)",
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>

      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 14,
          fontWeight: 500,
          color: danger ? "#f87171" : "#a8b3cf"
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
            fontWeight: 700,
            color: "#111318",
            backgroundColor: "#f2a533",
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
                    width: 280,
                    overflow: "hidden",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "#0b0b0c",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                    py: 2,
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

          <MenuActionItem
            key="feedbacks"
            icon={<MailOutlineIcon fontSize="small" />}
            label="Feedbacks"
            onClick={onFeedbacks}
            badgeCount={feedbackCount}
          />
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
              borderColor: "rgba(255,255,255,0.08)",
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
