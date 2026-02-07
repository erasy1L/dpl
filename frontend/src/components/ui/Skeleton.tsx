import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton = ({
  variant = "text",
  width,
  height,
  count = 1,
  className,
  ...props
}: SkeletonProps) => {
  const baseStyles = "animate-pulse bg-gray-200";

  const variants = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const skeletonStyle: React.CSSProperties = {
    width: width || (variant === "text" ? "100%" : undefined),
    height: height || (variant === "text" ? undefined : variant === "circular" ? width : "100px"),
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseStyles, variants[variant], className)}
            style={skeletonStyle}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={skeletonStyle}
      {...props}
    />
  );
};

export default Skeleton;