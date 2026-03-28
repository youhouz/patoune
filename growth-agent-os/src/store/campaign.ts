import { create } from "zustand";

export type AgentId =
  | "scraper"
  | "content_tiktok"
  | "content_insta"
  | "content_snap"
  | "seo_aso"
  | "prospection"
  | "outreach"
  | "analytics"
  | "report";

export type AgentStatus = "idle" | "configuring" | "running" | "done" | "error" | "paused";

export interface AgentLog {
  id: string;
  agent: AgentId;
  level: "info" | "warn" | "error" | "success";
  message: string;
  timestamp: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  emoji: string;
  description: string;
  color: string;
  category: "analyse" | "contenu" | "acquisition" | "reporting";
  enabled: boolean;
  settings: Record<string, string | number | boolean | string[]>;
}

export interface AgentState {
  status: AgentStatus;
  progress: number;
  lastMessage: string;
  logs: AgentLog[];
  output: Record<string, unknown> | null;
  startedAt: string | null;
}

export type ViewState = "login" | "cockpit";

interface CampaignStore {
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;

  view: ViewState;
  setView: (v: ViewState) => void;

  activeAgent: AgentId | "overview";
  setActiveAgent: (v: AgentId | "overview") => void;

  campaignId: string | null;
  setCampaignId: (id: string) => void;

  agentConfigs: Record<AgentId, AgentConfig>;
  updateAgentConfig: (id: AgentId, settings: Partial<AgentConfig["settings"]>) => void;
  toggleAgent: (id: AgentId) => void;

  agentStates: Record<AgentId, AgentState>;
  setAgentStatus: (id: AgentId, status: AgentStatus, message?: string) => void;
  setAgentProgress: (id: AgentId, progress: number) => void;
  addAgentLog: (log: AgentLog) => void;
  setAgentOutput: (id: AgentId, output: Record<string, unknown>) => void;

  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  globalLogs: AgentLog[];

  reset: () => void;
}

const defaultConfigs: Record<AgentId, AgentConfig> = {
  scraper: {
    id: "scraper",
    name: "Analyseur",
    emoji: "🔍",
    description: "Scrape pepete.fr + concurrents (Rover, Wamiz, Emprunte Mon Toutou)",
    color: "#FF7A45",
    category: "analyse",
    enabled: true,
    settings: {
      targetUrl: "https://pepete.fr",
      competitors: "rover.com,wamiz.com,empruntemontoutou.com,animaute.fr",
      depth: 3,
      analyzeScreenshots: true,
    },
  },
  content_tiktok: {
    id: "content_tiktok",
    name: "TikTok Creator",
    emoji: "🎵",
    description: "Génère hooks viraux, captions et scripts TikTok animaux",
    color: "#00F2EA",
    category: "contenu",
    enabled: true,
    settings: {
      postsPerBatch: 20,
      style: "storytelling-emotionnel",
      hashtags: "#pepete #animaux #chien #chat #petcare #pourtoi #fyp",
      language: "fr",
      targetAudience: "Propriétaires d'animaux 18-35 ans, France",
    },
  },
  content_insta: {
    id: "content_insta",
    name: "Instagram Creator",
    emoji: "📸",
    description: "Reels, carrousels et stories Instagram animaliers",
    color: "#E4405F",
    category: "contenu",
    enabled: true,
    settings: {
      reelsCount: 10,
      carouselsCount: 5,
      storiesCount: 15,
      style: "esthetique-premium",
      language: "fr",
    },
  },
  content_snap: {
    id: "content_snap",
    name: "Snap Creator",
    emoji: "👻",
    description: "Messages Snap naturels style bouche-à-oreille",
    color: "#FFFC00",
    category: "contenu",
    enabled: true,
    settings: {
      messagesCount: 15,
      style: "ami-qui-partage",
      language: "fr",
    },
  },
  seo_aso: {
    id: "seo_aso",
    name: "SEO & ASO",
    emoji: "🔎",
    description: "Mots-clés App Store/Play Store + SEO pepete.fr",
    color: "#4285F4",
    category: "analyse",
    enabled: true,
    settings: {
      keywords: "scanner croquettes,garde animaux,pet sitter,croquettes chien avis,alimentation chat",
      language: "fr",
      appStores: "ios,android",
    },
  },
  prospection: {
    id: "prospection",
    name: "Prospection",
    emoji: "🎯",
    description: "Trouve micro-influenceurs animaux FR (3k-100k abonnés)",
    color: "#FF5FA0",
    category: "acquisition",
    enabled: true,
    settings: {
      minFollowers: 3000,
      maxFollowers: 100000,
      minEngagement: 3,
      niches: "chien,chat,animaux,pet,veterinaire,toilettage",
      platforms: "tiktok,instagram",
      country: "FR",
      maxResults: 50,
    },
  },
  outreach: {
    id: "outreach",
    name: "Outreach DMs",
    emoji: "💌",
    description: "Génère DMs personnalisés pour chaque influenceur",
    color: "#7B5FFF",
    category: "acquisition",
    enabled: true,
    settings: {
      tone: "naturel-amical",
      offerType: "acces-gratuit-premium",
      followUp: true,
      language: "fr",
    },
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    emoji: "📊",
    description: "Projections de croissance, métriques et alertes",
    color: "#FFD166",
    category: "reporting",
    enabled: true,
    settings: {
      trackInstalls: true,
      trackEngagement: true,
      trackRetention: true,
    },
  },
  report: {
    id: "report",
    name: "Rapport",
    emoji: "📋",
    description: "Compile tout en rapport PDF + plan d'action 30 jours",
    color: "#4ADE80",
    category: "reporting",
    enabled: true,
    settings: {
      format: "pdf",
      includeCharts: true,
      language: "fr",
      planDuration: 30,
    },
  },
};

