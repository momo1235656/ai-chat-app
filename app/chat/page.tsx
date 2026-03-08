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

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);

    const guestId = getOrCreateGuestId();

    // Create a new conversation with the first message as title
    const convRes = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, firstMessage: text }),
    });
    const conversation = await convRes.json();

    // Send the first message
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversation._id,
        guestId,
        message: text,
      }),
    });

    router.push(`/chat/${conversation._id}`);
  };

  return (
    <>
      <ChatWindow messages={[]} loading={loading} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={loading}
      />
    </>
  );
}
