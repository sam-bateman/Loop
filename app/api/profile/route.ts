import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { accessToken, fetchBasics } from "@/lib/whoop";

const SEXES = ["male", "female", "other"] as const;

function clampInt(v: unknown, min: number, max: number) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  session.name = name || undefined;
  session.age = clampInt(body.age, 16, 90);
  session.weightLb = clampInt(body.weightLb, 80, 400);
  session.sex = SEXES.includes(body.sex) ? body.sex : undefined;

  // Height never gets its own question, but Mifflin-St Jeor needs it and WHOOP already
  // knows. Without it every calorie target falls back to a flat 2,000 kcal.
  if (session.heightCm === undefined) {
    const token = await accessToken();
    const measured = token ? (await fetchBasics(token)).body?.height_meter : null;
    if (measured && measured > 1 && measured < 2.5) session.heightCm = Math.round(measured * 100);
  }

  session.onboarded = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
