import React, { useEffect, useRef } from 'react';

export default function SmartParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const connectionDistance = 180; // Légèrement augmenté pour des connexions plus vastes
    let animationFrameId;

    // Palette Slow Bloom
    const colors = ['#A2D2FF', '#B185DB', '#F7CAD0'];

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 2;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Moins de particules pour garder un côté épuré et premium
      const maxParticles = window.innerWidth < 768 ? 25 : 60;
      const particleCount = Math.min(Math.floor((width * height) / 20000), maxParticles);
      
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          // Vitesse grandement ralentie
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    init();
    window.addEventListener('resize', init);

    const drawLine = (p1, p2, distance) => {
      // Opacité très douce pour les lignes
      const opacity = (1 - distance / connectionDistance) * 0.15;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(177, 133, 219, ${opacity})`; // Lavande très transparent
      ctx.lineWidth = 0.8;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        // Effet de halo doux au lieu d'un drop shadow lourd
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = 0.6; // Particules légèrement transparentes
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            drawLine(p, p2, dist);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen z-[1] opacity-50"
    />
  );
}