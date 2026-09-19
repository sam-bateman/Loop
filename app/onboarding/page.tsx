import { redirect } from "next/navigation";
import { accessToken, fetchBasics } from "@/lib/whoop";
import { getSession } from "@/lib/session";
import Onboarding from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const token = await accessToken();
  if (!token) redirect("/");

  const session = await getSession();
  if (session.onboarded) redirect("/dashboard");

  // Cheap prefill so the questions feel like they already know you.
  const { profile, body } = await fetchBasics(token);
  const weightLb = body?.weight_kilogram
    ? Math.round(body.weight_kilogram * 2.2046226)
    : undefined;

  return <Onboarding initialName={profile?.first_name ?? ""} initialWeightLb={weightLb} />;
}
