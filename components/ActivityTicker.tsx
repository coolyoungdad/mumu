import Image from "next/image";

// Rare and Ultra items from our actual inventory
const activities = [
  {
    name: "Felix",
    action: "unboxed",
    item: "The Warmth Skullpanda",
    seed: "Felix",
    bgColor: "bg-purple-200",
  },
  {
    name: "Ana",
    action: "sold back",
    item: "The Joy Skullpanda",
    value: "+$65",
    seed: "Ana",
    bgColor: "bg-blue-200",
  },
  {
    name: "Kai",
    action: "unboxed",
    item: "The Other One Hirono",
    seed: "Kai",
    bgColor: "bg-purple-300",
  },
  {
    name: "Zoe",
    action: "sold back",
    item: "The Grief Skullpanda",
    value: "+$72",
    seed: "Zoe",
    bgColor: "bg-blue-300",
  },
  {
    name: "Max",
    action: "unboxed",
    item: "The Awakening Skullpanda",
    seed: "Max",
    bgColor: "bg-indigo-200",
  },
  {
    name: "Luna",
    action: "sold back",
    item: "The Riddle Skullpanda",
    value: "+$58",
    seed: "Luna",
    bgColor: "bg-blue-200",
  },
  {
    name: "Riley",
    action: "unboxed",
    item: "The Obsession Skullpanda",
    seed: "Riley",
    bgColor: "bg-indigo-300",
  },
];

export default function ActivityTicker() {
  return (
    <div className="w-full bg-orange-950/10 backdrop-blur-sm border-y border-white/10 py-4 overflow-hidden relative z-20">
      <div className="flex whitespace-nowrap ticker-track">
        {/* Duplicate the content twice for seamless loop */}
        {[...Array(2)].map((_, setIndex) => (
          <div key={setIndex} className="flex items-center gap-12 px-6">
            {activities.map((activity, index) => (
              <div key={`${setIndex}-${index}`} className="flex items-center gap-3">
                <Image
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.seed}`}
                  alt={activity.name}
                  width={32}
                  height={32}
                  className={`w-8 h-8 rounded-full ${activity.bgColor}`}
                />
                <span className="text-white font-medium">
                  <span className="opacity-70">{activity.name} {activity.action}</span>{" "}
                  <span className="font-bold">{activity.item}</span>
                  {activity.value && (
                    <span className="text-yellow-300"> {activity.value}</span>
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
