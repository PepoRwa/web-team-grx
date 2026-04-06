import React, { useEffect, useRef } from 'react';

export default function ShootingStars() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Configuration très haute résolution (Qualité "4K")
    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 2; // Qualité retina
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // --- FOND ÉTOILÉ (Parallax / Clignotement) ---
    const stars = [];
    const numStars = 250; // Plus dense
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: (Math.random() * 1.5) + 0.1,
        opacity: Math.random(),
        speedY: (Math.random() * 0.05) + 0.02,
        twinkleSpeed: (Math.random() * 0.01) + 0.002,
        twinkleDir: Math.random() > 0.5 ? 1 : -1
      });
    }

    // --- ÉTOILES FILANTES ---
    const shootingStars = [];
    const colors = [
      '#D62F7F', // gowrax-neon (Rose/Magenta)
      '#6F2DBD', // gowrax-purple
      '#00F0FF', // Cyan sci-fi
      '#FFFFFF'  // Pure white
    ];

    const createShootingStar = () => {
      // Pour une diagonale allant du coin haut-droit vers bas-gauche
      const x = (Math.random() * width * 1.5); 
      const y = -Math.random() * height * 0.5;
      const length = (Math.random() * 150) + 150; // Traînée très longue
      const speed = (Math.random() * 12) + 18; // Très rapide
      
      // Vecteur de direction (vers le bas à gauche)
      const angle = Math.PI / 4; // 45 degrés
      const vx = -Math.cos(angle);
      const vy = Math.sin(angle);

      shootingStars.push({
        x,
        y,
        length,
        vx,
        vy,
        speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0,
        life: 1,
        decay: (Math.random() * 0.015) + 0.01 // Vitesse de disparition
      });
    };

    // BOUCLE DE RENDU 60/120 FPS
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Dessiner le fond étoilé statique/lent
      stars.forEach(star => {
        // Scintillement
        star.opacity += star.twinkleSpeed * star.twinkleDir;
        if (star.opacity >= 1) {
          star.opacity = 1;
          star.twinkleDir = -1;
        } else if (star.opacity <= 0.1) {
          star.opacity = 0.1;
          star.twinkleDir = 1;
        }

        // Dérive vers le haut (très lente)
        star.y -= star.speedY;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      // 2. Apparition des étoiles filantes (Fréquence contrôlée)
      if (Math.random() < 0.02) { // 2% de chance par frame (assez fréquent mais pas trop)
        createShootingStar();
      }

      // 3. Dessiner et mettre à jour les étoiles filantes
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];

        // Mise à jour de la position
        ss.x += ss.vx * ss.speed;
        ss.y += ss.vy * ss.speed;
        
        // Cycle de vie (Fade In -> Fade Out)
        ss.life -= ss.decay;
        // On fait augmenter l'opacité au début puis descendre avec "life"
        ss.opacity = Math.min(1, ss.life * 2);

        if (ss.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Calcul de la pointe de la traînée
        const tailX = ss.x - (ss.vx * ss.length);
        const tailY = ss.y - (ss.vy * ss.length);

        // Gradient hyper futuriste
        const gradient = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        
        // Extraction RGB de la couleur pour faire un gradient d'opacité
        let rgb = '255,255,255';
        if (ss.color === '#D62F7F') rgb = '214,47,127';
        else if (ss.color === '#6F2DBD') rgb = '111,45,189';
        else if (ss.color === '#00F0FF') rgb = '0,240,255';

        gradient.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`); // Tête blanche brûlante
        gradient.addColorStop(0.1, `rgba(${rgb}, ${ss.opacity * 0.9})`); // Coeur coloré néon
        gradient.addColorStop(1, `rgba(${rgb}, 0)`); // Traînée transparente

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2; // Ligne fine mais précise
        ctx.lineCap = 'round';
        
        // Effet de lueur (Drop shadow pour le néon)
        ctx.shadowBlur = 15;
        ctx.shadowColor = ss.color;
        
        ctx.stroke();

        // Réinitialiser le shadow pour ne pas faire lagger les petites étoiles statiques
        ctx.shadowBlur = 0;
      }

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
      className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen z-0 opacity-80"
    />
  );
}
