const PROMPTS = [
  "What are the best places to visit in Almaty?",
  "Show me tours to Charyn Canyon",
  "Plan a 3-day trip in Astana",
  "What's the best time to visit Kazakhstan?",
  "Find me an adventure tour",
];

interface SuggestedPromptsProps {
  onPick: (text: string) => void;
}

export default function SuggestedPrompts({ onPick }: SuggestedPromptsProps) {
  return (
    <div className="px-3 pb-2 flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-medium">Try asking</p>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="text-left text-xs px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 transition-colors max-w-full"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
