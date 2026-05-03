import React, { useState, useEffect } from 'react';

export default function ScrollProgress() {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;
      // Empêche la barre de dépasser 100% ou de planter si la page ne scrolle pas
      const percentage = maxScroll > 0 ? Math.min((scrollY / maxScroll) * 100, 100) : 0;
      setScrollPercentage(percentage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Appel initial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[2px] bg-white/5 z-[9999] pointer-events-none backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-to-r from-[#B185DB] via-[#A2D2FF] to-[#F7CAD0] relative shadow-[0_0_10px_rgba(247,202,208,0.5)]"
        style={{ 
          width: `${scrollPercentage}%`,
          transition: 'width 0.15s ease-out' // Légèrement plus doux
        }}
      >
        {/* Petite pointe brillante (flare) à l'extrémité de la barre */}
        {scrollPercentage > 0 && (
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#F7CAD0] rounded-full blur-[4px] opacity-80"></div>
        )}
      </div>
    </div>
  );
}