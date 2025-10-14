import { writable } from "svelte/store";

export type Theme = "autumn" | "halloween";

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme as Theme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "halloween"
      : "autumn";
  }
  return "autumn";
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
          currentTheme === "autumn" ? "halloween" : "autumn";
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
