import { request } from "@/app/handlers/auth";

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string;
  embedding_model_id: string;
  hf_token_name: string;
  embedding_dimension: number | null;
  chunk_size_runes: number;
  chunk_overlap_runes: number;
  ready_documents: number;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocument = {
  id: string;
  knowledge_base_id: string;
  filename: string;
  media_type: string;
  sha256: string;
  size_bytes: number;
  status: "queued" | "processing" | "ready" | "failed";
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeSearchResult = {
  citation_id: string;
  document_id: string;
  filename: string;
  page?: number;
  chunk_index: number;
  content: string;
  score: number;
  knowledge_base_id: string;
};

export type KnowledgeBaseInput = {
  name: string;
  description: string;
  embedding_model_id: string;
  hf_token_name: string;
  chunking: { size_runes: number; overlap_runes: number };
};

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await request<{ data: KnowledgeBase[] }>("/api/knowledge-bases", { method: "GET" });
  return response.data;
}

export async function createKnowledgeBase(input: KnowledgeBaseInput): Promise<KnowledgeBase> {
  const response = await request<{ data: KnowledgeBase }>("/api/knowledge-bases", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateKnowledgeBase(
  id: string,
  input: Pick<KnowledgeBaseInput, "name" | "description">,
): Promise<KnowledgeBase> {
  const response = await request<{ data: KnowledgeBase }>(`/api/knowledge-bases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await request(`/api/knowledge-bases/${id}`, { method: "DELETE" });
}

export async function listKnowledgeDocuments(id: string): Promise<KnowledgeDocument[]> {
  const response = await request<{ data: KnowledgeDocument[] }>(`/api/knowledge-bases/${id}/documents`, { method: "GET" });
  return response.data;
}

export async function uploadKnowledgeDocument(id: string, file: File): Promise<KnowledgeDocument> {
  const body = new FormData();
  body.append("file", file);
  const response = await request<{ data: KnowledgeDocument }>(`/api/knowledge-bases/${id}/documents`, {
    method: "POST",
    body,
  });
  return response.data;
}

export async function retryKnowledgeDocument(baseID: string, documentID: string): Promise<void> {
  await request(`/api/knowledge-bases/${baseID}/documents/${documentID}/retry`, { method: "POST" });
}

export async function deleteKnowledgeDocument(baseID: string, documentID: string): Promise<void> {
  await request(`/api/knowledge-bases/${baseID}/documents/${documentID}`, { method: "DELETE" });
}

export async function searchKnowledge(
  id: string,
  query: string,
  limit = 6,
): Promise<KnowledgeSearchResult[]> {
  const response = await request<{ data: { results: KnowledgeSearchResult[] } }>(`/api/knowledge-bases/${id}/search`, {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  });
  return response.data.results;
}
