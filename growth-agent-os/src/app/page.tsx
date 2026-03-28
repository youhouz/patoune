"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Shield, Loader2, AlertCircle, Play, Pause, Settings2,
  Terminal, Clock, CheckCircle2, ChevronRight, Power,
  Copy, Check, RotateCcw, Zap, Eye, X, ChevronDown
} from "lucide-react";
import {
  useCampaignStore, AgentId, AGENT_IDS, CATEGORIES,
  type AgentConfig, type AgentState, type AgentLog
} from "@/store/campaign";
import { cn } from "@/lib/utils";

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

  return (
    <button
      onClick={() => setActive(id)}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group",
        isActive
          ? "bg-[var(--bg3)] border border-violet-500/30"
          : "hover:bg-[var(--bg3)]/50 border border-transparent"
      )}
    >
      <span className="text-lg flex-shrink-0">{config.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-gray-400")}>
            {config.name}
          </span>
          {!config.enabled && <span className="text-[9px] text-gray-700 bg-gray-800 px-1.5 py-0.5 rounded">OFF</span>}
        </div>
        {state.status !== "idle" && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">{state.lastMessage || config.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {state.status === "running" && (
          <span className="text-[10px] font-mono text-violet-400">{state.progress}%</span>
        )}
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColor)} />
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
function AgentDetailView({ id }: { id: AgentId }) {
  const config = useCampaignStore((s) => s.agentConfigs[id]);
  const state = useCampaignStore((s) => s.agentStates[id]);
  const isRunning = useCampaignStore((s) => s.isRunning);
  const [tab, setTab] = useState<"logs" | "config" | "output">("logs");
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    if (state.output) {
      navigator.clipboard.writeText(JSON.stringify(state.output, null, 2));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-white">{config.name}</h2>
            <p className="text-xs text-gray-600">{config.description}</p>
          </div>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--bg3)] rounded-xl p-1">
        {(["logs", "config", "output"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 text-xs font-bold py-2 rounded-lg transition",
              tab === t ? "bg-[var(--bg2)] text-white" : "text-gray-600 hover:text-gray-400"
            )}
          >
            {t === "logs" ? "Logs" : t === "config" ? "Config" : "Output"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "logs" && <AgentTerminal logs={state.logs} maxHeight="h-[calc(100vh-360px)]" />}
        {tab === "config" && (
          <div className="overflow-y-auto h-[calc(100vh-360px)] pr-1">
            <AgentConfigPanel id={id} />
          </div>
        )}
        {tab === "output" && (
          <div className="h-[calc(100vh-360px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-gray-600 hover:text-violet-400 transition">
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copie!" : "Copier"}
              </button>
            </div>
            <pre className="flex-1 overflow-auto bg-[#0D0D14] rounded-xl border border-[var(--border)] p-4 text-xs font-mono text-gray-500 whitespace-pre-wrap">
              {state.output ? JSON.stringify(state.output, null, 2) : "Aucun resultat pour le moment."}
            </pre>
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
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Actifs", value: enabledCount, color: "text-white" },
          { label: "En cours", value: runningCount, color: "text-violet-400" },
          { label: "Termines", value: doneCount, color: "text-teal-400" },
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

      {/* Agent grid - mini cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {AGENT_IDS.map((id) => {
          const cfg = configs[id];
          const st = states[id];
          const isActive = st.status === "running";
          const isDone = st.status === "done";
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "bg-[var(--bg3)] rounded-xl p-3 text-left transition-all border hover:border-gray-600",
                isActive ? "border-violet-500/40 glow-violet" :
                isDone ? "border-teal-500/30" :
                st.status === "error" ? "border-red-500/30" :
                "border-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{cfg.emoji}</span>
                {isActive && <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />}
                {isDone && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                {st.status === "error" && <AlertCircle className="w-3 h-3 text-red-400" />}
                {!cfg.enabled && <Power className="w-3 h-3 text-gray-700" />}
              </div>
              <p className="text-[11px] font-bold text-white truncate">{cfg.name}</p>
              {isActive && (
                <div className="h-0.5 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${st.progress}%` }} />
                </div>
              )}
              {isDone && <p className="text-[9px] text-teal-500 mt-1">Termine</p>}
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

  // Polling for agent updates
  useEffect(() => {
    if (!store.campaignId || !store.isRunning) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${store.campaignId}`);
        if (!res.ok) return;
        const data = await res.json();

        // Map logs to agents
        if (data.logs && Array.isArray(data.logs)) {
          const mapped: AgentLog[] = data.logs.map((l: any) => ({
            id: l.id,
            agent: mapAgentName(l.agent_name || l.agent),
            level: l.status || l.level || "info",
            message: l.log_message || l.message || "",
            timestamp: l.created_at,
          }));
          // Update per-agent logs
          const byAgent: Record<string, AgentLog[]> = {};
          for (const log of mapped) {
            if (!byAgent[log.agent]) byAgent[log.agent] = [];
            byAgent[log.agent].push(log);
          }
          for (const [agentId, logs] of Object.entries(byAgent)) {
            if (AGENT_IDS.includes(agentId as AgentId)) {
              const currentLogs = store.agentStates[agentId as AgentId].logs;
              if (logs.length > currentLogs.length) {
                for (const log of logs.slice(currentLogs.length)) {
                  store.addAgentLog(log);
                }
                const last = logs[logs.length - 1];
                if (last.level === "success") {
                  store.setAgentStatus(agentId as AgentId, "done", last.message);
                  store.setAgentProgress(agentId as AgentId, 100);
                } else if (last.level === "error") {
                  store.setAgentStatus(agentId as AgentId, "error", last.message);
                } else {
                  store.setAgentStatus(agentId as AgentId, "running", last.message);
                  const progress = Math.min(90, Math.round((logs.length / 10) * 100));
                  store.setAgentProgress(agentId as AgentId, progress);
                }
              }
            }
          }
        }

        // Check completion
        if (data.campaign?.status === "completed") {
          store.setIsRunning(false);
          AGENT_IDS.forEach((id) => {
            if (store.agentStates[id].status === "running") {
              store.setAgentStatus(id, "done", "Complete");
              store.setAgentProgress(id, 100);
            }
          });
        }
      } catch { /* ignore */ }
    }, 2500);
    return () => clearInterval(interval);
  }, [store.campaignId, store.isRunning]);

  const handleLaunchAll = async () => {
    setLaunching(true);
    try {
      // Create campaign
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: String(store.agentConfigs.scraper.settings.targetUrl),
          appName: "Pepete",
          niche: "animaux",
          platforms: ["TikTok", "Instagram", "Snapchat"],
          goal: "Maximiser les installations et la croissance organique de Pepete",
        }),
      });
      const data = await res.json();
      store.setCampaignId(data.id);

      // Mark enabled agents as running
      AGENT_IDS.forEach((id) => {
        if (store.agentConfigs[id].enabled) {
          store.setAgentStatus(id, "running", "Demarrage...");
          store.setAgentProgress(id, 5);
        }
      });

      // Launch
      await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: data.id }),
      });

      store.setIsRunning(true);
      setElapsed(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(false);
    }
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

/* Helper to map backend agent names to our AgentId */
function mapAgentName(name: string): AgentId {
  const map: Record<string, AgentId> = {
    scraper: "scraper",
    content: "content_tiktok",
    content_tiktok: "content_tiktok",
    content_insta: "content_insta",
    content_snap: "content_snap",
    seo_aso: "seo_aso",
    seo: "seo_aso",
    prospection: "prospection",
    outreach: "outreach",
    analytics: "analytics",
    report: "report",
    orchestrator: "scraper",
  };
  return map[name] || "scraper";
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
