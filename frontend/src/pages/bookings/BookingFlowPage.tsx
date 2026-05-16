import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "../../components/layout/Container";
import { Button, Input, Skeleton, EmptyState } from "../../components/ui";
import tourService from "../../services/tour.service";
import bookingService from "../../services/booking.service";
import { Tour, TourSchedule } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";
import toast from "react-hot-toast";

const BookingFlowPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tourId = searchParams.get("tour")
    ? Number(searchParams.get("tour"))
    : undefined;
  const initialScheduleId = searchParams.get("schedule")
    ? Number(searchParams.get("schedule"))
    : undefined;

  const [tour, setTour] = useState<Tour | null>(null);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedScheduleId, setSelectedScheduleId] = useState<
    number | undefined
  >(initialScheduleId);

  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);

  useEffect(() => {
    if (!tourId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const t = await tourService.getById(tourId);
        setTour(t);
      } catch (error) {
        console.error("Failed to load tour for booking:", error);
      } finally {
        setLoading(false);
      }
    };
    const loadSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const list = await tourService.getSchedules(tourId);
        setSchedules(list);
      } catch (error) {
        console.error("Failed to load schedules:", error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
    loadSchedules();
  }, [tourId]);

  const handleNextFromSchedule = () => {
    if (!selectedScheduleId) {
      toast.error("Please select a date");
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!tourId || !selectedScheduleId || !tour) return;
    if (!contactPhone.trim() || !contactEmail.trim()) {
      toast.error("Please fill in contact phone and email");
      return;
    }
    if (numberOfPeople <= 0) {
      toast.error("Number of people must be at least 1");
      return;
    }
    try {
      setSubmitting(true);
      const booking = await bookingService.create({
        tour_id: tourId,
        schedule_id: selectedScheduleId,
        number_of_people: numberOfPeople,
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        notes: notes.trim() || undefined,
      });
      setCreatedBookingId(booking.id);
      setStep(3);
      toast.success("Booking reserved. Complete payment to confirm.");
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      toast.error(error?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tourId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="No tour selected"
          description="Please choose a tour first."
          action={{
            label: "Browse tours",
            onClick: () => navigate("/tours"),
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container size="lg" className="py-8">
          <Skeleton variant="rectangular" height={80} />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="rectangular" height={260} />
            <Skeleton variant="rectangular" height={260} />
          </div>
        </Container>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Tour not found"
          description="The tour you are trying to book is not available."
          action={{
            label: "Back to tours",
            onClick: () => navigate("/tours"),
          }}
        />
      </div>
    );
  }

  const name = getLocalizedText(tour.name);
  const totalPrice = numberOfPeople * tour.price;

  const startCheckout = async () => {
    if (!createdBookingId) return;
    try {
      setRedirectingToPayment(true);
      const { checkout_url: checkoutUrl } =
        await bookingService.startCheckout(createdBookingId);
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      console.error("Checkout failed:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Could not start payment";
      toast.error(message);
      setRedirectingToPayment(false);
    }
  };

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="lg" className="py-8">
        <header className="mb-6">
          <p className="text-xs font-medium text-primary-600 mb-1 uppercase tracking-wide">
            Booking
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {name}
          </h1>
          <p className="text-sm text-gray-600">
            Choose a date, enter details, then complete payment securely.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-2">
              {["Select date", "Details", "Payment"].map((label, idx) => {
                const currentIndex = idx + 1;
                const isActive = step === currentIndex;
                const isDone = step > currentIndex;
                return (
                  <div key={label} className="flex-1 flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isDone
                            ? "bg-primary-500 text-white"
                            : isActive
                            ? "bg-primary-50 text-primary-600 border border-primary-200"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {currentIndex}
                      </div>
                      <span
                        className={`text-sm ${
                          isActive || isDone
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div className="flex-1 h-px mx-2 bg-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: schedule */}
            {step === 1 && (
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Select a date
                </h2>
                {loadingSchedules ? (
                  <Skeleton variant="rectangular" height={180} />
                ) : schedules.length === 0 ? (
                  <EmptyState
                    title="No dates available"
                    description="This tour currently has no available schedules."
                  />
                ) : (
                  <div className="space-y-3">
                    {schedules.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedScheduleId(s.id)}
                        disabled={s.status !== "scheduled" || s.available_spots <= 0}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left ${
                          selectedScheduleId === s.id
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/40"
                        } ${
                          (s.status !== "scheduled" || s.available_spots <= 0) &&
                          "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {new Date(s.start_date).toLocaleDateString()} –{" "}
                            {new Date(s.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            Status: {s.status} · {s.available_spots} spots left
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button
                    variant="primary"
                    onClick={handleNextFromSchedule}
                    disabled={!selectedScheduleId}
                  >
                    Continue
                  </Button>
                </div>
              </section>
            )}

            {/* Step 2: details */}
            {step === 2 && (
              <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Traveler details
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  We&apos;ll share these details with the tour company.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Number of people"
                    type="number"
                    min={1}
                    value={numberOfPeople}
                    onChange={(e) =>
                      setNumberOfPeople(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                  <Input
                    label="Contact phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+7 ..."
                  />
                </div>
                <Input
                  label="Contact email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                    placeholder="Special requests, preferences, etc."
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={() => setStep(3)}>
                    Review booking
                  </Button>
                </div>
              </section>
            )}

            {/* Step 3: review + payment */}
            {step === 3 && (
              <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {createdBookingId ? "Pay for your booking" : "Review booking"}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  {createdBookingId
                    ? "You will be redirected to a secure checkout page. Your booking is confirmed after a successful payment."
                    : "Please review the details before continuing."}
                </p>
                {selectedSchedule && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm space-y-1">
                    <p className="font-medium text-gray-900">Selected date</p>
                    <p className="text-gray-700">
                      {new Date(selectedSchedule.start_date).toLocaleDateString()} –{" "}
                      {new Date(selectedSchedule.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedSchedule.available_spots} spots currently available
                    </p>
                  </div>
                )}
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-900">Traveler details</p>
                  <p className="text-gray-700">
                    {numberOfPeople}{" "}
                    {numberOfPeople === 1 ? "person" : "people"}
                  </p>
                  <p className="text-gray-700">{contactPhone}</p>
                  <p className="text-gray-700">{contactEmail}</p>
                  {notes && (
                    <p className="text-gray-600 mt-1 whitespace-pre-line">
                      {notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={!!createdBookingId}>
                    Back
                  </Button>
                  {!createdBookingId ? (
                    <Button
                      variant="primary"
                      isLoading={submitting}
                      onClick={handleConfirm}
                    >
                      Create booking
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2 max-w-sm w-full">
                      <Button
                        variant="primary"
                        isLoading={redirectingToPayment}
                        onClick={startCheckout}
                      >
                        Pay now
                      </Button>
                      <button
                        type="button"
                        className="text-sm text-primary-600 hover:underline"
                        onClick={() => navigate("/bookings")}
                      >
                        I&apos;ll pay later (My bookings)
                      </button>
                    </div>
                  )}
                </div>
                {createdBookingId && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Some payment options require the tour currency to be USD, EUR, or GBP. Your spots
                    are held until you pay or cancel in My bookings.
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Right: summary */}
          <aside className="space-y-4">
            <section className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Price summary
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Price per person</span>
                  <span>
                    {tour.price.toLocaleString()} {tour.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span>{numberOfPeople}</span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>
                    {totalPrice.toLocaleString()} {tour.currency}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                After you reserve, you can pay from this page. Availability of payment methods depends
                on tour currency and your region.
              </p>
            </section>
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default BookingFlowPage;

