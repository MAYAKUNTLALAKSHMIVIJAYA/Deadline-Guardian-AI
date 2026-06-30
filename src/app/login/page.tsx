"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sparkles,
  Brain,
  Clock,
  Zap,
  Target,
  ChevronRight,
  ChevronLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  AlertCircle,
} from "lucide-react";
import { useDeadlineGuardian } from "@/hooks/useDeadlineGuardian";
import { firebaseAuth } from "@/lib/firebase.config";

const STEPS = ["Auth", "Time", "Energy", "Goals", "Finish"];

type AuthMode = "choose" | "email-login" | "email-register";

export default function LoginPage() {
  const router = useRouter();
  const { loginAndOnboard } = useDeadlineGuardian();

  const [currentStep, setCurrentStep] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("choose");
  const [authError, setAuthError] = useState("");

  // Email form states
  const [emailName, setEmailName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding states
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [workHours, setWorkHours] = useState("09:00-17:00");
  const [sleepTime, setSleepTime] = useState("23:00-07:00");
  const [energyLevel, setEnergyLevel] = useState<"low" | "medium" | "high">("medium");
  const [focusHours, setFocusHours] = useState(3);
  const [habits, setHabits] = useState<string[]>([]);
  const [habitInput, setHabitInput] = useState("");

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    else setAuthMode("choose");
  };

  const addGoal = () => {
    if (goalInput.trim()) { setGoals([...goals, goalInput.trim()]); setGoalInput(""); }
  };
  const addHabit = () => {
    if (habitInput.trim()) { setHabits([...habits, habitInput.trim()]); setHabitInput(""); }
  };

  const afterAuth = () => {
    setAuthLoading(false);
    setAuthError("");
    handleNext();
  };

  // ── OAuth handlers ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await firebaseAuth.signInWithGoogle();
      afterAuth();
    } catch (err: any) {
      setAuthError(err?.message || "Google sign-in failed. Please try again.");
      setAuthLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await firebaseAuth.signInWithGitHub();
      afterAuth();
    } catch (err: any) {
      setAuthError(err?.message || "GitHub sign-in failed. Please try again.");
      setAuthLoading(false);
    }
  };

  // ── Email handlers ──────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email || !password) { setAuthError("Please fill in all fields."); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      await firebaseAuth.signInWithEmail(email, password);
      afterAuth();
    } catch (err: any) {
      setAuthError(err?.message || "Login failed. Check your credentials.");
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!emailName || !email || !password) { setAuthError("Please fill in all fields."); return; }
    if (password.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      await firebaseAuth.createWithEmail(email, password, emailName);
      afterAuth();
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed. Please try again.");
      setAuthLoading(false);
    }
  };

  // ── Complete onboarding ─────────────────────────────────────
  const handleComplete = async () => {
    setAuthLoading(true);
    await loginAndOnboard({ goals, workHours, sleepTime, energyLevel, focusHours, habits });
    setTimeout(() => {
      setAuthLoading(false);
      router.push("/dashboard");
    }, 1800);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 min-h-screen relative z-10">

      {/* Ambient rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-cyan-400/5 pointer-events-none animate-pulse z-[-1]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-purple-400/5 pointer-events-none z-[-1]" />

      <div className="w-full max-w-xl glass-card p-6 md:p-8 relative overflow-hidden backdrop-blur-3xl">

        {/* Top glow bar */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Progress dots (onboarding steps only) */}
        {currentStep > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            {STEPS.slice(1).map((step, idx) => (
              <div
                key={step}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx + 1 <= currentStep ? "w-12 bg-cyan-400" : "w-6 bg-white/10"
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ─── STEP 0: Auth chooser ─────────────────────────── */}
          {currentStep === 0 && authMode === "choose" && (
            <motion.div
              key="auth-choose"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-center flex flex-col items-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-5 border border-cyan-500/30 pulse-glow">
                <Brain className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                Deadline <span className="text-gradient-cyan-purple">Guardian AI</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                Sign in to activate your personal AI Chief Productivity Officer.
              </p>

              {authError && (
                <div className="w-full flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {authError}
                </div>
              )}

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="glass-button-primary w-full py-3.5 flex items-center justify-center gap-3 font-semibold text-base mb-3"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                      <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                      <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                      <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* GitHub */}
              <button
                onClick={handleGitHubLogin}
                disabled={authLoading}
                className="w-full py-3.5 flex items-center justify-center gap-3 font-semibold text-base mb-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-slate-500 font-semibold">OR</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Email options */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setAuthMode("email-login"); setAuthError(""); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-cyan-400/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-cyan-400" /> Sign In
                </button>
                <button
                  onClick={() => { setAuthMode("email-register"); setAuthError(""); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-purple-400/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-purple-400" /> Register
                </button>
              </div>

              <div className="flex items-center gap-2 mt-6 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Secured by Firebase Auth · Local mode if unconfigured
              </div>
            </motion.div>
          )}

          {/* ─── Email Login ──────────────────────────────────── */}
          {currentStep === 0 && authMode === "email-login" && (
            <motion.div
              key="email-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="text-2xl font-extrabold mb-1">Welcome back</h2>
                <p className="text-slate-400 text-sm">Sign in to your Guardian account</p>
              </div>

              {authError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {authError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                    className="glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                      className="glass-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEmailLogin}
                disabled={authLoading}
                className="glass-button-primary w-full py-3.5 flex items-center justify-center gap-2 font-semibold"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Mail className="w-4 h-4" /> Sign In with Email</>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setAuthMode("choose")} className="text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button onClick={() => { setAuthMode("email-register"); setAuthError(""); }} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                  No account? Register →
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Email Register ────────────────────────────────── */}
          {currentStep === 0 && authMode === "email-register" && (
            <motion.div
              key="email-register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="text-2xl font-extrabold mb-1">Create Account</h2>
                <p className="text-slate-400 text-sm">Join Guardian and never miss a deadline again</p>
              </div>

              {authError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {authError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailRegister()}
                      className="glass-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Minimum 6 characters required</p>
                </div>
              </div>

              <button
                onClick={handleEmailRegister}
                disabled={authLoading}
                className="glass-button-primary w-full py-3.5 flex items-center justify-center gap-2 font-semibold"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><User className="w-4 h-4" /> Create Account</>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setAuthMode("choose")} className="text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button onClick={() => { setAuthMode("email-login"); setAuthError(""); }} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                  Have an account? Sign in →
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 1: Time Windows ─────────────────────────── */}
          {currentStep === 1 && (
            <motion.div key="step-time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold">Define Work & Sleep Limits</h2>
              </div>
              <p className="text-slate-400 text-sm">Knowing when you are active helps the scheduler protect your offline hours.</p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Default Work/Study Hours</label>
                  <select value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="glass-input">
                    <option value="09:00-17:00" className="bg-slate-900">09:00 AM – 05:00 PM (Standard)</option>
                    <option value="08:00-16:00" className="bg-slate-900">08:00 AM – 04:00 PM (Early Bird)</option>
                    <option value="12:00-20:00" className="bg-slate-900">12:00 PM – 08:00 PM (Afternoon)</option>
                    <option value="07:00-15:00" className="bg-slate-900">07:00 AM – 03:00 PM (Hyper Morning)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Sleep Buffer Window</label>
                  <select value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="glass-input">
                    <option value="23:00-07:00" className="bg-slate-900">11:00 PM – 07:00 AM (Recommended)</option>
                    <option value="22:00-06:00" className="bg-slate-900">10:00 PM – 06:00 AM (Early night)</option>
                    <option value="00:00-08:00" className="bg-slate-900">12:00 AM – 08:00 AM (Late night)</option>
                    <option value="01:00-09:00" className="bg-slate-900">01:00 AM – 09:00 AM (Night owl)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button onClick={handleBack} className="glass-button text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleNext} className="glass-button-primary text-sm px-6">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Energy ───────────────────────────────── */}
          {currentStep === 2 && (
            <motion.div key="step-energy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold">Declare Productivity Baseline</h2>
              </div>
              <p className="text-slate-400 text-sm">How do you describe your daily focus energy? The Planner Agent maps difficult tasks to your peak hours.</p>

              <div className="grid grid-cols-3 gap-3">
                {(["low", "medium", "high"] as const).map((level) => {
                  const selected = energyLevel === level;
                  return (
                    <button key={level} onClick={() => setEnergyLevel(level)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        selected ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "bg-white/2 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <Zap className={`w-8 h-8 mb-2 ${selected ? "text-cyan-400 fill-cyan-400" : "text-slate-500"}`} />
                      <span className="capitalize font-semibold text-sm">{level}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">Daily Deep Focus Limit</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="8" value={focusHours} onChange={(e) => setFocusHours(Number(e.target.value))} className="flex-1 accent-cyan-400" />
                  <span className="font-bold text-cyan-400 text-lg w-16">{focusHours} hrs</span>
                </div>
                <p className="text-xs text-slate-500">Most professionals have 3–4 hours of deep cognitive focus per day.</p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button onClick={handleBack} className="glass-button text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleNext} className="glass-button-primary text-sm px-6">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Goals & Habits ───────────────────────── */}
          {currentStep === 3 && (
            <motion.div key="step-goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold">What are you working towards?</h2>
              </div>
              <p className="text-slate-400 text-sm">Planner Agent uses these milestones to weight scheduling algorithms.</p>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">Main Focus Goals</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. Pass Biology Exam" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoal()} className="glass-input flex-1" />
                  <button onClick={addGoal} className="glass-button text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 min-h-[28px]">
                  {goals.map((g, i) => (
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">{g}</span>
                  ))}
                  {goals.length === 0 && <span className="text-xs text-slate-500">No goals yet — press Enter or click Add.</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">Desired Habits to Track</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. Read 20 pages, Gym workout" value={habitInput} onChange={(e) => setHabitInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} className="glass-input flex-1" />
                  <button onClick={addHabit} className="glass-button text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 min-h-[28px]">
                  {habits.map((h, i) => (
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">{h}</span>
                  ))}
                  {habits.length === 0 && <span className="text-xs text-slate-500">No habits yet.</span>}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button onClick={handleBack} className="glass-button text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleNext} className="glass-button-primary text-sm px-6">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Launch ───────────────────────────────── */}
          {currentStep === 4 && (
            <motion.div key="step-finish" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/30 pulse-glow">
                <Sparkles className="w-8 h-8 text-purple-400 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Initialize Chief Productivity Agent</h2>
              <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                Planner, Scheduler, and Risk engines are ready. Click Initialize to launch your OS workspace.
              </p>

              <button
                onClick={handleComplete}
                disabled={authLoading}
                className="glass-button-primary w-full py-4 flex items-center justify-center gap-3 font-semibold text-lg"
              >
                {authLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Initialize Guardian OS <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              <button onClick={handleBack} className="glass-button text-sm mt-6"><ChevronLeft className="w-4 h-4" /> Back</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
