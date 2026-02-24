// ════════════════════════════════════════════════════════════════
// Stripe Revenue Service — MRR, LTV, Churn & UTM Attribution
// Fetches real subscription data to power accurate ROAS calculations
// ════════════════════════════════════════════════════════════════

import Stripe from "stripe";

// ── Types ──

export interface StripeMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  avgRevenuePerUser: number;
  churnRate: number;
  ltv: number;
  newMrrThisMonth: number;
  expansionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  trialCount: number;
  trialConversionRate: number;
  currency: string;
}

export interface StripeAttribution {
  keyword: string;
  source: string;
  medium: string;
  campaign: string;
  customers: number;
  totalRevenue: number;
  avgDealSize: number;
  conversionRate: number;
}

export interface StripeTimelinePoint {
  month: string;
  mrr: number;
  customers: number;
  churn: number;
  newCustomers: number;
}

export interface StripeCustomerAttribution {
  customerId: string;
  email: string;
  mrr: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmKeyword: string | null;
  createdAt: string;
  planName: string;
}

// ── Stripe client factory ──

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY not configured"), { status: 401 });
  }
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion });
}

// ── MRR & Core Metrics ──

export async function getMetrics(): Promise<StripeMetrics> {
  const stripe = getStripe();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Fetch active subscriptions
  const subscriptions: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100 })) {
    subscriptions.push(sub);
  }

  // Fetch trialing subscriptions
  const trialSubs: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({ status: "trialing", limit: 100 })) {
    trialSubs.push(sub);
  }

  // Calculate MRR from active subscriptions
  let mrr = 0;
  for (const sub of subscriptions) {
    for (const item of sub.items.data) {
      const price = item.price;
      const quantity = item.quantity || 1;
      const amount = (price.unit_amount || 0) * quantity;

      if (price.recurring?.interval === "month") {
        mrr += amount;
      } else if (price.recurring?.interval === "year") {
        mrr += Math.round(amount / 12);
      }
    }
  }
  mrr = mrr / 100; // Convert from cents

  // New MRR this month (subscriptions created this month)
  let newMrrThisMonth = 0;
  for (const sub of subscriptions) {
    if (new Date(sub.created * 1000) >= startOfMonth) {
      for (const item of sub.items.data) {
        const price = item.price;
        const quantity = item.quantity || 1;
        const amount = (price.unit_amount || 0) * quantity;
        if (price.recurring?.interval === "month") {
          newMrrThisMonth += amount;
        } else if (price.recurring?.interval === "year") {
          newMrrThisMonth += Math.round(amount / 12);
        }
      }
    }
  }
  newMrrThisMonth = newMrrThisMonth / 100;

  // Churned subscriptions (canceled in the last 30 days)
  const canceledSubs: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({
    status: "canceled",
    limit: 100,
    created: { gte: Math.floor(startOfLastMonth.getTime() / 1000) },
  })) {
    canceledSubs.push(sub);
  }

  let churnedMrr = 0;
  const recentCanceled = canceledSubs.filter(
    s => s.canceled_at && new Date(s.canceled_at * 1000) >= startOfMonth,
  );
  for (const sub of recentCanceled) {
    for (const item of sub.items.data) {
      const price = item.price;
      const quantity = item.quantity || 1;
      const amount = (price.unit_amount || 0) * quantity;
      if (price.recurring?.interval === "month") {
        churnedMrr += amount;
      } else if (price.recurring?.interval === "year") {
        churnedMrr += Math.round(amount / 12);
      }
    }
  }
  churnedMrr = churnedMrr / 100;

  const activeCount = subscriptions.length;
  const arpu = activeCount > 0 ? mrr / activeCount : 0;

  // Total subs that existed at start of month (active + recently canceled)
  const totalAtStartOfMonth = activeCount + recentCanceled.length - subscriptions.filter(
    s => new Date(s.created * 1000) >= startOfMonth,
  ).length;
  const churnRate = totalAtStartOfMonth > 0
    ? (recentCanceled.length / totalAtStartOfMonth) * 100
    : 0;

  const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 24; // Default 24 months if no churn

  // Trial conversion rate (last 90 days)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const recentTrialsConverted = subscriptions.filter(
    s => s.trial_end && new Date(s.trial_end * 1000) >= ninetyDaysAgo,
  ).length;
  const totalRecentTrials = recentTrialsConverted + trialSubs.length;
  const trialConversionRate = totalRecentTrials > 0
    ? (recentTrialsConverted / totalRecentTrials) * 100
    : 0;

  const currency = subscriptions[0]?.items.data[0]?.price.currency?.toUpperCase() || "GBP";

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    activeSubscriptions: activeCount,
    avgRevenuePerUser: Math.round(arpu * 100) / 100,
    churnRate: Math.round(churnRate * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    newMrrThisMonth: Math.round(newMrrThisMonth * 100) / 100,
    expansionMrr: 0, // Would need invoice comparison to calculate
    churnedMrr: Math.round(churnedMrr * 100) / 100,
    netNewMrr: Math.round((newMrrThisMonth - churnedMrr) * 100) / 100,
    trialCount: trialSubs.length,
    trialConversionRate: Math.round(trialConversionRate * 100) / 100,
    currency,
  };
}

