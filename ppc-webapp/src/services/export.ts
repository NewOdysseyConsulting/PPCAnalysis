// ════════════════════════════════════════════════════════════════
// Export Service — Client-side CSV, Google Ads Editor & PDF exports
// No backend needed: all exports are generated in the browser
// ════════════════════════════════════════════════════════════════

// ── Types ──

export interface PdfReportSection {
  title: string;
  type: "table" | "summary";
  headers?: string[];
  rows?: (string | number)[][];
  metrics?: { label: string; value: string }[];
}

export interface PdfReportMeta {
  title: string;
  market: string;
  date: string;
  currency: string;
}

export interface CampaignAdGroup {
  name: string;
  keywords: (string | { keyword: string; matchType?: string; maxCpc?: number })[];
  headlines: string[];
  descriptions: string[];
  finalUrl?: string;
}

export interface Campaign {
  name: string;
  status: string;
  adGroups: CampaignAdGroup[];
  bidConfig?: { dailyBudget?: number; maxCpcLimit?: number };
  landingPageUrl?: string;
}

export interface Market {
  currency: string;
}

export interface KeywordRow {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  relevance: number;
  group: string | null;
  bingVol?: number;
  bingCpc?: number;
  cpcDelta?: number;
}

// ── CSV helpers ──

/**
 * Escapes a single CSV cell value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 * Internal double-quotes are escaped by doubling them (RFC 4180).
 */
function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser file download by creating a temporary anchor element
 * with a Blob URL, clicking it, and cleaning up.
 */
function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ── 1. Generic CSV Export ──

/**
 * Generates a CSV string from headers and rows with proper escaping.
 */
