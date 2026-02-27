// ════════════════════════════════════════════════════════════════
// AI Assistant Service — Chat, Ad Copy, Content Briefs, Campaign Suggestions
// Uses OpenAI Chat Completions API (gpt-4.1-mini)
// ════════════════════════════════════════════════════════════════

import { getAugmentedContext, storeMessageWithEmbedding } from "./chatHistory.ts";

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
    payload?: Record<string, unknown>;
  };
  sources?: { url: string; snippet: string }[];
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
  context: ChatContext = {},
  options: { sessionId?: string; productId?: string } = {}
): Promise<ChatResponse> {
  try {
    const contextBlock = buildContextBlock(context);

    // RAG: Retrieve relevant context from knowledge base and past conversations
    let ragBlock = "";
    let sources: { url: string; snippet: string }[] = [];
    if (options.sessionId) {
      try {
        const rag = await getAugmentedContext({
          message,
          sessionId: options.sessionId,
          productId: options.productId,
        });
        ragBlock = rag.ragBlock;
        sources = rag.sources;
      } catch (err) {
        console.error("[AI Service] RAG retrieval failed, continuing without:", err);
      }
    }

    const systemPrompt = CHAT_SYSTEM_PROMPT + contextBlock + ragBlock;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const responseText = await callOpenAI(messages, { temperature: 0.7, maxTokens: 1500 });

    // Store messages for future RAG retrieval
    if (options.sessionId) {
      // Fire and forget — don't block the response
      storeMessageWithEmbedding({
        sessionId: options.sessionId,
        productId: options.productId,
        role: "user",
        content: message,
      }).catch((err) => console.error("[AI Service] Failed to store user message:", err));

      storeMessageWithEmbedding({
        sessionId: options.sessionId,
        productId: options.productId,
        role: "assistant",
        content: responseText,
      }).catch((err) => console.error("[AI Service] Failed to store assistant message:", err));
    }

    const suggestedAction = detectSuggestedAction(message, responseText);

    return {
      message: responseText,
      ...(suggestedAction ? { suggestedAction } : {}),
      ...(sources.length > 0 ? { sources } : {}),
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
/**
 * Generate an ICP profile based on product and market context.
 */
export async function generateIcpProfile(params: {
  product: ProductContext;
  market: string;
  existingIcps?: string[];
}): Promise<{
  name: string;
  companySize: { min: number; max: number; label: string };
  industry: string[];
  revenue: { min: number; max: number; currency: string };
  geography: string[];
  techStack: string[];
  painPoints: string[];
  buyingTriggers: string[];
  decisionMakers: string[];
  budgetRange: { min: number; max: number; currency: string };
}> {
  const { product, market, existingIcps = [] } = params;

  const fallback = {
    name: `${product.name} — Primary ICP`,
    companySize: { min: 10, max: 200, label: "SMB" },
    industry: ["Technology", "Professional Services", "Financial Services"],
    revenue: { min: 1000000, max: 50000000, currency: "£" },
    geography: [market],
    techStack: ["QuickBooks", "Xero", "Microsoft 365"],
    painPoints: ["Manual invoice processing", "Slow approval workflows", "Lack of visibility into AP"],
    buyingTriggers: ["Growth phase", "Audit findings", "Staff turnover in AP team"],
    decisionMakers: ["CFO", "Financial Controller", "AP Manager"],
    budgetRange: { min: 500, max: 5000, currency: "£" },
  };

  try {
    const systemPrompt = `You are a B2B marketing strategist. Generate an Ideal Customer Profile (ICP) for the given product and market.

Return a JSON object with this exact structure:
{
  "name": "ICP profile name",
  "companySize": { "min": 10, "max": 200, "label": "SMB" },
  "industry": ["Industry 1", "Industry 2"],
  "revenue": { "min": 1000000, "max": 50000000, "currency": "£" },
  "geography": ["GB"],
  "techStack": ["Tool 1", "Tool 2"],
  "painPoints": ["Pain 1", "Pain 2"],
  "buyingTriggers": ["Trigger 1", "Trigger 2"],
  "decisionMakers": ["Title 1", "Title 2"],
  "budgetRange": { "min": 500, "max": 5000, "currency": "£" }
}

${existingIcps.length > 0 ? `Existing ICPs to differentiate from: ${existingIcps.join(", ")}. Create a DIFFERENT ICP segment.` : ""}`;

    const userContent = `Product: ${product.name} — ${product.description}
Target audience: ${product.target}
ACV: ${product.acv}
Market: ${market}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<typeof fallback>(messages, { temperature: 0.7, maxTokens: 1500 });
    if (!result) return fallback;

    return {
      name: result.name || fallback.name,
      companySize: result.companySize || fallback.companySize,
      industry: result.industry?.length > 0 ? result.industry : fallback.industry,
      revenue: result.revenue || fallback.revenue,
      geography: result.geography?.length > 0 ? result.geography : fallback.geography,
      techStack: result.techStack?.length > 0 ? result.techStack : fallback.techStack,
      painPoints: result.painPoints?.length > 0 ? result.painPoints : fallback.painPoints,
      buyingTriggers: result.buyingTriggers?.length > 0 ? result.buyingTriggers : fallback.buyingTriggers,
      decisionMakers: result.decisionMakers?.length > 0 ? result.decisionMakers : fallback.decisionMakers,
      budgetRange: result.budgetRange || fallback.budgetRange,
    };
  } catch (err) {
    console.error("[AI Service] generateIcpProfile error:", err);
    return fallback;
  }
}

/**
 * Generate a buyer persona based on product, ICP, and market context.
 */
export async function generateBuyerPersona(params: {
  product: ProductContext;
  icpName?: string;
  market: string;
  existingPersonas?: string[];
}): Promise<{
  name: string;
  title: string;
  department: string;
  seniority: string;
  goals: string[];
  painPoints: string[];
  objections: string[];
  triggers: string[];
  informationSources: string[];
  decisionCriteria: string[];
  searchBehavior: string[];
}> {
  const { product, icpName, market, existingPersonas = [] } = params;

  const fallback = {
    name: "Sarah the Financial Controller",
    title: "Financial Controller",
    department: "Finance",
    seniority: "manager",
    goals: ["Reduce AP processing time", "Improve accuracy", "Better cash flow visibility"],
    painPoints: ["Drowning in manual invoice work", "Approval bottlenecks", "Cannot track spend in real time"],
    objections: ["Too expensive for our size", "Integration concerns", "Change management resistance"],
    triggers: ["Month-end close taking too long", "Audit findings", "Growing invoice volumes"],
    informationSources: ["LinkedIn", "Industry events", "Peer recommendations", "G2 reviews"],
    decisionCriteria: ["Ease of integration", "Price per user", "Customer support quality", "Feature completeness"],
    searchBehavior: ["Searches for 'AP automation software' during month-end", "Compares alternatives on G2", "Looks for case studies from similar companies"],
  };

  try {
    const systemPrompt = `You are a B2B marketing strategist. Generate a detailed buyer persona for the given product and market.

Return a JSON object with this exact structure:
{
  "name": "Persona Name (e.g., 'Sarah the Financial Controller')",
  "title": "Job Title",
  "department": "Department",
  "seniority": "manager",
  "goals": ["Goal 1", "Goal 2"],
  "painPoints": ["Pain 1", "Pain 2"],
  "objections": ["Objection 1", "Objection 2"],
  "triggers": ["Trigger 1", "Trigger 2"],
  "informationSources": ["Source 1", "Source 2"],
  "decisionCriteria": ["Criterion 1", "Criterion 2"],
  "searchBehavior": ["What they search for and when"]
}

Seniority must be one of: c-suite, director, manager, individual-contributor.
${existingPersonas.length > 0 ? `Existing personas to differentiate from: ${existingPersonas.join(", ")}. Create a DIFFERENT persona.` : ""}
${icpName ? `This persona belongs to ICP: ${icpName}` : ""}`;

    const userContent = `Product: ${product.name} — ${product.description}
Target audience: ${product.target}
ACV: ${product.acv}
Market: ${market}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<typeof fallback>(messages, { temperature: 0.8, maxTokens: 1500 });
    if (!result) return fallback;

    return {
      name: result.name || fallback.name,
      title: result.title || fallback.title,
      department: result.department || fallback.department,
      seniority: result.seniority || fallback.seniority,
      goals: result.goals?.length > 0 ? result.goals : fallback.goals,
      painPoints: result.painPoints?.length > 0 ? result.painPoints : fallback.painPoints,
      objections: result.objections?.length > 0 ? result.objections : fallback.objections,
      triggers: result.triggers?.length > 0 ? result.triggers : fallback.triggers,
      informationSources: result.informationSources?.length > 0 ? result.informationSources : fallback.informationSources,
      decisionCriteria: result.decisionCriteria?.length > 0 ? result.decisionCriteria : fallback.decisionCriteria,
      searchBehavior: result.searchBehavior?.length > 0 ? result.searchBehavior : fallback.searchBehavior,
    };
  } catch (err) {
    console.error("[AI Service] generateBuyerPersona error:", err);
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

// ── Onboarding: Product Extraction ──

export interface ExtractedProductInfo {
  name: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  acv: string;
  integrations: string;
  features: string[];
  keywords: string[];
}

/**
 * Extract product information from crawled website content using AI.
 */
export async function extractProductInfo(params: {
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  url: string;
}): Promise<ExtractedProductInfo> {
  const { title, metaDescription, headings, bodyText, url } = params;

  const fallback: ExtractedProductInfo = {
    name: title || new URL(url).hostname.replace("www.", ""),
    description: metaDescription || "",
    valueProposition: "",
    targetAudience: "",
    acv: "",
    integrations: "",
    features: [],
    keywords: [],
  };

  try {
    const systemPrompt = `You are a product analyst. Given the content of a product/company website, extract structured product information.

Return a JSON object with this exact structure:
{
  "name": "Product or company name",
  "description": "One-sentence product description (max 150 chars)",
  "valueProposition": "Core value proposition — what problem it solves and for whom",
  "targetAudience": "Primary target buyer (job titles, company types)",
  "acv": "Pricing/ACV range if mentioned, otherwise best estimate based on the product type",
  "integrations": "Key integrations or platforms mentioned",
  "features": ["Feature 1", "Feature 2", ...],
  "keywords": ["keyword 1", "keyword 2", ...]
}

For keywords: extract 15-25 search keywords that potential buyers would use to find this product. Include:
- Product category terms (e.g., "AP automation software")
- Problem-based terms (e.g., "reduce invoice processing time")
- Feature terms (e.g., "automated three-way matching")
- Competitor alternative terms if competitors are mentioned
Focus on B2B search intent keywords.`;

    const userContent = `URL: ${url}
Title: ${title}
Meta Description: ${metaDescription}
Headings: ${headings.slice(0, 20).join(" | ")}

Page Content (excerpt):
${bodyText.slice(0, 10000)}`;

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await callOpenAIJson<ExtractedProductInfo>(messages, {
      temperature: 0.4,
      maxTokens: 2000,
    });

    if (!result) return fallback;

    return {
      name: result.name || fallback.name,
      description: result.description || fallback.description,
      valueProposition: result.valueProposition || "",
      targetAudience: result.targetAudience || "",
      acv: result.acv || "",
      integrations: result.integrations || "",
      features: result.features?.length > 0 ? result.features : [],
      keywords: result.keywords?.length > 0 ? result.keywords : [],
    };
  } catch (err) {
    console.error("[AI Service] extractProductInfo error:", err);
    return fallback;
  }
}

/**
 * Generate ad copy variants for an onboarding product.
 * Uses the extracted product info + keywords to generate headlines and descriptions.
 */
export async function generateOnboardingAdCopy(params: {
  product: ExtractedProductInfo;
  keywords: string[];
  count?: number;
}): Promise<{ headlines: string[]; descriptions: string[] }> {
  const { product, keywords, count = 15 } = params;

  // Delegate to existing generateAdCopy with the right shape
  return generateAdCopy({
    keywords,
    product: {
      name: product.name,
      description: product.description,
      acv: product.acv,
      target: product.targetAudience,
    },
    tone: "professional",
    count,
  });
}
