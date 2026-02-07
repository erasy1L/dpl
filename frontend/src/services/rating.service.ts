import api from "./api";
import { Rating, CreateRatingData } from "../types/rating.types";

interface RatingListResponse {
  ratings: Rating[];
  total: number;
}

class RatingService {
  // Create a new rating
  async create(data: CreateRatingData): Promise<Rating> {
    const response = await api.post<Rating>("/ratings", data);
    return response.data;
  }

  // Get ratings for an attraction
  async getAttractionRatings(
    attractionId: number,
    limit = 10,
    offset = 0
  ): Promise<RatingListResponse> {
    const response = await api.get<RatingListResponse>(
      `/attractions/${attractionId}/ratings?limit=${limit}&offset=${offset}`
    );
    return response.data;
  }

  // Get current user's ratings
  async getMyRatings(): Promise<Rating[]> {
    const response = await api.get<{ ratings: Rating[] }>("/ratings/my");
    return response.data.ratings;
  }

  // Check if user has rated an attraction
  async hasRated(attractionId: number): Promise<boolean> {
    try {
      const ratings = await this.getMyRatings();
      return ratings.some((r) => r.attractionId === attractionId);
    } catch (error) {
      return false;
    }
  }
}

export default new RatingService();