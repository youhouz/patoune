import { callClaude } from "@/lib/anthropic";
import { db } from "@/lib/supabase";

export interface ScraperResult {
  brandColors: string[];
  features: string[];
  tone: string;
  viralHooks: string[];
  targetAudience: string;
  pageTitle: string;
  metaDescription: string;
  screenshotUrl: string | null;
  rawData: {
    headings: string[];
    paragraphs: string[];
    links: string[];
  };
}

async function fetchWithBasicScrape(
  url: string
): Promise<{ html: string; title: string; description: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
    );

    return {
      html,
      title: titleMatch?.[1]?.trim() || "",
      description: descMatch?.[1]?.trim() || "",
    };
  } catch (error) {
    console.error("Basic fetch failed:", error);
    return { html: "", title: "", description: "" };
  }
}

async function scrapeWithPlaywright(
  url: string
): Promise<{
  html: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: string[];
  colors: string[];
} | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const data = await page.evaluate(() => {
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3")
      ).map((el) => el.textContent?.trim() || "");
      const paragraphs = Array.from(document.querySelectorAll("p"))
        .map((el) => el.textContent?.trim() || "")
        .filter((t) => t.length > 20)
        .slice(0, 20);
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((el) => ({
          text: el.textContent?.trim() || "",
          href: (el as HTMLAnchorElement).href,
        }))
        .filter((l) => l.text.length > 0)
        .slice(0, 30);

      const colors: string[] = [];
      const elements = document.querySelectorAll("*");
      const colorSet = new Set<string>();
      for (let i = 0; i < Math.min(elements.length, 100); i++) {
        const style = window.getComputedStyle(elements[i]);
        const bg = style.backgroundColor;
        const fg = style.color;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent")
          colorSet.add(bg);
        if (fg) colorSet.add(fg);
      }
      colors.push(...Array.from(colorSet).slice(0, 10));

      return {
        title: document.title,
        description:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || "",
        headings,
        paragraphs,
        links: links.map((l) => `${l.text}: ${l.href}`),
        colors,
      };
    });

    await browser.close();

    return {
      html: "",
      ...data,
    };
  } catch (error) {
    console.warn("Playwright not available, falling back to basic fetch:", error);
    return null;
  }
}

function extractFromHtml(html: string) {
  const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
  const headings: string[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text) headings.push(text);
  }

  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  const paragraphs: string[] = [];
  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text.length > 20) paragraphs.push(text);
  }

  const colorRegex =
    /#(?:[0-9a-fA-F]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  const colors: string[] = [];
  const colorSet = new Set<string>();
  while ((match = colorRegex.exec(html)) !== null) {
    colorSet.add(match[0]);
  }
  colors.push(...Array.from(colorSet).slice(0, 10));

  return {
    headings: headings.slice(0, 15),
    paragraphs: paragraphs.slice(0, 20),
    colors,
  };
}

export async function execute(
  campaignId: string,
  url: string,
  appName: string
): Promise<ScraperResult> {
  await db.addLog(campaignId, "scraper", "info", `Starting scrape of ${url}`);

  let pageTitle = "";
  let metaDescription = "";
  let headings: string[] = [];
  let paragraphs: string[] = [];
  let links: string[] = [];
  let colors: string[] = [];

  // Try Playwright first
  await db.addLog(
    campaignId,
    "scraper",
    "info",
    "Attempting Playwright browser scrape..."
  );
  const pwResult = await scrapeWithPlaywright(url);

  if (pwResult) {
    await db.addLog(
      campaignId,
      "scraper",
      "success",
      "Playwright scrape successful"
    );
    pageTitle = pwResult.title;
    metaDescription = pwResult.description;
    headings = pwResult.headings;
    paragraphs = pwResult.paragraphs;
    links = pwResult.links;
    colors = pwResult.colors;
  } else {
    // Fall back to basic fetch
    await db.addLog(
      campaignId,
      "scraper",
      "warn",
      "Playwright unavailable, using basic HTTP fetch"
    );
    const basicResult = await fetchWithBasicScrape(url);
    pageTitle = basicResult.title;
    metaDescription = basicResult.description;

    if (basicResult.html) {
      const extracted = extractFromHtml(basicResult.html);
      headings = extracted.headings;
      paragraphs = extracted.paragraphs;
      colors = extracted.colors;
    }
  }

  await db.addLog(
    campaignId,
    "scraper",
    "info",
    `Found ${headings.length} headings, ${paragraphs.length} paragraphs, ${colors.length} colors`
  );

  // Send to Claude for analysis
  await db.addLog(
    campaignId,
    "scraper",
    "info",
    "Sending data to Claude for brand analysis..."
  );

  const systemPrompt = `You are a growth hacking expert and brand scraper/analyzer. Analyze the following website data and extract key brand information. Return ONLY valid JSON with this exact structure:
{
  "brandColors": ["#hex1", "#hex2", "#hex3"],
  "features": ["feature1", "feature2", ...],
  "tone": "description of brand voice/tone",
  "viralHooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "targetAudience": "detailed description of target audience"
}`;

  const userData = `
App Name: ${appName}
URL: ${url}
Page Title: ${pageTitle}
Meta Description: ${metaDescription}

Headings found:
${headings.join("\n")}

Key paragraphs:
${paragraphs.slice(0, 10).join("\n\n")}

Colors detected:
${colors.join(", ")}

Links:
${links.slice(0, 15).join("\n")}
`;

  const claudeResponse = await callClaude(systemPrompt, userData);

  let analysis: {
    brandColors: string[];
    features: string[];
    tone: string;
    viralHooks: string[];
    targetAudience: string;
  };

  try {
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch?.[0] || claudeResponse);
  } catch {
    analysis = {
      brandColors: colors.length > 0 ? colors.slice(0, 3) : ["#7B5FFF", "#FF7A45", "#00D4A8"],
      features: headings.slice(0, 5).map((h) => h || "Key Feature"),
      tone: "Professional and modern",
      viralHooks: [
        `${appName} just changed the game`,
        `POV: You just discovered ${appName}`,
        `Why everyone is talking about ${appName}`,
        `${appName} is the tool you didn't know you needed`,
        `Stop scrolling, ${appName} will blow your mind`,
      ],
      targetAudience: "Tech-savvy professionals aged 22-40",
    };
  }

  await db.addLog(
    campaignId,
    "scraper",
    "success",
    `Brand analysis complete: ${analysis.features.length} features, ${analysis.viralHooks.length} hooks identified`
  );

  const result: ScraperResult = {
    ...analysis,
    pageTitle,
    metaDescription,
    screenshotUrl: null,
    rawData: { headings, paragraphs, links },
  };

  await db.updateCampaign(campaignId, {
    scraper_result: result as unknown as Record<string, unknown>,
  });

  return result;
}
