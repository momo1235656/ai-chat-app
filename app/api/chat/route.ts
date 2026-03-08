import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { chatAgent } from "@/lib/mastra";

export async function POST(request: NextRequest) {
  await connectDB();
  const { conversationId, guestId, message } = await request.json();

  if (!conversationId || !guestId || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Save user message
  await Message.create({ conversationId, role: "user", content: message });

  // Fetch full conversation history for context
  const history = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();

  const messages = history.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  // Generate AI response via Mastra
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await chatAgent.generate(messages as any);
  const reply = response.text;

  // Save assistant reply
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: reply,
  });

  // Update conversation title (if still default) and updatedAt
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    if (conversation.title === "New Conversation") {
      conversation.title = (message as string).slice(0, 50);
    }
    conversation.updatedAt = new Date();
    await conversation.save();
  }

  return NextResponse.json({
    reply,
    messageId: assistantMessage._id.toString(),
  });
}
