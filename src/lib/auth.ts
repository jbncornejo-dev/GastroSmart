import { cookies } from "next/headers";
import crypto from "crypto";
import { SEED_USERS, RESTAURANT_ID } from "./seed-data";

export interface SessionPayload {
  userId: string;
  restaurantId: string;
  name: string;
  email: string;
  role: "ADMIN" | "KITCHEN";
}

const COOKIE_NAME = "gastrosmart_session";
const SECRET =
  process.env.SESSION_SECRET || "gastrosmart-cbba-editorial-session-2026";

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function encodeSessionToken(payload: SessionPayload): string {
  const json = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = sign(json);
  return `${json}.${sig}`;
}

export function decodeSessionToken(token: string): SessionPayload | null {
  try {
    const [json, sig] = token.split(".");
    if (!json || !sig) return null;
    const expected = sign(json);
    if (sig !== expected) return null;
    const parsed = JSON.parse(
      Buffer.from(json, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed?.userId || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const decoded = decodeSessionToken(token);
    if (decoded) return decoded;
  }
  // Sesión demo por defecto (Dueño) para permitir evaluación directa en 1 clic
  const defaultAdmin = SEED_USERS[0];
  return {
    userId: defaultAdmin.id,
    restaurantId: RESTAURANT_ID,
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    role: defaultAdmin.role,
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
