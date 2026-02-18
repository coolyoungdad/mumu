"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  name: string;
  action: string;
  item: string;
  value?: string;
  seed: string;
  bgColor: string;
}

// Shown instantly while real data loads — avoids blank ticker
const FALLBACK: Activity[] = [
  { id: "f1", name: "A***", action: "just unboxed", item: "The Warmth Skullpanda", seed: "f1", bgColor: "bg-purple-200" },
  { id: "f2", name: "K***", action: "just unboxed", item: "The Other One Hirono",  seed: "f2", bgColor: "bg-indigo-200" },
  { id: "f3", name: "M***", action: "sold back",    item: "The Joy Skullpanda", value: "+$38", seed: "f3", bgColor: "bg-blue-200" },
  { id: "f4", name: "Z***", action: "just unboxed", item: "Strawberry Macaron Labubu", seed: "f4", bgColor: "bg-pink-200" },
  { id: "f5", name: "R***", action: "sold back",    item: "Space Molly", value: "+$22", seed: "f5", bgColor: "bg-teal-200" },
  { id: "f6", name: "L***", action: "just unboxed", item: "The Awakening Skullpanda", seed: "f6", bgColor: "bg-purple-300" },
  { id: "f7", name: "J***", action: "just unboxed", item: "Sky Angel Cinnamoroll", seed: "f7", bgColor: "bg-blue-300" },
];

export default function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => {
        if (data.activities?.length) setActivities(data.activities);
      })
      .catch(() => {/* keep fallback on network error */});
  }, []);

  return (
    <div className="w-full bg-orange-50 border-y border-orange-200 py-4 overflow-hidden relative z-20">
      <div className="flex whitespace-nowrap ticker-track">
        {/* Duplicate content twice for seamless CSS loop */}
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex items-center gap-12 px-6">
            {activities.map((activity, index) => (
              <div key={`${setIndex}-${activity.id}-${index}`} className="flex items-center gap-3">
                <Image
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.seed}`}
                  alt={activity.name}
                  width={32}
                  height={32}
                  className={`w-8 h-8 rounded-full ${activity.bgColor}`}
                />
                <span className="text-orange-950 font-medium">
                  <span className="text-orange-600">{activity.name} {activity.action}</span>{" "}
                  <span className="font-bold">{activity.item}</span>
                  {activity.value && (
                    <span className="text-orange-500 font-bold"> {activity.value}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
