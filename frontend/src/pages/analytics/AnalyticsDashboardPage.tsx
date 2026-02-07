import { useState, useEffect } from "react";
import { MapPin, Eye, Star, Users, RefreshCw, Clock } from "lucide-react";
import { cn } from "../../utils/cn";
import Container from "../../components/layout/Container";
import {
  MetricCard,
  LineChart,
  BarChartComponent,
  PieChartComponent,
  TrendingTable,
} from "../../components/analytics";
import { Button, Skeleton } from "../../components/ui";
import {
  AnalyticsOverview,
  TimeSeriesData,
  CategoryStats,
  CityStats,
  AttractionStats,
  RatingDistribution,
} from "../../types/analytics.types";
import analyticsService from "../../services/analytics.service";
import { formatRelativeTime } from "../../utils/formatters";

const AnalyticsDashboardPage = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [viewsOverTime, setViewsOverTime] = useState<TimeSeriesData[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [topByViews, setTopByViews] = useState<AttractionStats[]>([]);
  const [topByRating, setTopByRating] = useState<AttractionStats[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDistribution>({});

  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    let interval: number;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        loadAllData();
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        viewsData,
        categoriesData,
        citiesData,
        topViewsData,
        topRatingData,
        ratingDistData,
      ] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getViewsOverTime(30),
        analyticsService.getCategoryStats(),
        analyticsService.getCityStats(),
        analyticsService.getTopAttractions("views", 10),
        analyticsService.getTopAttractions("rating", 10),
        analyticsService.getRatingDistribution(),
      ]);

      setOverview(overviewData);
      setViewsOverTime(viewsData);
      setCategoryStats(categoriesData);
      setCityStats(citiesData);
      setTopByViews(topViewsData);
      setTopByRating(topRatingData);
      setRatingDist(ratingDistData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const ratingDistData = Object.entries(ratingDist).map(([stars, count]) => ({
    stars: `${stars} ⭐`,
    count,
  }));

  const viewsColumns = [
    { key: "name", label: "Attraction", sortable: true },
    { key: "city", label: "City", sortable: true },
    {
      key: "views",
      label: "Views",
      sortable: true,
      render: (val: number) => val.toLocaleString(),
    },
    { key: "trend", label: "Trend", sortable: true },
  ];

  const ratingColumns = [
    { key: "name", label: "Attraction", sortable: true },
    { key: "city", label: "City", sortable: true },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (val: number) => `${val.toFixed(1)} ⭐`,
    },
    { key: "reviewCount", label: "Reviews", sortable: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tourism Analytics Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                Last updated {formatRelativeTime(lastUpdated.toISOString())}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3">
            <Button
              variant={autoRefresh ? "primary" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              leftIcon={
                <RefreshCw
                  className={cn("w-4 h-4", autoRefresh && "animate-spin")}
                />
              }
            >
              {autoRefresh ? "Auto-refreshing" : "Auto-refresh"}
            </Button>
            <Button
              variant="outline"
              onClick={loadAllData}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" height={120} />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                title="Total Attractions"
                value={overview?.total_attractions || 0}
                icon={<MapPin className="w-6 h-6" />}
                change={overview?.trends.views}
                trend="up"
              />
              <MetricCard
                title="Total Views"
                value={overview?.total_views || 0}
                icon={<Eye className="w-6 h-6" />}
                change={overview?.trends.views}
                trend={
                  overview?.trends.views && overview.trends.views > 0
                    ? "up"
                    : "down"
                }
              />
              <MetricCard
                title="Average Rating"
                value={overview?.average_rating.toFixed(1) || "0.0"}
                icon={<Star className="w-6 h-6" />}
                change={overview?.trends.ratings}
                trend={
                  overview?.trends.ratings && overview.trends.ratings > 0
                    ? "up"
                    : "down"
                }
              />
              <MetricCard
                title="Active Users"
                value={overview?.active_users || 0}
                icon={<Users className="w-6 h-6" />}
                change={overview?.trends.users}
                trend={
                  overview?.trends.users && overview.trends.users > 0
                    ? "up"
                    : "down"
                }
              />
            </>
          )}
        </div>

        {/* Charts Section 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Views Over Time
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <LineChart
                data={viewsOverTime}
                dataKey="views"
                xKey="date"
                color="#0ea5e9"
                height={300}
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Category Distribution
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <PieChartComponent
                data={categoryStats}
                dataKey="count"
                nameKey="category"
                height={300}
              />
            )}
          </div>
        </div>

        {/* Charts Section 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              City Comparison
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <BarChartComponent
                data={cityStats}
                dataKeys={[
                  { key: "total_views", color: "#0ea5e9", name: "Views" },
                  {
                    key: "average_rating",
                    color: "#f59e0b",
                    name: "Average rating",
                  },
                ]}
                xKey="city"
                height={300}
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Rating Distribution
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <BarChartComponent
                data={ratingDistData}
                dataKeys={[
                  {
                    key: "count",
                    color: "#f59e0b",
                    name: "Count",
                  },
                ]}
                xKey="stars"
                height={300}
              />
            )}
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Attractions by Views
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : (
              <TrendingTable data={topByViews} columns={viewsColumns} />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Attractions by Rating
            </h2>
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : (
              <TrendingTable data={topByRating} columns={ratingColumns} />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AnalyticsDashboardPage;
