"use client";

import { LoaderCircle, Utensils } from "lucide-react";
import { useState, type FormEvent } from "react";

type LoginFormProps = {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  error: string;
};

export default function LoginForm({ onSignIn, error }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);

    try {
      await onSignIn(email, password);
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-3 text-white">
            <Utensils size={25} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Restaurant Admin</h1>
            <p className="text-sm text-slate-500">Menu management</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with an existing Supabase Auth account.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-2"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-2"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </label>

          <button
            disabled={signingIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {signingIn && <LoaderCircle size={17} className="animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Create your admin user in Supabase Authentication first. Public
          sign-up is not enabled from this dashboard.
        </p>
      </section>
    </main>
  );
}
