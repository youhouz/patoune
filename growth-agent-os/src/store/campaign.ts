import { create } from "zustand";

export type AgentName =
  | "orchestrator"
  | "scraper"
  | "content"
  | "prospection"
  | "analytics"
  | "report";

export type AgentStatus = "waiting" | "running" | "done" | "error";

export interface AgentLog {
  id: string;
  agent: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  created_at: string;
}

export interface AgentState {
  status: AgentStatus;
  lastMessage: string;
}

export type ViewState = "login" | "setup" | "mission" | "results";

interface CampaignStore {
  // Auth
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;

  // View
  view: ViewState;
  setView: (v: ViewState) => void;

  // Campaign config
  campaignId: string | null;
  url: string;
  appName: string;
  niche: string;
  platforms: string[];
  goal: string;
  setUrl: (v: string) => void;
  setAppName: (v: string) => void;
  setNiche: (v: string) => void;
  togglePlatform: (p: string) => void;
  setGoal: (v: string) => void;
  setCampaignId: (id: string) => void;

  // Agent states
  agents: Record<AgentName, AgentState>;
  setAgentStatus: (agent: AgentName, status: AgentStatus, message?: string) => void;

  // Logs
  logs: AgentLog[];
  addLog: (log: AgentLog) => void;
  setLogs: (logs: AgentLog[]) => void;

  // Results
  results: {
    scraper: Record<string, unknown> | null;
    content: Record<string, unknown> | null;
    prospection: Record<string, unknown> | null;
    analytics: Record<string, unknown> | null;
    report: Record<string, unknown> | null;
  };
  setResult: (agent: string, data: Record<string, unknown>) => void;
  setAllResults: (r: CampaignStore["results"]) => void;

  // Progress
  progress: number;
  setProgress: (v: number) => void;

  // Reset
  reset: () => void;
}

const initialAgents: Record<AgentName, AgentState> = {
  orchestrator: { status: "waiting", lastMessage: "" },
  scraper: { status: "waiting", lastMessage: "" },
  content: { status: "waiting", lastMessage: "" },
  prospection: { status: "waiting", lastMessage: "" },
  analytics: { status: "waiting", lastMessage: "" },
  report: { status: "waiting", lastMessage: "" },
};

export const useCampaignStore = create<CampaignStore>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (v) => set({ isAuthenticated: v, view: v ? "setup" : "login" }),

  view: "login",
  setView: (v) => set({ view: v }),

  campaignId: null,
  url: "",
  appName: "",
  niche: "tech",
  platforms: ["TikTok"],
  goal: "Maximize growth and user acquisition",
  setUrl: (v) => set({ url: v }),
  setAppName: (v) => set({ appName: v }),
  setNiche: (v) => set({ niche: v }),
  togglePlatform: (p) =>
    set((state) => ({
      platforms: state.platforms.includes(p)
        ? state.platforms.filter((x) => x !== p)
        : [...state.platforms, p],
    })),
  setGoal: (v) => set({ goal: v }),
  setCampaignId: (id) => set({ campaignId: id }),

  agents: { ...initialAgents },
  setAgentStatus: (agent, status, message) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          status,
          lastMessage: message || state.agents[agent].lastMessage,
        },
      },
    })),

  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setLogs: (logs) => set({ logs }),

  results: {
    scraper: null,
    content: null,
    prospection: null,
    analytics: null,
    report: null,
  },
  setResult: (agent, data) =>
    set((state) => ({
      results: { ...state.results, [agent]: data },
    })),
  setAllResults: (r) => set({ results: r }),

  progress: 0,
  setProgress: (v) => set({ progress: v }),

  reset: () =>
    set({
      campaignId: null,
      url: "",
      appName: "",
      agents: { ...initialAgents },
      logs: [],
      results: {
        scraper: null,
        content: null,
        prospection: null,
        analytics: null,
        report: null,
      },
      progress: 0,
      view: "setup",
    }),
}));
