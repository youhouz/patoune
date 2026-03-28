import { create } from "zustand";

export type AgentId =
  | "analyst"
  | "email_campaign"
  | "article_writer"
  | "directory_submit"
  | "influencer_email"
  | "forum_commenter"
  | "backlink_builder"
  | "review_booster"
  | "content_tiktok"
  | "content_insta"
  | "social_commenter"
  | "press_release";

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
  category: "analyse" | "contenu" | "distribution" | "emails" | "seo";
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
  actionsTaken: number;
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
  incrementActions: (id: AgentId) => void;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  globalLogs: AgentLog[];
  totalActions: number;
  reset: () => void;
}

const defaultConfigs: Record<AgentId, AgentConfig> = {
  analyst: {
    id: "analyst",
    name: "Analyste",
    emoji: "🔍",
    description: "Analyse Pepete + concurrents, definit la strategie globale",
    color: "#FF7A45",
    category: "analyse",
    enabled: true,
    settings: {
      targetUrl: "https://pepete.fr",
      competitors: "rover.com,wamiz.com,empruntemontoutou.com,animaute.fr",
    },
  },
  email_campaign: {
    id: "email_campaign",
    name: "Email Blaster",
    emoji: "📧",
    description: "Cree et envoie des campagnes email en masse via Resend",
    color: "#7B5FFF",
    category: "emails",
    enabled: true,
    settings: {
      fromEmail: "growth@pepete.fr",
      batchSize: 50,
      delayBetweenBatch: 30,
      language: "fr",
    },
  },
  influencer_email: {
    id: "influencer_email",
    name: "Chasseur Influenceurs",
    emoji: "💌",
    description: "Trouve et contacte les influenceurs animaux par email",
    color: "#FF5FA0",
    category: "emails",
    enabled: true,
    settings: {
      niches: "chien,chat,animaux,veterinaire,toilettage,refuge",
      minFollowers: 3000,
      maxFollowers: 100000,
      platforms: "tiktok,instagram,youtube",
      country: "FR",
    },
  },
  article_writer: {
    id: "article_writer",
    name: "Redacteur Web",
    emoji: "✍️",
    description: "Ecrit et publie des articles SEO sur Medium, dev.to, blogs",
    color: "#00D4A8",
    category: "contenu",
    enabled: true,
    settings: {
      articlesCount: 5,
      platforms: "medium,devto,hashnode",
      language: "fr",
      topics: "alimentation animaux,pet-sitting,sante animale,technologie pet-tech",
    },
  },
  directory_submit: {
    id: "directory_submit",
    name: "Soumetteur Annuaires",
    emoji: "📋",
    description: "Soumet Pepete sur 50+ annuaires d'apps et sites de listing",
    color: "#4285F4",
    category: "distribution",
    enabled: true,
    settings: {
      autoSubmit: true,
      categories: "pets,health,lifestyle,utility",
    },
  },
  forum_commenter: {
    id: "forum_commenter",
    name: "Agent Forum",
    emoji: "💬",
    description: "Repond sur Reddit, Quora, forums animaux en mentionnant Pepete",
    color: "#FF4500",
    category: "distribution",
    enabled: true,
    settings: {
      platforms: "reddit,quora,forums-animaux",
      postsPerDay: 10,
      tone: "helpful-natural",
      language: "fr",
    },
  },
  backlink_builder: {
    id: "backlink_builder",
    name: "Link Builder",
    emoji: "🔗",
    description: "Cree des backlinks sur blogs, commentaires, guest posts",
    color: "#4ADE80",
    category: "seo",
    enabled: true,
    settings: {
      targetBacklinks: 30,
      methods: "guest-post,blog-comment,directory,forum-signature",
      anchor: "Pepete - scanner croquettes et garde animaux",
    },
  },
  review_booster: {
    id: "review_booster",
    name: "Boosteur Avis",
    emoji: "⭐",
    description: "Genere des strategies pour obtenir des avis App Store/Play Store",
    color: "#FFD166",
    category: "distribution",
    enabled: true,
    settings: {
      targetReviews: 50,
      platforms: "app-store,play-store,trustpilot",
      language: "fr",
    },
  },
  content_tiktok: {
    id: "content_tiktok",
    name: "TikTok Creator",
    emoji: "🎵",
    description: "Genere scripts TikTok viraux prets a filmer",
    color: "#00F2EA",
    category: "contenu",
    enabled: true,
    settings: {
      postsPerBatch: 15,
      style: "storytelling-emotionnel",
      hashtags: "#pepete #animaux #chien #chat #petcare #pourtoi #fyp",
    },
  },
  content_insta: {
    id: "content_insta",
    name: "Instagram Creator",
    emoji: "📸",
    description: "Cree reels, carrousels et stories Instagram",
    color: "#E4405F",
    category: "contenu",
    enabled: true,
    settings: {
      reelsCount: 10,
      carouselsCount: 5,
      storiesCount: 15,
    },
  },
  social_commenter: {
    id: "social_commenter",
    name: "Social Engager",
    emoji: "🗣️",
    description: "Commente sous les posts viraux d'animaux pour attirer du trafic",
    color: "#E4405F",
    category: "distribution",
    enabled: true,
    settings: {
      commentsPerDay: 20,
      platforms: "tiktok,instagram,youtube",
      tone: "friendly-helpful",
    },
  },
  press_release: {
    id: "press_release",
    name: "RP & Presse",
    emoji: "📰",
    description: "Redige et envoie des communiques de presse aux medias pet/tech",
    color: "#9333EA",
    category: "emails",
    enabled: true,
    settings: {
      mediaTargets: "wamiz,30millionsdamis,woopets,animalis-mag,frenchweb,maddyness",
      angle: "lancement-app-pet-tech-francaise",
      language: "fr",
    },
  },
};

