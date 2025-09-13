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

export async function checkAuth(): Promise<boolean> {
  try {
    const data = await request("/auth/me", {
      method: "GET",
      credentials: "include", // send cookies
    });
    return !!data.username; // true if backend returned a user
  } catch {
    return false; // any error → not logged in
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

  const isLoggedIn = await checkAuth();
  
  return { ...res, isLoggedIn}
}

export async function logout() {
  await request("/auth/logout", { method: "POST" });
  return checkAuth();

}

export function getProtected(path: string) {
  // Example: hit /profile or /conversations with cookie
  return request(path, { method: "GET" });
}