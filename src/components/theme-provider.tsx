import { useEffect } from "react"
import { useSettingsStore } from "@/features/settings/store/settings"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, applyTheme } = useSettingsStore()

  useEffect(() => {
    // Apply initial theme
    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, applyTheme])

  return <>{children}</>
} 