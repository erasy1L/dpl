import { Tour, TourCompany, TourSchedule } from "./tour.types";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  user_id: string;
  tour_id: number;
  schedule_id: number;
  company_id: number;
  number_of_people: number;
  total_price: number;
  status: BookingStatus;
  contact_phone: string;
  contact_email: string;
  notes?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  polar_checkout_id?: string | null;
  polar_order_id?: string | null;
  created_at: string;
  updated_at: string;
  tour?: Tour;
  schedule?: TourSchedule;
  company?: TourCompany;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  limit: number;
  offset: number;
}

export interface BookingDetailResponse {
  booking: Booking;
}

export interface CreateBookingPayload {
  tour_id: number;
  schedule_id: number;
  number_of_people: number;
  contact_phone: string;
  contact_email: string;
  notes?: string;
}

