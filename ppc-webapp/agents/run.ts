#!/usr/bin/env tsx
// ════════════════════════════════════════════════════════════════
// CLI runner for the keyword research agent pipeline
// Usage: tsx agents/run.ts [--country GB] [--seeds "kw1,kw2"] [--competitors "d1,d2"]
// ════════════════════════════════════════════════════════════════

import "dotenv/config";
import { runPipeline } from "./pipeline.ts";
import type { PipelineConfig } from "./types.ts";

function parseArgs(): PipelineConfig {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  const seedKeywords = flags.seeds
    ? flags.seeds.split(",").map(s => s.trim())
    : [
        "accounts payable automation",
        "invoice processing software",
        "AP automation",
        "purchase order automation",
        "invoice matching software",
      ];

  const competitors = flags.competitors
    ? flags.competitors.split(",").map(s => s.trim())
    : ["bill.com", "tipalti.com", "stampli.com", "avidxchange.com"];

  const targetCountry = flags.country || "GB";

  const cpcMin = flags["cpc-min"] ? parseFloat(flags["cpc-min"]) : 3;
  const cpcMax = flags["cpc-max"] ? parseFloat(flags["cpc-max"]) : 8;

  const apiBaseUrl = flags.api || process.env.API_BASE_URL || "http://localhost:3001";

  const config: PipelineConfig = {
    seedKeywords,
    targetCountry,
    competitors,
    cpcRange: { min: cpcMin, max: cpcMax },
    apiBaseUrl,
  };

  if (flags.product) {
    config.product = {
      name: flags.product,
      description: flags["product-desc"] || "",
      target: flags["product-target"],
      integrations: flags["product-integrations"],
    };
  }

  return config;
}

async function main() {
  // Verify OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY environment variable is required.");
    console.error("Set it in your .env file or export it in your shell.");
    process.exit(1);
  }

  console.log("\n🔑 OpenAI API key: ...%s", process.env.OPENAI_API_KEY.slice(-6));

  const config = parseArgs();

  console.log("\nPipeline Configuration:");
  console.log(`  API Base URL: ${config.apiBaseUrl}`);
  console.log(`  Country:      ${config.targetCountry}`);
  console.log(`  Seeds:        ${config.seedKeywords.join(", ")}`);
  console.log(`  Competitors:  ${config.competitors.join(", ")}`);
  console.log(`  CPC Range:    £${config.cpcRange.min}-${config.cpcRange.max}`);
  if (config.product) {
    console.log(`  Product:      ${config.product.name}`);
  }

  // Verify the Express server is reachable
  try {
    const healthCheck = await fetch(`${config.apiBaseUrl}/api/keywords/status`);
    if (!healthCheck.ok) throw new Error(`status ${healthCheck.status}`);
    console.log("  Server:       ✓ reachable\n");
  } catch {
    console.error(`\nERROR: Cannot reach Express server at ${config.apiBaseUrl}`);
    console.error("Start it first: npm run server");
    process.exit(1);
  }

  const result = await runPipeline(config);

  // Write results to a JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = `pipeline-results-${timestamp}.json`;
  const fs = await import("node:fs/promises");
  await fs.writeFile(outFile, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to: ${outFile}`);
}

main().catch(err => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
