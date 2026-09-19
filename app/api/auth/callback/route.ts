import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCode } from "@/lib/whoop";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const session = await getSession();

  if (error) return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, url.origin));
  if (!code) return NextResponse.redirect(new URL("/?error=missing_code", url.origin));
  if (!state || state !== session.oauthState) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", url.origin));
  }

  try {
    const token = await exchangeCode(code);
    session.accessToken = token.access_token;
    session.refreshToken = token.refresh_token;
    session.expiresAt = Date.now() + token.expires_in * 1000;
    session.oauthState = undefined;
    await session.save();
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", url.origin));
  }
}
