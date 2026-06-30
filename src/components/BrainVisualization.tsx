"use client";

import React, { useRef, useEffect } from "react";

export default function BrainVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Particle class representing a neuron node in a 3D rotating sphere
    interface Node3D {
      x: number;
      y: number;
      z: number;
      ox: number; // original relative coords
      oy: number;
      oz: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
    }

    const nodes: Node3D[] = [];
    const nodeCount = 55;
    const radius = Math.min(width, height) * 0.35;

    // Initialize nodes distributed in a sphere
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodes.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2.5 + 1.5,
        color: i % 2 === 0 ? "rgba(6, 182, 212, " : "rgba(139, 92, 246, ",
      });
    }

    // Orbiting particles (satellites representing deadlines revolving around the core)
    interface Satellite {
      angle: number;
      speed: number;
      distance: number;
      heightOffset: number;
      size: number;
      color: string;
    }

    const satellites: Satellite[] = [];
    for (let i = 0; i < 4; i++) {
      satellites.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.01,
        distance: radius * (1.1 + i * 0.15),
        heightOffset: (Math.random() - 0.5) * 80,
        size: Math.random() * 4 + 3,
        color: i === 0 ? "#ef4444" : i === 1 ? "#06b6d4" : "#eab308", // Risk-colored orbiting clocks
      });
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse coordinates relative to center
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left - width / 2;
      const clientY = e.clientY - rect.top - height / 2;
      mouseRef.current.targetX = clientX;
      mouseRef.current.targetY = clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Dynamic rotation variables
    let angleX = 0.001;
    let angleY = 0.0025;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const center = { x: width / 2, y: height / 2 };

      // Interpolate mouse movement (spring animation)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Rotate nodes around X and Y axis based on mouse
      const cosX = Math.cos(angleX + mouse.y * 0.000008);
      const sinX = Math.sin(angleX + mouse.y * 0.000008);
      const cosY = Math.cos(angleY + mouse.x * 0.000008);
      const sinY = Math.sin(angleY + mouse.x * 0.000008);

      nodes.forEach((node) => {
        // Slow float vx/vy/vz
        node.ox += node.vx;
        node.oy += node.vy;
        node.oz += node.vz;

        // Reset if float out of bounds
        const d = Math.sqrt(node.ox*node.ox + node.oy*node.oy + node.oz*node.oz);
        if (d > radius * 1.05) {
          node.vx *= -1;
          node.vy *= -1;
          node.vz *= -1;
        }

        // Apply 3D rotation
        // Y axis
        let x1 = node.ox * cosY - node.oz * sinY;
        let z1 = node.oz * cosY + node.ox * sinY;
        // X axis
        let y2 = node.oy * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.oy * sinX;

        node.x = x1;
        node.y = y2;
        node.z = z2;
      });

      // Draw Connection Synapses
      const maxDistance = radius * 0.55;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(center.x + n1.x, center.y + n1.y);
            ctx.lineTo(center.x + n2.x, center.y + n2.y);
            
            // Core connections draw colors blending
            const gradient = ctx.createLinearGradient(
              center.x + n1.x, center.y + n1.y,
              center.x + n2.x, center.y + n2.y
            );
            gradient.addColorStop(0, n1.color + alpha + ")");
            gradient.addColorStop(1, n2.color + alpha + ")");
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Sort nodes by Z value so back nodes draw behind front nodes
      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z);

      // Draw Nodes
      sortedNodes.forEach((node) => {
        // Perspective factor
        const perspective = (node.z + radius * 1.5) / (radius * 3);
        const drawX = center.x + node.x;
        const drawY = center.y + node.y;
        const drawSize = node.size * perspective;

        ctx.beginPath();
        ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2);
        
        const alpha = (node.z + radius) / (radius * 2);
        ctx.fillStyle = node.color + alpha + ")";
        ctx.fill();

        // Core glowing neuron dots
        if (alpha > 0.75) {
          ctx.shadowColor = node.color === "rgba(6, 182, 212, " ? "#06b6d4" : "#8b5cf6";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(drawX, drawY, drawSize * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Draw Orbiting Satellite Particles (Dynamic Deadlines)
      satellites.forEach((sat, index) => {
        sat.angle += sat.speed;
        
        // Calculate 3D satellite position
        const satX = sat.distance * Math.cos(sat.angle);
        const satZ = sat.distance * Math.sin(sat.angle) * cosY; // project rotation
        const satY = sat.heightOffset + sat.distance * Math.sin(sat.angle) * sinY;

        const drawX = center.x + satX;
        const drawY = center.y + satY;

        // Glowing effect
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, sat.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw orbital trail
        ctx.beginPath();
        ctx.arc(center.x, center.y, sat.distance, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Connect satellite to nearest node in sphere
        let nearestNode: Node3D | null = null;
        let minDist = Infinity;
        nodes.forEach((node) => {
          const dx = node.x - satX;
          const dy = node.y - satY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestNode = node;
          }
        });

        if (nearestNode && minDist < radius * 0.7) {
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(center.x + (nearestNode as Node3D).x, center.y + (nearestNode as Node3D).y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - minDist / (radius * 0.7))})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Draw central clock projection
      ctx.font = "12px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const timeStr = new Date().toLocaleTimeString();
      ctx.fillText(timeStr, center.x, center.y);
      ctx.fillText("GUARDIAN CORE", center.x, center.y + 15);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block absolute top-0 left-0" />
      
      {/* Floating 3D clock HUD rings */}
      <div className="absolute border border-cyan-500/10 rounded-full w-80 h-80 animate-pulse pointer-events-none" />
      <div className="absolute border border-purple-500/5 rounded-full w-96 h-96 animate-spin pointer-events-none" style={{ animationDuration: "120s" }} />
      <div className="absolute border-t border-r border-dashed border-cyan-500/20 rounded-full w-64 h-64 animate-spin pointer-events-none" style={{ animationDuration: "35s" }} />
    </div>
  );
}
