import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const guestId = request.nextUrl.searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json({ error: "guestId required" }, { status: 400 });
    }

    const conversations = await Conversation.find({ guestId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[GET /api/conversations]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { guestId, firstMessage } = await request.json();

    if (!guestId) {
      return NextResponse.json({ error: "guestId required" }, { status: 400 });
    }

    const title = firstMessage
      ? (firstMessage as string).slice(0, 50)
      : "New Conversation";

    const conversation = await Conversation.create({ guestId, title });
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/conversations]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
