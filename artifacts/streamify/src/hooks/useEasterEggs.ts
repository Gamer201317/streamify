import { useEffect, useRef, useState } from "react";

export const useEasterEggs = () => {
  const [rainbowMode, setRainbowMode] = useState(false);
  const konamiBuffer = useRef<string[]>([]);
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

    const handleKey = (e: KeyboardEvent) => {
      konamiBuffer.current.push(e.key);
      if (konamiBuffer.current.length > 20) konamiBuffer.current.shift();

      if (konamiBuffer.current.slice(-KONAMI.length).join(",") === KONAMI.join(",")) {
        triggerRainbow(setRainbowMode);
        konamiBuffer.current = [];
        return;
      }

      const tail = konamiBuffer.current.join("");
      if (tail.endsWith("matrix")) { spawnMatrix(); konamiBuffer.current = []; }
      else if (tail.endsWith("popcorn")) { spawnEmojiRain("🍿"); konamiBuffer.current = []; }
      else if (tail.endsWith("snow")) { spawnEmojiRain("❄️"); konamiBuffer.current = []; }
      else if (tail.endsWith("party")) { spawnEmojiRain("🎉"); triggerRainbow(setRainbowMode); konamiBuffer.current = []; }
      else if (tail.endsWith("love")) { spawnEmojiRain("❤️"); konamiBuffer.current = []; }
      else if (tail.endsWith("ufo")) { flyUfo(); konamiBuffer.current = []; }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleLogoClick = () => {
    clickCount.current++;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 500);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      const root = document.getElementById("root");
      if (root) {
        let i = 0;
        const colors = ["#ff0040", "#ff8c00", "#ffd700", "#00ff88", "#00bfff", "#8a2be2"];
        const iv = setInterval(() => {
          root.style.boxShadow = `inset 0 0 100px ${colors[i % colors.length]}40`;
          i++;
          if (i > 18) { clearInterval(iv); root.style.boxShadow = ""; }
        }, 150);
      }
    }
  };

  return { rainbowMode, handleLogoClick };
};

function triggerRainbow(setRainbowMode: (v: boolean) => void) {
  setRainbowMode(true);
  for (let i = 0; i < 50; i++) {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;top:-10px;left:${Math.random()*100}%;width:8px;height:8px;background:hsl(${Math.random()*360},80%,60%);border-radius:${Math.random()>0.5?'50%':'0'};pointer-events:none;z-index:200;transition:all ${2+Math.random()*2}s ease-out;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = `${100 + Math.random()*20}vh`;
      el.style.left = `${parseFloat(el.style.left) + (Math.random()-0.5)*30}%`;
      el.style.opacity = "0";
      el.style.transform = `rotate(${Math.random()*720}deg)`;
    });
    setTimeout(() => el.remove(), 4000);
  }
  setTimeout(() => setRainbowMode(false), 5000);
}

function spawnEmojiRain(emoji: string) {
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    const dur = 3 + Math.random() * 3;
    el.textContent = emoji;
    el.style.cssText = `position:fixed;top:-30px;left:${Math.random()*100}%;font-size:${18+Math.random()*22}px;pointer-events:none;z-index:200;transition:all ${dur}s linear;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = `${110}vh`;
      el.style.transform = `rotate(${(Math.random()-0.5)*360}deg)`;
    });
    setTimeout(() => el.remove(), dur * 1000 + 200);
  }
}

function flyUfo() {
  const el = document.createElement("div");
  el.textContent = "🛸";
  el.style.cssText = `position:fixed;top:${20+Math.random()*40}%;left:-80px;font-size:48px;pointer-events:none;z-index:200;transition:all 4s cubic-bezier(.4,.1,.6,.9);filter:drop-shadow(0 0 12px #00ff88);`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.left = "110vw";
    el.style.transform = "translateY(-40px)";
  });
  setTimeout(() => el.remove(), 4500);
}

function spawnMatrix() {
  const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789";
  for (let col = 0; col < 20; col++) {
    const x = Math.random() * 100;
    let delay = 0;
    for (let row = 0; row < 15; row++) {
      delay += 60 + Math.random() * 40;
      setTimeout(() => {
        const el = document.createElement("div");
        el.className = "matrix-char";
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        el.style.left = x + "%";
        el.style.top = (row / 15) * 100 + "%";
        el.style.opacity = String(1 - row * 0.06);
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
      }, delay);
    }
  }
}
