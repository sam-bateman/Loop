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
  // No auto-redirect. A signed-in visitor used to be bounced straight to
  // /dashboard, which meant the landing page was invisible to everyone who had
  // ever connected WHOOP. The CTA switches instead.
  const session = await getSession();
  const signedIn = Boolean(session.accessToken);

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Something went wrong connecting to WHOOP.") : null;

  return <Landing error={message} signedIn={signedIn} />;
}
