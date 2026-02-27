// ════════════════════════════════════════════════════════════════
// Embeddings Service — Generate, store, and query vector embeddings
// Uses OpenAI text-embedding-3-small (1536 dimensions) + pgvector
// ════════════════════════════════════════════════════════════════

import { getDb } from "./db.ts";
import pgvector from "pgvector/pg";

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;

// ── Types ──

export interface ChunkSearchResult {
  chunkId: number;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  url?: string;
  siteId?: string;
}

export interface ChatSearchResult {
  messageId: number;
  content: string;
  role: string;
  score: number;
  sessionId: string;
  productId?: string;
}

export interface KeywordSearchResult {
  keywordId: number;
  keyword: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface ChunkRow {
  chunk_id: number;
  content: string;
  score: string;
  metadata: Record<string, unknown> | null;
  url: string;
  site_id: string;
}

interface ChatMessageRow {
  message_id: number;
  content: string;
  role: string;
  score: string;
  session_id: string;
  product_id: string | undefined;
}

interface KeywordRow {
  keyword_id: number;
  keyword: string;
  score: string;
  metadata: Record<string, unknown> | null;
}

// ── Core: Generate embeddings via OpenAI ──

function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for embedding generation");
  }

  if (texts.length === 0) return [];

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI Embeddings API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      data?: { embedding: number[]; index: number }[];
    };

    if (!data.data) {
      throw new Error("Unexpected embeddings API response format");
    }

    const sorted = data.data.sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      allEmbeddings.push(item.embedding);
    }

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return allEmbeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

// ── Chunk embeddings ──

export async function storeChunkEmbeddings(
  chunks: { chunkId: number; embedding: number[] }[]
): Promise<void> {
  const db = getDb();
  for (const { chunkId, embedding } of chunks) {
    await db("content_chunks")
      .where("id", chunkId)
      .update({ embedding: pgvector.toSql(embedding) });
  }
}

export async function querySimilarChunks(
  queryEmbedding: number[],
  options: {
    siteId?: string;
    limit?: number;
    minScore?: number;
  } = {}
): Promise<ChunkSearchResult[]> {
  const db = getDb();
  const { siteId, limit = 5, minScore = 0.3 } = options;
  const embSql = pgvector.toSql(queryEmbedding);

  let query = db("content_chunks as cc")
    .join("crawled_pages as cp", "cp.id", "cc.page_id")
    .select(
      "cc.id as chunk_id",
      "cc.content",
      "cc.metadata",
      "cc.site_id",
      "cp.url",
      db.raw("1 - (cc.embedding <=> ?) as score", [embSql])
    )
    .whereNotNull("cc.embedding")
    .orderByRaw("cc.embedding <=> ?", [embSql])
    .limit(limit * 2);

  if (siteId) {
    query = query.where("cc.site_id", siteId);
  }

  const rows = await query;

  return (rows as ChunkRow[])
    .map((row) => ({
      chunkId: row.chunk_id,
      content: row.content,
      score: parseFloat(row.score),
      metadata: row.metadata || {},
      url: row.url,
      siteId: row.site_id,
    }))
    .filter((r) => r.score >= minScore)
    .slice(0, limit);
}

// ── Chat message embeddings ──

export async function storeChatEmbedding(
  messageId: number,
  embedding: number[]
): Promise<void> {
  const db = getDb();
  await db("chat_messages")
    .where("id", messageId)
    .update({ embedding: pgvector.toSql(embedding) });
}

export async function querySimilarMessages(
  queryEmbedding: number[],
  options: {
    sessionId?: string;
    productId?: string;
    limit?: number;
    excludeMessageIds?: number[];
  } = {}
): Promise<ChatSearchResult[]> {
  const db = getDb();
  const { limit = 10 } = options;
  const embSql = pgvector.toSql(queryEmbedding);

  let query = db("chat_messages")
    .select(
      "id as message_id",
      "session_id",
      "product_id",
      "role",
      "content",
      db.raw("1 - (embedding <=> ?) as score", [embSql])
    )
    .whereNotNull("embedding")
    .orderByRaw("embedding <=> ?", [embSql])
    .limit(limit);

  if (options.sessionId) {
    query = query.whereNot("session_id", options.sessionId);
  }
  if (options.productId) {
    query = query.where(function () {
      this.where("product_id", options.productId!).orWhereNull("product_id");
    });
  }
  if (options.excludeMessageIds && options.excludeMessageIds.length > 0) {
    query = query.whereNotIn("id", options.excludeMessageIds);
  }

  const rows = await query;

  return (rows as ChatMessageRow[]).map((r) => ({
    messageId: r.message_id,
    content: r.content,
    role: r.role,
    score: parseFloat(r.score),
    sessionId: r.session_id,
    productId: r.product_id,
  }));
}

// ── Keyword embeddings ──

export async function storeKeywordEmbeddings(
  items: { keywordId: number; embedding: number[] }[]
): Promise<void> {
  const db = getDb();
  for (const { keywordId, embedding } of items) {
    await db("keywords_index")
      .where("id", keywordId)
      .update({ embedding: pgvector.toSql(embedding) });
  }
}

export async function querySimilarKeywords(
  queryEmbedding: number[],
  options: {
    productId?: string;
    limit?: number;
  } = {}
): Promise<KeywordSearchResult[]> {
  const db = getDb();
  const { productId, limit = 20 } = options;
  const embSql = pgvector.toSql(queryEmbedding);

  let query = db("keywords_index")
    .select(
      "id as keyword_id",
      "keyword",
      "metadata",
      db.raw("1 - (embedding <=> ?) as score", [embSql])
    )
    .whereNotNull("embedding")
    .orderByRaw("embedding <=> ?", [embSql])
    .limit(limit);

  if (productId) {
    query = query.where("product_id", productId);
  }

  const rows = await query;

  return (rows as KeywordRow[]).map((r) => ({
    keywordId: r.keyword_id,
    keyword: r.keyword,
    score: parseFloat(r.score),
    metadata: r.metadata || {},
  }));
}

// ── Utility: Approximate token count ──

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Text chunking ──

export function chunkText(
  text: string,
  options: { maxTokens?: number; overlap?: number } = {}
): string[] {
  const { maxTokens = 400, overlap = 50 } = options;
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars) {
      if (current) {
        chunks.push(current.trim());
        const overlapText = current.slice(-overlapChars);
        current = overlapText + " " + para;
      } else {
        const sentences = para.match(/[^.!?]+[.!?]+\s*/g) || [para];
        for (const sentence of sentences) {
          if (current.length + sentence.length > maxChars) {
            if (current) {
              chunks.push(current.trim());
              const ov = current.slice(-overlapChars);
              current = ov + " " + sentence;
            } else {
              chunks.push(sentence.slice(0, maxChars).trim());
              current = sentence.slice(maxChars - overlapChars);
            }
          } else {
            current += sentence;
          }
        }
      }
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
