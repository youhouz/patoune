import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          url: string;
          app_name: string;
          niche: string;
          platforms: string[];
          goal: string;
          status: "pending" | "running" | "completed" | "failed";
          scraper_result: Record<string, unknown> | null;
          content_result: Record<string, unknown> | null;
          prospection_result: Record<string, unknown> | null;
          analytics_result: Record<string, unknown> | null;
          report_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      agent_logs: {
        Row: {
          id: string;
          campaign_id: string;
          agent: string;
          level: "info" | "warn" | "error" | "success";
          message: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["agent_logs"]["Insert"]>;
      };
      content_pieces: {
        Row: {
          id: string;
          campaign_id: string;
          type: string;
          platform: string;
          content: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["content_pieces"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["content_pieces"]["Insert"]>;
      };
      influencers: {
        Row: {
          id: string;
          campaign_id: string;
          username: string;
          platform: string;
          followers: number;
          engagement_rate: number;
          niche: string;
          relevance_score: number;
          dm_message: string;
          profile_url: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["influencers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["influencers"]["Insert"]>;
      };
    };
  };
};

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createServerSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// In-memory fallback store when Supabase is not configured
const memoryStore: {
  campaigns: Map<string, Database["public"]["Tables"]["campaigns"]["Row"]>;
  agent_logs: Map<string, Database["public"]["Tables"]["agent_logs"]["Row"][]>;
  content_pieces: Map<string, Database["public"]["Tables"]["content_pieces"]["Row"][]>;
  influencers: Map<string, Database["public"]["Tables"]["influencers"]["Row"][]>;
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
  async createCampaign(
    data: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at" | "scraper_result" | "content_result" | "prospection_result" | "analytics_result" | "report_url">
  ): Promise<Database["public"]["Tables"]["campaigns"]["Row"]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data: row, error } = await supabase
        .from("campaigns")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return row;
    }
    const campaign: Database["public"]["Tables"]["campaigns"]["Row"] = {
      id: generateId(),
      ...data,
      scraper_result: null,
      content_result: null,
      prospection_result: null,
      analytics_result: null,
      report_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.campaigns.set(campaign.id, campaign);
    memoryStore.agent_logs.set(campaign.id, []);
    memoryStore.content_pieces.set(campaign.id, []);
    memoryStore.influencers.set(campaign.id, []);
    return campaign;
  },

  async getCampaign(id: string): Promise<Database["public"]["Tables"]["campaigns"]["Row"] | null> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }
    return memoryStore.campaigns.get(id) || null;
  },

  async updateCampaign(
    id: string,
    updates: Partial<Database["public"]["Tables"]["campaigns"]["Row"]>
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase
        .from("campaigns")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return;
    }
    const existing = memoryStore.campaigns.get(id);
    if (existing) {
      memoryStore.campaigns.set(id, {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["campaigns"]["Row"]);
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
        agent,
        level,
        message,
        metadata: metadata || null,
      });
      if (error) throw error;
      return;
    }
    const logs = memoryStore.agent_logs.get(campaignId) || [];
    logs.push({
      id: generateId(),
      campaign_id: campaignId,
      agent,
      level,
      message,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    });
    memoryStore.agent_logs.set(campaignId, logs);
  },

  async getLogs(campaignId: string): Promise<Database["public"]["Tables"]["agent_logs"]["Row"][]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (error) return [];
      return data;
    }
    return memoryStore.agent_logs.get(campaignId) || [];
  },

  async addContentPiece(
    data: Database["public"]["Tables"]["content_pieces"]["Insert"]
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase.from("content_pieces").insert(data);
      if (error) throw error;
      return;
    }
    const pieces = memoryStore.content_pieces.get(data.campaign_id) || [];
    pieces.push({
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
    });
    memoryStore.content_pieces.set(data.campaign_id, pieces);
  },

  async getContentPieces(campaignId: string): Promise<Database["public"]["Tables"]["content_pieces"]["Row"][]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (error) return [];
      return data;
    }
    return memoryStore.content_pieces.get(campaignId) || [];
  },

  async addInfluencer(
    data: Database["public"]["Tables"]["influencers"]["Insert"]
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { error } = await supabase.from("influencers").insert(data);
      if (error) throw error;
      return;
    }
    const influencers = memoryStore.influencers.get(data.campaign_id) || [];
    influencers.push({
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
    });
    memoryStore.influencers.set(data.campaign_id, influencers);
  },

  async getInfluencers(campaignId: string): Promise<Database["public"]["Tables"]["influencers"]["Row"][]> {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("influencers")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("relevance_score", { ascending: false });
      if (error) return [];
      return data;
    }
    return (memoryStore.influencers.get(campaignId) || []).sort(
      (a, b) => b.relevance_score - a.relevance_score
    );
  },
};
