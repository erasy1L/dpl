import { Category } from "../../types/attraction.types";
import { cn } from "../../utils/cn";
import {
  Landmark,
  MapPin,
  Trees,
  Mountain,
  Droplets,
  Building2,
  Church,
  Trophy,
  PawPrint,
  UtensilsCrossed,
  Bus,
  Cable,
  Waves,
  Wine,
  Tractor,
  Target,
  Plane,
  Zap,
  Building,
  Flag,
  Tent,
  Fish,
  Leaf,
  Backpack,
  Footprints,
  Snowflake,
  Wind,
  Home,
  Palette,
  Theater,
  Moon,
  Car,
  Users,
  Sparkles,
  LucideIcon,
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  className?: string;
}

const CategoryCard = ({ category, onClick, className }: CategoryCardProps) => {
  const IconComponent = getCategoryIcon(category.name_en);
  const count = category.attraction_count ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-card",
        "transition-all duration-300",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
        className,
      )}
    >
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-3 text-primary-600">
        <IconComponent className="w-10 h-10" />
      </div>

      {/* Name */}
      <h3 className="font-semibold text-gray-900 mb-1 text-center">
        {category.name_en}
      </h3>

      {/* Count */}
      <p className="text-sm text-gray-600">
        {count} {count === 1 ? "place" : "places"}
      </p>
    </button>
  );
};

// Helper function to get category icon component
const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase();

  // Sights & Landmarks
  if (
    name.includes("sights") ||
    name.includes("landmarks") ||
    name.includes("points of interest")
  ) {
    return Landmark;
  }

  // Neighborhoods
  if (name.includes("neighborhood")) {
    return Home;
  }

  // Nature & Parks
  if (
    name.includes("nature") ||
    name.includes("park") ||
    name.includes("wildlife")
  ) {
    return Trees;
  }

  // Mountains
  if (name.includes("mountain")) {
    return Mountain;
  }

  // Waterfalls
  if (name.includes("waterfall")) {
    return Droplets;
  }

  // Bodies of Water, Beach
  if (
    name.includes("water") ||
    name.includes("beach") ||
    name.includes("pool")
  ) {
    return Waves;
  }

  // Architectural Buildings
  if (name.includes("architectural") || name.includes("building")) {
    return Building2;
  }

  // Churches & Religious Sites
  if (
    name.includes("church") ||
    name.includes("cathedral") ||
    name.includes("sacred") ||
    name.includes("religious")
  ) {
    return Church;
  }

  // Sports & Arenas
  if (
    name.includes("sport") ||
    name.includes("arena") ||
    name.includes("stadium")
  ) {
    return Trophy;
  }

  // Ski & Snow
  if (
    name.includes("ski") ||
    name.includes("snowboard") ||
    name.includes("snow")
  ) {
    return Snowflake;
  }

  // Zoos & Aquariums
  if (name.includes("zoo") || name.includes("aquarium")) {
    return PawPrint;
  }

  // Food & Drink
  if (
    name.includes("food") ||
    name.includes("drink") ||
    name.includes("winer") ||
    name.includes("vineyard")
  ) {
    return name.includes("winer") ? Wine : UtensilsCrossed;
  }

  // Tours
  if (name.includes("tour") && !name.includes("food")) {
    return Bus;
  }

  // Transportation & Tramways
  if (name.includes("transportation") || name.includes("tramway")) {
    return Cable;
  }

  // Theme Parks & Water Parks
  if (name.includes("theme park") || name.includes("amusement")) {
    return Sparkles;
  }

  // Museums
  if (name.includes("museum")) {
    return Palette;
  }

  // Historic Sites & Ancient Ruins
  if (
    name.includes("historic") ||
    name.includes("ancient") ||
    name.includes("ruin")
  ) {
    return Landmark;
  }

  // Canyons & Geologic Formations
  if (
    name.includes("canyon") ||
    name.includes("geologic") ||
    name.includes("formation")
  ) {
    return Mountain;
  }

  // Farms
  if (name.includes("farm")) {
    return Tractor;
  }

  // Shooting Ranges
  if (name.includes("shooting")) {
    return Target;
  }

  // Air Tours
  if (name.includes("air tour")) {
    return Plane;
  }

  // Adrenaline & Extreme
  if (name.includes("adrenaline") || name.includes("extreme")) {
    return Zap;
  }

  // Monuments & Statues
  if (name.includes("monument") || name.includes("statue")) {
    return Landmark;
  }

  // National Parks
  if (name.includes("national park")) {
    return Tent;
  }

  // Fishing
  if (name.includes("fishing")) {
    return Fish;
  }

  // Hiking & Camping
  if (
    name.includes("hiking") ||
    name.includes("camping") ||
    name.includes("trail")
  ) {
    return Backpack;
  }

  // Walking Tours
  if (name.includes("walking")) {
    return Footprints;
  }

  // Surfing & Water Sports
  if (
    name.includes("surf") ||
    name.includes("windsurf") ||
    name.includes("kitesurf")
  ) {
    return Wind;
  }

  // Civic Centers
  if (name.includes("civic")) {
    return Building;
  }

  // Visitor Centers
  if (name.includes("visitor center")) {
    return MapPin;
  }

  // Events & Cultural Events
  if (name.includes("event") || name.includes("cultural")) {
    return Theater;
  }

  // Spas & Wellness
  if (
    name.includes("spa") ||
    name.includes("wellness") ||
    name.includes("hammam") ||
    name.includes("turkish bath")
  ) {
    return Sparkles;
  }

  // Night Tours
  if (name.includes("night")) {
    return Moon;
  }

  // Private Tours
  if (name.includes("private")) {
    return Users;
  }

  // Room Escape Games
  if (
    name.includes("escape") ||
    name.includes("game") ||
    name.includes("entertainment center")
  ) {
    return Target;
  }

  // Gear Rentals & ATV
  if (
    name.includes("gear") ||
    name.includes("rental") ||
    name.includes("atv") ||
    name.includes("4wd") ||
    name.includes("off-road")
  ) {
    return Car;
  }

  // Horseback Riding
  if (name.includes("horseback")) {
    return PawPrint;
  }

  // Parasailing & Paragliding
  if (name.includes("parasail") || name.includes("paraglid")) {
    return Wind;
  }

  // Boat Tours
  if (name.includes("boat")) {
    return Waves;
  }

  // Outdoor Activities
  if (name.includes("outdoor")) {
    return Leaf;
  }

  // Fun & Games
  if (name.includes("fun") || name.includes("game")) {
    return Target;
  }

  // Day Trips & Multi-day Tours
  if (name.includes("day trip") || name.includes("multi-day")) {
    return Bus;
  }

  // City Tours
  if (name.includes("city tour")) {
    return Building;
  }

  // Vespa & Scooter Tours
  if (
    name.includes("vespa") ||
    name.includes("scooter") ||
    name.includes("moped")
  ) {
    return Car;
  }

  // Default
  return MapPin;
};

export default CategoryCard;
