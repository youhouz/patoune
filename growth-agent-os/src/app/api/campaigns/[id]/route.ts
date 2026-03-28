import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.getCampaign(id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const logs = await db.getLogs(id);
    const contentPieces = await db.getContentPieces(id);
    const influencers = await db.getInfluencers(id);

    return NextResponse.json({
      campaign,
      logs,
      contentPieces,
      influencers,
    });
  } catch (error) {
    console.error("Failed to get campaign:", error);
    return NextResponse.json(
      { error: "Failed to get campaign" },
      { status: 500 }
    );
  }
}
