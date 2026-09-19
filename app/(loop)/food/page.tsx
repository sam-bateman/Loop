import AppFrame from "@/components/loop/AppFrame";
import { NutritionSection } from "@/app/food/NutritionSection";
import { dailyTargets, kjToKcal, type BodyProfile } from "@/lib/nutrition-targets";
import { getSession } from "@/lib/session";
import { accessToken, fetchAll } from "@/lib/whoop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loop — Food" };

export default async function FoodPage() {
  let profile: BodyProfile | undefined;
  let burnedKcal: number | null = null;

  try {
    const session = await getSession();
    profile = {
      age: session.age,
      sex: session.sex,
      weightKg: session.weightLb ? session.weightLb * 0.453592 : undefined,
      heightCm: session.heightCm,
    };

    // Calories to eat against come from WHOOP's measured burn, averaged over finished
    // cycles — today's is still accumulating and would read low. This sizes only what
    // is displayed; the scored allowances stay on the Mifflin-St Jeor estimate, or the
    // same exercise gets counted twice (METHODOLOGY.md §8.1).
    const token = await accessToken();
    if (token) {
      const { cycles, body } = await fetchAll(token, 10);
      const burns = cycles
        .filter((cycle) => cycle.end && cycle.score?.kilojoule)
        .slice(0, 7)
        .map((cycle) => kjToKcal(cycle.score!.kilojoule));
      if (burns.length) burnedKcal = burns.reduce((a, b) => a + b, 0) / burns.length;

      // WHOOP's own measurements beat an empty onboarding answer.
      profile = {
        ...profile,
        weightKg: profile.weightKg ?? body?.weight_kilogram,
        heightCm: profile.heightCm ?? (body ? body.height_meter * 100 : undefined),
      };
    }
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
        <NutritionSection targets={dailyTargets(profile, burnedKcal)} />
      </main>
    </AppFrame>
  );
}
