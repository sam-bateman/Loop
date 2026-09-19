import Image from "next/image";

/**
 * public/brand/loop-wordmark.png — the one asset public/brand/README.md marks
 * as not-disposable. Used as supplied; its green is #40F830, which is NOT the
 * --credit teal. See the note on app/uipreview/drafts/page.tsx.
 */
export default function Wordmark({
  width = 88,
  className = "",
  eager = false,
}: {
  width?: number;
  className?: string;
  eager?: boolean;
}) {
  return (
    <Image
      src="/brand/loop-wordmark.png"
      alt="Loop"
      width={1446}
      height={742}
      /* `priority` is deprecated as of Next 16 in favour of explicit loading /
         fetchPriority — see node_modules/next/dist/docs …/components/image.md */
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
      style={{ width, height: "auto" }}
    />
  );
}
