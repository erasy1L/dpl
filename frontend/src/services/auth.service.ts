import api from "./api";
import { LoginData, RegisterData, AuthResponse, User } from "../types/auth";

class AuthService {
  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/sign-in", data);
    if (response.data.token && response.data.user) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
      return response.data;
    }

    throw new Error("Invalid response from server");
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/sign-up", data);
    if (response.data.token && response.data.user) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/verify-email", {
      token,
    });
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verification",
      { email },
    );
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/forgot-password", {
      email,
    });
    return response.data;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
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
