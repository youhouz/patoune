import { callClaude } from "@/lib/anthropic";
import { db } from "@/lib/supabase";
import type { ScraperResult } from "./scraper";

export interface ContentResult {
  tiktokCaptions: Array<{
    hook: string;
    caption: string;
    hashtags: string[];
  }>;
  snapchatMessages: Array<{
    message: string;
    style: string;
  }>;
  videoScripts: Array<{
    title: string;
    hook: string;
    story: string;
    cta: string;
    duration: string;
  }>;
  influencerDMs: Array<{
    message: string;
    tone: string;
  }>;
  strategy14Days: Array<{
    day: number;
    theme: string;
    tasks: string[];
    platforms: string[];
    kpi: string;
  }>;
}

export async function execute(
  campaignId: string,
  scraperResult: ScraperResult,
  appName: string,
  niche: string,
  platforms: string[]
): Promise<ContentResult> {
  await db.addLog(campaignId, "content", "info", "Starting content generation engine...");

  const brandContext = `
App: ${appName}
Niche: ${niche}
Target Platforms: ${platforms.join(", ")}
Brand Colors: ${scraperResult.brandColors.join(", ")}
Tone: ${scraperResult.tone}
Features: ${scraperResult.features.join(", ")}
Target Audience: ${scraperResult.targetAudience}
Viral Hooks Already Identified: ${scraperResult.viralHooks.join(" | ")}
`;

  // Run all content generation in parallel
  await db.addLog(campaignId, "content", "info", "Launching parallel content generation (5 streams)...");

  const [tiktokRaw, snapchatRaw, scriptsRaw, dmsRaw, strategyRaw] =
    await Promise.all([
      // TikTok Captions
      callClaude(
        `You are a viral TikTok content strategist. Generate exactly 20 TikTok captions for the app described. Each must have a scroll-stopping hook, engaging caption, and relevant hashtags. Return ONLY valid JSON array with objects: {"hook": "...", "caption": "...", "hashtags": ["...", "..."]}. No markdown, no explanation.`,
        `Generate 20 TikTok captions for:\n${brandContext}`,
        { maxTokens: 4096, temperature: 0.9 }
      ),

      // Snapchat Messages
      callClaude(
        `You are a Gen-Z Snapchat marketing expert. Generate exactly 10 Snapchat messages that feel natural and non-commercial. They should feel like a friend sharing a cool discovery. Return ONLY valid JSON array with objects: {"message": "...", "style": "..."}. No markdown.`,
        `Generate 10 natural Snapchat messages for:\n${brandContext}`,
        { maxTokens: 2048, temperature: 0.9 }
      ),

      // Video Scripts
      callClaude(
        `You are a viral video scriptwriter. Generate exactly 5 video scripts, each 60 seconds, with Hook/Story/CTA structure. Return ONLY valid JSON array with objects: {"title": "...", "hook": "...", "story": "...", "cta": "...", "duration": "60s"}. No markdown.`,
        `Generate 5 x 60-second video scripts for:\n${brandContext}`,
        { maxTokens: 4096, temperature: 0.8 }
      ),

      // Influencer DMs
      callClaude(
        `You are an influencer outreach expert. Generate exactly 8 personalized DM templates for reaching out to micro-influencers. Each must feel authentic, non-spammy, and personalized. Return ONLY valid JSON array with objects: {"message": "...", "tone": "..."}. No markdown.`,
        `Generate 8 influencer DM templates for:\n${brandContext}`,
        { maxTokens: 2048, temperature: 0.8 }
      ),

      // 14-Day Strategy
      callClaude(
        `You are a growth hacking strategist. Create a complete 14-day growth strategy. Return ONLY valid JSON array with exactly 14 objects: {"day": 1, "theme": "...", "tasks": ["...", "..."], "platforms": ["..."], "kpi": "..."}. No markdown.`,
        `Create a 14-day growth plan for:\n${brandContext}`,
        { maxTokens: 4096, temperature: 0.7 }
      ),
    ]);

  await db.addLog(campaignId, "content", "info", "Parsing generated content...");

  function parseJsonArray<T>(raw: string, fallback: T[]): T[] {
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      return JSON.parse(raw);
    } catch {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const keys = Object.keys(parsed);
          for (const key of keys) {
            if (Array.isArray(parsed[key])) return parsed[key];
          }
        }
      } catch {
        // fallthrough
      }
      return fallback;
    }
  }

  const tiktokCaptions = parseJsonArray(tiktokRaw, generateFallbackTiktok(appName, scraperResult));
  const snapchatMessages = parseJsonArray(snapchatRaw, generateFallbackSnap(appName));
  const videoScripts = parseJsonArray(scriptsRaw, generateFallbackScripts(appName, scraperResult));
  const influencerDMs = parseJsonArray(dmsRaw, generateFallbackDMs(appName));
  const strategy14Days = parseJsonArray(strategyRaw, generateFallbackStrategy(appName, platforms));

  await db.addLog(
    campaignId,
    "content",
    "success",
    `Content generated: ${tiktokCaptions.length} TikToks, ${snapchatMessages.length} Snaps, ${videoScripts.length} scripts, ${influencerDMs.length} DMs, ${strategy14Days.length} day plan`
  );

  // Store content pieces in DB
  const contentPieces = [
    ...tiktokCaptions.map((c: { hook: string; caption: string; hashtags: string[] }) => ({
      campaign_id: campaignId,
      type: "tiktok_caption",
      platform: "TikTok",
      content: `${c.hook}\n\n${c.caption}\n\n${(c.hashtags || []).join(" ")}`,
      metadata: c as unknown as Record<string, unknown>,
    })),
    ...snapchatMessages.map((s: { message: string; style: string }) => ({
      campaign_id: campaignId,
      type: "snapchat_message",
      platform: "Snapchat",
      content: s.message,
      metadata: s as unknown as Record<string, unknown>,
    })),
    ...videoScripts.map((v: { title: string; hook: string; story: string; cta: string; duration: string }) => ({
      campaign_id: campaignId,
      type: "video_script",
      platform: "Multi",
      content: `# ${v.title}\n\n**Hook:** ${v.hook}\n\n**Story:** ${v.story}\n\n**CTA:** ${v.cta}\n\n_Duration: ${v.duration}_`,
      metadata: v as unknown as Record<string, unknown>,
    })),
    ...influencerDMs.map((d: { message: string; tone: string }) => ({
      campaign_id: campaignId,
      type: "influencer_dm",
      platform: "Multi",
      content: d.message,
      metadata: d as unknown as Record<string, unknown>,
    })),
  ];

  for (const piece of contentPieces) {
    try {
      await db.addContentPiece(piece);
    } catch (err) {
      console.error("Failed to store content piece:", err);
    }
  }

  const result: ContentResult = {
    tiktokCaptions,
    snapchatMessages,
    videoScripts,
    influencerDMs,
    strategy14Days,
  };

  await db.updateCampaign(campaignId, {
    content_result: result as unknown as Record<string, unknown>,
  });

  await db.addLog(campaignId, "content", "success", "All content stored successfully");

  return result;
}