const initialStates: Record<AgentId, AgentState> = Object.fromEntries(
  Object.keys(defaultConfigs).map((id) => [
    id,
    { status: "idle" as AgentStatus, progress: 0, lastMessage: "", logs: [], output: null, startedAt: null },
  ])
) as Record<AgentId, AgentState>;

export const AGENT_IDS: AgentId[] = [
  "scraper", "content_tiktok", "content_insta", "content_snap",
  "seo_aso", "prospection", "outreach", "analytics", "report",
];

export const CATEGORIES = [
  { key: "analyse", label: "Analyse", emoji: "🔬" },
  { key: "contenu", label: "Contenu", emoji: "✏️" },
  { key: "acquisition", label: "Acquisition", emoji: "🚀" },
  { key: "reporting", label: "Reporting", emoji: "📈" },
] as const;

export const useCampaignStore = create<CampaignStore>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (v) => set({ isAuthenticated: v, view: v ? "cockpit" : "login" }),

  view: "login",
  setView: (v) => set({ view: v }),

  activeAgent: "overview",
  setActiveAgent: (v) => set({ activeAgent: v }),

  campaignId: null,
  setCampaignId: (id) => set({ campaignId: id }),

  agentConfigs: { ...defaultConfigs },
  updateAgentConfig: (id, settings) =>
    set((state) => ({
      agentConfigs: {
        ...state.agentConfigs,
        [id]: {
          ...state.agentConfigs[id],
          settings: { ...state.agentConfigs[id].settings, ...settings },
        },
      },
    })),
  toggleAgent: (id) =>
    set((state) => ({
      agentConfigs: {
        ...state.agentConfigs,
        [id]: { ...state.agentConfigs[id], enabled: !state.agentConfigs[id].enabled },
      },
    })),

  agentStates: { ...initialStates },
  setAgentStatus: (id, status, message) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [id]: {
          ...state.agentStates[id],
          status,
          lastMessage: message || state.agentStates[id].lastMessage,
          startedAt: status === "running" ? new Date().toISOString() : state.agentStates[id].startedAt,
        },
      },
    })),
  setAgentProgress: (id, progress) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [id]: { ...state.agentStates[id], progress },
      },
    })),
  addAgentLog: (log) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [log.agent]: {
          ...state.agentStates[log.agent],
          logs: [...state.agentStates[log.agent].logs, log],
        },
      },
      globalLogs: [...state.globalLogs, log],
    })),
  setAgentOutput: (id, output) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [id]: { ...state.agentStates[id], output },
      },
    })),

  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),
  globalLogs: [],

  reset: () =>
    set({
      campaignId: null,
      agentStates: { ...initialStates },
      isRunning: false,
      globalLogs: [],
      activeAgent: "overview",
    }),
}));
