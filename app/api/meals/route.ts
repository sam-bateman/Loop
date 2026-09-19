/**
 * Meal logging — analyze, score, and append to the day's running intake.
 *
 * Meals live in the session cookie alongside the WHOOP tokens. That is the right
 * call for a 10-user sandbox and wrong for anything larger: cookies cap around 4 KB,
 * so OLD_MEAL_LIMIT keeps the day bounded. Moving to a database is tracked in SCOPE.md.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  scoreFood,
  addToIntake,
  EMPTY_INTAKE,
  type Nutrition,
  type DailyIntake,
} from "@/lib/food-scoring";

export const runtime = "nodejs";
export const maxDuration = 60;

const MEAL_LIMIT = 12;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSession();
  const meals = session.meals ?? [];
  return NextResponse.json({
    meals: meals.filter((m) => m.day === today()),
    total: meals.filter((m) => m.day === today()).reduce((a, m) => a + m.minutes, 0),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();

  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    return NextResponse.json({ error: e.error ?? "Could not analyze that" }, { status: res.status });
  }
  const nutrition: Nutrition = await res.json();

  // Rebuild today's running intake so tapers and allowances apply correctly.
  const day = today();
  const existing = (session.meals ?? []).filter((m) => m.day === day);
  const prior: DailyIntake = existing.reduce(
    (acc, m) => addToIntake(acc, m.nutrition),
    EMPTY_INTAKE
  );

  const score = scoreFood(
    nutrition,
    { age: session.age, sex: session.sex, weightKg: session.weightLb ? session.weightLb * 0.4536 : undefined },
    prior
  );

  const entry = {
    day,
    at: new Date().toISOString(),
    nutrition,
    minutes: score.minutes,
  };
  session.meals = [...(session.meals ?? []), entry].slice(-MEAL_LIMIT);
  await session.save();

  return NextResponse.json({ nutrition, score, at: entry.at });
}
