import api from "./api";
import {
  UserPreferences,
  UserProfile,
  UserActivity,
  Favorite,
} from "../types/user.types";

class UserService {
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<UserProfile>("/users/me");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get profile");
    }
  }

  // Update user profile
  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    try {
      await api.put("/users/me", data);
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...data }));
    } catch (error) {
      throw new Error("Failed to update profile");
    }
  }

  // Get user preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await api.get<UserPreferences>("/users/me/preferences");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get user preferences");
    }
  }

  // Update user preferences
  async updatePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await api.put("/users/me/preferences", preferences);
    } catch (error) {
      throw new Error("Failed to update user preferences");
    }
  }

  // Get user's favorites
  async getFavorites(): Promise<Favorite[]> {
    try {
      const response = await api.get<{ favorites: Favorite[] }>(
        "/users/me/favorites"
      );
      return response.data.favorites;
    } catch (error) {
      throw new Error("Failed to get user preferences");
    }
  }

  // Add to favorites
  async addFavorite(attractionId: number): Promise<void> {
    try {
      await api.post("/users/me/favorites", { attraction_id: attractionId });
    } catch (error) {
      throw new Error("Failed to add to favorites");
    }
  }

  // Remove from favorites
  async removeFavorite(attractionId: number): Promise<void> {
    try {
      await api.delete(`/users/me/favorites/${attractionId}`);
    } catch (error) {
      throw new Error("Failed to remove favorites");
    }
  }

  // Get user activity
  async getActivity(limit = 20, page = 1): Promise<UserActivity[]> {
    try {
      const response = await api.get<{ activities: UserActivity[] }>(
        `/users/me/activity?limit=${limit}&page=${page}`
      );
      return response.data.activities;
    } catch (error) {
      throw new Error("Failed to get user activity");
    }
  }

  // Get user stats
  async getStats(): Promise<UserProfile["stats"]> {
    try {
      const response = await api.get<{ stats: UserProfile["stats"] }>(
        "/users/me/stats"
      );
      return response.data.stats;
    } catch (error) {
      throw new Error("Failed to get user statistics");
    }
  }

  // Change current user password
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to change password");
    }
  }
}

export default new UserService();
