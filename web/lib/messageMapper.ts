import type { UIMessage, MessagePart, MessageMetadata } from "@/types/chat";

/**
 * Raw message format from Convex queries (api.messages.getByConversation).
 * This matches the return type of the getByConversation query.
 */
export interface ConvexMessage {
  id: string;
  role: string;
  parts: MessagePart[];
  model?: string;
  createdAt?: number;
  metadata?: MessageMetadata;
}

/**
 * Convert a single Convex message to UIMessage format.
 * Handles type conversions:
 * - role: string -> "user" | "assistant" | "system"
 * - createdAt: number (timestamp) -> Date
 */
export function toUIMessage(message: ConvexMessage): UIMessage {
  return {
    id: message.id,
    role: message.role as UIMessage["role"],
    parts: message.parts,
    model: message.model,
    createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
    metadata: message.metadata,
  };
}

/**
 * Convert an array of Convex messages to UIMessage format.
 */
export function toUIMessages(messages: ConvexMessage[]): UIMessage[] {
  return messages.map(toUIMessage);
}
