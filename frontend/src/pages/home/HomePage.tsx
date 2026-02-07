import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Star, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../components/layout/Container";
import { AttractionSearch } from "../../components/attractions";
import { CategoryGrid } from "../../components/categories";
import AttractionCard from "../../components/attractions/AttractionCard";
import CityCard from "../../components/CityCard";
import { Button, Badge, Skeleton } from "../../components/ui";
import { Attraction, Category } from "../../types/attraction.types";
import attractionService from "../../services/attraction.service";
import categoryService from "../../services/category.service";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingAttractions, setTrendingAttractions] = useState<Attraction[]>(
    []
  );
  const [topRatedAttractions, setTopRatedAttractions] = useState<Attraction[]>(
    []
  );
  const [personalizedAttractions, setPersonalizedAttractions] = useState<
    Attraction[]
  >([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCategories();
    loadTrending();
    loadTopRated();
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
          (b.average_rating || b.popularity / 2) -
          (a.average_rating || a.popularity / 2)
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
      // For now, use popular attractions as personalized
      // This can be replaced with actual recommendation service later
      const data = await attractionService.getPopular(undefined, 6);
      setPersonalizedAttractions(data);
    } catch (error) {
      console.error("Failed to load personalized recommendations:", error);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/attractions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/attractions?category=${categoryId}`);
  };

  const cityData = [
    {
      name: "Almaty",
      imageUrl:
        "https://images.pexels.com/photos/27706770/pexels-photo-27706770.jpeg",
      attractionCount: 45,
    },
    {
      name: "Astana",
      imageUrl:
        "https://images.pexels.com/photos/30083127/pexels-photo-30083127.jpeg",
      attractionCount: 32,
    },
    {
      name: "Shymkent",
      imageUrl:
        "https://images.pexels.com/photos/27706697/pexels-photo-27706697.jpeg",
      attractionCount: 18,
    },
  ];

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
                  {category.name}
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
                    Personalized based on your preferences
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cityData.map((city) => (
              <CityCard
                key={city.name}
                name={city.name}
                imageUrl={city.imageUrl}
                attractionCount={city.attractionCount}
              />
            ))}
          </div>
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
