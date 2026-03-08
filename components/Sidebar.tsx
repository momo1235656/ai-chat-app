"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getOrCreateGuestId } from "@/lib/guestId";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const fetchConversations = async () => {
    const guestId = getOrCreateGuestId();
    if (!guestId) return;
    try {
      const res = await fetch(`/api/conversations?guestId=${guestId}`);
      const data = await res.json();
      setConversations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [pathname]);

  const handleNewChat = async () => {
    const guestId = getOrCreateGuestId();
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId }),
    });
    const conversation = await res.json();
    router.push(`/chat/${conversation._id}`);
  };

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-700 bg-zinc-900">
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading && (
          <p className="px-3 py-2 text-xs text-zinc-500">Loading...</p>
        )}
        {!loading && conversations.length === 0 && (
          <p className="px-3 py-2 text-xs text-zinc-500">No conversations yet.</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv._id}
            onClick={() => router.push(`/chat/${conv._id}`)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeId === conv._id
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <span className="block truncate">{conv.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
