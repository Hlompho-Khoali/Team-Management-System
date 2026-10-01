export const APP_THEMES = {
  plum: {
    label: "Plum & Coral",
    swatches: ["#49374f", "#ff987a", "#f8f5f6"],
    variables: {
      "--theme-page-gradient": "linear-gradient(135deg, #fff2ee 0%, #f7f3fb 55%, #eef5fc 100%)",
      "--theme-text": "#342a39",
      "--theme-sidebar": "#49374f",
      "--theme-sidebar-label": "#f1c2c9",
      "--theme-accent": "#ff987a",
      "--theme-accent-text": "#342a39",
      "--theme-icon": "#ffc0a8",
      "--theme-header-border": "rgba(73, 55, 79, 0.12)",
      "--theme-sidebar-shadow": "rgba(57, 39, 63, 0.12)",
      "--theme-avatar-gradient": "linear-gradient(135deg, #ef705c, #f4ad68)",
      "--theme-border": "#eadfe8",
    },
  },
  ocean: {
    label: "Ocean & Gold",
    swatches: ["#174568", "#ffd166", "#f2f7fb"],
    variables: {
      "--theme-page-gradient": "linear-gradient(135deg, #eaf5fb 0%, #f3f7fc 55%, #fff5e7 100%)",
      "--theme-text": "#223749",
      "--theme-sidebar": "#174568",
      "--theme-sidebar-label": "#b9dcec",
      "--theme-accent": "#ffd166",
      "--theme-accent-text": "#263b50",
      "--theme-icon": "#9fddf4",
      "--theme-header-border": "rgba(23, 69, 104, 0.14)",
      "--theme-sidebar-shadow": "rgba(23, 69, 104, 0.12)",
      "--theme-avatar-gradient": "linear-gradient(135deg, #2487a5, #61b9c7)",
      "--theme-border": "#dbe8ef",
    },
  },
  berry: {
    label: "Berry & Peach",
    swatches: ["#71374f", "#f7ad92", "#fff5f1"],
    variables: {
      "--theme-page-gradient": "linear-gradient(135deg, #fff0ec 0%, #fbf2f7 55%, #fff8e9 100%)",
      "--theme-text": "#432b3a",
      "--theme-sidebar": "#71374f",
      "--theme-sidebar-label": "#f4c6c8",
      "--theme-accent": "#f7ad92",
      "--theme-accent-text": "#482d3d",
      "--theme-icon": "#ffd0b9",
      "--theme-header-border": "rgba(113, 55, 79, 0.14)",
      "--theme-sidebar-shadow": "rgba(87, 35, 57, 0.12)",
      "--theme-avatar-gradient": "linear-gradient(135deg, #b84f70, #ef957f)",
      "--theme-border": "#eedfe4",
    },
  },
  charcoal: {
    label: "Charcoal & Sky",
    swatches: ["#343c4a", "#8bd3ee", "#f3f7fb"],
    variables: {
      "--theme-page-gradient": "linear-gradient(135deg, #eef6fb 0%, #f4f6fa 55%, #fdf1ee 100%)",
      "--theme-text": "#29323f",
      "--theme-sidebar": "#343c4a",
      "--theme-sidebar-label": "#c9d7e4",
      "--theme-accent": "#8bd3ee",
      "--theme-accent-text": "#253744",
      "--theme-icon": "#a9dff0",
      "--theme-header-border": "rgba(52, 60, 74, 0.14)",
      "--theme-sidebar-shadow": "rgba(40, 47, 61, 0.13)",
      "--theme-avatar-gradient": "linear-gradient(135deg, #4b718d, #79adbd)",
      "--theme-border": "#dfe6ed",
    },
  },
} as const;

export type AppTheme = keyof typeof APP_THEMES;

export const DEFAULT_APP_THEME: AppTheme = "plum";

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && value in APP_THEMES;
}

export function applyAppTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  Object.entries(APP_THEMES[theme].variables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}