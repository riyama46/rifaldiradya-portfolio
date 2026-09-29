"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";

const t = adminStrings.signIn;

const inputClass =
  "w-full rounded-button border border-border bg-surface-raised px-3.5 py-3 text-base text-text outline-none transition-colors focus-visible:border-accent";

type ApiError = { error?: { code?: string; retryAfterSeconds?: number } };

// S-10 (App Flow): generic error on bad credentials (clears + focuses password), rate-limit message
// with the button disabled until the window passes, redirect to the validated `next` on success.
export function LoginForm({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = window.setTimeout(() => setLockedUntil(null), lockedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [lockedUntil]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });

      if (response.ok) {
        window.location.assign(next);
        return;
      }

      const body = (await response.json().catch(() => ({}))) as ApiError;
      const code = body.error?.code;

      if (code === "RATE_LIMITED") {
        const seconds = body.error?.retryAfterSeconds ?? 900;
        setLockedUntil(Date.now() + seconds * 1000);
        setError(t.rateLimited(Math.ceil(seconds / 60)));
      } else if (code === "INVALID_CREDENTIALS") {
        setError(t.invalidCredentials);
      } else if (code === "VALIDATION_FAILED") {
        setError(t.missingFields);
      } else if (code === "ADMIN_NOT_CONFIGURED") {
        setError(t.notConfigured);
      } else {
        setError(t.server);
      }
    } catch {
      setError(t.network);
    }

    if (passwordRef.current) {
      passwordRef.current.value = "";
      passwordRef.current.focus();
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error && (
        <p
          role="alert"
          className="rounded-button border border-danger/40 bg-danger/10 px-3.5 py-3 text-small text-text"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small font-medium">
          {t.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-small font-medium">
          {t.password}
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            className="absolute inset-y-1 right-1 cursor-pointer rounded-md px-3 text-small font-medium text-text-muted hover:text-text"
          >
            {showPassword ? t.hide : t.show}
          </button>
        </div>
      </div>

      <Button type="submit" loading={pending} disabled={lockedUntil !== null} className="w-full">
        {pending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
