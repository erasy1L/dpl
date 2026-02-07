import { ImgHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "size"> {
  src?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Avatar = ({
  src,
  fallback = "?",
  size = "md",
  alt = "Avatar",
  className,
  ...props
}: AvatarProps) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const baseStyles = "rounded-full object-cover";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(baseStyles, sizes[size], className)}
        {...props}
      />
    );
  }

  // Show initials on gradient background
  return (
    <div
      className={cn(
        baseStyles,
        sizes[size],
        "bg-gradient-to-br from-primary-500 to-primary-700",
        "flex items-center justify-center",
        "text-white font-semibold",
        className
      )}
    >
      {fallback.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default Avatar;