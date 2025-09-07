// ============================================================================
// AURA BACKGROUND - Lava Lamp Style Animated Background
// ============================================================================

import React, { useEffect, useRef } from 'react';

interface AuraBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
  speed?: number;
}

export default function AuraBackground({ 
  intensity = 'medium',
  colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ],
  speed = 1
}: AuraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
      life: number;
      maxLife: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5 * speed;
        this.vy = (Math.random() - 0.5) * 0.5 * speed;
        this.size = Math.random() * 100 + 50;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.3 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 1000 + 500;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        // Wrap around edges
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;

        // Fade in and out
        const lifeRatio = this.life / this.maxLife;
        if (lifeRatio < 0.1) {
          this.opacity = lifeRatio * 3;
        } else if (lifeRatio > 0.9) {
          this.opacity = (1 - lifeRatio) * 3;
        }

        // Reset if dead
        if (this.life >= this.maxLife) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.life = 0;
          this.color = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Create gradient
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color + '80');
        gradient.addColorStop(1, this.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles based on intensity
    const particleCount = intensity === 'low' ? 8 : intensity === 'medium' ? 12 : 16;
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle());

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Add some connecting lines for extra effect
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
          );

          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}

// ============================================================================
// AURA OVERLAY - Subtle overlay for better text readability
// ============================================================================

export function AuraOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
