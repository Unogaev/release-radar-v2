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
        <div className="font-display text-2xl text-rr-accent text-center mb-1 tracking-wide">
          Release Radar
        </div>
        <div className="text-xs text-rr-text-dim text-center mb-10 tracking-widest uppercase">
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
              className="w-full bg-rr-surface border border-rr-hair rounded px-4 py-3 text-sm focus:outline-none focus:border-rr-accent transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-rr-surface border border-rr-hair rounded px-4 py-3 text-sm focus:outline-none focus:border-rr-accent transition-colors"
            />
          </div>

          {error && <div className="text-rr-muted text-xs text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rr-accent hover:bg-rr-accent-hi text-rr-bg font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
