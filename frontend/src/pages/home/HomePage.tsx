import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Star, Sparkles, ArrowRight, Briefcase, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../components/layout/Container";
import { AttractionSearch } from "../../components/attractions";
import { CategoryGrid } from "../../components/categories";
import AttractionCard from "../../components/attractions/AttractionCard";
import CityCard from "../../components/CityCard";
import { Button, Badge, Skeleton } from "../../components/ui";
import { Attraction, Category } from "../../types/attraction.types";
import attractionService, {
  CityWithCount,
} from "../../services/attraction.service";
import categoryService from "../../services/category.service";
import tourService from "../../services/tour.service";
import recommendationService from "../../services/recommendation.service";
import { Tour, TourDifficulty } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";

const tourDifficultyLabel: Record<TourDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  extreme: "Extreme",
};

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingAttractions, setTrendingAttractions] = useState<Attraction[]>(
    [],
  );
  const [topRatedAttractions, setTopRatedAttractions] = useState<Attraction[]>(
    [],
  );
  const [personalizedAttractions, setPersonalizedAttractions] = useState<
    Attraction[]
  >([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  const [cities, setCities] = useState<CityWithCount[]>([]);
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCategories();
    loadTrending();
    loadTopRated();
    loadCities();
    loadFeaturedTours();
    if (isAuthenticated) {
      loadPersonalized();
    } else {
      setLoadingPersonalized(false);
    }
  }, [isAuthenticated]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll(6);
      setCategories(data.slice(0, 6));
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTrending = async () => {
    try {
      const data = await attractionService.getTrending(undefined, 6);
      setTrendingAttractions(data);
    } catch (error) {
      console.error("Failed to load trending attractions:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const loadTopRated = async () => {
    try {
      const response = await attractionService.getAll({ limit: 6, offset: 0 });
      const sorted = [...response.attractions].sort(
        (a, b) =>
          (b.average_rating ? b.average_rating / 2 : 0) -
          (a.average_rating ? a.average_rating / 2 : 0),
      );
      setTopRatedAttractions(sorted.slice(0, 6));
    } catch (error) {
      console.error("Failed to load top rated attractions:", error);
    } finally {
      setLoadingTopRated(false);
    }
  };

  const loadPersonalized = async () => {
    try {
      const { recommendations } = await recommendationService.getRecommendations(6);
      setPersonalizedAttractions(recommendations);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const loadCities = async () => {
    try {
      const data = await attractionService.getCities(3);
      setCities(data);
    } catch (error) {
      console.error("Failed to load cities:", error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadFeaturedTours = async () => {
    try {
      const res = await tourService.list({ limit: 6, offset: 0 });
      setFeaturedTours(res.tours);
    } catch (error) {
      console.error("Failed to load tours:", error);
    } finally {
      setLoadingTours(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/attractions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/attractions?category=${categoryId}`, {
      preventScrollReset: false,
    });
  };

  // City images mapping
  const cityImages: Record<string, string> = {
    Almaty:
      "https://images.pexels.com/photos/27706770/pexels-photo-27706770.jpeg",
    Astana:
      "https://images.pexels.com/photos/30083127/pexels-photo-30083127.jpeg",
    Shymkent:
      "https://images.pexels.com/photos/27706697/pexels-photo-27706697.jpeg",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative min-h-150 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1707061788694-9dba5d6a0478?q=85')",
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0" />

        {/* Content */}
        <Container size="lg" className="relative z-10 text-center py-20 mb-14">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Discover Kazakhstan
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Explore amazing destinations powered by AI
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <AttractionSearch
                value={searchQuery}
                onChange={setSearchQuery}
                className="text-lg text-white"
              />
              <Button
                onClick={handleSearch}
                variant="ghost"
                size="lg"
                className="h-12 absolute right-0.5 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {!loadingCategories &&
              categories.slice(0, 5).map((category) => (
                <Badge
                  key={category.id}
                  variant="neutral"
                  size="md"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 cursor-pointer transition-colors px-4 py-2"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name_en}
                </Badge>
              ))}
          </div>
        </Container>
      </section>

      {/* Popular Categories Section */}
      <section className="py-12 md:py-16 lg:py-20">
        <Container size="lg">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Explore by Category
              </h2>
              <p className="text-gray-600">
                Find attractions that match your interests
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/attractions")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="hidden md:flex"
            >
              View All
            </Button>
          </div>

          <CategoryGrid
            categories={categories}
            loading={loadingCategories}
            onCategoryClick={handleCategoryClick}
          />

          <div className="mt-6 text-center md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/attractions")}
              fullWidth
            >
              View All Categories
            </Button>
          </div>
        </Container>
      </section>

      {/* Trending Attractions Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <Container size="lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Trending Now
                </h2>
                <p className="text-gray-600">Popular destinations this week</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/attractions")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="hidden md:flex"
            >
              See All
            </Button>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-card overflow-hidden"
                >
                  <Skeleton variant="rectangular" height={225} />
                  <div className="p-4 space-y-3">
                    <Skeleton variant="text" count={2} />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingAttractions.map((attraction) => (
                <AttractionCard key={attraction.id} attraction={attraction} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/attractions")}
              fullWidth
            >
              See All Trending
            </Button>
          </div>
        </Container>
      </section>

      {/* Top Rated Section */}
      <section className="py-12 md:py-16 lg:py-20">
        <Container size="lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Highest Rated
                </h2>
                <p className="text-gray-600">
                  Top-rated attractions by travelers
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/attractions?sort=rating")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="hidden md:flex"
            >
              Explore More
            </Button>
          </div>

          {loadingTopRated ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-card overflow-hidden"
                >
                  <Skeleton variant="rectangular" height={225} />
                  <div className="p-4 space-y-3">
                    <Skeleton variant="text" count={2} />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRatedAttractions.map((attraction) => (
                <AttractionCard key={attraction.id} attraction={attraction} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/attractions?sort=rating")}
              fullWidth
            >
              Explore More
            </Button>
          </div>
        </Container>
      </section>

      {/* Featured tours — visible to everyone */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <Container size="lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary-500" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Guided tours
                </h2>
                <p className="text-gray-600">
                  Book experiences across Kazakhstan
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/tours")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="hidden md:flex"
            >
              Browse all tours
            </Button>
          </div>

          {loadingTours ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-card overflow-hidden"
                >
                  <Skeleton variant="rectangular" height={176} />
                  <div className="p-4 space-y-3">
                    <Skeleton variant="text" count={2} />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTours.length === 0 ? (
            <p className="text-center text-gray-600 py-10">
              No tours are listed yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTours.map((tour) => {
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
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/tours/${tour.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/tours/${tour.id}`);
                      }
                    }}
                    className="bg-white rounded-lg shadow-card overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
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
                          <span className="text-sm font-medium text-amber-600 shrink-0">
                            ★ {tour.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {companyName}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                        <span>
                          {tour.duration_days > 0
                            ? `${tour.duration_days} days`
                            : `${tour.duration_hours} hours`}
                        </span>
                        <span className="font-semibold text-primary-600">
                          {tour.price.toLocaleString()} {tour.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {startCity}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {tourDifficultyLabel[tour.difficulty]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/tours")}
              fullWidth
            >
              Browse all tours
            </Button>
          </div>
        </Container>
      </section>

      {/* Personalized Recommendations (if logged in) */}
      {isAuthenticated && (
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <Container size="lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary-500" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Recommended for You
                  </h2>
                  <p className="text-gray-600">
                    Picked for you from one combined feed
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/recommendations")}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="hidden md:flex"
              >
                View All
              </Button>
            </div>

            {loadingPersonalized ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-card overflow-hidden"
                  >
                    <Skeleton variant="rectangular" height={225} />
                    <div className="p-4 space-y-3">
                      <Skeleton variant="text" count={2} />
                      <Skeleton variant="text" width="60%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalizedAttractions.map((attraction) => (
                  <AttractionCard key={attraction.id} attraction={attraction} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Button
                variant="outline"
                onClick={() => navigate("/recommendations")}
                fullWidth
              >
                View All Recommendations
              </Button>
            </div>
          </Container>
        </section>
      )}

      {/* Cities Section */}
      <section className="py-12 md:py-16 lg:py-20">
        <Container size="lg">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Explore by City
            </h2>
            <p className="text-gray-600">
              Discover attractions in Kazakhstan's major cities
            </p>
          </div>

          {loadingCities ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-card overflow-hidden h-64"
                >
                  <Skeleton variant="rectangular" height={256} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cities.map((city) => (
                <CityCard
                  key={city.city}
                  name={city.city}
                  imageUrl={
                    cityImages[city.city] ||
                    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000"
                  }
                  attractionCount={city.count}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section (if not logged in) */}
      {!isAuthenticated && (
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500">
          <Container size="lg" className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start Your Journey Today
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Sign up to get personalized recommendations and save your favorite
              attractions
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Get Started
            </Button>
          </Container>
        </section>
      )}
    </div>
  );
};

export default HomePage;
