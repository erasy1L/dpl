import { Trash2 } from "lucide-react";
import { ChatSessionSummary } from "../../types/chat.types";

interface ChatSessionSidebarProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** When true, sidebar is an overlay (mobile); otherwise inline column. */
  variant: "overlay" | "inline";
  onCloseOverlay?: () => void;
}

export default function ChatSessionSidebar({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onDelete,
  variant,
  onCloseOverlay,
}: ChatSessionSidebarProps) {
  const wrapCls =
    variant === "overlay"
      ? "absolute left-0 top-0 bottom-0 z-[59] w-[min(260px,88vw)] flex flex-col border-r border-gray-200 bg-white shadow-lg"
      : "hidden md:flex w-[132px] shrink-0 flex-col border-r border-gray-100 bg-gray-50/80";

  return (
    <div className={wrapCls}>
      <div className="shrink-0 border-b border-gray-100 px-2 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Chats
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1 px-1">
        {loading && sessions.length === 0 && (
          <div className="space-y-2 px-1 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-lg bg-gray-200/80"
              />
            ))}
          </div>
        )}
        {sessions.map((s) => {
          const active = activeSessionId === s.id;
          const label =
            s.title?.trim() || "New conversation";
          return (
            <div
              key={s.id}
              className={`group mb-1 flex items-stretch gap-0.5 rounded-lg ${
                active ? "bg-primary-100 ring-1 ring-primary-200" : "hover:bg-gray-100"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(s.id);
                  if (variant === "overlay") onCloseOverlay?.();
                }}
                className="min-w-0 flex-1 px-2 py-2 text-left text-xs font-medium text-gray-800 line-clamp-2"
                title={label}
              >
                {label}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void onDelete(s.id);
                }}
                className="shrink-0 rounded-md p-1.5 text-gray-400 opacity-70 hover:bg-transparent hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Delete ${label}`}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
