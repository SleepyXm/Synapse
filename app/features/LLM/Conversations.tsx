import { useEffect, useState } from "react";
import {
  useConversations,
  emitNewConversationRequested,
  emitConversationSelected,
  onConversationCreated,
  updateConversationTitle,
  deleteConversation,
} from "@/app/components/hooks/conversation";
import Popup from "@/app/UI/errorpopup";
import JitterLoader from "@/app/UI/JitterLoader";
import { Input, Surface } from "@/app/UI";

export default function Conversation() {
  const { conversations, loading, loadError, retry, renameConversation, removeConversation } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onConversationCreated((conversation) => {
    setActiveConversationId(conversation.id);
  }), []);

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
    <Surface
      opacity={0.35}
      blur="md"
      padding="0.5rem"
      shadow
      width={showList ? "25vw" : 0}
      height="94vh"
      className={`flex flex-col transition-all duration-300 mt-20 ${showList ? "" : "overflow-hidden"}`}
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
          <button
            type="button"
            className="mb-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white transition hover:border-teal-300/60 hover:bg-teal-300/20"
            onClick={() => {
              setActiveConversationId(null);
              setEditingId(null);
              emitNewConversationRequested();
            }}
          >
            + New chat
          </button>

          <h3 className="text-sm font-bold text-white text-center mt-3 mb-3">
            Conversations
          </h3>

          <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {loading ? (
              <JitterLoader message="Loading conversations…" className="min-h-24" />
            ) : loadError ? (
              <div role="alert" className="mt-2 rounded-lg border border-red-300/20 bg-red-300/5 p-3 text-center text-xs text-gray-300">
                <p>Your conversations did not load.</p>
                <button type="button" onClick={retry} className="mt-2 text-teal-300 hover:text-teal-200">Try again</button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-[12px] text-gray-400 text-center mt-2">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <Surface
                  key={conv.id}
                  tone={activeConversationId === conv.id ? "accent" : "dark"}
                  opacity={activeConversationId === conv.id ? 0.2 : 0.3}
                  radius="0.5rem"
                  padding="0.5rem"
                  className={`text-white cursor-pointer transition flex items-center text-sm font-semibold group ${activeConversationId === conv.id ? "" : "hover:text-black hover:bg-teal-300"}`}
                  onClick={() => {
                    if (editingId === conv.id) return;
                    setActiveConversationId(conv.id);
                    emitConversationSelected(conv.id);
                  }}
                >
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <Input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEditSave(conv.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        tone="light"
                        opacity={0.1}
                        radius="0.25rem"
                        padding="0.25rem 0.5rem"
                        focus="ring"
                        focusWidth={1}
                        focusOpacity={1}
                        fullWidth={false}
                        className="flex-1 text-xs min-w-0"
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
                </Surface>
              ))
            )}
          </div>
        </>
      )}
    </Surface>
  );
}
