import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const messages = await Message.find({ conversationId: id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(messages);
}
