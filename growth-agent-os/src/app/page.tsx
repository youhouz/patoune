"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Shield, Loader2, AlertCircle, Play,
  Terminal, CheckCircle2, Power,
  Copy, Check, RotateCcw, Zap, Eye
} from "lucide-react";
import {
  useCampaignStore, AgentId, AGENT_IDS, CATEGORIES,
  type AgentLog
} from "@/store/campaign";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════
   AGENT AVATARS — pixel-art style characters
   Each agent is a little person in their workspace
   ══════════════════════════════════════════════ */
const AVATARS: Record<AgentId, {
  name: string;
  role: string;
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  accessory: string;
  deskItem: string;
  mood: string;
}> = {
  analyst: {
    name: "Max",
    role: "Stratege Growth",
    skinColor: "#F5D0A9",
    hairColor: "#2D1B0E",
    shirtColor: "#FF7A45",
    accessory: "lunettes-spy",
    deskItem: "ecrans",
    mood: "focus",
  },
  email_campaign: {
    name: "Sofia",
    role: "Email Blaster",
    skinColor: "#D4A574",
    hairColor: "#1A1A2E",
    shirtColor: "#7B5FFF",
    accessory: "micro-casque",
    deskItem: "emails",
    mood: "efficient",
  },
  influencer_email: {
    name: "Nora",
    role: "Chasseuse Influenceurs",
    skinColor: "#FDDCB5",
    hairColor: "#2D1B4E",
    shirtColor: "#FF5FA0",
    accessory: "lunettes-spy",
    deskItem: "carnet",
    mood: "determined",
  },
  article_writer: {
    name: "Hugo",
    role: "Redacteur SEO",
    skinColor: "#F5D0A9",
    hairColor: "#4A3728",
    shirtColor: "#00D4A8",
    accessory: "lunettes-rondes",
    deskItem: "articles",
    mood: "creative",
  },
  directory_submit: {
    name: "Sam",
    role: "Soumetteur",
    skinColor: "#C68B59",
    hairColor: "#000000",
    shirtColor: "#4285F4",
    accessory: "casquette",
    deskItem: "listes",
    mood: "methodique",
  },
  forum_commenter: {
    name: "Karim",
    role: "Agent Forum",
    skinColor: "#8D5524",
    hairColor: "#1A1A1A",
    shirtColor: "#FF4500",
    accessory: "micro-casque",
    deskItem: "forum",
    mood: "friendly",
  },
  backlink_builder: {
    name: "Jade",
    role: "Link Builder",
    skinColor: "#FFE0BD",
    hairColor: "#8B4513",
    shirtColor: "#4ADE80",
    accessory: "lunettes-data",
    deskItem: "liens",
    mood: "analytical",
  },
  review_booster: {
    name: "Mei",
    role: "Boosteur Avis",
    skinColor: "#FFE0BD",
    hairColor: "#0D0D0D",
    shirtColor: "#FFD166",
    accessory: "lunettes-rondes",
    deskItem: "etoiles",
    mood: "optimist",
  },
  content_tiktok: {
    name: "Lena",
    role: "TikTokeuse",
    skinColor: "#D4A574",
    hairColor: "#1A1A2E",
    shirtColor: "#00F2EA",
    accessory: "casquette",
    deskItem: "telephone",
    mood: "creative",
  },
  content_insta: {
    name: "Yani",
    role: "Instagrameur",
    skinColor: "#C68B59",
    hairColor: "#000000",
    shirtColor: "#E4405F",
    accessory: "lunettes-spy",
    deskItem: "photos",
    mood: "aesthetic",
  },
  social_commenter: {
    name: "Ines",
    role: "Social Engager",
    skinColor: "#FDDCB5",
    hairColor: "#6B4226",
    shirtColor: "#E4405F",
    accessory: "micro-casque",
    deskItem: "commentaires",
    mood: "social",
  },
  press_release: {
    name: "Jules",
    role: "Attache de Presse",
    skinColor: "#F5D0A9",
    hairColor: "#6B4226",
    shirtColor: "#9333EA",
    accessory: "cravate",
    deskItem: "documents",
    mood: "serious",
  },
};

