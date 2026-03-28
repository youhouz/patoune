import { callClaude } from "@/lib/anthropic";
import { db } from "@/lib/supabase";
import type { ScraperResult } from "./scraper";

export interface Influencer {
  username: string;
  platform: string;
  followers: number;
  engagementRate: number;
  niche: string;
  relevanceScore: number;
  profileUrl: string;
  personalizedDM: string;
}

export interface ProspectionResult {
  influencers: Influencer[];
  totalFound: number;
  avgRelevance: number;
}

async function searchWithApify(
  niche: string,
  platforms: string[]
): Promise<Influencer[] | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token || token === "apify_api_...") return null;

  try {
    // Use Apify's TikTok/Instagram scraper actors
    const results: Influencer[] = [];

    for (const platform of platforms) {
      const actorId =
        platform.toLowerCase() === "tiktok"
          ? "clockworks~tiktok-scraper"
          : platform.toLowerCase() === "instagram"
          ? "apify~instagram-scraper"
          : null;

      if (!actorId) continue;

      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQueries: [niche],
            resultsPerPage: 30,
            maxItems: 30,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!runResponse.ok) continue;

      const runData = await runResponse.json();
      const runId = runData?.data?.id;
      if (!runId) continue;

      // Wait for run to complete (max 60s)
      let attempts = 0;
      let status = "RUNNING";
      while (status === "RUNNING" && attempts < 12) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
        );
        const statusData = await statusRes.json();
        status = statusData?.data?.status || "FAILED";
        attempts++;
      }

      if (status !== "SUCCEEDED") continue;

      const datasetRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}`
      );
      const items = await datasetRes.json();

      if (Array.isArray(items)) {
        for (const item of items.slice(0, 15)) {
          const followers =
            item.followersCount || item.followers || item.stats?.followers || 0;
          const er =
            item.engagementRate ||
            (item.stats?.avgLikes && item.stats?.followers
              ? (item.stats.avgLikes / item.stats.followers) * 100
              : 0);

          if (followers >= 3000 && followers <= 100000 && er >= 3) {
            results.push({
              username: item.username || item.profileName || "unknown",
              platform,
              followers,
              engagementRate: parseFloat(er.toFixed(1)),
              niche,
              relevanceScore: 0,
              profileUrl: item.url || item.profileUrl || `https://${platform.toLowerCase()}.com/@${item.username}`,
              personalizedDM: "",
            });
          }
        }
      }
    }

    return results.length > 0 ? results : null;
  } catch (error) {
    console.error("Apify search failed:", error);
    return null;
  }
}

function generateSimulatedInfluencers(
  niche: string,
  platforms: string[],
  appName: string
): Influencer[] {
  const niches: Record<string, string[]> = {
    tech: [
      "techreview_daily", "gadgetguru_", "apphunter", "codinglife_", "startupvibes",
      "digitaltools_", "techsavvy.gen", "productivitypro_", "devlife.tips", "futuretech_",
      "appoftheday_", "techmadeeasy", "innovations.daily", "geekculture_", "smarttech.picks",
      "buildthefuture_", "saaslover", "techtalks.daily", "nextbigapp_", "ai.explorer_",
      "webdev.tips_", "growthacker_", "launchpad.daily", "betalist.gems", "indiehackerlife",
      "nomadtech_", "creatortools_", "workflowpro_", "stackshare_", "toolsofday_",
    ],
    fitness: [
      "fitlife_daily", "gymflow_", "healthhacker_", "wellnesswarrior", "fitnesstips.daily",
      "workoutking_", "gains.culture", "mindbodysoul_", "yogaflow.daily", "fitnessjourney_",
      "healthyliving_", "gymrat.life", "trainhard.daily", "fitfam_", "bodybuilding.tips",
      "runnersworld_", "crossfit.daily", "nutrition.guide", "wellness.pro", "fitcoach_",
      "activelife_", "sportsnutrition_", "fitnessmodel_", "pilates.daily", "hiit.workouts",
      "strengthtraining_", "cardioking_", "flexibility_", "fitness.motivation", "healthyfood_",
    ],
    business: [
      "hustleculture_", "bizgrowth.tips", "startuplife_", "entrepreneur.daily", "moneymindset_",
      "salesguru_", "marketing.pro_", "leadgen.tips", "ecommerce.daily", "brandbuilder_",
      "sidehustle.king", "ceo.mindset_", "investing.101", "passiveincome_", "bizstrategy_",
      "growthhacking_", "revenue.daily", "bizcoach_", "founders.club", "scaling.up_",
      "b2b.growth_", "saasfounder_", "angel.investor_", "startup.grind_", "pitchdeck.pro",
      "venturecap_", "bizhacks_", "profitfirst_", "smallbiz.tips", "exec.coach_",
    ],
    default: [
      "trending.daily", "viralcontent_", "lifestyle.pro", "creator.hub_", "contentking_",
      "influence.daily", "growthmind_", "dailyinspo_", "trendsetters_", "buzzworthy_",
      "nextlevel.content", "viralhacks_", "contentcreator_", "socialmedia.tips", "growthtips_",
      "digitalcreator_", "engagementpro_", "followers.tips", "contentlab_", "mediamaker_",
      "creative.daily", "brandgrowth_", "audience.builder", "reach.daily", "impressions_",
      "socialstrategy_", "contenthub_", "platformpro_", "algorithm.tips", "creator.economy_",
    ],
  };

  const nicheKey = Object.keys(niches).find((k) =>
    niche.toLowerCase().includes(k)
  ) || "default";
  const usernames = niches[nicheKey];
  const usedPlatforms = platforms.length > 0 ? platforms : ["TikTok", "Instagram", "Snapchat"];

  return usernames.slice(0, 30).map((username, i) => {
    const platform = usedPlatforms[i % usedPlatforms.length];
    const followers = Math.floor(Math.random() * 85000) + 3000;
    const er = parseFloat((Math.random() * 8 + 3).toFixed(1));
    const relevance = Math.floor(Math.random() * 25 + 75);

    return {
      username,
      platform,
      followers,
      engagementRate: er,
      niche: nicheKey === "default" ? niche : nicheKey,
      relevanceScore: relevance,
      profileUrl: `https://${platform.toLowerCase().replace(" ", "")}.com/@${username}`,
      personalizedDM: `Hey @${username}! Love your ${nicheKey} content. We built ${appName} and think your ${followers > 50000 ? "amazing" : "growing"} audience of ${(followers / 1000).toFixed(1)}k would genuinely love it. Would you be open to checking it out? No strings attached!`,
    };
  });
}

