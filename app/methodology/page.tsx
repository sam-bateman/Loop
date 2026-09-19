import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-static";

export default function Methodology() {
  const md = fs.readFileSync(path.join(process.cwd(), "METHODOLOGY-WHOOP.md"), "utf8");
  return (
    <main className="min-h-dvh px-6 py-8 max-w-2xl mx-auto pb-20">
      <header className="flex items-center justify-between mb-10">
        <Link href="/">
          <Image src="/brand/loop-wordmark.png" alt="Loop" width={1446} height={742} className="w-[72px] h-auto" />
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
