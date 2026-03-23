import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MapPin,
  Edit,
  Star,
  MessageSquare,
  Eye,
  Heart,
  Filter,
  Shield,
  Lock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../components/layout/Container";
import {
  Avatar,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  EmptyState,
  Modal,
  Input,
  Skeleton,
} from "../../components/ui";
import { AttractionCard } from "../../components/attractions";
import RatedAttractionCard from "../../components/RatedAttractionCard";
import ActivityItem from "../../components/ActivityItem";
import PreferencesCard from "../../components/PreferencesCard";
import { UserProfile, UserActivity } from "../../types/user.types";
import { Rating as RatingType } from "../../types/rating.types";
import { Attraction } from "../../types/attraction.types";
import userService from "../../services/user.service";
import ratingService from "../../services/rating.service";
import attractionService from "../../services/attraction.service";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [favorites, setFavorites] = useState<Attraction[]>([]);
  const [activity, setActivity] = useState<UserActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);

  const allowedTabs = ["ratings", "favorites", "activity", "preferences", "security"] as const;
  type ProfileTab = (typeof allowedTabs)[number];
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    allowedTabs.includes(initialTab as ProfileTab)
      ? (initialTab as ProfileTab)
      : "ratings",
  );

  useEffect(() => {
    loadProfile();
    loadRatings();
    loadFavorites();
    loadActivity();
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (allowedTabs.includes(tabFromUrl as ProfileTab)) {
      setActiveTab(tabFromUrl as ProfileTab);
    }
  }, [searchParams]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
      setEditName(data.name);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      setLoadingRatings(true);
      const data = await ratingService.getMyRatings();
      setRatings(data);
    } catch (error) {
      console.error("Failed to load ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const favoriteIds = JSON.parse(localStorage.getItem("favorites") || "[]");
      const attractionsPromises = favoriteIds.map((id: number) =>
        attractionService.getById(id).catch(() => null)
      );
      const attractionsData = await Promise.all(attractionsPromises);
      setFavorites(attractionsData.filter((a) => a !== null) as Attraction[]);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadActivity = async () => {
    try {
      setLoadingActivity(true);
      const data = await userService.getActivity();
      setActivity(data);
    } catch (error) {
      console.error("Failed to load activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await userService.updateProfile({ name: editName });
      toast.success("Profile updated successfully!");
      setEditModalOpen(false);
      loadProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (attractionId: number) => {
    try {
      await userService.removeFavorite(attractionId);
      toast.success("Removed from favorites");
      loadFavorites();
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  const filteredRatings = ratingFilter
    ? ratings.filter((r) => r.rating === ratingFilter)
    : ratings;

  const handleTabChange = (tabId: string) => {
    if (!allowedTabs.includes(tabId as ProfileTab)) return;
    const next = tabId as ProfileTab;
    setActiveTab(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", next);
      return params;
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setSecuritySaving(true);
      await userService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password");
    } finally {
      setSecuritySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full h-48 bg-gray-200 animate-pulse" />
        <Container size="lg" className="py-8">
          <Skeleton variant="rectangular" height={400} />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-secondary-500">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditModalOpen(true)}
          leftIcon={<Edit className="w-4 h-4" />}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white"
        >
          Edit Profile
        </Button>
      </div>

      {/* Profile Header */}
      <Container size="lg">
        <div className="relative pb-8">
          {/* Avatar */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <Avatar
              fallback={user?.name?.charAt(0) || "U"}
              size="xl"
              className="border-4 border-white shadow-lg w-32 h-32 text-3xl"
            />
          </div>

          {/* User Info */}
          <div className="pt-20 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {profile?.name || user?.name}
            </h1>
            <p className="text-gray-600 mb-2">
              {profile?.email || user?.email}
            </p>
            <p className="text-sm text-gray-500">
              Member since{" "}
              {formatDate(
                profile?.member_since || new Date().toISOString(),
                "MMM yyyy"
              )}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <MapPin className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {profile?.stats.attractions_visited || 0}
              </p>
              <p className="text-sm text-gray-600">Visited</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <MessageSquare className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {profile?.stats.reviews_written || 0}
              </p>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {profile?.stats.average_rating.toFixed(1) || "0.0"}
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          defaultTab="ratings"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mt-8"
        >
          <TabList>
            <Tab id="ratings">My Ratings ({ratings.length})</Tab>
            <Tab id="favorites">Favorites ({favorites.length})</Tab>
            <Tab id="activity">Activity</Tab>
            <Tab id="preferences">Preferences</Tab>
            <Tab id="security">Security</Tab>
          </TabList>

          {/* Tab 1: My Ratings */}
          <TabPanel id="ratings">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={ratingFilter || ""}
                onChange={(e) =>
                  setRatingFilter(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {loadingRatings ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={120} />
                ))}
              </div>
            ) : filteredRatings.length === 0 ? (
              <EmptyState
                icon={<Star className="w-16 h-16" />}
                title="No ratings yet"
                description="Start exploring and rating attractions to see them here."
                action={{
                  label: "Explore Attractions",
                  onClick: () => (window.location.href = "/attractions"),
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredRatings.map((rating) => (
                  <RatedAttractionCard
                    key={rating.id}
                    rating={rating}
                    onDelete={() => {
                      if (
                        confirm("Are you sure you want to delete this rating?")
                      ) {
                        toast.success("Rating deleted");
                        loadRatings();
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabPanel>

          {/* Tab 2: Favorites */}
          <TabPanel id="favorites">
            {loadingFavorites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={300} />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <EmptyState
                icon={<Heart className="w-16 h-16" />}
                title="No favorites yet"
                description="Add attractions to your favorites to see them here."
                action={{
                  label: "Explore Attractions",
                  onClick: () => (window.location.href = "/attractions"),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((attraction) => (
                  <div key={attraction.id} className="relative group">
                    <AttractionCard attraction={attraction} />
                    <button
                      onClick={() => handleRemoveFavorite(attraction.id)}
                      className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Tab 3: Activity Timeline */}
          <TabPanel id="activity">
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={100} />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyState
                icon={<Eye className="w-16 h-16" />}
                title="No activity yet"
                description="Your activity will appear here as you explore attractions."
              />
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <ActivityItem key={item.id} activity={item} />
                ))}
              </div>
            )}
          </TabPanel>

          {/* Tab 4: Preferences */}
          <TabPanel id="preferences">
            <div className="max-w-2xl">
              <PreferencesCard
                onUpdate={() => toast.success("Preferences updated!")}
              />
            </div>
          </TabPanel>

          {/* Tab 5: Security */}
          <TabPanel id="security">
            <div className="max-w-2xl">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Security
                  </h3>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    placeholder="Repeat new password"
                  />
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    isLoading={securitySaving}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </Container>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={profile?.email || ""}
            disabled
            helperText="Email cannot be changed"
          />
          <Button
            variant="primary"
            fullWidth
            onClick={handleUpdateProfile}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
