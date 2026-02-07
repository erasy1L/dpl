import { User } from "./auth";
import { Attraction } from "./attraction.types";

export interface UserPreferences {
  preferred_categories: number[];
  preferred_cities: string[];
}

export interface UserProfile extends User {
  member_since: string;
  stats: {
    attractions_visited: number;
    reviews_written: number;
    average_rating: number;
  };
}

export interface UserActivity {
  id: number;
  type: "view" | "rating" | "favorite";
  attraction_id: number;
  attraction_name: string;
  details?: any;
  created_at: string;
}

export interface Favorite {
  id: number;
  attraction_id: number;
  attraction: Attraction;
  created_at: string;
}
