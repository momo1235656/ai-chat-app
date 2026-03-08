"use client";

import { useState, useEffect, use } from "react";
import { getOrCreateGuestId } from "@/lib/guestId";
import ChatWindow, { Message } from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchMessages();
  }, [conversationId]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const guestId = getOrCreateGuestId();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, guestId, message: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { _id: data.messageId, role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to get a response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ChatWindow messages={messages} loading={loading} />
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
