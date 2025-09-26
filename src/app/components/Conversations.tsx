import { useState } from "react";
import { useConversations } from "../hooks/conversation";
import { emitConversationSelected } from "../hooks/conversation";

export default function Conversation() {
  const { conversations } = useConversations();
  const [activeConversationId] = useState<
    string | null
  >(null);

  const activeClass = (id: string) =>
    activeConversationId === id
      ? "bg-white/20"
      : "bg-black/30 hover:bg-white/10";

  return (
    <div className="absolute right-[calc(50%+15vw)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex flex-col w-[25vw] h-[80vh] mt-16">
    <h3 className="text-sm font-bold text-white text-center mt-6">
      Conversations
    </h3>
    <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="text-[12px] text-gray-400 text-center mt-2">
          No conversations yet
        </div>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            className={`rounded-lg text-white cursor-pointer transition flex items-center p-1 text-xs font-semibold ${activeClass(
              conv.id
            )}`}
            onClick={() => {
              emitConversationSelected(conv.id);
            }}
          >
            {conv.id}
          </div>
        ))
      )}
    </div>
  </div>
  );
}
