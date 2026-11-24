import { NextRequest, NextResponse } from "next/server";
import {
  encodeSessionToken,
  getCurrentSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { RESTAURANT_ID, SEED_USERS } from "@/lib/seed-data";
import { demoSwitchSchema, loginSchema } from "@/lib/validators";

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json({ user: session });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if ("role" in body) {
      const parsed = demoSwitchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Rol inválido", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const user =
        SEED_USERS.find((u) => u.role === parsed.data.role) ?? SEED_USERS[0];
      const payload = {
        userId: user.id,
        restaurantId: RESTAURANT_ID,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const res = NextResponse.json({ user: payload });
      res.cookies.set(SESSION_COOKIE_NAME, encodeSessionToken(payload), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Credenciales inválidas", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const matched =
      SEED_USERS.find(
        (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase()
      ) ?? SEED_USERS[0];

    const payload = {
      userId: matched.id,
      restaurantId: RESTAURANT_ID,
      name: matched.name,
      email: matched.email,
      role: matched.role,
    };

    const res = NextResponse.json({ user: payload });
    res.cookies.set(SESSION_COOKIE_NAME, encodeSessionToken(payload), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Error procesando autenticación" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
