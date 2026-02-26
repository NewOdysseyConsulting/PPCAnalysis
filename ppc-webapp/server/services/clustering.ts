// ════════════════════════════════════════════════════════════════
// Semantic Keyword Clustering — Agglomerative clustering via embeddings
// ════════════════════════════════════════════════════════════════

import { getDb } from "./db.ts";
import pgvector from "pgvector/pg";
import {
  generateEmbeddings,
  storeKeywordEmbeddings,
} from "./embeddings.ts";

const MODEL = "gpt-4.1-mini";

// ── Types ──

export interface KeywordInput {
  keyword: string;
  volume?: number;
  cpc?: number;
  intent?: string;
}

export interface ClusterResult {
  name: string;
  keywords: string[];
  centroid: number[];
  metadata: {
    avgVolume: number;
    avgCpc: number;
    dominantIntent: string;
    keywordCount: number;
  };
}

// ── Public API ──

export async function clusterKeywords(params: {
  productId: string;
  keywords: KeywordInput[];
  distanceThreshold?: number;
}): Promise<ClusterResult[]> {
  const { productId, keywords, distanceThreshold = 0.35 } = params;

  if (keywords.length === 0) return [];
  if (keywords.length === 1) {
    return [{
      name: keywords[0].keyword,
      keywords: [keywords[0].keyword],
      centroid: [],
      metadata: {
        avgVolume: keywords[0].volume || 0,
        avgCpc: keywords[0].cpc || 0,
        dominantIntent: keywords[0].intent || "unknown",
        keywordCount: 1,
      },
    }];
  }

  // 1. Generate embeddings for all keywords
  const texts = keywords.map((k) => k.keyword);
  const embeddings = await generateEmbeddings(texts);

  // 2. Store keyword embeddings in DB
  const db = getDb();
  const keywordIds: number[] = [];
  for (let i = 0; i < keywords.length; i++) {
    const [row] = await db("keywords_index")
      .insert({
        product_id: productId,
        keyword: keywords[i].keyword,
        metadata: JSON.stringify({
          volume: keywords[i].volume,
          cpc: keywords[i].cpc,
          intent: keywords[i].intent,
        }),
      })
      .onConflict(["product_id", "keyword"])
      .merge(["metadata"])
      .returning("id");
    keywordIds.push(row.id);
  }

  await storeKeywordEmbeddings(
    keywordIds.map((id, i) => ({ keywordId: id, embedding: embeddings[i] }))
  );

  // 3. Agglomerative clustering
  const clusters = agglomerativeClustering(
    embeddings,
    texts,
    distanceThreshold
  );

  // 4. Generate cluster labels with AI
  const labelledClusters = await labelClusters(clusters, keywords);

  // 5. Store clusters in DB
  await db("keyword_clusters").where("product_id", productId).del();

  for (const cluster of labelledClusters) {
    await db("keyword_clusters").insert({
      product_id: productId,
      name: cluster.name,
      centroid: cluster.centroid.length > 0 ? pgvector.toSql(cluster.centroid) : null,
      keywords: JSON.stringify(cluster.keywords),
      metadata: JSON.stringify(cluster.metadata),
    });
  }

  return labelledClusters;
}

export async function getStoredClusters(productId: string): Promise<ClusterResult[]> {
  const db = getDb();
  const rows = await db("keyword_clusters")
    .where("product_id", productId)
    .orderBy("created_at");

  return rows.map((r: any) => ({
    name: r.name,
    keywords: r.keywords || [],
    centroid: r.centroid ? Array.from(r.centroid) : [],
    metadata: r.metadata || {},
  }));
}

// ── Internal: Agglomerative clustering ──

interface RawCluster {
  indices: number[];
  centroid: number[];
}

function agglomerativeClustering(
  embeddings: number[][],
  labels: string[],
  threshold: number
): { keywords: string[]; centroid: number[] }[] {
  const clusters: RawCluster[] = embeddings.map((emb, i) => ({
    indices: [i],
    centroid: [...emb],
  }));

  while (clusters.length > 1) {
    let minDist = Infinity;
    let minI = -1;
    let minJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dist = cosineDistance(clusters[i].centroid, clusters[j].centroid);
        if (dist < minDist) {
          minDist = dist;
          minI = i;
          minJ = j;
        }
      }
    }

    if (minDist > threshold) break;

    const merged: RawCluster = {
      indices: [...clusters[minI].indices, ...clusters[minJ].indices],
      centroid: averageVectors([clusters[minI].centroid, clusters[minJ].centroid]),
    };

    clusters.splice(minJ, 1);
    clusters.splice(minI, 1);
    clusters.push(merged);
  }

  return clusters.map((c) => ({
    keywords: c.indices.map((i) => labels[i]),
    centroid: c.centroid,
  }));
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - sim;
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const avg = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) avg[i] += v[i];
  }
  for (let i = 0; i < dim; i++) avg[i] /= vectors.length;
  return avg;
}

// ── Internal: Label clusters with AI ──

async function labelClusters(
  rawClusters: { keywords: string[]; centroid: number[] }[],
  keywordData: KeywordInput[]
): Promise<ClusterResult[]> {
  const keywordMap = new Map(keywordData.map((k) => [k.keyword, k]));

  const clusterDescriptions = rawClusters.map((c, i) => ({
    index: i,
    keywords: c.keywords.slice(0, 15).join(", "),
  }));

  let labels: string[] = rawClusters.map(
    (c) => c.keywords[0] || `Cluster ${rawClusters.indexOf(c) + 1}`
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && rawClusters.length > 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `Generate short 2-4 word labels for keyword clusters. Return a JSON object: { "labels": ["label1", "label2", ...] }. Each label should describe the shared semantic theme of its keywords.`,
            },
            {
              role: "user",
              content: clusterDescriptions
                .map((c) => `Cluster ${c.index + 1}: ${c.keywords}`)
                .join("\n"),
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as { labels: string[] };
          if (parsed.labels?.length === rawClusters.length) {
            labels = parsed.labels;
          }
        }
      }
    } catch {
      // Fall back to keyword-based labels
    }
  }

  return rawClusters.map((c, i) => {
    const kwData = c.keywords
      .map((kw) => keywordMap.get(kw))
      .filter(Boolean) as KeywordInput[];
    const volumes = kwData.map((k) => k.volume || 0);
    const cpcs = kwData.map((k) => k.cpc || 0);
    const intents = kwData.map((k) => k.intent || "unknown");

    const intentCounts = new Map<string, number>();
    for (const intent of intents) {
      intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
    }
    let dominantIntent = "unknown";
    let maxCount = 0;
    for (const [intent, count] of intentCounts) {
      if (count > maxCount) {
        dominantIntent = intent;
        maxCount = count;
      }
    }

    return {
      name: labels[i],
      keywords: c.keywords,
      centroid: c.centroid,
      metadata: {
        avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
        avgCpc: cpcs.length > 0 ? Number((cpcs.reduce((a, b) => a + b, 0) / cpcs.length).toFixed(2)) : 0,
        dominantIntent,
        keywordCount: c.keywords.length,
      },
    };
  });
}
