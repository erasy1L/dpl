import { LocalizedString, ImageSizes, Attraction, Category } from "./attraction.types";

export interface TourCompany {
  id: number;
  name: LocalizedString;
  description: LocalizedString;
  logo: string;
  website?: string | null;
  phone: string;
  email: string;
  city: LocalizedString;
  address: LocalizedString;
  is_verified: boolean;
  rating: number;
  total_tours: number;
  created_at: string;
  updated_at: string;
  tours?: Tour[];
}

export type TourDifficulty = "easy" | "moderate" | "hard" | "extreme";

export interface Tour {
  id: number;
  company_id: number;
  name: LocalizedString;
  description: LocalizedString;
  short_description: LocalizedString;
  images: ImageSizes[];
  duration_days: number;
  duration_hours: number;
  max_group_size: number;
  price: number;
  currency: string;
  difficulty: TourDifficulty;
  start_city: LocalizedString;
  end_city: LocalizedString;
  is_active: boolean;
  average_rating: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  company?: TourCompany;
  attractions?: Attraction[];
  schedules?: TourSchedule[];
}

export interface TourSchedule {
  id: number;
  tour_id: number;
  start_date: string;
  end_date: string;
  available_spots: number;
  status: "scheduled" | "full" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface TourFilterParams {
  city?: string;
  company_id?: number;
  min_price?: number;
  max_price?: number;
  duration?: number;
  difficulty?: TourDifficulty;
  limit?: number;
  offset?: number;
}

export interface TourListResponse {
  tours: Tour[];
  total: number;
  limit: number;
  offset: number;
}

export interface TourDetailResponse {
  tour: Tour;
}

