"use client";

import React, { useId, useState } from "react";

/**
 * AuthPage
 * Modern, professional authentication UI for a Property Portfolio Cashflow Forecaster SaaS
 * - Visual style & palette adheres to user's spec
 * - Accessible labels, focus states, and keyboard navigation
 * - Responsive: centered card on desktop; full-width card with safe margins on mobile
 * - Includes Sign In and Sign Up variants with Google OAuth button
 * - Micro-interactions: hover, focus, subtle scale, loading spinner
 * - Inter font expected globally (e.g., via <link rel="preconnect" ...> + Google Fonts)
 */

export default function AuthPage({ mode = "signin" as "signin" | "signup" }) {
  const [authMode, setAuthMode] = useState<typeof mode>(mode);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Basic demo validation rules—adjust to your auth logic
  const validate = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const nextErrors: Record<string, string> = {};

    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "").trim();

    if (!email) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";

    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8) nextErrors.password = "Must be at least 8 characters";

    if (authMode === "signup") {
      const fullName = String(fd.get("fullName") || "").trim();
      const confirm = String(fd.get("confirmPassword") || "").trim();
      const agree = fd.get("agree") === "on";

      if (!fullName) nextErrors.fullName = "Full name is required";
      if (!confirm) nextErrors.confirmPassword = "Please confirm your password";
      if (confirm && password !== confirm) nextErrors.confirmPassword = "Passwords do not match";
      if (!agree) nextErrors.agree = "You must agree to continue";
    }

    return nextErrors;
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setTouched(Object.fromEntries(Array.from(new FormData(form).keys()).map(k => [k, true])));
    if (Object.keys(nextErrors).length === 0) {
      setLoading(true);
      // Simulate request
      setTimeout(() => setLoading(false), 1400);
    }
  };

  const SwitchCopy = authMode === "signin"
    ? { title: "Welcome Back", subtitle: "Sign in to your account", footerQ: "Don't have an account?", footerLink: "Sign up", footerAction: () => setAuthMode("signup" as const), primary: "Sign In" }
    : { title: "Create Your Account", subtitle: "Start forecasting your portfolio", footerQ: "Already have an account?", footerLink: "Sign in", footerAction: () => setAuthMode("signin" as const), primary: "Create Account" };

  return (
    <div
      className="min-h-screen w-full font-[Inter] text-[#111827] bg-gradient-to-b from-[#eff6ff] to-white flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(1200px 600px at 80% -20%, rgba(37,99,235,0.06), transparent 60%), radial-gradient(600px 300px at 10% 110%, rgba(37,99,235,0.05), transparent 60%)",
      }}
    >
      <div className="w-full max-w-[450px]">
        {/* Card */}
        <div className="bg-white rounded-[12px] shadow-[0_10px_30px_rgba(17,24,39,0.06)] border border-[#e5e7eb] overflow-hidden">
          {/* Header / Logo */}
          <div className="px-8 pt-8">
            <BrandLogo />
            <h1 className="mt-6 text-[32px] leading-tight font-bold">{SwitchCopy.title}</h1>
            <p className="mt-1 text-[18px] text-[#6b7280]">{SwitchCopy.subtitle}</p>
          </div>

          {/* Form */}
          <form noValidate onSubmit={onSubmit} className="px-8 pt-6 pb-8">
            {authMode === "signup" && (
              <Field
                id="fullName"
                label="Full Name"
                placeholder="Jane Citizen"
                type="text"
                error={touched.fullName ? errors.fullName : undefined}
                onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              />
            )}

            <Field
              id="email"
              label="Email"
              placeholder="you@example.com"
              type="email"
              error={touched.email ? errors.email : undefined}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />

            <Field
              id="password"
              label="Password"
              placeholder="••••••••"
              type="password"
              error={touched.password ? errors.password : undefined}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />

            {authMode === "signup" && (
              <Field
                id="confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                type="password"
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              />
            )}

            {/* Row: remember/forgot OR agree */}
            {authMode === "signin" ? (
              <div className="flex items-center justify-between mt-2">
                <Checkbox id="remember" label="Remember me" />
                <a href="#" className="text-sm font-medium text-[#2563eb] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb] rounded">Forgot password?</a>
              </div>
            ) : (
              <div className="mt-2">
                <Checkbox id="agree" label={<>
                  I agree to <a href="#" className="text-[#2563eb] hover:underline">Terms</a> &amp; <a href="#" className="text-[#2563eb] hover:underline">Privacy</a>
                </>} error={touched.agree ? errors.agree : undefined} onBlur={() => setTouched((t)=>({...t,agree:true}))} />
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 space-y-3">
              <PrimaryButton type="submit" loading={loading}>
                {SwitchCopy.primary}
              </PrimaryButton>
              <SecondaryButton onClick={() => alert("Google OAuth flow")}
                icon={<GoogleIcon className="w-5 h-5" />}
              >
                Continue with Google
              </SecondaryButton>
            </div>

            {/* Footer prompt */}
            <p className="mt-6 text-sm text-[#6b7280]">
              {SwitchCopy.footerQ} {" "}
              <button type="button" onClick={SwitchCopy.footerAction} className="text-[#2563eb] font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb] rounded">
                {SwitchCopy.footerLink}
              </button>
            </p>
          </form>
        </div>

        {/* Small print / brand reassurance */}
        <p className="text-center text-xs text-[#6b7280] mt-4">
          Secured by industry‑standard encryption. Need help? <a className="text-[#2563eb] hover:underline" href="#">Contact support</a>
        </p>
      </div>
    </div>
  );
}

