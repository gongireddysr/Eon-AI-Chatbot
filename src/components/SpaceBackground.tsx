"use client";

import { useEffect, useRef } from "react";

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Neural network nodes
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const nodeCount = 60;
    const connectionDistance = 180;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 210, 255, 0.5)";
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 210, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark navy background */}
      <div className="absolute inset-0 bg-[#020617]" />
      
      {/* Animated mesh gradient orbs */}
      <div className="absolute inset-0">
        {/* Teal orb - top left */}
        <div 
          className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full opacity-20 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
            animationDuration: '8s',
          }}
        />
        
        {/* Purple orb - right side */}
        <div 
          className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full opacity-15 blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
            top: '30%',
            right: '-5%',
            animationDuration: '10s',
            animationDelay: '2s',
          }}
        />
        
        {/* Electric blue orb - bottom */}
        <div 
          className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-10 blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)',
            bottom: '-15%',
            left: '30%',
            animationDuration: '12s',
            animationDelay: '4s',
          }}
        />
      </div>
      
      {/* Neural network canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
