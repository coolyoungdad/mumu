"use client";

import { useState, useEffect, useRef } from "react";
import {
  PaperPlaneRight,
  Sparkle,
  Warning,
  DotsThreeVertical,
  Flag,
  Trash,
  ProhibitInset,
  SpeakerSimpleSlash,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  user_id?: string;
  type: "user" | "pull";
  username: string;
  message: string;
  timestamp: Date;
  rarity?: "rare" | "ultra";
  itemName?: string;
  is_deleted?: boolean;
}

const MOCK_USERNAMES = [
  "SanrioFan23", "PopMartCollector", "LuckyBox88", "LabubuLover",
  "MollyMania", "SkullpandaKing", "HelloKittyQueen", "DimooDealer",
  "PuckyPro", "BoxHunter99", "RareFinder", "CinnamonDreams",
  "MysteryMaster", "CollectAll", "UnboxKing", "LootLegend"
];

const MOCK_MESSAGES = [
  "Just opened my first box! 🎉",
  "Anyone else hunting for Skullpanda?",
  "This is so addicting lol",
  "Come on give me a rare!!",
  "LFG!!! 🔥",
  "The suspense is killing me",
  "One more box... just one more 😅",
  "My collection is growing!",
  "Who else is here at 2am? 😴",
  "Best mystery box site ever!",
  "That animation is so satisfying",
  "Saving up for another round",
  "The odds are in my favor today 🍀",
  "Commons for days... 😭",
  "Worth it every time!",
];

const RARE_ITEMS = [
  "The Awakening Skullpanda",
  "The Grief Skullpanda",
  "The Joy Skullpanda",
  "The Obsession Skullpanda",
  "The Riddle Skullpanda"
];

