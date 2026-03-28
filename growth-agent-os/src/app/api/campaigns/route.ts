import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { url, appName, niche, platforms, goal } = body;

    if (!url || !appName) {
      return NextResponse.json(
        { error: "url and appName are required" },
        { status: 400 }
      );
    }

    const campaign = await db.createCampaign({
      app_url: url,
      app_name: appName,
      niche: niche || "general",
      platforms: platforms || ["TikTok"],
      goal: goal || "Maximize growth",
      status: "pending",
    });

    return NextResponse.json({ id: campaign.id, campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
