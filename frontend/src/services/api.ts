import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// In dev, prefer VITE_API_BASE_URL (browser → API over CORS) to avoid Vite’s Node
// http-proxy to localhost:8080, which on some Windows setups returns ECONNRESET
// even when curl to the same URL works.
const devApiOrigin = import.meta.env.VITE_API_BASE_URL as string | undefined;
const baseURL = devApiOrigin
  ? `${devApiOrigin.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

// Create axios instance with base configuration
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and user from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch a custom event to notify the app about auth failure
      window.dispatchEvent(new Event("auth:logout"));

      // Only redirect if not already on login/register page
      // Use a small delay to allow React to process state updates
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;
