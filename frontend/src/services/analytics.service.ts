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
    try {
      const response = await api.get<AnalyticsOverview>("/analytics/overview");
      return response.data;
    } catch (error) {
      // Mock data fallback
      return {
        total_attractions: 150,
        total_views: 12450,
        average_rating: 4.3,
        active_users: 850,
        trends: {
          views: 12.5,
          ratings: 3.2,
          users: 8.1,
        },
      };
    }
  }

  // Get views over time
  async getViewsOverTime(days = 30): Promise<TimeSeriesData[]> {
    try {
      const response = await api.get<{ data: TimeSeriesData[] }>(
        `/analytics/views-over-time?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      // Mock data fallback
      const data: TimeSeriesData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split("T")[0],
          views: Math.floor(Math.random() * 500) + 200,
        });
      }
      return data;
    }
  }

  // Get category statistics
  async getCategoryStats(): Promise<CategoryStats[]> {
    try {
      const response = await api.get<{ data: CategoryStats[] }>(
        "/analytics/categories"
      );
      return response.data.data;
    } catch (error) {
      // Mock data fallback
      return [
        { category_name: "Museums", count: 35, color: "#0ea5e9" },
        { category_name: "Parks", count: 28, color: "#10b981" },
        { category_name: "Historical", count: 42, color: "#f59e0b" },
        { category_name: "Nature", count: 25, color: "#84cc16" },
        { category_name: "Cultural", count: 20, color: "#8b5cf6" },
      ];
    }
  }

  // Get city statistics
  async getCityStats(): Promise<CityStats[]> {
    try {
      const response = await api.get<{ data: CityStats[] }>(
        "/analytics/cities"
      );
      return response.data.data;
    } catch (error) {
      // Mock data fallback
      return [
        {
          city: "Almaty",
          total_views: 5200,
          average_rating: 420,
          attractions: 50,
        },
        {
          city: "Astana",
          total_views: 3800,
          average_rating: 310,
          attractions: 24,
        },
        {
          city: "Shymkent",
          total_views: 2100,
          average_rating: 180,
          attractions: 18,
        },
      ];
    }
  }

  // Get top attractions
  async getTopAttractions(
    sortBy: "views" | "rating" = "views",
    limit = 10
  ): Promise<AttractionStats[]> {
    try {
      const response = await api.get<{ attractions: AttractionStats[] }>(
        `/analytics/top-attractions?sort=${sortBy}&limit=${limit}`
      );
      return response.data.attractions;
    } catch (error) {
      // Mock data fallback
      const mockAttractions: AttractionStats[] = [
        {
          id: 1,
          name: "Central State Museum",
          city: "Almaty",
          views: 1250,
          rating: 4.7,
          review_count: 85,
          trend: 15,
        },
        {
          id: 2,
          name: "Bayterek Tower",
          city: "Astana",
          views: 980,
          rating: 4.6,
          review_count: 72,
          trend: 8,
        },
        {
          id: 3,
          name: "Big Almaty Lake",
          city: "Almaty",
          views: 850,
          rating: 4.8,
          review_count: 95,
          trend: -3,
        },
        {
          id: 4,
          name: "Khan Shatyr",
          city: "Astana",
          views: 720,
          rating: 4.4,
          review_count: 58,
          trend: 12,
        },
        {
          id: 5,
          name: "Medeu",
          city: "Almaty",
          views: 680,
          rating: 4.5,
          review_count: 64,
          trend: 5,
        },
      ];

      if (sortBy === "rating") {
        return mockAttractions.sort(
          (a, b) => (b.rating || 0) - (a.rating || 0)
        );
      }
      return mockAttractions.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
  }

  // Get rating distribution
  async getRatingDistribution(): Promise<RatingDistribution> {
    try {
      const response = await api.get<{ distribution: RatingDistribution }>(
        "/analytics/rating-distribution"
      );
      return response.data.distribution;
    } catch (error) {
      // Mock data fallback
      return {
        1: 12,
        2: 25,
        3: 68,
        4: 145,
        5: 180,
      };
    }
  }
}

export default new AnalyticsService();
