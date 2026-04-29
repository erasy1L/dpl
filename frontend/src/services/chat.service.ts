import api from "./api";
import {
  ChatMessage,
  ChatSendResponse,
  ChatSessionSummary,
} from "../types/chat.types";

class ChatService {
  async listSessions(): Promise<ChatSessionSummary[]> {
    const res = await api.get<{ sessions?: ChatSessionSummary[] }>(
      "/chat/sessions",
    );
    const s = res.data.sessions;
    return Array.isArray(s) ? s : [];
  }

  async createSession(): Promise<{ session_id: string }> {
    const res = await api.post<{ session_id: string }>("/chat/session");
    return res.data;
  }

  async sendMessage(
    sessionId: string | undefined,
    content: string,
  ): Promise<ChatSendResponse> {
    const res = await api.post<ChatSendResponse>("/chat/message", {
      session_id: sessionId || undefined,
      content,
    });
    return res.data;
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const res = await api.get<{ messages?: ChatMessage[] }>(
      `/chat/history/${encodeURIComponent(sessionId.trim())}`,
    );
    const m = res.data.messages;
    return Array.isArray(m) ? m : [];
  }

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/chat/session/${sessionId}`);
  }
}

export default new ChatService();
