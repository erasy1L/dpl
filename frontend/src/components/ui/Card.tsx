import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
}

export const Card = ({
  children,
  hoverable = false,
  clickable = false,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-card",
        hoverable && "hover:shadow-lg transition-shadow duration-200",
        clickable &&
          "cursor-pointer hover:-translate-y-1 transition-transform duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = ({
  children,
  className,
  ...props
}: CardHeaderProps) => {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-100", className)} {...props}>
      {children}
    </div>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = ({
  children,
  className,
  ...props
}: CardContentProps) => {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = ({
  children,
  className,
  ...props
}: CardFooterProps) => {
  return (
    <div className={cn("px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg", className)} {...props}>
      {children}
    </div>
  );
};