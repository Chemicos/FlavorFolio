import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import AppsRoundedIcon from "@mui/icons-material/AppsRounded"

import { useMemo, useState } from "react"
import { SpeedDial, SpeedDialAction } from '@mui/material';

interface FloatingSpeedDial {
    onChatClick?: () => void
    onAIClick?: () => void
    onThemeToggle?: () => void
    isDarkMode?: boolean
}

export default function FloatingSpeedDial({
    onChatClick,
    onAIClick,
    onThemeToggle,
    isDarkMode = true
}: FloatingSpeedDial) {
    const [isOpen, setIsOpen] = useState(false)

    const actions = useMemo(() => [
        {
            name: "Messages",
            icon: <ForumOutlinedIcon sx={{fontSize: 20}} />,
            onClick: onChatClick,
        }, 
        {
            name: "FlavoAI",
            icon: <AutoAwesomeIcon sx={{fontSize: 20}} />,
            onClick: onAIClick,
        },
        {
            name: "Theme",
            icon: isDarkMode ? (
                <LightModeOutlinedIcon sx={{fontSize: 20}} />
            ) : (
                <DarkModeOutlinedIcon sx={{fontSize: 20}} />
            ),
            onClick: onThemeToggle,
        }
    ], [isDarkMode, onChatClick, onAIClick, onThemeToggle])

  return (
    <div className='fixed bottom-[5.8rem] right-5 z-40 2xl-plus:bottom-[6.6rem] 2xl-plus:right-7'>
        <SpeedDial
            ariaLabel="FlavorFolio quick actions"
            direction="up"
            open={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            icon={
                <span style={{ display: "flex", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)"}}>
                    <AppsRoundedIcon />
                </span>
            }
            FabProps={{
                className:
                "border border-[#a8b3cf]/10 !bg-[#0b0b0c]/50 !text-[#a8b3cf] backdrop-blur-xl transition duration-200 hover:scale-110 hover:!border-[#a8b3cf]/20 hover:!bg-[#0b0b0c] hover:!text-white active:scale-100",
                sx: {
                    width: 56,
                    height: 56,
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "none",
                    },  
                }
            }}
        >
            {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    tooltipOpen
                    onClick={() => {
                        setIsOpen(false)
                        action.onClick?.()
                    }}
                    slotProps={{
                        fab: {
                        sx: {
                            width: 48,
                            height: 48,
                            bgcolor: "rgba(11, 11, 12, 0.5)",
                            color: "#a8b3cf",
                            border: "1px solid rgba(168, 179, 207, 0.1)",
                            backdropFilter: "blur(24px)",
                            boxShadow: "none",
                            transition: "all 200ms ease",
                            "&:hover": {
                            bgcolor: "#0b0b0c",
                            color: "#ffffff",
                            border: "1px solid rgba(168, 179, 207, 0.2)",
                            boxShadow: "none",
                            },
                        },
                        },
                    }}
                    sx={{
                        "& .MuiSpeedDialAction-staticTooltipLabel": {
                        backgroundColor: "rgba(11, 11, 12, 0.82)",
                        color: "#ffffff",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(168, 179, 207, 0.12)",
                        boxShadow: "none",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        },
                    }}
                />
            ))}
        </SpeedDial>
    </div>
  )
}
