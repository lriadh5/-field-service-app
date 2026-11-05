"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Sections" className="flex gap-1 overflow-x-auto">
      {items.map((it) => {
        const active = it.href === "/app" ? path === "/app" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
