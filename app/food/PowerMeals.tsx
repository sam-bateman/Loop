"use client";

import type { Nutrition } from "@/lib/food-scoring";
import styles from "./power-meals.module.css";

export type PowerMeal = {
  emoji: string;
  name: string;
  reason: string;
  ingredients: string[];
  nutrition: Nutrition;
};

export const POWER_MEALS: PowerMeal[] = [
  {
    emoji: "🐟",
    name: "Omega salmon bowl",
    reason: "Direct EPA/DHA, fibre and slow carbs",
    ingredients: ["salmon", "lentils", "spinach", "tomato", "olive oil"],
    nutrition: {
      food_name: "Omega salmon bowl",
      portion: "1 bowl",
      calories: 610,
      saturated_fat_g: 3.5,
      trans_fat_g: 0,
      sodium_mg: 520,
      added_sugar_g: 0,
      fibre_g: 14,
      protein_g: 43,
      carbs_g: 56,
      fat_g: 24,
      sugar_g: 8,
      is_processed_meat: false,
      is_red_meat: false,
      fruit_veg_servings: 2.5,
      is_oily_fish: true,
      processing_level: "minimally processed",
      ingredients_text: "Salmon, lentils, spinach, tomato, olive oil, lemon",
      data_source: "Loop power meal",
    },
  },
  {
    emoji: "🥣",
    name: "Berry walnut yogurt",
    reason: "Fast protein with plants and healthy fats",
    ingredients: ["Greek yogurt", "berries", "walnuts", "chia", "oats"],
    nutrition: {
      food_name: "Berry walnut yogurt",
      portion: "1 bowl",
      calories: 430,
      saturated_fat_g: 3,
      trans_fat_g: 0,
      sodium_mg: 115,
      added_sugar_g: 0,
      fibre_g: 10,
      protein_g: 28,
      carbs_g: 43,
      fat_g: 18,
      sugar_g: 17,
      is_processed_meat: false,
      is_red_meat: false,
      fruit_veg_servings: 1.5,
      is_oily_fish: false,
      processing_level: "minimally processed",
      ingredients_text: "Plain Greek yogurt, mixed berries, walnuts, chia seeds, rolled oats",
      data_source: "Loop power meal",
    },
  },
  {
    emoji: "🌱",
    name: "Lentil power plate",
    reason: "High fibre, low-GI carbs and leafy greens",
    ingredients: ["lentils", "broccoli", "kale", "quinoa", "tahini"],
    nutrition: {
      food_name: "Lentil power plate",
      portion: "1 plate",
      calories: 560,
      saturated_fat_g: 2.5,
      trans_fat_g: 0,
      sodium_mg: 410,
      added_sugar_g: 0,
      fibre_g: 19,
      protein_g: 25,
      carbs_g: 78,
      fat_g: 17,
      sugar_g: 9,
      is_processed_meat: false,
      is_red_meat: false,
      fruit_veg_servings: 3,
      is_oily_fish: false,
      processing_level: "minimally processed",
      ingredients_text: "Lentils, broccoli, kale, quinoa, tahini, lemon",
      data_source: "Loop power meal",
    },
  },
];

export function PowerMeals({ busy, onLog }: { busy: boolean; onLog: (meal: PowerMeal) => void }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <div><span>Easy defaults</span><h3>Power meals</h3></div>
        <p>Food first. Tap one only if you ate it.</p>
      </div>
      <div className={styles.rail}>
        {POWER_MEALS.map((meal) => (
          <article className={styles.card} key={meal.name}>
            <div className={styles.top}><span className={styles.emoji}>{meal.emoji}</span><button disabled={busy} onClick={() => onLog(meal)}>Log</button></div>
            <h4>{meal.name}</h4>
            <p>{meal.reason}</p>
            <ul>{meal.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
