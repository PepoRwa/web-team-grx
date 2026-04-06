import React, { useState, useEffect } from 'react';

export default function ScrollProgress() {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;
      const percentage = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      setScrollPercentage(percentage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] bg-dark-bg z-[9999] pointer-events-none">
      <div 
        className="h-full bg-gowrax-purple glow-line"
        style={{ 
          width: `${scrollPercentage}%`,
          boxShadow: '0 0 10px #b14eff, 0 0 20px #b14eff',
          transition: 'width 0.1s ease-out'
        }}
      />
    </div>
  );
}