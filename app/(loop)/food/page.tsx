import AppFrame from "@/components/loop/AppFrame";
import { NutritionSection } from "@/app/food/NutritionSection";
import { dailyTargets, type BodyProfile } from "@/lib/nutrition-targets";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loop — Food" };

export default async function FoodPage() {
  let profile: BodyProfile | undefined;
  try {
    const session = await getSession();
    profile = {
      age: session.age,
      sex: session.sex,
      weightKg: session.weightLb ? session.weightLb * 0.453592 : undefined,
      heightCm: session.heightCm,
    };
  } catch {
    // Preview mode has no session secret. The UI clearly labels its default target.
  }

  return (
    <AppFrame scroll>
      <main className="screen food-screen">
        <div className="screen-kicker">Food</div>
        <h1 className="screen-title">Eat well without overthinking it.</h1>
        <p className="screen-intro">
          Pick a power meal, scan something, or describe what you ate. Ingredients
          stay visible so each suggestion is useful in the grocery aisle too.
        </p>
        <NutritionSection targets={dailyTargets(profile)} />
      </main>
    </AppFrame>
  );
}