/* SVG Avatar Component — renders a cute character at their desk */
function AgentAvatar({ id, size = 80, animated = false }: { id: AgentId; size?: number; animated?: boolean }) {
  const av = AVATARS[id];
  const s = size;
  const headSize = s * 0.3;
  const bodyY = s * 0.45;
  const deskY = s * 0.7;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" className={animated ? "agent-avatar-bounce" : ""}>
      {/* Room background */}
      <rect x={2} y={2} width={s - 4} height={s - 4} rx={s * 0.12} fill={`${av.shirtColor}10`} stroke={`${av.shirtColor}30`} strokeWidth={1} />

      {/* Desk */}
      <rect x={s * 0.15} y={deskY} width={s * 0.7} height={s * 0.06} rx={2} fill={`${av.shirtColor}40`} />
      {/* Desk legs */}
      <rect x={s * 0.2} y={deskY} width={s * 0.03} height={s * 0.18} rx={1} fill={`${av.shirtColor}25`} />
      <rect x={s * 0.77} y={deskY} width={s * 0.03} height={s * 0.18} rx={1} fill={`${av.shirtColor}25`} />

      {/* Desk item - screen/item */}
      <rect x={s * 0.35} y={deskY - s * 0.14} width={s * 0.3} height={s * 0.13} rx={2} fill={`${av.shirtColor}30`} stroke={`${av.shirtColor}50`} strokeWidth={0.5} />
      <rect x={s * 0.44} y={deskY - s * 0.02} width={s * 0.12} height={s * 0.02} rx={1} fill={`${av.shirtColor}20`} />

      {/* Body / shirt */}
      <ellipse cx={s * 0.5} cy={bodyY + s * 0.08} rx={s * 0.12} ry={s * 0.13} fill={av.shirtColor} />

      {/* Arms on desk */}
      <ellipse cx={s * 0.35} cy={deskY - s * 0.01} rx={s * 0.04} ry={s * 0.03} fill={av.skinColor} />
      <ellipse cx={s * 0.65} cy={deskY - s * 0.01} rx={s * 0.04} ry={s * 0.03} fill={av.skinColor} />

      {/* Head */}
      <circle cx={s * 0.5} cy={bodyY - s * 0.06} r={headSize * 0.5} fill={av.skinColor} />

      {/* Hair */}
      <ellipse cx={s * 0.5} cy={bodyY - s * 0.12} rx={headSize * 0.52} ry={headSize * 0.3} fill={av.hairColor} />

      {/* Eyes */}
      <circle cx={s * 0.44} cy={bodyY - s * 0.05} r={s * 0.02} fill="#1A1A2E" />
      <circle cx={s * 0.56} cy={bodyY - s * 0.05} r={s * 0.02} fill="#1A1A2E" />
      {/* Eye shine */}
      <circle cx={s * 0.445} cy={bodyY - s * 0.055} r={s * 0.007} fill="white" />
      <circle cx={s * 0.565} cy={bodyY - s * 0.055} r={s * 0.007} fill="white" />

      {/* Mouth - small smile */}
      <path d={`M ${s * 0.46} ${bodyY - s * 0.02} Q ${s * 0.5} ${bodyY - s * 0.005} ${s * 0.54} ${bodyY - s * 0.02}`} stroke="#B87A5A" strokeWidth={1} fill="none" strokeLinecap="round" />

      {/* Accessory indicator - colored dot on head for glasses/hat etc */}
      {(av.accessory.includes("lunettes") || av.accessory.includes("data")) && (
        <>
          <rect x={s * 0.4} y={bodyY - s * 0.065} width={s * 0.08} height={s * 0.03} rx={s * 0.01} fill="none" stroke={av.shirtColor} strokeWidth={0.8} />
          <rect x={s * 0.52} y={bodyY - s * 0.065} width={s * 0.08} height={s * 0.03} rx={s * 0.01} fill="none" stroke={av.shirtColor} strokeWidth={0.8} />
          <line x1={s * 0.48} y1={bodyY - s * 0.05} x2={s * 0.52} y2={bodyY - s * 0.05} stroke={av.shirtColor} strokeWidth={0.6} />
        </>
      )}
      {av.accessory === "casquette" && (
        <ellipse cx={s * 0.5} cy={bodyY - s * 0.13} rx={headSize * 0.6} ry={headSize * 0.15} fill={av.shirtColor} />
      )}
      {av.accessory === "cravate" && (
        <path d={`M ${s * 0.48} ${bodyY + s * 0.01} L ${s * 0.5} ${bodyY + s * 0.08} L ${s * 0.52} ${bodyY + s * 0.01}`} fill="#333" />
      )}
      {av.accessory === "micro-casque" && (
        <>
          <path d={`M ${s * 0.36} ${bodyY - s * 0.07} Q ${s * 0.36} ${bodyY - s * 0.15} ${s * 0.5} ${bodyY - s * 0.16}`} stroke="#666" strokeWidth={1.2} fill="none" />
          <circle cx={s * 0.36} cy={bodyY - s * 0.05} r={s * 0.02} fill="#666" />
        </>
      )}

      {/* Status light in corner */}
      <circle cx={s - 8} cy={8} r={3} fill={av.shirtColor} opacity={0.6} />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════ */
function LoginView() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuthenticated } = useCampaignStore();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) setAuthenticated(true);
      else setError("Mot de passe incorrect");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐾</div>
          <h1 className="font-heading text-2xl font-extrabold text-white">
            Pepete <span className="text-violet-400">Growth OS</span>
          </h1>
          <p className="text-gray-600 text-xs mt-1 font-mono">cockpit de croissance autonome</p>
        </div>
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs text-gray-600">Acces protege</span>
          </div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-violet-500/50 transition mb-3 font-mono text-sm"
          />
          {error && (
            <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Entrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AGENT SIDEBAR CARD
   ══════════════════════════════════════════════ */
function AgentSidebarCard({ id }: { id: AgentId }) {
  const config = useCampaignStore((s) => s.agentConfigs[id]);
  const state = useCampaignStore((s) => s.agentStates[id]);
  const active = useCampaignStore((s) => s.activeAgent);
  const setActive = useCampaignStore((s) => s.setActiveAgent);
  const isActive = active === id;

  const statusColor = {
    idle: "bg-gray-700",
    configuring: "bg-blue-500",
    running: "bg-violet-500 animate-pulse",
    done: "bg-teal-500",
    error: "bg-red-500",
    paused: "bg-yellow-500",
  }[state.status];

  const av = AVATARS[id];

  return (
    <button
      onClick={() => setActive(id)}
      className={cn(
        "w-full text-left px-2 py-2 rounded-xl transition-all flex items-center gap-2.5 group",
        isActive
          ? "bg-[var(--bg3)] border border-violet-500/30"
          : "hover:bg-[var(--bg3)]/50 border border-transparent"
      )}
    >
      {/* Mini avatar */}
      <div className={cn(
        "flex-shrink-0 rounded-lg overflow-hidden border transition-all",
        state.status === "running" ? "border-violet-500/50 agent-running" :
        state.status === "done" ? "border-teal-500/40" :
        "border-transparent"
      )}>
        <AgentAvatar id={id} size={36} animated={state.status === "running"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[11px] font-bold truncate", isActive ? "text-white" : "text-gray-400")}>
            {av.name}
          </span>
          {!config.enabled && <span className="text-[8px] text-gray-700 bg-gray-800 px-1 py-0.5 rounded leading-none">OFF</span>}
        </div>
        <p className="text-[9px] text-gray-600 truncate" style={{ color: `${config.color}80` }}>{av.role}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {state.status === "running" && (
          <span className="text-[9px] font-mono text-violet-400">{state.progress}%</span>
        )}
        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusColor)} />
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════
   AGENT DETAIL PANEL — CONFIG
   ══════════════════════════════════════════════ */
function AgentConfigPanel({ id }: { id: AgentId }) {
  const config = useCampaignStore((s) => s.agentConfigs[id]);
  const updateConfig = useCampaignStore((s) => s.updateAgentConfig);
  const toggleAgent = useCampaignStore((s) => s.toggleAgent);

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between bg-[var(--bg3)] rounded-xl px-4 py-3">
        <span className="text-sm text-gray-400">Agent actif</span>
        <button
          onClick={() => toggleAgent(id)}
          className={cn(
            "w-10 h-6 rounded-full transition-all relative",
            config.enabled ? "bg-teal-500" : "bg-gray-700"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
              config.enabled ? "left-5" : "left-1"
            )}
          />
        </button>
      </div>

      {/* Settings */}
      {Object.entries(config.settings).map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .replace(/_/g, " ");

        if (typeof value === "boolean") {
          return (
            <div key={key} className="flex items-center justify-between bg-[var(--bg3)] rounded-xl px-4 py-3">
              <span className="text-xs text-gray-400">{label}</span>
              <button
                onClick={() => updateConfig(id, { [key]: !value })}
                className={cn("w-10 h-6 rounded-full transition-all relative", value ? "bg-violet-500" : "bg-gray-700")}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", value ? "left-5" : "left-1")} />
              </button>
            </div>
          );
        }

        if (typeof value === "number") {
          return (
            <div key={key} className="bg-[var(--bg3)] rounded-xl px-4 py-3">
              <label className="text-[10px] text-gray-600 font-mono uppercase tracking-wider block mb-1.5">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => updateConfig(id, { [key]: parseInt(e.target.value) || 0 })}
                className="w-full bg-transparent text-white text-sm font-mono focus:outline-none"
              />
            </div>
          );
        }

        // String - textarea for long values, input for short
        const isLong = String(value).length > 40;
        return (
          <div key={key} className="bg-[var(--bg3)] rounded-xl px-4 py-3">
            <label className="text-[10px] text-gray-600 font-mono uppercase tracking-wider block mb-1.5">{label}</label>
            {isLong ? (
              <textarea
                rows={3}
                value={String(value)}
                onChange={(e) => updateConfig(id, { [key]: e.target.value })}
                className="w-full bg-transparent text-white text-xs font-mono focus:outline-none resize-none"
              />
            ) : (
              <input
                type="text"
                value={String(value)}
                onChange={(e) => updateConfig(id, { [key]: e.target.value })}
                className="w-full bg-transparent text-white text-sm font-mono focus:outline-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   AGENT TERMINAL (LOGS)
   ══════════════════════════════════════════════ */
function AgentTerminal({ logs, maxHeight = "h-48" }: { logs: AgentLog[]; maxHeight?: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className={cn("bg-[#0D0D14] rounded-xl border border-[var(--border)] overflow-hidden")}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg3)]">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <Terminal className="w-3 h-3 text-gray-700" />
        <span className="text-[10px] text-gray-700 font-mono">logs</span>
      </div>
      <div className={cn(maxHeight, "overflow-y-auto p-3 font-mono text-[11px] space-y-0.5")}>
        {logs.length === 0 && (
          <p className="text-gray-800">En attente...</p>
        )}
        {logs.map((log, i) => (
          <div key={log.id || i} className="flex gap-2 terminal-line">
            <span className="text-gray-700 flex-shrink-0">
              {new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className={cn(
              "flex-shrink-0",
              log.level === "error" ? "text-red-400" :
              log.level === "success" ? "text-teal-400" :
              log.level === "warn" ? "text-yellow-400" :
              "text-violet-400/70"
            )}>
              [{log.level}]
            </span>
            <span className="text-gray-500">{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AGENT DETAIL VIEW
   ══════════════════════════════════════════════ */
/* Run a single agent via the /api/agents/execute endpoint */
async function runSingleAgent(id: AgentId) {
  const store = useCampaignStore.getState();
  const av = AVATARS[id];

  store.setAgentStatus(id, "running", `${av.name} demarre...`);
  store.setAgentProgress(id, 10);
  store.addAgentLog({
    id: `${id}-start-${Date.now()}`,
    agent: id,
    level: "info",
    message: `${av.name} (${av.role}) commence le travail...`,
    timestamp: new Date().toISOString(),
  });

  // Simulate progress while waiting
  const progressInterval = setInterval(() => {
    const current = useCampaignStore.getState().agentStates[id].progress;
    if (current < 85) {
      store.setAgentProgress(id, current + Math.random() * 8);
      const messages = [
        `${av.name} analyse les donnees...`,
        `${av.name} genere du contenu...`,
        `${av.name} optimise les resultats...`,
        `${av.name} compile les informations...`,
        `${av.name} finalise...`,
      ];
      store.setAgentStatus(id, "running", messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 3000);

  try {
    const res = await fetch("/api/agents/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: id }),
    });

    clearInterval(progressInterval);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur serveur");
    }

    const data = await res.json();

    store.setAgentOutput(id, { text: data.result });
    store.setAgentProgress(id, 100);
    store.setAgentStatus(id, "done", `${av.name} a termine!`);
    store.addAgentLog({
      id: `${id}-done-${Date.now()}`,
      agent: id,
      level: "success",
      message: `${av.name} a termine avec succes! Resultats disponibles dans l'onglet Resultats.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    clearInterval(progressInterval);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    store.setAgentStatus(id, "error", msg);
    store.addAgentLog({
      id: `${id}-error-${Date.now()}`,
      agent: id,
      level: "error",
      message: `Erreur: ${msg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

function AgentDetailView({ id }: { id: AgentId }) {
  const config = useCampaignStore((s) => s.agentConfigs[id]);
  const state = useCampaignStore((s) => s.agentStates[id]);
  const isRunning = useCampaignStore((s) => s.isRunning);
  const [tab, setTab] = useState<"output" | "logs" | "config">("output");
  const [copied, setCopied] = useState(false);
  const av = AVATARS[id];

  const copyOutput = () => {
    const text = state.output?.text ? String(state.output.text) : "";
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusLabel = {
    idle: "En attente",
    configuring: "Configuration",
    running: "En cours",
    done: "Termine",
    error: "Erreur",
    paused: "En pause",
  }[state.status];

  const statusColor = {
    idle: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    configuring: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    running: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    done: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    error: "text-red-400 bg-red-500/10 border-red-500/20",
    paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  }[state.status];

  return (
    <div className="h-full flex flex-col">
      {/* Header with avatar "room" */}
      <div className="flex items-center gap-4 mb-4 bg-[var(--bg3)] rounded-2xl p-4 border border-[var(--border)]">
        {/* Avatar in their room */}
        <div className={cn(
          "rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
          state.status === "running" ? "border-violet-500/60 glow-violet agent-running" :
          state.status === "done" ? "border-teal-500/50 glow-teal" :
          state.status === "error" ? "border-red-500/50" :
          "border-[var(--border)]"
        )}>
          <AgentAvatar id={id} size={72} animated={state.status === "running"} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-heading text-lg font-extrabold text-white">{av.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ color: config.color, background: `${config.color}15`, border: `1px solid ${config.color}30` }}>
              {av.role}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{config.description}</p>
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-mono px-2.5 py-1 rounded-full border", statusColor)}>
              {statusLabel}
            </span>
            {state.status === "running" && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span className="text-xs font-mono text-violet-400">{state.progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {(state.status === "running" || state.status === "done") && (
        <div className="h-1 bg-[var(--bg3)] rounded-full overflow-hidden mb-4">
          <motion.div
            className={cn("h-full rounded-full", state.status === "done" ? "bg-teal-500" : "bg-violet-500")}
            initial={{ width: "0%" }}
            animate={{ width: `${state.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Tabs + Run button */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 flex-1 bg-[var(--bg3)] rounded-xl p-1">
          {(["output", "logs", "config"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 text-xs font-bold py-2 rounded-lg transition",
                tab === t ? "bg-[var(--bg2)] text-white" : "text-gray-600 hover:text-gray-400"
              )}
            >
              {t === "output" ? "Resultats" : t === "logs" ? "Logs" : "Config"}
            </button>
          ))}
        </div>
        {state.status !== "running" && config.enabled && (
          <button
            onClick={() => runSingleAgent(id)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold px-3 py-2 rounded-lg transition flex-shrink-0"
          >
            <Play className="w-3 h-3" />
            Lancer {av.name}
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "logs" && <AgentTerminal logs={state.logs} maxHeight="h-[calc(100vh-400px)]" />}
        {tab === "config" && (
          <div className="overflow-y-auto h-[calc(100vh-400px)] pr-1">
            <AgentConfigPanel id={id} />
          </div>
        )}
        {tab === "output" && (
          <div className="h-[calc(100vh-400px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-gray-600 hover:text-violet-400 transition">
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copie!" : "Copier tout"}
              </button>
            </div>
            {state.output?.text ? (
              <div className="flex-1 overflow-auto bg-[#0D0D14] rounded-xl border border-[var(--border)] p-5 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed agent-output-content">
                {String(state.output.text)}
              </div>
            ) : state.status === "running" ? (
              <div className="flex-1 flex items-center justify-center bg-[#0D0D14] rounded-xl border border-[var(--border)]">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-600">{av.name} travaille...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#0D0D14] rounded-xl border border-[var(--border)]">
                <div className="text-center">
                  <AgentAvatar id={id} size={64} />
                  <p className="text-xs text-gray-700 mt-3">Lance {av.name} pour voir les resultats</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW PANEL
   ══════════════════════════════════════════════ */
function OverviewPanel() {
  const configs = useCampaignStore((s) => s.agentConfigs);
  const states = useCampaignStore((s) => s.agentStates);
  const globalLogs = useCampaignStore((s) => s.globalLogs);
  const setActive = useCampaignStore((s) => s.setActiveAgent);
  const isRunning = useCampaignStore((s) => s.isRunning);

  const totalActions = useCampaignStore((s) => s.totalActions);
  const enabledCount = AGENT_IDS.filter((id) => configs[id].enabled).length;
  const runningCount = AGENT_IDS.filter((id) => states[id].status === "running").length;
  const doneCount = AGENT_IDS.filter((id) => states[id].status === "done").length;
  const errorCount = AGENT_IDS.filter((id) => states[id].status === "error").length;

  const globalProgress = enabledCount > 0
    ? Math.round(AGENT_IDS.filter((id) => configs[id].enabled).reduce((sum, id) => sum + states[id].progress, 0) / enabledCount)
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: "Agents", value: enabledCount, color: "text-white" },
          { label: "En cours", value: runningCount, color: "text-violet-400" },
          { label: "Termines", value: doneCount, color: "text-teal-400" },
          { label: "Actions", value: totalActions, color: "text-orange-400" },
          { label: "Erreurs", value: errorCount, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg3)] rounded-xl px-3 py-3 text-center">
            <p className={cn("text-xl font-extrabold font-heading", s.color)}>{s.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Global progress */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-gray-600">PROGRESSION GLOBALE</span>
            <span className="text-xs font-mono text-violet-400">{globalProgress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-teal-400 rounded-full"
              animate={{ width: `${globalProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Agent grid - "office rooms" */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {AGENT_IDS.map((id) => {
          const cfg = configs[id];
          const st = states[id];
          const av = AVATARS[id];
          const isActive = st.status === "running";
          const isDone = st.status === "done";
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "bg-[var(--bg3)] rounded-xl p-2.5 text-left transition-all border hover:border-gray-600 group",
                isActive ? "border-violet-500/40 glow-violet" :
                isDone ? "border-teal-500/30" :
                st.status === "error" ? "border-red-500/30" :
                "border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  "rounded-lg overflow-hidden border transition-all",
                  isActive ? "border-violet-500/40" : isDone ? "border-teal-500/30" : "border-transparent"
                )}>
                  <AgentAvatar id={id} size={40} animated={isActive} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{av.name}</p>
                  <p className="text-[8px] truncate" style={{ color: `${cfg.color}90` }}>{av.role}</p>
                </div>
              </div>
              {isActive && (
                <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${st.progress}%` }} />
                </div>
              )}
              {isDone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-teal-500" />
                  <p className="text-[8px] text-teal-500">Termine</p>
                </div>
              )}
              {st.status === "error" && (
                <div className="flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                  <p className="text-[8px] text-red-400">Erreur</p>
                </div>
              )}
              {st.status === "idle" && cfg.enabled && (
                <p className="text-[8px] text-gray-700 mt-0.5">En attente</p>
              )}
              {!cfg.enabled && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Power className="w-2.5 h-2.5 text-gray-700" />
                  <p className="text-[8px] text-gray-700">Desactive</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Global terminal */}
      <div className="flex-1 min-h-0">
        <AgentTerminal logs={globalLogs.slice(-100)} maxHeight="h-[calc(100vh-460px)]" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COCKPIT (MAIN DASHBOARD)
   ══════════════════════════════════════════════ */
function CockpitView() {
  const store = useCampaignStore();
  const [elapsed, setElapsed] = useState(0);
  const [launching, setLaunching] = useState(false);

  // Timer when running
  useEffect(() => {
    if (!store.isRunning) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [store.isRunning]);

  // Check if all agents are done
  useEffect(() => {
    if (!store.isRunning) return;
    const allDone = AGENT_IDS
      .filter((id) => store.agentConfigs[id].enabled)
      .every((id) => store.agentStates[id].status === "done" || store.agentStates[id].status === "error");
    if (allDone) {
      store.setIsRunning(false);
    }
  }, [store.agentStates, store.isRunning]);

  const handleLaunchAll = async () => {
    setLaunching(true);
    store.setIsRunning(true);
    setElapsed(0);

    // Get enabled agents
    const enabled = AGENT_IDS.filter((id) => store.agentConfigs[id].enabled);

    // Run all enabled agents in parallel
    const promises = enabled.map((id) => runSingleAgent(id));
    await Promise.allSettled(promises);

    store.setIsRunning(false);
    setLaunching(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg2)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🐾</span>
          <span className="font-heading font-extrabold text-sm text-white">
            Pepete <span className="text-violet-400">Growth OS</span>
          </span>
          <span className="text-[10px] font-mono text-gray-700 ml-2">v2.0</span>
        </div>
        <div className="flex items-center gap-4">
          {store.isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-mono text-violet-400">RUNNING</span>
              <span className="text-[10px] font-mono text-gray-600">{fmt(elapsed)}</span>
            </div>
          )}
          {!store.isRunning && !store.campaignId && (
            <button
              onClick={handleLaunchAll}
              disabled={launching}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              {launching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Lancer tous les agents
            </button>
          )}
          {!store.isRunning && store.campaignId && (
            <button
              onClick={() => store.reset()}
              className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] text-gray-400 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-[var(--border)] bg-[var(--bg2)] flex-shrink-0 flex flex-col overflow-hidden">
          {/* Overview button */}
          <div className="p-2 border-b border-[var(--border)]">
            <button
              onClick={() => store.setActiveAgent("overview")}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border",
                store.activeAgent === "overview"
                  ? "bg-[var(--bg3)] border-violet-500/30 text-white"
                  : "text-gray-400 hover:bg-[var(--bg3)]/50 border-transparent"
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-bold">Vue globale</span>
            </button>
          </div>

          {/* Agent list by category */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {CATEGORIES.map((cat) => {
              const agents = AGENT_IDS.filter((id) => store.agentConfigs[id].category === cat.key);
              if (agents.length === 0) return null;
              return (
                <div key={cat.key}>
                  <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest px-3 mb-1">
                    {cat.emoji} {cat.label}
                  </p>
                  <div className="space-y-0.5">
                    {agents.map((id) => (
                      <AgentSidebarCard key={id} id={id} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 p-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {store.activeAgent === "overview" ? (
              <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full">
                <OverviewPanel />
              </motion.div>
            ) : (
              <motion.div key={store.activeAgent} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full">
                <AgentDetailView id={store.activeAgent} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function HomePage() {
  const { view } = useCampaignStore();

  return (
    <AnimatePresence mode="wait">
      {view === "login" && <LoginView key="login" />}
      {view === "cockpit" && <CockpitView key="cockpit" />}
    </AnimatePresence>
  );
}
