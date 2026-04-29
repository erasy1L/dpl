import api from "./api";
import { TourCompany } from "../types/tour.types";

export interface CompanyListResponse {
  companies: TourCompany[];
  total: number;
  limit: number;
  offset: number;
}

class CompanyService {
  async list(params?: { city?: string; limit?: number; offset?: number }) {
    const search = new URLSearchParams();
    if (params?.city) search.set("city", params.city);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));

    const qs = search.toString();
    const url = qs ? `/companies?${qs}` : "/companies";

    const res = await api.get<CompanyListResponse>(url);
    return res.data;
  }

  async getById(id: number): Promise<TourCompany> {
    const res = await api.get<{ company: TourCompany }>(`/companies/${id}`);
    return res.data.company;
  }
}

export default new CompanyService();

