import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { Category } from "../../types/attraction.types";
import { AttractionFilters as Filters } from "../../types/attraction.types";
import { Button } from "../ui";
import { CITIES } from "../../utils/constants";
import categoryService from "../../services/category.service";

interface AttractionFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const AttractionFilters = ({
  filters,
  onChange,
  onReset,
  isMobile = false,
  onClose,
}: AttractionFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    const currentIds = filters.category_ids || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId];

    onChange({
      ...filters,
      category_ids: newIds.length > 0 ? newIds : undefined,
    });
  };

  const handleCityToggle = (city: string) => {
    onChange({
      ...filters,
      city: filters.city === city ? undefined : city,
    });
  };

  const handleRatingChange = (rating: number) => {
    onChange({
      ...filters,
      min_rating: filters.min_rating === rating ? undefined : rating,
    });
  };

  const hasActiveFilters = !!(
    (filters.category_ids && filters.category_ids.length > 0) ||
    filters.city ||
    filters.min_rating
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.category_ids?.includes(category.id) || false}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {category.name_en}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Cities */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cities</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {CITIES.slice(0, 10).map((city) => (
            <label
              key={city}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.city === city}
                onChange={() => handleCityToggle(city)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{city}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Minimum Rating
        </h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                filters.min_rating === rating
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-4 h-4 ${
                      index < rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button variant="outline" fullWidth onClick={onReset} className="mt-4">
          Clear All Filters
        </Button>
      )}
    </div>
  );
};

export default AttractionFilters;
