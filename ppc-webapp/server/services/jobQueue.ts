// ════════════════════════════════════════════════════════════════
// Job Queue — pg-boss backed by PostgreSQL
// ════════════════════════════════════════════════════════════════

import { PgBoss } from "pg-boss";

let boss: PgBoss | null = null;

function getConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.PGHOST || "localhost";
  const port = process.env.PGPORT || "5432";
  const database = process.env.PGDATABASE || "orion";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || "postgres";
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

export function getJobQueue(): PgBoss {
  if (!boss) throw new Error("Job queue not started — call startJobQueue() first");
  return boss;
}

export async function startJobQueue(): Promise<PgBoss> {
  boss = new PgBoss(getConnectionString());

  boss.on("error", (err: Error) => {
    console.error("[JobQueue] Error:", err);
  });

  await boss.start();
  console.log("[JobQueue] pg-boss started");

  // Register workers
  const { registerPipelineWorker } = await import("./pipeline.ts");
  await registerPipelineWorker(boss);

  return boss;
}

export async function stopJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true });
    boss = null;
    console.log("[JobQueue] pg-boss stopped");
  }
}
