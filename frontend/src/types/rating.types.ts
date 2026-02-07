export interface Rating {
  id: number;
  user_id: string;
  attraction_id: number;
  rating: number;
  review?: string;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

export interface CreateRatingData {
  attraction_id: number;
  rating: number;
  review?: string;
}
