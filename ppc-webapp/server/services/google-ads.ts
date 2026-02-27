// ════════════════════════════════════════════════════════════════
// Google Ads API Service — Read performance + Write campaigns
// Uses google-ads-api (Opteo) package
// ════════════════════════════════════════════════════════════════

import { GoogleAdsApi, enums, ResourceNames } from "google-ads-api";
import { getStoredToken } from "./google-auth.ts";

// ── Types ──

export interface GoogleAdsCampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  avgCpc: number;
}

export interface GoogleAdsKeywordPerformance {
  keyword: string;
  matchType: string;
  campaignName: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  avgCpc: number;
  qualityScore: number;
  status: string;
}

export interface GoogleAdsSearchTerm {
  searchTerm: string;
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

export interface GoogleAdsAuctionInsight {
  domain: string;
  impressionShare: number;
  overlapRate: number;
  outranking: number;
  topOfPageRate: number;
  absoluteTopOfPageRate: number;
}

export interface GoogleAdsQualityScore {
  keyword: string;
  qualityScore: number;
  expectedCtr: string;
  adRelevance: string;
  landingPageExp: string;
}

// ── Client factory ──

function getConfig(): { clientId: string; clientSecret: string; developerToken: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!clientId || !clientSecret || !developerToken) {
    throw new Error("Google Ads API requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_ADS_DEVELOPER_TOKEN");
  }

  return { clientId, clientSecret, developerToken };
}

async function getCustomer(customerId?: string) {
  const config = getConfig();
  const cid = customerId || process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!cid) throw new Error("Google Ads customer ID is required");

  const stored = await getStoredToken("google-ads");
  const refreshToken = stored?.refreshToken;
  if (!refreshToken) throw new Error("Google Ads OAuth not connected — no refresh token found");

  const client = new GoogleAdsApi({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    developer_token: config.developerToken,
  });

  return client.Customer({
    customer_id: cid.replace(/-/g, ""),
    refresh_token: refreshToken,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, ""),
  });
}

function microsToUnits(micros: number): number {
  return micros / 1_000_000;
}

// ── READ: Performance data ──

export async function getCampaignPerformance(customerId?: string, daysBack = 30): Promise<GoogleAdsCampaignPerformance[]> {
  const customer = await getCustomer(customerId);

  const campaigns = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value,
      metrics.ctr, metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING LAST_${daysBack}_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `);

  return campaigns.map((r: Record<string, any>) => ({
    campaignId: r.campaign.id.toString(),
    campaignName: r.campaign.name,
    status: r.campaign.status,
    impressions: r.metrics.impressions,
    clicks: r.metrics.clicks,
    cost: microsToUnits(r.metrics.cost_micros),
    conversions: r.metrics.conversions,
    conversionValue: r.metrics.conversions_value,
    ctr: r.metrics.ctr,
    avgCpc: microsToUnits(r.metrics.average_cpc),
  }));
}

export async function getKeywordPerformance(customerId?: string, campaignId?: string): Promise<GoogleAdsKeywordPerformance[]> {
  const customer = await getCustomer(customerId);

  let query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name, ad_group.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr, metrics.average_cpc,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.status
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
  `;

  if (campaignId) {
    query += ` AND campaign.id = ${campaignId}`;
  }

  query += ` ORDER BY metrics.impressions DESC LIMIT 500`;

  const keywords = await customer.query(query);

  return keywords.map((r: Record<string, any>) => ({
    keyword: r.ad_group_criterion.keyword.text,
    matchType: r.ad_group_criterion.keyword.match_type,
    campaignName: r.campaign.name,
    adGroupName: r.ad_group.name,
    impressions: r.metrics.impressions,
    clicks: r.metrics.clicks,
    cost: microsToUnits(r.metrics.cost_micros),
    conversions: r.metrics.conversions,
    ctr: r.metrics.ctr,
    avgCpc: microsToUnits(r.metrics.average_cpc),
    qualityScore: r.ad_group_criterion.quality_info?.quality_score || 0,
    status: r.ad_group_criterion.status,
  }));
}

