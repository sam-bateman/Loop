import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type LoopSession = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  oauthState?: string;
  userId?: number;
  firstName?: string;
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
