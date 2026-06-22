import { request } from "./auth";

export async function addHfToken(name: string, token: string): Promise<string[]> {
  const res = await request("/tokens/hf_token", {
    method: "POST",
    body: JSON.stringify({
      name,
      hf_token: token,
    }),
  });

  return res.hf_token_names ?? [];
}

export async function deleteHfToken(name: string): Promise<string[]> {
  const res = await request("/tokens/hf_token", {
    method: "DELETE",
    body: JSON.stringify({ name }),
  });

  return res.hf_token_names ?? [];
}