export async function getSearchTerms(customerId?: string, campaignId?: string): Promise<GoogleAdsSearchTerm[]> {
  const customer = await getCustomer(customerId);

  let query = `
    SELECT
      search_term_view.search_term,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING LAST_30_DAYS
  `;

  if (campaignId) {
    query += ` AND campaign.id = ${campaignId}`;
  }

  query += ` ORDER BY metrics.impressions DESC LIMIT 500`;

  const terms = await customer.query(query);

  return terms.map((r: Record<string, any>) => ({
    searchTerm: r.search_term_view.search_term,
    keyword: r.ad_group_criterion?.keyword?.text || "",
    matchType: r.ad_group_criterion?.keyword?.match_type || "",
    impressions: r.metrics.impressions,
    clicks: r.metrics.clicks,
    cost: microsToUnits(r.metrics.cost_micros),
    conversions: r.metrics.conversions,
  }));
}

export async function getQualityScores(customerId?: string): Promise<GoogleAdsQualityScore[]> {
  const customer = await getCustomer(customerId);

  const results = await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr
    FROM keyword_view
    WHERE ad_group_criterion.quality_info.quality_score IS NOT NULL
    ORDER BY ad_group_criterion.quality_info.quality_score ASC
    LIMIT 200
  `);

  return results.map((r: Record<string, any>) => ({
    keyword: r.ad_group_criterion.keyword.text,
    qualityScore: r.ad_group_criterion.quality_info.quality_score,
    expectedCtr: r.ad_group_criterion.quality_info.search_predicted_ctr || "UNSPECIFIED",
    adRelevance: r.ad_group_criterion.quality_info.creative_quality_score || "UNSPECIFIED",
    landingPageExp: r.ad_group_criterion.quality_info.post_click_quality_score || "UNSPECIFIED",
  }));
}

// ── WRITE: Campaign management ──

export interface PushCampaignInput {
  name: string;
  dailyBudget: number;
  bidStrategy: string;
  targetCpa?: number;
  targetRoas?: number;
  targetCountries: string[];
  adGroups: {
    name: string;
    keywords: { keyword: string; matchType: string; maxCpc?: number }[];
    negativeKeywords?: { keyword: string; matchType: string }[];
    headlines: string[];
    descriptions: string[];
    finalUrl?: string;
  }[];
  negativeKeywords?: { keyword: string; matchType: string }[];
}

export async function pushCampaignToGoogleAds(
  input: PushCampaignInput,
  customerId?: string
): Promise<{ campaignId: string; adGroupIds: string[]; keywordCount: number; adCount: number }> {
  const customer = await getCustomer(customerId);

  // 1. Create budget
  const budgetResult = await customer.campaignBudgets.create([{
    name: `${input.name} Budget`,
    amount_micros: Math.round(input.dailyBudget * 1_000_000),
    delivery_method: enums.BudgetDeliveryMethod.STANDARD,
  }]);
  const budgetResourceName = budgetResult.results[0].resource_name;

  // 2. Create campaign
  const campaignData: Record<string, unknown> = {
    name: input.name,
    campaign_budget: budgetResourceName,
    advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
    status: enums.CampaignStatus.PAUSED,
    network_settings: {
      target_google_search: true,
      target_search_network: true,
    },
  };

  // Set bid strategy
  if (input.bidStrategy === "manual-cpc") {
    campaignData.manual_cpc = { enhanced_cpc_enabled: false };
  } else if (input.bidStrategy === "target-cpa" && input.targetCpa) {
    campaignData.target_cpa = { target_cpa_micros: Math.round(input.targetCpa * 1_000_000) };
  } else if (input.bidStrategy === "target-roas" && input.targetRoas) {
    campaignData.target_roas = { target_roas: input.targetRoas };
  } else if (input.bidStrategy === "maximize-clicks") {
    campaignData.maximize_clicks = {};
  } else if (input.bidStrategy === "maximize-conversions") {
    campaignData.maximize_conversions = {};
  }

  const campaignResult = await customer.campaigns.create([campaignData]);
  const campaignResourceName = campaignResult.results[0].resource_name!;
  const campaignId = campaignResourceName.split("/").pop()!;

  // 3. Set geo targets
  if (input.targetCountries.length > 0) {
    const geoTargets = input.targetCountries.map((country) => ({
      campaign: campaignResourceName,
      geo_target_constant: `geoTargetConstants/${getGeoTargetId(country)}`,
    }));
    await customer.campaignCriteria.create(geoTargets);
  }

  // 4. Create ad groups + keywords + ads
  const adGroupIds: string[] = [];
  let totalKeywords = 0;
  let totalAds = 0;

  for (const ag of input.adGroups) {
    const agResult = await customer.adGroups.create([{
      campaign: campaignResourceName,
      name: ag.name,
      status: enums.AdGroupStatus.ENABLED,
      type: enums.AdGroupType.SEARCH_STANDARD,
    }]);
    const agResourceName = agResult.results[0].resource_name!;
    const agId = agResourceName.split("/").pop()!;
    adGroupIds.push(agId);

    // Add keywords
    if (ag.keywords.length > 0) {
      const keywordOps = ag.keywords.map((kw) => ({
        ad_group: agResourceName,
        keyword: {
          text: kw.keyword,
          match_type: mapMatchType(kw.matchType),
        },
        status: enums.AdGroupCriterionStatus.ENABLED,
        ...(kw.maxCpc ? { cpc_bid_micros: Math.round(kw.maxCpc * 1_000_000) } : {}),
      }));
      await customer.adGroupCriteria.create(keywordOps);
      totalKeywords += ag.keywords.length;
    }

    // Add negative keywords (ad group level)
    if (ag.negativeKeywords && ag.negativeKeywords.length > 0) {
      const negOps = ag.negativeKeywords.map((kw) => ({
        ad_group: agResourceName,
        keyword: {
          text: kw.keyword,
          match_type: mapMatchType(kw.matchType),
        },
        negative: true,
      }));
      await customer.adGroupCriteria.create(negOps);
    }

    // Create RSA
    if (ag.headlines.length >= 3 && ag.descriptions.length >= 2) {
      const headlines = ag.headlines.slice(0, 15).map((text, i) => ({
        text,
        pinned_field: i === 0 ? enums.ServedAssetFieldType.HEADLINE_1 : enums.ServedAssetFieldType.UNSPECIFIED,
      }));
      const descriptions = ag.descriptions.slice(0, 4).map((text) => ({ text }));

      await customer.adGroupAds.create([{
        ad_group: agResourceName,
        ad: {
          responsive_search_ad: {
            headlines,
            descriptions,
          },
          final_urls: [ag.finalUrl || input.adGroups[0]?.finalUrl || "https://example.com"],
        },
        status: enums.AdGroupAdStatus.ENABLED,
      }]);
      totalAds++;
    }
  }

  // 5. Campaign-level negative keywords
  if (input.negativeKeywords && input.negativeKeywords.length > 0) {
    const negOps = input.negativeKeywords.map((kw) => ({
      campaign: campaignResourceName,
      keyword: {
        text: kw.keyword,
        match_type: mapMatchType(kw.matchType),
      },
      negative: true,
    }));
    await customer.campaignCriteria.create(negOps);
  }

  return {
    campaignId,
    adGroupIds,
    keywordCount: totalKeywords,
    adCount: totalAds,
  };
}

export async function updateCampaignStatus(
  campaignId: string,
  status: "ENABLED" | "PAUSED" | "REMOVED",
  customerId?: string
): Promise<void> {
  const customer = await getCustomer(customerId);
  const cid = (customerId || process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
  await customer.campaigns.update([{
    resource_name: `customers/${cid}/campaigns/${campaignId}`,
    status: enums.CampaignStatus[status],
  }]);
}

// ── Helpers ──

function mapMatchType(mt: string): number {
  switch (mt.toLowerCase()) {
    case "exact": return enums.KeywordMatchType.EXACT;
    case "phrase": return enums.KeywordMatchType.PHRASE;
    case "broad":
    default: return enums.KeywordMatchType.BROAD;
  }
}

const GEO_TARGETS: Record<string, number> = {
  GB: 2826, US: 2840, DE: 2276, FR: 2250, AU: 2036, CA: 2124,
  NL: 2528, ES: 2724, IT: 2380, BR: 2076, JP: 2392, IN: 2356,
};

function getGeoTargetId(countryCode: string): number {
  return GEO_TARGETS[countryCode.toUpperCase()] || 2840;
}

export function isGoogleAdsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  );
}
