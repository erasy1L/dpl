import { Attraction } from "../../types/attraction.types";
import { Skeleton, EmptyState } from "../ui";
import AttractionCard from "./AttractionCard";
import { Compass } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

interface AttractionGridProps {
  attractions: Attraction[];
  loading?: boolean;
  emptyMessage?: string;
}

const AttractionGrid = ({
  attractions,
  loading = false,
  emptyMessage,
}: AttractionGridProps) => {
  useLocale();
  const displayEmptyMessage = emptyMessage ?? m.attractions_empty_default();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-card overflow-hidden">
            <Skeleton variant="rectangular" height={225} />
            <div className="p-4 space-y-3">
              <Skeleton variant="text" count={2} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (attractions.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="w-16 h-16" />}
        title={displayEmptyMessage}
        description={m.attractions_empty_hint()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {attractions.map((attraction) => (
        <AttractionCard key={attraction.id} attraction={attraction} />
      ))}
    </div>
  );
};

export default AttractionGrid;
