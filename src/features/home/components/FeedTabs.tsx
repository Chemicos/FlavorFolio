import { Tab, Tabs } from "@mui/material"

interface FeedTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function FeedTabs({
    activeTab,
    onTabChange,
}: FeedTabsProps) {
    const tabs = ["For You", "Trending", "Following", "New"]

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        onTabChange(newValue)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }
  return (
    <div className="mb-6">
        <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Home recipe tabs"
        textColor="inherit"
        variant="scrollable"
        scrollButtons={false}
        sx={{
            minHeight: 0,
            borderBottom: "1px solid rgba(168, 179, 207, 0.12)",
            "& .MuiTabs-indicator": {
            backgroundColor: "#ffffff",
            height: "2px",
            borderRadius: "999px",
            },
            "& .MuiTabs-flexContainer": {
            gap: "0.5rem",
            },
        }}
        >
            {tabs.map((tab) => (
                <Tab
                key={tab}
                value={tab}
                label={tab}
                disableRipple
                sx={{
                    minHeight: 0,
                    minWidth: 0,
                    px: 0,
                    py: "0.9rem",
                    mr: "1.5rem",
                    textTransform: "none",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "rgba(168, 179, 207, 0.6)",
                    transition: "color 0.2s ease",
                    "&.Mui-selected": {
                    color: "#ffffff",
                    },
                    "&:hover": {
                    color: "#ffffff",
                    },
                }}
                />
            ))}
        </Tabs>
    </div>
  )
}
