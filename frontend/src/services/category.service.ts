import api from "./api";
import { Category } from "../types/attraction.types";

interface CategoryListResponse {
  categories: Category[];
  count: number;
}

export interface PaginatedCategoriesResult {
  categories: Category[];
  total: number;
  limit: number;
  offset: number;
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

  async getPage(limit = 20, offset = 0): Promise<PaginatedCategoriesResult> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await api.get<CategoryListResponse>(
      `/category?${params.toString()}`,
    );
    return {
      categories: response.data.categories,
      total: response.data.count,
      limit,
      offset,
    };
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

  async create(data: {
    name_en: string;
    name_ru?: string;
    icon: string;
  }): Promise<void> {
    await api.post("/category", data);
  }

  async update(
    id: number,
    data: {
      name_en?: string;
      name_ru?: string;
      icon?: string;
    },
  ): Promise<void> {
    await api.put(`/category/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/category/${id}`);
  }
}

export default new CategoryService();