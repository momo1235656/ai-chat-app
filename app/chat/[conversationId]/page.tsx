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

  // Load conversation history on mount / conversation change
  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      setMessages(data);
    };
    fetchMessages();
  }, [conversationId]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    // Optimistically add user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const guestId = getOrCreateGuestId();

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        guestId,
        message: text,
      }),
    });

    const data = await res.json();

    // Add assistant reply
    setMessages((prev) => [
      ...prev,
      { _id: data.messageId, role: "assistant", content: data.reply },
    ]);
    setLoading(false);
  };

  return (
    <>
      <ChatWindow messages={messages} loading={loading} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={loading}
      />
    </>
  );
}
