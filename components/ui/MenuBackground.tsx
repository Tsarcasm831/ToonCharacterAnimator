
import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'star' | 'energy' | 'cosmic';
}

interface StarField {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  constellationId?: number;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  drift: { x: number; y: number };
  rotation: number;
  rotationSpeed: number;
}

interface OrbitalRing {
  centerX: number;
  centerY: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  segments: number;
  color: string;
  opacity: number;
}

interface Constellation {
  stars: { x: number; y: number }[];
  connections: [number, number][];
  opacity: number;
  pulseSpeed: number;
}

export const MenuBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<StarField[]>([]);
  const nebulaeRef = useRef<NebulaCloud[]>([]);
  const ringsRef = useRef<OrbitalRing[]>([]);
  const constellationsRef = useRef<Constellation[]>([]);
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Initialize star field
    const initStars = () => {
      const stars: StarField[] = [];
      for (let i = 0; i < 300; i++) {
        stars.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          size: Math.random() * 2.5 + 0.3,
          brightness: Math.random(),
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          constellationId: Math.random() < 0.15 ? Math.floor(Math.random() * 3) : undefined
        });
      }
      starsRef.current = stars;
    };

    // Initialize nebulae
    const initNebulae = () => {
      const nebulae: NebulaCloud[] = [];
      const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];
      for (let i = 0; i < 4; i++) {
        nebulae.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          radius: Math.random() * 150 + 100,
          color: colors[i % colors.length],
          opacity: Math.random() * 0.15 + 0.05,
          drift: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2 },
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.001
        });
      }
      nebulaeRef.current = nebulae;
    };

    // Initialize orbital rings
    const initRings = () => {
      const rings: OrbitalRing[] = [];
      for (let i = 0; i < 2; i++) {
        rings.push({
          centerX: dimensions.width * (0.2 + i * 0.6),
          centerY: dimensions.height * (0.3 + i * 0.4),
          radius: 80 + i * 40,
          rotation: 0,
          rotationSpeed: (i % 2 === 0 ? 0.001 : -0.001) * (i + 1),
          segments: 12 + i * 6,
          color: i % 2 === 0 ? '#3b82f6' : '#8b5cf6',
          opacity: 0.1 + i * 0.05
        });
      }
      ringsRef.current = rings;
    };

    // Initialize constellations
    const initConstellations = () => {
      const constellations: Constellation[] = [];
      const constellationPatterns = [
        {
          stars: [
            { x: 0.1, y: 0.2 }, { x: 0.15, y: 0.25 }, { x: 0.2, y: 0.22 },
            { x: 0.25, y: 0.3 }, { x: 0.18, y: 0.35 }, { x: 0.12, y: 0.32 }
          ],
          connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 4]]
        },
        {
          stars: [
            { x: 0.7, y: 0.1 }, { x: 0.75, y: 0.15 }, { x: 0.8, y: 0.12 },
            { x: 0.78, y: 0.2 }, { x: 0.72, y: 0.18 }
          ],
          connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3]]
        },
        {
          stars: [
            { x: 0.5, y: 0.6 }, { x: 0.55, y: 0.65 }, { x: 0.6, y: 0.62 },
            { x: 0.58, y: 0.7 }, { x: 0.52, y: 0.68 }, { x: 0.48, y: 0.64 }, { x: 0.46, y: 0.58 }
          ],
          connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 3]]
        }
      ];

      constellationPatterns.forEach((pattern) => {
        const scaledStars = pattern.stars.map(star => ({
          x: star.x * dimensions.width,
          y: star.y * dimensions.height
        }));
        
        constellations.push({
          stars: scaledStars,
          connections: pattern.connections as [number, number][],
          opacity: 0.2 + Math.random() * 0.1,
          pulseSpeed: Math.random() * 0.002 + 0.001
        });
      });

      constellationsRef.current = constellations;
    };

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push(createParticle(dimensions.width, dimensions.height));
      }
      particlesRef.current = particles;
    };

    const createParticle = (width: number, height: number): Particle => {
      const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
      const types: ('star' | 'energy' | 'cosmic')[] = ['star', 'energy', 'cosmic'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (type === 'energy' ? 1.5 : 0.5),
        vy: (Math.random() - 0.5) * (type === 'energy' ? 1.5 : 0.5),
        size: type === 'cosmic' ? Math.random() * 4 + 2 : Math.random() * 2 + 0.5,
        opacity: type === 'energy' ? Math.random() * 0.7 + 0.3 : Math.random() * 0.4 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: type === 'energy' ? Math.random() * 100 + 50 : Math.random() * 200 + 100,
        type
      };
    };

    initStars();
    initParticles();
    initNebulae();
    initRings();
    initConstellations();

    const drawGradientBackground = (ctx: CanvasRenderingContext2D, time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
      const hue1 = (time * 0.01) % 360;
      const hue2 = (hue1 + 60) % 360;
      const hue3 = (hue1 + 120) % 360;
      gradient.addColorStop(0, `hsla(${hue1}, 70%, 10%, 1)`);
      gradient.addColorStop(0.5, `hsla(${hue2}, 60%, 8%, 1)`);
      gradient.addColorStop(1, `hsla(${hue3}, 70%, 12%, 1)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    };

    const drawStars = (ctx: CanvasRenderingContext2D, time: number) => {
      starsRef.current.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawNebulae = (ctx: CanvasRenderingContext2D, time: number) => {
      nebulaeRef.current.forEach(nebula => {
        nebula.x += nebula.drift.x;
        nebula.y += nebula.drift.y;
        nebula.rotation += nebula.rotationSpeed;
        if (nebula.x < -nebula.radius) nebula.x = dimensions.width + nebula.radius;
        if (nebula.x > dimensions.width + nebula.radius) nebula.x = -nebula.radius;
        if (nebula.y < -nebula.radius) nebula.y = dimensions.height + nebula.radius;
        if (nebula.y > dimensions.height + nebula.radius) nebula.y = -nebula.radius;
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.radius);
        gradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, nebula.color + Math.floor(nebula.opacity * 0.5 * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, nebula.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-nebula.radius, -nebula.radius, nebula.radius * 2, nebula.radius * 2);
        ctx.restore();
      });
    };

    const drawOrbitalRings = (ctx: CanvasRenderingContext2D) => {
      ringsRef.current.forEach(ring => {
        ring.rotation += ring.rotationSpeed;
        ctx.save();
        ctx.translate(ring.centerX, ring.centerY);
        ctx.rotate(ring.rotation);
        ctx.strokeStyle = ring.color + Math.floor(ring.opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        for (let i = 0; i < ring.segments; i++) {
          const angle1 = (Math.PI * 2 * i) / ring.segments;
          const angle2 = (Math.PI * 2 * (i + 0.8)) / ring.segments;
          ctx.beginPath();
          ctx.arc(0, 0, ring.radius, angle1, angle2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
      });
    };

    const drawConstellations = (ctx: CanvasRenderingContext2D, time: number) => {
      constellationsRef.current.forEach(constellation => {
        const pulse = Math.sin(time * constellation.pulseSpeed) * 0.3 + 0.7;
        const opacity = constellation.opacity * pulse;
        ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
        ctx.lineWidth = 1;
        constellation.connections.forEach(([startIdx, endIdx]) => {
          const start = constellation.stars[startIdx];
          const end = constellation.stars[endIdx];
          if (start && end) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        });
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        constellation.stars.forEach(star => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    };

    const drawEnhancedParticles = (ctx: CanvasRenderingContext2D, time: number) => {
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;
        if (particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle(dimensions.width, dimensions.height);
          return;
        }
        const lifeRatio = particle.life / particle.maxLife;
        const opacity = particle.opacity * (1 - lifeRatio * 0.5);
        if (particle.type === 'energy') {
          ctx.shadowBlur = 20;
          ctx.shadowColor = particle.color;
        } else if (particle.type === 'cosmic') {
          const hue = (time * 0.1 + particle.life * 2) % 360;
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = particle.color;
        }
        ctx.fillStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        if (particle.type === 'cosmic') {
          ctx.fillStyle = particle.color + Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });
    };

    const drawEnhancedConnections = (ctx: CanvasRenderingContext2D, time: number) => {
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (distance < 120 && p1.type === p2.type) {
            const opacity = (1 - distance / 120) * 0.4;
            const pulse = Math.sin(time * 0.002 + i) * 0.2 + 0.8;
            ctx.strokeStyle = p1.color + Math.floor(opacity * pulse * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = p1.type === 'energy' ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    };

    const drawGeometricShapes = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      const centerX = dimensions.width * 0.8;
      const centerY = dimensions.height * 0.2;
      const radius = 80;
      const rotation = time * 0.0005;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const x = (dimensions.width * 0.2) + Math.sin(time * 0.001 + i * 2) * 100;
        const y = (dimensions.height * 0.7) + Math.cos(time * 0.001 + i * 2) * 50;
        const size = 30 + Math.sin(time * 0.002 + i) * 10;
        const rotation = time * 0.001 + i * Math.PI / 3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    };

    const animate = () => {
      timeRef.current += 16;
      drawGradientBackground(ctx, timeRef.current);
      drawNebulae(ctx, timeRef.current);
      drawStars(ctx, timeRef.current);
      drawConstellations(ctx, timeRef.current);
      drawOrbitalRings(ctx);
      drawEnhancedConnections(ctx, timeRef.current);
      drawGeometricShapes(ctx, timeRef.current);
      drawEnhancedParticles(ctx, timeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
    </div>
  );
};