const ULTRA_ITEMS = [
  "The Other One Hirono",
  "The Warmth Skullpanda"
];

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recentMsgIndices = useRef<number[]>([]);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is admin
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role === "admin") {
      setIsAdmin(true);
    }
  };

  // Initialize with some messages
  useEffect(() => {
    const initialMessages: ChatMessage[] = [];
    for (let i = 0; i < 5; i++) {
      initialMessages.push({
        id: `init-${i}`,
        type: "user",
        username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
        message: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)],
        timestamp: new Date(Date.now() - (5 - i) * 60000),
      });
    }
    setMessages(initialMessages);
  }, []);

  // Simulate live messages and pulls
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();

      // 15% chance of rare/ultra pull announcement
      if (rand < 0.15) {
        const isUltra = rand < 0.03; // 3% ultra, 12% rare
        const items = isUltra ? ULTRA_ITEMS : RARE_ITEMS;
        const item = items[Math.floor(Math.random() * items.length)];

        setMessages(prev => [...prev, {
          id: `pull-${Date.now()}`,
          type: "pull",
          username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
          message: `pulled ${item}!`,
          timestamp: new Date(),
          rarity: isUltra ? "ultra" : "rare",
          itemName: item,
        }]);
      } else {
        // Regular user message — avoid repeating recently used messages
        let msgIdx: number;
        do {
          msgIdx = Math.floor(Math.random() * MOCK_MESSAGES.length);
        } while (recentMsgIndices.current.includes(msgIdx));
        recentMsgIndices.current = [...recentMsgIndices.current.slice(-3), msgIdx];

        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          type: "user",
          username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
          message: MOCK_MESSAGES[msgIdx],
          timestamp: new Date(),
        }]);
      }

      // Keep only last 50 messages
      setMessages(prev => prev.slice(-50));
    }, 5000); // New message every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending || cooldownRemaining > 0) return;

    const messageText = inputValue;
    const optimisticId = `optimistic-${Date.now()}`;

    // Show message immediately before waiting for API
    setMessages(prev => [...prev, {
      id: optimisticId,
      type: "user",
      username: "You",
      message: messageText,
      timestamp: new Date(),
    }]);
    setInputValue("");
    setCooldownRemaining(3);
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          type: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setCooldownRemaining(data.cooldownRemaining);
        }
        throw new Error(data.error || "Failed to send message");
      }

      // Replace optimistic message with confirmed one from server
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticId
          ? { ...msg, id: data.message.id, user_id: data.message.user_id, timestamp: new Date(data.message.created_at) }
          : msg
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleReport = async (messageId: string) => {
    try {
      const response = await fetch("/api/chat/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to report message");
      }

      alert("Message reported successfully");
      setActiveMenu(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to report message");
    }
  };

  const handleModerate = async (action: string, targetUserId: string, messageId?: string) => {
    try {
      const response = await fetch("/api/chat/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          targetUserId,
          messageId,
          muteDuration: action === "mute_user" ? 3600 : undefined, // 1 hour mute
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to perform action");
      }

      // If message deleted, remove from UI
      if (action === "delete_message" && messageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, is_deleted: true } : msg
          )
        );
      }

      alert(data.message);
      setActiveMenu(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to perform action");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600">
          <Warning weight="fill" className="text-xl flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 mb-4 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-in">
            {msg.is_deleted ? (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-gray-500 italic text-sm">
                [Message deleted by moderator]
              </div>
            ) : msg.type === "pull" ? (
              // Special pull announcement
              <div className={`p-4 rounded-xl border-2 ${
                msg.rarity === "ultra"
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300"
                  : "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkle weight="fill" className={`text-xl ${
                    msg.rarity === "ultra" ? "text-purple-600" : "text-blue-600"
                  }`} />
                  <span className={`font-bold ${
                    msg.rarity === "ultra" ? "text-purple-900" : "text-blue-900"
                  }`}>
                    {msg.username}
                  </span>
                  <span className={`text-sm ${
                    msg.rarity === "ultra" ? "text-purple-700" : "text-blue-700"
                  }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className={`font-semibold ${
                  msg.rarity === "ultra" ? "text-purple-800" : "text-blue-800"
                }`}>
                  {msg.rarity === "ultra" ? "🎊 ULTRA RARE! 🎊" : "⭐ RARE PULL! ⭐"}
                </div>
                <div className="text-orange-950 font-bold mt-1">
                  {msg.itemName}
                </div>
              </div>
            ) : (
              // Regular user message
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 relative group">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${
                    msg.username === "You" ? "text-orange-600" : "text-orange-950"
                  }`}>
                    {msg.username}
                  </span>
                  <span className="text-xs text-orange-400">
                    {formatTime(msg.timestamp)}
                  </span>

                  {/* Message Menu */}
                  {msg.username !== "You" && (
                    <div className="ml-auto relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === msg.id ? null : msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-orange-200 rounded"
                      >
                        <DotsThreeVertical weight="bold" className="text-orange-600" />
                      </button>

                      {activeMenu === msg.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border-2 border-orange-200 py-1 z-10 min-w-[150px]">
                          <button
                            onClick={() => handleReport(msg.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-950"
                          >
                            <Flag weight="bold" className="text-orange-600" />
                            Report
                          </button>

                          {isAdmin && msg.user_id && (
                            <>
                              <div className="border-t border-orange-100 my-1"></div>
                              <div className="px-2 py-1 text-xs text-orange-400 font-semibold">
                                Admin Actions
                              </div>
                              <button
                                onClick={() => handleModerate("delete_message", msg.user_id!, msg.id)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                              >
                                <Trash weight="bold" />
                                Delete Message
                              </button>
                              <button
                                onClick={() => handleModerate("mute_user", msg.user_id!)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center gap-2 text-yellow-600"
                              >
                                <SpeakerSimpleSlash weight="bold" />
                                Mute User (1h)
                              </button>
                              <button
                                onClick={() => handleModerate("ban_user", msg.user_id!)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                              >
                                <ProhibitInset weight="bold" />
                                Ban User
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-orange-800">
                  {msg.message}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              cooldownRemaining > 0
                ? `Wait ${cooldownRemaining}s...`
                : "Type a message..."
            }
            disabled={cooldownRemaining > 0 || isSending}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none bg-white text-orange-950 placeholder-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={200}
          />
          {cooldownRemaining > 0 && (
            <div className="text-xs text-orange-500 mt-1">
              Cooldown: {cooldownRemaining}s remaining
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending || cooldownRemaining > 0}
          className="bg-orange-600 text-white p-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          <PaperPlaneRight weight="fill" className="text-xl" />
        </button>
      </form>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
