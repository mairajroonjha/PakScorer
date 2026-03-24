"use client";

import type { Route } from "next";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getCallbackPath(nextPath: string | null): string {
  if (nextPath && nextPath.startsWith("/")) {
    return nextPath;
  }
  return "/dashboard";
}

export default function AccountLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("Use your assigned account credentials to continue.");

  const messageTone =
    message === "Invalid account or password." ? "danger" : message === "Login successful. Redirecting..." ? "success" : "neutral";

  const signupHref = (() => {
    const nextPath = searchParams.get("next");
    if (nextPath && nextPath.startsWith("/")) {
      return `/signup?next=${encodeURIComponent(nextPath)}` as Route;
    }
    return "/signup" as Route;
  })();

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const callbackUrl = getCallbackPath(searchParams.get("next"));
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    if (!result || result.error) {
      setMessage("Invalid account or password.");
      return;
    }

    startTransition(() => {
      setMessage("Login successful. Redirecting...");
    });
    router.push((result.url ?? callbackUrl) as Route);
    router.refresh();
  }

  return (
    <section className="login-card">
      <div className="login-card__form">
        <div className="login-brand">PakScorer</div>
        <div className="login-copy">
          <p className="login-kicker">Secure Access</p>
          <h1>Hello!</h1>
          <p className="muted">Sign in with your account email and password. New users should create a public account first, then start team or tournament entry after login.</p>
        </div>

        <form className="login-form" onSubmit={(event) => void handleCredentialsLogin(event)}>
          <label className="login-field">
            <span className="sr-only">Account Email</span>
            <span className="login-input-shell">
              <span className="login-icon" aria-hidden="true">
                @
              </span>
              <input
                className="input login-input"
                name="email"
                type="email"
                placeholder="E-mail"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="login-field">
            <span className="sr-only">Password</span>
            <span className="login-input-shell">
              <span className="login-icon" aria-hidden="true">
                *
              </span>
              <input
                className="input login-input"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <div className="login-meta">
            <p className="login-meta__text">Authorized users only</p>
            <p className="login-meta__text">Need access? Contact platform admin</p>
          </div>

          <button type="submit" className="login-submit" disabled={isPending}>
            {isPending ? "Signing In..." : "Sign In"}
          </button>

          <p className={`login-message login-message--${messageTone}`}>{message}</p>

          <p className="auth-helper">
            New here?{" "}
            <Link href={signupHref} className="auth-helper__link">
              Create account
            </Link>
          </p>
        </form>
      </div>

      <aside className="login-card__panel">
        <p className="login-panel__eyebrow">Welcome Back</p>
        <h2>Private cricket operations stay behind one secure login.</h2>
        <p className="login-panel__body">
          Tournament controls, scorer tools, team dashboards, and platform administration are not exposed to ordinary visitors. Public users create one account first, then sign in and start with team registration or tournament request.
        </p>
        <div className="login-panel__chips">
          <span className="login-panel__chip">Private dashboards</span>
          <span className="login-panel__chip">Role-based routing</span>
          <span className="login-panel__chip">Team and tournament starter flow</span>
        </div>
        <Link href="/public" className="login-panel__link">
          Open Public Center
        </Link>
      </aside>
    </section>
  );
}
