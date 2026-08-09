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
    <section className="mt-6">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Admin reports tabs"
        textColor="inherit"
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 0,
          borderBottom: "1px solid var(--border)",
          "& .MuiTabs-indicator": {
            height: "2px",
            borderRadius: "999px",
            background: "var(--tab-indicator)",
            boxShadow: "var(--tab-indicator-shadow)",
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
              color: "var(--text-muted)",
              transition: "color 0.2s ease",
              "&.Mui-selected": { color: "var(--accent-text)", },
              "&:hover": { color: "var(--text-primary)", },
            }}
          />
        ))}
      </Tabs>
    </section>
  )
}
