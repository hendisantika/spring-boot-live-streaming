export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const ROOM_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export type Role = "HOST" | "CO_HOST" | "VIEWER";

export const ROLE_LABEL: Record<string, string> = {
  HOST: "Host",
  CO_HOST: "Co-host",
  SPEAKER: "Penanya",
  VIEWER: "Peserta",
};

export interface Session {
  serverUrl: string;
  token: string;
  room: string;
  identity: string;
  role: Role;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Identity unik per tab, supaya dua orang bernama sama tidak saling menendang dari room. */
export function makeIdentity(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_.@-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user";
  return `${slug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function fetchToken(
  room: string,
  input: { identity: string; name: string; role: Role },
  hostKey?: string,
): Promise<Session> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.role !== "VIEWER" && hostKey) headers["X-Host-Key"] = hostKey;

  const res = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(room)}/token`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function updateParticipant(
  room: string,
  identity: string,
  action: "promote" | "demote",
  hostToken: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/rooms/${encodeURIComponent(room)}/participants/${encodeURIComponent(identity)}/${action}`,
    { method: "POST", headers: { Authorization: `Bearer ${hostToken}` } },
  );
  if (!res.ok) throw new Error(await errorMessage(res));
}