function generateFallbackTiktok(appName: string, scraper: ScraperResult) {
  const hooks = [
    "Wait for it...", "POV:", "This changes everything.", "No one talks about this.",
    "I tested this for 30 days.", "Stop scrolling.", "The secret no one shares.",
    "Game changer alert.", "You need to see this.", "Unpopular opinion:",
    "Day 1 of using", "This app is insane.", "How did I not know about this?",
    "Trust me on this one.", "Life hack:", "Free tool alert.",
    "I'm obsessed with this.", "Hear me out.", "Not sponsored, just impressed.",
    "The algorithm showed me this.",
  ];

  return hooks.map((hook, i) => ({
    hook: `${hook} ${i < 5 ? appName : ""}`.trim(),
    caption: `${scraper.viralHooks[i % scraper.viralHooks.length] || "Check this out"} - ${scraper.features[i % scraper.features.length] || "amazing feature"} #fyp`,
    hashtags: ["#fyp", "#viral", `#${appName.toLowerCase().replace(/\s/g, "")}`, "#tech", "#productivity"],
  }));
}

function generateFallbackSnap(appName: string) {
  return Array.from({ length: 10 }, (_, i) => ({
    message: [
      `yo you NEED to try ${appName}`,
      `ok i found the best app ever lol`,
      `why did nobody tell me about ${appName}`,
      `currently obsessed with this app ngl`,
      `${appName} just saved me like 3 hours`,
      `bro this app is actually insane`,
      `me @ everyone: download ${appName} rn`,
      `not me becoming a ${appName} evangelist`,
      `the way ${appName} just changed my life`,
      `sending this to everyone i know - try ${appName}`,
    ][i],
    style: "casual, authentic, gen-z",
  }));
}

