// ════════════════════════════════════════════════════════════════
// Google Auth Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/google";

export interface GoogleConnectionStatus {
  serviceAccount: boolean;
  oauth: boolean;
  ga4: boolean;
  gsc: boolean;
  googleAds: boolean;
}

async function apiCall(endpoint: string): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Google Auth API request failed (${response.status})`);
  }
  return data;
}

export async function getGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  return apiCall("/status");
}

