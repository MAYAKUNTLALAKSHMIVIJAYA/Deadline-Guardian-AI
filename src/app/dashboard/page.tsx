"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Clock, Zap, Target, BookOpen, ChevronRight, CheckCircle, Circle,
  Trash2, Calendar, Compass, Sparkles, AlertTriangle, Play,
  Volume2, RefreshCw, BarChart2, MessageSquare, Send, CheckSquare,
  Flame, Trophy, Activity, TrendingUp, Shield, Coffee, Sun
} from "lucide-react";
import { useDeadlineGuardian } from "@/hooks/useDeadlineGuardian";
import type { Task, TimeBlock } from "@/lib/ai/multiAgent";
import FocusMode from "@/components/FocusMode";

type TabId = "tasks" | "schedule" | "risk" | "habits" | "analytics" | "coach";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "tasks",    label: "Tasks",     icon: CheckSquare },
  { id: "schedule", label: "Schedule",  icon: Calendar },
  { id: "risk",     label: "Risk",      icon: Shield },
  { id: "habits",   label: "Habits",    icon: Flame },
  { id: "analytics",label: "Analytics", icon: BarChart2 },
  { id: "coach",    label: "AI Coach",  icon: MessageSquare },
];

function formatDeadline(ts: number): string {
  const diff = ts - Date.now();
  if (diff < 0) return "OVERDUE";
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d left`;
}

function DeadlineChip({ deadline }: { deadline: number }) {
  const label = formatDeadline(deadline);
  const isOverdue = label === "OVERDUE";
  const isUrgent = !isOverdue && parseInt(label) < 2 && label.endsWith("d left");
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
      isOverdue ? "bg-red-500/15 border-red-500/40 text-red-400" :
      isUrgent  ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                  "bg-slate-700/40 border-white/8 text-slate-500"
    }`}>
      {label}
    </span>
  );
}

