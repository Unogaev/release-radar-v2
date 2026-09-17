"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль.");
      return;
    }
    router.push("/now");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="font-display text-2xl text-ember-400 text-center mb-1 tracking-wide">
          Release Radar
        </div>
        <div className="text-xs text-ink-600 text-center mb-10 tracking-widest uppercase">
          Private access
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-ember-500 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-ember-500 transition-colors"
            />
          </div>

          {error && <div className="text-status-skip text-xs text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ember-500 hover:bg-ember-400 text-ink-950 font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