function generateFallbackScripts(appName: string, scraper: ScraperResult) {
  return Array.from({ length: 5 }, (_, i) => ({
    title: `${appName} - Script ${i + 1}`,
    hook: scraper.viralHooks[i] || `This tool changed everything for me`,
    story: `I used to waste hours on manual work. Then I discovered ${appName}. ${scraper.features[i % scraper.features.length] || "Its core feature"} alone saves me 2 hours daily. But the real magic is how it all works together seamlessly.`,
    cta: `Link in bio. Try ${appName} free today. Your future self will thank you.`,
    duration: "60s",
  }));
}

function generateFallbackDMs(appName: string) {
  return Array.from({ length: 8 }, (_, i) => ({
    message: [
      `Hey! Huge fan of your content. We built ${appName} and think your audience would genuinely love it. Would you be open to trying it out?`,
      `Hi there! Your posts about productivity always resonate with me. ${appName} aligns perfectly with what you share. Mind if I send you access?`,
      `Love what you're building! ${appName} was made for creators like you. No pressure, but would love your honest take on it.`,
      `Hey! Quick one - ${appName} is helping people save hours/week. Your audience would benefit massively. Interested in a collab?`,
      `Hi! Followed you for a while. ${appName} fits your niche perfectly. Would love to offer you and your community exclusive early access.`,
      `Hey! No pitch, just wanted to share ${appName} because it genuinely aligns with your content. Let me know if you'd like to check it out!`,
      `Hi! Saw your latest post and immediately thought of ${appName}. Would love to chat about a potential partnership if you're open to it.`,
      `Hey! We're fans of your work. ${appName} was built for exactly the audience you serve. Can I send you a demo?`,
    ][i],
    tone: ["friendly", "authentic", "professional", "casual", "generous", "genuine", "relevant", "direct"][i],
  }));
}

function generateFallbackStrategy(appName: string, platforms: string[]) {
  const themes = [
    "Foundation", "Foundation", "Foundation",
    "Activation", "Activation", "Activation", "Activation",
    "Growth", "Growth", "Growth", "Growth",
    "Optimization", "Optimization", "Optimization",
  ];
  return Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    theme: themes[i],
    tasks: [
      i < 3
        ? `Set up ${appName} profiles on ${platforms.join(", ")}`
        : i < 7
        ? `Post viral content and engage with target audience`
        : i < 11
        ? `Scale winning content, launch influencer partnerships`
        : `Analyze metrics, double down on top performers`,
      `Monitor engagement and respond to all comments within 1 hour`,
      `Document results for iteration`,
    ],
    platforms: platforms.length > 0 ? platforms : ["TikTok", "Snapchat", "Instagram"],
    kpi: i < 3 ? "Profile completeness, first 100 followers" : i < 7 ? "Engagement rate >5%, 1000+ impressions/post" : i < 11 ? "Follower growth rate, conversion rate" : "ROI, cost per acquisition, retention",
  }));
}
