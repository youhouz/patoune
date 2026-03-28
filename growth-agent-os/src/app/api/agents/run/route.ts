import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { execute as runOrchestrator } from "@/agents/orchestrator";

// Store running campaigns to prevent duplicates
const runningCampaigns = new Set<string>();

async function tryBullMQ(
  campaignId: string,
  config: {
    url: string;
    appName: string;
    niche: string;
    platforms: string[];
    goal: string;
  }
): Promise<boolean> {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl === "redis://localhost:6379") {
      return false;
    }

    const { Queue } = await import("bullmq");
    const IORedis = (await import("ioredis")).default;

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const queue = new Queue("growth-agents", { connection });

    await queue.add("orchestrate", {
      campaignId,
      ...config,
    });

    await connection.quit();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    const campaign = await db.getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (runningCampaigns.has(campaignId)) {
      return NextResponse.json(
        { error: "Campaign is already running" },
        { status: 409 }
      );
    }

    const config = {
      url: campaign.app_url,
      appName: campaign.app_name || "",
      niche: campaign.niche || "general",
      platforms: campaign.platforms || ["TikTok"],
      goal: campaign.goal || "Maximize growth",
    };

    // Try BullMQ first for proper queue handling
    const queued = await tryBullMQ(campaignId, config);

    if (queued) {
      return NextResponse.json(
        { message: "Campaign queued via BullMQ", campaignId },
        { status: 202 }
      );
    }

    // Fall back to direct execution (non-blocking)
    runningCampaigns.add(campaignId);

    // Fire and forget - don't await
    runOrchestrator({
      campaignId,
      ...config,
    })
      .catch((err) => {
        console.error("Orchestrator failed:", err);
        db.addLog(
          campaignId,
          "orchestrator",
          "error",
          `Fatal error: ${err.message}`
        );
        db.updateCampaign(campaignId, { status: "failed" });
      })
      .finally(() => {
        runningCampaigns.delete(campaignId);
      });

    return NextResponse.json(
      { message: "Campaign started (direct execution)", campaignId },
      { status: 202 }
    );
  } catch (error) {
    console.error("Failed to start agents:", error);
    return NextResponse.json(
      { error: "Failed to start agents" },
      { status: 500 }
    );
  }
}