// ── UTM Attribution ──

export async function getAttribution(): Promise<StripeAttribution[]> {
  const stripe = getStripe();

  // Fetch customers with metadata containing UTM params
  const customers: Stripe.Customer[] = [];
  for await (const cust of stripe.customers.list({ limit: 100 })) {
    customers.push(cust);
  }

  // Group by keyword from utm_term metadata
  const keywordMap = new Map<string, {
    customers: number;
    totalRevenue: number;
    source: string;
    medium: string;
    campaign: string;
  }>();

  for (const cust of customers) {
    const meta = cust.metadata || {};
    const keyword = meta.utm_term || meta.utm_keyword || "";
    const source = meta.utm_source || "direct";
    const medium = meta.utm_medium || "";
    const campaign = meta.utm_campaign || "";

    if (!keyword) continue;

    // Get total charges for this customer
    let totalPaid = 0;
    for await (const charge of stripe.charges.list({ customer: cust.id, limit: 100 })) {
      if (charge.status === "succeeded") {
        totalPaid += charge.amount;
      }
    }
    totalPaid = totalPaid / 100;

    const existing = keywordMap.get(keyword.toLowerCase()) || {
      customers: 0, totalRevenue: 0, source, medium, campaign,
    };
    existing.customers += 1;
    existing.totalRevenue += totalPaid;
    keywordMap.set(keyword.toLowerCase(), existing);
  }

  return Array.from(keywordMap.entries()).map(([keyword, data]) => ({
    keyword,
    source: data.source,
    medium: data.medium,
    campaign: data.campaign,
    customers: data.customers,
    totalRevenue: Math.round(data.totalRevenue * 100) / 100,
    avgDealSize: data.customers > 0 ? Math.round((data.totalRevenue / data.customers) * 100) / 100 : 0,
    conversionRate: 0, // Would need click data to calculate
  }));
}

// ── MRR Timeline (last 12 months) ──

export async function getTimeline(): Promise<StripeTimelinePoint[]> {
  const stripe = getStripe();
  const now = new Date();
  const timeline: StripeTimelinePoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    // Count invoices paid in this month as a proxy for MRR
    let monthlyRevenue = 0;
    let newCustomerCount = 0;
    const seenCustomers = new Set<string>();

    for await (const invoice of stripe.invoices.list({
      status: "paid",
      created: {
        gte: Math.floor(monthDate.getTime() / 1000),
        lte: Math.floor(monthEnd.getTime() / 1000),
      },
      limit: 100,
    })) {
      monthlyRevenue += (invoice.amount_paid || 0) / 100;
      if (invoice.customer && typeof invoice.customer === "string") {
        seenCustomers.add(invoice.customer);
      }
    }

    // Count new customers created in this month
    for await (const cust of stripe.customers.list({
      created: {
        gte: Math.floor(monthDate.getTime() / 1000),
        lte: Math.floor(monthEnd.getTime() / 1000),
      },
      limit: 100,
    })) {
      if (cust) newCustomerCount++;
    }

    timeline.push({
      month: monthLabel,
      mrr: Math.round(monthlyRevenue * 100) / 100,
      customers: seenCustomers.size,
      churn: 0, // Would need previous month comparison
      newCustomers: newCustomerCount,
    });
  }

  return timeline;
}

// ── Webhook event processing ──

export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw Object.assign(new Error("STRIPE_WEBHOOK_SECRET not configured"), { status: 500 });
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<{ handled: boolean; type: string }> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
    case "invoice.payment_failed":
      console.log(`[Stripe Webhook] ${event.type} — ${event.id}`);
      return { handled: true, type: event.type };
    default:
      return { handled: false, type: event.type };
  }
}