export function generateCsv(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map(row => row.map(escapeCsvCell).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Creates a CSV Blob and triggers a browser download.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const csv = generateCsv(headers, rows);
  triggerDownload(filename, csv, "text/csv;charset=utf-8");
}

// ── 2. Google Ads Editor Export ──

const GOOGLE_ADS_EDITOR_HEADERS = [
  "Campaign",
  "Ad Group",
  "Keyword",
  "Match Type",
  "Max CPC",
  "Headline 1",
  "Headline 2",
  "Headline 3",
  "Description",
  "Description 2",
  "Final URL",
  "Status",
];

/**
 * Maps campaign data to a Google Ads Editor-compatible CSV string.
 *
 * Each campaign's ad groups produce one row per keyword (for keyword entries)
 * plus one row per ad group for the ad copy (headlines + descriptions).
 */
export function generateGoogleAdsEditorCsv(
  campaigns: Campaign[],
  market: Market,
): string {
  const rows: (string | number)[][] = [];

  for (const campaign of campaigns) {
    for (const adGroup of campaign.adGroups) {
      const defaultCpc = campaign.bidConfig?.maxCpcLimit ?? (market.currency === "$" ? 1.00 : 0.80);
      const finalUrl = adGroup.finalUrl || campaign.landingPageUrl || "";

      // Keyword rows
      for (const kw of adGroup.keywords) {
        const isObj = typeof kw === "object" && kw !== null;
        const kwText = isObj ? (kw as { keyword: string }).keyword : (kw as string);
        const matchType = isObj && (kw as { matchType?: string }).matchType
          ? (kw as { matchType: string }).matchType.charAt(0).toUpperCase() + (kw as { matchType: string }).matchType.slice(1)
          : "Broad";
        const maxCpc = isObj && (kw as { maxCpc?: number }).maxCpc ? (kw as { maxCpc: number }).maxCpc : defaultCpc;
        rows.push([
          campaign.name,
          adGroup.name,
          kwText,
          matchType,
          maxCpc,
          "",
          "",
          "",
          "",
          "",
          finalUrl,
          campaign.status,
        ]);
      }

      // Ad copy row
      rows.push([
        campaign.name,
        adGroup.name,
        "",
        "",
        "",
        adGroup.headlines[0] ?? "",
        adGroup.headlines[1] ?? "",
        adGroup.headlines[2] ?? "",
        adGroup.descriptions[0] ?? "",
        adGroup.descriptions[1] ?? "",
        finalUrl,
        campaign.status,
      ]);
    }
  }

  return generateCsv(GOOGLE_ADS_EDITOR_HEADERS, rows);
}

/**
 * Downloads campaign data as a Google Ads Editor-compatible CSV file.
 */
export function downloadGoogleAdsEditor(
  campaigns: Campaign[],
  market: Market,
  filename?: string,
): void {
  const csv = generateGoogleAdsEditorCsv(campaigns, market);
  triggerDownload(
    filename ?? "google-ads-editor-export.csv",
    csv,
    "text/csv;charset=utf-8",
  );
}

// ── 3. Keyword Data Export ──

const KEYWORD_CSV_HEADERS = [
  "Keyword",
  "Volume",
  "CPC",
  "Competition",
  "Difficulty",
  "Intent",
  "Relevance",
  "Group",
  "Bing Volume",
  "Bing CPC",
  "CPC Delta",
];

/**
 * Downloads keyword table data as a CSV file.
 * Formats numeric values for readability and uses the market currency for CPC fields.
 */
export function downloadKeywordsCsv(
  keywords: KeywordRow[],
  market: Market,
  filename?: string,
): void {
  const rows: (string | number)[][] = keywords.map(kw => [
    kw.keyword,
    kw.volume,
    `${market.currency} ${kw.cpc.toFixed(2)}`,
    kw.competition.toFixed(2),
    kw.difficulty,
    kw.intent,
    kw.relevance,
    kw.group ?? "",
    kw.bingVol ?? "",
    kw.bingCpc != null ? `${market.currency} ${kw.bingCpc.toFixed(2)}` : "",
    kw.cpcDelta != null ? `${(kw.cpcDelta * 100).toFixed(1)}%` : "",
  ]);

  downloadCsv(
    filename ?? "keywords-export.csv",
    KEYWORD_CSV_HEADERS,
    rows,
  );
}

// ── 4. PDF Report (Print-based) ──

/**
 * Builds a styled HTML document and triggers window.print() for PDF output.
 *
 * Uses a clean, professional layout with the Orion teal accent (#0d9488),
 * print-optimized styles, and proper page-break handling.
 */
export function downloadPdfReport(
  sections: PdfReportSection[],
  meta: PdfReportMeta,
): void {
  const htmlSections = sections.map(section => {
    if (section.type === "summary" && section.metrics) {
      const metricCards = section.metrics
        .map(
          m => `
            <div class="metric-card">
              <div class="metric-label">${escapeHtml(m.label)}</div>
              <div class="metric-value">${escapeHtml(m.value)}</div>
            </div>`,
        )
        .join("");

      return `
        <div class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <div class="metrics-grid">${metricCards}</div>
        </div>`;
    }

    if (section.type === "table" && section.headers && section.rows) {
      const headerCells = section.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("");
      const bodyRows = section.rows
        .map(row => {
          const cells = row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <div class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <table>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
    }

    return "";
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "DM Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #1a1d26;
      line-height: 1.5;
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      border-bottom: 3px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1d26;
      margin-bottom: 8px;
    }

    .header-meta {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #5c6070;
    }

    .header-meta span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 16px;
      font-weight: 600;
      color: #0d9488;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e1e6;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .metric-card {
      background: #f8f8f9;
      border: 1px solid #e0e1e6;
      border-radius: 6px;
      padding: 14px 16px;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 500;
      color: #5c6070;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1d26;
      font-family: "JetBrains Mono", "Fira Code", monospace;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    thead {
      background: #f1f2f4;
    }

    th {
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      color: #5c6070;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #e0e1e6;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #ecedf0;
      color: #1a1d26;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e0e1e6;
      font-size: 11px;
      color: #8b8fa3;
      text-align: center;
    }

    @media print {
      body {
        padding: 20px;
      }

      .section {
        page-break-inside: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(meta.title)}</h1>
    <div class="header-meta">
      <span>Market: ${escapeHtml(meta.market)}</span>
      <span>Currency: ${escapeHtml(meta.currency)}</span>
      <span>Date: ${escapeHtml(meta.date)}</span>
    </div>
  </div>

  ${htmlSections}

  <div class="footer">
    Generated by Orion PPC Intelligence Platform &mdash; ${escapeHtml(meta.date)}
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Unable to open print window. Please allow pop-ups for this site.");
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Allow the browser a moment to render before triggering print
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
}

// ── HTML helper ──

/**
 * Escapes HTML special characters to prevent XSS in the generated PDF report.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
