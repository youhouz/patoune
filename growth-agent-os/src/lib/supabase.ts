import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Campaign row type matching the actual SQL schema
export interface CampaignRow {
  id: string;
  user_id: string | null;
  app_url: string;
  app_name: string | null;
  niche: string | null;
  platforms: string[] | null;
  goal: string | null;
  status: string;
  created_at: string;
}

export interface AgentLogRow {
  id: string;
  campaign_id: string;
  agent_name: string;
  status: string;
  log_message: string | null;
  output_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ContentPieceRow {
  id: string;
  campaign_id: string;
  type: string;
  platform: string | null;
  content: string | null;
  score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface InfluencerRow {
  id: string;
  campaign_id: string;
  username: string | null;
  platform: string | null;
  followers: number | null;
  engagement: number | null;
  niche_score: number | null;
  dm_message: string | null;
  status: string;
  created_at: string;
}

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// In-memory fallback store when Supabase is not configured
const memoryStore: {
  campaigns: Map<string, CampaignRow>;
  agent_logs: Map<string, AgentLogRow[]>;
  content_pieces: Map<string, ContentPieceRow[]>;
  influencers: Map<string, InfluencerRow[]>;
} = {
  campaigns: new Map(),
  agent_logs: new Map(),
  content_pieces: new Map(),
  influencers: new Map(),
};

function generateId(): string {
  return crypto.randomUUID();
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://xxx.supabase.co"
  );
}

export const db = {
  async createCampaign(data: {
    user_id?: string | null;
    app_url: string;
    app_name?: string | null;
    niche?: string | null;
    platforms?: string[] | null;
    goal?: string | null;
    status?: string;
  }): Promise<CampaignRow> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data: row, error } = await supabase
        .from("campaigns")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return row as CampaignRow;
    }
    const campaign: CampaignRow = {
      id: generateId(),
      user_id: data.user_id || null,
      app_url: data.app_url,
      app_name: data.app_name || null,
      niche: data.niche || null,
      platforms: data.platforms || null,
      goal: data.goal || null,
      status: data.status || "pending",
      created_at: new Date().toISOString(),
    };
    memoryStore.campaigns.set(campaign.id, campaign);
    memoryStore.agent_logs.set(campaign.id, []);
    memoryStore.content_pieces.set(campaign.id, []);
    memoryStore.influencers.set(campaign.id, []);
    return campaign;
  },

  async getCampaign(id: string): Promise<CampaignRow | null> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as CampaignRow;
    }
    return memoryStore.campaigns.get(id) || null;
  },

  async updateCampaign(
    id: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return;
    }
    const existing = memoryStore.campaigns.get(id);
    if (existing) {
      memoryStore.campaigns.set(id, { ...existing, ...updates } as CampaignRow);
    }
  },

  async addLog(
    campaignId: string,
    agent: string,
    level: "info" | "warn" | "error" | "success",
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase.from("agent_logs").insert({
        campaign_id: campaignId,
        agent_name: agent,
        status: level,
        log_message: message,
        output_json: metadata || null,
      });
      if (error) throw error;
      return;
    }
    const logs = memoryStore.agent_logs.get(campaignId) || [];
    logs.push({
      id: generateId(),
      campaign_id: campaignId,
      agent_name: agent,
      status: level,
      log_message: message,
      output_json: metadata || null,
      created_at: new Date().toISOString(),
    });
    memoryStore.agent_logs.set(campaignId, logs);
  },

  async getLogs(campaignId: string): Promise<AgentLogRow[]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (error) return [];
      return data as AgentLogRow[];
    }
    return memoryStore.agent_logs.get(campaignId) || [];
  },

  async addContentPiece(data: {
    campaign_id: string;
    type: string;
    platform?: string | null;
    content?: string | null;
    score?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase.from("content_pieces").insert(data);
      if (error) throw error;
      return;
    }
    const pieces = memoryStore.content_pieces.get(data.campaign_id) || [];
    pieces.push({
      id: generateId(),
      campaign_id: data.campaign_id,
      type: data.type,
      platform: data.platform || null,
      content: data.content || null,
      score: data.score || null,
      metadata: data.metadata || null,
      created_at: new Date().toISOString(),
    });
    memoryStore.content_pieces.set(data.campaign_id, pieces);
  },

  async getContentPieces(campaignId: string): Promise<ContentPieceRow[]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (error) return [];
      return data as ContentPieceRow[];
    }
    return memoryStore.content_pieces.get(campaignId) || [];
  },

  async addInfluencer(data: Record<string, unknown> & { campaign_id: string }): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase.from("influencers").insert(data);
      if (error) throw error;
      return;
    }
    const influencers = memoryStore.influencers.get(data.campaign_id) || [];
    influencers.push({
      id: generateId(),
      campaign_id: data.campaign_id,
      username: (data.username as string) || null,
      platform: (data.platform as string) || null,
      followers: (data.followers as number) || null,
      engagement: (data.engagement as number) || null,
      niche_score: (data.niche_score as number) || null,
      dm_message: (data.dm_message as string) || null,
      status: (data.status as string) || "pending",
      created_at: new Date().toISOString(),
    });
    memoryStore.influencers.set(data.campaign_id, influencers);
  },

  async getInfluencers(campaignId: string): Promise<InfluencerRow[]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("influencers")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("niche_score", { ascending: false });
      if (error) return [];
      return data as InfluencerRow[];
    }
    return (memoryStore.influencers.get(campaignId) || []).sort(
      (a, b) => (b.niche_score || 0) - (a.niche_score || 0)
    );
  },
};
