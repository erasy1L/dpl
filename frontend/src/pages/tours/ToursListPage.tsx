import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, SlidersHorizontal } from "lucide-react";
import Container from "../../components/layout/Container";
import { Button, Input, Badge, Skeleton, EmptyState } from "../../components/ui";
import tourService from "../../services/tour.service";
import companyService from "../../services/company.service";
import { Tour, TourCompany, TourDifficulty } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";

const ITEMS_PER_PAGE = 12;

const difficultyLabels: Record<TourDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  extreme: "Extreme",
};

const ToursListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tours, setTours] = useState<Tour[]>([]);
  const [companies, setCompanies] = useState<TourCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [difficulty, setDifficulty] = useState<TourDifficulty | "">(
    (searchParams.get("difficulty") as TourDifficulty) || "",
  );
  const [companyId, setCompanyId] = useState<number | undefined>(
    searchParams.get("company_id")
      ? Number(searchParams.get("company_id"))
      : undefined,
  );

  const page = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await tourService.list({
          city: city || undefined,
          company_id: companyId,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          difficulty: difficulty || undefined,
          limit: ITEMS_PER_PAGE,
          offset,
        });
        setTours(response.tours);
        setTotal(response.total);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city, companyId, minPrice, maxPrice, difficulty, offset]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const res = await companyService.list({ limit: 50, offset: 0 });
        setCompanies(res.companies);
      } finally {
        setLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (companyId) params.set("company_id", String(companyId));
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (difficulty) params.set("difficulty", difficulty);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [city, companyId, minPrice, maxPrice, difficulty, page, setSearchParams]);

  const handleReset = () => {
    setCity("");
    setCompanyId(undefined);
    setMinPrice("");
    setMaxPrice("");
    setDifficulty("");
    setSearchParams({});
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilters =
    (city ? 1 : 0) +
    (companyId ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (difficulty ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Filters
                </h2>
                {activeFilters > 0 && (
                  <Badge variant="primary" size="sm" className="ml-auto">
                    {activeFilters}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  placeholder="Almaty, Astana..."
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Max price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    value={companyId || ""}
                    onChange={(e) =>
                      setCompanyId(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  >
                    <option value="">Any company</option>
                    {!loadingCompanies &&
                      companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {getLocalizedText(c.name)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as TourDifficulty | "")
                    }
                  >
                    <option value="">Any</option>
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>

                <Button variant="outline" fullWidth onClick={handleReset}>
                  Reset filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Tours
              </h1>
              <p className="text-gray-600">
                Discover guided tours and experiences across Kazakhstan.
              </p>
            </header>

            {!loading && (
              <p className="text-sm text-gray-600 mb-4">
                {total} {total === 1 ? "tour" : "tours"} found
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={260} />
                ))}
              </div>
            ) : tours.length === 0 ? (
              <EmptyState
                title="No tours found"
                description="Try adjusting your filters or exploring another city."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tours.map((tour) => {
                    const name = getLocalizedText(tour.name);
                    const startCity = getLocalizedText(tour.start_city);
                    const companyName = tour.company
                      ? getLocalizedText(tour.company.name)
                      : "";
                    const image =
                      tour.images?.[0]?.medium ||
                      tour.images?.[0]?.original ||
                      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80";

                    return (
                      <div
                        key={tour.id}
                        className="bg-white rounded-lg shadow-card overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
                        onClick={() => navigate(`/tours/${tour.id}`)}
                      >
                        <div className="h-44 w-full overflow-hidden">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {name}
                            </h3>
                            {tour.average_rating > 0 && (
                              <span className="text-sm font-medium text-amber-600">
                                ★ {tour.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {companyName}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                            <span>{tour.duration_days > 0 ? `${tour.duration_days} days` : `${tour.duration_hours} hours`}</span>
                            <span className="font-semibold text-primary-600">
                              {tour.price.toLocaleString()} {tour.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              {startCity}
                            </span>
                            {difficulty && (
                              <Badge variant="neutral" size="sm">
                                {difficultyLabels[tour.difficulty]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
};

export default ToursListPage;

