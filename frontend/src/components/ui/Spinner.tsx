import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary-500", className)}
      size={sizes[size]}
    />
  );
};

export default Spinner;