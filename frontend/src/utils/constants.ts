export const API_BASE_URL = "http://localhost:8080";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ATTRACTIONS: "/attractions",
  ATTRACTION_DETAIL: "/attractions/:id",
  CATEGORIES: "/categories",
  PROFILE: "/profile",
  ANALYTICS: "/analytics",
} as const;

export const CITIES = [
  "Almaty",
  "Astana",
  "Shymkent",
  "Aktobe",
  "Karaganda",
  "Taraz",
  "Pavlodar",
  "Oskemen",
  "Semey",
  "Atyrau",
  "Kostanay",
  "Kyzylorda",
  "Oral",
  "Petropavl",
  "Aktau",
  "Temirtau",
  "Turkistan",
] as const;

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: "/api/v1/auth/sign-in",
    SIGN_UP: "/api/v1/auth/sign-up",
    SIGN_OUT: "/api/v1/auth/sign-out",
  },
  CATEGORIES: {
    LIST: "/api/v1/category",
  },
  ATTRACTIONS: {
    LIST: "/api/v1/attractions",
    DETAIL: "/api/v1/attractions",
  },
  HEALTH: "/health",
} as const;