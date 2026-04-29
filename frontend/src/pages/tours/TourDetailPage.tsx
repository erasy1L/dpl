import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import Container from "../../components/layout/Container";
import { Button, Badge, Skeleton, EmptyState } from "../../components/ui";
import tourService from "../../services/tour.service";
import { Tour, TourSchedule } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const TourDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const t = await tourService.getById(Number(id));
        setTour(t);
      } catch (error: any) {
        console.error("Failed to load tour:", error);
        if (error?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Failed to load tour");
        }
      } finally {
        setLoading(false);
      }
    };
    const loadSchedules = async () => {
      if (!id) return;
      try {
        setLoadingSchedules(true);
        const list = await tourService.getSchedules(Number(id));
        setSchedules(list);
      } catch (error) {
        console.error("Failed to load schedules:", error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
    loadSchedules();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container size="xl" className="py-8">
          <Skeleton variant="rectangular" height={320} />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton variant="rectangular" height={280} />
            <Skeleton variant="rectangular" height={220} />
          </div>
        </Container>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Tour not found"
          description="The tour you are looking for does not exist or has been removed."
          action={{
            label: "Back to tours",
            onClick: () => navigate("/tours"),
          }}
        />
      </div>
    );
  }

  const name = getLocalizedText(tour.name);
  const description = getLocalizedText(tour.description);
  const shortDescription = getLocalizedText(tour.short_description);
  const startCity = getLocalizedText(tour.start_city);
  const endCity = getLocalizedText(tour.end_city);
  const companyName = tour.company ? getLocalizedText(tour.company.name) : "";
  const heroImage =
    tour.images?.[0]?.large ||
    tour.images?.[0]?.original ||
    "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80";

  const upcomingSchedules = schedules.filter(
    (s) => s.status === "scheduled" && s.available_spots > 0,
  );

  const handleBook = (scheduleId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to book a tour");
      navigate("/login");
      return;
    }
    navigate(`/bookings/new?tour=${tour.id}&schedule=${scheduleId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/0" />

        <Container size="xl" className="absolute inset-0 flex flex-col justify-between py-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm hover:bg-black/70 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-white max-w-3xl pb-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{name}</h1>
            {shortDescription && (
              <p className="text-sm md:text-base text-white/80 mb-3 line-clamp-2 md:line-clamp-3">
                {shortDescription}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {companyName && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur">
                  {companyName}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {startCity}
                {endCity && ` → ${endCity}`}
              </span>
              {tour.duration_days > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tour.duration_days} days
                  {tour.duration_hours > 0 && ` ${tour.duration_hours}h`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tour.duration_hours} hours
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                Up to {tour.max_group_size} people
              </span>
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: description & itinerary */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About this tour
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </section>

            {tour.attractions && tour.attractions.length > 0 && (
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Itinerary highlights
                </h2>
                <ol className="space-y-3">
                  {tour.attractions.map((a, idx) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-1 w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getLocalizedText(a.name)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getLocalizedText(a.city)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Right: booking card */}
          <aside className="space-y-4">
            <section className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1 text-gray-900">
                    <DollarSign className="w-5 h-5 text-primary-500" />
                    <span className="text-2xl font-bold">
                      {tour.price.toLocaleString()} {tour.currency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">per person</p>
                </div>
                {tour.average_rating > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">
                      ★ {tour.average_rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tour.total_bookings} bookings
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {tour.duration_days > 0
                      ? `${tour.duration_days} days`
                      : `${tour.duration_hours} hours`}{" "}
                    · Max {tour.max_group_size} people
                  </span>
                </div>

                {upcomingSchedules.length === 0 ? (
                  <p className="text-sm text-gray-600 mt-2">
                    No upcoming dates with available spots.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Upcoming dates
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {upcomingSchedules.map((s) => (
                        <button
                          key={s.id}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 text-left hover:border-primary-500 hover:bg-primary-50/40"
                          onClick={() => handleBook(s.id)}
                        >
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {new Date(s.start_date).toLocaleDateString()} –{" "}
                              {new Date(s.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {s.available_spots} spots left
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-primary-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please login to book a tour");
                      navigate("/login");
                    } else if (upcomingSchedules[0]) {
                      handleBook(upcomingSchedules[0].id);
                    } else {
                      toast.error("No available dates to book");
                    }
                  }}
                  disabled={upcomingSchedules.length === 0}
                >
                  Book this tour
                </Button>
              </div>
            </section>

            {tour.company && (
              <section className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Tour company
                </h3>
                <p className="font-medium text-gray-900 mb-1">
                  {companyName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {getLocalizedText(tour.company.city)}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {tour.company.total_tours} tours · Rating{" "}
                  {tour.company.rating.toFixed(1)}
                </p>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => navigate(`/companies/${tour.company_id}`)}
                >
                  View company
                </Button>
              </section>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default TourDetailPage;

