"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  key: "matches" | "series" | "schedule" | "news";
};

const navItems: NavItem[] = [
  { href: "/public#matches", label: "Matches", key: "matches" },
  { href: "/public#tournaments", label: "Series", key: "series" },
  { href: "/public#matches", label: "Schedule", key: "schedule" },
  { href: "/public#news", label: "News", key: "news" }
];

export default function PublicBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  function isActive(item: NavItem) {
    if (pathname.startsWith("/public/matches/")) {
      return item.key === "matches";
    }

    if (hash === "#tournaments") {
      return item.key === "series";
    }

    if (hash === "#news") {
      return item.key === "news";
    }

    if (hash === "#matches") {
      return item.key === "matches";
    }

    return item.key === "matches";
  }

  return (
    <nav className="public-bottom-nav" aria-label="Public navigation">
      {navItems.map((item) => (
        <Link
          key={`${item.key}-${item.href}`}
          href={item.href as Route}
          className={`public-bottom-nav__link${isActive(item) ? " public-bottom-nav__link--active" : ""}`}
        >
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
