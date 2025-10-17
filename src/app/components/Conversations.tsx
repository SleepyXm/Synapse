import { useState } from "react";
import { useConversations } from "../hooks/conversation";
import { emitConversationSelected } from "../hooks/conversation";

export default function Conversation() {
  const { conversations } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);

  const activeClass = (id: string) =>
    activeConversationId === id
      ? "bg-teal-300/20"
      : "bg-black/30 hover:text-black hover:bg-teal-300";

  return (
    <div className="absolute right-[calc(50%+25vw)] bg-black/60 backdrop-blur p-2 shadow-2xl flex flex-col w-[25vw] h-[92vh] mt-20">
      <h3 className="text-sm font-bold text-white text-center mt-3 mb-3">
      Conversations
    </h3>
      

      <button
        className="mb-2 px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-400 transition"
        onClick={() => setShowList(!showList)}
      >
        {showList ? "Hide Conversations" : "Show Conversations"}
      </button>


      {showList && (
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-[12px] text-gray-400 text-center mt-2">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`rounded-lg text-white cursor-pointer transition flex items-center p-2 text-sm font-semibold ${activeClass(conv.id)}`}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  emitConversationSelected(conv.id);
                }}
              >
                {conv.title}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
