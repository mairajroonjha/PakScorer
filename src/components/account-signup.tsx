"use client";

import type { Route } from "next";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

function getCallbackPath(nextPath: string | null): string {
  if (nextPath && nextPath.startsWith("/")) {
    return nextPath;
  }
  return "/get-started";
}

export default function AccountSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("Create your public account first, then register a team or request a tournament.");

  const messageTone =
    message === "Passwords do not match." || message.includes("already") || message.includes("failed")
      ? "danger"
      : message === "Account created. Redirecting..."
        ? "success"
        : "neutral";

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const callbackUrl = getCallbackPath(searchParams.get("next"));
    setMessage("Creating your account...");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password
      })
    });

    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error ?? "Account creation failed.");
      return;
    }

    const loginResult = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    if (!loginResult || loginResult.error) {
      setMessage("Account created. Please sign in.");
      router.push("/login");
      return;
    }

    startTransition(() => {
      setMessage("Account created. Redirecting...");
    });
    router.push((loginResult.url ?? callbackUrl) as Route);
    router.refresh();
  }

  const loginHref = (() => {
    const nextPath = searchParams.get("next");
    if (nextPath && nextPath.startsWith("/")) {
      return `/login?next=${encodeURIComponent(nextPath)}` as Route;
    }
    return "/login" as Route;
  })();

  return (
    <section className="login-card">
      <div className="login-card__form">
        <div className="login-brand">PakScorer</div>
        <div className="login-copy">
          <p className="login-kicker">Create Account</p>
          <h1>Start Here</h1>
          <p className="muted">Create your public organizer account. After sign in, you can register a team or send a tournament request to Super Admin.</p>
        </div>

        <form className="login-form" onSubmit={(event) => void handleSignup(event)}>
          <label className="login-field">
            <span className="sr-only">Full Name</span>
            <span className="login-input-shell">
              <span className="login-icon" aria-hidden="true">
                U
              </span>
              <input
                className="input login-input"
                name="name"
                type="text"
                placeholder="Full name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </span>
          </label>

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
            <span className="sr-only">Phone Number</span>
            <span className="login-input-shell">
              <span className="login-icon" aria-hidden="true">
                #
              </span>
              <input
                className="input login-input"
                name="phone"
                type="tel"
                placeholder="Phone number"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
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
                autoComplete="new-password"
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

          <label className="login-field">
            <span className="sr-only">Confirm Password</span>
            <span className="login-input-shell">
              <span className="login-icon" aria-hidden="true">
                *
              </span>
              <input
                className="input login-input"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </span>
          </label>

          <div className="login-meta">
            <p className="login-meta__text">Public starter account</p>
            <p className="login-meta__text">Used for team or tournament entry</p>
          </div>

          <button type="submit" className="login-submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </button>

          <p className={`login-message login-message--${messageTone}`}>{message}</p>

          <p className="auth-helper">
            Already have an account?{" "}
            <Link href={loginHref} className="auth-helper__link">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <aside className="login-card__panel">
        <p className="login-panel__eyebrow">Organizer Access</p>
        <h2>Create one account before you touch any protected workflow.</h2>
        <p className="login-panel__body">
          This account is used for public participation flows. After Super Admin approval, the same organizer account becomes the tournament admin account for that competition.
        </p>
        <div className="login-panel__chips">
          <span className="login-panel__chip">Public signup</span>
          <span className="login-panel__chip">Organizer account reuse</span>
          <span className="login-panel__chip">Approval-based activation</span>
        </div>
        <Link href="/public" className="login-panel__link">
          Open Public Center
        </Link>
      </aside>
    </section>
  );
}
