"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkle, User, SignOut, List, X } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { onBalanceUpdate } from "@/lib/events/balance";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();

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

    const unsubscribeBalance = onBalanceUpdate(({ newBalance }) => {
      setBalance(newBalance);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeBalance();
    };
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await fetchBalance(user.id);
    } else {
      setUser(null);
      setBalance(0);
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
    if (data) setBalance(data.account_balance);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3 backdrop-blur-md bg-white/90 border-b border-orange-100">
      <div className="max-w-6xl mx-auto">
        <div className="px-6 py-3 flex items-center justify-between text-orange-950">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white">
              <Sparkle weight="fill" className="text-xl" />
            </div>
            <span className="font-bold text-xl tracking-tight">MuMu</span>
          </a>

          {!isLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Balance + Deposit — always visible */}
                  <div className="flex items-center bg-orange-100 rounded-full overflow-hidden">
                    <span className="pl-3 pr-2 text-sm font-bold text-orange-950">${balance.toFixed(2)}</span>
                    <button
                      onClick={() => router.push("/topup")}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 m-0.5 rounded-full font-bold text-xs transition-colors hidden sm:block"
                    >
                      Deposit
                    </button>
                  </div>

                  {/* Desktop: Profile + Sign Out */}
                  <button
                    onClick={() => router.push("/profile")}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-orange-800 hover:text-orange-600 transition-colors"
                  >
                    <User weight="bold" className="text-base" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full font-medium text-xs text-orange-800 transition-colors"
                  >
                    <SignOut weight="bold" className="text-base" />
                    Sign Out
                  </button>

                  {/* Mobile: Hamburger */}
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="sm:hidden p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                  >
                    {menuOpen ? <X weight="bold" className="text-xl text-orange-950" /> : <List weight="bold" className="text-xl text-orange-950" />}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="text-sm font-medium text-orange-800 hover:text-orange-600 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => router.push("/auth/signup")}
                    className="bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-orange-200"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && user && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-lg py-2 px-6">
            <button
              onClick={() => { router.push("/profile"); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-3 text-orange-950 font-semibold border-b border-orange-50"
            >
              <User weight="bold" className="text-lg text-orange-600" />
              View Profile
            </button>
            <button
              onClick={() => { router.push("/topup"); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-3 text-orange-950 font-semibold border-b border-orange-50"
            >
              <Sparkle weight="fill" className="text-lg text-orange-600" />
              Deposit
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 py-3 text-orange-800 font-semibold"
            >
              <SignOut weight="bold" className="text-lg text-orange-400" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
