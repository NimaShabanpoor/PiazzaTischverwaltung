"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ReactNode } from "react";

export function AdminNavLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  /** Kleiner Zähler, z.B. offene Anfragen. 0/undefined = nicht anzeigen. */
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white text-brand-brown" : "text-white/80 hover:bg-white/10",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge ? (
        <span
          aria-label={`${badge} offen`}
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-status-reserved px-1 text-[11px] font-bold leading-none text-white sm:static"
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
