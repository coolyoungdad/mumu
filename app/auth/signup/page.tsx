"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkle, EnvelopeSimple, Lock, User } from "@phosphor-icons/react/dist/ssr";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create user record in public.users table
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          role: "user",
          account_balance: 500,
        });

        if (insertError) {
          console.error("Failed to create user record:", insertError);
        }

        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setError("This email is already registered. Please sign in instead.");
          setIsLoading(false);
          return;
        }

        // Redirect to box page
        router.push("/box");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
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
              Create Account
            </h1>
            <p className="text-orange-800">
              Join Mumu and start unboxing today!
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
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

            <div>
              <label className="block text-sm font-bold text-orange-950 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  weight="bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-600 focus:outline-none text-orange-950"
                />
              </div>
            </div>

            {/* Terms of Service checkbox */}
            <div className="flex items-start gap-3 py-1">
              <input
                id="tos"
                type="checkbox"
                checked={tosAgreed}
                onChange={(e) => setTosAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-orange-600 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="tos" className="text-sm text-orange-800 cursor-pointer leading-snug">
                I agree to the{" "}
                <a href="/legal/terms" target="_blank" className="text-orange-600 font-bold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" target="_blank" className="text-orange-600 font-bold hover:underline">
                  Privacy Policy
                </a>
                , and confirm I am at least <strong>18 years old</strong>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !tosAgreed}
              className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-orange-800">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/auth/login")}
                className="text-orange-600 font-bold hover:text-orange-700"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
