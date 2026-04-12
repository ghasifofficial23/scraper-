"use client";

import React, { useEffect, useRef } from 'react';

/**
 * EffectsLayer handles creating a procedural "lightning" or "neural link"
 * visual effect on click, rendered seamlessly via an overlay canvas.
 */
export default function EffectsLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    let animationFrameId: number;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
      history: { x: number, y: number }[];

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.maxLife = Math.random() * 30 + 20;
        this.life = this.maxLife;
        this.color = Math.random() > 0.5 ? '#BFF549' : '#0EA5E9'; // Acid lime or deep blue
        this.size = Math.random() * 2 + 1;
        this.history = [{ x: this.x, y: this.y }];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Add erratic neural/lightning movement
        this.vx += (Math.random() - 0.5) * 2;
        this.vy += (Math.random() - 0.5) * 2;

        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 5) {
          this.history.shift();
        }

        this.life--;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        if (this.history.length > 0) {
          ctx.moveTo(this.history[0].x, this.history[0].y);
          for (let i = 1; i < this.history.length; i++) {
            ctx.lineTo(this.history[i].x, this.history[i].y);
          }
        }
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.lineWidth = this.size;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Spawn burst
      for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y));
      }
    };

    window.addEventListener('click', handleClick);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed top-0 left-0 z-50 h-screen w-screen"
    />
  );
}
