export interface AnalyticsOverview {
  total_attractions: number;
  total_views: number;
  average_rating: number;
  active_users: number;
  trends: {
    views: number; // percentage change
    ratings: number;
    users: number;
  };
}

export interface TimeSeriesData {
  date: string;
  views: number;
}

export interface CategoryStats {
  category_name: string;
  count: number;
  color?: string;
}

export interface CityStats {
  city: string;
  attractions: number;
  total_views: number;
  average_rating: number;
}

export interface AttractionStats {
  id: number;
  name: string;
  city: string;
  views?: number;
  rating?: number;
  review_count?: number;
  trend?: number;
}

export interface RatingDistribution {
  [key: number]: number;
}
