"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkle, User, SignOut } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Subscribe to auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchBalance(session.user.id);
      } else {
        setUser(null);
        setBalance(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      await fetchBalance(user.id);
    }
    setIsLoading(false);
  };

  const fetchBalance = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", userId)
      .single();

    if (data) {
      setBalance(data.account_balance);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between text-white">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600">
              <Sparkle weight="fill" className="text-xl" />
            </div>
            <span className="font-bold text-xl tracking-tight">PomPom</span>
          </a>

          {!isLoading && (
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-full">
                    <span className="text-orange-200">Balance:</span>
                    <span className="font-bold">${balance.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => router.push("/profile")}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-orange-200 transition-colors"
                  >
                    <User weight="bold" className="text-lg" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full font-medium text-sm transition-colors"
                  >
                    <SignOut weight="bold" className="text-lg" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-orange-200 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => router.push("/auth/signup")}
                    className="bg-white text-orange-600 px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-orange-900/20"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
