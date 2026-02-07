import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Users, TrendingUp } from "lucide-react";
import Container from "../../components/layout/Container";
import { AttractionGrid } from "../../components/attractions";
import CityFilter from "../../components/CityFilter";
import PreferencesCard from "../../components/PreferencesCard";
import { Button, EmptyState } from "../../components/ui";
import { Attraction } from "../../types/attraction.types";
import recommendationService from "../../services/recommendation.service";
import ratingService from "../../services/rating.service";

const RecommendationsPage = () => {
  const navigate = useNavigate();

  const [contentBasedAttractions, setContentBasedAttractions] = useState<
    Attraction[]
  >([]);
  const [collaborativeAttractions, setCollaborativeAttractions] = useState<
    Attraction[]
  >([]);
  const [trendingAttractions, setTrendingAttractions] = useState<Attraction[]>(
    []
  );
  const [selectedCity, setSelectedCity] = useState("");
  const [hasRatings, setHasRatings] = useState(false);

  const [loadingContentBased, setLoadingContentBased] = useState(true);
  const [loadingCollaborative, setLoadingCollaborative] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [checkingRatings, setCheckingRatings] = useState(true);

  const [contentBasedLimit, setContentBasedLimit] = useState(8);
  const [collaborativeLimit, setCollaborativeLimit] = useState(8);

  useEffect(() => {
    checkUserRatings();
  }, []);

  useEffect(() => {
    if (hasRatings) {
      loadContentBased();
      loadCollaborative();
    }
  }, [hasRatings]);

  useEffect(() => {
    loadTrending();
  }, [selectedCity]);

  const checkUserRatings = async () => {
    try {
      setCheckingRatings(true);
      const ratings = await ratingService.getMyRatings();
      setHasRatings(ratings.length >= 3);
    } catch (error) {
      console.error("Failed to check ratings:", error);
      setHasRatings(false);
    } finally {
      setCheckingRatings(false);
    }
  };

  const loadContentBased = async () => {
    try {
      setLoadingContentBased(true);
      const data = await recommendationService.getContentBased(
        contentBasedLimit
      );
      setContentBasedAttractions(data);
    } catch (error) {
      console.error("Failed to load content-based recommendations:", error);
    } finally {
      setLoadingContentBased(false);
    }
  };

  const loadCollaborative = async () => {
    try {
      setLoadingCollaborative(true);
      const data = await recommendationService.getCollaborative(
        collaborativeLimit
      );
      setCollaborativeAttractions(data);
    } catch (error) {
      console.error("Failed to load collaborative recommendations:", error);
    } finally {
      setLoadingCollaborative(false);
    }
  };

  const loadTrending = async () => {
    try {
      setLoadingTrending(true);
      const data = selectedCity
        ? await recommendationService.getTrendingByCity(selectedCity, 12)
        : await recommendationService.getTrendingByCity("Almaty", 12);
      setTrendingAttractions(data);
    } catch (error) {
      console.error("Failed to load trending recommendations:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleLoadMoreContentBased = () => {
    setContentBasedLimit((prev) => prev + 8);
    loadContentBased();
  };

  const handleLoadMoreCollaborative = () => {
    setCollaborativeLimit((prev) => prev + 8);
    loadCollaborative();
  };

  if (checkingRatings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!hasRatings) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Small Hero */}
        <section className="bg-gradient-to-br from-primary-500 to-secondary-500 py-12">
          <Container size="lg" className="text-center">
            <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              Personalized for You
            </h1>
            <p className="text-xl text-white/90">
              Discover attractions based on your preferences
            </p>
          </Container>
        </section>

        {/* Empty State */}
        <Container size="lg" className="py-16">
          <EmptyState
            icon={<Star className="w-16 h-16" />}
            title="Start Rating Attractions"
            description="Rate at least 3 attractions to get personalized recommendations tailored to your interests."
            action={{
              label: "Explore Attractions",
              onClick: () => navigate("/attractions"),
            }}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 py-12">
        <Container size="lg" className="text-center">
          <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">
            Personalized for You
          </h1>
          <p className="text-xl text-white/90">
            Discover attractions based on your preferences
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Content-Based Recommendations */}
            <section>
              <div className="flex items-start gap-3 mb-6">
                <Star className="w-8 h-8 text-primary-500 mt-1" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Based on Your Interests
                  </h2>
                  <p className="text-gray-600">
                    Attractions similar to ones you liked
                  </p>
                </div>
              </div>

              <AttractionGrid
                attractions={contentBasedAttractions}
                loading={loadingContentBased}
                emptyMessage="No recommendations available yet"
              />

              {!loadingContentBased &&
                contentBasedAttractions.length >= contentBasedLimit && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreContentBased}
                    >
                      Load More
                    </Button>
                  </div>
                )}
            </section>

            {/* Collaborative Recommendations */}
            <section>
              <div className="flex items-start gap-3 mb-6">
                <Users className="w-8 h-8 text-primary-500 mt-1" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Popular with Similar Users
                  </h2>
                  <p className="text-gray-600">
                    Travelers like you also enjoyed these
                  </p>
                </div>
              </div>

              <AttractionGrid
                attractions={collaborativeAttractions}
                loading={loadingCollaborative}
                emptyMessage="No recommendations available yet"
              />

              {!loadingCollaborative &&
                collaborativeAttractions.length >= collaborativeLimit && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreCollaborative}
                    >
                      Load More
                    </Button>
                  </div>
                )}
            </section>

            {/* Trending in Area */}
            <section>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-8 h-8 text-orange-500 mt-1" />
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Trending Now
                    </h2>
                    <p className="text-gray-600">
                      Popular destinations in your selected city
                    </p>
                  </div>
                </div>
                <div className="hidden md:block w-64">
                  <CityFilter value={selectedCity} onChange={setSelectedCity} />
                </div>
              </div>

              <div className="md:hidden mb-4">
                <CityFilter value={selectedCity} onChange={setSelectedCity} />
              </div>

              <AttractionGrid
                attractions={trendingAttractions}
                loading={loadingTrending}
                emptyMessage="No trending attractions in this city"
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <PreferencesCard
              onUpdate={() => {
                loadContentBased();
                loadCollaborative();
              }}
            />
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default RecommendationsPage;
