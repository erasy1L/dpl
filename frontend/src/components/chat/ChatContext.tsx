import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import chatService from "../../services/chat.service";
import { ChatMessage, ChatSessionSummary } from "../../types/chat.types";
import toast from "react-hot-toast";

const STORAGE_KEY = "tourkz_chat_session_id";

interface ChatContextValue {
  sessionId: string | null;
  messages: ChatMessage[];
  /** Logged-in users: server-backed conversations. Guests: not used. */
  sessions: ChatSessionSummary[];
  isSessionsLoading: boolean;
  /** True when signed in and auth has finished resolving. */
  showConversationList: boolean;
  isOpen: boolean;
  isLoading: boolean;
  isHistoryLoading: boolean;
  /** True while POST /chat/session is in flight (e.g. + new chat). */
  isCreatingSession: boolean;
  hasUnread: boolean;
  sendMessage: (text: string) => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  newSession: () => Promise<void>;
  selectSession: (id: string) => void;
  deleteChatSession: (id: string) => Promise<void>;
  markRead: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const prevAuthRef = useRef<boolean | undefined>(undefined);

  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(
    () => Boolean(localStorage.getItem(STORAGE_KEY)?.trim()),
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const showConversationList = isAuthenticated && !authLoading;

  const reconcileAuthSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const list = await chatService.listSessions();
      setSessions(list);
      const stored = localStorage.getItem(STORAGE_KEY)?.trim();
      const valid = stored && list.some((s) => s.id === stored);
      if (valid) {
        setSessionId(stored!);
      } else if (list.length > 0) {
        const id = list[0].id;
        localStorage.setItem(STORAGE_KEY, id);
        setSessionId(id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setSessionId(null);
        setMessages([]);
      }
    } catch {
      toast.error("Could not load conversations");
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const wasAuth = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (!isAuthenticated) {
      setSessions([]);
      setIsSessionsLoading(false);
      if (wasAuth === true) {
        localStorage.removeItem(STORAGE_KEY);
        setSessionId(null);
        setMessages([]);
      }
      return;
    }

    void reconcileAuthSessions();
  }, [authLoading, isAuthenticated, reconcileAuthSessions]);

  const loadHistory = useCallback(async (sid: string) => {
    const id = sid.trim();
    if (!id) return;
    setIsHistoryLoading(true);
    setMessages([]);
    try {
      const msgs = await chatService.getHistory(id);
      setMessages(msgs);
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 404) {
        localStorage.removeItem(STORAGE_KEY);
        setSessionId(null);
        setMessages([]);
        toast.error("Chat session not found");
        if (isAuthenticated) {
          void reconcileAuthSessions();
        }
      } else {
        toast.error("Could not load chat history");
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, [isAuthenticated, reconcileAuthSessions]);

  useEffect(() => {
    if (!sessionId || authLoading) return;
    void loadHistory(sessionId);
  }, [sessionId, loadHistory, authLoading]);

  const selectSession = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed || trimmed === sessionId) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSessionId(trimmed);
    setHasUnread(false);
  }, [sessionId]);

  const deleteChatSession = useCallback(
    async (id: string) => {
      try {
        await chatService.deleteSession(id);
        const list = await chatService.listSessions();
        setSessions(list);
        if (sessionId === id) {
          if (list.length > 0) {
            const nid = list[0].id;
            localStorage.setItem(STORAGE_KEY, nid);
            setSessionId(nid);
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setSessionId(null);
            setMessages([]);
          }
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err?.message || "Could not delete chat");
      }
    },
    [sessionId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setIsLoading(true);
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: sessionId || "",
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await chatService.sendMessage(
          sessionId || undefined,
          trimmed,
        );
        const sid = res.session_id;
        localStorage.setItem(STORAGE_KEY, sid);
        setSessionId(sid);
        const assistant: ChatMessage = {
          id: res.message.id,
          session_id: sid,
          role: "assistant",
          content: res.message.content,
          metadata: res.message.metadata,
          created_at: res.message.created_at,
        };
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== optimistic.id);
          const userMsg: ChatMessage = {
            ...optimistic,
            session_id: sid,
          };
          return [...withoutTemp, userMsg, assistant];
        });
        if (!isOpen) {
          setHasUnread(true);
        }
        if (isAuthenticated) {
          chatService.listSessions().then(setSessions).catch(() => {});
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err?.message || "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, isOpen, isAuthenticated],
  );

  const newSession = useCallback(async () => {
    if (isCreatingSession) return;
    setIsCreatingSession(true);
    setMessages([]);
    setHasUnread(false);
    try {
      const { session_id } = await chatService.createSession();
      localStorage.setItem(STORAGE_KEY, session_id);
      setSessionId(session_id);
      if (isAuthenticated) {
        setIsSessionsLoading(true);
        try {
          const list = await chatService.listSessions();
          setSessions(list);
        } finally {
          setIsSessionsLoading(false);
        }
      }
    } catch {
      toast.error("Could not start a new chat");
    } finally {
      setIsCreatingSession(false);
    }
  }, [isAuthenticated, isCreatingSession]);

  const toggleChat = useCallback(() => {
    setIsOpen((o) => !o);
    if (!isOpen) setHasUnread(false);
  }, [isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const markRead = useCallback(() => setHasUnread(false), []);

  const value = useMemo(
    () => ({
      sessionId,
      messages,
      sessions,
      isSessionsLoading,
      showConversationList,
      isOpen,
      isLoading,
      isHistoryLoading,
      isCreatingSession,
      hasUnread,
      sendMessage,
      toggleChat,
      openChat,
      newSession,
      selectSession,
      deleteChatSession,
      markRead,
    }),
    [
      sessionId,
      messages,
      sessions,
      isSessionsLoading,
      showConversationList,
      isOpen,
      isLoading,
      isHistoryLoading,
      isCreatingSession,
      hasUnread,
      sendMessage,
      toggleChat,
      openChat,
      newSession,
      selectSession,
      deleteChatSession,
      markRead,
    ],
  );

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
}
