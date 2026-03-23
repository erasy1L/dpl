import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "./ui";
import { Category } from "../types/attraction.types";
import { UserPreferences } from "../types/user.types";
import categoryService from "../services/category.service";
import userService from "../services/user.service";
import toast from "react-hot-toast";

interface PreferencesCardProps {
  onUpdate?: () => void;
}

const PreferencesCard = ({ onUpdate }: PreferencesCardProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_categories: [],
    preferred_cities: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, preferencesData] = await Promise.all([
        categoryService.getAll(),
        userService.getPreferences(),
      ]);
      setCategories(categoriesData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(categoryId)
        ? prev.preferred_categories.filter((id) => id !== categoryId)
        : [...prev.preferred_categories, categoryId],
    }));
  };

  const toggleCity = (city: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_cities: prev.preferred_cities.includes(city)
        ? prev.preferred_cities.filter((c) => c !== city)
        : [...prev.preferred_cities, city],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updatePreferences(preferences);
      toast.success("Preferences saved successfully!");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const popularCities = ["Almaty", "Astana", "Shymkent", "Karaganda", "Aktobe"];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Update Your Preferences
        </h3>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Favorite Categories
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={preferences.preferred_categories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                {category.name_en || category.name_ru || `Category #${category.id}`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Preferred Cities
        </h4>
        <div className="space-y-2">
          {popularCities.map((city) => (
            <label
              key={city}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={preferences.preferred_cities.includes(city)}
                onChange={() => toggleCity(city)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{city}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        variant="primary"
        fullWidth
        onClick={handleSave}
        isLoading={saving}
      >
        Save Preferences
      </Button>
    </div>
  );
};

export default PreferencesCard;