export async function execute(
  campaignId: string,
  scraperResult: ScraperResult,
  appName: string,
  niche: string,
  platforms: string[]
): Promise<ProspectionResult> {
  await db.addLog(campaignId, "prospection", "info", "Starting influencer prospection...");

  let influencers: Influencer[] = [];

  // Try Apify first
  await db.addLog(campaignId, "prospection", "info", "Searching for micro-influencers (3k-100k followers, ER > 3%)...");
  const apifyResults = await searchWithApify(niche, platforms);

  if (apifyResults && apifyResults.length > 0) {
    await db.addLog(
      campaignId,
      "prospection",
      "success",
      `Found ${apifyResults.length} real influencers via Apify`
    );
    influencers = apifyResults;
  } else {
    await db.addLog(
      campaignId,
      "prospection",
      "warn",
      "Apify unavailable, generating simulated influencer profiles"
    );
    influencers = generateSimulatedInfluencers(niche, platforms, appName);
  }

  // Generate personalized DMs via Claude
  await db.addLog(campaignId, "prospection", "info", "Generating personalized DMs for each influencer...");

  const dmPrompt = `You are an influencer outreach specialist. For each influencer, write a highly personalized, friendly DM that:
- References their specific niche and content
- Mentions the app naturally
- Doesn't feel like a template
- Is under 300 characters
- Feels like a genuine fan reaching out

App: ${appName}
Brand Tone: ${scraperResult.tone}
Features: ${scraperResult.features.join(", ")}
Target Audience: ${scraperResult.targetAudience}

Influencers to write DMs for:
${influencers
  .slice(0, 30)
  .map(
    (inf, i) =>
      `${i + 1}. @${inf.username} (${inf.platform}, ${inf.followers} followers, ${inf.niche} niche)`
  )
  .join("\n")}

Return ONLY a JSON array of objects: [{"username": "...", "dm": "..."}]`;

  const dmResponse = await callClaude(
    "You generate personalized influencer DMs. Return only valid JSON.",
    dmPrompt,
    { maxTokens: 4096, temperature: 0.8 }
  );

  try {
    const match = dmResponse.match(/\[[\s\S]*\]/);
    const dms: Array<{ username: string; dm: string }> = match
      ? JSON.parse(match[0])
      : [];

    for (const dm of dms) {
      const inf = influencers.find((i) => i.username === dm.username);
      if (inf) inf.personalizedDM = dm.dm;
    }
  } catch {
    // Keep existing DMs if Claude response parsing fails
    await db.addLog(
      campaignId,
      "prospection",
      "warn",
      "Using template DMs (Claude personalization failed)"
    );
  }

  // Score and rank by relevance
  await db.addLog(campaignId, "prospection", "info", "Ranking influencers by relevance...");

  influencers.sort((a, b) => {
    const scoreA = a.relevanceScore + a.engagementRate * 5 + (a.followers < 50000 ? 10 : 0);
    const scoreB = b.relevanceScore + b.engagementRate * 5 + (b.followers < 50000 ? 10 : 0);
    return scoreB - scoreA;
  });

  const top30 = influencers.slice(0, 30);

  // Store influencers in DB
  for (const inf of top30) {
    try {
      await db.addInfluencer({
        campaign_id: campaignId,
        username: inf.username,
        platform: inf.platform,
        followers: inf.followers,
        engagement_rate: inf.engagementRate,
        niche: inf.niche,
        relevance_score: inf.relevanceScore,
        dm_message: inf.personalizedDM,
        profile_url: inf.profileUrl,
      });
    } catch (err) {
      console.error("Failed to store influencer:", err);
    }
  }

  const avgRelevance =
    top30.reduce((sum, i) => sum + i.relevanceScore, 0) / top30.length;

  const result: ProspectionResult = {
    influencers: top30,
    totalFound: top30.length,
    avgRelevance: parseFloat(avgRelevance.toFixed(1)),
  };

  await db.updateCampaign(campaignId, {
    prospection_result: result as unknown as Record<string, unknown>,
  });

  await db.addLog(
    campaignId,
    "prospection",
    "success",
    `Prospection complete: ${top30.length} influencers ranked, avg relevance ${avgRelevance.toFixed(1)}%`
  );

  return result;
}
