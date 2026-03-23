import api from "./api";
import {
  Attraction,
  AttractionFilters,
  AttractionListResponse,
  AttractionDetailResponse,
} from "../types/attraction.types";

export interface CityWithCount {
  city: string;
  count: number;
}

export interface CitiesResponse {
  cities: CityWithCount[];
  count: number;
}

class AttractionService {
  // Get all attractions with filters
  async getAll(filters?: AttractionFilters): Promise<AttractionListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.city) params.append("city", filters.city);
    if (filters?.category_ids && filters.category_ids.length > 0) {
      params.append("category_ids", filters.category_ids.join(","));
    }
    if (filters?.min_rating)
      params.append("min_rating", filters.min_rating.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const response = await api.get<AttractionListResponse>(
      `/attractions?${params.toString()}`,
    );
    return response.data;
  }

  // Get attraction by ID
  async getById(id: number): Promise<Attraction> {
    const response = await api.get<AttractionDetailResponse>(
      `/attractions/${id}`,
    );
    return response.data.attraction;
  }

  // Get popular attractions
  async getPopular(city?: string, limit = 10): Promise<Attraction[]> {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    params.append("limit", limit.toString());
    params.append("offset", "0");

    const response = await api.get<AttractionListResponse>(
      `/attractions?${params.toString()}`,
    );
    // Sort by views
    return response.data.attractions.sort(
      (a, b) => (b.total_views || 0) - (a.total_views || 0),
    );
  }

  // Get trending attractions
  async getTrending(city?: string, limit = 10): Promise<Attraction[]> {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    params.append("limit", limit.toString());
    params.append("offset", "0");

    const response = await api.get<AttractionListResponse>(
      `/attractions?${params.toString()}`,
    );
    // Sort by views
    return response.data.attractions.sort(
      (a, b) => (b.total_views || 0) - (a.total_views || 0),
    );
  }

  // Search attractions
  async search(query: string, limit = 20): Promise<Attraction[]> {
    const params = new URLSearchParams();
    params.append("search", query);
    params.append("limit", limit.toString());
    params.append("offset", "0");

    const response = await api.get<AttractionListResponse>(
      `/attractions?${params.toString()}`,
    );
    return response.data.attractions;
  }

  // Increment view count
  async incrementView(id: number): Promise<void> {
    await api.post(`/attractions/${id}/view`);
  }

  // Get cities with attraction counts
  async getCities(limit = 10): Promise<CityWithCount[]> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());

    const response = await api.get<CitiesResponse>(
      `/attractions/cities?${params.toString()}`,
    );
    return response.data.cities;
  }

  // Update attraction content (manager/admin)
  async updateAttraction(
    id: number,
    payload: any,
  ): Promise<{ attraction?: any }> {
    const response = await api.put(`/attractions/${id}`, payload);
    return response.data;
  }

  // Create attraction (manager/admin)
  async createAttraction(payload: any): Promise<{ attraction?: any }> {
    const response = await api.post("/attractions", payload);
    return response.data;
  }

  // Delete attraction (manager/admin)
  async deleteAttraction(id: number): Promise<void> {
    await api.delete(`/attractions/${id}`);
  }
}

export default new AttractionService();
