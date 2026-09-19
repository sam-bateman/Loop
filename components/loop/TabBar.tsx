"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation is the one thing UI_SPEC.md §10 does not specify. §10.1 says the
 * Today screen has "no header, no nav bar" — correct for that screen in
 * isolation, but DESIGN_SPEC.md §10 lists four routes and gives no way to move
 * between them. This is the smallest thing that closes the gap: a hairline row
 * of labels, no icons, no filled pills, nothing that competes with the ring.
 */
const TABS = [
  { href: "/ui", label: "Today" },
  { href: "/ui/ledger", label: "Ledger" },
  { href: "/ui/genome", label: "Genome" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((t) => {
        const active = t.href === "/ui" ? path === "/ui" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="label tab"
            aria-current={active ? "page" : undefined}
            data-active={active || undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
