import React, { useEffect, useMemo, useState } from "react";

/**
 * DiaJewSoft — Welcome
 * ---------------------------------------------------------------
 * Preview note: in your real project, swap the two lines below
 * back to your originals — they're stubbed here only so this file
 * can render standalone in the preview sandbox (no reactstrap /
 * react-i18next available here).
 *
 *   import { Container } from "reactstrap";
 *   import { useTranslation } from "react-i18next";
 *
 * Dark mode: this follows your app's real theme switcher via
 * html[data-bs-theme="dark"] / [data-layout-mode="dark"], the
 * same attributes your original Welcome.js checked — no separate
 * toggle needed, it just reacts to the moon icon already in your
 * topbar.
 */
const Container = ({ className, children }) => <div className={className}>{children}</div>;
const useTranslation = () => ({ t: (s) => s });

/* ---------------- small line icons (no icon-library dependency) ---------------- */
const IconInventory = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M3 7.5V16l9 4.5 9-4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M12 12v8.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const IconPurchase = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M3 4h2l1.2 11.2A2 2 0 0 0 8.2 17h8.6a2 2 0 0 0 2-1.8L20 7H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20.5" r="1.2" fill="currentColor" />
    <circle cx="17" cy="20.5" r="1.2" fill="currentColor" />
  </svg>
);
const IconSales = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M12 3 3 12l7.5 8L21 10.5 20 4l-8-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="15.5" cy="7.5" r="1.4" fill="currentColor" />
  </svg>
);
const IconAccounts = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ---------------- faceted diamond, generated ---------------- */
const FacetedDiamond = () => {
  const cx = 150, cy = 150, rOuter = 118, rInner = 54, facetCount = 12;
  const pts = useMemo(() => {
    const outer = [], inner = [];
    for (let i = 0; i < facetCount; i++) {
      const a = (Math.PI * 2 * i) / facetCount - Math.PI / 2;
      outer.push({ x: cx + rOuter * Math.cos(a), y: cy + rOuter * Math.sin(a) });
      inner.push({ x: cx + rInner * Math.cos(a), y: cy + rInner * Math.sin(a) });
    }
    return { outer, inner };
  }, []);

  const outerPath = pts.outer.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const innerPath = pts.inner.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="gem" role="img" aria-label="Faceted diamond mark">
      <defs>
        <radialGradient id="gemBody" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="var(--gold-2)" />
          <stop offset="55%" stopColor="var(--ink-2)" />
          <stop offset="100%" stopColor="var(--ink-3)" />
        </radialGradient>
        <radialGradient id="gemTable" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor="var(--gold-1)" />
          <stop offset="100%" stopColor="var(--gold-2)" />
        </radialGradient>
        <clipPath id="gemClip">
          <polygon points={outerPath} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={rOuter + 14} className="gem-halo" />

      <g clipPath="url(#gemClip)">
        {pts.outer.map((o, i) => {
          const o2 = pts.outer[(i + 1) % facetCount];
          const in1 = pts.inner[i];
          const in2 = pts.inner[(i + 1) % facetCount];
          return (
            <polygon
              key={i}
              points={`${o.x},${o.y} ${o2.x},${o2.y} ${in2.x},${in2.y} ${in1.x},${in1.y}`}
              fill="url(#gemBody)"
              opacity={i % 2 === 0 ? 0.92 : 0.72}
              stroke="var(--gold-1)"
              strokeWidth="0.6"
              className="facet"
              style={{ animationDelay: `${i * 0.22}s` }}
            />
          );
        })}
        <polygon points={innerPath} fill="url(#gemTable)" stroke="var(--gold-1)" strokeWidth="0.7" />
        <ellipse className="gem-sheen" cx="150" cy="150" rx="130" ry="60" />
      </g>

      <polygon points={outerPath} fill="none" stroke="var(--gold-1)" strokeWidth="1.1" opacity="0.55" />
    </svg>
  );
};

