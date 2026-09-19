import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

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
  const session = await getSession();
  if (session.accessToken) redirect("/dashboard");

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Something went wrong connecting to WHOOP.") : null;

  return (
    <main className="min-h-dvh flex flex-col px-6 py-10 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center">
        <Image
          src="/brand/loop-wordmark.png"
          alt="Loop"
          width={1446}
          height={742}
          priority
          className="w-[104px] h-auto mb-12"
        />

        <h1 className="text-[34px] leading-[1.12] font-semibold tracking-[-0.025em] mb-5">
          Your WHOOP data,
          <br />
          priced in{" "}
          <span className="text-accent">minutes<br />of life</span>.
        </h1>

        <p className="text-muted text-[15px] leading-relaxed mb-3">
          Loop reads your sleep, resting heart rate, HRV and training load, and converts each
          one into minutes of life expectancy gained or lost — using published mortality
          meta-analyses, not vibes.
        </p>
        <p className="text-faint text-[13.5px] leading-relaxed mb-10">
          Every rate in the model is cited, deliberately conservative, and written down
          before the code was.
        </p>

        {message && (
          <div className="mb-5 rounded-lg border border-loss/30 bg-loss/10 px-4 py-3 text-[13.5px] text-loss">
            {message}
          </div>
        )}

        <a
          href="/api/auth/login"
          className="block w-full text-center rounded-full bg-text text-bg font-semibold text-[15px] py-4 active:scale-[0.98] transition-transform"
        >
          Connect WHOOP
        </a>

        <p className="text-faint text-[12px] leading-relaxed mt-4 text-center">
          Read-only. Your tokens stay in an encrypted cookie on your device —
          Loop stores nothing on a server.
        </p>
      </div>

      <footer className="pt-10 flex items-center justify-between text-[12.5px] text-faint">
        <Link href="/methodology" className="hover:text-muted transition-colors">
          Methodology &amp; citations →
        </Link>
        <span>Not medical advice</span>
      </footer>
    </main>
  );
}
