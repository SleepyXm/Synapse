import { request } from "./auth";

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string;
  index_version: string;
  created_at: string;
};

export type KnowledgeDocument = {
  id: string;
  knowledge_base_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: "queued" | "processing" | "ready" | "failed";
  failure_reason: string | null;
  chunk_count: number;
  created_at: string;
};

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await request<{ data: KnowledgeBase[] }>("/api/knowledge-bases", { method: "GET" });
  return response.data;
}

export async function createKnowledgeBase(input: {
  name: string;
  description: string;
}): Promise<KnowledgeBase> {
  const response = await request<{ data: KnowledgeBase }>("/api/knowledge-bases", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function listKnowledgeDocuments(knowledgeBaseID: string): Promise<KnowledgeDocument[]> {
  const response = await request<{ data: KnowledgeDocument[] }>(
    `/api/knowledge-bases/${knowledgeBaseID}/documents`,
    { method: "GET" },
  );
  return response.data;
}

export async function uploadKnowledgeDocument(knowledgeBaseID: string, file: File): Promise<KnowledgeDocument> {
  const form = new FormData();
  form.append("file", file);
  const response = await request<{ data: KnowledgeDocument }>(
    `/api/knowledge-bases/${knowledgeBaseID}/documents`,
    { method: "POST", body: form },
  );
  return response.data;
}

export async function deleteKnowledgeDocument(knowledgeBaseID: string, documentID: string): Promise<void> {
  await request(`/api/knowledge-bases/${knowledgeBaseID}/documents/${documentID}`, { method: "DELETE" });
}
