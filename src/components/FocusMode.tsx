"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RefreshCw, X, Volume2, ShieldAlert, Sparkles, Smartphone } from "lucide-react";

interface FocusModeProps {
  onClose: () => void;
}

export default function FocusMode({ onClose }: FocusModeProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSound, setSelectedSound] = useState<"none" | "rain" | "forest" | "cafe">("none");

  // Mock Blocker Notifications
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Web Audio Context reference for synthetic ambient sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<any[]>([]);

  // Pomodoro countdown timer logic
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          triggerConfettiEffect();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes]);

  // Distraction Blocker Mock Simulator
  useEffect(() => {
    if (!isActive) return;
    
    const distractionMessages = [
      "Distraction Blocked: facebook.com redirect prevented.",
      "Distraction Blocked: youtube.com blocked by Guardian Shield.",
      "Distraction Blocked: reddit.com block override rejected.",
      "Guardian notification: Your phone was picked up. Stay focused!"
    ];

    const interval = setInterval(() => {
      const msg = distractionMessages[Math.floor(Math.random() * distractionMessages.length)];
      setNotifications(prev => [msg, ...prev].slice(0, 3));
    }, 12000); // trigger message block notification periodically

    return () => clearInterval(interval);
  }, [isActive]);

  // Web Audio API ambient noise synthesizers
  const startSynthSound = (type: "rain" | "forest" | "cafe") => {
    stopSynthSounds();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 1. Generate Noise Buffer (White Noise)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // 2. Filter nodes to shape the sound
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (type === "rain") {
        // Low pass filter for heavy rain roar
        filter.type = "lowpass";
        filter.frequency.value = 400;
        gain.gain.value = 0.25;
      } else if (type === "forest") {
        // Band pass filter for wind-like rustles
        filter.type = "bandpass";
        filter.frequency.value = 800;
        filter.Q.value = 0.8;
        gain.gain.value = 0.15;
      } else {
        // Cafe murmur: high pass and band pass filters overlapping
        filter.type = "peaking";
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        gain.gain.value = 0.08;
      }

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      soundNodesRef.current = [whiteNoise, filter, gain];
    } catch (e) {
      console.warn("Web Audio API synthesis failed:", e);
    }
  };

  const stopSynthSounds = () => {
    if (soundNodesRef.current.length > 0) {
      soundNodesRef.current.forEach(node => {
        try { node.stop(); } catch(e){}
        try { node.disconnect(); } catch(e){}
      });
      soundNodesRef.current = [];
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch(e){}
      audioCtxRef.current = null;
    }
  };

  const handleSoundSelect = (sound: typeof selectedSound) => {
    setSelectedSound(sound);
    if (sound === "none") {
      stopSynthSounds();
    } else {
      startSynthSound(sound);
    }
  };

  const triggerConfettiEffect = () => {
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    });
  };

  useEffect(() => {
    return () => stopSynthSounds();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#020205]/98 backdrop-blur-xl z-[999] flex flex-col justify-center items-center p-6"
    >
      
      {/* Background visual orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/10 animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
      
      {/* Top Close button */}
      <button
        onClick={() => {
          stopSynthSounds();
          onClose();
        }}
        className="absolute top-8 right-8 p-3 rounded-full border border-white/5 hover:border-white/20 bg-white/3 text-slate-400 hover:text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main clock UI */}
      <div className="text-center flex flex-col items-center max-w-lg w-full">
        
        <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest pulse-glow">
          <Sparkles className="w-4 h-4" /> Focus Guardian Active
        </div>

        {/* Floating Pomodoro timer */}
        <div className="relative mb-12">
          <div className="text-8xl md:text-9xl font-black text-white tracking-tighter select-none font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          
          {/* Radial blur back shadow */}
          <div className="absolute inset-0 bg-cyan-400/20 blur-[80px] rounded-full z-[-1]" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => {
              setMinutes(25);
              setSeconds(0);
              setIsActive(false);
            }}
            className="p-3.5 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            title="Reset Session"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-cyan-600 flex items-center justify-center border border-cyan-300/20 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            {isActive ? (
              <Pause className="w-8 h-8 fill-white" />
            ) : (
              <Play className="w-8 h-8 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={() => {
              setMinutes(5);
              setSeconds(0);
              setIsActive(true);
            }}
            className="p-3.5 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            title="Short Break"
          >
            <span className="text-xs font-black">5m</span>
          </button>
        </div>

        {/* Audio selector */}
        <div className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 mb-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Synthesize Ambient Sound waves</span>
          
          <div className="grid grid-cols-4 gap-2">
            {(["none", "rain", "forest", "cafe"] as const).map((sound) => {
              const selected = selectedSound === sound;
              return (
                <button
                  key={sound}
                  onClick={() => handleSoundSelect(sound)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    selected
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                      : "bg-white/2 border-white/5 text-slate-400 hover:border-white/15"
                  }`}
                >
                  {sound}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulated Website & phone distraction blocker widgets */}
        <div className="w-full flex flex-col gap-2">
          <AnimatePresence>
            {notifications.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-300 text-xs flex items-center gap-3 text-left"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span className="flex-1 font-medium">{msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
