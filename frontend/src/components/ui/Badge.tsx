import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
  size?: "sm" | "md";
  children: ReactNode;
}

const Badge = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full";

  const variants = {
    primary: "bg-primary-100 text-primary-700",
    secondary: "bg-secondary-100 text-secondary-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    neutral: "bg-gray-100 text-gray-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;