// ════════════════════════════════════════════════════════════════
// Budget Optimization Service — Cross-Channel Mix Optimizer
// ════════════════════════════════════════════════════════════════

interface OptimizeChannelInput {
  channel: string;
  budgetPercent: number;
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
}

interface OptimizeParams {
  totalBudget: number;
  channels: OptimizeChannelInput[];
  acv: number;
}

interface OptimizedChannel {
  channel: string;
  budgetPercent: number;
  projectedRoas: number;
}

interface OptimizeResult {
  optimizedChannels: OptimizedChannel[];
  totalProjectedRevenue: number;
  totalProjectedConversions: number;
}

/**
 * Calculate ROAS for a single channel given its config and budget.
 */
function calculateChannelRoas(
  channel: OptimizeChannelInput,
  budget: number,
  acv: number,
): { roas: number; conversions: number; revenue: number } {
  if (budget <= 0 || channel.estimatedCpc <= 0) {
    return { roas: 0, conversions: 0, revenue: 0 };
  }

  const clicks = budget / channel.estimatedCpc;
  const conversions = clicks * (channel.estimatedConvRate / 100);
  const revenue = conversions * acv;
  const roas = revenue / budget;

  return { roas, conversions, revenue };
}

/**
 * Optimize the channel mix by shifting 10-20% of budget toward the
 * higher-ROAS channel. Returns optimized percentages and projected metrics.
 */
export function optimizeChannelMix(params: OptimizeParams): OptimizeResult {
  const { totalBudget, channels, acv } = params;

  if (channels.length === 0) {
    return {
      optimizedChannels: [],
      totalProjectedRevenue: 0,
      totalProjectedConversions: 0,
    };
  }

  // Single channel: nothing to optimize
  if (channels.length === 1) {
    const ch = channels[0];
    const budget = totalBudget * (ch.budgetPercent / 100);
    const metrics = calculateChannelRoas(ch, budget, acv);

    return {
      optimizedChannels: [
        {
          channel: ch.channel,
          budgetPercent: ch.budgetPercent,
          projectedRoas: metrics.roas,
        },
      ],
      totalProjectedRevenue: metrics.revenue,
      totalProjectedConversions: metrics.conversions,
    };
  }

  // Calculate ROAS per channel with current allocation
  const channelMetrics = channels.map((ch) => {
    const budget = totalBudget * (ch.budgetPercent / 100);
    const metrics = calculateChannelRoas(ch, budget, acv);
    return { ...ch, ...metrics, budget };
  });

  // Sort by ROAS descending — best performer first
  channelMetrics.sort((a, b) => b.roas - a.roas);

  const best = channelMetrics[0];
  const rest = channelMetrics.slice(1);

  // Determine shift amount: proportional to ROAS difference (10-20%)
  const roasDiff =
    rest.length > 0 && rest[0].roas > 0
      ? best.roas / rest[0].roas
      : 2;

  // More ROAS difference => larger shift, capped between 10-20%
  const shiftPercent = Math.min(20, Math.max(10, Math.round(roasDiff * 5)));

  // Calculate total percent available to shift from other channels
  const totalRestPercent = rest.reduce((s, c) => s + c.budgetPercent, 0);

  // Shift budget proportionally from lower-ROAS channels to the best one
  const optimizedChannels: OptimizedChannel[] = [];
  let shiftedSoFar = 0;

  for (const ch of rest) {
    // Proportional share of the shift from this channel
    const chShare =
      totalRestPercent > 0 ? ch.budgetPercent / totalRestPercent : 0;
    const chShift = Math.round(shiftPercent * chShare);
    const newPercent = Math.max(5, ch.budgetPercent - chShift);
    const actualShift = ch.budgetPercent - newPercent;
    shiftedSoFar += actualShift;

    const newBudget = totalBudget * (newPercent / 100);
    const metrics = calculateChannelRoas(ch, newBudget, acv);

    optimizedChannels.push({
      channel: ch.channel,
      budgetPercent: newPercent,
      projectedRoas: metrics.roas,
    });
  }

  // Give shifted budget to the best performer
  const bestNewPercent = Math.min(95, best.budgetPercent + shiftedSoFar);
  const bestNewBudget = totalBudget * (bestNewPercent / 100);
  const bestMetrics = calculateChannelRoas(best, bestNewBudget, acv);

  optimizedChannels.unshift({
    channel: best.channel,
    budgetPercent: bestNewPercent,
    projectedRoas: bestMetrics.roas,
  });

  // Calculate totals
  let totalProjectedRevenue = 0;
  let totalProjectedConversions = 0;

  for (const opt of optimizedChannels) {
    const originalCh = channels.find((c) => c.channel === opt.channel);
    if (!originalCh) continue;

    const budget = totalBudget * (opt.budgetPercent / 100);
    const metrics = calculateChannelRoas(originalCh, budget, acv);
    totalProjectedRevenue += metrics.revenue;
    totalProjectedConversions += metrics.conversions;
  }

  return {
    optimizedChannels,
    totalProjectedRevenue: Math.round(totalProjectedRevenue),
    totalProjectedConversions: Math.round(totalProjectedConversions),
  };
}
