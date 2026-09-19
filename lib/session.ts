import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type LoopSession = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  oauthState?: string;
  userId?: number;
  firstName?: string;
  /** Answers collected in /onboarding while the WHOOP sync runs. */
  name?: string;
  age?: number;
  sex?: "male" | "female" | "other";
  weightLb?: number;
  /** Filled from WHOOP at onboarding — Mifflin-St Jeor needs it, and no screen asks for it. */
  heightCm?: number;
  onboarded?: boolean;
  /** Today's logged meals. Cookie-sized, so app/api/meals caps the list. */
  meals?: {
    day: string;
    at: string;
    nutrition: import("./food-scoring").Nutrition;
    minutes: number;
  }[];
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "loop_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<LoopSession>(await cookies(), sessionOptions);
}
