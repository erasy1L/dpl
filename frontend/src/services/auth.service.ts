import api from "./api";
import { LoginData, RegisterData, AuthResponse, User } from "../types/auth";

class AuthService {
  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<{ message: string; token: string }>("/auth/sign-in", data);
    if (response.data.token) {
      this.setToken(response.data.token);
      
      // Create user object from login data (since backend doesn't return user)
      // Generate a unique ID based on email and timestamp
      const user: User = {
        id: btoa(data.email).substring(0, 16), // Base64 encode email for a pseudo-ID
        email: data.email,
        name: data.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()), // Format name nicely
      };
      this.setUser(user);
      
      console.log("Login successful, user stored:", user);
      console.log("Token stored:", response.data.token.substring(0, 20) + "...");
      
      return {
        message: response.data.message,
        token: response.data.token,
        user: user,
      };
    }
    throw new Error("Invalid response from server");
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/sign-up", data);
    if (response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }
    return response.data;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("getCurrentUser: Retrieved user from localStorage:", user);
        return user;
      } catch (error) {
        console.error("getCurrentUser: Failed to parse user from localStorage:", error);
        return null;
      }
    }
    console.log("getCurrentUser: No user in localStorage");
    return null;
  }

  // Get token from localStorage
  getToken(): string | null {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("getToken: Token found in localStorage");
    } else {
      console.log("getToken: No token in localStorage");
    }
    return token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Set token in localStorage
  private setToken(token: string): void {
    localStorage.setItem("token", token);
  }

  // Set user in localStorage
  private setUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export default new AuthService();