// Simple SVG bar chart for analytics
function MiniBarChart({ data }: { data: { date: string; score: number; focusMinutes: number }[] }) {
  const max = Math.max(...data.map(d => d.score), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-cyan-600/60 to-cyan-400/80 transition-all duration-700"
            style={{ height: `${(d.score / max) * 88}px` }}
            title={`Score: ${d.score}`}
          />
          <span className="text-[9px] text-slate-500 font-semibold">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, tasks, schedule, habits, risk, productivityLogs, loading,
    addTask, toggleSubtask, completeTask, deleteTask, toggleHabit,
    triggerReschedule, logout, updateSchedule
  } = useDeadlineGuardian();

  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [focusModeActive, setFocusModeActive] = useState(false);

  // Task input
  const [taskStatement, setTaskStatement] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Voice
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceWave, setVoiceWave] = useState<number[]>([]);
  const recognitionRef = useRef<any>(null);

  // Coach chat
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "👋 Hello! I am your Chief Productivity Officer. Ask me: \"What should I do now?\", \"Will I finish before Friday?\", or \"Optimize my week\"." }
  ]);
  const [coachLoading, setCoachLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTaskStatement(text);
        setVoiceActive(false);
        setVoiceWave([]);
      };
      rec.onend = () => { setVoiceActive(false); setVoiceWave([]); };
      recognitionRef.current = rec;
    }
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING GUARDIAN ARCHITECTURE...</p>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────
  const getRiskColor = (prob: number) => {
    if (prob > 75) return { text: "text-red-400", stroke: "stroke-red-400", bg: "from-red-600/60 to-red-400" };
    if (prob > 40) return { text: "text-yellow-400", stroke: "stroke-yellow-400", bg: "from-yellow-600/60 to-yellow-400" };
    return { text: "text-cyan-400", stroke: "stroke-cyan-400", bg: "from-cyan-600/60 to-cyan-400" };
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "critical": return "bg-red-500/15 border-red-500/40 text-red-400";
      case "high":     return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "medium":   return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      default:         return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  const pendingCount = tasks.filter(t => t.status !== "completed").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const riskColors = getRiskColor(risk?.probability ?? 0);
  const circumference = 2 * Math.PI * 42;
  const riskOffset = circumference * (1 - (risk?.probability ?? 0) / 100);

  // ── Voice ──────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported. Please use Chrome and type instead.");
      return;
    }
    if (voiceActive) {
      recognitionRef.current.stop();
    } else {
      setVoiceActive(true);
      recognitionRef.current.start();
      const interval = setInterval(() => {
        setVoiceWave(Array.from({ length: 12 }, () => Math.random() * 32 + 4));
      }, 120);
      recognitionRef.current.onend = () => {
        clearInterval(interval);
        setVoiceActive(false);
        setVoiceWave([]);
      };
    }
  };

  // ── AI Task Parser ────────────────────────────────────────
  const handleParseStatement = async () => {
    if (!taskStatement.trim()) return;
    setIsAiParsing(true);
    const input = taskStatement.toLowerCase();

    try {
      const res = await fetch("/api/tasks/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: taskStatement })
      });
      if (!res.ok) throw new Error("backend offline");
      const data = await res.json();
      data.tasks?.forEach((t: any) => addTask({ ...t, status: "pending" }));
    } catch {
      // Smart local heuristic parser
      let priority: Task["priority"] = "medium";
      let urgency = 5, importance = 5, estimatedDuration = 90;
      let actionPlan: Task["actionPlan"] = [];

      if (input.includes("exam") || input.includes("quiz") || input.includes("test")) {
        priority = "critical"; urgency = 9; importance = 10; estimatedDuration = 180;
        actionPlan = [
          { id: `sp-${Date.now()}-1`, title: "Gather study materials & notes", completed: false, durationMinutes: 45 },
          { id: `sp-${Date.now()}-2`, title: "Review key concepts & formulas", completed: false, durationMinutes: 75 },
          { id: `sp-${Date.now()}-3`, title: "Practice mock questions", completed: false, durationMinutes: 60 },
        ];
      } else if (input.includes("assignment") || input.includes("project") || input.includes("homework") || input.includes("code")) {
        priority = "high"; urgency = 8; importance = 8; estimatedDuration = 120;
        actionPlan = [
          { id: `sp-${Date.now()}-1`, title: "Plan structure & outline", completed: false, durationMinutes: 30 },
          { id: `sp-${Date.now()}-2`, title: "Core implementation", completed: false, durationMinutes: 60 },
          { id: `sp-${Date.now()}-3`, title: "Review, test & submit", completed: false, durationMinutes: 30 },
        ];
      } else if (input.includes("meeting") || input.includes("call") || input.includes("presentation")) {
        priority = "high"; urgency = 7; importance = 8; estimatedDuration = 60;
        actionPlan = [
          { id: `sp-${Date.now()}-1`, title: "Prepare agenda & talking points", completed: false, durationMinutes: 30 },
          { id: `sp-${Date.now()}-2`, title: "Attend and take notes", completed: false, durationMinutes: 30 },
        ];
      } else if (input.includes("read") || input.includes("study") || input.includes("research")) {
        priority = "medium"; urgency = 6; importance = 7; estimatedDuration = 90;
        actionPlan = [
          { id: `sp-${Date.now()}-1`, title: "First pass reading", completed: false, durationMinutes: 45 },
          { id: `sp-${Date.now()}-2`, title: "Take notes & summarize", completed: false, durationMinutes: 45 },
        ];
      } else {
        priority = "low"; urgency = 3; importance = 4; estimatedDuration = 30;
      }

      addTask({
        title: taskStatement.charAt(0).toUpperCase() + taskStatement.slice(1),
        description: "Parsed by Guardian AI Planner",
        status: "pending",
        priority, urgency, importance,
        difficulty: priority === "critical" ? 8 : priority === "high" ? 6 : 3,
        energyRequirement: priority === "critical" ? "high" : priority === "high" ? "medium" : "low",
        estimatedDuration,
        deadline: Date.now() + 4 * 24 * 60 * 60 * 1000,
        dependencies: [],
        actionPlan
      });
    } finally {
      setTaskStatement("");
      setIsAiParsing(false);
    }
  };

  // ── AI Coach ─────────────────────────────────────────────
  const handleCoachChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setCoachLoading(true);

    try {
      const res = await fetch("/api/coach/motivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, risk, message: userMsg })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: data.message }]);
      setCoachLoading(false);
    } catch {
      const p = userMsg.toLowerCase();
      let aiText = "Analyzing your workload... Focus on your highest-priority task first. Every completed subtask compounds into momentum.";

      if (p.includes("should i do") || p.includes("what now") || p.includes("next")) {
        const topTask = tasks.filter(t => t.status !== "completed").sort((a, b) => b.urgency - a.urgency)[0];
        aiText = topTask
          ? `⚡ Execute "${topTask.title}" immediately. With urgency ${topTask.urgency}/10 and a ${formatDeadline(topTask.deadline)}, this is your highest leverage move right now.`
          : "🎯 All tasks are clear! Use this buffer time to build tomorrow's schedule or start a deep learning block.";
      } else if (p.includes("postpone") || p.includes("skip") || p.includes("delay")) {
        const lowTask = tasks.filter(t => t.status !== "completed" && t.priority === "low")[0];
        aiText = lowTask
          ? `✅ You can safely defer "${lowTask.title}" — urgency ${lowTask.urgency}/10, no blocking dependencies. Reassign it to weekend morning.`
          : "All your active tasks are mission-critical. No safe postponements detected right now.";
      } else if (p.includes("finish") || p.includes("done") || p.includes("friday") || p.includes("deadline")) {
        const totalMin = tasks.filter(t => t.status !== "completed").reduce((s, t) => s + t.estimatedDuration, 0);
        aiText = `📊 ${pendingCount} task(s) remain with ~${Math.ceil(totalMin / 60)}h of total work. Current risk probability is ${risk?.probability ?? 0}%. ${risk?.recommendation || "Stay on plan."}`;
      } else if (p.includes("optimize") || p.includes("schedule") || p.includes("reschedule")) {
        triggerReschedule();
        aiText = "⚙️ Scheduler Agent activated. I've re-clustered your focus blocks, injected recovery breaks, and aligned complex tasks to your peak morning energy window.";
      } else if (p.includes("risk") || p.includes("worried") || p.includes("safe")) {
        aiText = `🛡️ Risk Level: ${risk?.probability ?? 0}%. ${risk?.reason || ""} My recommendation: ${risk?.recommendation || "Stay focused."}`;
      } else if (p.includes("motivate") || p.includes("tired") || p.includes("help")) {
        aiText = "💪 Every session you complete today is an investment your future self will thank you for. You're building discipline that outlasts any single deadline. Keep going — one block at a time.";
      }

      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: "ai", text: aiText }]);
        setCoachLoading(false);
      }, 900);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen relative z-10">

      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="border-b border-white/5 py-3 px-4 md:px-6 flex items-center justify-between glass backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-none">Deadline Guardian</h1>
            <p className="text-[9px] tracking-widest text-cyan-400 font-bold uppercase leading-none mt-0.5">AI Chief Productivity Officer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* XP pill */}
          <div className="hidden md:flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/8 border border-yellow-400/20">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-300">Lv {user.metrics?.level || 1}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-400/8 border border-purple-400/20">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300">{user.metrics?.xp || 0} XP</span>
            </div>
            {/* Quick stats */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-400/8 border border-cyan-400/20">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300">{completedCount}/{tasks.length} done</span>
            </div>
            {/* Risk badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              (risk?.probability ?? 0) > 75 ? "bg-red-400/8 border-red-400/20 text-red-300" :
              (risk?.probability ?? 0) > 40 ? "bg-yellow-400/8 border-yellow-400/20 text-yellow-300" :
              "bg-green-400/8 border-green-400/20 text-green-300"
            }`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{risk?.probability ?? 0}% risk</span>
            </div>
          </div>

          <button
            onClick={() => setFocusModeActive(true)}
            className="glass-button-primary py-2 px-4 text-sm font-semibold rounded-full flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Deep Focus
          </button>

          <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* ── TAB NAV ─────────────────────────────────────── */}
      <nav className="flex gap-1 px-4 md:px-6 pt-4 pb-0 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                active
                  ? "border-cyan-400 text-cyan-300 bg-cyan-400/5"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-cyan-400" : ""}`} />
              {tab.label}
              {tab.id === "tasks" && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black">
                  {pendingCount}
                </span>
              )}
              {tab.id === "risk" && (risk?.probability ?? 0) > 40 && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-b border-white/5 mx-4 md:mx-6" />

      {/* ── TAB CONTENT ─────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">

          {/* ─ TASKS TAB ─────────────────────────────── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Natural language input */}
              <div className="lg:col-span-2 glass-card p-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> AI Planner Agent
                  </h3>
                  <p className="text-xs text-slate-500">Describe any deadline or task in natural language and the AI will structure it.</p>
                </div>

                <div className="relative">
                  <textarea
                    value={taskStatement}
                    onChange={e => setTaskStatement(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleParseStatement())}
                    placeholder={`e.g. "I have a physics quiz next Tuesday and a database assignment due Friday"`}
                    rows={3}
                    className="glass-input w-full pr-10 resize-none text-sm placeholder:text-slate-600"
                  />
                  <button
                    onClick={toggleVoice}
                    className={`absolute bottom-3 right-3 p-1.5 rounded-full border transition-all ${
                      voiceActive
                        ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {voiceActive && (
                  <div className="flex items-center justify-center gap-1 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    {voiceWave.map((h, i) => (
                      <div key={i} className="w-1 bg-red-400 rounded-full transition-all duration-75" style={{ height: `${h}px` }} />
                    ))}
                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider ml-2">Listening</span>
                  </div>
                )}

                <button
                  onClick={handleParseStatement}
                  disabled={isAiParsing || !taskStatement.trim()}
                  className="glass-button-primary py-2.5 justify-center font-bold text-sm w-full disabled:opacity-40"
                >
                  {isAiParsing
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                    : <><Sparkles className="w-4 h-4" /> Compile with AI</>
                  }
                </button>

                {/* Quick tips */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Quick prompts</p>
                  {[
                    "Calculus exam this Monday",
                    "Code review presentation Friday",
                    "Research paper due next week"
                  ].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setTaskStatement(tip)}
                      className="text-xs text-left text-slate-500 hover:text-cyan-400 transition-colors truncate"
                    >
                      → {tip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task list */}
              <div className="lg:col-span-3 glass-card p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-cyan-400" /> Priority Backlog
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                      {pendingCount} pending
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500 font-bold">
                      {completedCount} done
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[520px] pr-1">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                      <BookOpen className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm font-semibold">Backlog is clear</p>
                      <p className="text-xs mt-1">Add a task using the planner on the left</p>
                    </div>
                  ) : (
                    tasks.map(task => {
                      const done = task.status === "completed";
                      const subtasksDone = task.actionPlan?.filter(s => s.completed).length ?? 0;
                      const subtasksTotal = task.actionPlan?.length ?? 0;
                      const progress = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all ${
                            done
                              ? "bg-white/1 border-white/5 opacity-40"
                              : task.priority === "critical"
                              ? "bg-red-500/3 border-red-500/15 hover:border-red-500/25"
                              : "bg-white/2 border-white/6 hover:border-white/12"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => !done && completeTask(task.id)}
                              className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                            >
                              {done
                                ? <CheckCircle className="w-5 h-5 text-cyan-400" />
                                : <Circle className="w-5 h-5" />
                              }
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm font-bold ${done ? "line-through text-slate-500" : "text-white"}`}>
                                  {task.title}
                                </h4>
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>
                              )}

                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-extrabold ${getPriorityBadge(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {task.estimatedDuration}m
                                </span>
                                <DeadlineChip deadline={task.deadline} />
                                {subtasksTotal > 0 && (
                                  <span className="text-[9px] text-slate-500">{subtasksDone}/{subtasksTotal} steps</span>
                                )}
                              </div>

                              {/* Progress bar */}
                              {subtasksTotal > 0 && !done && (
                                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              )}

                              {/* Subtasks */}
                              {!done && task.actionPlan && task.actionPlan.length > 0 && (
                                <div className="mt-3 pl-2 border-l border-white/8 flex flex-col gap-1.5">
                                  {task.actionPlan.map(sub => (
                                    <button
                                      key={sub.id}
                                      onClick={() => toggleSubtask(task.id, sub.id)}
                                      className="flex items-center gap-2 text-left text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                                    >
                                      <span className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border text-[8px] font-bold transition-colors ${
                                        sub.completed
                                          ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-300"
                                          : "border-white/15"
                                      }`}>
                                        {sub.completed && "✓"}
                                      </span>
                                      <span className={sub.completed ? "line-through text-slate-600" : ""}>
                                        {sub.title}
                                        <span className="text-slate-600 ml-1">({sub.durationMinutes}m)</span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors p-1 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ SCHEDULE TAB ──────────────────────────── */}
          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Guardian Daily Timeline</h3>
                    <p className="text-[10px] text-slate-500">Auto-synchronized study clusters · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <button
                  onClick={triggerReschedule}
                  className="glass-button py-2 px-4 text-xs flex items-center gap-1.5 font-bold text-cyan-400 hover:border-cyan-500/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-shuffle AI
                </button>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-5 text-[10px] font-semibold flex-wrap">
                {[
                  { color: "bg-cyan-400", label: "Deep Focus" },
                  { color: "bg-purple-400", label: "Break" },
                  { color: "bg-slate-400", label: "Routine / Buffer" },
                  { color: "bg-red-400", label: "Overdue" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5 text-slate-400">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>

              {schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <Compass className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-semibold">No schedule matrix built yet</p>
                  <button onClick={triggerReschedule} className="mt-3 glass-button-primary px-5 py-2 text-xs">Build My Schedule</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {schedule.map(block => {
                    const linked = tasks.find(t => t.id === block.taskId);
                    const overdue = linked && linked.status !== "completed" && linked.deadline < Date.now();
                    const borderColor = block.completed ? "border-white/5" :
                      overdue ? "border-red-500/30" :
                      block.type === "focus" ? "border-cyan-500/25" :
                      block.type === "break" ? "border-purple-500/15" : "border-white/8";
                    const bgColor = block.completed ? "bg-white/1 opacity-40" :
                      overdue ? "bg-red-500/5" :
                      block.type === "focus" ? "bg-cyan-500/4" :
                      block.type === "break" ? "bg-purple-500/4" : "bg-white/2";
                    return (
                      <div key={block.id} className={`flex items-center gap-4 p-3.5 rounded-xl border relative overflow-hidden transition-all ${bgColor} ${borderColor}`}>
                        {block.type === "focus" && !block.completed && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400" />
                        )}
                        <div className="w-24 shrink-0 text-right">
                          <span className="text-xs font-bold text-slate-300">{block.startTime}</span>
                          <span className="text-[10px] text-slate-600 block">→ {block.endTime}</span>
                        </div>
                        <button
                          onClick={() => {
                            updateSchedule(schedule.map(b => b.id === block.id ? { ...b, completed: !b.completed } : b));
                          }}
                          className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                        >
                          {block.completed ? <CheckCircle className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              block.type === "focus"  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" :
                              block.type === "break"  ? "bg-purple-500/10 border-purple-500/20 text-purple-300" :
                              block.type === "buffer" ? "bg-slate-700/40 border-white/10 text-slate-400" :
                                                        "bg-slate-700/40 border-white/10 text-slate-400"
                            }`}>
                              {block.type}
                            </span>
                            {overdue && (
                              <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Deadline Threat
                              </span>
                            )}
                          </div>
                          <h4 className={`text-sm font-bold mt-1 ${block.completed ? "line-through text-slate-600" : "text-slate-200"}`}>
                            {block.label}
                          </h4>
                          {linked && (
                            <p className="text-[10px] text-slate-600 mt-0.5">→ {linked.title} · {formatDeadline(linked.deadline)}</p>
                          )}
                        </div>
                        {block.type === "focus" && <Sun className="w-4 h-4 text-cyan-500/40 shrink-0" />}
                        {block.type === "break" && <Coffee className="w-4 h-4 text-purple-500/40 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─ RISK TAB ──────────────────────────────── */}
          {activeTab === "risk" && (
            <motion.div key="risk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Circular meter */}
              <div className="glass-card p-6 flex flex-col items-center gap-5">
                <h3 className="text-sm font-bold text-slate-200 self-start flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> Deadline Risk Meter
                </h3>
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      className={`transition-all duration-1000 ${riskColors.stroke}`}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={riskOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${riskColors.text}`}>{risk?.probability ?? 0}%</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Risk</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Confidence</p>
                    <p className="text-xl font-black text-cyan-400">{risk?.confidence ?? 0}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pending</p>
                    <p className="text-xl font-black text-purple-400">{pendingCount}</p>
                  </div>
                </div>
              </div>

              {/* Analysis + task risk table */}
              <div className="flex flex-col gap-4">
                <div className="glass-card p-5">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-2 tracking-wider">Risk Analysis</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{risk?.reason || "Calculating workload risk profiles..."}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-extrabold uppercase text-cyan-400 mb-2 tracking-wider">CPO Recommendation</h4>
                    <p className="text-sm text-cyan-200 leading-relaxed">{risk?.recommendation || "Hold steady. Scheduling engine is compiling safety margins."}</p>
                  </div>
                </div>

                {/* Per-task risk breakdown */}
                <div className="glass-card p-5">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-3 tracking-wider">Per-Task Risk View</h4>
                  <div className="flex flex-col gap-2">
                    {tasks.filter(t => t.status !== "completed").length === 0 ? (
                      <p className="text-xs text-slate-600">All tasks completed — no active risks.</p>
                    ) : (
                      tasks.filter(t => t.status !== "completed").sort((a, b) => b.urgency - a.urgency).map(task => {
                        const daysLeft = Math.max(0, Math.ceil((task.deadline - Date.now()) / 86400000));
                        const hoursNeeded = task.estimatedDuration / 60;
                        const isAt = daysLeft < hoursNeeded;
                        return (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/2 border border-white/5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === "critical" ? "bg-red-400" : task.priority === "high" ? "bg-orange-400" : "bg-blue-400"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                              <p className="text-[10px] text-slate-500">{hoursNeeded.toFixed(1)}h needed · {daysLeft}d left</p>
                            </div>
                            {isAt && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ HABITS TAB ────────────────────────────── */}
          {activeTab === "habits" && (
            <motion.div key="habits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-orange-400" /> Habit Consistency Tracker
                </h3>
                {habits.length === 0 ? (
                  <p className="text-xs text-slate-600 py-8 text-center">No habits configured. Add them during onboarding or profile setup.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {habits.map(habit => {
                      const today = new Date().toISOString().split("T")[0];
                      const doneToday = habit.history.includes(today);
                      return (
                        <div key={habit.id} className={`p-4 rounded-xl border transition-all ${doneToday ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/2 border-white/8 hover:border-white/15"}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{habit.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-slate-500 capitalize">{habit.frequency}</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400">
                                  <Zap className="w-3 h-3 fill-yellow-400" /> {habit.streak} day streak
                                </span>
                                {habit.streak >= 7 && <span className="text-[10px] text-orange-400 font-bold">🔥 On fire!</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleHabit(habit.id, today)}
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base transition-all ${
                                doneToday
                                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                                  : "border-white/15 text-slate-500 hover:border-white/30 hover:text-white"
                              }`}
                            >
                              {doneToday ? "✓" : "○"}
                            </button>
                          </div>
                          {/* History dots */}
                          <div className="flex gap-1 mt-3">
                            {Array.from({ length: 7 }).map((_, i) => {
                              const d = new Date();
                              d.setDate(d.getDate() - (6 - i));
                              const ds = d.toISOString().split("T")[0];
                              const done = habit.history.includes(ds);
                              return (
                                <div
                                  key={i}
                                  title={ds}
                                  className={`flex-1 h-1.5 rounded-full ${done ? "bg-cyan-400" : "bg-white/8"}`}
                                />
                              );
                            })}
                          </div>
                          <p className="text-[9px] text-slate-600 mt-1">Last 7 days</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* XP / gamification panel */}
              <div className="flex flex-col gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Guardian Rank
                  </h3>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                      <span className="text-2xl font-black text-white">{user.metrics?.level || 1}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-extrabold text-white">Level {user.metrics?.level || 1} Guardian</p>
                      <p className="text-xs text-slate-400">{user.metrics?.xp || 0} XP · {100 - ((user.metrics?.xp || 0) % 100)} XP to next level</p>
                    </div>
                    {/* XP bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${((user.metrics?.xp || 0) % 100)}%` }}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {(user.metrics?.badges || ["Early Adopter", "AI Shield"]).map((b: string) => (
                        <span key={b} className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                          🏅 {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-green-400" /> Today's Progress
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                      <p className="text-xl font-black text-cyan-400">{completedCount}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Done</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                      <p className="text-xl font-black text-purple-400">{pendingCount}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Pending</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                      <p className="text-xl font-black text-yellow-400">{schedule.filter(b => b.completed).length}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Blocks</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ ANALYTICS TAB ─────────────────────────── */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Weekly Productivity Score
                </h3>
                <MiniBarChart data={productivityLogs} />
                <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-lg font-black text-cyan-400">
                      {productivityLogs.length > 0
                        ? Math.round(productivityLogs.reduce((s, d) => s + d.score, 0) / productivityLogs.length)
                        : 0}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-purple-400">
                      {productivityLogs.reduce((s, d) => s + d.focusMinutes, 0)}m
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Focus Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-yellow-400">
                      {productivityLogs.reduce((s, d) => s + d.completed, 0)}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Completed</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-purple-400" /> Task Breakdown
                </h3>
                {[
                  { label: "Critical", count: tasks.filter(t => t.priority === "critical").length, color: "bg-red-400", barColor: "from-red-600/60 to-red-400" },
                  { label: "High", count: tasks.filter(t => t.priority === "high").length, color: "bg-orange-400", barColor: "from-orange-600/60 to-orange-400" },
                  { label: "Medium", count: tasks.filter(t => t.priority === "medium").length, color: "bg-blue-400", barColor: "from-blue-600/60 to-blue-400" },
                  { label: "Low", count: tasks.filter(t => t.priority === "low").length, color: "bg-slate-400", barColor: "from-slate-600/60 to-slate-400" },
                  { label: "Completed", count: completedCount, color: "bg-cyan-400", barColor: "from-cyan-600/60 to-cyan-400" },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 mb-2.5">
                    <span className="text-xs text-slate-400 w-20 text-right font-semibold">{row.label}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${row.barColor} rounded-full transition-all duration-700`}
                        style={{ width: tasks.length > 0 ? `${(row.count / tasks.length) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-300 w-5">{row.count}</span>
                  </div>
                ))}
                <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-center">
                    <p className="text-lg font-black text-cyan-400">{tasks.reduce((s, t) => s + t.estimatedDuration, 0)}m</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Total Work</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-center">
                    <p className="text-lg font-black text-purple-400">{tasks.length}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Total Tasks</p>
                  </div>
                </div>
              </div>

              {/* Day-by-day log */}
              <div className="glass-card p-5 md:col-span-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-cyan-400" /> Daily Log
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase font-bold border-b border-white/5">
                        <th className="text-left py-2 pr-4">Day</th>
                        <th className="text-right py-2 pr-4">Score</th>
                        <th className="text-right py-2 pr-4">Tasks Done</th>
                        <th className="text-right py-2">Focus Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productivityLogs.map((log, i) => (
                        <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                          <td className="py-2.5 pr-4 font-semibold text-slate-300">{log.date}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`font-black ${log.score >= 90 ? "text-green-400" : log.score >= 70 ? "text-cyan-400" : "text-yellow-400"}`}>
                              {log.score}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-300 font-semibold">{log.completed}</td>
                          <td className="py-2.5 text-right text-slate-400">{log.focusMinutes}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ AI COACH TAB ──────────────────────────── */}
          {activeTab === "coach" && (
            <motion.div key="coach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Chat */}
              <div className="lg:col-span-2 glass-card p-5 flex flex-col h-[580px]">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Chief Productivity Officer Console
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> ONLINE
                  </span>
                </h3>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 text-sm mb-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === "user"
                        ? "self-end bg-cyan-500/10 border border-cyan-500/25 text-cyan-100 rounded-br-sm"
                        : "self-start bg-white/4 border border-white/8 text-slate-200 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  ))}
                  {coachLoading && (
                    <div className="self-start bg-white/4 border border-white/8 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask your CPO anything..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCoachChat()}
                    className="glass-input flex-1 py-2 px-3.5 text-sm"
                  />
                  <button onClick={handleCoachChat} className="glass-button p-2.5 hover:border-cyan-500/30">
                    <Send className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>

              {/* Suggestions sidebar */}
              <div className="flex flex-col gap-4">
                <div className="glass-card p-5">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-3 tracking-wider">Quick Commands</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { q: "What should I do now?", icon: "⚡" },
                      { q: "What can I postpone?", icon: "📌" },
                      { q: "Will I finish before Friday?", icon: "📅" },
                      { q: "Optimize my schedule", icon: "⚙️" },
                      { q: "Assess my risk level", icon: "🛡️" },
                      { q: "I'm feeling unmotivated", icon: "💪" },
                    ].map(cmd => (
                      <button
                        key={cmd.q}
                        onClick={() => { setChatInput(cmd.q); }}
                        className="text-left text-xs text-slate-400 hover:text-cyan-300 px-3 py-2.5 rounded-lg bg-white/2 hover:bg-cyan-500/5 border border-white/5 hover:border-cyan-500/20 transition-all font-medium"
                      >
                        {cmd.icon} {cmd.q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current risk snapshot */}
                <div className="glass-card p-5">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-3 tracking-wider">Live Snapshot</h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk Level</span>
                      <span className={`font-black ${riskColors.text}`}>{risk?.probability ?? 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tasks Pending</span>
                      <span className="font-black text-slate-200">{pendingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completed</span>
                      <span className="font-black text-cyan-400">{completedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Your XP</span>
                      <span className="font-black text-purple-400">{user.metrics?.xp || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusModeActive && <FocusMode onClose={() => setFocusModeActive(false)} />}
      </AnimatePresence>
    </div>
  );
}
