"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ShieldCheck, Sparkles, Clock, Target, Calendar, ArrowRight, Zap, Play, MessageSquare, Volume2, ShieldAlert } from "lucide-react";
import BrainVisualization from "@/components/BrainVisualization";

export default function LandingPage() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [timeOfDayGradient, setTimeOfDayGradient] = useState("");
  
  // Testimonial selection state
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // FAQ accordion open states
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Cursor position state for parallax details
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const taglines = [
    "The AI that ensures you never miss what matters.",
    "Your personal Chief Productivity Officer.",
    "Autonomous schedules customized to your biology.",
    "The shield against deadline failures."
  ];

  // Dynamic Background shift depending on hours
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) {
      // Morning: Light cyan gradient accents
      setTimeOfDayGradient("from-cyan-950/40 via-[#030308] to-[#030308]");
    } else if (hours >= 11 && hours < 17) {
      // Afternoon: Blue sky/nebula shift
      setTimeOfDayGradient("from-blue-950/40 via-[#030308] to-[#030308]");
    } else if (hours >= 17 && hours < 21) {
      // Sunset: Amber/orange accent
      setTimeOfDayGradient("from-amber-950/20 via-[#030308] to-[#030308]");
    } else {
      // Night: Deep purple space
      setTimeOfDayGradient("from-purple-950/30 via-[#030308] to-[#030308]");
    }
  }, []);

  // Simple typing animation logic
  useEffect(() => {
    let index = 0;
    let timer: any = null;
    const currentTagline = taglines[taglineIndex];

    const type = () => {
      if (index <= currentTagline.length) {
        setTypedText(currentTagline.slice(0, index));
        index++;
        timer = setTimeout(type, 45);
      } else {
        // Wait and change tagline
        timer = setTimeout(() => {
          setTaglineIndex((prev) => (prev + 1) % taglines.length);
        }, 3000);
      }
    };

    type();

    return () => clearTimeout(timer);
  }, [taglineIndex]);

  // Handle Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) * 0.03,
        y: (e.clientY - window.innerHeight / 2) * 0.03
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Hackathon Countdown timer
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 23, seconds: 54 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      title: "Multi-Agent System",
      description: "Separate Planner, Scheduler, Risk, and Motivator agents negotiate schedules to match your cognitive limits."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      title: "Prioritization Math",
      description: "Computes task weight using urgencies, difficulty values, sleep offsets, and actual deadlines."
    },
    {
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      title: "Deadline Risk Engine",
      description: "Calculates probability metrics for deadline failure, detailing custom recommendations to adjust blocks."
    },
    {
      icon: <Volume2 className="w-6 h-6 text-yellow-400" />,
      title: "Speech & Audio Synthesis",
      description: "Speak naturally to register milestones. Engage synthesized sound wave machines to protect study slots."
    }
  ];

  const faqList = [
    { q: "Is this a simple checklist app?", a: "No. Deadline Guardian AI is a scheduling operating system. It calculates workload math, manages breaks, structures study slots, and actively reschedules blocks dynamically." },
    { q: "How does the AI Risk engine work?", a: "It evaluates estimated duration times against remaining calendar spots, factor in historical productivity scores, and warns you if you are scheduled for failure." },
    { q: "Can I synchronize Google Calendar?", a: "Yes. The platform maps calendars, analyzes events, and blocks slots automatically to secure study safety cushions." }
  ];

  return (
    <div className={`flex-1 flex flex-col relative z-10 transition-colors duration-1000 bg-gradient-to-b ${timeOfDayGradient}`}>
      
      {/* Navigation HUD */}
      <nav className="max-w-7xl w-full mx-auto px-6 md:px-8 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">Deadline Guardian</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="glass-button text-xs font-semibold py-2 px-4">
            Sign In
          </Link>
          <Link href="/login" className="glass-button-primary text-xs font-bold py-2 px-5">
            Launch Agent
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-8 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative min-h-[80vh]">
        
        {/* Marketing Details (col-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative z-20">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Productivity OS
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            The AI that ensures you <br />
            <span className="text-gradient-cyan-purple">never miss what matters.</span>
          </h1>

          <div className="h-8 md:h-12 flex items-center">
            <span className="text-lg md:text-xl font-medium text-slate-400 border-r-2 border-cyan-400 pr-1 animate-pulse font-mono">
              {typedText}
            </span>
          </div>

          <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
            Deadline Guardian AI manages your time, monitors study velocity, structures breaks, and reschedules dynamically when milestones are updated.
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/login" className="glass-button-primary py-3.5 px-8 font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              Get Started for Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            
            {/* Live Hackathon countdown HUD */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/2 border border-white/5 text-xs text-slate-400">
              <span className="font-extrabold text-cyan-400 animate-pulse">HACKATHON LAUNCH:</span>
              <span className="font-mono font-bold">
                {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
              </span>
            </div>
          </div>
        </div>

        {/* 3D Neural Network / Brain Container (col-5) */}
        <div 
          className="lg:col-span-5 h-[350px] md:h-[500px] w-full relative z-10"
          style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }}
        >
          <BrainVisualization />
        </div>
      </section>

      {/* Features Cards Grid Section */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-8 py-24 relative border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
            Engage the <span className="text-gradient-aurora">AI Chief Productivity Officer</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Autonomous workflows structured to compute task complexities, align routines, and predict success velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="glass-card p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Interactive Demo mock */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-8 py-24 border-t border-white/5 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-3xl font-extrabold">How it protects you</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">1</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Register Goals</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Speak or write tasks naturally. The AI structures sub-checklists and computes duration requirements.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">2</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Run Risk Calculations</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Risk engines analyze backlog volumes against actual timelines, predicting completion confidence scores.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm shrink-0">3</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Synthesize Protection</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Enforce site blocking and synthesize rain or cafe noise waveforms to preserve focus zones.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 w-full p-4 md:p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-6 bg-white/2 border-b border-white/5 flex items-center gap-1.5 px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            
            <div className="mt-6 flex flex-col gap-4 text-xs font-mono">
              <div className="text-slate-500">// AI Planner compiling instruction stream:</div>
              <div className="text-cyan-400">INPUT: "I have biology exam next Monday and math draft due Thursday"</div>
              <div className="text-slate-300">
                [PlannerAgent] &rarr; Extracting parameters...<br />
                - Milestone 1: Biology exam (Critical priority, Urgency 9/10, Due 6 days)<br />
                - Milestone 2: Math draft (High priority, Urgency 8/10, Due 3 days)
              </div>
              <div className="text-purple-400">
                [SchedulerAgent] &rarr; Reshuffling daily time blocks...<br />
                - 09:30 AM: Allocated 120m Deep Study block (Chapter slides)<br />
                - 11:30 AM: Injected 15m restoration break<br />
                - 02:00 PM: Allocated 90m Math writing sprint
              </div>
              <div className="text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" /> WARNING: Math estimated workload exceeds scheduled blocks. Risk is 42%. Recommendation: Add study slot Thursday morning.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-8 py-24 border-t border-white/5 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Pricing Tailored for High Performers</h2>
          <p className="text-slate-400 text-sm">Deploy your AI productivity agent on secure environments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto gap-8">
          {/* Plan 1 */}
          <div className="glass-card p-6 flex flex-col justify-between border-cyan-500/20">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Guardian Core</span>
              <h3 className="text-2xl font-black text-white mb-4">$0 <span className="text-sm font-normal text-slate-500">/ forever</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">Fully featured local dashboard utilizing rule-based planner agents and Web Audio synthesizers.</p>
              
              <ul className="flex flex-col gap-2.5 text-xs text-slate-300 mb-8">
                <li>✓ LocalStorage persistent scheduler</li>
                <li>✓ Natural language heuristic parsing</li>
                <li>✓ Synthesized Rain & Forest noise waves</li>
                <li>✓ Animated risk calculation meters</li>
              </ul>
            </div>
            <Link href="/login" className="glass-button w-full text-center justify-center font-bold">Launch Free Agent</Link>
          </div>

          {/* Plan 2 */}
          <div className="glass-card p-6 flex flex-col justify-between border-purple-500/40 relative shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <div className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold uppercase">Recommended</div>
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-2">Guardian Pro</span>
              <h3 className="text-2xl font-black text-white mb-4">$12 <span className="text-sm font-normal text-slate-500">/ month</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">Unlocks high-performance Gemini 2.5 Pro multi-agent models and bidirectional Google Calendar syncs.</p>
              
              <ul className="flex flex-col gap-2.5 text-xs text-slate-300 mb-8">
                <li>✓ Live Gemini 2.5 Pro multi-agent models</li>
                <li>✓ Bidirectional Google Calendar synchronization</li>
                <li>✓ Real-time cloud Firestore syncing</li>
                <li>✓ Proactive risk-alarm alerts</li>
              </ul>
            </div>
            <Link href="/login" className="glass-button-primary w-full text-center justify-center font-bold">Go Pro Now</Link>
          </div>
        </div>
      </section>

      {/* FAQS Accordions */}
      <section className="max-w-4xl w-full mx-auto px-6 md:px-8 py-24 border-t border-white/5 relative">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="flex flex-col gap-4">
          {faqList.map((faq, i) => {
            const isOpen = faqOpen === i;
            return (
              <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5">
                <button
                  onClick={() => setFaqOpen(isOpen ? null : i)}
                  className="w-full flex justify-between items-center text-left font-bold text-sm text-slate-200"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-500">{isOpen ? "−" : "+"}</span>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-8 text-center text-xs text-slate-600 relative z-20">
        <p className="mb-2">© 2026 Deadline Guardian AI. The AI that ensures you never miss what matters.</p>
        <p>Built with Next.js 15, TypeScript, Tailwind CSS, Framer Motion, and Gemini 2.5 Pro.</p>
      </footer>
    </div>
  );
}
