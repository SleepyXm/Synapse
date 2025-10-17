import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import { handleFavClick } from "@/app/hooks/interactive";
import { Message } from "../types/chat";
import { sendMessage } from "@/app/hooks/interactive";
import { useHfTokens } from "@/app/handlers/tokenhandler";
import {
  onConversationSelected,
  fetchConversations,
} from "../hooks/conversation";

export default function Chat() {
  const params = useParams();
  const modelId = `${params.author}/${params.model}`;
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFav, setIsFav] = useState(false);
  const { listHfTokens } = useHfTokens();
  const [hfTokens, setHfTokens] = useState<string[]>(listHfTokens());
  const [activeToken, setActiveToken] = useState("");


  const currentChunk = useRef<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const tokens = listHfTokens();
    setHfTokens(tokens);
    setActiveToken(tokens[0] ?? "");
  }, [listHfTokens]);


  useEffect(() => {
    onConversationSelected(async (id) => {
      const msgs = await fetchConversations(id);
      setLoadedMessages(msgs);
      setCurrentMessages([]);
      setCurrentConversationId(id);
    });
  }, []);

  const allMessages = [...loadedMessages, ...currentMessages];

  return (
    <div className="bg-black/60 backdrop-blur p-2 flex flex-col w-full max-w-[50vw] h-[92vh] mt-20">
      <h2 className="text-xl font-bold mt-4 text-white text-center flex items-center justify-center gap-2">
        {params.model}
        <button
          onClick={() => handleFavClick(modelId, setIsFav)}
          className="text-white text-l cursor-pointer bg-transparent border-none"
        >
          {isFav ? "★" : "☆"}
        </button>
      </h2>

      <div className="flex-1 overflow-y-auto px-2 pb-2 mb-2 flex flex-col mt-4">
        {allMessages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={`my-1 p-2 rounded inline-block max-w-[70%] break-words mt-8 rounded-xl ${
              (m.message?.role ?? m.role) === "user"
                ? "bg-teal-300/40 text-white ml-auto text-right"
                : "bg-white/0 text-white mr-auto text-left"
            }`}
          >
            {(m.message?.role ?? m.role) === "user" ? (
              <div className="whitespace-pre-wrap">
                {m.message?.content ?? m.content}
              </div>
            ) : (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {m.message?.content ?? m.content}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </div>

      {hfTokens.length > 0 && (
        <select
          value={activeToken}
          onChange={(e) => setActiveToken(e.target.value)}
          className="bg-white/10 text-white p-1 rounded text-sm mb-2"
        >
          {hfTokens.map((t, i) => (
            <option key={i} value={t}>
              {t.slice(0, 10)}…
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            sendMessage({
              input,
              setInput,
              messages: currentMessages,
              setMessages: setCurrentMessages,
              currentConversationId,
              setCurrentConversationId,
              currentChunk,
              modelId,
              hfToken: activeToken,
            })
          }
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500 px-1 text-white"
          placeholder="Type a message..."
        />

        <button
          onClick={() =>
            sendMessage({
              input,
              setInput,
              messages: currentMessages,
              setMessages: setCurrentMessages,
              currentConversationId,
              setCurrentConversationId,
              currentChunk,
              modelId,
              hfToken: activeToken,
            })
          }
          className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-200 text-black hover:bg-teal-500 transition"
        >
          Send
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
        </button>
      </div>

      <div className="px-2 pb-2 mt-2">
        <p className="mt-2 text-[11px] text-gray-500">
          Tip: Press Enter to send
        </p>
      </div>
    </div>
  );
}
