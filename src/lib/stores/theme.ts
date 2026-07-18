import { writable } from "svelte/store";

export type Theme = "bereal-light" | "bereal-dark";

function normalizeTheme(theme: string | null): Theme | null {
  if (theme === "bereal-light" || theme === "autumn" || theme === "light") {
    return "bereal-light";
  }

  if (theme === "bereal-dark" || theme === "halloween" || theme === "dark") {
    return "bereal-dark";
  }

  return null;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const savedTheme = normalizeTheme(localStorage.getItem("theme"));
    if (savedTheme) {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "bereal-dark"
      : "bereal-light";
  }
  return "bereal-light";
};

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(getInitialTheme());

  return {
    subscribe,
    set: (value: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", value);
        document.documentElement.setAttribute("data-theme", value);
      }
      set(value);
    },
    toggle: () => {
      update((currentTheme: Theme) => {
        const newTheme: Theme =
          currentTheme === "bereal-light" ? "bereal-dark" : "bereal-light";
        if (typeof window !== "undefined") {
          localStorage.setItem("theme", newTheme);
          document.documentElement.setAttribute("data-theme", newTheme);
        }
        return newTheme;
      });
    },

    init: () => {
      if (typeof window !== "undefined") {
        const theme = getInitialTheme();
        document.documentElement.setAttribute("data-theme", theme);
        set(theme);
      }
    },
  };
}

export const themeStore = createThemeStore();
