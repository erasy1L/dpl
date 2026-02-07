import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatNumber } from "../../utils/formatters";

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon,
  trend = "neutral",
  className,
}: MetricCardProps) => {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const displayValue = typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        "bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
      </div>

      {/* Label */}
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

export default MetricCard;