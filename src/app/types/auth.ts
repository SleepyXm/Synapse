const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function request(path: string, options: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  const data = await res.json();
  if (!res.ok) {
  throw new Error(data.error || data.detail || `Request failed with status ${res.status}`);
}
  return data;
}


export type User = {
  username: string;
  hf_token_names: string[];
};

const STALE_TIME = 5 * 60 * 1000;

export async function validateUser(): Promise<User | null> {
  try {
    const lastCheck = localStorage.getItem("user_validated_at");
    const cached = localStorage.getItem("user");

    if (lastCheck && cached && Date.now() - Number(lastCheck) < STALE_TIME) {
      const parsed = JSON.parse(cached);

      return {
        username: parsed.username,
        hf_token_names: parsed.hf_token_names ?? [],
      };
    }

    const user = await request("/auth/me", { method: "GET" });

    if (!user.username) return null;

    const normalizedUser: User = {
      username: user.username,
      hf_token_names: user.hf_token_names ?? [],
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("user_validated_at", String(Date.now()));

    return normalizedUser;
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

  const userObj = await validateUser();
  return { ...res, user: userObj };
}

export async function logout() {
  await request("/auth/logout", { method: "POST" });
  ["user", "user_validated_at"].forEach(k => localStorage.removeItem(k));
}

export function getProtected(path: string) {
  return request(path, { method: "GET" });
}