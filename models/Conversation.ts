import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  guestId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    guestId: { type: String, required: true, index: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
