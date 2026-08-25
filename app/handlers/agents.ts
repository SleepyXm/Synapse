import { request } from "@/app/handlers/auth";
import type { ModelSettings } from "@/app/hooks/interactive";

export type AgentLimits = { max_steps: number; timeout_seconds: number };

export type Agent = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model_id: string;
  hf_token_name: string;
  tool_ids: string[];
  knowledge_base_ids: string[];
  settings: ModelSettings;
  limits: AgentLimits;
  created_at: string;
  updated_at: string;
};

export type AgentInput = Omit<Agent, "id" | "created_at" | "updated_at">;

export type ToolDefinition = {
  id: string;
  function: string;
  name: string;
  description: string;
};

export async function listAgents(): Promise<Agent[]> {
  const response = await request<{ data: Agent[] }>("/api/agents", { method: "GET" });
  return response.data;
}

export async function createAgent(input: AgentInput): Promise<Agent> {
  const response = await request<{ data: Agent }>("/api/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateAgent(id: string, input: AgentInput): Promise<Agent> {
  const response = await request<{ data: Agent }>(`/api/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await request(`/api/agents/${id}`, { method: "DELETE" });
}

export async function listTools(): Promise<ToolDefinition[]> {
  const response = await request<{ data: ToolDefinition[] }>("/api/tools", { method: "GET" });
  return response.data;
}
