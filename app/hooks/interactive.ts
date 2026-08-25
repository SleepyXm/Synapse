import { addFavLLM } from "@/app/handlers/fav";
import { Message, createConversation } from "@/app/handlers/chat";
import { consumeRunStream, RunEvent } from "@/app/handlers/runs";
import { fetchConversations } from "./conversation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export type ModelSettings = {
  temperature: number;
  top_p: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
};

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 1024,
  presence_penalty: 0,
  frequency_penalty: 0,
};

export const handleFavClick = async (
  modelId: string | undefined,
  setIsFav: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!modelId) {
    console.error("Missing modelId");
    return;
  }

  try {
    const data = await addFavLLM(modelId);
    console.log(data.message);
    setIsFav(true);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Failed to favorite LLM:", error.message);
  }
};

async function ensureConversation(
  currentConversationId: string | null,
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  modelId: string
) {
  if (currentConversationId) return currentConversationId;

  const defaultTitle = `Conversation ${new Date().toLocaleString()}`;
  const conv = await createConversation(defaultTitle, modelId);
  setCurrentConversationId(conv.id);

  const messages = await fetchConversations(conv.id);
  setMessages(messages);

  return conv.id;
}

function appendUserMessage(
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  const userMessage: Message = { role: "user", content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput("");
  return userMessage;
}

async function streamAssistantResponse(
  conversationId: string,
  input: string,
  modelId: string,
  hfTokenName: string | undefined,
  settings: ModelSettings,
  knowledgeBaseIds: string[],
  agentId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onRunEvent?: (event: RunEvent) => void,
) {
  if (!API_BASE) throw new Error("API server is not configured.");
  const endpoint = agentId
    ? `${API_BASE}/api/agents/${agentId}/runs/stream`
    : `${API_BASE}/api/llm/chat/stream`;
  const body = agentId
    ? { conversation_id: conversationId, input }
    : {
        conversation_id: conversationId,
        input,
        model_id: modelId,
        hf_token_name: hfTokenName,
        knowledge_base_ids: knowledgeBaseIds,
        settings,
      };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || data?.error || `Request failed with status ${response.status}`);
  }

  let streamFailure = "";
  await consumeRunStream(response, (event) => {
    onRunEvent?.(event);
    if (event.type === "assistant.delta") {
      const delta = String(event.data.text ?? "");
      if (!delta) return;
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === "assistant") {
          updated[updated.length - 1] = { ...lastMsg, content: `${lastMsg.content ?? ""}${delta}` };
        } else {
          updated.push({ role: "assistant", content: delta });
        }
        return updated;
      });
    }
    if (event.type === "run.failed") {
      streamFailure = String(event.data.message ?? "The model run failed.");
    }
  });
  if (streamFailure) throw new Error(streamFailure);
}

export const sendMessage = async (args: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  modelId: string;
  hfTokenName?: string;
  settings: ModelSettings;
  knowledgeBaseIds?: string[];
  agentId?: string;
  onRunEvent?: (event: RunEvent) => void;
}) => {
  const {
    input, setInput, setMessages, currentConversationId, setCurrentConversationId,
    modelId, hfTokenName, settings, knowledgeBaseIds = [], agentId, onRunEvent,
  } = args;
  if (!input.trim()) return;
  if (!agentId && !hfTokenName) throw new Error("No Hugging Face token selected.");

  const conversationId = await ensureConversation(currentConversationId, setCurrentConversationId, setMessages, modelId);

  appendUserMessage(input, setInput, setMessages);
  await streamAssistantResponse(
    conversationId,
    input.trim(),
    modelId,
    hfTokenName,
    settings,
    knowledgeBaseIds,
    agentId,
    setMessages,
    onRunEvent,
  );
};
