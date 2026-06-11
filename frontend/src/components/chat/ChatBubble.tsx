import { MessageCircle } from "lucide-react";
import { useChat } from "./ChatContext";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

export default function ChatBubble() {
  useLocale();
  const { toggleChat, isOpen, hasUnread } = useChat();

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label={isOpen ? m.chat_aria_close() : m.chat_aria_open()}
      className={`fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${
        hasUnread && !isOpen ? "animate-pulse ring-2 ring-amber-400 ring-offset-2" : ""
      }`}
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2} />
    </button>
  );
}
