import { Category } from "../../types/attraction.types";
import { Skeleton } from "../ui";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
  categories: Category[];
  loading?: boolean;
  onCategoryClick?: (categoryId: number) => void;
}

const CategoryGrid = ({
  categories,
  loading = false,
  onCategoryClick,
}: CategoryGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-card p-6 flex flex-col items-center"
          >
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="text" width="80%" className="mt-3" />
            <Skeleton variant="text" width="60%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={() => onCategoryClick?.(category.id)}
        />
      ))}
    </div>
  );
};

export default CategoryGrid;