const Welcome = () => {
  const { t } = useTranslation();
  if (typeof document !== "undefined") {
    document.title = `${t("Welcome")} | ${t("DiaJewSoft")}`;
  }

  const [userName, setUserName] = useState("Admin");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    try {
      const auth =
        (typeof sessionStorage !== "undefined" && sessionStorage.getItem("authUser")) ||
        (typeof localStorage !== "undefined" && localStorage.getItem("authUser"));
      if (auth) {
        const obj = JSON.parse(auth);
        const u = obj.user || obj.User || obj;
        setUserName(u.UserName || u.userName || "Admin");
      }
    } catch (e) {
      /* no-op */
    }
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  const greeting =
    hour < 5 ? t("Good night") :
    hour < 12 ? t("Good morning") :
    hour < 17 ? t("Good afternoon") :
    hour < 22 ? t("Good evening") : t("Good night");

  const dateStr = time.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long" });
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const modules = [
    { label: t("Inventory"), Icon: IconInventory },
    { label: t("Purchase"), Icon: IconPurchase },
    { label: t("Sales"), Icon: IconSales },
    { label: t("Accounts"), Icon: IconAccounts },
  ];

  return (
    <div className="dj-welcome">
      <Container className="dj-shell">
        <div className="dj-hero">
          <div className="dj-hero-text">
            <div className="dj-eyebrow-row">
              <p className="dj-eyebrow">{greeting}</p>
              <span className="dj-dot" />
              <span className="dj-date">{dateStr} · {timeStr}</span>
            </div>
            <h1 className="dj-headline">
              {t("Welcome back,")}
              <span className="dj-name">{userName}</span>
            </h1>
            <p className="dj-sub">
              {t("Every stone accounted for — inventory, purchase, sales and accounts, kept in one clear ledger.")}
            </p>

            <div className="dj-pills">
              {modules.map(({ label, Icon }) => (
                <div className="dj-pill" key={label}>
                  <Icon width="18" height="18" className="dj-pill-icon" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dj-hero-gem">
            <FacetedDiamond />
            <span className="dj-gem-caption">{t("Precision, catalogued.")}</span>
          </div>
        </div>
      </Container>

      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

      .dj-welcome{
        --paper:#FAF6EF;
        --paper-2:#F1E9DA;
        --ink:#37416B;
        --ink-2:#2E3760;
        --ink-3:#1E2545;
        --ink-soft:#6A7188;
        --gold-1:#B8935A;
        --gold-2:#7E5F35;
        --line: rgba(55,65,107,0.12);

        background:
          radial-gradient(900px 420px at 88% -8%, var(--paper-2), transparent 60%),
          var(--paper);
        color:var(--ink);
        font-family:'Work Sans', sans-serif;
        padding: 8px 0 48px;
      }

      [data-bs-theme="dark"] .dj-welcome,
      [data-layout-mode="dark"] .dj-welcome{
        --paper:#12151C;
        --paper-2:#191D26;
        --ink:#EFEAE0;
        --ink-soft:#A9AFC0;
        --gold-1:#D8B57F;
        --gold-2:#8A6A3D;
        --line: rgba(216,181,127,0.16);
      }

      .dj-shell{ max-width:1180px; margin:0 auto; padding: 44px 8px 8px; }

      .dj-hero{
        display:grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap:40px;
        align-items:center;
      }

      .dj-eyebrow-row{ display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .dj-eyebrow{
        font-family:'IBM Plex Mono', monospace;
        font-size:12px; letter-spacing:.22em; text-transform:uppercase;
        color:var(--gold-2); margin:0;
      }
      [data-bs-theme="dark"] .dj-eyebrow,
      [data-layout-mode="dark"] .dj-eyebrow{ color:var(--gold-1); }
      .dj-dot{ width:3px; height:3px; border-radius:50%; background:var(--ink-soft); opacity:.6; }
      .dj-date{
        font-family:'IBM Plex Mono', monospace;
        font-size:12px; letter-spacing:.04em; color:var(--ink-soft);
      }

      .dj-headline{
        font-family:'Cormorant Garamond', serif;
        font-weight:600;
        font-size:clamp(34px, 4vw, 56px);
        line-height:1.06;
        margin:0 0 18px;
        color:var(--ink);
      }
      .dj-name{
        display:block;
        font-style:italic;
        font-weight:600;
        color:var(--gold-2);
        margin-top:2px;
      }
      [data-bs-theme="dark"] .dj-name,
      [data-layout-mode="dark"] .dj-name{ color:var(--gold-1); }

      .dj-sub{
        max-width:460px;
        font-size:15.5px; line-height:1.65;
        color:var(--ink-soft);
        margin:0 0 26px;
      }

      .dj-pills{ display:flex; flex-wrap:wrap; gap:10px; }
      .dj-pill{
        display:flex; align-items:center; gap:8px;
        padding:9px 15px;
        border:1px solid var(--line);
        border-radius:999px;
        font-size:13.5px; font-weight:500;
        color:var(--ink);
        transition: transform .2s ease, border-color .2s ease;
      }
      .dj-pill-icon{ color:var(--gold-1); }
      .dj-pill:hover{ transform:translateY(-2px); border-color:var(--gold-1); }

      .dj-hero-gem{
        display:flex; flex-direction:column; align-items:center; gap:12px;
      }
      .gem{ width:min(300px, 85%); height:auto; overflow:visible; }
      .gem-halo{ fill: var(--gold-1); opacity:.10; filter:blur(18px); }
      .gem-sheen{
        fill:#fff; opacity:.16; mix-blend-mode:overlay;
        transform-origin:150px 150px;
        animation: sheenSweep 7s ease-in-out infinite;
      }
      .facet{ animation: facetGlow 6s ease-in-out infinite; transform-origin:150px 150px; }
      .dj-gem-caption{
        font-family:'IBM Plex Mono', monospace;
        font-size:11px; letter-spacing:.18em; text-transform:uppercase;
        color:var(--ink-soft);
      }

      @keyframes sheenSweep{
        0%,100%{ transform: translate(-46px,-30px) rotate(0deg); opacity:.10; }
        50%{ transform: translate(46px,26px) rotate(8deg); opacity:.22; }
      }
      @keyframes facetGlow{
        0%,100%{ filter:brightness(1); }
        50%{ filter:brightness(1.18); }
      }

      @media (prefers-reduced-motion: reduce){
        .gem-sheen, .facet{ animation:none; }
      }

      @media (max-width: 860px){
        .dj-hero{ grid-template-columns:1fr; gap:8px; }
        .dj-hero-gem{ order:-1; margin-bottom:4px; }
        .gem{ width:200px; }
        .dj-headline{ font-size:34px; }
      }
      @media (max-width: 480px){
        .dj-shell{ padding:32px 4px 4px; }
      }
      `}</style>
    </div>
  );
};

export default Welcome;