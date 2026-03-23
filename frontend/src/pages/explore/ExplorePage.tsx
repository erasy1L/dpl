import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AttractionGrid,
  AttractionFilters,
  AttractionSearch,
} from "../../components/attractions";
import Container from "../../components/layout/Container";
import { Button, Badge } from "../../components/ui";
import {
  Attraction,
  AttractionFilters as Filters,
} from "../../types/attraction.types";
import attractionService from "../../services/attraction.service";
import { getLocalizedText } from "../../utils/localization";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 15;

type SortOption = "popular" | "rating" | "name" | "recent";

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Track if this is the initial mount to prevent URL sync from triggering extra fetches
  const isInitialMount = useRef(true);

  // Parse filters from URL
  const [filters, setFilters] = useState<Filters>(() => {
    const categoryParam = searchParams.get("category");
    const categoryIds = categoryParam ? [parseInt(categoryParam)] : undefined;

    return {
      search: searchParams.get("search") || undefined,
      city: searchParams.get("city") || undefined,
      category_ids: categoryIds,
      min_rating: searchParams.get("minRating")
        ? parseInt(searchParams.get("minRating")!)
        : undefined,
      limit: ITEMS_PER_PAGE,
      offset: searchParams.get("page")
        ? (parseInt(searchParams.get("page")!) - 1) * ITEMS_PER_PAGE
        : 0,
    };
  });

  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "popular",
  );

  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Load attractions
  useEffect(() => {
    let cancelled = false;

    const loadAttractions = async () => {
      try {
        setLoading(true);
        const response = await attractionService.getAll(filters);

        if (cancelled) return;

        // Sort attractions based on sortBy
        let sortedAttractions = [...response.attractions];
        switch (sortBy) {
          case "rating":
            sortedAttractions.sort(
              (a, b) => (b.average_rating || 0) - (a.average_rating || 0),
            );
            break;
          case "name":
            sortedAttractions.sort((a, b) => {
              const nameA = getLocalizedText(a.name);
              const nameB = getLocalizedText(b.name);
              return nameA.localeCompare(nameB);
            });
            break;
          case "recent":
            sortedAttractions.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );
            break;
          case "popular":
          default:
            sortedAttractions.sort(
              (a, b) => (b.total_views || 0) - (a.total_views || 0),
            );
            break;
        }

        setAttractions(sortedAttractions);
        setTotal(response.total);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load attractions:", error);
        toast.error("Failed to load attractions. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAttractions();

    return () => {
      cancelled = true;
    };
  }, [
    filters.search,
    filters.city,
    filters.category_ids,
    filters.min_rating,
    filters.offset,
    filters.limit,
    sortBy,
  ]);

  // Update URL params when filters change (but don't trigger on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.city) params.set("city", filters.city);
    if (filters.category_ids && filters.category_ids.length === 1) {
      params.set("category", filters.category_ids[0].toString());
    }
    if (filters.min_rating)
      params.set("minRating", filters.min_rating.toString());

    // Calculate page from offset
    const page = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
    if (page > 1) params.set("page", page.toString());

    if (sortBy !== "popular") params.set("sort", sortBy);

    setSearchParams(params, { replace: true });
  }, [
    filters.search,
    filters.city,
    filters.category_ids,
    filters.min_rating,
    filters.offset,
    sortBy,
    setSearchParams,
  ]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, limit: ITEMS_PER_PAGE, offset: 0 });
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined, offset: 0 }));
  };

  const handleResetFilters = () => {
    setFilters({ limit: ITEMS_PER_PAGE, offset: 0 });
    setSortBy("popular");
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, offset: (page - 1) * ITEMS_PER_PAGE }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount =
    (filters.city ? 1 : 0) +
    (filters.min_rating ? 1 : 0) +
    (filters.category_ids && filters.category_ids.length > 0
      ? filters.category_ids.length
      : 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <AttractionFilters
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Explore Attractions
              </h1>
              <p className="text-gray-600">
                Discover amazing places across Kazakhstan
              </p>
            </div>

            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
                leftIcon={<Filter className="w-5 h-5" />}
              >
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {/* Search */}
              <div className="flex-1">
                <AttractionSearch
                  value={filters.search || ""}
                  onChange={handleSearchChange}
                  loading={loading}
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>

            {/* Results Count */}
            {!loading && (
              <div className="mb-4 text-sm text-gray-600">
                {total} {total === 1 ? "result" : "results"} found
              </div>
            )}

            {/* Attraction Grid */}
            <AttractionGrid
              attractions={attractions}
              loading={loading}
              emptyMessage="No attractions match your criteria"
            />

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? "bg-primary-500 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </Container>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <AttractionFilters
                filters={filters}
                onChange={(newFilters) => {
                  handleFilterChange(newFilters);
                  setShowMobileFilters(false);
                }}
                onReset={() => {
                  handleResetFilters();
                  setShowMobileFilters(false);
                }}
                isMobile
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
