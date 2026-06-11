import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const PROMPT_KEYS = [
  "chat_prompt_almaty",
  "chat_prompt_charyn",
  "chat_prompt_astana",
  "chat_prompt_best_time",
  "chat_prompt_adventure",
] as const;

interface SuggestedPromptsProps {
  onPick: (text: string) => void;
}

export default function SuggestedPrompts({ onPick }: SuggestedPromptsProps) {
  useLocale();

  const prompts = PROMPT_KEYS.map((key) => m[key]());

  return (
    <div className="px-3 pb-2 flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-medium">{m.chat_try_asking()}</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
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
