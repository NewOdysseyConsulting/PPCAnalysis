// ════════════════════════════════════════════════════════════════
// Database Service — Knex + PostgreSQL + pgvector for vector search
// ════════════════════════════════════════════════════════════════

import Knex from "knex";
import pgvector from "pgvector/pg";

export type KnexInstance = ReturnType<typeof Knex.knex>;

let db: KnexInstance | null = null;
let initialized = false;

export function getDb(): KnexInstance {
  if (!db) {
    db = Knex.knex({
      client: "pg",
      connection: process.env.DATABASE_URL || {
        host: process.env.PGHOST || "localhost",
        port: parseInt(process.env.PGPORT || "5432", 10),
        database: process.env.PGDATABASE || "orion",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
      },
      pool: {
        min: 0,
        max: 10,
        afterCreate(conn: any, done: (err: Error | null, conn: any) => void) {
          pgvector.registerTypes(conn).then(() => done(null, conn)).catch((err) => done(err, conn));
        },
      },
    });
  }
  return db;
}

export async function initDb(): Promise<void> {
  if (initialized) return;

  const knex = getDb();

  await knex.raw(`CREATE EXTENSION IF NOT EXISTS vector`);
  await runMigrations(knex);
  initialized = true;
  console.log("[DB] PostgreSQL + pgvector initialized (Knex)");
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    initialized = false;
    console.log("[DB] Database pool closed");
  }
}

async function runMigrations(knex: KnexInstance): Promise<void> {
  // ── Table 1: Crawled pages ──
  if (!(await knex.schema.hasTable("crawled_pages"))) {
    await knex.schema.createTable("crawled_pages", (t) => {
      t.increments("id").primary();
      t.text("site_id").notNullable().index("idx_crawled_pages_site");
      t.text("url").notNullable().unique();
      t.text("title");
      t.text("meta_description");
      t.jsonb("headings");
      t.text("body_text");
      t.jsonb("links");
      t.integer("depth").defaultTo(0);
      t.text("status").defaultTo("pending").index("idx_crawled_pages_status");
      t.text("error");
      t.timestamp("crawled_at", { useTz: true });
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ── Table 2: Content chunks ──
  if (!(await knex.schema.hasTable("content_chunks"))) {
    await knex.schema.createTable("content_chunks", (t) => {
      t.increments("id").primary();
      t.integer("page_id").notNullable().references("id").inTable("crawled_pages").onDelete("CASCADE").index("idx_chunks_page");
      t.text("site_id").notNullable().index("idx_chunks_site");
      t.integer("chunk_index").notNullable();
      t.text("content").notNullable();
      t.integer("token_count");
      t.jsonb("metadata");
      t.specificType("embedding", "vector(1536)");
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ── Table 3: Chat messages ──
  if (!(await knex.schema.hasTable("chat_messages"))) {
    await knex.schema.createTable("chat_messages", (t) => {
      t.increments("id").primary();
      t.text("session_id").notNullable().index("idx_chat_session");
      t.text("product_id").index("idx_chat_product");
      t.text("role").notNullable();
      t.text("content").notNullable();
      t.jsonb("metadata");
      t.specificType("embedding", "vector(1536)");
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ── Table 4: Keyword clusters ──
  if (!(await knex.schema.hasTable("keyword_clusters"))) {
    await knex.schema.createTable("keyword_clusters", (t) => {
      t.increments("id").primary();
      t.text("product_id").notNullable().index("idx_clusters_product");
      t.text("name").notNullable();
      t.specificType("centroid", "vector(1536)");
      t.jsonb("keywords").notNullable();
      t.jsonb("metadata");
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
      t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ── Table 5: Keywords index ──
  if (!(await knex.schema.hasTable("keywords_index"))) {
    await knex.schema.createTable("keywords_index", (t) => {
      t.increments("id").primary();
      t.text("product_id").notNullable().index("idx_kw_product");
      t.text("keyword").notNullable();
      t.jsonb("metadata");
      t.specificType("embedding", "vector(1536)");
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
      t.unique(["product_id", "keyword"]);
    });
  }

  // ── Table 6: Crawl jobs ──
  if (!(await knex.schema.hasTable("crawl_jobs"))) {
    await knex.schema.createTable("crawl_jobs", (t) => {
      t.increments("id").primary();
      t.text("site_id").notNullable();
      t.text("seed_url").notNullable();
      t.integer("max_depth").defaultTo(2);
      t.integer("max_pages").defaultTo(50);
      t.text("status").defaultTo("queued");
      t.integer("pages_crawled").defaultTo(0);
      t.integer("pages_total").defaultTo(0);
      t.text("error");
      t.timestamp("started_at", { useTz: true });
      t.timestamp("completed_at", { useTz: true });
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ── HNSW indexes for fast vector similarity search ──
  const hnswIndexes = [
    { table: "content_chunks", column: "embedding", name: "idx_chunks_embedding" },
    { table: "chat_messages", column: "embedding", name: "idx_chat_embedding" },
    { table: "keywords_index", column: "embedding", name: "idx_kw_embedding" },
  ];

  for (const idx of hnswIndexes) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${idx.name}') THEN
          CREATE INDEX ${idx.name} ON ${idx.table}
            USING hnsw (${idx.column} vector_cosine_ops);
        END IF;
      END$$;
    `);
  }
}
