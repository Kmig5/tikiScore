export type Theme = "light" | "dark" | "system";

const storageKey = "tikiscore-theme";
const systemThemeQuery = "(prefers-color-scheme: dark)";

export function getThemePreference(): Theme {
  const savedTheme = window.localStorage.getItem(storageKey);
  return savedTheme === "light" || savedTheme === "dark" || savedTheme === "system" ? savedTheme : "system";
}

export function applyTheme(theme: Theme): void {
  const resolvedTheme = theme === "system"
    ? window.matchMedia(systemThemeQuery).matches ? "dark" : "light"
    : theme;
  document.documentElement.dataset.theme = resolvedTheme;
}

export function setThemePreference(theme: Theme): void {
  window.localStorage.setItem(storageKey, theme);
  applyTheme(theme);
}

export function initializeTheme(): void {
  const applyStoredTheme = () => applyTheme(getThemePreference());
  applyStoredTheme();

  window.matchMedia(systemThemeQuery).addEventListener("change", () => {
    if (getThemePreference() === "system") applyTheme("system");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) applyStoredTheme();
  });
}
