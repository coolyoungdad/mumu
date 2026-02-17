"use client";

import { useState, useEffect, useRef } from "react";
import { PaperPlaneRight, Sparkle } from "@phosphor-icons/react/dist/ssr";

interface ChatMessage {
  id: string;
  type: "user" | "pull";
  username: string;
  message: string;
  timestamp: Date;
  rarity?: "rare" | "ultra";
  itemName?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        // Regular user message
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          type: "user",
          username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
          message: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)],
          timestamp: new Date(),
        }]);
      }

      // Keep only last 50 messages
      setMessages(prev => prev.slice(-50));
    }, 5000); // New message every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      username: "You",
      message: inputValue,
      timestamp: new Date(),
    }]);

    setInputValue("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="glass-card-white rounded-2xl p-6 h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-orange-950 mb-1">Live Chat</h2>
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-semibold">{MOCK_USERNAMES.length} online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-in">
            {msg.type === "pull" ? (
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
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${
                    msg.username === "You" ? "text-orange-600" : "text-orange-950"
                  }`}>
                    {msg.username}
                  </span>
                  <span className="text-xs text-orange-400">
                    {formatTime(msg.timestamp)}
                  </span>
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
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none bg-white text-orange-950 placeholder-orange-300"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-orange-600 text-white p-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          <PaperPlaneRight weight="fill" className="text-xl" />
        </button>
      </form>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(251, 146, 60, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.5);
        }
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
