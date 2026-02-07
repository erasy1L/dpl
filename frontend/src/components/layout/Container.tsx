import { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const Container = ({ children, size = "lg", className }: ContainerProps) => {
  const sizes = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1440px]",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto px-4 md:px-6 lg:px-8",
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Container;