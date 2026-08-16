import { useState } from "react";
import {
  useConversations,
  emitConversationSelected,
  updateConversationTitle,
  deleteConversation,
} from "../hooks/conversation";
import Popup from "@/app/components/errorpopup";

export default function Conversation() {
  const { conversations, renameConversation, removeConversation } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState("");

  const activeClass = (id: string) =>
    activeConversationId === id
      ? "bg-teal-300/20"
      : "bg-black/30 hover:text-black hover:bg-teal-300";

  const handleEditStart = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle ?? "");
  };

  const handleEditSave = async (id: string) => {
    try {
      await updateConversationTitle(id, editTitle);
      renameConversation(id, editTitle);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update title");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      removeConversation(id);
      if (activeConversationId === id) setActiveConversationId(null);
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    }
  };

  return (
    <div
      className={`flex flex-col bg-black/60 backdrop-blur p-2 shadow-2xl
        transition-all duration-300 h-[94vh] mt-20
        ${showList ? "w-[25vw]" : "w-0 overflow-hidden"}`}
    >
      {error && <Popup message={error} onClose={() => setError("")} />}

      <button
        className="px-2 py-1 mb-2 bg-teal-500 text-white rounded hover:bg-teal-400 transition self-start"
        onClick={() => setShowList(!showList)}
      >
        {showList ? "Hide" : "Show"}
      </button>

      {showList && (
        <>
          <h3 className="text-sm font-bold text-white text-center mt-3 mb-3">
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
                  className={`rounded-lg text-white cursor-pointer transition flex items-center p-2 text-sm font-semibold group ${activeClass(conv.id)}`}
                  onClick={() => {
                    if (editingId === conv.id) return;
                    setActiveConversationId(conv.id);
                    emitConversationSelected(conv.id);
                  }}
                >
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEditSave(conv.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 bg-white/10 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-teal-400 min-w-0"
                      />
                      <button
                        onClick={() => handleEditSave(conv.id)}
                        className="text-teal-400 hover:text-teal-300 text-xs shrink-0"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-white text-xs shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{conv.title ?? "Untitled"}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={e => handleEditStart(conv.id, conv.title ?? "", e)}
                          className="text-gray-400 hover:text-white px-1"
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          onClick={e => handleDelete(conv.id, e)}
                          className="text-gray-400 hover:text-red-400 px-1"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}