"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkle, EnvelopeSimple, Lock } from "@phosphor-icons/react/dist/ssr";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for callback error
    if (searchParams.get("error") === "callback") {
      setError("Authentication failed. Please try logging in again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data.user) {
        // Redirect to the page they came from, or default to /box
        const redirectTo = searchParams.get("redirect") || "/box";
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="gradient-bg"></div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-orange-800 hover:text-orange-600 transition-colors mb-4"
          >
            ← Back to Home
          </button>
        </div>

        <div className="glass-card-white p-8 rounded-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Sparkle weight="fill" className="text-3xl text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-orange-950 mb-2">
              Welcome Back
            </h1>
            <p className="text-orange-800">
              Log in to continue unboxing
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-orange-950 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeSimple
                  weight="bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-600 focus:outline-none text-orange-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-orange-950 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  weight="bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-600 focus:outline-none text-orange-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Logging In..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-orange-800">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/auth/signup")}
                className="text-orange-600 font-bold hover:text-orange-700"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen">
        <div className="gradient-bg"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
