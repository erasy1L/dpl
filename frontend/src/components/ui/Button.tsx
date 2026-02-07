import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 active:scale-95 shadow-sm",
    secondary:
      "bg-secondary-500 text-gray-900 hover:bg-secondary-600 hover:text-gray-900 focus:ring-secondary-500 active:scale-95 shadow-sm",
    ghost:
      "bg-transparent text-white hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300 active:bg-gray-200",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:scale-95 shadow-sm",
    outline:
      "bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500 active:border-primary-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2
          className="animate-spin"
          size={size === "sm" ? 16 : size === "lg" ? 24 : 20}
        />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
