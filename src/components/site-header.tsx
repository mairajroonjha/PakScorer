"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  sectionKey?: string;
  accent?: boolean;
}

function getPublicNavItems(): NavItem[] {
  return [
    { href: "/", label: "Home", sectionKey: "home" },
    { href: "/public#matches", label: "Matches", sectionKey: "matches", accent: true },
    { href: "/public#tournaments", label: "Tournaments", sectionKey: "tournaments" },
    { href: "/public#points-table", label: "Points Table", sectionKey: "points-table" },
    { href: "/public#rankings", label: "Rankings", sectionKey: "rankings" },
    { href: "/public#news", label: "News", sectionKey: "news" }
  ];
}

function getNavItems(pathname: string, isPublicSurface: boolean): NavItem[] {
  if (isPublicSurface) {
    return getPublicNavItems();
  }

  if (pathname.startsWith("/login")) {
    return [
      { href: "/", label: "Home" },
      { href: "/login", label: "Login" }
    ];
  }

  if (pathname.startsWith("/admin/super")) {
    return [
      { href: "/", label: "Home" },
      { href: "/admin/super", label: "Super Admin" },
      { href: "/account", label: "Account" }
    ];
  }

  if (pathname.startsWith("/admin/tournament")) {
    return [
      { href: "/", label: "Home" },
      { href: "/admin/tournament", label: "Tournament Admin" },
      { href: "/account", label: "Account" }
    ];
  }

  if (pathname.startsWith("/team")) {
    return [
      { href: "/", label: "Home" },
      { href: "/team", label: "Team Dashboard" },
      { href: "/account", label: "Account" }
    ];
  }

  if (pathname.startsWith("/scorer")) {
    return [
      { href: "/", label: "Home" },
      { href: "/scorer", label: "Scorer" },
      { href: "/account", label: "Account" }
    ];
  }

  if (pathname.startsWith("/account")) {
    return [
      { href: "/", label: "Home" },
      { href: "/account", label: "Account" }
    ];
  }

  return [
    { href: "/", label: "Home" },
    { href: "/login", label: "Login" }
  ];
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("pakscorer-theme");
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("pakscorer-theme", nextTheme);
  }

  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/public")) {
    return null;
  }
  const isPublicSurface = pathname === "/" || pathname.startsWith("/public");
  const navItems = getNavItems(pathname, isPublicSurface);

  function isActive(item: NavItem) {
    if (isPublicSurface) {
      if (item.sectionKey === "home") {
        return pathname === "/";
      }

      if (!pathname.startsWith("/public")) {
        return false;
      }

      const itemHash = item.href.includes("#") ? item.href.slice(item.href.indexOf("#")) : "";

      if (hash.length > 0) {
        return itemHash === hash;
      }

      return item.sectionKey === "matches";
    }

    return item.href === pathname;
  }

  if (isPublicSurface) {
    return (
      <header className="site-header site-header--public">
        <Link href="/" className="site-header__brand">
          <span className="site-header__brand-mark" aria-hidden="true">
            PS
          </span>
          <span className="site-header__brand-copy">
            <strong>PakScorer</strong>
            <span>Public match center</span>
          </span>
        </Link>
        <nav className="site-nav site-nav--public" aria-label="Public view navigation">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href as Route}
              className={[
                "site-nav__link",
                item.accent ? "site-nav__link--accent" : "",
                isActive(item) ? "site-nav__link--active" : ""
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <button type="button" className="site-header__utility" onClick={toggleTheme}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <Link href="/signup?next=/get-started" className="site-header__utility">
            Create Account
          </Link>
          <Link href="/public#matches" className="site-header__utility site-header__utility--live">
            Live Center
          </Link>
          <Link href="/login" className="site-header__utility">
            Login
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div>
        <p className="site-header__eyebrow">Pakistan Cricket Operating System</p>
        <h1>PakScorer</h1>
        <p className="muted">Tournament operations, team management, direct matches, and live scoring</p>
      </div>
      <nav className="site-nav">
        {navItems.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href as Route}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
