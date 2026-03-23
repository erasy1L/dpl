import api from "./api";
import {
  AnalyticsOverview,
  TimeSeriesData,
  CategoryStats,
  CityStats,
  AttractionStats,
  RatingDistribution,
} from "../types/analytics.types";

class AnalyticsService {
  // Get overview statistics
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>("/analytics/overview");
    return response.data;
  }

  // Get views over time
  async getViewsOverTime(days = 30): Promise<TimeSeriesData[]> {
    const response = await api.get<{ data: TimeSeriesData[] }>(
      `/analytics/views-over-time?days=${days}`,
    );
    return response.data.data;
  }

  // Get category statistics
  async getCategoryStats(): Promise<CategoryStats[]> {
    const response = await api.get<{ data: CategoryStats[] }>(
      "/analytics/categories",
    );
    return response.data.data;
  }

  // Get city statistics
  async getCityStats(): Promise<CityStats[]> {
    const response = await api.get<{ data: CityStats[] }>("/analytics/cities");
    return response.data.data;
  }

  // Get top attractions
  async getTopAttractions(
    sortBy: "views" | "rating" = "views",
    limit = 10,
  ): Promise<AttractionStats[]> {
    const response = await api.get<{ attractions: AttractionStats[] }>(
      `/analytics/top-attractions?sort=${sortBy}&limit=${limit}`,
    );
    return response.data.attractions;
  }

  // Get rating distribution
  async getRatingDistribution(): Promise<RatingDistribution> {
    const response = await api.get<{ distribution: RatingDistribution }>(
      "/analytics/rating-distribution",
    );
    return response.data.distribution;
  }
}

export default new AnalyticsService();
