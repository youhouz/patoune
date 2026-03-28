import { callClaude } from "@/lib/anthropic";
import { db } from "@/lib/supabase";

export interface AnalyticsResult {
  summary: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagementRate: number;
    followerGrowth: number;
    costPerAcquisition: number;
  };
  recommendations: string[];
  alerts: Array<{
    type: "warning" | "success" | "info";
    message: string;
  }>;
  comparisonVsTarget: {
    metric: string;
    current: number;
    target: number;
    status: "on_track" | "behind" | "ahead";
  }[];
}

async function sendEmailAlert(
  subject: string,
  htmlContent: string
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "re_...") {
    console.log("Resend not configured, skipping email alert");
    return false;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: "Growth Agent OS <onboarding@resend.dev>",
      to: ["team@example.com"],
      subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function execute(
  campaignId: string,
  appName: string
): Promise<AnalyticsResult> {
  await db.addLog(campaignId, "analytics", "info", "Starting analytics review...");

  // Get campaign data
  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const contentResult = campaign.content_result;
  const prospectionResult = campaign.prospection_result;

  // In production, these would come from platform APIs
  // For now, generate realistic projected metrics based on content volume
  const contentCount =
    (contentResult as Record<string, unknown[]> | null)?.tiktokCaptions?.length || 0;
  const influencerCount =
    (prospectionResult as Record<string, unknown[]> | null)?.influencers?.length || 0;

  const projectedMetrics = {
    impressions: contentCount * 2500 + influencerCount * 5000,
    clicks: Math.floor((contentCount * 2500 + influencerCount * 5000) * 0.035),
    conversions: Math.floor(
      (contentCount * 2500 + influencerCount * 5000) * 0.035 * 0.12
    ),
    engagementRate: parseFloat((Math.random() * 3 + 4).toFixed(1)),
    followerGrowth: Math.floor(contentCount * 150 + influencerCount * 300),
    costPerAcquisition: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
  };

  const targets = {
    impressions: 100000,
    clicks: 3500,
    conversions: 420,
    engagementRate: 5.0,
    followerGrowth: 10000,
    costPerAcquisition: 2.0,
  };

  const comparison = [
    {
      metric: "Impressions",
      current: projectedMetrics.impressions,
      target: targets.impressions,
      status: (projectedMetrics.impressions >= targets.impressions * 0.8
        ? projectedMetrics.impressions >= targets.impressions
          ? "ahead"
          : "on_track"
        : "behind") as "on_track" | "behind" | "ahead",
    },
    {
      metric: "Click-through Rate",
      current: projectedMetrics.clicks,
      target: targets.clicks,
      status: (projectedMetrics.clicks >= targets.clicks * 0.8
        ? projectedMetrics.clicks >= targets.clicks
          ? "ahead"
          : "on_track"
        : "behind") as "on_track" | "behind" | "ahead",
    },
    {
      metric: "Conversions",
      current: projectedMetrics.conversions,
      target: targets.conversions,
      status: (projectedMetrics.conversions >= targets.conversions * 0.8
        ? projectedMetrics.conversions >= targets.conversions
          ? "ahead"
          : "on_track"
        : "behind") as "on_track" | "behind" | "ahead",
    },
    {
      metric: "Engagement Rate",
      current: projectedMetrics.engagementRate,
      target: targets.engagementRate,
      status: (projectedMetrics.engagementRate >= targets.engagementRate * 0.9
        ? "on_track"
        : "behind") as "on_track" | "behind" | "ahead",
    },
    {
      metric: "Follower Growth",
      current: projectedMetrics.followerGrowth,
      target: targets.followerGrowth,
      status: (projectedMetrics.followerGrowth >= targets.followerGrowth * 0.8
        ? projectedMetrics.followerGrowth >= targets.followerGrowth
          ? "ahead"
          : "on_track"
        : "behind") as "on_track" | "behind" | "ahead",
    },
  ];

  await db.addLog(campaignId, "analytics", "info", "Generating AI recommendations...");

  const recommendationsRaw = await callClaude(
    `You are a growth analytics expert. Analyze these campaign metrics and provide actionable recommendations. Return a JSON object with: {"summary": "...", "recommendations": ["...", "..."], "alerts": [{"type": "warning|success|info", "message": "..."}]}`,
    `App: ${appName}
Campaign Metrics:
- Projected Impressions: ${projectedMetrics.impressions.toLocaleString()}
- Projected Clicks: ${projectedMetrics.clicks.toLocaleString()}
- Projected Conversions: ${projectedMetrics.conversions}
- Engagement Rate: ${projectedMetrics.engagementRate}%
- Follower Growth Projection: ${projectedMetrics.followerGrowth}
- Content Pieces Created: ${contentCount}
- Influencers Identified: ${influencerCount}

Performance vs Targets:
${comparison.map((c) => `- ${c.metric}: ${c.current} vs target ${c.target} (${c.status})`).join("\n")}`,
    { maxTokens: 2048, temperature: 0.6 }
  );

  let aiAnalysis: {
    summary: string;
    recommendations: string[];
    alerts: Array<{ type: "warning" | "success" | "info"; message: string }>;
  };

  try {
    const match = recommendationsRaw.match(/\{[\s\S]*\}/);
    aiAnalysis = JSON.parse(match?.[0] || recommendationsRaw);
  } catch {
    aiAnalysis = {
      summary: `Campaign for ${appName} shows ${comparison.filter((c) => c.status === "on_track" || c.status === "ahead").length}/${comparison.length} metrics on track. ${contentCount} content pieces and ${influencerCount} influencer targets generated.`,
      recommendations: [
        "Focus on TikTok content with proven hook formats for maximum reach",
        "Prioritize influencers with engagement rates above 5% for better ROI",
        "A/B test the first 5 captions before scaling",
        "Schedule posts during peak hours (7-9 AM, 12-2 PM, 7-10 PM)",
        "Engage with every comment in the first hour for algorithm boost",
      ],
      alerts: [
        { type: "info", message: "Campaign content generation complete" },
        {
          type: comparison.some((c) => c.status === "behind") ? "warning" : "success",
          message: comparison.some((c) => c.status === "behind")
            ? "Some metrics are below target - review recommendations"
            : "All metrics on track - maintain current strategy",
        },
      ],
    };
  }

  const result: AnalyticsResult = {
    summary: aiAnalysis.summary,
    metrics: projectedMetrics,
    recommendations: aiAnalysis.recommendations,
    alerts: aiAnalysis.alerts,
    comparisonVsTarget: comparison,
  };

  await db.updateCampaign(campaignId, {
    analytics_result: result as unknown as Record<string, unknown>,
  });

  // Send email alert
  const behindMetrics = comparison.filter((c) => c.status === "behind");
  if (behindMetrics.length > 0) {
    const emailSent = await sendEmailAlert(
      `[Growth Agent OS] Alert: ${behindMetrics.length} metrics behind target - ${appName}`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #e0e0e0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #FF7A45;">Growth Agent OS Alert</h1>
        <p>Campaign for <strong>${appName}</strong> has ${behindMetrics.length} metrics below target:</p>
        <ul>
          ${behindMetrics.map((m) => `<li><strong>${m.metric}:</strong> ${m.current} (target: ${m.target})</li>`).join("")}
        </ul>
        <h3 style="color: #7B5FFF;">Recommendations:</h3>
        <ul>
          ${aiAnalysis.recommendations.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      </div>`
    );

    if (emailSent) {
      await db.addLog(campaignId, "analytics", "info", "Email alert sent for underperforming metrics");
    }
  }

  await db.addLog(
    campaignId,
    "analytics",
    "success",
    `Analytics complete: ${comparison.filter((c) => c.status !== "behind").length}/${comparison.length} metrics on track`
  );

  return result;
}
