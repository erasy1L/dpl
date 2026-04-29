import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
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

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [reason, setReason] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [limit, setLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [ratingCount, setRatingCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { recommendations, reason: r } =
        await recommendationService.getRecommendations(
          limit,
          selectedCity.trim() || undefined,
        );
      setAttractions(recommendations);
      setReason(r);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  }, [limit, selectedCity]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const ratings = await ratingService.getMyRatings();
        setRatingCount(ratings.length);
      } catch {
        setRatingCount(0);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 py-12">
        <Container size="lg" className="text-center">
          <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Recommendations</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {reason ||
              "Places picked for you based on ratings, activity, and trends"}
          </p>
        </Container>
      </section>

      <Container size="xl" className="py-8">
        {ratingCount !== null && ratingCount < 3 && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            <strong>Tip:</strong> Rate at least 3 attractions to improve your
            personalized mix (we still show trending picks until then).
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Suggested attractions
              </h2>
              <div className="w-full md:w-72">
                <CityFilter value={selectedCity} onChange={setSelectedCity} />
              </div>
            </div>

            <AttractionGrid
              attractions={attractions}
              loading={loading}
              emptyMessage="No recommendations yet — try another city or explore attractions"
            />

            {!loading && attractions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLimit((prev) => prev + 12)}
                  disabled={loading}
                >
                  Load more
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/attractions")}
                >
                  Explore all attractions
                </Button>
              </div>
            )}

            {!loading && attractions.length === 0 && (
              <EmptyState
                title="Nothing to show yet"
                description="Browse attractions and add ratings so we can suggest better places."
                action={{
                  label: "Explore attractions",
                  onClick: () => navigate("/attractions"),
                }}
              />
            )}
          </div>

          <aside className="lg:col-span-1">
            <PreferencesCard onUpdate={load} />
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default RecommendationsPage;
