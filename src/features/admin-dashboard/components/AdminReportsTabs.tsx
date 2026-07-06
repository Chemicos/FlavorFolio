import { Tab, Tabs } from "@mui/material"
import { SyntheticEvent } from "react"

export type AdminReportTabValue =
  | "overview"
  | "community"
  | "food"
  | "seasonal"

interface AdminReportTabItem {
  value: AdminReportTabValue
  label: string
  count?: number
}

interface AdminReportsTabsProps {
  activeTab: AdminReportTabValue
  onTabChange: (tab: AdminReportTabValue) => void
}

const reportTabs: AdminReportTabItem[] = [
  { value: "overview", label: "Overview", count: 4 },
  { value: "community", label: "Community", count: 4 },
  { value: "food", label: "Food Insights", count: 4 },
  { value: "seasonal", label: "Seasonal Trends", count: 2 },
]

export default function AdminReportsTabs({
    activeTab,
    onTabChange,
}: AdminReportsTabsProps) {
    const handleTabChange = (
        _event: SyntheticEvent,
        newValue: AdminReportTabValue
    ) => {
        onTabChange(newValue)
    }

  return (
    <section className="mt-8">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Admin reports tabs"
        textColor="inherit"
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 0,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          "& .MuiTabs-indicator": {
            height: "2px",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, rgba(245,158,11,1), rgba(251,191,36,1))",
            boxShadow: "0 0 18px rgba(245,158,11,0.45)",
          },
          "& .MuiTabs-flexContainer": {
            gap: {
              xs: "1rem",
              md: "1.75rem",
            },
          },
        }}
      >
        {reportTabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            disableRipple
            label={
              <span>{tab.label}</span>
            }
            sx={{
              minHeight: 0,
              minWidth: 0,
              px: 0,
              py: "1rem",
              textTransform: "none",
              fontSize: "0.92rem",
              fontWeight: 400,
              color: "rgba(168, 179, 207, 0.72)",
              transition: "color 0.2s ease",
              "&.Mui-selected": {
                color: "#facc15",
              },
              "&:hover": {
                color: "#ffffff",
              },
            }}
          />
        ))}
      </Tabs>
    </section>
  )
}
