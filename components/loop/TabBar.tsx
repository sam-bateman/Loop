"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/uipreview", label: "Today", icon: "pulse" },
  { href: "/uipreview/food", label: "Food", icon: "food" },
  { href: "/uipreview/ledger", label: "History", icon: "history" },
  { href: "/uipreview/genome", label: "Genetics", icon: "genetics" },
];

function TabIcon({ name }: { name: string }) {
  if (name === "food") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 1 4 4 4 7h-4" /></svg>;
  }
  if (name === "history") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6M4 4v4.6h4.6M12 7v5l3 2" /></svg>;
  }
  if (name === "genetics") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3c0 7 10 11 10 18M17 3C17 10 7 14 7 21M8.5 7h7M8.5 17h7" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>;
}

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((t) => {
        const active = t.href === "/uipreview" ? path === "/uipreview" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="label tab"
            aria-current={active ? "page" : undefined}
            data-active={active || undefined}
          >
            <TabIcon name={t.icon} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
