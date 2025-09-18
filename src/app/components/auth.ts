const API_BASE = "http://localhost:8000";

async function request(path: string, options: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // send/receive cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function checkAuth(): Promise<any | null> {
  try {
    const data = await request("/auth/me", {
      method: "GET",
      credentials: "include",
    });
    return data.username ? data : null;
  } catch {
    return null;
  }
}

export async function signup(username: string, password: string) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const userObj = await request("/auth/me", { method: "GET", credentials: "include" });
  
  return { ...res, user: userObj };
}

export async function logout() {
  await request("/auth/logout", { method: "POST" });

}

export function getProtected(path: string) {
  // Example: hit /profile or /conversations with cookie
  return request(path, { method: "GET" });
}

/*
export async function pushToBackend(messages: Message[]) {
    await fetch("/llm/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: currentUserId,
            llm_model: modelId,
            messages: messages,
        }),
    });
}

*/