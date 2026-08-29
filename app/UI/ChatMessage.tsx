import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { MessageBubble } from "@/app/UI/primitives";

export function ChatMessage({ role, content }: { role: string | undefined; content: string }) {
  const fromUser = role === "user";
  return (
    <MessageBubble fromUser={fromUser}>
      {fromUser ? (
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      )}
    </MessageBubble>
  );
}
