import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { MessageBubble } from "@/app/UI/primitives";
import type { KnowledgeCitation } from "@/app/components/handlers/chat";

export function ChatMessage({ role, content, citations = [] }: { role: string | undefined; content: string; citations?: KnowledgeCitation[] }) {
  const fromUser = role === "user";
  return (
    <MessageBubble fromUser={fromUser}>
      {fromUser ? (
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        <>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
          {citations.length > 0 && (
            <div className="mt-3 border-t border-white/10 pt-2 text-xs text-white/50">
              Sources: {citations.map((citation) => `${citation.filename}${citation.page ? ` p.${citation.page}` : ""}`).join(" · ")}
            </div>
          )}
        </>
      )}
    </MessageBubble>
  );
}
