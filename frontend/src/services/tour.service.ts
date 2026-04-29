import api from "./api";
import {
  Tour,
  TourListResponse,
  TourDetailResponse,
  TourFilterParams,
  TourSchedule,
} from "../types/tour.types";

class TourService {
  async list(filters?: TourFilterParams): Promise<TourListResponse> {
    const params = new URLSearchParams();

    if (filters?.city) params.set("city", filters.city);
    if (filters?.company_id) params.set("company_id", String(filters.company_id));
    if (filters?.min_price) params.set("min_price", String(filters.min_price));
    if (filters?.max_price) params.set("max_price", String(filters.max_price));
    if (filters?.duration) params.set("duration", String(filters.duration));
    if (filters?.difficulty) params.set("difficulty", filters.difficulty);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const url = qs ? `/tours?${qs}` : "/tours";

    const res = await api.get<TourListResponse>(url);
    return res.data;
  }

  async getById(id: number): Promise<Tour> {
    const res = await api.get<TourDetailResponse>(`/tours/${id}`);
    return res.data.tour;
  }

  async getSchedules(tourId: number): Promise<TourSchedule[]> {
    const res = await api.get<{ schedules: TourSchedule[] }>(
      `/tours/${tourId}/schedules`,
    );
    return res.data.schedules;
  }
}

export default new TourService();

