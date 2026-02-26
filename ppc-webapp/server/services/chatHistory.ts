// ════════════════════════════════════════════════════════════════
// Chat History Service — Persistent storage + RAG retrieval
// ════════════════════════════════════════════════════════════════

import { getDb } from "./db.ts";
import {
  generateEmbedding,
  storeChatEmbedding,
  querySimilarMessages,
  querySimilarChunks,
} from "./embeddings.ts";

// ── Types ──

export interface ChatMessage {
  id: number;
  sessionId: string;
  productId: string | null;
  role: string;
  content: string;
  metadata: any;
  createdAt: string;
}

export interface RagContext {
  ragBlock: string;
  sources: { url: string; snippet: string }[];
}

// ── Store a message ──

export async function storeMessage(params: {
  sessionId: string;
  productId?: string;
  role: string;
  content: string;
  metadata?: any;
}): Promise<number> {
  const db = getDb();
  const [row] = await db("chat_messages")
    .insert({
      session_id: params.sessionId,
      product_id: params.productId || null,
      role: params.role,
      content: params.content,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    })
    .returning("id");
  return row.id;
}

/**
 * Store a message and generate + store its embedding.
 * Only embeds user and assistant messages (not system).
 */
export async function storeMessageWithEmbedding(params: {
  sessionId: string;
  productId?: string;
  role: string;
  content: string;
  metadata?: any;
}): Promise<number> {
  const messageId = await storeMessage(params);

  if (params.role === "user" || params.role === "assistant") {
    try {
      const embedding = await generateEmbedding(params.content);
      await storeChatEmbedding(messageId, embedding);
    } catch (err) {
      console.error("[ChatHistory] Failed to embed message:", err);
    }
  }

  return messageId;
}

// ── Retrieve history ──

export async function getHistory(params: {
  sessionId?: string;
  productId?: string;
  limit?: number;
}): Promise<ChatMessage[]> {
  const db = getDb();
  const { sessionId, productId, limit = 50 } = params;

  let query = db("chat_messages").select("*").orderBy("created_at", "desc").limit(limit);

  if (sessionId) {
    query = query.where("session_id", sessionId);
  }
  if (productId) {
    query = query.where(function () {
      this.where("product_id", productId).orWhereNull("product_id");
    });
  }

  const rows = await query;

  return rows.reverse().map((r: any) => ({
    id: r.id,
    sessionId: r.session_id,
    productId: r.product_id,
    role: r.role,
    content: r.content,
    metadata: r.metadata,
    createdAt: r.created_at,
  }));
}

// ── RAG: Get augmented context for a new message ──

export async function getAugmentedContext(params: {
  message: string;
  sessionId: string;
  productId?: string;
}): Promise<RagContext> {
  const empty: RagContext = { ragBlock: "", sources: [] };

  try {
    const queryEmbedding = await generateEmbedding(params.message);

    // 1. Retrieve similar past chat messages (from other sessions)
    const similarMessages = await querySimilarMessages(queryEmbedding, {
      sessionId: params.sessionId,
      productId: params.productId,
      limit: 5,
    });

    // 2. Retrieve similar knowledge base chunks
    const similarChunks = await querySimilarChunks(queryEmbedding, {
      limit: 5,
      minScore: 0.3,
    });

    const parts: string[] = [];
    const sources: { url: string; snippet: string }[] = [];

    if (similarMessages.length > 0) {
      const msgBlock = similarMessages
        .filter((m) => m.score >= 0.5)
        .slice(0, 3)
        .map(
          (m) =>
            `[${m.role}] ${m.content.slice(0, 300)}${m.content.length > 300 ? "..." : ""}`
        )
        .join("\n");

      if (msgBlock) {
        parts.push(`Relevant past conversations:\n${msgBlock}`);
      }
    }

    if (similarChunks.length > 0) {
      const chunkBlock = similarChunks
        .slice(0, 4)
        .map((c) => {
          sources.push({
            url: c.url || "",
            snippet: c.content.slice(0, 150),
          });
          return `[Source: ${c.url || "knowledge base"}]\n${c.content.slice(0, 500)}`;
        })
        .join("\n\n");

      if (chunkBlock) {
        parts.push(`Relevant knowledge base:\n${chunkBlock}`);
      }
    }

    const ragBlock = parts.length > 0
      ? `\n\n--- Retrieved Context ---\n${parts.join("\n\n")}\n--- End Retrieved Context ---`
      : "";

    return { ragBlock, sources };
  } catch (err) {
    console.error("[ChatHistory] RAG retrieval failed:", err);
    return empty;
  }
}
