export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    referenced_attractions?: number[];
    referenced_tours?: number[];
    suggested_action?: string;
  };
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

/** Row from GET /chat/sessions (authenticated). */
export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSendResponse {
  message: ChatMessage;
  session_id: string;
}
