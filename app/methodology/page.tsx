import fs from "fs";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-static";

export default function Methodology() {
  const md = fs.readFileSync(path.join(process.cwd(), "METHODOLOGY-WHOOP.md"), "utf8");
  return (
    <main className="min-h-dvh px-6 py-8 max-w-2xl mx-auto pb-20">
      <header className="flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full border-2 border-accent" />
          <span className="text-[12px] tracking-[0.2em] uppercase text-muted">Loop</span>
        </Link>
        <Link href="/" className="text-[12.5px] text-faint hover:text-muted transition-colors">
          ← Back
        </Link>
      </header>
      <article className="prose-loop">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </article>
    </main>
  );
}
