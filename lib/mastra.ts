import { Agent } from "@mastra/core/agent";

export const chatAgent = new Agent({
  id: "chat-agent",
  name: "chat-agent",
  instructions: "You are a helpful general-purpose assistant.",
  model: "anthropic/claude-sonnet-4-6",
});