const initialStates: Record<AgentId, AgentState> = Object.fromEntries(
  Object.keys(defaultConfigs).map((id) => [
    id,
    { status: "idle" as AgentStatus, progress: 0, lastMessage: "", logs: [], output: null, startedAt: null, actionsTaken: 0 },
  ])
) as Record<AgentId, AgentState>;

export const AGENT_IDS: AgentId[] = [
  "analyst", "email_campaign", "influencer_email", "article_writer",
  "directory_submit", "forum_commenter", "backlink_builder", "review_booster",
  "content_tiktok", "content_insta", "social_commenter", "press_release",
];

export const CATEGORIES = [
  { key: "analyse", label: "Analyse", emoji: "🔬" },
  { key: "emails", label: "Emails & Outreach", emoji: "📧" },
  { key: "contenu", label: "Contenu", emoji: "✏️" },
  { key: "distribution", label: "Distribution", emoji: "🚀" },
  { key: "seo", label: "SEO & Backlinks", emoji: "🔗" },
] as const;

export const useCampaignStore = create<CampaignStore>((set, get) => ({
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
        [id]: { ...state.agentConfigs[id], settings: { ...state.agentConfigs[id].settings, ...settings } },
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
          ...state.agentStates[id], status,
          lastMessage: message || state.agentStates[id].lastMessage,
          startedAt: status === "running" ? new Date().toISOString() : state.agentStates[id].startedAt,
        },
      },
    })),
  setAgentProgress: (id, progress) =>
    set((state) => ({ agentStates: { ...state.agentStates, [id]: { ...state.agentStates[id], progress } } })),
  addAgentLog: (log) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [log.agent]: { ...state.agentStates[log.agent], logs: [...state.agentStates[log.agent].logs, log] },
      },
      globalLogs: [...state.globalLogs, log],
    })),
  setAgentOutput: (id, output) =>
    set((state) => ({ agentStates: { ...state.agentStates, [id]: { ...state.agentStates[id], output } } })),
  incrementActions: (id) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [id]: { ...state.agentStates[id], actionsTaken: state.agentStates[id].actionsTaken + 1 },
      },
      totalActions: state.totalActions + 1,
    })),
  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),
  globalLogs: [],
  totalActions: 0,
  reset: () => set({ campaignId: null, agentStates: { ...initialStates }, isRunning: false, globalLogs: [], activeAgent: "overview", totalActions: 0 }),
}));
