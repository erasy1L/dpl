import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, Phone, Mail, Star } from "lucide-react";
import Container from "../../components/layout/Container";
import { Button, Skeleton, EmptyState } from "../../components/ui";
import companyService from "../../services/company.service";
import { TourCompany, Tour } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<TourCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const c = await companyService.getById(Number(id));
        setCompany(c);
      } catch (error: any) {
        console.error("Failed to load company:", error);
        if (error?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container size="xl" className="py-8">
          <Skeleton variant="rectangular" height={200} />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={220} />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Company not found"
          description="This company does not exist or has been removed."
          action={{
            label: "Back to companies",
            onClick: () => navigate("/companies"),
          }}
        />
      </div>
    );
  }

  const name = getLocalizedText(company.name);
  const description = getLocalizedText(company.description);
  const city = getLocalizedText(company.city);
  const address = getLocalizedText(company.address);

  const tours: Tour[] = (company as any).tours || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="xl" className="py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-4 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-primary-600">
                {name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {name}
              </h1>
              {company.is_verified && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Verified operator
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {city}
              {address && ` · ${address}`}
            </p>

            <p className="text-xs text-gray-500 mb-3">
              {company.total_tours} tours · Rating {company.rating.toFixed(1)}
            </p>

            <p className="text-gray-700 mb-3">{description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              {company.website && (
                <button
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  onClick={() => window.open(company.website!, "_blank")}
                >
                  <Globe className="w-4 h-4" />
                  Website
                </button>
              )}
              {company.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {company.phone}
                </span>
              )}
              {company.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {company.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Tours by this company
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/tours?company_id=${company.id}&city=${encodeURIComponent(city)}`)
              }
            >
              View in tours list
            </Button>
          </div>

          {tours.length === 0 ? (
            <EmptyState
              title="No tours yet"
              description="This company has no public tours listed."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tours.map((tour) => {
                const tName = getLocalizedText(tour.name);
                const tCity = getLocalizedText(tour.start_city);
                const image =
                  tour.images?.[0]?.medium ||
                  tour.images?.[0]?.original ||
                  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80";

                return (
                  <div
                    key={tour.id}
                    className="bg-white rounded-lg shadow-card overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all"
                    onClick={() => navigate(`/tours/${tour.id}`)}
                  >
                    <div className="h-40 w-full overflow-hidden">
                      <img
                        src={image}
                        alt={tName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {tName}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {tCity}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-700 mt-1">
                        <span>
                          {tour.duration_days > 0
                            ? `${tour.duration_days} days`
                            : `${tour.duration_hours} hours`}
                        </span>
                        <span className="font-semibold text-primary-600">
                          {tour.price.toLocaleString()} {tour.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
};

export default CompanyDetailPage;

