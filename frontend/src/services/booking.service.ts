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

  async createPayPalCheckout(
    bookingId: string,
  ): Promise<{ approval_url: string }> {
    const res = await api.post<{ approval_url: string }>(
      `/bookings/${bookingId}/paypal/checkout`,
    );
    return res.data;
  }

  async capturePayPal(
    paypalOrderId: string,
  ): Promise<{ message: string; booking: Booking }> {
    const res = await api.post<{ message: string; booking: Booking }>(
      `/bookings/paypal/capture`,
      { paypal_order_id: paypalOrderId },
    );
    return res.data;
  }

  async createPolarCheckout(bookingId: string): Promise<{ checkout_url: string }> {
    const res = await api.post<{ checkout_url: string }>(
      `/bookings/${bookingId}/polar/checkout`,
    );
    return res.data;
  }

  async syncPolarAfterReturn(
    checkoutId: string,
  ): Promise<{ message: string; booking: Booking }> {
    const res = await api.post<{ message: string; booking: Booking }>(
      `/bookings/polar/sync`,
      { checkout_id: checkoutId },
    );
    return res.data;
  }
}

export default new BookingService();

