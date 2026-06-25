import { Tab, Tabs } from "@mui/material"
import { SyntheticEvent } from "react"

export type ProfileRecipeTabValue =
  | "my-recipes"
  | "saved-recipes"
  | "pending-recipes"
  | "needs-revision"
  | "drafts"

export interface ProfileRecipeTabItem {
  value: ProfileRecipeTabValue
  label: string
  count: number
}

interface ProfileRecipeTabsProps {
  activeTab: ProfileRecipeTabValue
  onTabChange: (tab: ProfileRecipeTabValue) => void
  tabs?: ProfileRecipeTabItem[]
}

const defaultTabs: ProfileRecipeTabItem[] = [
  {
    value: "my-recipes",
    label: "My recipes",
    count: 0,
  },
  {
    value: "saved-recipes",
    label: "Saved recipes",
    count: 0,
  },
  {
    value: "pending-recipes",
    label: "Pending",
    count: 0,
  },
  {
    value: "needs-revision",
    label: "Needs revision",
    count: 0,
  },
  {
    value: "drafts",
    label: "Drafts",
    count: 0,
  },
]

export default function ProfileRecipeTabs({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
}: ProfileRecipeTabsProps) {
  const handleTabChange = (_event: SyntheticEvent, newValue: ProfileRecipeTabValue) => {onTabChange(newValue)}

  return (
    <section className="mt-8">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Profile recipe tabs"
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
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            disableRipple
            label={
              <span className="inline-flex items-center gap-2">
                <span>{tab.label}</span>

                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[0.7rem] leading-none",
                    activeTab === tab.value
                      ? "bg-amber-400/15 text-amber-200"
                      : "bg-white/[0.06] text-[#8f97b1]",
                  ].join(" ")}
                >
                  {tab.count}
                </span>
              </span>
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
