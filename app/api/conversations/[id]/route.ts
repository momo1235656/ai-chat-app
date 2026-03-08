import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET /api/conversations/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
