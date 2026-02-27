// ════════════════════════════════════════════════════════════════
// Google Auth Service — Shared OAuth2 / service account auth
// Used by GA4, Search Console, and Google Ads integrations
// ════════════════════════════════════════════════════════════════

import { GoogleAuth } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import { getDb } from "./db.ts";

// ── Scopes ──

export const SCOPES = {
  GA4: "https://www.googleapis.com/auth/analytics.readonly",
  GSC: "https://www.googleapis.com/auth/webmasters.readonly",
  ADS: "https://www.googleapis.com/auth/adwords",
};

// ── Service Account Auth ──

let serviceAuth: GoogleAuth | null = null;

export function getServiceAccountAuth(scopes: string[]): GoogleAuth | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;

  if (!serviceAuth) {
    const credentials = JSON.parse(keyJson);
    serviceAuth = new GoogleAuth({ credentials, scopes });
  }
  return serviceAuth;
}

// ── OAuth2 Auth ──

export function getOAuth2Client(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/google/oauth/callback";

  if (!clientId || !clientSecret) return null;
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(scopes: string[]): string | null {
  const client = getOAuth2Client();
  if (!client) return null;

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiry: Date } | null> {
  const client = getOAuth2Client();
  if (!client) return null;

  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) return null;

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
  };
}

export async function getAuthenticatedClient(scopes: string[]): Promise<GoogleAuth | OAuth2Client | null> {
  // 1. Try service account first
  const sa = getServiceAccountAuth(scopes);
  if (sa) return sa;

  // 2. Try OAuth2 with stored refresh token
  const db = getDb();
  const tokenRow = await db("google_auth_tokens")
    .whereRaw("scopes @> ?", [JSON.stringify(scopes)])
    .orderBy("updated_at", "desc")
    .first();

  if (tokenRow?.refresh_token) {
    const client = getOAuth2Client();
    if (client) {
      client.setCredentials({ refresh_token: tokenRow.refresh_token });
      return client;
    }
  }

  return null;
}

// ── Token storage ──

export async function storeTokens(params: {
  service: string;
  accessToken: string;
  refreshToken: string;
  expiry: Date;
  scopes: string[];
  propertyId?: string;
  customerId?: string;
}): Promise<void> {
  const db = getDb();
  await db("google_auth_tokens")
    .insert({
      service: params.service,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_expiry: params.expiry,
      scopes: JSON.stringify(params.scopes),
      property_id: params.propertyId || null,
      customer_id: params.customerId || null,
    })
    .onConflict("service")
    .merge(["access_token", "refresh_token", "token_expiry", "scopes", "property_id", "customer_id", "updated_at"]);
}

export async function getStoredToken(service: string): Promise<{ refreshToken: string; propertyId?: string; customerId?: string } | null> {
  const db = getDb();
  const row = await db("google_auth_tokens").where("service", service).first();
  if (!row) return null;
  return {
    refreshToken: row.refresh_token,
    propertyId: row.property_id,
    customerId: row.customer_id,
  };
}

// ── Connection status ──

export async function getConnectionStatus(): Promise<{
  serviceAccount: boolean;
  oauth: boolean;
  ga4: boolean;
  gsc: boolean;
  googleAds: boolean;
}> {
  const hasSA = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const hasOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const db = getDb();
  const tokens = await db("google_auth_tokens").select("service");
  const services = new Set(tokens.map((t: { service: string }) => t.service));

  return {
    serviceAccount: hasSA,
    oauth: hasOAuth,
    ga4: hasSA || services.has("ga4"),
    gsc: hasSA || services.has("gsc"),
    googleAds: services.has("google-ads"),
  };
}
