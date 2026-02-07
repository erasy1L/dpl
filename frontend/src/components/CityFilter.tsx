import { MapPin } from "lucide-react";

interface CityFilterProps {
  value: string;
  onChange: (city: string) => void;
  className?: string;
}

const CityFilter = ({ value, onChange, className }: CityFilterProps) => {
  const popularCities = ["Almaty", "Astana", "Shymkent", "Karaganda", "Aktobe"];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Filter by City</span>
        </div>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
      >
        <option value="">All Cities</option>
        {popularCities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CityFilter;