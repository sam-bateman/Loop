import Link from "next/link";
import { NutritionSection } from "./NutritionSection";
import { dailyTargets, type BodyProfile } from "@/lib/nutrition-targets";
import { getSession } from "@/lib/session";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loop — Food" };

function Icon({ name }: { name: "home" | "food" | "genetics" | "science" }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    food: <><path d="M7 3v7M4 3v4c0 2 1.3 3 3 3s3-1 3-3V3M7 10v11M16 3c-2 2-3 5-3 8h4v10M17 3v8"/></>,
    genetics: <><path d="M7 3c0 6 10 12 10 18M17 3C17 9 7 15 7 21M8.5 6h7M7.5 10h9M7.5 14h9M8.5 18h7"/></>,
    science: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 16h9"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default async function FoodPage() {
  let profile: BodyProfile | undefined;
  let name: string | undefined;
  try {
    const session = await getSession();
    name = session.name ?? session.firstName;
    profile = {
      age: session.age,
      sex: session.sex,
      weightKg: session.weightLb ? session.weightLb * 0.453592 : undefined,
      heightCm: session.heightCm,
    };
  } catch {
    // Preview and local builds can still use the documented default targets.
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div><p>Food</p><h1>Eat well, simply.</h1></div>
        <div className={styles.avatar} aria-label={name ? `${name}'s profile` : "Your profile"}>{(name?.[0] ?? "L").toUpperCase()}</div>
      </header>
      <div className={styles.syncPill}><span />Saved privately on this device</div>
      <NutritionSection targets={dailyTargets(profile)} />
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <Link href="/dashboard"><Icon name="home" /><span>Home</span></Link>
        <Link href="/food" className={styles.active}><Icon name="food" /><span>Food</span></Link>
        <Link href="/genetics"><Icon name="genetics" /><span>Genetics</span></Link>
        <Link href="/methodology"><Icon name="science" /><span>Science</span></Link>
      </nav>
    </main>
  );
}
