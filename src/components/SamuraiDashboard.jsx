import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SamuraiDashboard.css";

const DEFAULT_BG_IMAGES = ["S_1_.png", "S_2_.png", "S_3_.png", "S_4_.png", "S_5_.png"];
const DEFAULT_DIFFERENT_SCORES = {
  left: [
    { name: "Focus Analysis", icon: "⚔", sub: "Deep work blocks mastered", fill: 0.72 },
    {
      name: "Daily Progress",
      icon: "⛩",
      sub: "Tasks completed this cycle",
      fill: 0.61,
    },
  ],
  right: [
    { name: "Habits", icon: "🌸", sub: "Rituals maintained without fail", fill: 0.55 },
    {
      name: "Consistency",
      icon: "🏯",
      sub: "Streak held across the month",
      fill: 0.83,
    },
  ],
};

function getBgImage(score, bgImages) {
  if (score < 20) return bgImages[0];
  if (score < 40) return bgImages[1];
  if (score < 60) return bgImages[2];
  if (score < 80) return bgImages[3];
  return bgImages[4];
}

function getScoreDescriptor(score) {
  if (score < 20) return "The path has just begun";
  if (score < 40) return "The student walks with intent";
  if (score < 60) return "Discipline takes root";
  if (score < 80) return "Above the average warrior";
  return "Master of the inner battle";
}

function formatTitleToTwoLines(title) {
  const safeTitle = (title ?? "").toString().trim();
  if (!safeTitle.includes(" ")) return safeTitle;
  const words = safeTitle.split(" ").filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  const first = words.slice(0, mid).join(" ");
  const second = words.slice(mid).join(" ");
  return (
    <>
      {first}
      <br />
      {second}
    </>
  );
}

function ensureFontLinks() {
  const FONT_LINKS = [
    {
      id: "samurai-font-preconnect-google",
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      id: "samurai-font-preconnect-gstatic",
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "crossorigin",
    },
    {
      id: "samurai-font-main",
      rel: "stylesheet",
      href:
        "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Noto+Serif+JP:wght@200;300;400&display=swap",
    },
  ];

  for (const link of FONT_LINKS) {
    if (document.getElementById(link.id)) continue;
    const el = document.createElement("link");
    el.id = link.id;
    el.rel = link.rel;
    el.href = link.href;
    if (link.crossorigin) el.crossOrigin = link.crossorigin;
    document.head.appendChild(el);
  }
}

