import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  handleFavClick,
  sendMessage,
  ModelSettings,
} from "@/app/components/hooks/interactive";
import { createTemporaryConversation, Message } from "@/app/components/handlers/chat";
import { useHfTokens } from "@/app/components/handlers/tokenhandler";
import {
  emitConversationCreated,
  emitConversationSelected,
  onConversationSelected,
  fetchConversationMessages,
  onNewConversationRequested,
} from "@/app/components/hooks/conversation";
import Popup from "@/app/UI/errorpopup";
import MiniModelSearch from "../../components/MiniSearch";
import JitterLoader from "../../UI/JitterLoader";
import { Button, ChatMessage, Input, Select, Surface } from "@/app/UI";

type ChatProps = {
  settings: ModelSettings;
  customisationId: string;
};

export default function Chat({ settings, customisationId }: ChatProps) {
  const params = useParams();

  const author = String(params.author ?? "");
  const model = String(params.model ?? "");
  const modelId = `${author}/${model}`;

  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFav, setIsFav] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationLoadState, setConversationLoadState] = useState<"idle" | "loading" | "failed">("idle");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationLoadRequest = useRef(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const [compareModelId, setCompareModelId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [compareCurrentMessages, setCompareCurrentMessages] = useState<
    Message[]
  >([]);
  const [compareConversationId, setCompareConversationId] = useState<
    string | null
  >(null);

  const compareScrollContainerRef = useRef<HTMLDivElement>(null);
  const compareMessagesEndRef = useRef<HTMLDivElement>(null);
  const [compareAutoScroll, setCompareAutoScroll] = useState(true);

  const handleCompareScroll = () => {
    const el = compareScrollContainerRef.current;
    if (!el) return;
    setCompareAutoScroll(
      el.scrollHeight - el.scrollTop - el.clientHeight < 100,
    );
  };

  const { listHfTokens } = useHfTokens();

  const [hfTokens, setHfTokens] = useState<string[]>([]);
  const [activeToken, setActiveToken] = useState<string | undefined>(undefined);

  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distanceFromBottom < 100);
  };

  const handleCompareSelect = (selectedModelId: string) => {
    setCompareModelId(selectedModelId);
    setShowSearch(false);
  };

  const handleCompareCancel = () => {
    setShowSearch(false);
  };

  useEffect(() => {
    const tokens = listHfTokens();
    setHfTokens(tokens);
    setActiveToken((prev) => prev ?? tokens[0]);
  }, [listHfTokens]);

  useEffect(() => {
    const unsubscribe = onConversationSelected(async (id) => {
      const requestID = ++conversationLoadRequest.current;
      setCurrentConversationId(id);
      setLoadedMessages([]);
      setCurrentMessages([]);
      setConversationLoadState("loading");
      try {
        const msgs = await fetchConversationMessages(id);
        if (requestID !== conversationLoadRequest.current) return;
        setLoadedMessages(msgs);
        setConversationLoadState("idle");
      } catch {
        if (requestID !== conversationLoadRequest.current) return;
        setConversationLoadState("failed");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => onNewConversationRequested(() => {
    void (async () => {
      try {
        setError("");
        conversationLoadRequest.current += 1;
        const conversation = await createTemporaryConversation(modelId);
        setLoadedMessages([]);
        setCurrentMessages([]);
        setCurrentConversationId(conversation.id);
        setConversationLoadState("idle");
        emitConversationCreated(conversation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation");
      }
    })();
  }), [modelId]);

  useEffect(() => {
    if (compareAutoScroll)
      compareMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [compareCurrentMessages, compareAutoScroll]);

  const allMessages = [...loadedMessages, ...currentMessages];

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, autoScroll]);

  const handleSend = async () => {
    if (sending) return;
    if (!input.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    if (!activeToken) {
      setError("No Hugging Face token selected.");
      return;
    }

    setAutoScroll(true);
    setCompareAutoScroll(true);

    try {
      setSending(true);
      setError("");

      const sends: Promise<void>[] = [
        sendMessage({
          input,
          setInput,
          setMessages: setCurrentMessages,
          currentConversationId,
          setCurrentConversationId,
          modelId,
          hfTokenName: activeToken,
          settings,
          customisationId,
        }),
      ];

      if (compareModelId) {
        sends.push(
          sendMessage({
            input,
            setInput: () => {}, // left side already clears it
            setMessages: setCompareCurrentMessages,
            currentConversationId: compareConversationId,
            setCurrentConversationId: setCompareConversationId,
            modelId: compareModelId,
            hfTokenName: activeToken,
            settings,
            customisationId,
          }),
        );
      }

      await Promise.all(sends);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFavorite = async () => {
    try {
      setError("");

      await handleFavClick(modelId, setIsFav);

      setSuccess("Model added to favourites.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to favourite model";
      setError(message);
    }
  };

  return (
  <Surface opacity={0.35} blur="md" padding="0.5rem" height="94vh" className="flex flex-1 flex-col mt-20">
    {error && <Popup message={error} onClose={() => setError("")} />}
    {success && (
      <Popup message={success} onClose={() => setSuccess("")} type="success" />
    )}

    <h2 className="text-xl font-bold mt-4 text-white text-center flex items-center justify-center gap-2">
      {compareModelId ? (
        <>
          <span>{model}</span>
          <span className="text-gray-500 text-sm">vs</span>
          <span>{compareModelId.split("/")[1]}</span>
        </>
      ) : (
        model
      )}
      <button
        onClick={handleFavorite}
        className="text-white text-l cursor-pointer bg-transparent border-none"
      >
        {isFav ? "★" : "☆"}
      </button>
      <button
        onClick={() =>
          compareModelId
            ? setCompareModelId(null)
            : setShowSearch((prev) => !prev)
        }
        className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-teal-500/30 text-gray-300 hover:text-white transition"
      >
        {compareModelId ? "✕ Stop comparing" : "Compare"}
      </button>
    </h2>

    {showSearch && (
      <div className="px-4 pb-2">
        <MiniModelSearch onSelect={handleCompareSelect} />
        <button
          onClick={handleCompareCancel}
          className="text-xs text-gray-500 hover:text-white mt-1 transition"
        >
          Cancel
        </button>
      </div>
    )}

    <div className={`flex flex-1 overflow-hidden gap-2 mt-4 ${compareModelId ? "flex-row" : "flex-col"}`}>

      {/* Left / main panel */}
      <div className={`flex flex-col ${compareModelId ? "flex-1 border-r border-white/10 pr-2 min-w-0" : "flex-1"}`}>
        {compareModelId && (
          <p className="text-xs text-gray-500 text-center mb-2">{model}</p>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col"
        >
          {conversationLoadState === "loading" ? (
            <JitterLoader message="Loading messages…" className="flex-1" />
          ) : conversationLoadState === "failed" ? (
            <div role="alert" className="m-auto rounded-lg border border-red-300/20 bg-red-300/5 p-4 text-center text-sm text-gray-300">
              <p>This conversation exists, but its messages did not load.</p>
              <button
                type="button"
                onClick={() => currentConversationId && emitConversationSelected(currentConversationId)}
                className="mt-2 text-teal-300 hover:text-teal-200"
              >
                Try again
              </button>
            </div>
          ) : allMessages.map((m, i) => {
            const role = m.message?.role ?? m.role;
            const content = m.message?.content ?? m.content ?? "";
            return <ChatMessage key={m.id ?? i} role={role} content={content} />;
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Right / compare panel */}
      {compareModelId && (
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-xs text-gray-500 text-center mb-2">
            {compareModelId.split("/")[1]}
          </p>
          <div
            ref={compareScrollContainerRef}
            onScroll={handleCompareScroll}
            className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col"
          >
            {compareCurrentMessages.map((m, i) => {
              const role = m.role;
              const content = m.content ?? "";
              return <ChatMessage key={i} role={role} content={content} />;
            })}
            <div ref={compareMessagesEndRef} />
          </div>
        </div>
      )}
    </div>

    {hfTokens.length > 0 && (
      <Select
        value={activeToken}
        onChange={(e) => setActiveToken(e.target.value)}
        tone="light"
        opacity={0.1}
        radius="0.25rem"
        padding="0.25rem"
        fullWidth={false}
        className="text-sm mb-2"
      >
        {hfTokens.map((t, i) => (
          <option key={i} value={t}>
            {t.slice(0, 10)}…
          </option>
        ))}
      </Select>
    )}

    <Surface tone="light" opacity={0.05} borderOpacity={0.1} radius="0.75rem" padding="0.5rem" className="flex items-center gap-2">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        tone="transparent"
        radius="0"
        padding="0 0.25rem"
        fullWidth={false}
        className="flex-1 text-sm placeholder:text-gray-500"
        placeholder={compareModelId ? "Send to both models..." : "Type a message..."}
        disabled={sending || conversationLoadState !== "idle"}
      />
      <Button
        variant="action"
        height="2.25rem"
        padding="0 0.75rem"
        onClick={handleSend}
        disabled={sending || conversationLoadState !== "idle"}
        className="disabled:cursor-not-allowed"
      >
        {sending ? "Sending..." : "Send"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
      </Button>
    </Surface>

    <div className="px-2 pb-2 mt-2">
      <p className="mt-2 text-[11px] text-gray-500">
        Tip: Press Enter to send
      </p>
    </div>
  </Surface>
);
}
