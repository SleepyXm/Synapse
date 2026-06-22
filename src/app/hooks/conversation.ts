import { ConversationItem } from "../types/chat";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversation/list`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        console.error("Error fetching conversations:", error.message);
      }
    };

    fetchConversations();
  }, []);

  const renameConversation = (id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const removeConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  return { conversations, renameConversation, removeConversation };
};

export const updateConversationTitle = async (conversationId: string, title: string) => {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Failed to update conversation`);
  }
  return res.json();
};

export const deleteConversation = async (conversationId: string) => {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Failed to delete conversation`);
  }
  return res.json();
};

export const fetchConversations = async (conversationId: string) => {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}/chunk`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch conversation");
  const data = await res.json();
  return data.messages;
};

const conversationBus = new EventTarget();

export function emitConversationSelected(id: string) {
  conversationBus.dispatchEvent(new CustomEvent("conversationSelected", { detail: id }));
}

export function onConversationSelected(callback: (id: string) => void) {
  const handler = (e: Event) => {
    const event = e as CustomEvent<string>;
    callback(event.detail);
  };
  conversationBus.addEventListener("conversationSelected", handler);
  return () => conversationBus.removeEventListener("conversationSelected", handler);
}