/**
 * Meal scoring — resolve a food to nutrition, then score it against the day so far.
 *
 * This route is stateless. It used to append meals to the iron-session cookie, which
 * capped the log at 12 entries and could never hold a photo. The log and the saved-meal
 * bookmarks now live in IndexedDB on the device (lib/food-store.ts), so the client owns
 * persistence and passes the day's running intake in with each request.
 *
 * Two ways in:
 *   { description?, image? }  — send it to /api/analyze (Gemini) to estimate nutrition
 *   { nutrition }             — already resolved: a barcode hit, a saved meal, or an
 *                               "ate this again" re-log
 *
 * Either way the food is re-scored against `priorIntake`, never replayed from a stored
 * score: METHODOLOGY.md §4 tapers fruit/veg and fibre and spends a shared allowance for
 * sodium, saturated fat and sugar, so the same food is worth less later in the day.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { scoreFood, EMPTY_INTAKE, type Nutrition, type DailyIntake } from "@/lib/food-scoring";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The client supplies prior intake, so coerce it rather than trusting the shape. */
function sanitizeIntake(raw: unknown): DailyIntake {
  const v = (raw ?? {}) as Record<string, unknown>;
  const n = (key: keyof DailyIntake) => {
    const parsed = Number(v[key]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  return {
    fruitVegServings: n("fruitVegServings"),
    oilyFishServings: n("oilyFishServings"),
    saturatedFatG: n("saturatedFatG"),
    sodiumMg: n("sodiumMg"),
    addedSugarG: n("addedSugarG"),
    fibreG: n("fibreG"),
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const prior = body.priorIntake ? sanitizeIntake(body.priorIntake) : EMPTY_INTAKE;

  let nutrition: Nutrition;

  if (body.nutrition) {
    nutrition = body.nutrition as Nutrition;
  } else {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: body.image, description: body.description, base: body.base }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: e.error ?? "Could not analyze that" },
        { status: res.status }
      );
    }
    nutrition = await res.json();
  }

  const score = scoreFood(
    nutrition,
    {
      age: session.age,
      sex: session.sex,
      weightKg: session.weightLb ? session.weightLb * 0.4536 : undefined,
      heightCm: session.heightCm,
    },
    prior
  );

  return NextResponse.json({ nutrition, score });
}
