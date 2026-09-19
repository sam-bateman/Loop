/**
 * Barcode lookup — ported from Liv's Core/Barcode/BarcodeLookup.swift.
 *
 * Open Food Facts is free and keyless, but it must be proxied: the browser cannot call
 * it directly, and running the mapping here keeps the category tag lists alongside the
 * rest of the nutrition logic.
 *
 * The tag sets, the per-100g → per-serving scaling, and the fruit/veg added-sugar
 * suppression are Liv's and are load-bearing: lib/food-scoring.ts reads
 * `fruit_veg_servings` and `added_sugar_g` with the exact semantics METHODOLOGY.md §2
 * defines. Don't widen these lists without re-reading it.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Nutrition } from "@/lib/food-scoring";

export const runtime = "nodejs";

const BASE = "https://world.openfoodfacts.org/api/v2/product";

const FRUIT_VEG_TAGS = new Set([
  "en:fruits", "en:vegetables", "en:fresh-fruits", "en:fresh-vegetables",
  "en:frozen-fruits", "en:frozen-vegetables", "en:dried-fruits",
  "en:canned-vegetables", "en:canned-fruits", "en:berries", "en:citrus",
  "en:tropical-fruits", "en:leafy-vegetables", "en:root-vegetables",
]);

const PROCESSED_MEAT_TAGS = new Set([
  "en:sausages", "en:salamis", "en:bacons", "en:ham", "en:hams",
  "en:hot-dogs", "en:deli-meats", "en:cured-meats", "en:processed-meats",
  "en:corned-beef", "en:jerky", "en:pates",
]);

const RED_MEAT_TAGS = new Set([
  "en:beef", "en:pork", "en:lamb", "en:veal", "en:goat",
  "en:meats", "en:red-meats", "en:ground-beef", "en:steaks",
]);

const OILY_FISH_TAGS = new Set([
  "en:salmon", "en:mackerel", "en:sardines", "en:herring", "en:trout",
  "en:anchovies", "en:smoked-salmon", "en:canned-sardines", "en:canned-mackerel",
]);

type Json = Record<string, unknown>;

function hasTag(categories: string[], tags: Set<string>) {
  return categories.some((c) => tags.has(c.toLowerCase()));
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function processingLabel(value: unknown): string | undefined {
  switch (num(value)) {
    case 1: return "Minimally processed";
    case 2: return "Culinary ingredient";
    case 3: return "Processed";
    case 4: return "Ultra-processed";
    default: return undefined;
  }
}

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code || !/^\d{6,14}$/.test(code)) {
    return NextResponse.json({ error: "Enter a valid barcode" }, { status: 400 });
  }

  let json: Json;
  try {
    const res = await fetch(`${BASE}/${code}.json`, {
      headers: { "User-Agent": "Loop/0.1 (longevity demo)" },
      signal: AbortSignal.timeout(8000),
    });
    json = (await res.json()) as Json;
  } catch {
    return NextResponse.json({ error: "Could not reach the barcode database" }, { status: 502 });
  }

  const product = json.product as Json | undefined;
  if (json.status !== 1 || !product) {
    return NextResponse.json(
      { error: "Product not found. Try describing or photographing the food instead." },
      { status: 404 }
    );
  }

  const nutriments = (product.nutriments as Json) ?? {};
  const categories = (product.categories_tags as string[]) ?? [];

  // Open Food Facts reports per 100 g; scale to one serving where the record has one.
  const servingG = num(product.serving_quantity) ?? 100;
  const factor = servingG / 100;
  const per = (key: string) => (num(nutriments[key]) ?? 0) * factor;
  const optional = (key: string) =>
    num(nutriments[key]) === undefined ? undefined : round1(per(key));

  const isFruitVeg = hasTag(categories, FRUIT_VEG_TAGS);
  const labels = (product.labels_tags as string[]) ?? [];
  const additives = (product.additives_tags as string[] | undefined)?.map((t) =>
    t.replace(/^en:/i, "").toUpperCase()
  );

  const nutrition: Nutrition = {
    food_name: str(product.product_name) ?? str(product.product_name_en) ?? "Unknown product",
    portion: str(product.serving_size) ?? `${Math.round(servingG)}g`,
    calories: Math.round(per("energy-kcal_100g")),
    saturated_fat_g: round1(per("saturated-fat_100g")),
    trans_fat_g: round1(per("trans-fat_100g")),
    sodium_mg: Math.round(per("sodium_100g") * 1000),
    // A whole fruit's sugar is not added sugar — METHODOLOGY.md §2.
    added_sugar_g: isFruitVeg ? 0 : round1(per("added-sugars_100g")),
    fibre_g: round1(per("fiber_100g")),
    protein_g: optional("proteins_100g"),
    carbs_g: optional("carbohydrates_100g"),
    is_processed_meat: hasTag(categories, PROCESSED_MEAT_TAGS),
    is_red_meat: hasTag(categories, RED_MEAT_TAGS),
    fruit_veg_servings: isFruitVeg ? Math.min(Math.round(servingG / 80), 5) : 0,
    is_oily_fish: hasTag(categories, OILY_FISH_TAGS),
    processing_level: processingLabel(product.nova_group),
    ingredients_text: str(product.ingredients_text_en) ?? str(product.ingredients_text),
    additive_codes: additives?.length ? additives : undefined,
    is_organic: labels.length
      ? labels.some((l) => l.toLowerCase().includes("organic"))
      : undefined,
    data_source: "Barcode database",
  };

  return NextResponse.json(nutrition);
}
