import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Container from "../../components/layout/Container";
import { Button, Skeleton, EmptyState } from "../../components/ui";
import bookingService from "../../services/booking.service";
import { Booking } from "../../types/booking.types";
import { getLocalizedText } from "../../utils/localization";
import toast from "react-hot-toast";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const statusColors: Record<
  Booking["status"],
  { bg: string; text: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  confirmed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
  },
  completed: {
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
};

const statusLabel = (status: Booking["status"]) => {
  switch (status) {
    case "pending":
      return m.booking_status_pending();
    case "confirmed":
      return m.booking_status_confirmed();
    case "cancelled":
      return m.booking_status_cancelled();
    case "completed":
      return m.booking_status_completed();
  }
};

const MyBookingsPage = () => {
  useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [limit] = useState(20);
  const [offset] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getMyBookings(limit, offset);
        setBookings(res.bookings);
      } catch (error) {
        console.error("Failed to load bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [limit, offset]);

  const handleCancel = async (id: string) => {
    if (!confirm(m.confirm_cancel_booking())) {
      return;
    }
    try {
      const updated = await bookingService.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      toast.success(m.toast_booking_cancelled());
    } catch (error: any) {
      console.error("Failed to cancel booking:", error);
      toast.error(error?.message || m.toast_cancel_failed());
    }
  };

  const handlePay = async (id: string) => {
    try {
      setPayingBookingId(id);
      const { checkout_url: checkoutUrl } = await bookingService.startCheckout(id);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Failed to start checkout:", error);
      toast.error(error?.message || m.toast_payment_start_failed());
      setPayingBookingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="lg">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {m.bookings_title()}
          </h1>
          <p className="text-gray-600">{m.bookings_subtitle()}</p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={140} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title={m.bookings_empty_title()}
            description={m.bookings_empty_desc()}
            action={{
              label: m.bookings_browse_tours(),
              onClick: () => navigate("/tours"),
            }}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const status = statusColors[b.status];
              const tourName = b.tour ? getLocalizedText(b.tour.name) : "";
              const companyName =
                b.company && b.company.name
                  ? getLocalizedText(b.company.name)
                  : "";
              const startCity =
                b.tour && b.tour.start_city
                  ? getLocalizedText(b.tour.start_city)
                  : "";
              const schedule = b.schedule;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">
                          {tourName || m.booking_fallback_tour()}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${status.bg} ${status.text}`}
                        >
                          {b.status === "confirmed" && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {b.status === "cancelled" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {statusLabel(b.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {m.booking_booked_on()}{" "}
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {companyName && (
                      <p className="text-xs text-gray-600 mb-1">
                        {companyName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
                      {schedule && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(
                            schedule.start_date,
                          ).toLocaleDateString()}{" "}
                          –{" "}
                          {new Date(
                            schedule.end_date,
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {startCity && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {startCity}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.number_of_people}{" "}
                        {b.number_of_people === 1
                          ? m.booking_person_one()
                          : m.booking_people_many()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-900">
                        <span className="font-semibold">
                          {b.total_price.toLocaleString()}{" "}
                          {b.tour ? b.tour.currency : "KZT"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {m.booking_contact()} {b.contact_email}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tours/${b.tour_id}`)}
                      >
                        {m.booking_view_tour()}
                      </Button>
                      {b.status === "pending" && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={payingBookingId === b.id}
                          disabled={payingBookingId !== null && payingBookingId !== b.id}
                          onClick={() => handlePay(b.id)}
                        >
                          {m.booking_pay()}
                        </Button>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(b.id)}
                        >
                          {m.booking_cancel()}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default MyBookingsPage;
