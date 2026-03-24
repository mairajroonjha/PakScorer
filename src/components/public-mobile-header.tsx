"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

type PublicMobileHeaderProps = {
  showHomeLink?: boolean;
};

export default function PublicMobileHeader({ showHomeLink = false }: PublicMobileHeaderProps) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSignedIn = status === "authenticated";
  const role = session?.user?.role;
  const teamHref = !isSignedIn ? ("/signup?next=/get-started" as Route) : role === "TEAM_ADMIN" ? ("/team" as Route) : ("/account" as Route);
  const teamLabel = !isSignedIn ? "Register Your Club/Team" : role === "TEAM_ADMIN" ? "Manage My Team" : "Register Your Club/Team";
  const accountHref = isSignedIn ? ("/account" as Route) : ("/login?next=/get-started" as Route);
  const accountLabel = isSignedIn ? "My Account" : "Login";
  const tournamentHref = !isSignedIn
    ? ("/signup?next=/register-tournament" as Route)
    : role === "TOURNAMENT_ADMIN"
      ? ("/admin/tournament" as Route)
      : ("/register-tournament" as Route);
  const tournamentLabel = role === "TOURNAMENT_ADMIN" ? "Tournament Desk" : "Request Tournament";

  const links: Array<{ href: Route; label: string }> = [
    ...(showHomeLink ? [{ href: "/" as Route, label: "Home" }] : []),
    { href: "/public#matches" as Route, label: "Matches" },
    { href: "/public#tournaments" as Route, label: "Series" },
    { href: "/public#news" as Route, label: "News" },
    { href: teamHref, label: teamLabel },
    { href: tournamentHref, label: tournamentLabel },
    { href: accountHref, label: accountLabel }
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="public-app-bar">
        <div className="public-app-bar__brand">
          <div>
            <strong>PakScorer</strong>
            <span>Live cricket center</span>
          </div>
        </div>
        <div className="public-app-bar__actions">
          <Link href={teamHref} className="public-app-bar__chip public-app-bar__chip--accent">
            {role === "TEAM_ADMIN" ? "Manage Team" : "Register Team"}
          </Link>
          <button type="button" className="public-app-bar__menu" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
            Menu
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="public-mobile-drawer">
          <button type="button" className="public-mobile-drawer__backdrop" onClick={closeMenu} aria-label="Close menu" />
          <aside className="public-mobile-drawer__panel" aria-label="Public menu">
            <div className="public-mobile-drawer__head">
              <div>
                <strong>Public Menu</strong>
                <span>For fans, club owners, and organizers</span>
              </div>
              <button type="button" className="public-mobile-drawer__close" onClick={closeMenu}>
                Close
              </button>
            </div>

            <nav className="public-mobile-drawer__links">
              {links.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} className="public-mobile-drawer__link" onClick={closeMenu}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="public-mobile-drawer__note">
              Team registration stays visible for owners here, but it stays out of the main fan feed so ordinary public browsing remains clean.
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
