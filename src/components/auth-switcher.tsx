"use client";

import type { Route } from "next";
import { signOut, useSession } from "next-auth/react";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();
  const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  const shouldHide = staticExport || pathname === "/" || pathname.startsWith("/public") || pathname.startsWith("/login");

  async function logout() {
    startTransition(() => {
      void signOut({ redirect: false });
    });
    router.push("/public" as Route);
    router.refresh();
  }

  if (shouldHide) {
    return null;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Current Access</h3>
      <p className="muted">
        {status === "loading"
          ? "Checking session..."
          : session?.user?.name
            ? `Signed in as ${session.user.name}`
            : "Guest mode"}
      </p>
      <div className="actions">
        {session?.user?.name ? <span className="pill">{session.user.name}</span> : <span className="pill">Guest mode</span>}
        <button className="alert" disabled={isPending} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
