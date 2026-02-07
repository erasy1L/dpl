import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

export interface DropdownItem {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

const Dropdown = ({
  trigger,
  items,
  align = "left",
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50",
            "animate-slideDown origin-top",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            <div key={index}>
              {item.divider ? (
                <div className="my-1 border-t border-gray-100" />
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                  )}
                >
                  {item.icon && (
                    <span className="text-gray-500">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;