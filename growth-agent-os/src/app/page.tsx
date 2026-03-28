"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Lock, Globe, Zap, Brain, Search, FileText,
  BarChart3, Users, MessageCircle, Copy, Download, Check,
  ChevronRight, Sparkles, Terminal, Eye, Target, Send,
  Shield, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Loader2, X
} from "lucide-react";
import { useCampaignStore, AgentName } from "@/store/campaign";
import { cn } from "@/lib/utils";

/* ── Agent Config ── */
const AGENT_CONFIG: Record<AgentName, { icon: typeof Brain; label: string; color: string; desc: string }> = {
  orchestrator: { icon: Brain, label: "Orchestrateur", color: "#7B5FFF", desc: "Coordonne les agents" },
  scraper: { icon: Search, label: "Scraper", color: "#FF7A45", desc: "Analyse l'app" },
  content: { icon: MessageCircle, label: "Content", color: "#00D4A8", desc: "Cree le contenu" },
  prospection: { icon: Users, label: "Prospection", color: "#FF5FA0", desc: "Trouve les influenceurs" },
  analytics: { icon: BarChart3, label: "Analytics", color: "#FFD166", desc: "Mesure les KPIs" },
  report: { icon: FileText, label: "Rapport", color: "#4ADE80", desc: "Genere le PDF" },
};

const NICHES = ["Tech", "Animaux", "Fitness", "Food", "Mode", "Gaming", "Beaute", "Education", "Finance", "Voyage"];
const PLATFORMS = ["TikTok", "Instagram", "Snapchat", "YouTube", "Twitter/X"];

