/**
 * Food analysis — ported from Liv's api/analyze.js.
 *
 * Takes a photo, a text description, or both, and returns the nutrient fields
 * lib/food-scoring.ts needs. The prompt is Liv's, which has been tuned in production;
 * don't loosen the added-sugar or fruit/veg definitions without re-reading
 * METHODOLOGY.md §2 — the scoring depends on those exact semantics.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You analyze food and estimate nutritional content. Given an image, a text description, or both, identify the food and return a JSON object with these exact fields:

{
  "food_name": "string - name of the food item",
  "portion": "string - estimated portion size with weight",
  "calories": number,
  "saturated_fat_g": number,
  "trans_fat_g": number,
  "sodium_mg": number,
  "added_sugar_g": "number - report only added/free sugars (table sugar, syrups, honey, fruit juice concentrate). Do NOT include naturally occurring sugars in whole fruits, vegetables, or plain dairy",
  "fibre_g": number,
  "protein_g": number,
  "carbs_g": "number - total carbohydrate, including fibre",
  "is_processed_meat": boolean,
  "is_red_meat": boolean,
  "fruit_veg_servings": "number - count each discrete fruit or vegetable as 1 serving (1 banana = 1, not 1.5). For mixed dishes, use ~80g per serving. Do not count garnishes or trace ingredients. Cap at 5 servings max.",
  "is_oily_fish": "boolean - true for salmon, mackerel, sardines, herring, trout, anchovies",
  "processing_level": "Minimally processed, Processed, Ultra-processed, or Unknown"
}

Be accurate with nutritional estimates. Use standard nutrition databases as reference. If you see packaging with nutrition info, use those values. If a previous estimate is provided alongside a correction, treat the correction as authoritative and re-estimate the full nutrition for the corrected food. Return ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server misconfigured — missing API key" }, { status: 500 });
  }

  const { image, description, base } = await req.json();
  if (!image && !description) {
    return NextResponse.json({ error: "Provide an image, a description, or both" }, { status: 400 });
  }

  const content: unknown[] = [];
  if (description && base) {
    content.push({
      type: "text",
      text: `Previous estimate (treat as a baseline you may revise):\n${JSON.stringify(
        base
      )}\n\nUser correction or addition: "${description}"\n\nRe-estimate the full nutrition for the corrected food and return the JSON.`,
    });
  } else if (description) {
    content.push({
      type: "text",
      text: `Identify and estimate the nutrition for the following food: "${description}"`,
    });
  } else {
    content.push({ type: "text", text: "Identify this food and estimate its nutrition." });
  }

  if (image) {
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Analysis failed upstream" }, { status: 502 });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ error: "No analysis returned" }, { status: 502 });

    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Could not analyze that" }, { status: 500 });
  }
}
