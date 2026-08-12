import { cookies } from "next/headers";
import { sql } from "@/lib/db/client";

const COOKIE_NAME = "legal_profile_id";

export async function getOrCreateProfileId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    const rows = await sql`SELECT id FROM user_profiles WHERE id::text = ${existing} LIMIT 1`;
    if (rows[0]) return String(rows[0].id);
  }

  const rows = await sql`INSERT INTO user_profiles DEFAULT VALUES RETURNING id`;
  const id = String(rows[0].id);
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
