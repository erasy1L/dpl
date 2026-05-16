import api from "./api";
import {
  Booking,
  BookingListResponse,
  BookingDetailResponse,
  CreateBookingPayload,
} from "../types/booking.types";

class BookingService {
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const res = await api.post<{ message: string; booking: Booking }>(
      "/bookings",
      payload,
    );
    return res.data.booking;
  }

  async getMyBookings(limit = 20, offset = 0): Promise<BookingListResponse> {
    const res = await api.get<BookingListResponse>(
      `/bookings/my?limit=${limit}&offset=${offset}`,
    );
    return res.data;
  }

  async getById(id: string): Promise<Booking> {
    const res = await api.get<BookingDetailResponse>(`/bookings/${id}`);
    return res.data.booking;
  }

  async cancel(id: string): Promise<Booking> {
    const res = await api.put<{ message: string; booking: Booking }>(
      `/bookings/${id}/cancel`,
    );
    return res.data.booking;
  }

  async startCheckout(
    bookingId: string,
  ): Promise<{ checkout_url: string }> {
    const res = await api.post<{ checkout_url: string }>(
      `/bookings/${bookingId}/checkout`,
    );
    return res.data;
  }

  async syncPaymentAfterReturn(
    checkoutId: string,
  ): Promise<{ message: string; booking: Booking }> {
    const res = await api.post<{ message: string; booking: Booking }>(
      `/bookings/payment/sync`,
      { checkout_id: checkoutId },
    );
    return res.data;
  }
}

export default new BookingService();
