import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Clock,
  DollarSign,
  Timer,
  TrendingUp,
  Map as MapIcon,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../components/layout/Container";
import {
  Button,
  Badge,
  Rating,
  Skeleton,
  EmptyState,
  Input,
  Modal,
} from "../../components/ui";
import { AttractionCard } from "../../components/attractions";
import { RatingForm, ReviewList } from "../../components/ratings";
import Map from "../../components/Map";
import { Attraction, Category } from "../../types/attraction.types";
import { Rating as RatingType } from "../../types/rating.types";
import attractionService from "../../services/attraction.service";
import ratingService from "../../services/rating.service";
import categoryService from "../../services/category.service";
import { getCurrentLocale, getLocalizedText, getCategoryName } from "../../utils/localization";
import toast from "react-hot-toast";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const AttractionDetailPage = () => {
  useLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = user?.role === "manager" || user?.role === "admin";

  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [similarAttractions, setSimilarAttractions] = useState<Attraction[]>(
    [],
  );
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Manager/Admin: attraction editor
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [loadingAdminCategories, setLoadingAdminCategories] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | undefined>(
    undefined,
  );
  const [editLongitude, setEditLongitude] = useState<number | undefined>(
    undefined,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Track if view has been incremented to prevent double counting
  const viewIncrementedRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadAttraction();
      loadRatings();
      // Reset view incremented flag when ID changes
      viewIncrementedRef.current = false;
    }
  }, [id]);

  // Load similar attractions after attraction is loaded
  useEffect(() => {
    if (attraction) {
      loadSimilarAttractions();
    }
  }, [attraction?.id]);

  useEffect(() => {
    // Check if attraction is in favorites
    if (attraction) {
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      setIsFavorite(favorites.includes(attraction.id));
    }
  }, [attraction]);

  const loadAdminCategories = async () => {
    try {
      setLoadingAdminCategories(true);
      const cats = await categoryService.getAll();
      setAdminCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error(m.toast_load_categories_failed());
    } finally {
      setLoadingAdminCategories(false);
    }
  };

  const openEditModal = async () => {
    if (!attraction) return;

    const locale = getCurrentLocale();
    setEditName(getLocalizedText(attraction.name, locale));
    setEditDescription(getLocalizedText(attraction.description, locale));
    setEditCity(getLocalizedText(attraction.city, locale));
    setEditAddress(getLocalizedText(attraction.address, locale));
    setEditCountry(getLocalizedText(attraction.country, locale));
    setEditLatitude(attraction.latitude);
    setEditLongitude(attraction.longitude);
    setSelectedCategoryIds(attraction.categories?.map((c) => c.id) ?? []);

    if (adminCategories.length === 0) {
      await loadAdminCategories();
    }

    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!attraction) return;

    const locale = getCurrentLocale();
    if (!editName.trim() || !editCity.trim()) {
      toast.error(m.toast_name_city_required());
      return;
    }

    const payload: any = {
      name: { [locale]: editName },
      city: { [locale]: editCity },
      description: editDescription.trim()
        ? { [locale]: editDescription }
        : undefined,
      address: editAddress.trim() ? { [locale]: editAddress } : undefined,
      country: editCountry.trim() ? { [locale]: editCountry } : undefined,
      latitude: editLatitude,
      longitude: editLongitude,
      category_ids: selectedCategoryIds,
    };

    // Remove undefined keys so backend doesn't try to overwrite with null values.
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      setEditSaving(true);
      await attractionService.updateAttraction(parseInt(id!), payload);
      toast.success(m.toast_attraction_updated());
      setEditModalOpen(false);
      await loadAttraction();
    } catch (error: any) {
      console.error("Failed to update attraction:", error);
      toast.error(
        error?.message || m.toast_update_attraction_failed(),
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!attraction) return;

    const ok = confirm(m.confirm_delete_attraction_detail());
    if (!ok) return;

    try {
      await attractionService.deleteAttraction(attraction.id);
      toast.success(m.toast_attraction_deleted());
      navigate("/attractions");
    } catch (error: any) {
      console.error("Failed to delete attraction:", error);
      toast.error(error?.message || m.toast_delete_attraction_failed());
    }
  };

  // Open editor if URL contains ?edit=1
  useEffect(() => {
    if (!canManage) return;
    const editFlag = searchParams.get("edit");
    if (editFlag === "1" && attraction) {
      openEditModal();
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, attraction?.id]);

  const loadAttraction = async () => {
    try {
      setLoading(true);
      const data = await attractionService.getById(parseInt(id!));
      setAttraction(data);

      // Increment view count only once per attraction visit
      if (!viewIncrementedRef.current) {
        viewIncrementedRef.current = true;
        await attractionService.incrementView(parseInt(id!));
      }
    } catch (error: any) {
      console.error("Failed to load attraction:", error);
      if (error.status === 404) {
        setNotFound(true);
      } else {
        toast.error(m.toast_load_attraction_failed());
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarAttractions = async () => {
    try {
      setLoadingSimilar(true);
      // Load similar attractions
      const response = await attractionService.getAll({
        limit: 10,
        offset: 0,
      });
      // Filter out current attraction
      const filtered = response.attractions.filter(
        (a) => a.id !== parseInt(id!),
      );
      setSimilarAttractions(filtered.slice(0, 6));
    } catch (error) {
      console.error("Failed to load similar attractions:", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const loadRatings = async () => {
    try {
      setLoadingRatings(true);
      const response = await ratingService.getAttractionRatings(parseInt(id!));
      setRatings(response.ratings);
    } catch (error) {
      console.error("Failed to load ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const attractionName = getLocalizedText(attraction?.name);
    const attractionDescription = getLocalizedText(attraction?.description);

    if (navigator.share) {
      try {
        await navigator.share({
          title: attractionName,
          text: attractionDescription,
          url: url,
        });
        toast.success(m.toast_shared_success());
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success(m.toast_link_copied());
      } catch (error) {
        toast.error(m.toast_copy_failed());
      }
    }
  };

  const toggleFavorite = () => {
    if (!attraction) return;

    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const newFavorites = isFavorite
      ? favorites.filter((fid: number) => fid !== attraction.id)
      : [...favorites, attraction.id];

    localStorage.setItem("favorites", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? m.toast_removed_favorites() : m.toast_added_favorites());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading state */}
        <div className="w-full h-96 bg-gray-200 animate-pulse" />
        <Container size="xl" className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" count={5} />
            </div>
            <div className="space-y-4">
              <Skeleton variant="rectangular" height={200} />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (notFound || !attraction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title={m.attraction_not_found_title()}
          description={m.attraction_not_found_desc()}
          action={{
            label: m.back_to_explore(),
            onClick: () => navigate("/attractions"),
          }}
        />
      </div>
    );
  }

  // Extract original image URLs or use placeholder
  const images =
    attraction.images && attraction.images.length > 0
      ? attraction.images
          .map((img) => img.original)
          .filter((url): url is string => !!url)
      : [];

  // If no images, use placeholder SVG
  const displayImages =
    images.length > 0
      ? images
      : [
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23d1d5db'/%3E%3Cg transform='translate(500 200)'%3E%3Crect x='10' y='10' width='180' height='180' fill='none' stroke='%23ffffff' stroke-width='6' rx='4'/%3E%3Ccircle cx='60' cy='70' r='20' fill='%23ffffff'/%3E%3Cpath d='M20 160 L70 100 L110 140 L150 90 L180 120 L180 180 L20 180 Z' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E",
        ];

  const attractionName = getLocalizedText(attraction.name);
  const attractionDescription = getLocalizedText(attraction.description);
  const attractionCity = getLocalizedText(attraction.city);
  const attractionAddress = getLocalizedText(attraction.address);

  const shouldTruncate = attractionDescription.length > 300;
  const displayDescription =
    shouldTruncate && !showFullDescription
      ? attractionDescription.slice(0, 300) + "..."
      : attractionDescription;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Gallery */}
      <section className="relative bg-black">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 p-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button
            onClick={toggleFavorite}
            className="p-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Main Image */}
        <div className="w-full aspect-video max-h-[600px]">
          <img
            src={displayImages[selectedImageIndex]}
            alt={attractionName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg">
            {displayImages.map((img: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-20 h-12 rounded overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? "border-white scale-110"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${attractionName} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Main Content */}
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {attractionName}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{attractionCity}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Rating
                  value={attraction.average_rating || 0}
                  readonly
                  showValue
                />
                {attraction.total_ratings && (
                  <span className="text-gray-600">
                    ({attraction.total_ratings} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Key Information Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-gray-900">{m.popularity()}</h3>
                </div>
                <p className="text-gray-600">
                  {attraction.total_views
                    ? m.views_count({ count: attraction.total_views })
                    : m.popular_destination()}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-gray-900">{m.location()}</h3>
                </div>
                <p className="text-gray-600">{attractionCity}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{m.about()}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {displayDescription}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showFullDescription ? m.show_less() : m.read_more()}
                </button>
              )}
            </div>

            {/* Location Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {m.location()}
              </h2>

              {/* Map */}
              {attraction.latitude && attraction.longitude ? (
                <div className="w-full h-64 mb-4">
                  <Map
                    latitude={attraction.latitude}
                    longitude={attraction.longitude}
                    markerTitle={attractionName}
                    zoom={14}
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">{m.location_not_available()}</p>
                  </div>
                </div>
              )}

              <p className="text-gray-700 mb-4">
                {attractionCity}
                {attractionAddress && `, ${attractionAddress}`}
              </p>

              {attraction.latitude && attraction.longitude && (
                <Button
                  variant="outline"
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`,
                      "_blank",
                    );
                  }}
                >
                  {m.get_directions()}
                </Button>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {m.reviews()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Rating
                      value={attraction.average_rating || 0}
                      readonly
                      showValue
                    />
                    <span className="text-gray-600">
                      ({ratings.length}{" "}
                      {ratings.length === 1 ? m.review_one() : m.reviews_many()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Form */}
              {isAuthenticated && (
                <div className="mb-6">
                  <RatingForm
                    attractionId={attraction.id}
                    onSuccess={loadRatings}
                  />
                </div>
              )}

              {/* Review List */}
              <ReviewList ratings={ratings} loading={loadingRatings} />
            </div>
          </div>

          {/* Right Column (Sticky) */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {m.plan_your_visit()}
              </h3>
              <div className="space-y-3">
                <Button
                  variant={isFavorite ? "secondary" : "primary"}
                  fullWidth
                  leftIcon={
                    <Heart
                      className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                    />
                  }
                  onClick={toggleFavorite}
                >
                  {isFavorite ? m.saved() : m.add_to_favorites()}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<Share2 className="w-5 h-5" />}
                  onClick={handleShare}
                >
                  {m.share()}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<ExternalLink className="w-5 h-5" />}
                  onClick={() => {
                    const query = encodeURIComponent(
                      `${attractionName}, ${attractionCity}`,
                    );
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${query}`,
                      "_blank",
                    );
                  }}
                >
                  {m.get_directions()}
                </Button>

                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={openEditModal}
                      isLoading={editSaving}
                    >
                      {m.edit_attraction()}
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleDelete}
                      disabled={editSaving}
                    >
                      {m.delete_attraction()}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Similar Attractions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {m.you_might_also_like()}
              </h3>
              {loadingSimilar ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={100} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {similarAttractions.slice(0, 4).map((similar) => {
                    const similarName = getLocalizedText(similar.name);
                    const similarCity = getLocalizedText(similar.city);
                    const similarImageUrl =
                      similar.images?.[0]?.original ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80' viewBox='0 0 100 80'%3E%3Crect width='100' height='80' fill='%23d1d5db'/%3E%3Cg transform='translate(30 20)'%3E%3Crect x='2' y='2' width='36' height='36' fill='none' stroke='%23ffffff' stroke-width='2' rx='1'/%3E%3Ccircle cx='12' cy='14' r='4' fill='%23ffffff'/%3E%3Cpath d='M5 32 L15 22 L22 28 L30 20 L36 26 L36 36 L5 36 Z' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E";
                    return (
                      <div
                        key={similar.id}
                        onClick={() => navigate(`/attractions/${similar.id}`)}
                        className="cursor-pointer group"
                      >
                        <div className="flex gap-3">
                          <img
                            src={similarImageUrl}
                            alt={similarName}
                            className="w-24 h-20 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                              {similarName}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1">
                              {similarCity}
                            </p>
                            <Rating
                              value={similar.average_rating || 0}
                              readonly
                              showValue
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {similarAttractions.length > 4 && (
                    <button
                      onClick={() => navigate(`/attractions`)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm w-full text-center"
                    >
                      {m.view_all_similar()}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* More Like This Section */}
      {similarAttractions.length > 0 && (
        <section className="py-12 bg-white">
          <Container size="lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {m.explore_similar()}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarAttractions.slice(0, 6).map((similar) => (
                <AttractionCard key={similar.id} attraction={similar} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Attraction Editor Modal (manager/admin) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={m.edit_attraction()}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={m.admin_name_localized()}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={m.placeholder_name_example()}
              required
            />
            <Input
              label={m.admin_city_localized()}
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              placeholder={m.placeholder_city_example()}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {m.admin_description_localized()}
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
              placeholder={m.placeholder_description_short()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={m.admin_address_localized()}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder={m.placeholder_address()}
            />
            <Input
              label={m.admin_country_localized()}
              value={editCountry}
              onChange={(e) => setEditCountry(e.target.value)}
              placeholder={m.placeholder_country()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={m.admin_latitude()}
              type="number"
              step="any"
              value={editLatitude ?? ""}
              onChange={(e) =>
                setEditLatitude(
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              placeholder={m.placeholder_latitude()}
            />
            <Input
              label={m.admin_longitude()}
              type="number"
              step="any"
              value={editLongitude ?? ""}
              onChange={(e) =>
                setEditLongitude(
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              placeholder={m.placeholder_longitude()}
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              {m.admin_categories_label()}
            </h4>
            {loadingAdminCategories ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={36} />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {adminCategories.map((cat) => {
                  const checked = selectedCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedCategoryIds, cat.id]
                            : selectedCategoryIds.filter(
                                (id) => id !== cat.id,
                              );
                          setSelectedCategoryIds(next);
                        }}
                      />
                      <span className="text-sm text-gray-900">
                        {getCategoryName(cat)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editSaving}
            >
              {m.cancel()}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={editSaving}
            >
              {m.save_changes()}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttractionDetailPage;
