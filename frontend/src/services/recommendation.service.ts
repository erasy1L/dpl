import api from "./api";
import { Attraction } from "../types/attraction.types";

class RecommendationService {
  // Get personalized recommendations
  async getPersonalized(limit = 12): Promise<Attraction[]> {
    try {
      const response = await api.get<{ recommendations: Attraction[] }>(
        `/recommendations/personalized?limit=${limit}`
      );
      return response.data.recommendations;
    } catch (error) {
      // Fallback to popular attractions if endpoint doesn't exist
      const fallback = await api.get(`/attractions?limit=${limit}&offset=0`);
      return fallback.data.attractions;
    }
  }

  // Get similar attractions
  async getSimilar(attractionId: number, limit = 6): Promise<Attraction[]> {
    try {
      const response = await api.get<{ recommendations: Attraction[] }>(
        `/recommendations/similar/${attractionId}?limit=${limit}`
      );
      return response.data.recommendations;
    } catch (error) {
      // Fallback to same category attractions
      const attraction = await api.get(`/attractions/${attractionId}`);
      const categoryId = attraction.data.attraction.categoryId;
      const fallback = await api.get(
        `/attractions?category_id=${categoryId}&limit=${limit}&offset=0`
      );
      return fallback.data.attractions.filter(
        (a: Attraction) => a.id !== attractionId
      );
    }
  }

  // Get collaborative filtering recommendations
  async getCollaborative(limit = 12): Promise<Attraction[]> {
    try {
      const response = await api.get<{ recommendations: Attraction[] }>(
        `/recommendations/collaborative?limit=${limit}`
      );
      return response.data.recommendations;
    } catch (error) {
      // Fallback to popular attractions
      const fallback = await api.get(`/attractions?limit=${limit}&offset=0`);
      return fallback.data.attractions.sort(
        (a: Attraction, b: Attraction) => b.popularity - a.popularity
      );
    }
  }

  // Get content-based recommendations
  async getContentBased(limit = 12): Promise<Attraction[]> {
    try {
      const response = await api.get<{ recommendations: Attraction[] }>(
        `/recommendations/content-based?limit=${limit}`
      );
      return response.data.recommendations;
    } catch (error) {
      // Fallback to popular attractions
      const fallback = await api.get(`/attractions?limit=${limit}&offset=0`);
      return fallback.data.attractions;
    }
  }

  // Get trending attractions by city
  async getTrendingByCity(city: string, limit = 12): Promise<Attraction[]> {
    try {
      const response = await api.get<{ attractions: Attraction[] }>(
        `/recommendations/trending?city=${city}&limit=${limit}`
      );
      return response.data.attractions;
    } catch (error) {
      // Fallback to city-filtered attractions
      const fallback = await api.get(
        `/attractions?city=${city}&limit=${limit}&offset=0`
      );
      return fallback.data.attractions.sort(
        (a: Attraction, b: Attraction) =>
          (b.total_views || b.popularity) - (a.total_views || a.popularity)
      );
    }
  }
}

export default new RecommendationService();
