export interface LocalizedString {
  [locale: string]: string;
}

export interface Category {
  id: number;
  name_en: string;
  name_ru: string;
  icon: string;
  attraction_count?: number;
  created_at: string;
}

export interface ImageSizes {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

export interface Attraction {
  id: number;
  name: LocalizedString;
  description: LocalizedString;
  city: LocalizedString;
  address: LocalizedString;
  country: LocalizedString;
  latitude?: number;
  longitude?: number;
  images: ImageSizes[];
  average_rating?: number;
  total_ratings?: number;
  total_views?: number;
  review_rating_count: Record<string, number>;
  categories?: Category[];
  created_at: string;
}

export interface AttractionFilters {
  search?: string;
  city?: string;
  category_ids?: number[];
  min_rating?: number;
  limit?: number;
  offset?: number;
}

export interface AttractionListResponse {
  attractions: Attraction[];
  total: number;
  limit: number;
  offset: number;
}

export interface AttractionDetailResponse {
  attraction: Attraction;
}
