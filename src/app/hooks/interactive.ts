import { addFavLLM } from "../types/fav";
import { Message, createConversation } from "../types/chat";
import { fetchConversations } from "./conversation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

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
  } catch (err: any) {
    console.error("Failed to favorite LLM:", err.message);
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
  currentChunk: React.MutableRefObject<Message[]>
) {
  const userMessage: Message = { role: "user", content: input };
  setMessages(prev => [...prev, userMessage]);
  currentChunk.current.push(userMessage);
  setInput("");
  return userMessage;
}

async function streamAssistantResponse(
  conversationId: string,
  conversation: Message[],
  modelId: string,
  hfToken: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  currentChunk: React.MutableRefObject<Message[]>
) {
  try {
    const response = await fetch(`${API_BASE}/llm/chat/stream?conversation_id=${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, hfToken, conversation }),
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let partial = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        partial += decoder.decode(value, { stream: true });

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.content = partial;
          } else {
            newMessages.push({ role: "assistant", content: partial });
          }
          return newMessages;
        });
      }
    }

    const assistantMessage: Message = { role: "assistant", content: partial };
    currentChunk.current.push(assistantMessage);
    await flushChunk(conversationId, currentChunk);

  } catch (err) {
    console.error("Error streaming assistant:", err);
  }
}

async function flushChunk(conversationId: string, currentChunk: React.MutableRefObject<Message[]>) {
  if (!conversationId || currentChunk.current.length === 0) return;
  
  try {
    await fetch(`${API_BASE}/conversation/${conversationId}/chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(currentChunk.current),
    });
    currentChunk.current = [];
  } catch (err) {
    console.error("Error flushing chunk:", err);
  }
}

function getContextMessages(messages: Message[], userMessage: Message, options?: { rootCount?: number, recentCount?: number }) {
  const rootCount = options?.rootCount ?? 2;
  const recentCount = options?.recentCount ?? 8;

  let memory: Message[] = [];

  if (messages.length <= rootCount + recentCount) {
    memory = [...messages];
  } else {
    memory = [
      ...messages.slice(0, rootCount),
      ...messages.slice(-recentCount)
    ];
  }

  // Preprocess: trim content
  const preprocessed = memory.map(msg => ({
    role: msg.role,
    content: msg.content.trim(),
  }));

  return [...preprocessed, userMessage];
}

export const sendMessage = async (args: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  currentChunk: React.MutableRefObject<Message[]>;
  modelId: string;
  hfToken: string;
}) => {
  const { input, setInput, messages, setMessages, currentConversationId, setCurrentConversationId, currentChunk, modelId, hfToken } = args;
  if (!input.trim()) return;

  const conversationId = await ensureConversation(currentConversationId, setCurrentConversationId, setMessages, modelId);

  const userMessage = appendUserMessage(input, setInput, setMessages, currentChunk);

  if (currentChunk.current.length >= 5) await flushChunk(conversationId, currentChunk);

  const conversationWithMemory = getContextMessages(messages, userMessage, { rootCount: 2, recentCount: 8 });
  await streamAssistantResponse(conversationId, conversationWithMemory, modelId, hfToken, setMessages, currentChunk);
};
