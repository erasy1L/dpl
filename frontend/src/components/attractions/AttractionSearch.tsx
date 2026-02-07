import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface AttractionSearchProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  className?: string;
}

const AttractionSearch = ({
  value,
  onChange,
  loading = false,
  className,
}: AttractionSearchProps) => {
  const [internalValue, setInternalValue] = useState(value);

  // Track the last value we sent to parent to avoid duplicate calls
  const lastSentValue = useRef(value);
  // Store onChange in a ref to avoid it triggering the effect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync internal value when external value changes (e.g., on reset)
  useEffect(() => {
    setInternalValue(value);
    lastSentValue.current = value;
  }, [value]);

  // Debounce the search - only call onChange if value actually changed
  useEffect(() => {
    // Don't trigger if the value hasn't changed from what we last sent
    if (internalValue === lastSentValue.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastSentValue.current = internalValue;
      onChangeRef.current(internalValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [internalValue]);

  const handleClear = () => {
    setInternalValue("");
    lastSentValue.current = "";
    onChangeRef.current("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-100 z-100" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder="Search attractions..."
        className="placeholder:text-gray-100 backdrop-brightness-90 backdrop-blur-lg w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {loading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
        {internalValue && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-26 p-1 border border-transparent hover:border-gray-50 rounded-full"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-100" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AttractionSearch;
