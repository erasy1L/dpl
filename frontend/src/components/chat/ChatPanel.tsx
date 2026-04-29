import { useCallback, useEffect, useRef, useState } from "react";
import { List, Loader2, Plus, Send, Sparkles, X } from "lucide-react";
import { useChat } from "./ChatContext";
import { AssistantMessageContent } from "./parseAssistantContent";
import SuggestedPrompts from "./SuggestedPrompts";
import ChatSessionSidebar from "./ChatSessionSidebar";

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-3" aria-hidden>
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  );
}

export default function ChatPanel() {
  const {
    isOpen,
    toggleChat,
    messages,
    isLoading,
    isHistoryLoading,
    isCreatingSession,
    sendMessage,
    newSession,
    sessions,
    isSessionsLoading,
    showConversationList,
    selectSession,
    deleteChatSession,
    sessionId,
  } = useChat();
  const [input, setInput] = useState("");
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages, isLoading, isHistoryLoading, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) setMobileSessionsOpen(false);
  }, [isOpen]);

  const handleSend = async () => {
    const t = input.trim();
    if (!t || isLoading) return;
    setInput("");
    await sendMessage(t);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  if (!isOpen) return null;

  const wide = showConversationList;
  const conversationLoading =
    isCreatingSession || (isHistoryLoading && messages.length === 0);

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/20 md:hidden"
        aria-hidden
        onClick={toggleChat}
      />
      <div
        className={`fixed inset-0 z-[58] md:inset-auto md:bottom-24 md:right-6 md:h-[min(500px,calc(100dvh-7rem))] ${
          wide
            ? "md:w-[min(640px,calc(100vw-2rem))]"
            : "md:w-[min(400px,calc(100vw-3rem))]"
        }`}
        role="dialog"
        aria-label="TourKZ Assistant chat"
      >
        <div className="relative flex h-full w-full flex-row overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl md:rounded-2xl">
        {showConversationList && (
          <ChatSessionSidebar
            variant="inline"
            sessions={sessions}
            activeSessionId={sessionId}
            loading={isSessionsLoading}
            onSelect={selectSession}
            onDelete={(id) => void deleteChatSession(id)}
          />
        )}

        {showConversationList && mobileSessionsOpen && (
          <>
            <button
              type="button"
              className="absolute inset-0 z-[56] bg-black/25 md:hidden"
              aria-label="Close chat list"
              onClick={() => setMobileSessionsOpen(false)}
            />
            <ChatSessionSidebar
              variant="overlay"
              sessions={sessions}
              activeSessionId={sessionId}
              loading={isSessionsLoading}
              onSelect={selectSession}
              onDelete={(id) => void deleteChatSession(id)}
              onCloseOverlay={() => setMobileSessionsOpen(false)}
            />
          </>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-2 py-3 md:px-3">
            <div className="flex min-w-0 items-center gap-1">
              {showConversationList && (
                <button
                  type="button"
                  onClick={() => setMobileSessionsOpen((o) => !o)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 md:hidden"
                  aria-label="Conversations"
                  aria-expanded={mobileSessionsOpen}
                >
                  <List className="h-5 w-5" />
                </button>
              )}
              <div className="flex min-w-0 items-center gap-2">
                <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
                <h2 className="truncate text-sm font-semibold text-gray-900">
                  TourKZ Assistant
                </h2>
                {(isCreatingSession || isHistoryLoading) && (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-primary-500"
                    aria-hidden
                  />
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => newSession()}
                disabled={isCreatingSession || isHistoryLoading}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-40"
                title="New chat"
                aria-label="New chat"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleChat}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
            {conversationLoading && (
              <div className="flex flex-col gap-3 px-3 py-6">
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-gray-200" />
                <p className="pt-2 text-xs text-gray-500">
                  {isCreatingSession
                    ? "Starting new chat…"
                    : "Loading conversation…"}
                </p>
              </div>
            )}
            {messages.length === 0 && !isLoading && !conversationLoading && (
              <SuggestedPrompts
                onPick={(text) => {
                  void sendMessage(text);
                }}
              />
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "rounded-br-md bg-primary-500 text-white"
                      : "rounded-bl-md bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  ) : (
                    <AssistantMessageContent content={m.content} />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={onSubmit}
            className="flex shrink-0 gap-2 border-t border-gray-100 bg-gray-50 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask about Kazakhstan…"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  );
}
