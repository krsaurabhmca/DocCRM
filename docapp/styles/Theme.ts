export const Theme = {
  colors: {
    primary: "#0284C7",
    secondary: "#0C4A6E",
    success: "#059669",
    danger: "#E11D48",
    warning: "#EA580C",
    info: "#0891B2",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    text: {
      main: "#1E293B",
      muted: "#64748B",
      light: "#94A3B8",
      white: "#FFFFFF",
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 30,
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 24, fontWeight: "700" as const },
    h2: { fontSize: 20, fontWeight: "700" as const },
    h3: { fontSize: 18, fontWeight: "600" as const },
    body: { fontSize: 16, fontWeight: "400" as const },
    caption: { fontSize: 12, fontWeight: "500" as const },
    small: { fontSize: 11, fontWeight: "600" as const },
  }
};
