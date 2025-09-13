"use client";

import { useParams } from "next/navigation";
import { Manrope } from "next/font/google";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import AuraBackground7 from "@/app/components/background7";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const author = params.author;
  const modelId = `${params.author}/${params.model}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: modelId,
          conversation: updatedMessages,
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

          // Update state with streaming assistant message
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === "assistant") {
              newMessages[newMessages.length - 1].content = partial;
            } else {
              newMessages.push({ role: "assistant", content: partial });
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={[
        "flex",
        "items-center",
        "justify-center",
        "h-screen",
        "bg-gray-900/70",
        "p-4",
      ].join(" ")}
    >
      <AuraBackground7 />
      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex flex-col w-full max-w-[30vw] h-[80vh] mt-16">
        {/* Header */}
        <h2 className="text-xl font-bold mt-4 text-white text-center">
          {params.model}
        </h2>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 mb-2 flex flex-col">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`my-1 p-2 rounded inline-block max-w-[70%] break-words mt-8 rounded-xl ${
                m.role === "user"
                  ? "bg-blue-800 text-white ml-auto text-right"
                  : "bg-gray-800 text-white mr-auto text-left"
              }`}
            >
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {m.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>

        {/* Input row (ArcOS style) */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500 px-1 text-white"
            placeholder="Type a message..."
          />

          {/* Run button */}
          <button
            onClick={sendMessage}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-400 text-black hover:bg-blue-300 transition"
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

        {/* Optional tips / quick actions */}
        <div className="px-2 pb-2 mt-2">
          <p className="mt-2 text-[11px] text-gray-500">
            Tip: Press Enter to send
          </p>
        </div>
      </div>


      <div className="absolute left-[calc(50%+15vw)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4 shadow-2xl flex flex-col w-[25vw] h-[80vh] mt-16">
        <h3 className="text-lg font-bold text-white text-center mb-4">Tools</h3>
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              Vector DB
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              {/* Future content goes here */}
              Empty
            </div>
          </div>

          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              RAG Pipeline(s)
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Empty
            </div>
          </div>

          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              Agentic System
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Empty
            </div>
          </div>
        </div>
      </div>


      <div className="absolute right-[calc(50%+15vw)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4 shadow-2xl flex flex-col w-[25vw] h-[80vh] mt-16">
        <h3 className="text-lg font-bold text-white text-center mb-4">Tools</h3>
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              Dataset
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              {/* Future content goes here */}
              Empty
            </div>
          </div>

          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              RAG Pipeline(s)
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Empty
            </div>
          </div>

          <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
            <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
              Agentic System
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Empty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
