import api from "./api";
import { Category } from "../types/attraction.types";

interface CategoryListResponse {
  categories: Category[];
  count: number;
}

class CategoryService {
  // Get all categories
  async getAll(limit = 100, offset = 0): Promise<Category[]> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await api.get<CategoryListResponse>(
      `/category?${params.toString()}`
    );
    return response.data.categories;
  }

  // Search categories
  async search(query: string): Promise<Category[]> {
    const params = new URLSearchParams();
    params.append("search", query);
    params.append("limit", "50");
    params.append("offset", "0");

    const response = await api.get<CategoryListResponse>(
      `/category?${params.toString()}`
    );
    return response.data.categories;
  }
}

export default new CategoryService();