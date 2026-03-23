import api from "./api";
import { User } from "../types/auth";

interface UsersResponse {
  users: User[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedUsersResult {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

class AdminService {
  async getUsers(limit = 20, offset = 0): Promise<PaginatedUsersResult> {
    const response = await api.get<UsersResponse>(
      `/admin/users?limit=${limit}&offset=${offset}`,
    );
    return {
      users: response.data.users,
      total: response.data.total ?? response.data.count,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async updateUserRole(
    userId: string,
    role: "user" | "manager" | "admin",
  ): Promise<void> {
    await api.put(`/admin/users/${userId}/role`, { role });
  }
}

export default new AdminService();

