import Link from "next/link";

const DRAFTS = [
  { slug: "", name: "Index" },
  { slug: "a", name: "A · The Instrument" },
  { slug: "b", name: "B · The Receipt" },
  { slug: "c", name: "C · Two Bodies" },
];

/** Scaffolding for review only. Does not ship with whichever draft is chosen. */
export default function Switcher({ current }: { current: string }) {
  return (
    <nav
      aria-label="Landing page drafts"
      style={{
        position: "fixed",
        top: "var(--s3)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        gap: "2px",
        padding: "4px",
        borderRadius: "var(--r-pill)",
        background: "var(--scrim)",
        border: "1px solid var(--hairline)",
        backdropFilter: "blur(12px)",
        maxWidth: "calc(100vw - 32px)",
        overflowX: "auto",
      }}
    >
      {DRAFTS.map((d) => {
        const active = d.slug === current;
        return (
          <Link
            key={d.slug}
            href={`/drafts/${d.slug}`}
            className="label"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-pill)",
              whiteSpace: "nowrap",
              textDecoration: "none",
              color: active ? "var(--void)" : "var(--ash)",
              background: active ? "var(--bone)" : "transparent",
            }}
          >
            {d.name}
          </Link>
        );
      })}
    </nav>
  );
}
