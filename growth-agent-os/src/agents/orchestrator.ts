import { db } from "@/lib/supabase";
import * as scraper from "./scraper";
import * as content from "./content";
import * as prospection from "./prospection";
import * as analytics from "./analytics";
import * as report from "./report";

export interface CampaignConfig {
  campaignId: string;
  url: string;
  appName: string;
  niche: string;
  platforms: string[];
  goal: string;
}

export interface OrchestrationResult {
  campaignId: string;
  status: "completed" | "failed";
  scraperResult: scraper.ScraperResult | null;
  contentResult: content.ContentResult | null;
  prospectionResult: prospection.ProspectionResult | null;
  analyticsResult: analytics.AnalyticsResult | null;
  reportResult: report.ReportResult | null;
  error?: string;
}

export async function execute(config: CampaignConfig): Promise<OrchestrationResult> {
  const { campaignId, url, appName, niche, platforms, goal } = config;

  await db.updateCampaign(campaignId, { status: "running" });
  await db.addLog(
    campaignId,
    "orchestrator",
    "info",
    `Mission initiated: ${appName} (${url})`
  );
  await db.addLog(
    campaignId,
    "orchestrator",
    "info",
    `Goal: ${goal} | Niche: ${niche} | Platforms: ${platforms.join(", ")}`
  );

  let scraperResult: scraper.ScraperResult | null = null;
  let contentResult: content.ContentResult | null = null;
  let prospectionResult: prospection.ProspectionResult | null = null;
  let analyticsResult: analytics.AnalyticsResult | null = null;
  let reportResult: report.ReportResult | null = null;

  try {
    // Phase 1: Scraper
    await db.addLog(
      campaignId,
      "orchestrator",
      "info",
      "Phase 1/4: Launching Scraper Agent..."
    );
    scraperResult = await scraper.execute(campaignId, url, appName);
    await db.addLog(
      campaignId,
      "orchestrator",
      "success",
      "Phase 1 complete: Brand analysis ready"
    );

    // Phase 2: Content + Prospection in parallel
    await db.addLog(
      campaignId,
      "orchestrator",
      "info",
      "Phase 2/4: Launching Content + Prospection Agents in parallel..."
    );

    const [contentRes, prospectionRes] = await Promise.all([
      content
        .execute(campaignId, scraperResult, appName, niche, platforms)
        .catch((err) => {
          db.addLog(
            campaignId,
            "orchestrator",
            "error",
            `Content agent failed: ${err.message}`
          );
          return null;
        }),
      prospection
        .execute(campaignId, scraperResult, appName, niche, platforms)
        .catch((err) => {
          db.addLog(
            campaignId,
            "orchestrator",
            "error",
            `Prospection agent failed: ${err.message}`
          );
          return null;
        }),
    ]);

    contentResult = contentRes;
    prospectionResult = prospectionRes;

    await db.addLog(
      campaignId,
      "orchestrator",
      "success",
      "Phase 2 complete: Content and influencer data ready"
    );

    // Phase 3: Analytics
    await db.addLog(
      campaignId,
      "orchestrator",
      "info",
      "Phase 3/4: Launching Analytics Agent..."
    );
    analyticsResult = await analytics.execute(campaignId, appName);
    await db.addLog(
      campaignId,
      "orchestrator",
      "success",
      "Phase 3 complete: Analytics and projections ready"
    );

    // Phase 4: Report
    await db.addLog(
      campaignId,
      "orchestrator",
      "info",
      "Phase 4/4: Launching Report Agent..."
    );

    if (scraperResult && contentResult && prospectionResult && analyticsResult) {
      reportResult = await report.execute(
        campaignId,
        appName,
        url,
        scraperResult,
        contentResult,
        prospectionResult,
        analyticsResult
      );
    } else {
      await db.addLog(
        campaignId,
        "report",
        "warn",
        "Skipping full report - some agent data missing"
      );
    }

    await db.addLog(
      campaignId,
      "orchestrator",
      "success",
      "All phases complete. Mission accomplished."
    );
    await db.updateCampaign(campaignId, { status: "completed" });

    return {
      campaignId,
      status: "completed",
      scraperResult,
      contentResult,
      prospectionResult,
      analyticsResult,
      reportResult,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await db.addLog(
      campaignId,
      "orchestrator",
      "error",
      `Mission failed: ${errorMessage}`
    );
    await db.updateCampaign(campaignId, { status: "failed" });

    return {
      campaignId,
      status: "failed",
      scraperResult,
      contentResult,
      prospectionResult,
      analyticsResult,
      reportResult,
      error: errorMessage,
    };
  }
}
