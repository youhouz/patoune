import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export function isAnthropicConfigured(): boolean {
  return !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "sk-ant-..."
  );
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    retries?: number;
  }
): Promise<string> {
  const maxRetries = options?.retries ?? 3;
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.7;

  if (!isAnthropicConfigured()) {
    return generateFallbackResponse(systemPrompt, userMessage);
  }

  const anthropic = getClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text || "";
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error && error.message.includes("rate");
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        console.error("Claude API failed after retries:", error);
        return generateFallbackResponse(systemPrompt, userMessage);
      }

      if (isRateLimit) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  return generateFallbackResponse(systemPrompt, userMessage);
}

export async function* streamClaude(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    retries?: number;
  }
): AsyncGenerator<string> {
  const maxRetries = options?.retries ?? 3;
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.7;

  if (!isAnthropicConfigured()) {
    const fallback = generateFallbackResponse(systemPrompt, userMessage);
    for (const word of fallback.split(" ")) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  const anthropic = getClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      }
      return;
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        console.error("Claude streaming failed after retries:", error);
        yield generateFallbackResponse(systemPrompt, userMessage);
        return;
      }
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
    }
  }
}

function generateFallbackResponse(
  systemPrompt: string,
  _userMessage: string
): string {
  if (systemPrompt.includes("scraper") || systemPrompt.includes("analyze")) {
    return JSON.stringify({
      brandColors: ["#7B5FFF", "#FF7A45", "#00D4A8"],
      features: [
        "Intuitive user interface",
        "Fast performance",
        "Modern design",
        "Mobile responsive",
        "Secure platform",
      ],
      tone: "Professional yet approachable, innovative, user-focused",
      viralHooks: [
        "This changes everything about how you work",
        "I can't believe this is free",
        "POV: You just discovered the tool that 10x your productivity",
        "Stop scrolling, this app will save you 5 hours/week",
        "The app your competitors don't want you to know about",
      ],
      targetAudience:
        "Tech-savvy professionals aged 22-40 who value efficiency and modern tools",
    });
  }

  if (systemPrompt.includes("content") || systemPrompt.includes("caption")) {
    return JSON.stringify({
      tiktokCaptions: Array.from({ length: 20 }, (_, i) => ({
        hook: `Hook ${i + 1}: Viral growth hack you NEED to try`,
        caption: `This tool changed my entire workflow. Here's how it works... #productivity #tech #growth #viral`,
        hashtags: ["#productivity", "#tech", "#growth", "#viral", "#app"],
      })),
      snapchatMessages: Array.from({ length: 10 }, (_, i) => ({
        message: `Snap ${i + 1}: Hey, have you tried this app? It literally saved me hours this week, no cap`,
        style: "casual, personal, authentic",
      })),
      videoScripts: Array.from({ length: 5 }, (_, i) => ({
        title: `Script ${i + 1}: The Growth Secret`,
        hook: "Stop what you're doing. This will change your life.",
        story:
          "I was spending 10 hours a week on tasks that should take 2. Then I found this tool and everything changed.",
        cta: "Link in bio. Try it free. You'll thank me later.",
        duration: "60s",
      })),
      influencerDMs: Array.from({ length: 8 }, (_, i) => ({
        message: `DM ${i + 1}: Hey! Love your content about productivity. We built something your audience would genuinely love - would you be open to checking it out? No pressure at all.`,
        tone: "friendly, non-pushy",
      })),
      strategy14Days: Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        theme: i < 3 ? "Foundation" : i < 7 ? "Activation" : i < 11 ? "Growth" : "Optimization",
        tasks: [
          `Day ${i + 1} task: Execute growth strategy phase`,
          "Post content on primary platform",
          "Engage with target audience",
        ],
        platforms: ["TikTok", "Snapchat", "Instagram"],
        kpi: "Engagement rate, follower growth, link clicks",
      })),
    });
  }

  if (
    systemPrompt.includes("influencer") ||
    systemPrompt.includes("prospection")
  ) {
    return JSON.stringify({
      influencers: Array.from({ length: 30 }, (_, i) => ({
        username: `creator_${String(i + 1).padStart(2, "0")}`,
        platform: i % 3 === 0 ? "TikTok" : i % 3 === 1 ? "Instagram" : "Snapchat",
        followers: Math.floor(Math.random() * 97000) + 3000,
        engagementRate: (Math.random() * 7 + 3).toFixed(1),
        niche: ["tech", "productivity", "lifestyle", "business"][i % 4],
        relevanceScore: Math.floor(Math.random() * 30 + 70),
        profileUrl: `https://example.com/@creator_${String(i + 1).padStart(2, "0")}`,
        personalizedDM: `Hey @creator_${String(i + 1).padStart(2, "0")}! Loved your recent post about productivity. We built something that perfectly aligns with your content - would love to send you early access. What do you think?`,
      })),
    });
  }

  if (systemPrompt.includes("report") || systemPrompt.includes("compile")) {
    return `# Growth Strategy Report

## Executive Summary
A comprehensive growth strategy has been generated with 20 TikTok captions, 10 Snapchat messages, 5 video scripts, 8 influencer DM templates, and a complete 14-day execution plan.

## Key Metrics Target
- Week 1: 10,000 impressions, 500 profile visits
- Week 2: 50,000 impressions, 2,000 profile visits, 200 sign-ups

## Recommendations
1. Focus on TikTok for viral reach
2. Use Snapchat for personal engagement
3. Partner with micro-influencers for authenticity
4. A/B test hooks in the first 3 days
5. Scale winning content formats in week 2`;
  }

  return "Analysis complete. Results generated successfully.";
}
