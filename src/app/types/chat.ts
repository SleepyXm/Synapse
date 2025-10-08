import { request } from "./auth";

export interface Message {
  role: "user" | "assistant";
  content: string;       // required for internal messages
  id?: string;           // optional for API messages
  message?: {            // optional for API messages
    role: "user" | "assistant";
    content: string;
  };
  created_at?: string;   // optional for API messages
}

export interface ChatContextType {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
}

export interface ConversationItem {
  id: string;
  title: string;
  llm_model: string;
}

export interface ConversationMessages {
  messages: Message[],
  user_id: string,
  llm_model: string,
}

export async function createConversation(title: string, modelId: string) {
  const data = await request("/conversation/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, llm_model: modelId }),
  });

  return data; // { id }
}