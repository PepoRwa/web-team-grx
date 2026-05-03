import React, { useEffect, useRef } from 'react';

export default function ShootingStars() { // Gardé sous ce nom pour tes imports
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 2; 
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // --- COULEURS SLOW BLOOM ---
    const colors = [
      '#B185DB', // Lavande
      '#F7CAD0', // Rose Quartz
      '#A2D2FF', // Bleu Éther
      '#FFFFFF'  // Blanc pur
    ];

    // --- PARTICULES ORGANIQUES ---
    const particles = [];
    const numParticles = 100; // Moins dense pour garder le côté épuré

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.1,
        // Vitesse très lente vers le haut
        speedY: Math.random() * 0.3 + 0.1, 
        // Mouvement oscillatoire de gauche à droite
        angle: Math.random() * Math.PI * 2,
        angleSpeed: Math.random() * 0.02 + 0.01,
        wobble: Math.random() * 0.5 + 0.1
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Oscillation horizontale douce (effet feuille morte inversée)
        p.angle += p.angleSpeed;
        p.x += Math.sin(p.angle) * p.wobble;
        
        // Flottaison vers le haut
        p.y -= p.speedY;

        // Reset quand la particule sort par le haut
        if (p.y + p.radius < 0) {
          p.y = height + p.radius;
          p.x = Math.random() * width;
        }

        // Dessin de la particule (Lueur douce)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Effet de halo (bloom)
        ctx.shadowBlur = p.radius * 4;
        ctx.shadowColor = p.color;
        
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0; // Reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen z-0 opacity-60"
    />
  );
}