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
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const RecommendationsPage = () => {
  useLocale();
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
          <h1 className="text-4xl font-bold text-white mb-2">{m.recommendations_title()}</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {reason || m.recommendations_default_reason()}
          </p>
        </Container>
      </section>

      <Container size="xl" className="py-8">
        {ratingCount !== null && ratingCount < 3 && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            <strong>{m.recommendations_tip_label()}</strong> {m.recommendations_tip()}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {m.recommendations_suggested()}
              </h2>
              <div className="w-full md:w-72">
                <CityFilter value={selectedCity} onChange={setSelectedCity} />
              </div>
            </div>

            <AttractionGrid
              attractions={attractions}
              loading={loading}
              emptyMessage={m.recommendations_empty_grid()}
            />

            {!loading && attractions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLimit((prev) => prev + 12)}
                  disabled={loading}
                >
                  {m.load_more()}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/attractions")}
                >
                  {m.recommendations_explore_all()}
                </Button>
              </div>
            )}

            {!loading && attractions.length === 0 && (
              <EmptyState
                title={m.recommendations_empty_title()}
                description={m.recommendations_empty_desc()}
                action={{
                  label: m.profile_explore_attractions(),
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
