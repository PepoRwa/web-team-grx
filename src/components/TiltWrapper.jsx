import React, { useRef, useState } from 'react';

export default function TiltWrapper({ children, className = "", tiltMaxAngleX = 15, tiltMaxAngleY = 15 }) {
  const customRef = useRef(null);
  const [style, setStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e) => {
    if (!customRef.current) return;
    
    const rect = customRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -tiltMaxAngleX;
    const rotateY = ((x - centerX) / centerX) * tiltMaxAngleY;
    
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.5s ease-out'
    });
  };

  return (
    <div 
      className={`will-change-transform ${className}`}
      ref={customRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{...style, transformStyle: 'preserve-3d'}}
    >
      <div style={{ transform: 'translateZ(30px)' }} className="h-full">
        {children}
      </div>
    </div>
  );
}