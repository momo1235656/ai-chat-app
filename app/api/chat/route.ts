import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { getOpenAIClient, MODEL } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
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

    // Generate AI response via OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful general-purpose assistant." },
        ...messages,
      ],
    });

    const reply = completion.choices[0].message.content ?? "";

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
  } catch (error) {
    console.error("[POST /api/chat]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
