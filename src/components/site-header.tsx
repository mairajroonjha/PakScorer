"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: Route;
  label: string;
}

function getNavItems(pathname: string): NavItem[] {
  if (pathname.startsWith("/login")) {
    return [
      { href: "/", label: "Home" },
      { href: "/public", label: "Public" },
      { href: "/login", label: "Login" }
    ];
  }

  if (pathname.startsWith("/admin/super")) {
    return [
      { href: "/", label: "Home" },
      { href: "/admin/super", label: "Super Admin" }
    ];
  }

  if (pathname.startsWith("/admin/tournament")) {
    return [
      { href: "/", label: "Home" },
      { href: "/admin/tournament", label: "Tournament Admin" }
    ];
  }

  if (pathname.startsWith("/team")) {
    return [
      { href: "/", label: "Home" },
      { href: "/team", label: "Team Dashboard" }
    ];
  }

  if (pathname.startsWith("/scorer")) {
    return [
      { href: "/", label: "Home" },
      { href: "/scorer", label: "Scorer" }
    ];
  }

  if (pathname.startsWith("/public")) {
    return [
      { href: "/", label: "Home" },
      { href: "/public", label: "Public" },
      { href: "/register-tournament", label: "Register Tournament" }
    ];
  }

  return [
    { href: "/", label: "Home" },
    { href: "/public", label: "Public" },
    { href: "/register-tournament", label: "Register Tournament" },
    { href: "/login", label: "Login" }
  ];
}

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) {
    return null;
  }
  const navItems = getNavItems(pathname);

  return (
    <header className="site-header">
      <div>
        <p className="site-header__eyebrow">Pakistan Cricket Operating System</p>
        <h1>PakScorer</h1>
        <p className="muted">Tournament operations, team management, direct matches, and live scoring</p>
      </div>
      <nav className="site-nav">
        {navItems.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
