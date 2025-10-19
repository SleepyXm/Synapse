import { request } from "./auth";

const API_BASE=process.env.NEXT_PUBLIC_API_BASE;

export interface FavLLMRequest {
  llm_id: string;
}

export interface FavLLMResponse {
  status: "success" | "error";
  message: string;
}

export async function addFavLLM(llmId: string): Promise<FavLLMResponse> {
  try {
    const data: FavLLMResponse = await request("/user/add_fav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hf_id: llmId }),
    });

    return data;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Failed to favorite LLM");
    console.error("Failed to favorite LLM:", error.message);
    throw error;
  }
}

export async function removeFavLLM(hfId: string): Promise<FavLLMResponse> {
  try {
    const res = await fetch(`${API_BASE}/user/remove_fav`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hf_id: hfId }),
    });

    if (!res.ok) {
      let errMsg = "Failed to remove favorite";
      try {
        const errData: { detail?: string } = await res.json();
        errMsg = errData.detail || errMsg;
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errMsg);
    }

    const data: FavLLMResponse = await res.json();
    return data;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Failed to remove favorite");
    console.error("Error removing favorite LLM:", error.message);
    throw error;
  }
}

  const data: FavLLMResponse = await res.json();
  return data;
}