export default function SamuraiDashboard({
  score,
  quotes,
  differentScores,
  // Text (all non-Chinese headings)
  heroEyebrow = "Path of the Warrior",
  heroTitle = "The Way of Discipline",
  scoreLabel = "Discipline Score",
  scorePctText = "/ 100",
  scoreDescriptor, // optional override; if omitted we compute from score
  scrollText = "Scroll",
  analysisHeading = "Analysis",
  metricsHeading = "Metrics",
  philosophyLabel = "Wisdom",
  tenetsTitle = "The Eight Virtues",
  philosophyAttr = "— Bushidō · The Way of the Warrior",
  footerBrand = "Third Eye · Dashboard",
  // Data
  quotesForHero, // optional alias
  quotesForPhilosophy, // optional alias
  tenets, // optional override for the tenets list items
  backgroundImages = DEFAULT_BG_IMAGES,
}) {
  const wrapperRef = useRef(null);
  const blurVeilRef = useRef(null);
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroQuoteRef = useRef(null);
  const canvasRef = useRef(null);
  const ringFillRef = useRef(null);

  const [bgLoaded, setBgLoaded] = useState(false);

  const normalizedScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const safeScore = Math.max(0, Math.min(100, normalizedScore));

  const resolvedQuotes = useMemo(() => {
    if (typeof quotes === "string") {
      return {
        hero: quotes,
        philosophy: quotes,
      };
    }
    const q = quotes ?? {};
    const hero = quotesForHero ?? q.hero ?? q.heroQuote ?? q.quotesForHero;
    const philosophy =
      quotesForPhilosophy ?? q.philosophy ?? q.philosophyQuote ?? q.quotesForPhilosophy;
    return {
      hero: hero ?? "",
      philosophy: philosophy ?? "",
    };
  }, [quotes, quotesForHero, quotesForPhilosophy]);

  const resolvedDescriptor = scoreDescriptor ?? getScoreDescriptor(safeScore);
  const bgSrc = useMemo(() => getBgImage(safeScore, backgroundImages), [safeScore, backgroundImages]);

  // Reset loading state when the background image source changes
  useEffect(() => {
    setBgLoaded(false);
  }, [bgSrc]);

  const leftCards = differentScores?.left ?? DEFAULT_DIFFERENT_SCORES.left;
  const rightCards = differentScores?.right ?? DEFAULT_DIFFERENT_SCORES.right;

  const resolvedTenets = useMemo(() => {
    const defaults = [
      { label: "Rectitude", kanji: "義" },
      { label: "Courage", kanji: "勇" },
      { label: "Benevolence", kanji: "仁" },
      { label: "Respect", kanji: "礼" },
      { label: "Honesty", kanji: "誠" },
      { label: "Honor", kanji: "名誉" },
      { label: "Loyalty", kanji: "忠義" },
      { label: "Self-Control", kanji: "克己" },
    ];
    if (!tenets) return defaults;
    return defaults.map((d, i) => {
      const override = tenets[i];
      if (!override) return d;
      return {
        label: override.label ?? d.label,
        kanji: override.kanji ?? d.kanji,
      };
    });
  }, [tenets]);

  useEffect(() => {
    ensureFontLinks();
  }, []);

  // Ring animation
  useEffect(() => {
    const ring = ringFillRef.current;
    if (!ring) return;

    const circumference = 2 * Math.PI * 68; // r=68 => ~427.26
    const offset = circumference - (safeScore / 100) * circumference;

    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference); // start empty

    // Delay so the CSS transition fires (matches original behavior)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.style.strokeDashoffset = String(offset);
      });
    });
  }, [safeScore]);

  // Scroll-driven blur + hero fade
  useEffect(() => {
    const blurVeil = blurVeilRef.current;
    const heroTitleEl = heroTitleRef.current;
    const heroQuoteEl = heroQuoteRef.current;
    const heroEl = heroRef.current;
    if (!blurVeil || !heroTitleEl || !heroQuoteEl || !heroEl) return;

    let ticking = false;

    function applyScrollEffects() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

      // Progressive blur: 0px at top -> 7px at bottom
      const blurPx = (ratio * 7).toFixed(2);
      // Subtle darkening to keep text readable
      const brightLevel = (1 - ratio * 0.28).toFixed(3);

      blurVeil.style.backdropFilter = `blur(${blurPx}px) brightness(${brightLevel})`;
      blurVeil.style.webkitBackdropFilter = `blur(${blurPx}px) brightness(${brightLevel})`;

      // Hero title + quote fade as you leave hero
      const heroH = heroEl.offsetHeight || 1;
      const fadeRatio = Math.min(scrollY / (heroH * 0.55), 1);
      heroTitleEl.style.opacity = (1 - fadeRatio * 0.65).toFixed(3);
      heroQuoteEl.style.opacity = (1 - fadeRatio * 0.55).toFixed(3);

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(applyScrollEffects);
        ticking = true;
      }
    }

    applyScrollEffects();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal elements + stat bar scaling (IntersectionObserver)
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");

          const bar = entry.target.querySelector(".stat-bar-fill");
          if (bar) {
            const fill = Math.max(0, Math.min(1, parseFloat(entry.target.dataset.fill || "0")));
            requestAnimationFrame(() => {
              bar.style.transform = `scaleX(${fill})`;
            });
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    const revealEls = root.querySelectorAll(".reveal");
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Ember / ash particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let alive = true;
    let rafId = 0;

    const PARTICLE_COUNT = 55;
    const particles = [];

    const PALETTE = [
      "rgba(180, 30,  10,  ",
      "rgba(210, 80,  20,  ",
      "rgba(240, 140, 40,  ",
      "rgba(200, 200, 180, ",
      "rgba(140, 10,  10,  ",
    ];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function spawnParticle(preAge) {
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return {
        x: Math.random() * W,
        y: H + 10 + (preAge ? Math.random() * H : 0), // start below screen
        r: 0.5 + Math.random() * 2.2,
        vy: -(0.25 + Math.random() * 0.7), // drift upward
        vx: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife: 180 + Math.floor(Math.random() * 220),
        col,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.015,
      };
    }

    function initParticles() {
      particles.length = 0;
      // Pre-populate so they don't all appear at once
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = spawnParticle(true);
        p.y = Math.random() * H;
        p.life = Math.floor(Math.random() * p.maxLife);
        particles.push(p);
      }
    }

    function tick() {
      if (!alive) return;

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) {
          particles[i] = spawnParticle(false);
          continue;
        }

        // Opacity bell-curve: fade in -> sustain -> fade out
        const t = p.life / p.maxLife;
        const opc = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.3;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + (opc * 0.85).toFixed(3) + ")";
        ctx.fill();

        // Tiny glow halo on larger embers
        if (p.r > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.col + (opc * 0.12).toFixed(3) + ")";
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    resize();
    initParticles();
    tick();

    function handleResize() {
      resize();
      initParticles();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const heroQuote = resolvedQuotes.hero;
  const philosophyQuote = resolvedQuotes.philosophy;

  return (
    <div ref={wrapperRef} className="samurai-dashboard-root">
      {/* Fixed background + atmosphere */}
      <img 
        id="samurai-bg" 
        src={bgSrc} 
        alt="Samurai background" 
        aria-hidden="true" 
        onLoad={() => setBgLoaded(true)}
        className={bgLoaded ? "bg-loaded" : "bg-loading"}
      />
      <div id="blur-veil" ref={blurVeilRef} aria-hidden="true" />
      <div id="bg-overlay" aria-hidden="true" />
      <div id="crimson-fog" aria-hidden="true" />
      <canvas id="ember-canvas" ref={canvasRef} aria-hidden="true" />

      <div className="ink-line ink-line-1" aria-hidden="true" />
      <div className="ink-line ink-line-2" aria-hidden="true" />

      <div id="page-wrapper">
        {/* HERO */}
        <section id="hero" aria-label="Hero" ref={heroRef}>
          <div className="section-grid">
            <div className="col-left">
              <p className="hero-eyebrow">{heroEyebrow}</p>
              <h1 ref={heroTitleRef} className="hero-title">
                {formatTitleToTwoLines(heroTitle)}
              </h1>
              <div className="hero-title-rule" />
              <p ref={heroQuoteRef} className="hero-quote">
                {heroQuote}
              </p>
            </div>

            <div className="col-center" aria-hidden="true" />

            <div className="col-right">
              <div className="score-container">
                <span className="score-label">{scoreLabel}</span>

                <div className="score-ring-wrap" role="img" aria-label="Score ring">
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <defs>
                      <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b0000" />
                        <stop offset="100%" stopColor="#c0392b" />
                      </linearGradient>
                    </defs>

                    <circle className="score-ring-track" cx="80" cy="80" r="68" />
                    <circle
                      ref={ringFillRef}
                      className="score-ring-fill"
                      cx="80"
                      cy="80"
                      r="68"
                      strokeDasharray="427.26"
                      strokeDashoffset="427.26"
                    />
                  </svg>

                  <div className="score-value">
                    <span className="score-number">{safeScore}</span>
                    <span className="score-pct">{scorePctText}</span>
                  </div>
                </div>

                <p className="score-descriptor">{resolvedDescriptor}</p>
              </div>
            </div>
          </div>

          <div className="scroll-indicator" aria-label="Scroll down">
            <span>{scrollText}</span>
            <div className="scroll-chevron" />
          </div>
        </section>

        {/* STATS */}
        <section id="stats" aria-label="Stats">
          <div className="section-grid">
            <div className="col-left">
              <p className="stats-heading reveal">{analysisHeading}</p>
              <div className="stats-grid">
                {leftCards.map((c, idx) => (
                  <div
                    key={idx}
                    className="stat-card reveal"
                    data-fill={Number.isFinite(Number(c.fill)) ? Number(c.fill) : 0}
                    style={idx === 1 ? { transitionDelay: "0.1s" } : undefined}
                  >
                    <div className="stat-card-header">
                      <span className="stat-card-name">{c.name}</span>
                      <span className="stat-card-icon">{c.icon}</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" />
                    </div>
                    <p className="stat-card-sub">{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-center" aria-hidden="true" />

            <div className="col-right">
              <p className="stats-right-label reveal">{metricsHeading}</p>
              <div className="stats-right-grid">
                {rightCards.map((c, idx) => (
                  <div
                    key={idx}
                    className="stat-card-right reveal"
                    data-fill={Number.isFinite(Number(c.fill)) ? Number(c.fill) : 0}
                    style={idx === 1 ? { transitionDelay: "0.1s" } : undefined}
                  >
                    <div className="stat-card-header">
                      <span className="stat-card-name">{c.name}</span>
                      <span className="stat-card-icon">{c.icon}</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" />
                    </div>
                    <p className="stat-card-sub">{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section id="philosophy" aria-label="Philosophy">
          <div className="philosophy-center">
            {/* Chinese heading kept hardcoded (as requested) */}
            <span className="philosophy-kanji reveal" aria-hidden="true">
              武士道
            </span>
            <span className="philosophy-label reveal">{philosophyLabel}</span>
            <p className="philosophy-quote-main reveal">{philosophyQuote}</p>
            <div className="philosophy-rule reveal" />
            <span className="philosophy-attr reveal">{philosophyAttr}</span>
          </div>

          <div className="philosophy-tenets-bottom">
            <p className="tenets-title reveal">{tenetsTitle}</p>
            <ul className="tenets-list" role="list">
              {resolvedTenets.map((t, idx) => (
                <li
                  key={idx}
                  className="reveal"
                  style={idx === 0 ? undefined : { transitionDelay: `${idx * 0.05}s` }}
                >
                  {t.label} · {t.kanji}
                </li>
              ))}
            </ul>
          </div>
        </section>

       
      </div>
    </div>
  );
}