/* ── Login Screen ── */
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
      if (res.ok) {
        setAuthenticated(true);
      } else {
        setError("Mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", tension: 200 }}
            className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <Rocket className="w-8 h-8 text-violet-400" />
          </motion.div>
          <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
            Growth Agent <span className="text-violet-400">OS</span>
          </h1>
          <p className="text-gray-500 text-sm">Multi-Agent AI Growth System</p>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Acces protege</span>
          </div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 transition mb-4 font-mono text-sm"
          />
          {error && (
            <motion.p initial={{ y: -5 }} animate={{ y: 0 }} className="text-red-400 text-xs mb-3 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </motion.p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-heading font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Entrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Setup Screen ── */
function SetupView() {
  const store = useCampaignStore();
  const [launching, setLaunching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const canLaunch = store.url.trim().length > 5;

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setLaunching(true);

    // Countdown animation
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 800));
    }
    setCountdown(0);

    try {
      // Create campaign
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: store.url,
          appName: store.appName || new URL(store.url).hostname,
          niche: store.niche,
          platforms: store.platforms,
          goal: store.goal,
        }),
      });
      const data = await res.json();
      store.setCampaignId(data.id);

      // Launch agents
      await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: data.id }),
      });

      store.setView("mission");
    } catch (err) {
      console.error("Launch error:", err);
      setLaunching(false);
      setCountdown(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-peach animate-pulse" />
            <span className="font-heading font-extrabold text-violet-400">Growth Agent OS</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 px-3 py-1.5 rounded-full text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            Agents prets
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h1 className="font-heading text-5xl md:text-6xl font-extrabold text-white leading-none mb-4 tracking-tight">
              Un clic.<br />
              <span className="text-violet-400">Les agents</span> font le reste.
            </h1>
            <p className="text-gray-500 max-w-lg mx-auto">
              Entre l&apos;URL de ton app. Des agents IA autonomes analysent, creent du contenu,
              trouvent les influenceurs et generent ta strategie growth.
            </p>
          </motion.div>
        </div>

        {/* Config Form */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--bg2)] border border-[var(--border)] rounded-3xl p-8 mb-8"
        >
          {/* URL */}
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2 block">URL de l&apos;app</label>
            <div className="flex items-center gap-3 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-violet-500/50 transition">
              <Globe className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <input
                type="url"
                placeholder="https://monapp.fr"
                value={store.url}
                onChange={(e) => store.setUrl(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-gray-600 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* App Name */}
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2 block">Nom de l&apos;app (optionnel)</label>
            <input
              type="text"
              placeholder="Mon App"
              value={store.appName}
              onChange={(e) => store.setAppName(e.target.value)}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 transition text-sm"
            />
          </div>

          {/* Niche */}
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2 block">Niche</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => store.setNiche(n.toLowerCase())}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition border",
                    store.niche === n.toLowerCase()
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-[var(--bg3)] border-[var(--border)] text-gray-500 hover:text-gray-300"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2 block">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => store.togglePlatform(p)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition border",
                    store.platforms.includes(p)
                      ? "bg-peach/20 border-peach/40 text-orange-300"
                      : "bg-[var(--bg3)] border-[var(--border)] text-gray-500 hover:text-gray-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="mb-8">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2 block">Objectif</label>
            <textarea
              rows={2}
              placeholder="Ex: Obtenir 1000 utilisateurs en 14 jours..."
              value={store.goal}
              onChange={(e) => store.setGoal(e.target.value)}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 transition text-sm resize-none"
            />
          </div>

          {/* Launch Button */}
          <AnimatePresence mode="wait">
            {countdown !== null ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="flex items-center justify-center py-6"
              >
                <span className="font-heading text-7xl font-extrabold text-violet-400">
                  {countdown === 0 ? "GO" : countdown}
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="button"
                onClick={handleLaunch}
                disabled={!canLaunch || launching}
                whileHover={{ scale: canLaunch ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-30 text-white font-heading font-extrabold text-lg py-5 rounded-2xl transition flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(123,95,255,0.3)]"
              >
                <Rocket className="w-5 h-5" />
                Lancer les agents
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agent Preview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {(Object.entries(AGENT_CONFIG) as [AgentName, typeof AGENT_CONFIG[AgentName]][]).map(([key, cfg], i) => (
            <motion.div
              key={key}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 hover:border-gray-600 transition"
            >
              <cfg.icon className="w-5 h-5 mb-2" style={{ color: cfg.color }} />
              <p className="font-heading font-bold text-sm text-white">{cfg.label}</p>
              <p className="text-xs text-gray-600">{cfg.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mission Control ── */
function MissionView() {
  const store = useCampaignStore();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  // Simulate agent progress polling
  useEffect(() => {
    if (!store.campaignId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${store.campaignId}`);
        if (!res.ok) return;
        const data = await res.json();

        // Update agent statuses
        if (data.agents) {
          Object.entries(data.agents).forEach(([name, info]: [string, any]) => {
            store.setAgentStatus(name as AgentName, info.status, info.lastMessage);
          });
        }

        // Update logs
        if (data.logs) {
          store.setLogs(data.logs);
        }

        // Update progress
        if (data.progress !== undefined) {
          store.setProgress(data.progress);
        }

        // Check if done
        if (data.status === "completed") {
          store.setView("results");
          if (data.results) store.setAllResults(data.results);
          clearInterval(interval);
        }
      } catch { /* ignore polling errors */ }
    }, 2000);

    return () => clearInterval(interval);
  }, [store.campaignId]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.logs]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const doneCount = Object.values(store.agents).filter((a) => a.status === "done").length;
  const totalAgents = Object.keys(store.agents).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-peach animate-pulse" />
            <span className="font-heading font-extrabold text-violet-400">Mission Control</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {formatTime(elapsed)}
            </span>
            <span className="font-mono text-xs text-teal-400">{doneCount}/{totalAgents} agents</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-teal-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${store.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-mono text-right">{Math.round(store.progress)}%</p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {(Object.entries(AGENT_CONFIG) as [AgentName, typeof AGENT_CONFIG[AgentName]][]).map(([key, cfg]) => {
            const state = store.agents[key];
            const isRunning = state.status === "running";
            const isDone = state.status === "done";
            const isError = state.status === "error";

            return (
              <motion.div
                key={key}
                layout
                className={cn(
                  "bg-[var(--bg2)] border rounded-xl p-4 transition-all",
                  isRunning ? "border-violet-500/50 shadow-[0_0_20px_rgba(123,95,255,0.15)]" :
                  isDone ? "border-teal-500/40" :
                  isError ? "border-red-500/40" :
                  "border-[var(--border)]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                  {isRunning && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
                  {isDone && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
                  {state.status === "waiting" && <div className="w-2 h-2 rounded-full bg-gray-700" />}
                </div>
                <p className="font-heading font-bold text-sm text-white">{cfg.label}</p>
                <p className="text-xs text-gray-600 mt-1 truncate">{state.lastMessage || cfg.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Live Terminal */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg3)]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <Terminal className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs text-gray-600 font-mono">agent_logs — live</span>
          </div>
          <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
            {store.logs.length === 0 && (
              <p className="text-gray-700 animate-pulse">En attente des agents...</p>
            )}
            {store.logs.map((log, i) => (
              <div key={log.id || i} className="flex gap-2">
                <span className="text-gray-700 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString("fr-FR")}</span>
                <span className={cn(
                  "flex-shrink-0",
                  log.level === "error" ? "text-red-400" :
                  log.level === "success" ? "text-teal-400" :
                  log.level === "warn" ? "text-yellow-400" :
                  "text-violet-400"
                )}>
                  [{log.agent}]
                </span>
                <span className="text-gray-400">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Results View ── */
function ResultsView() {
  const store = useCampaignStore();
  const [activeTab, setActiveTab] = useState("strategy");
  const [copied, setCopied] = useState<string | null>(null);

  const tabs = [
    { key: "strategy", label: "Strategie", icon: Target },
    { key: "content", label: "Contenu", icon: MessageCircle },
    { key: "influencers", label: "Influenceurs", icon: Users },
    { key: "plan", label: "Plan 14J", icon: TrendingUp },
    { key: "report", label: "Rapport", icon: FileText },
  ];

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getContent = () => {
    const r = store.results;
    switch (activeTab) {
      case "strategy":
        return r.scraper ? JSON.stringify(r.scraper, null, 2) : "Aucune donnee de strategie.";
      case "content":
        return r.content ? JSON.stringify(r.content, null, 2) : "Aucun contenu genere.";
      case "influencers":
        return r.prospection ? JSON.stringify(r.prospection, null, 2) : "Aucun influenceur trouve.";
      case "plan":
        return r.content ? JSON.stringify((r.content as any)?.strategy || {}, null, 2) : "Aucun plan.";
      case "report":
        return r.report ? JSON.stringify(r.report, null, 2) : "Aucun rapport.";
      default:
        return "";
    }
  };

  const content = getContent();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="font-heading font-extrabold text-violet-400">Resultats</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { store.reset(); }}
              className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm font-heading font-bold transition"
            >
              <Sparkles className="w-4 h-4" />
              Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Success Banner */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-6 mb-8 flex items-center gap-4"
        >
          <CheckCircle2 className="w-8 h-8 text-teal-400 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-white text-lg">Mission terminee</p>
            <p className="text-sm text-gray-400">Tous les agents ont termine leur travail. Explore les resultats ci-dessous.</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-heading font-bold transition whitespace-nowrap border",
                activeTab === tab.key
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-[var(--bg2)] border-[var(--border)] text-gray-500 hover:text-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg3)]">
            <span className="text-xs text-gray-600 font-mono">{activeTab}.json</span>
            <div className="flex gap-2">
              <button
                onClick={() => copyText(content, activeTab)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-400 transition"
              >
                {copied === activeTab ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === activeTab ? "Copie" : "Copier"}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-400 transition">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
          <pre className="p-6 text-sm font-mono text-gray-400 overflow-auto max-h-[500px] whitespace-pre-wrap custom-scrollbar">
            {content}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function HomePage() {
  const { view } = useCampaignStore();

  return (
    <AnimatePresence mode="wait">
      {view === "login" && <LoginView key="login" />}
      {view === "setup" && <SetupView key="setup" />}
      {view === "mission" && <MissionView key="mission" />}
      {view === "results" && <ResultsView key="results" />}
    </AnimatePresence>
  );
}
