// Color palette
export const colors = {
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Main primary color
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  secondary: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Main secondary color
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
};

// Typography classes
export const typography = {
  display: "text-display", // 3rem / 48px
  h1: "text-h1", // 2.5rem / 40px
  h2: "text-h2", // 2rem / 32px
  h3: "text-h3", // 1.5rem / 24px
  body: "text-base", // 1rem / 16px
  small: "text-sm", // 0.875rem / 14px
  tiny: "text-xs", // 0.75rem / 12px
};

// Spacing scale
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
};

// Shadow utilities
export const shadows = {
  soft: "shadow-soft",
  card: "shadow-card",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

// Border radius
export const borderRadius = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

// Common utility classes
export const utilities = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  card: "bg-white rounded-lg shadow-card p-6",
  button: {
    primary:
      "bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors",
    secondary:
      "bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-2 px-4 rounded-md transition-colors",
    outline:
      "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 font-medium py-2 px-4 rounded-md transition-colors",
    ghost:
      "text-gray-700 hover:bg-gray-100 font-medium py-2 px-4 rounded-md transition-colors",
  },
  input:
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
};