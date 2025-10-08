import { addFavLLM } from "../types/fav";
import { Message, createConversation } from "../types/chat";
import { fetchConversations } from "./conversation";

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

export const sendMessage = async ({
  input,
  setInput,
  messages,
  setMessages,
  currentConversationId,
  setCurrentConversationId,
  currentChunk,
  modelId,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  currentChunk: React.MutableRefObject<Message[]>;
  modelId: string;
}) => {
  if (!input.trim()) return;

  // Ensure we have a conversation ID
  let conversationId = currentConversationId;
  if (!currentConversationId) {
    // Create a new conversation
    const defaultTitle = `Conversation ${new Date().toLocaleString()}`;
    try {
      const conv = await createConversation(defaultTitle, modelId);
      setCurrentConversationId(conv.id); // update state

      // Immediately fetch messages (probably empty, but keeps UI consistent)
      const messages = await fetchConversations(conv.id);
      setMessages(messages); // pre-populate UI with loaded messages
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // Append user message
  const userMessage: Message = { role: "user", content: input };
  setMessages((prev) => [...prev, userMessage]);
  currentChunk.current.push(userMessage);
  setInput("");

  // 3️⃣ Flush chunk if threshold reached
  if (currentChunk.current.length >= 5 && conversationId) {
    try {
      await fetch(
        `http://localhost:8000/conversation/${conversationId}/chunk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(currentChunk.current),
        }
      );
      currentChunk.current = [];
    } catch (err) {
      console.error("Error flushing chunk:", err);
    }
  }

  // Stream assistant response
  try {
    const response = await fetch("http://localhost:8000/llm/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId,
        conversation: [...messages, userMessage],
      }),
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

        setMessages((prev) => {
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

    // Push final assistant message into the chunk
    const assistantMessage: Message = { role: "assistant", content: partial };
    currentChunk.current.push(assistantMessage);

    // Always flush after assistant finishes
    if (conversationId) {
      try {
        await fetch(
          `http://localhost:8000/conversation/${conversationId}/chunk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(currentChunk.current),
          }
        );
        currentChunk.current = [];
      } catch (err) {
        console.error("Error flushing chunk after assistant:", err);
      }
    }
  } catch (err) {
    console.error("Error streaming assistant:", err);
  }
};
