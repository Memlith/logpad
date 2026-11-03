"use client"

import * as React from "react"

export type ThemePalette =
  | "green"
  | "gray"
  | "amber"
  | "terminal"
  | "catppuccin"
  | "discord"
  | "normal"
export type ThemeMode = "dark" | "light" | "system"
export type ResolvedMode = "dark" | "light"

interface ThemeContextType {
  palette: ThemePalette
  setPalette: (palette: ThemePalette) => void
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  resolvedMode: ResolvedMode
  toggleMode: () => void
  isDark: boolean
  // Compatibilidade
  theme: string
  setTheme: (val: string) => void
  resolvedTheme: "dark" | "light"
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

function normalizePalette(val: string | null | undefined, fallback: ThemePalette = "green"): ThemePalette {
  if (!val) return fallback
  if (val === "terminal" || val === "green") return "green"
  if (val === "gray") return "gray"
  if (val === "amber") return "amber"
  if (val === "catppuccin") return "catppuccin"
  if (val === "discord") return "discord"
  if (val === "normal" || val === "classico") return "normal"
  return fallback
}

function getStoredPalette(defaultPalette: ThemePalette): ThemePalette {
  if (typeof window === "undefined") return defaultPalette
  const val =
    localStorage.getItem("nostromo_theme") ||
    localStorage.getItem("theme_palette") ||
    localStorage.getItem("theme")
  return normalizePalette(val, defaultPalette)
}

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "dark"
  const val = localStorage.getItem("theme_mode")
  if (val === "dark" || val === "light" || val === "system") return val
  const legacyVal = localStorage.getItem("theme")
  if (legacyVal === "dark" || legacyVal === "light" || legacyVal === "system") return legacyVal
  return "dark"
}

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

let themeListeners: Array<() => void> = []

function notifyThemeChange() {
  for (const listener of themeListeners) {
    listener()
  }
}

function subscribeToTheme(callback: () => void) {
  themeListeners.push(callback)
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const handleMedia = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === "nostromo_theme" ||
      e.key === "theme_palette" ||
      e.key === "theme_mode" ||
      e.key === "theme"
    ) {
      callback()
    }
  }
  mediaQuery.addEventListener("change", handleMedia)
  window.addEventListener("storage", handleStorage)

  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback)
    mediaQuery.removeEventListener("change", handleMedia)
    window.removeEventListener("storage", handleStorage)
  }
}

export function ThemeProvider({
  children,
  initialTheme = "green",
}: {
  children: React.ReactNode
  initialTheme?: string
}) {
  const defaultPalette: ThemePalette = normalizePalette(initialTheme, "green")

  const getPaletteSnapshot = React.useCallback(() => getStoredPalette(defaultPalette), [defaultPalette])
  const getPaletteServerSnapshot = React.useCallback(() => defaultPalette, [defaultPalette])

  const palette = React.useSyncExternalStore(
    subscribeToTheme,
    getPaletteSnapshot,
    getPaletteServerSnapshot
  )

  const mode = React.useSyncExternalStore(
    subscribeToTheme,
    getStoredMode,
    () => "dark" as ThemeMode
  )

  const systemMode = React.useSyncExternalStore(
    subscribeToTheme,
    getSystemMode,
    () => "dark" as ResolvedMode
  )

  const resolvedMode: ResolvedMode = mode === "system" ? systemMode : mode
  const isDark = resolvedMode === "dark"

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove(
      "light",
      "dark",
      "theme-terminal",
      "theme-green",
      "theme-gray",
      "theme-amber",
      "theme-discord",
      "theme-catppuccin",
      "theme-normal"
    )

    root.classList.add(resolvedMode)
    if (palette === "green" || palette === "terminal") {
      root.classList.add("theme-terminal", "theme-green")
      root.dataset.palette = "green"
      root.dataset.theme = "green"
    } else if (palette === "gray") {
      root.classList.add("theme-terminal", "theme-gray")
      root.dataset.palette = "gray"
      root.dataset.theme = "gray"
    } else if (palette === "amber") {
      root.classList.add("theme-terminal", "theme-amber")
      root.dataset.palette = "amber"
      root.dataset.theme = "amber"
    } else if (palette === "catppuccin") {
      root.classList.add("theme-catppuccin")
      root.dataset.palette = "catppuccin"
      delete root.dataset.theme
    } else if (palette === "discord") {
      root.classList.add("theme-discord")
      root.dataset.palette = "discord"
      delete root.dataset.theme
    } else {
      root.classList.add("theme-normal")
      root.dataset.palette = "normal"
      delete root.dataset.theme
    }
  }, [resolvedMode, palette])

  const setPalette = React.useCallback((newPalette: ThemePalette) => {
    const normalized = normalizePalette(newPalette, "green")
    localStorage.setItem("theme_palette", normalized)
    if (normalized === "green" || normalized === "gray" || normalized === "amber") {
      localStorage.setItem("nostromo_theme", normalized)
    } else {
      localStorage.removeItem("nostromo_theme")
    }
    notifyThemeChange()
  }, [])

  const setMode = React.useCallback((newMode: ThemeMode) => {
    localStorage.setItem("theme_mode", newMode)
    notifyThemeChange()
  }, [])

  const toggleMode = React.useCallback(() => {
    const nextMode = resolvedMode === "dark" ? "light" : "dark"
    setMode(nextMode)
  }, [resolvedMode, setMode])

  const setTheme = React.useCallback(
    (val: string) => {
      if (
        val === "green" ||
        val === "gray" ||
        val === "amber" ||
        val === "terminal" ||
        val === "catppuccin" ||
        val === "discord" ||
        val === "normal"
      ) {
        setPalette(normalizePalette(val))
      } else if (val === "dark" || val === "light" || val === "system") {
        setMode(val as ThemeMode)
      } else if (val === "toggle") {
        toggleMode()
      }
    },
    [setPalette, setMode, toggleMode]
  )

  const contextValue = React.useMemo(
    () => ({
      palette,
      setPalette,
      mode,
      setMode,
      resolvedMode,
      toggleMode,
      isDark,
      theme: palette,
      setTheme,
      resolvedTheme: resolvedMode,
    }),
    [palette, setPalette, mode, setMode, resolvedMode, toggleMode, isDark, setTheme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function NostromoThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { palette, setPalette } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const active = mounted ? (palette === "terminal" ? "green" : palette) : "green"

  const options: { id: "green" | "gray" | "amber"; label: string; color: string; title: string }[] = [
    { id: "green", label: "GREEN", color: "#0afe60", title: "Sevastopol Green (CRT Phosphor)" },
    { id: "gray", label: "GRAY", color: "#abc0b7", title: "Torrens Gray (MSV-7760)" },
    { id: "amber", label: "AMBER", color: "#ffb000", title: "Nostromo Amber (MU-TH-UR 6000)" },
  ]

  return (
    <div
      className="inline-flex items-center border border-border bg-card/80 p-0.5 gap-0.5 font-mono"
      role="group"
      aria-label="Nostromo Color Theme Switcher"
    >
      {options.map((opt) => {
        const isSelected = active === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.title}
            onClick={() => setPalette(opt.id)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] tracking-wider uppercase transition-all cursor-pointer ios-press ${
              isSelected
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="size-2 shrink-0 border border-white/40"
              style={{ backgroundColor: opt.color }}
            />
            {!compact && <span>{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { toggleMode } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key?.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      toggleMode()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [toggleMode])

  return null
}
