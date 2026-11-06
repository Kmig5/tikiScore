import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getThemePreference, setThemePreference, type Theme } from "../../../app/theme";
import styles from "./ThemeToggle.module.css";

export type { Theme } from "../../../app/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getThemePreference);

  const themes: Theme[] = ["system", "light", "dark"];
  const labels: Record<Theme, string> = { system: "système", light: "clair", dark: "sombre" };
  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => {
        setThemePreference(nextTheme);
        setTheme(nextTheme);
      }}
      aria-label={`Thème ${labels[theme]}, passer au thème ${labels[nextTheme]}`}
      title={`Thème ${labels[theme]}`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}