import { getSession } from "@/lib/session";
import Landing from "./landing/Landing";

const ERRORS: Record<string, string> = {
  state_mismatch: "That sign-in attempt didn't match. Start again.",
  token_exchange_failed: "WHOOP rejected the connection. Try once more.",
  missing_code: "WHOOP didn't return an authorization code.",
  access_denied: "You declined access. Nothing was connected.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // No auto-redirect. Bouncing a signed-in visitor to /dashboard made the
  // landing page unreachable for anyone who had ever connected WHOOP — which is
  // everyone building and demoing this. The CTA switches instead.
  const session = await getSession();
  const signedIn = Boolean(session.accessToken);

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Something went wrong connecting to WHOOP.") : null;

  return <Landing error={message} signedIn={signedIn} />;
}