// ————————————————————————————
// UI Primitives
// ————————————————————————————

function BrandLogo() {
  return (
    <div className="flex items-center gap-3" aria-label="PBCo Logo">
      <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
        <span className="text-white font-bold">PB</span>
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight">Property Buyers Co.</div>
        <div className="text-xs text-[#6b7280]">Portfolio Forecaster</div>
      </div>
    </div>
  );
}

function Field({ id, label, type = "text", placeholder, error, onBlur }: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}) {
  const inputId = useId();
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="mt-4">
      <label htmlFor={inputId} className="block text-sm font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          name={id}
          type={type}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onBlur={onBlur}
          className={[
            "w-full h-12 px-4 rounded-[8px]",
            "border",
            error ? "border-[#dc2626]" : "border-[#e5e7eb]",
            "bg-white text-[#111827] placeholder-[#9ca3af]",
            "outline-none",
            "transition-all duration-150",
            error
              ? "ring-2 ring-[#fecaca] focus:ring-[#fecaca]"
              : "focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.15)]",
          ].join(" ")}
        />
        {/* Success indicator (optional demo): add a green check when no error and field has content via :not(:placeholder-shown) would need JS; omitted for simplicity */}
      </div>
      {error && (
        <p id={describedBy} className="mt-1 text-sm text-[#dc2626]">{error}</p>
      )}
    </div>
  );
}

function Checkbox({ id, label, error, onBlur }: { id: string; label: React.ReactNode; error?: string; onBlur?: () => void }) {
  const inputId = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={inputId}
        name={id}
        type="checkbox"
        onBlur={onBlur}
        className="peer mt-1 h-4 w-4 rounded border-[#e5e7eb] text-[#2563eb] focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1"
      />
      <label htmlFor={inputId} className="text-sm font-medium text-[#111827] select-none">
        {label}
      </label>
      {error && <p className="ml-auto text-sm text-[#dc2626]">{error}</p>}
    </div>
  );
}

function PrimaryButton({ children, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={[
        "group relative w-full h-12 rounded-[8px]",
        "bg-[#2563eb] text-white font-semibold",
        "shadow-sm",
        "transition-transform duration-150 will-change-transform",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(37,99,235,0.25)]",
        loading || props.disabled ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-[1px]",
      ].join(" ")}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <Spinner />}
        {children}
      </span>
    </button>
  );
}

function SecondaryButton({ children, icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }) {
  return (
    <button
      {...props}
      className={[
        "w-full h-12 rounded-[8px]",
        "bg-white text-[#374151] font-semibold",
        "border border-[#e5e7eb]",
        "transition-transform duration-150 will-change-transform",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]",
        "hover:shadow-sm hover:-translate-y-[1px]",
      ].join(" ")}
    >
      <span className="flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.7-37-5-54.9H272v103.9h147.4c-6.3 34.1-25.2 63.1-53.7 82.4v68h86.8c50.8-46.8 80-115.7 80-199.4z"/>
      <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24 178.3-65.1l-86.8-68c-24.1 16.2-55 25.8-91.5 25.8-70.3 0-129.8-47.5-151.2-111.3H31.7v69.9C75.9 486.3 167.6 544.3 272 544.3z"/>
      <path fill="#FBBC05" d="M120.8 325.7c-10.7-31.8-10.7-66.2 0-97.9v-69.9H31.7c-43.2 86.4-43.2 151.3 0 237.7l89.1-69.9z"/>
      <path fill="#EA4335" d="M272 107.7c39.5-.6 77.7 14.3 106.8 41.8l79.3-79.3C404.8 25.5 342.8 0 272 0 167.6 0 75.9 58 31.7 156.1l89.1 69.9C142.2 155.3 201.7 107.7 272 107.7z"/>
    </svg>
  );
}
