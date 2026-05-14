import { useEffect, useRef } from "react";

const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDuration = Math.random() * 10 + 8 + "s";
      particle.style.animationDelay = Math.random() * 5 + "s";
      particle.style.width = Math.random() * 3 + 1 + "px";
      particle.style.height = particle.style.width;
      container.appendChild(particle);

      setTimeout(() => particle.remove(), 18000);
    };

    const interval = setInterval(createParticle, 800);
    for (let i = 0; i < 15; i++) setTimeout(createParticle, i * 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="bg-glow" />
      <div className="bg-grid" />
      <div className="bg-spotlight bg-spotlight-left" />
      <div className="bg-spotlight bg-spotlight-right" />
      <div className="bg-vignette" />
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />
    </>
  );
};

export default ParticleBackground;
