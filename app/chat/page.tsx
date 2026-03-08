"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateGuestId } from "@/lib/guestId";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";

export default function ChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);

    try {
      const guestId = getOrCreateGuestId();

      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, firstMessage: text }),
      });
      if (!convRes.ok) throw new Error(`HTTP ${convRes.status}`);
      const conversation = await convRes.json();

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation._id,
          guestId,
          message: text,
        }),
      });
      if (!chatRes.ok) throw new Error(`HTTP ${chatRes.status}`);

      router.push(`/chat/${conversation._id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError("Failed to start conversation. Please check your server configuration.");
      setLoading(false);
    }
  };

  return (
    <>
      <ChatWindow messages={[]} loading={loading} />
      {error && (
        <p className="px-4 py-2 text-center text-xs text-red-400">{error}</p>
      )}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={loading}
      />
    </>
  );
}
