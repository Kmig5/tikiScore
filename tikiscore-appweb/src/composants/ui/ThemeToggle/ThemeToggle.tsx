import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export type Theme = "light" | "dark" | "system";
const storageKey = "tikiscore-theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset.theme = resolvedTheme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const savedTheme = window.localStorage.getItem(storageKey);
    return savedTheme === "light" || savedTheme === "dark" || savedTheme === "system" ? savedTheme : "system";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    applyTheme(theme);
    window.localStorage.setItem(storageKey, theme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const themes: Theme[] = ["system", "light", "dark"];
  const labels: Record<Theme, string> = { system: "système", light: "clair", dark: "sombre" };
  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setTheme(nextTheme)}
      aria-label={`Thème ${labels[theme]}, passer au thème ${labels[nextTheme]}`}
      title={`Thème ${labels[theme]}`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}