// ════════════════════════════════════════════════════════════════
// AI Assistant Service — Chat, Ad Copy, Content Briefs, Campaign Suggestions
// Uses OpenAI Chat Completions API (gpt-4.1-mini)
// ════════════════════════════════════════════════════════════════

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4.1-mini";

// ── Types ──

export interface ChatHistory {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatContext {
  product?: { name: string; description: string; acv: string; target: string };
  keywordsSummary?: { count: number; avgCpc: number; topKeywords: string[] };
  campaignsSummary?: { count: number; totalKeywords: number };
  market?: { code: string; name: string; currency: string };
  budgetMonthly?: number;
}

export interface ChatResponse {
  message: string;
  suggestedAction?: {
    type: "switch-panel" | "add-keywords" | "create-campaign" | "update-budget";
    panel?: string;
    payload?: any;
  };
}

export interface ProductContext {
  name: string;
  description: string;
  acv: string;
  target: string;
}

export interface ContentBrief {
  title: string;
  metaDescription: string;
  outline: string[];
  targetLength: number;
  keyPoints: string[];
  targetKeyword: string;
}

export interface CampaignSuggestion {
  campaignName: string;
  adGroups: {
    name: string;
    keywords: string[];
    suggestedHeadlines: string[];
    suggestedDescriptions: string[];
  }[];
}

// ── Internal helpers ──

const CHAT_SYSTEM_PROMPT = `You are Orion, an AI marketing strategist specializing in PPC and SEO for B2B SaaS companies. You help plan competitive search campaigns, analyze keywords, write ad copy, and optimize budgets. Be concise, data-driven, and actionable. Use markdown formatting.`;

function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function buildContextBlock(context: ChatContext): string {
  const parts: string[] = [];

  if (context.product) {
    parts.push(`**Product:** ${context.product.name} — ${context.product.description}`);
    parts.push(`**ACV:** ${context.product.acv} | **Target:** ${context.product.target}`);
  }

  if (context.keywordsSummary) {
    const ks = context.keywordsSummary;
    parts.push(`**Keywords:** ${ks.count} tracked | Avg CPC: $${ks.avgCpc.toFixed(2)} | Top: ${ks.topKeywords.slice(0, 5).join(", ")}`);
  }

  if (context.campaignsSummary) {
    parts.push(`**Campaigns:** ${context.campaignsSummary.count} campaigns with ${context.campaignsSummary.totalKeywords} total keywords`);
  }

  if (context.market) {
    parts.push(`**Market:** ${context.market.name} (${context.market.code}) — Currency: ${context.market.currency}`);
  }

  if (context.budgetMonthly != null) {
    parts.push(`**Monthly Budget:** $${context.budgetMonthly.toLocaleString()}`);
  }

  return parts.length > 0
    ? `\n\nHere is the user's current workspace context:\n${parts.join("\n")}`
    : "";
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenAI(messages: OpenAIMessage[], options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return "[Orion AI] No OpenAI API key configured. Set the OPENAI_API_KEY environment variable to enable AI-powered responses. For now, I can still help you navigate the platform — try asking about keywords, campaigns, or ad copy.";
  }

  const { temperature = 0.7, maxTokens = 1500 } = options;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenAIJson<T>(messages: OpenAIMessage[], options: { temperature?: number; maxTokens?: number } = {}): Promise<T | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  const { temperature = 0.5, maxTokens = 2000 } = options;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

// ── Public functions ──

/**
 * Chat with the AI assistant. Builds context-aware system prompt and returns
 * a response with optional suggested UI action.
 */
export async function chatWithAssistant(
  message: string,
  history: ChatHistory[] = [],
  context: ChatContext = {}
): Promise<ChatResponse> {
  try {
    const contextBlock = buildContextBlock(context);
    const systemPrompt = CHAT_SYSTEM_PROMPT + contextBlock;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const responseText = await callOpenAI(messages, { temperature: 0.7, maxTokens: 1500 });

    // Attempt to detect if the response implies a suggested action
    const suggestedAction = detectSuggestedAction(message, responseText);

    return {
      message: responseText,
      ...(suggestedAction ? { suggestedAction } : {}),
    };
  } catch (err) {
    console.error("[AI Service] chatWithAssistant error:", err);
    return {
      message: "I encountered an error processing your request. Please try again or check the server logs for details.",
    };
  }
}

/**
 * Heuristic to detect if the assistant's response implies a UI action.
 */
function detectSuggestedAction(
  userMessage: string,
  _responseText: string
): ChatResponse["suggestedAction"] | undefined {
  const lower = userMessage.toLowerCase();

  if (lower.includes("show me") && lower.includes("keyword")) {
    return { type: "switch-panel", panel: "table" };
  }
  if (lower.includes("show me") && lower.includes("competitor")) {
    return { type: "switch-panel", panel: "competitor" };
  }
  if (lower.includes("show me") && lower.includes("seo")) {
    return { type: "switch-panel", panel: "seo" };
  }
  if (lower.includes("show me") && lower.includes("campaign")) {
    return { type: "switch-panel", panel: "campaign" };
  }
  if (lower.includes("show me") && lower.includes("budget")) {
    return { type: "switch-panel", panel: "budget" };
  }
  if (lower.includes("add keyword") || lower.includes("add these keyword")) {
    return { type: "add-keywords" };
  }
  if (lower.includes("create campaign") || lower.includes("build campaign")) {
    return { type: "create-campaign" };
  }
  if (lower.includes("update budget") || lower.includes("change budget") || lower.includes("set budget")) {
    return { type: "update-budget" };
  }

  return undefined;
}

/**
 * Generate Google Ads headlines (<=30 chars) and descriptions (<=90 chars).
 */
export async function generateAdCopy(params: {
  keywords: string[];
  product: ProductContext;
  tone?: string;
  count?: number;
}): Promise<{ headlines: string[]; descriptions: string[] }> {
  const { keywords, product, tone = "professional", count = 10 } = params;

  const fallback = {
    headlines: [
      `${product.name} — Try Free`,
      "Boost Your ROI Today",
      "PPC Made Simple",
      `${product.name} for Teams`,
      "Start Your Free Trial",
    ].slice(0, count),
    descriptions: [
      `${product.name} helps ${product.target} achieve better results. ${product.description.slice(0, 40)}`,
      `Try ${product.name} free. Built for ${product.target}. Start optimizing today.`,
      "Data-driven PPC optimization. Save time. Increase conversions. Try it now.",
    ].slice(0, Math.ceil(count / 3)),
  };

  try {
    const systemPrompt = `You are a Google Ads copywriter. Generate ad copy for the given product and keywords.

STRICT RULES:
- Headlines MUST be 30 characters or fewer (including spaces). This is non-negotiable.
- Descriptions MUST be 90 characters or fewer (including spaces). This is non-negotiable.
- Count characters carefully before including any headline or description.
- Tone: ${tone}
- Include the main keyword or a close variant where natural.
- Focus on benefits, urgency, and clear CTAs.
- Follow Google Ads editorial policies.

Return a JSON object with this exact structure:
{
  "headlines": ["headline1", "headline2", ...],
  "descriptions": ["desc1", "desc2", ...]
}

Generate ${count} headlines and ${Math.ceil(count / 3)} descriptions.`;

    const userContent = `Product: ${product.name}
Description: ${product.description}
ACV: ${product.acv}
Target audience: ${product.target}
Keywords: ${keywords.join(", ")}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<{ headlines: string[]; descriptions: string[] }>(messages, {
      temperature: 0.8,
      maxTokens: 1500,
    });

    if (!result) return fallback;

    // Enforce character limits as a safety net
    const headlines = (result.headlines || []).filter((h) => h.length <= 30);
    const descriptions = (result.descriptions || []).filter((d) => d.length <= 90);

    return {
      headlines: headlines.length > 0 ? headlines : fallback.headlines,
      descriptions: descriptions.length > 0 ? descriptions : fallback.descriptions,
    };
  } catch (err) {
    console.error("[AI Service] generateAdCopy error:", err);
    return fallback;
  }
}

/**
 * Generate an SEO content brief for a target keyword.
 */
export async function generateContentBrief(params: {
  keyword: string;
  product: ProductContext;
  competitors?: string[];
}): Promise<ContentBrief> {
  const { keyword, product, competitors = [] } = params;

  const fallback: ContentBrief = {
    title: `Ultimate Guide to ${keyword} for ${product.target}`,
    metaDescription: `Learn everything about ${keyword}. Expert strategies, tips, and tools for ${product.target}. Comprehensive guide by ${product.name}.`,
    outline: [
      `What is ${keyword}?`,
      `Why ${keyword} matters for ${product.target}`,
      `Key strategies and best practices`,
      `Tools and resources`,
      `Common mistakes to avoid`,
      `How ${product.name} can help`,
      `Conclusion and next steps`,
    ],
    targetLength: 2000,
    keyPoints: [
      `Define ${keyword} and its relevance`,
      `Include data points and statistics`,
      `Reference competitor approaches`,
      `Provide actionable takeaways`,
      `Include internal links to product features`,
    ],
    targetKeyword: keyword,
  };

  try {
    const systemPrompt = `You are an SEO content strategist. Generate a content brief for a blog article targeting the given keyword.

The brief should be comprehensive and actionable for a content writer.

Return a JSON object with this exact structure:
{
  "title": "SEO-optimized article title (60-70 chars ideal)",
  "metaDescription": "Compelling meta description (150-160 chars ideal)",
  "outline": ["Section 1 heading", "Section 2 heading", ...],
  "targetLength": 2000,
  "keyPoints": ["Key point to cover 1", "Key point 2", ...],
  "targetKeyword": "${keyword}"
}

Include 5-8 outline sections and 4-6 key points. Set targetLength between 1500-3000 based on topic depth.`;

    const userContent = `Target keyword: ${keyword}
Product: ${product.name} — ${product.description}
Target audience: ${product.target}
${competitors.length > 0 ? `Competitors to reference: ${competitors.join(", ")}` : ""}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<ContentBrief>(messages, {
      temperature: 0.6,
      maxTokens: 1500,
    });

    if (!result) return fallback;

    return {
      title: result.title || fallback.title,
      metaDescription: result.metaDescription || fallback.metaDescription,
      outline: result.outline?.length > 0 ? result.outline : fallback.outline,
      targetLength: result.targetLength || fallback.targetLength,
      keyPoints: result.keyPoints?.length > 0 ? result.keyPoints : fallback.keyPoints,
      targetKeyword: result.targetKeyword || keyword,
    };
  } catch (err) {
    console.error("[AI Service] generateContentBrief error:", err);
    return fallback;
  }
}

/**
 * Suggest a campaign structure with ad groups and keyword groupings.
 */
export async function suggestCampaignStructure(params: {
  keywords: string[];
  product: ProductContext;
  budget: number;
  market: string;
}): Promise<CampaignSuggestion> {
  const { keywords, product, budget, market } = params;

  const fallback: CampaignSuggestion = {
    campaignName: `${product.name} — ${market} Search`,
    adGroups: [
      {
        name: "Brand Terms",
        keywords: keywords.filter((k) => k.toLowerCase().includes(product.name.toLowerCase())).slice(0, 10),
        suggestedHeadlines: [`${product.name} — Official`, "Try Free Today", "Start Now"],
        suggestedDescriptions: [`${product.name}: the leading solution for ${product.target}. Try it free.`],
      },
      {
        name: "Generic Terms",
        keywords: keywords.filter((k) => !k.toLowerCase().includes(product.name.toLowerCase())).slice(0, 15),
        suggestedHeadlines: ["Boost Your Results", "Save Time & Money", `Try ${product.name}`],
        suggestedDescriptions: [`Looking for a better way? ${product.name} helps ${product.target} succeed.`],
      },
    ],
  };

  try {
    const systemPrompt = `You are a PPC campaign strategist. Given a list of keywords, a product, a budget, and a target market, suggest an optimal Google Ads campaign structure.

Group keywords into logical ad groups (3-6 groups). For each ad group, suggest 3 headlines (<=30 chars each) and 1-2 descriptions (<=90 chars each).

Return a JSON object with this exact structure:
{
  "campaignName": "Campaign Name",
  "adGroups": [
    {
      "name": "Ad Group Name",
      "keywords": ["keyword1", "keyword2", ...],
      "suggestedHeadlines": ["Headline 1", "Headline 2", "Headline 3"],
      "suggestedDescriptions": ["Description 1"]
    }
  ]
}

Consider:
- Budget: $${budget}/month — allocate ad groups accordingly
- Market: ${market}
- Group by intent (brand, competitor, generic, long-tail)
- Prioritize high-intent keywords in the first ad groups`;

    const userContent = `Product: ${product.name} — ${product.description}
Target audience: ${product.target}
ACV: ${product.acv}
Monthly budget: $${budget}
Market: ${market}
Keywords (${keywords.length}): ${keywords.slice(0, 50).join(", ")}${keywords.length > 50 ? ` ... and ${keywords.length - 50} more` : ""}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<CampaignSuggestion>(messages, {
      temperature: 0.6,
      maxTokens: 2500,
    });

    if (!result) return fallback;

    return {
      campaignName: result.campaignName || fallback.campaignName,
      adGroups: result.adGroups?.length > 0 ? result.adGroups : fallback.adGroups,
    };
  } catch (err) {
    console.error("[AI Service] suggestCampaignStructure error:", err);
    return fallback;
  }
}
