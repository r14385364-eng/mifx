import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleDark: () => void;
}

const THEME_STORAGE_KEY = "gotrade_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDocument(isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.classList.add("dark");
    if (body) body.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    if (body) body.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
      if (saved === "system") return getSystemTheme();
    }
    return "light";
  });

  useEffect(() => {
    const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");
    const newResolved = isDark ? "dark" : "light";
    setResolvedTheme(newResolved);
    applyThemeToDocument(isDark);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const sysDark = e.matches;
        setResolvedTheme(sysDark ? "dark" : "light");
        applyThemeToDocument(sysDark);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleDark = () => {
    setThemeState((prev) => {
      const currentResolved = prev === "dark" || (prev === "system" && getSystemTheme() === "dark");
      return currentResolved ? "light" : "dark";
    });
  };

  const isDark = resolvedTheme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
