import * as XLSX from 'xlsx';
import React, { Component, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogoBadge, RewardStoreView, FounderRewardsTab } from "./RewardsSystem";

// ─── TOKENS ────────────────────refresh ───────────────────────────────────────────────
const T = {
  blue: "#4A9EFF", blueDim: "#2E7FE0", blueDeep: "#1A5FC8",
  blueGlow: "rgba(74,158,255,0.18)", blueGlowSm: "rgba(74,158,255,0.10)",
  gold: "#E8C46A", black: "#000000",
  glass: "rgba(255,255,255,0.05)", glassBorder: "rgba(255,255,255,0.08)",
  glassActive: "rgba(74,158,255,0.06)",
  text: "#F2F2F7", textSub: "rgba(242,242,247,0.52)",
  textMute: "rgba(242,242,247,0.28)", error: "#FF6058",
};
const SP = {
  gentle: { type: "spring", stiffness: 110, damping: 20 },
  snappy: { type: "spring", stiffness: 300, damping: 28 },
  bouncy: { type: "spring", stiffness: 360, damping: 22 },
  micro: { type: "spring", stiffness: 520, damping: 36 },
  slow: { type: "spring", stiffness: 70, damping: 18 },
  island: { type: "spring", stiffness: 420, damping: 32 },
};

const SALARY = Math.floor(Math.random() * (120000 - 35000) + 35000);
const SPENT = Math.floor(SALARY * (Math.random() * 0.15 + 0.05));
const BAL = SALARY - SPENT;
function fmt(n) { return n.toLocaleString("en-IN"); }

// ─── NOTIFICATION DATA ────────────────────────────────────────────────────────
const TX_CATS = [
  { name: "Fuel", cat: "Transport", col: "#F6AD55", via: "HDFC UPI" },
  { name: "Groceries", cat: "Daily Needs", col: "#68D391", via: "PhonePe" },
  { name: "Coffee", cat: "Food & Drink", col: "#D4A96A", via: "GPay" },
  { name: "Food Delivery", cat: "Food & Drink", col: "#FC8181", via: "Swiggy" },
  { name: "Netflix", cat: "OTT", col: "#E50914", via: "Auto Debit" },
  { name: "Spotify", cat: "Music", col: "#1DB954", via: "Auto Debit" },
  { name: "Shopping", cat: "Retail", col: "#8A5CF6", via: "Amazon Pay" },
  { name: "Medicine", cat: "Health", col: "#63B3ED", via: "PhonePe" },
  { name: "Electricity", cat: "Utilities", col: "#F6E05E", via: "BBPS" },
  { name: "Recharge", cat: "Telecom", col: "#76E4F7", via: "GPay" },
  { name: "Travel", cat: "Transport", col: "#FC8181", via: "IRCTC UPI" },
  { name: "Restaurant", cat: "Food & Drink", col: "#FBD38D", via: "Zomato Pay" },
];

function genTransaction() {
  const cat = TX_CATS[Math.floor(Math.random() * TX_CATS.length)];
  const amt = Math.floor(Math.random() * 1990 + 10);
  return { id: Date.now() + Math.random(), ...cat, amt, coins: amt, ts: new Date(), type: "spend" };
}

// Special notification types for Dynamic Island
const SPECIAL_NOTIFS = [
  { type: "weekly", title: "Weekly Progress Updated", sub: "₹850 away from Power User tier", nav: "weekly" },
  { type: "monthly", title: "Monthly Tier Progress", sub: "Keep spending to unlock Silver", nav: "monthly" },
  { type: "store", title: "New Reward Available", sub: "Visit Reward Store to claim", nav: "store" },
  { type: "coin", title: "Coin Milestone Reached", sub: "First milestone unlocked", nav: "wallet" },
];
function genSpecial() {
  return { id: Date.now() + Math.random(), ...SPECIAL_NOTIFS[Math.floor(Math.random() * SPECIAL_NOTIFS.length)] };
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M7 5H20C23.866 5 27 8.134 27 12C27 15.866 23.866 19 20 19H7V5Z" fill="white" fillOpacity="0.92" />
      <rect x="7" y="19" width="5" height="8" rx="2.5" fill="white" fillOpacity="0.92" />
      <circle cx="20" cy="12" r="3" fill={T.blue} fillOpacity="0.7" />
    </svg>
  );
}
function LogoBadge({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 ${size * 0.7}px rgba(74,158,255,0.3)`
    }}>
      <LogoMark size={size * 0.56} />
    </div>
  );
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function ParticleField({ count = 22, colors }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: Math.random() * 2.5 + 0.8, op: Math.random() * 0.3 + 0.04,
    dur: Math.random() * 9 + 6, del: Math.random() * 5,
    col: colors ? colors[i % colors.length] : T.blue,
  }))).current;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {pts.map(p => (
        <motion.div key={p.id}
          style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: "50%", background: p.col, filter: `blur(${p.s * 0.5}px)`
          }}
          animate={{
            y: [0, -26, 0, 16, 0], x: [0, 10, -7, 4, 0],
            opacity: [0, p.op, p.op * 0.55, p.op, 0], scale: [0.8, 1.2, 0.9, 1.1, 0.8]
          }}
          transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}
function Glow({ x = 50, y = 50, color = T.blueGlow, size = 500, blur = 40 }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%,-50%)", width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle,${color} 0%,transparent 68%)`,
      filter: `blur(${blur}px)`, pointerEvents: "none", zIndex: 0
    }} />
  );
}

// ─── FLOATING INPUT ───────────────────────────────────────────────────────────
function FloatingInput({ label, type = "text", value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const hasVal = value && value.length > 0;
  const floated = focused || hasVal;
  return (
    <div style={{ position: "relative", marginBottom: 16, width: "100%" }}>
      <motion.div
        animate={{
          borderColor: error ? T.error : focused ? T.blue : hasVal ? "rgba(255,255,255,0.14)" : T.glassBorder,
          background: focused ? T.glassActive : T.glass,
          boxShadow: focused ? `0 0 0 1px ${T.blue}3A,0 4px 20px rgba(74,158,255,0.07)` : error ? `0 0 0 1px ${T.error}3A` : "none",
        }}
        transition={{ duration: 0.18 }}
        style={{
          borderRadius: 14, border: "1px solid",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          position: "relative", width: "100%",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          height: 58,
        }}>
        {/* Label floats inside the box — never outside */}
        <motion.label
          animate={{
            top: floated ? 8 : 19,
            fontSize: floated ? 10 : 15,
            color: error ? T.error : focused ? T.blue : T.textSub,
            letterSpacing: floated ? "0.09em" : "0",
            fontWeight: floated ? 600 : 400,
          }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "absolute", left: 15, right: 15,
            pointerEvents: "none", zIndex: 2, lineHeight: 1,
            textTransform: floated ? "uppercase" : "none",
          }}>
          {label}
        </motion.label>
        {/* Input sits at the bottom — cursor always inside the border */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          style={{
            position: "relative", zIndex: 1,
            background: "transparent", border: "none", outline: "none",
            width: "100%", padding: "0 15px 10px",
            fontSize: 16, color: T.text, fontFamily: "inherit",
            caretColor: T.blue, boxSizing: "border-box",
            minWidth: 0,
          }} />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            style={{ color: T.error, fontSize: 11, marginTop: 4, marginLeft: 3, fontWeight: 500 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
function Btn({ children, onClick, full, large, disabled, variant = "primary" }) {
  const [ripples, setRipples] = useState([]);
  const fire = e => {
    if (disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(x => [...x, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples(x => x.filter(p => p.id !== id)), 650);
    onClick?.();
  };
  const pri = variant === "primary";
  return (
    <motion.button whileHover={disabled ? {} : { scale: 1.022 }} whileTap={disabled ? {} : { scale: 0.972 }}
      transition={SP.snappy} onClick={fire}
      style={{
        position: "relative", overflow: "hidden", width: full ? "100%" : "auto",
        padding: large ? "17px 36px" : "13px 28px", borderRadius: 100,
        border: pri ? "none" : `1px solid ${T.glassBorder}`,
        background: pri ? `linear-gradient(135deg,${T.blue},${T.blueDeep})` : T.glass,
        color: pri ? "#fff" : T.text, fontSize: large ? 16.5 : 15, fontWeight: 700, letterSpacing: "0.015em",
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.42 : 1,
        boxShadow: pri ? "0 0 32px rgba(74,158,255,0.3),0 4px 14px rgba(74,158,255,0.18)" : "none",
        backdropFilter: !pri ? "blur(16px)" : "none", flexShrink: 0
      }}>
      {ripples.map(rp => (
        <motion.span key={rp.id} initial={{ scale: 0, opacity: 0.3 }} animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute", width: 60, height: 60, borderRadius: "50%",
            background: pri ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
            left: rp.x - 30, top: rp.y - 30, pointerEvents: "none"
          }} />
      ))}
      {children}
    </motion.button>
  );
}

function MiniHeader({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
      <LogoBadge size={30} />
      <span style={{ fontSize: 13, fontWeight: 700, color: T.textSub, letterSpacing: "0.07em" }}>PAYMINT</span>
      {step && <span style={{ marginLeft: "auto", fontSize: 12, color: T.textMute, fontWeight: 500 }}>Step {step} of 3</span>}
    </div>
  );
}

// ─── ANIMATED COUNT ───────────────────────────────────────────────────────────
function AnimatedCount({ value, style }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current, end = value;
    const dur = Math.min(700, Math.abs(end - start) * 2);
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setDisplay(Math.round(start + (end - start) * e));
      if (p < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span style={style}>{fmt(display)}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ISLAND NOTIFICATION — Apple-grade centered pill
// ═══════════════════════════════════════════════════════════════════════════════
function DynamicIsland({ notif, onDismiss, onNavigate }) {
  const isSpend = notif?.type === "spend";
  // phase: pill → expand → content → contract → exit
  const [phase, setPhase] = useState("pill");
  const notifRef = useRef(null);

  useEffect(() => {
    if (!notif) { setPhase("pill"); return; }
    notifRef.current = notif;
    setPhase("pill");
    const t1 = setTimeout(() => setPhase("expand"), 60);
    const t2 = setTimeout(() => setPhase("content"), 380);
    const t3 = setTimeout(() => setPhase("contract"), 3600);
    const t4 = setTimeout(() => { setPhase("exit"); setTimeout(onDismiss, 300); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [notif, onDismiss]);

  const handleTap = () => {
    if (!notif) return;
    if (notif.nav) onNavigate?.(notif.nav);
    else if (isSpend) onNavigate?.("wallet");
    onDismiss();
  };

  const n = notif || notifRef.current;
  if (!n && phase === "pill") return null;

  // Width/height per phase
  const pillW = 126, pillH = 34;
  const expandW = 320, expandH = 72;
  const contentW = 360, contentH = 80;

  const widths = { pill: pillW, expand: expandW, content: contentW, contract: pillW, exit: pillW };
  const heights = { pill: pillH, expand: expandH, content: contentH, contract: pillH, exit: pillH };
  const opacities = { pill: 1, expand: 1, content: 1, contract: 1, exit: 0 };

  return (
    <AnimatePresence>
      {notif && (
        <motion.div
          key={n?.id}
          style={{
            position: "absolute", top: 14, left: "50%", x: "-50%",
            zIndex: 500, cursor: "pointer",
          }}
          initial={{ y: -80, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -70, opacity: 0, scale: 0.88 }}
          transition={{ ...SP.island }}
          onClick={handleTap}
        >
          {/* Island pill */}
          <motion.div
            animate={{
              width: widths[phase] ?? pillW,
              height: heights[phase] ?? pillH,
              borderRadius: phase === "pill" || phase === "contract" || phase === "exit" ? 100 : 26,
            }}
            transition={{ ...SP.island }}
            style={{
              background: "rgba(10,10,14,0.92)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 12px 48px rgba(0,0,0,0.7), 0 4px 16px rgba(74,158,255,0.1)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Pill state — just logo + dot */}
            <AnimatePresence>
              {(phase === "pill" || phase === "contract" || phase === "exit") && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 5,
                    background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <LogoMark size={9} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: "0.04em" }}>
                    PAYMINT
                  </span>
                  {isSpend && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], background: [T.gold, "#FFF599", T.gold] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold }} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expanded content */}
            <AnimatePresence>
              {phase === "content" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.22, ...SP.snappy }}
                  style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", padding: "0 14px", gap: 12
                  }}>

                  {/* Category icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.06, ...SP.bouncy }}
                    style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: isSpend
                        ? `linear-gradient(145deg,${n.col}28,${n.col}12)`
                        : `linear-gradient(145deg,rgba(74,158,255,0.22),rgba(74,158,255,0.1))`,
                      border: `1px solid ${isSpend ? n.col + "3A" : "rgba(74,158,255,0.28)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                    {isSpend ? (
                      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="9" fill="none" stroke={n.col} strokeWidth="1.5" />
                        <text x="11" y="15.5" textAnchor="middle" fill={n.col} fontSize="9.5" fontWeight="800"
                          fontFamily="Inter,-apple-system,sans-serif">P</text>
                      </svg>
                    ) : n.type === "challenge" ? (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.5l-4.95 2.7.95-5.5L2 6.8l5.5-.8z"
                          fill={n.col || T.gold} fillOpacity="0.3" stroke={n.col || T.gold} strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      n.type === "weekly" ? (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.5l-4.95 2.7.95-5.5L2 6.8l5.5-.8z"
                            fill={T.blue} fillOpacity="0.2" stroke={T.blue} strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                      ) : n.type === "monthly" ? (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="8" fill="none" stroke={T.gold} strokeWidth="1.3" />
                          <path d="M10 5v5l3 2" stroke={T.gold} strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      ) : n.type === "store" ? (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="8" width="16" height="11" rx="2.5" fill="none" stroke={T.blue} strokeWidth="1.3" />
                          <path d="M6 8V6a4 4 0 018 0v2" stroke={T.blue} strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="8" fill="none" stroke={T.gold} strokeWidth="1.4" />
                          <text x="10" y="14.5" textAnchor="middle" fill={T.gold} fontSize="9" fontWeight="800"
                            fontFamily="Inter,-apple-system,sans-serif">P</text>
                        </svg>
                      )
                    )}
                  </motion.div>

                  {/* Text */}
                  <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.22 }} style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 12.5, fontWeight: 700, color: T.text,
                      letterSpacing: "-0.01em", lineHeight: 1.25,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {isSpend ? `+${fmt(n.coins)} Coins Earned` : n.title}
                    </p>
                    <p style={{
                      margin: "2px 0 0", fontSize: 11, color: T.textSub,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {isSpend ? `\u20B9${fmt(n.amt)} · ${n.via}` : n.sub}
                    </p>
                  </motion.div>

                  {/* Right badge */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.18, ...SP.bouncy }}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                      background: (isSpend || n.type === "challenge") ? "rgba(232,196,106,0.12)" : "rgba(74,158,255,0.12)",
                      border: `1px solid ${(isSpend || n.type === "challenge") ? "rgba(232,196,106,0.25)" : "rgba(74,158,255,0.25)"}`,
                      borderRadius: 20, padding: "4px 9px"
                    }}>
                    {(isSpend || n.type === "challenge") ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold }} />
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.gold }}>
                          +{fmt(n.coins || n.reward || 0)}
                        </span>
                      </>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7l3 3 5-6" stroke={T.blue} strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inner glow accent */}
            <motion.div
              animate={{ opacity: phase === "content" ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
                width: 200, height: 40, borderRadius: "50%",
                background: isSpend ? `rgba(232,196,106,0.12)` : `rgba(74,158,255,0.1)`,
                filter: "blur(14px)", pointerEvents: "none"
              }} />
          </motion.div>

          {/* Coin fly-out particles on spend */}
          {isSpend && phase === "content" && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              {Array.from({ length: 5 }, (_, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: contentW / 2, y: contentH / 2, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: contentW / 2 + (Math.cos((i / 5) * Math.PI * 2) * 40),
                    y: contentH / 2 + (Math.sin((i / 5) * Math.PI * 2) * 30) - 20,
                    scale: [0, 1.2, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease: "easeOut" }}
                  style={{
                    position: "absolute", width: 5, height: 5, borderRadius: "50%",
                    background: T.gold, boxShadow: `0 0 6px ${T.gold}`, top: 0, left: 0
                  }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTRO SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function IntroScreen({ onNext, onBetaTap }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <ParticleField count={28} colors={[T.blue, "rgba(74,158,255,0.4)", "rgba(232,196,106,0.22)"]} />
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.5, ease: "easeOut" }}>
        <Glow x={50} y={44} color="rgba(74,158,255,0.11)" size={660} />
        <Glow x={50} y={44} color="rgba(74,158,255,0.055)" size={880} />
      </motion.div>
      {[340, 490].map((sz, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.55, rotate: i === 0 ? -22 : 22 }}
          animate={{ opacity: i === 0 ? 0.07 : 0.04, scale: 1, rotate: 0 }}
          transition={{ duration: 3 + i * 0.5, ease: "easeOut", delay: 0.4 + i * 0.3 }}
          style={{
            position: "absolute", width: sz, height: sz, borderRadius: "50%",
            border: `1px solid ${T.blue}`, pointerEvents: "none"
          }} />
      ))}
      <div style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.5, ...SP.gentle }} style={{ marginBottom: 22 }}>
          <motion.div
            animate={{ boxShadow: [`0 0 26px rgba(74,158,255,0.26)`, `0 0 52px rgba(74,158,255,0.48)`, `0 0 26px rgba(74,158,255,0.26)`] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 68, height: 68, borderRadius: 20,
              background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto"
            }}>
            <LogoMark size={36} />
          </motion.div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 1, ...SP.gentle }}
          onClick={onBetaTap}
          style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-0.045em", color: T.text, margin: 0, lineHeight: 1, cursor: "default", userSelect: "none" }}>
          PAY<motion.span animate={{ color: [T.blue, "#80BDFF", T.blue] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>MINT</motion.span>
        </motion.h1>
        <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.5, ease: "easeOut" }}
          style={{ width: 34, height: 1, background: `linear-gradient(90deg,transparent,${T.blue},transparent)`, margin: "16px auto" }} />
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 1.6 }}
          style={{ fontSize: 15.5, color: T.textSub, letterSpacing: "0.03em", fontWeight: 400, margin: 0, lineHeight: 1.6 }}>
          Every Rupee Deserves a Reward.
        </motion.p>
      </div>
      <motion.div initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 2, ...SP.gentle }}
        style={{ position: "absolute", bottom: 52, left: 0, right: 0, padding: "0 32px", zIndex: 10 }}>
        <Btn onClick={onNext} full large>Get Started</Btn>
      </motion.div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 110,
        background: "linear-gradient(to top,rgba(0,0,0,0.85),transparent)", pointerEvents: "none"
      }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function AccountScreen({ onNext }) {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", dob: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const validate = (f, v) => {
    if (f === "name") return v.trim().length < 2 ? "Enter your full name" : null;
    if (f === "email") return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null;
    if (f === "mobile") return !/^\d{10}$/.test(v.replace(/\s/g, "")) ? "10-digit number required" : null;
    if (f === "dob") return !v ? "Date of birth required" : null;
    return null;
  };
  const chg = f => e => {
    const v = e.target.value; setForm(x => ({ ...x, [f]: v }));
    if (touched[f]) setErrors(x => ({ ...x, [f]: validate(f, v) }));
  };
  const submit = () => {
    const errs = {}; let bad = false;
    Object.keys(form).forEach(k => { const e = validate(k, form[k]); if (e) { errs[k] = e; bad = true; } });
    setErrors(errs); setTouched({ name: true, email: true, mobile: true, dob: true });
    if (!bad) onNext(form.name.trim().split(" ")[0]);
  };
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={12} /><Glow x={78} y={8} color="rgba(74,158,255,0.07)" size={360} />
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ padding: "52px 24px 0", flexShrink: 0 }}>
        <MiniHeader step={1} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p style={{ fontSize: 12, color: T.blue, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Basic Details</p>
          <h2 style={{ fontSize: 29, fontWeight: 800, color: T.text, margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.18 }}>Welcome to<br />Paymint.</h2>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0, lineHeight: 1.6 }}>Set up your account in seconds.</p>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, ...SP.gentle }}
        style={{ padding: "24px 24px 0", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <FloatingInput label="Full Name" value={form.name} onChange={chg("name")} error={errors.name} />
        <FloatingInput label="Email Address" type="email" value={form.email} onChange={chg("email")} error={errors.email} />
        <FloatingInput label="Mobile Number" type="tel" value={form.mobile} onChange={chg("mobile")} error={errors.mobile} />
        <FloatingInput label="Date of Birth" type="date" value={form.dob} onChange={chg("dob")} error={errors.dob} />
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "4px 0 20px" }}>
          {["name", "email", "mobile", "dob"].map(f => (
            <motion.div key={f}
              animate={{
                background: form[f] && !validate(f, form[f]) ? T.blue : T.glassBorder,
                scale: form[f] && !validate(f, form[f]) ? 1.3 : 1
              }}
              transition={SP.micro} style={{ width: 6, height: 6, borderRadius: 3 }} />
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ padding: "12px 24px 44px", flexShrink: 0 }}>
        <Btn onClick={submit} full large>Continue</Btn>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECT BANK
// ═══════════════════════════════════════════════════════════════════════════════
const BANKS = [
  { id: "hdfc", name: "HDFC Bank", sub: "India's largest private bank", rgb: "66,153,225", fill: "#4299E1" },
  { id: "icici", name: "ICICI Bank", sub: "Facets of Life", rgb: "229,62,62", fill: "#E53E3E" },
  { id: "sbi", name: "State Bank of India", sub: "The Banker to Every Indian", rgb: "49,130,206", fill: "#3182CE" },
  { id: "axis", name: "Axis Bank", sub: "Badhte Ka Naam Zindagi", rgb: "237,137,54", fill: "#ED8936" },
];
function BankCard({ bank, selected, onSelect }) {
  return (
    <motion.div onClick={() => onSelect(bank.id)} whileTap={{ scale: 0.975 }}
      animate={{
        background: selected ? `rgba(${bank.rgb},0.09)` : T.glass,
        borderColor: selected ? bank.fill : T.glassBorder,
        boxShadow: selected ? `0 0 0 1px rgba(${bank.rgb},0.22),0 8px 24px rgba(${bank.rgb},0.12)` : "0 2px 8px rgba(0,0,0,0.28)"
      }}
      transition={{ duration: 0.17 }}
      style={{
        border: "1px solid", borderRadius: 15, padding: "14px 15px", cursor: "pointer",
        backdropFilter: "blur(16px)", position: "relative", overflow: "hidden"
      }}>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: "220%", opacity: 0.11 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
            style={{
              position: "absolute", top: 0, bottom: 0, width: "55%",
              background: `linear-gradient(90deg,transparent,${bank.fill},transparent)`, pointerEvents: "none"
            }} />
        )}
      </AnimatePresence>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div animate={{ scale: selected ? 1.05 : 1 }} transition={SP.micro}
          style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: `rgba(${bank.rgb},0.11)`, border: `1px solid rgba(${bank.rgb},0.2)`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
            <rect width="26" height="13" rx="3" fill={bank.fill} fillOpacity="0.14" />
            <text x="3" y="9.8" fill={bank.fill} fontSize="7" fontWeight="800" letterSpacing="0.4"
              fontFamily="Inter,-apple-system,sans-serif">{bank.id.toUpperCase()}</text>
          </svg>
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: T.text }}>{bank.name}</p>
          <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, marginTop: 2 }}>{bank.sub}</p>
        </div>
        <motion.div animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }} transition={SP.bouncy}
          style={{
            width: 20, height: 20, borderRadius: "50%", background: T.blue, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 7L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
function ConnectScreen({ onNext }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={10} /><Glow x={18} y={80} color="rgba(74,158,255,0.07)" size={360} />
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ padding: "52px 24px 0", flexShrink: 0 }}>
        <MiniHeader step={2} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p style={{ fontSize: 12, color: T.blue, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Connect Bank</p>
          <h2 style={{ fontSize: 27, fontWeight: 800, color: T.text, margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Connect Your<br />Bank Account
          </h2>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0, lineHeight: 1.6 }}>Use UPI and your bank exactly as you do today.</p>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
        style={{ padding: "20px 24px 0", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {BANKS.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38 + i * 0.07, ...SP.gentle }}>
            <BankCard bank={b} selected={sel === b.id} onSelect={setSel} />
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78 }}
          style={{
            marginTop: 4, padding: "13px 15px", borderRadius: 13,
            background: "rgba(74,158,255,0.04)", border: "1px solid rgba(74,158,255,0.1)"
          }}>
          {[
            { path: "M8 1L13 3.5V8C13 11.2 10.8 13.7 8 15C5.2 13.7 3 11.2 3 8V3.5L8 1Z", text: "Bank-grade 256-bit encryption" },
            { path: "M6 9a2.5 2.5 0 003.54.46L12 7a2.5 2.5 0 00-3.54-3.54L7 5", text: "Secure read-only access" },
            { path: "M3 8l3.5 3.5L13 4", text: "RBI compliant and certified" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -7 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.86 + i * 0.06 }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 0" }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d={item.path} stroke={T.blue} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        style={{ padding: "12px 24px 44px", flexShrink: 0 }}>
        <Btn onClick={sel ? onNext : undefined} full large disabled={!sel}>
          {sel ? "Connect Account" : "Select a Bank to Continue"}
        </Btn>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════════════════════
const LSTEPS = [
  { label: "Account Connected", sub: "Secure connection established" },
  { label: "Creating Your Rewards Profile", sub: "Personalising your experience…" },
  { label: "Preparing Your Dashboard", sub: "Cards are assembling…" },
  { label: "Almost Ready", sub: "Final touches in progress…" },
];
function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState("logo");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("steps"), 1600);
    let progTimer; const TOTAL = 2800;
    const t2 = setTimeout(() => {
      const start = Date.now();
      const tick = () => { const pct = Math.min(((Date.now() - start) / TOTAL) * 100, 100); setProgress(pct); if (pct < 100) progTimer = requestAnimationFrame(tick); };
      progTimer = requestAnimationFrame(tick);
      [0, 700, 1400, 2100].forEach((t, i) => setTimeout(() => setStep(i), t));
    }, 1600);
    const t3 = setTimeout(() => setPhase("coins"), 1600 + 2900);
    const t4 = setTimeout(() => { setPhase("done"); onDone(); }, 1600 + 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); if (progTimer) cancelAnimationFrame(progTimer); };
  }, [onDone]);
  const txCards = [
    { del: 0.1, label: "Salary Credit", amt: "+ 45,000", col: T.blue },
    { del: 0.3, label: "Swiggy Order", amt: "- 342", col: "#E05D5D" },
    { del: 0.55, label: "Amazon Pay", amt: "- 1,499", col: T.gold },
    { del: 0.75, label: "PhonePe", amt: "+ 120", col: "#8A5CF6" },
  ];
  const coins = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ angle: (i / 20) * Math.PI * 2, r: 50 + Math.random() * 52, del: i * 0.055 })), []);
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <Glow x={50} y={50} color="rgba(74,158,255,0.1)" size={560} /><ParticleField count={16} />
      <AnimatePresence mode="wait">
        {phase === "logo" && (
          <motion.div key="lp" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15, filter: "blur(6px)" }} transition={{ duration: 0.6, ...SP.gentle }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 10 }}>
            <motion.div
              animate={{ boxShadow: [`0 0 30px rgba(74,158,255,0.3)`, `0 0 70px rgba(74,158,255,0.55)`, `0 0 30px rgba(74,158,255,0.3)`] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 80, height: 80, borderRadius: 22, background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              <LogoMark size={42} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", margin: 0, textAlign: "center" }}>PAYMINT</h2>
              <p style={{ fontSize: 13.5, color: T.textSub, margin: "6px 0 0", textAlign: "center" }}>Activating your account…</p>
            </motion.div>
          </motion.div>
        )}
        {phase === "steps" && (
          <motion.div key="sp" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }} transition={{ duration: 0.36 }}
            style={{
              width: "100%", maxWidth: 340, padding: "0 28px",
              display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10
            }}>
            <div style={{ position: "relative", width: 86, height: 86, marginBottom: 28, flexShrink: 0 }}>
              <motion.svg width="86" height="86" viewBox="0 0 86 86"
                animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ position: "absolute", inset: 0 }}>
                <circle cx="43" cy="43" r="36" fill="none" stroke="rgba(74,158,255,0.09)" strokeWidth="2.5" />
                <circle cx="43" cy="43" r="36" fill="none" stroke={T.blue} strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray="54 172" />
              </motion.svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LogoBadge size={42} />
              </div>
            </div>
            <div style={{ textAlign: "center", minHeight: 72, marginBottom: 24 }}>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
                  {step === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 7 }}>
                      <motion.svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SP.bouncy, delay: 0.1 }}>
                        <circle cx="9" cy="9" r="8" fill={T.blue} fillOpacity="0.14" stroke={T.blue} strokeWidth="1.3" />
                        <motion.path d="M5 9l2.8 2.8 5.2-5.6" stroke={T.blue} strokeWidth="1.7"
                          strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }} />
                      </motion.svg>
                      <span style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{LSTEPS[0].label}</span>
                    </div>
                  )}
                  {step > 0 && <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 7px", letterSpacing: "-0.025em", lineHeight: 1.25 }}>{LSTEPS[step].label}…</h3>}
                  <p style={{ fontSize: 13.5, color: T.textSub, margin: 0 }}>{LSTEPS[step].sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
              <motion.div style={{ height: "100%", background: `linear-gradient(90deg,${T.blue},#80C4FF)`, borderRadius: 2 }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.22, ease: "easeOut" }} />
            </div>
            <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 32 }}>
              {LSTEPS.map((_, i) => (
                <motion.div key={i} animate={{ background: i <= step ? T.blue : "rgba(255,255,255,0.1)", scale: i === step ? 1.4 : 1 }}
                  transition={SP.micro} style={{ width: 5, height: 5, borderRadius: 2.5 }} />
              ))}
            </div>
            {step >= 1 && (
              <div style={{ position: "relative", width: "100%", height: 100, overflow: "hidden" }}>
                {txCards.map((c, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 50, scale: 0.85 }}
                    animate={{ opacity: [0, 0.9, 0.9, 0], y: [50, 0, 0, -40], scale: [0.85, 1, 1, 0.9] }}
                    transition={{ duration: 2.2, delay: c.del + i * 0.12, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
                    style={{
                      position: "absolute", left: i % 2 === 0 ? "4%" : "50%", top: i < 2 ? 0 : 40,
                      padding: "7px 13px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(14px)",
                      display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap"
                    }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.col, boxShadow: `0 0 7px ${c.col}` }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: T.textSub }}>{c.label}</p>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>{`\u20B9 ${c.amt}`}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {phase === "coins" && (
          <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
            style={{ position: "relative", width: 190, height: 190, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            {coins.map((c, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: Math.cos(c.angle) * c.r, y: Math.sin(c.angle) * c.r, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, scale: [0, 1.3, 1, 0] }}
                transition={{ duration: 1.05, delay: c.del, ease: [0.4, 0, 0.2, 1] }}
                style={{ position: "absolute", width: 5, height: 5, borderRadius: "50%", background: T.blue, boxShadow: `0 0 7px ${T.blue}` }} />
            ))}
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: 1 }} transition={{ duration: 0.52, delay: 0.72 }}
              style={{
                width: 70, height: 70, borderRadius: 20, background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px rgba(74,158,255,0.58)`
              }}>
              <LogoMark size={34} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME
// ═══════════════════════════════════════════════════════════════════════════════
function WelcomeScreen({ userName, onNext }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <ParticleField count={34} colors={[T.blue, "rgba(74,158,255,0.42)", T.gold, "rgba(232,196,106,0.28)"]} />
      <Glow x={50} y={50} color="rgba(74,158,255,0.14)" size={640} />
      {[300, 420, 550].map((sz, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.065, 0.035], scale: 1 }}
          transition={{ duration: 1.5 + i * 0.3, delay: i * 0.16, ease: "easeOut" }}
          style={{ position: "absolute", width: sz, height: sz, borderRadius: "50%", border: `1px solid ${T.blue}`, pointerEvents: "none" }} />
      ))}
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.18, ...SP.bouncy }}
        style={{ textAlign: "center", position: "relative", zIndex: 10, padding: "0 30px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.32, ...SP.bouncy }}
          style={{
            width: 78, height: 78, borderRadius: "50%", background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 26px",
            boxShadow: `0 0 52px rgba(74,158,255,0.48),0 0 100px rgba(74,158,255,0.18)`
          }}>
          <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
            <motion.path d="M2 13L10.5 22L30 2" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.44, delay: 0.52, ease: "easeOut" }} />
          </svg>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
          style={{ fontSize: 34, fontWeight: 800, color: T.text, margin: "0 0 11px", letterSpacing: "-0.035em", lineHeight: 1.15 }}>
          Welcome,<br /><span style={{ color: T.blue }}>{userName}</span>.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.76 }}
          style={{ fontSize: 15, color: T.textSub, margin: "0 0 34px", lineHeight: 1.65 }}>
          Let's show you how Paymint works.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Btn onClick={onNext} full large>Continue</Btn>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING CARDS (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
const CARDS = [
  {
    id: "coins", headline: "Earn Coins On Every Spend",
    body: "Every transaction earns coins automatically. Your coins accumulate in your wallet and can be redeemed for rewards.",
    visual: ({ active }) => (
      <div style={{ position: "relative", height: 152, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[{ label: "Swiggy", amt: "342", del: 0, col: "#E05D5D" }, { label: "Amazon", amt: "1499", del: 0.18, col: T.gold }, { label: "Zomato", amt: "280", del: 0.35, col: "#FF8C42" }].map((c, i) => active && (
          <motion.div key={i} initial={{ y: 0, opacity: 1 }} animate={{ y: -65, opacity: 0, scale: 0.7 }}
            transition={{ duration: 1, delay: c.del, repeat: Infinity, repeatDelay: 1.3, ease: "easeIn" }}
            style={{
              position: "absolute", left: `${22 + i * 22}%`, bottom: 18, padding: "5px 11px", borderRadius: 9,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", whiteSpace: "nowrap"
            }}>
            <p style={{ margin: 0, fontSize: 9, color: T.textSub }}>{c.label}</p>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: T.text }}>{`\u20B9 ${c.amt}`}</p>
          </motion.div>
        ))}
        <motion.div animate={active ? { scale: [1, 1.1, 1], boxShadow: [`0 0 18px rgba(74,158,255,0.28)`, `0 0 42px rgba(74,158,255,0.55)`, `0 0 18px rgba(74,158,255,0.28)`] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 62, height: 62, borderRadius: "50%", background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 26px rgba(74,158,255,0.38)`
          }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" fill="none" stroke="white" strokeWidth="1.7" strokeOpacity="0.75" />
            <text x="14" y="19" textAnchor="middle" fill="white" fontSize="11.5" fontWeight="800" fontFamily="Inter,-apple-system,sans-serif">P</text>
          </svg>
        </motion.div>
      </div>
    )
  },
  {
    id: "rewards", headline: "Unlock Weekly Rewards",
    body: "Your spending activity unlocks weekly rewards and bonus benefits tailored just for you.",
    visual: ({ active }) => (
      <div style={{ height: 152, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={active ? { rotateY: [0, 8, -8, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative", width: 88, height: 88 }}>
          <div style={{
            width: 88, height: 56, borderRadius: "0 0 13px 13px", marginTop: 32,
            background: "linear-gradient(160deg,#2A3B5A,#1A2840)", border: "1px solid rgba(74,158,255,0.24)", boxShadow: "0 8px 26px rgba(0,0,0,0.5)"
          }} />
          <motion.div animate={active ? { rotateX: [0, -18, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 35, background: "linear-gradient(160deg,#3A5080,#2A3B5A)",
              borderRadius: "13px 13px 0 0", border: "1px solid rgba(74,158,255,0.28)", transformOrigin: "bottom center", transformStyle: "preserve-3d"
            }} />
          <motion.div animate={active ? { opacity: [0.28, 0.75, 0.28] } : {}} transition={{ duration: 3.5, repeat: Infinity }}
            style={{ position: "absolute", bottom: 7, left: "50%", transform: "translateX(-50%)", width: 48, height: 7, borderRadius: "50%", background: T.blue, filter: "blur(7px)" }} />
          <div style={{
            position: "absolute", top: 23, left: "50%", transform: "translateX(-50%)", width: 17, height: 17, borderRadius: "50%",
            background: `linear-gradient(145deg,#5AAFFF,#2E7FE0)`, border: "1.5px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: 5.5, height: 7.5, borderRadius: 3, background: "rgba(255,255,255,0.82)" }} />
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: "tiers", headline: "Monthly Rewards & Tiers",
    body: "Progress through tiers and unlock bigger monthly rewards with every spend.",
    visual: ({ active }) => {
      const tiers = [{ name: "Bronze", col: "#CD7F32", h: 46 }, { name: "Silver", col: "#A8A9AD", h: 62 }, { name: "Gold", col: T.gold, h: 78 }, { name: "Platinum", col: "#B0D4FF", h: 98 }];
      return (
        <div style={{ height: 152, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 11, paddingBottom: 18 }}>
          {tiers.map((t, i) => (
            <motion.div key={t.name} initial={{ height: 0, opacity: 0 }} animate={active ? { height: t.h, opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.52, delay: i * 0.11, ease: [0.4, 0, 0.2, 1] }}
              style={{
                width: 50, borderRadius: "7px 7px 3px 3px", overflow: "hidden", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start", paddingTop: 7,
                background: `linear-gradient(180deg,${t.col}26,${t.col}12)`, border: `1px solid ${t.col}3E`
              }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.col, boxShadow: `0 0 7px ${t.col}75`, flexShrink: 0 }} />
              <p style={{ margin: "4px 0 0", fontSize: 8, color: t.col, fontWeight: 700, letterSpacing: "0.04em" }}>{t.name}</p>
            </motion.div>
          ))}
        </div>
      );
    }
  },
  {
    id: "apps", headline: "No Change In Behaviour",
    body: "Continue using the apps you already love. Paymint rewards your spending automatically.",
    visual: ({ active }) => {
      const apps = [{ name: "GPay", col: "#4285F4" }, { name: "PhonePe", col: "#5F259F" }, { name: "Paytm", col: "#00B9F1" }, { name: "Bank", col: "#38A169" }];
      return (
        <div style={{ height: 152, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {apps.map((a, i) => {
            const angle = (i / apps.length) * Math.PI * 2 - Math.PI / 2, r = 56;
            return (
              <motion.div key={a.name}
                style={{
                  position: "absolute", left: `calc(50% + ${Math.cos(angle) * r}px - 19px)`,
                  top: `calc(50% + ${Math.sin(angle) * r}px - 19px)`, width: 38, height: 38, borderRadius: 11,
                  background: `${a.col}20`, border: `1px solid ${a.col}3E`, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center"
                }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: a.col, marginBottom: 2 }} />
                <p style={{ margin: 0, fontSize: 7, color: a.col, fontWeight: 700 }}>{a.name}</p>
              </motion.div>
            );
          })}
          {active && apps.map((a, i) => {
            const angle = (i / apps.length) * Math.PI * 2 - Math.PI / 2, r = 56;
            return (
              <motion.div key={`ln-${a.name}`} initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 0.32 }}
                transition={{ duration: 0.48, delay: 0.08 + i * 0.08 }}
                style={{
                  position: "absolute", left: "50%", top: "50%", width: r - 17, height: 1, background: T.blue,
                  transformOrigin: "left center", transform: `rotate(${angle}rad) translateY(-0.5px)`
                }} />
            );
          })}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
            <LogoBadge size={34} />
          </div>
        </div>
      );
    }
  },
];
function OnboardingCards({ onDone }) {
  const [idx, setIdx] = useState(0);
  const card = CARDS[idx]; const isLast = idx === CARDS.length - 1;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Glow x={50} y={28} color="rgba(74,158,255,0.08)" size={480} /><ParticleField count={12} />
      <div style={{ padding: "48px 24px 0", position: "relative", zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <LogoBadge size={26} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.textSub, letterSpacing: "0.07em" }}>PAYMINT</span>
          <span style={{ marginLeft: "auto", fontSize: 11.5, color: T.textMute, fontWeight: 500 }}>{idx + 1} of {CARDS.length}</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div animate={{ width: `${((idx + 1) / CARDS.length) * 100}%` }} transition={{ duration: 0.42, ease: "easeOut" }}
            style={{ height: "100%", background: `linear-gradient(90deg,${T.blue},#90CAFF)`, borderRadius: 2 }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={card.id} initial={{ opacity: 0, x: 48, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -48, scale: 0.97 }}
          transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 24px 0", position: "relative", zIndex: 10, minHeight: 0 }}>
          <motion.div initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(18px)", overflow: "hidden", flexShrink: 0,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05),0 8px 28px rgba(0,0,0,0.38)"
            }}>
            <card.visual active={true} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ marginTop: 22, flex: 1 }}>
            <p style={{ fontSize: 12, color: T.blue, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 8 }}>
              {idx + 1} of {CARDS.length}
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: "0 0 11px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{card.headline}</h2>
            <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.68, margin: 0 }}>{card.body}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
        style={{ padding: "14px 24px 44px", position: "relative", zIndex: 10, flexShrink: 0 }}>
        <Btn onClick={() => isLast ? onDone() : setIdx(i => i + 1)} full large>{isLast ? "Enter Dashboard" : "Next"}</Btn>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY REWARDS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const WEEKLY_TIERS = [
  {
    id: "starter", rank: 1, label: "Starter", spend: 500,
    col: "#CD7F32", grd: "linear-gradient(145deg,#3D2800,#1E1200)",
    border: "rgba(205,127,50,0.3)",
    perks: ["Small reward chest", "Bonus coins", "Surprise reward"]
  },
  {
    id: "active", rank: 2, label: "Active", spend: 1500,
    col: "#A8A9AD", grd: "linear-gradient(145deg,#252629,#131416)",
    border: "rgba(168,169,173,0.3)",
    perks: ["Better reward chest", "Bonus coins", "Premium offers"]
  },
  {
    id: "power", rank: 3, label: "Power User", spend: 3000,
    col: T.gold, grd: "linear-gradient(145deg,#2A2000,#130F00)",
    border: "rgba(232,196,106,0.3)",
    perks: ["Premium reward chest", "High-value rewards", "Exclusive offers"]
  },
];

function WeeklyRewardsScreen({ onBack, weeklySpend }) {
  const currentTier = WEEKLY_TIERS.filter(t => weeklySpend >= t.spend).pop() || null;
  const nextTier = WEEKLY_TIERS.find(t => weeklySpend < t.spend) || null;
  const progressToNext = nextTier
    ? Math.min((weeklySpend / nextTier.spend) * 100, 100)
    : 100;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={12} />
      <Glow x={60} y={15} color="rgba(232,196,106,0.07)" size={400} />
      <Glow x={20} y={70} color="rgba(74,158,255,0.06)" size={350} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ padding: "52px 24px 0", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 11, background: T.glass, border: `1px solid ${T.glassBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
            }}>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <path d="M10 2L4 7l6 5" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Weekly Rewards</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, marginTop: 2 }}>Unlock better rewards through weekly spending</p>
          </div>
        </div>

        {/* Weekly spend summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{
            borderRadius: 18, padding: "16px 18px", marginBottom: 4,
            background: "linear-gradient(145deg,#0C1A2E,#070D1A)",
            border: "1px solid rgba(74,158,255,0.18)",
            boxShadow: "0 8px 28px rgba(74,158,255,0.1)"
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(74,158,255,0.65)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                This Week's Spend
              </p>
              <motion.h3 key={weeklySpend}
                initial={{ scale: 1.1, color: "#80C4FF" }} animate={{ scale: 1, color: T.text }}
                transition={{ duration: 0.35, ...SP.bouncy }}
                style={{ margin: "3px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
                {`\u20B9 ${fmt(weeklySpend)}`}
              </motion.h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>Current Tier</p>
              <p style={{
                margin: "3px 0 0", fontSize: 14, fontWeight: 700,
                color: currentTier ? currentTier.col : T.textMute
              }}>
                {currentTier ? currentTier.label : "None yet"}
              </p>
            </div>
          </div>
          {nextTier && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>
                  {`\u20B9${fmt(Math.max(0, nextTier.spend - weeklySpend))} to ${nextTier.label}`}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{Math.round(progressToNext)}%</p>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div animate={{ width: `${progressToNext}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${T.blue},#90CAFF)` }} />
              </div>
            </>
          )}
          {!nextTier && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: T.gold,
                boxShadow: `0 0 10px ${T.gold}`
              }} />
              <p style={{ margin: 0, fontSize: 12, color: T.gold, fontWeight: 600 }}>Maximum tier reached</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Tier cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px", position: "relative", zIndex: 10 }}>
        <p style={{
          margin: "0 0 14px", fontSize: 12, color: T.textMute, fontWeight: 600,
          letterSpacing: "0.09em", textTransform: "uppercase"
        }}>Tier Progression</p>

        {WEEKLY_TIERS.map((tier, i) => {
          const isActive = currentTier?.id === tier.id;
          const isLocked = weeklySpend < tier.spend && !isActive;
          const isDone = weeklySpend >= tier.spend;

          return (
            <motion.div key={tier.id}
              initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, ...SP.gentle }}
              style={{ marginBottom: 12, position: "relative" }}>

              {/* Connector line */}
              {i < WEEKLY_TIERS.length - 1 && (
                <div style={{
                  position: "absolute", left: 27, top: "100%", width: 2, height: 12,
                  background: `linear-gradient(180deg,${isDone ? tier.col : "rgba(255,255,255,0.08)"},transparent)`,
                  zIndex: 1
                }} />
              )}

              <motion.div
                animate={{
                  background: isActive ? tier.grd : isDone ? tier.grd : "rgba(255,255,255,0.03)",
                  borderColor: isActive ? tier.col : isDone ? tier.col + "55" : T.glassBorder,
                  boxShadow: isActive
                    ? `0 0 0 1px ${tier.col}30,0 12px 32px ${tier.col}18,inset 0 1px 0 ${tier.col}15`
                    : isDone ? `0 4px 16px ${tier.col}10` : "none",
                }}
                transition={{ duration: 0.3 }}
                style={{
                  borderRadius: 18, border: "1px solid", backdropFilter: "blur(16px)", overflow: "hidden",
                  padding: "16px"
                }}>

                {/* Active glow sweep */}
                {isActive && (
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    style={{
                      position: "absolute", top: 0, bottom: 0, width: "40%",
                      background: `linear-gradient(90deg,transparent,${tier.col}18,transparent)`,
                      pointerEvents: "none"
                    }} />
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Badge */}
                  <motion.div
                    animate={isActive ? {
                      boxShadow: [`0 0 12px ${tier.col}40`, `0 0 24px ${tier.col}60`, `0 0 12px ${tier.col}40`]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: isLocked ? "rgba(255,255,255,0.04)" : `${tier.col}18`,
                      border: `1.5px solid ${isLocked ? T.glassBorder : tier.col + "50"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
                    }}>
                    {isLocked ? (
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <rect x="1" y="7" width="12" height="8.5" rx="2.5" stroke={T.textMute} strokeWidth="1.3" />
                        <path d="M3.5 7V5a3.5 3.5 0 017 0v2" stroke={T.textMute} strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <>
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%", background: tier.col,
                          boxShadow: isActive ? `0 0 10px ${tier.col}` : "none"
                        }} />
                        <p style={{ margin: 0, fontSize: 7.5, color: tier.col, fontWeight: 700 }}>{["B", "S", "P"][i]}</p>
                      </>
                    )}
                  </motion.div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h4 style={{
                        margin: 0, fontSize: 15, fontWeight: 800,
                        color: isLocked ? T.textMute : T.text, letterSpacing: "-0.01em"
                      }}>
                        {tier.label}
                      </h4>
                      {isActive && (
                        <motion.span
                          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                          style={{
                            fontSize: 10, fontWeight: 700, color: tier.col,
                            background: `${tier.col}18`, border: `1px solid ${tier.col}30`,
                            padding: "2px 8px", borderRadius: 20
                          }}>
                          ACTIVE
                        </motion.span>
                      )}
                      {isDone && !isActive && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "rgba(74,158,255,0.8)",
                          background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)",
                          padding: "2px 8px", borderRadius: 20
                        }}>
                          DONE
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: "0 0 10px", fontSize: 12,
                      color: isLocked ? T.textMute : T.textSub
                    }}>
                      Spend {`\u20B9${fmt(tier.spend)}`}+ per week
                    </p>

                    {/* Perks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {tier.perks.map((perk, j) => (
                        <motion.div key={perk} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + i * 0.1 + j * 0.05 }}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                            background: isLocked ? "rgba(255,255,255,0.15)" : tier.col,
                            opacity: isLocked ? 0.4 : 1
                          }} />
                          <span style={{ fontSize: 12.5, color: isLocked ? T.textMute : T.textSub }}>{perk}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY REWARDS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const MONTHLY_TIERS = [
  {
    id: "bronze", label: "Bronze", min: 0, max: 5000,
    col: "#CD7F32", grd: "linear-gradient(145deg,#3D2800,#1E1200)",
    border: "rgba(205,127,50,0.3)",
    perks: ["Coin earning on every spend", "Weekly rewards access"]
  },
  {
    id: "silver", label: "Silver", min: 5000, max: 15000,
    col: "#A8A9AD", grd: "linear-gradient(145deg,#252629,#131416)",
    border: "rgba(168,169,173,0.3)",
    perks: ["Better weekly rewards", "Bonus coin opportunities"]
  },
  {
    id: "gold", label: "Gold", min: 15000, max: 30000,
    col: T.gold, grd: "linear-gradient(145deg,#2A2000,#130F00)",
    border: "rgba(232,196,106,0.3)",
    perks: ["Premium reward access", "Enhanced rewards"]
  },
  {
    id: "platinum", label: "Platinum", min: 30000, max: Infinity,
    col: "#B0D4FF", grd: "linear-gradient(145deg,#0C1828,#060E18)",
    border: "rgba(176,212,255,0.3)",
    perks: ["Exclusive rewards", "Highest reward tier"]
  },
];

function MonthlyRewardsScreen({ onBack, monthlySpend }) {
  const currentTier = [...MONTHLY_TIERS].reverse().find(t => monthlySpend >= t.min) || MONTHLY_TIERS[0];
  const nextTier = MONTHLY_TIERS.find(t => t.min > monthlySpend);
  const progressInTier = nextTier
    ? Math.min(((monthlySpend - currentTier.min) / (currentTier.max - currentTier.min)) * 100, 100)
    : 100;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={12} />
      <Glow x={75} y={10} color="rgba(232,196,106,0.07)" size={380} />
      <Glow x={25} y={75} color="rgba(74,158,255,0.06)" size={320} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ padding: "52px 24px 0", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 11, background: T.glass, border: `1px solid ${T.glassBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
            }}>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <path d="M10 2L4 7l6 5" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Monthly Rewards</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, marginTop: 2 }}>The more active you are, the better your rewards</p>
          </div>
        </div>

        {/* Current tier hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{
            borderRadius: 18, padding: "18px 18px 16px", marginBottom: 4,
            background: currentTier.grd, border: `1px solid ${currentTier.border}`,
            boxShadow: `0 8px 32px ${currentTier.col}14`, position: "relative", overflow: "hidden"
          }}>
          {/* Tier shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
            style={{
              position: "absolute", top: 0, bottom: 0, width: "35%",
              background: `linear-gradient(90deg,transparent,${currentTier.col}12,transparent)`, pointerEvents: "none"
            }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: `${currentTier.col}99`, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Current Tier</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <motion.div
                  animate={{ boxShadow: [`0 0 10px ${currentTier.col}50`, `0 0 22px ${currentTier.col}80`, `0 0 10px ${currentTier.col}50`] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 32, height: 32, borderRadius: 10, background: `${currentTier.col}22`,
                    border: `1.5px solid ${currentTier.col}60`, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: currentTier.col }} />
                </motion.div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: currentTier.col, letterSpacing: "-0.03em" }}>
                  {currentTier.label}
                </h3>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>Monthly Spend</p>
              <motion.p key={monthlySpend}
                initial={{ scale: 1.08, color: `${currentTier.col}` }} animate={{ scale: 1, color: T.text }}
                transition={{ duration: 0.35, ...SP.bouncy }}
                style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>
                {`\u20B9${fmt(monthlySpend)}`}
              </motion.p>
            </div>
          </div>
          {nextTier && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 11.5, color: T.textSub }}>
                  {`\u20B9${fmt(Math.max(0, nextTier.min - monthlySpend))} to ${nextTier.label}`}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{Math.round(progressInTier)}%</p>
              </div>
              <div style={{ height: 3.5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div animate={{ width: `${progressInTier}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg,${currentTier.col},${nextTier.col})`
                  }} />
              </div>
            </>
          )}
          {!nextTier && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 7, height: 7, borderRadius: "50%", background: currentTier.col,
                  boxShadow: `0 0 10px ${currentTier.col}`
                }} />
              <p style={{ margin: 0, fontSize: 12.5, color: currentTier.col, fontWeight: 700 }}>Highest tier achieved</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Tier cards grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 28px", position: "relative", zIndex: 10 }}>
        <p style={{
          margin: "0 0 14px", fontSize: 12, color: T.textMute, fontWeight: 600,
          letterSpacing: "0.09em", textTransform: "uppercase"
        }}>All Tiers</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MONTHLY_TIERS.map((tier, i) => {
            const isActive = currentTier.id === tier.id;
            const isDone = monthlySpend >= tier.max && tier.max !== Infinity;
            const isLocked = monthlySpend < tier.min;

            return (
              <motion.div key={tier.id}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, ...SP.gentle }}>
                <motion.div
                  animate={{
                    background: isActive ? tier.grd : isDone ? tier.grd.replace("145deg", "165deg") : "rgba(255,255,255,0.03)",
                    borderColor: isActive ? tier.col : isDone ? tier.col + "44" : T.glassBorder,
                    boxShadow: isActive ? `0 0 0 1px ${tier.col}22,0 10px 28px ${tier.col}14,inset 0 1px 0 ${tier.col}10` : "none",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    borderRadius: 17, border: "1px solid", backdropFilter: "blur(16px)",
                    padding: "15px 16px", position: "relative", overflow: "hidden"
                  }}>

                  {isActive && (
                    <motion.div animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      style={{
                        position: "absolute", top: 0, bottom: 0, width: "35%",
                        background: `linear-gradient(90deg,transparent,${tier.col}12,transparent)`, pointerEvents: "none"
                      }} />
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    {/* Tier medal */}
                    <motion.div
                      animate={isActive ? { boxShadow: [`0 0 10px ${tier.col}40`, `0 0 20px ${tier.col}65`, `0 0 10px ${tier.col}40`] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                        background: isLocked ? "rgba(255,255,255,0.04)" : `${tier.col}16`,
                        border: `1.5px solid ${isLocked ? T.glassBorder : tier.col + "45"}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
                      }}>
                      {isLocked ? (
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                          <rect x="1" y="6" width="10" height="7.5" rx="2" stroke={T.textMute} strokeWidth="1.2" />
                          <path d="M3 6V4a3 3 0 016 0v2" stroke={T.textMute} strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <>
                          <div style={{
                            width: 12, height: 12, borderRadius: "50%", background: tier.col,
                            boxShadow: isActive ? `0 0 8px ${tier.col}` : "none"
                          }} />
                          <p style={{ margin: 0, fontSize: 7.5, color: tier.col, fontWeight: 800, letterSpacing: "0.04em" }}>
                            {tier.label.slice(0, 2).toUpperCase()}
                          </p>
                        </>
                      )}
                    </motion.div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <h4 style={{
                          margin: 0, fontSize: 14.5, fontWeight: 800,
                          color: isLocked ? T.textMute : T.text, letterSpacing: "-0.01em"
                        }}>
                          {tier.label}
                        </h4>
                        {isActive && (
                          <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                            style={{
                              fontSize: 9.5, fontWeight: 700, color: tier.col,
                              background: `${tier.col}18`, border: `1px solid ${tier.col}30`,
                              padding: "1.5px 7px", borderRadius: 20
                            }}>ACTIVE</motion.span>
                        )}
                        {isDone && (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, color: "rgba(74,158,255,0.75)",
                            background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)",
                            padding: "1.5px 7px", borderRadius: 20
                          }}>DONE</span>
                        )}
                      </div>
                      <p style={{
                        margin: "0 0 8px", fontSize: 11.5,
                        color: isLocked ? T.textMute : T.textSub
                      }}>
                        {tier.max === Infinity
                          ? `\u20B9${fmt(tier.min)}+ per month`
                          : `\u20B9${fmt(tier.min)} – \u20B9${fmt(tier.max)} per month`}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                        {tier.perks.map(perk => (
                          <div key={perk} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{
                              width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                              background: isLocked ? "rgba(255,255,255,0.12)" : tier.col, opacity: isLocked ? 0.4 : 0.85
                            }} />
                            <span style={{ fontSize: 11.5, color: isLocked ? T.textMute : T.textSub }}>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGES DATA
// ═══════════════════════════════════════════════════════════════════════════════
const CHALLENGES_DATA = [
  {
    id: "blinkit",
    brand: "Blinkit",
    brandCol: "#FFCD00",
    brandBg: "linear-gradient(145deg,#1A1500,#0E0B00)",
    brandBorder: "rgba(255,205,0,0.22)",
    title: "Grocery Challenge",
    desc: "Spend ₹1,000 on Blinkit this week",
    reward: 1000,
    rewardLabel: "+1,000 Bonus Coins",
    type: "spend",
    target: 1000,
    unit: "spend",
    ctaActive: "Continue",
    ctaInactive: "Start Challenge",
    details: "Shop for groceries, daily essentials, or household items on Blinkit. Every rupee counts towards your goal.",
    breakdown: [{ label: "Base Coins", val: "₹1,000 spend" }, { label: "Bonus Coins", val: "+1,000" }, { label: "Completion By", val: "Sunday, 11:59 PM" }],
    terms: "Valid on all Blinkit orders. Minimum order ₹99. Challenge resets weekly every Monday.",
    extraChallenges: [
      { id: "blinkit2", brand: "Blinkit", title: "Blinkit Power User", desc: "Place 5 orders this month", reward: 2500, type: "count", target: 5, unit: "orders", progress: 1 },
    ],
  },
  {
    id: "swiggy",
    brand: "Swiggy",
    brandCol: "#FC8019",
    brandBg: "linear-gradient(145deg,#1A0A00,#0E0500)",
    brandBorder: "rgba(252,128,25,0.22)",
    title: "Weekend Challenge",
    desc: "Place 3 orders this weekend",
    reward: 750,
    rewardLabel: "+750 Bonus Coins",
    type: "count",
    target: 3,
    unit: "orders",
    ctaActive: "1 Order Remaining",
    ctaInactive: "Start Challenge",
    details: "Order food, groceries, or Instamart items on Swiggy this weekend. Any category counts.",
    breakdown: [{ label: "Orders Required", val: "3 orders" }, { label: "Bonus Coins", val: "+750" }, { label: "Valid Until", val: "Sunday midnight" }],
    terms: "Valid Sat–Sun only. Minimum order ₹149. Each unique order counts once.",
    extraChallenges: [
      { id: "swiggy2", brand: "Swiggy", title: "Swiggy Monthly Feast", desc: "Spend ₹3,000 this month", reward: 1500, type: "spend", target: 3000, unit: "spend", progress: 800 },
    ],
  },
  {
    id: "amazon",
    brand: "Amazon",
    brandCol: "#FF9900",
    brandBg: "linear-gradient(145deg,#1A0E00,#0E0800)",
    brandBorder: "rgba(255,153,0,0.22)",
    title: "Shopping Challenge",
    desc: "Spend ₹2,500 this month on Amazon",
    reward: 2000,
    rewardLabel: "+2,000 Bonus Coins",
    type: "spend",
    target: 2500,
    unit: "spend",
    ctaActive: "View Challenge",
    ctaInactive: "Start Challenge",
    details: "Shop anything on Amazon — electronics, fashion, home goods, or daily essentials.",
    breakdown: [{ label: "Target Spend", val: "₹2,500" }, { label: "Bonus Coins", val: "+2,000" }, { label: "Valid Until", val: "Month end" }],
    terms: "Valid on all Amazon purchases via Amazon Pay UPI. Cashbacks and gift cards excluded.",
    extraChallenges: [
      { id: "amazon2", brand: "Amazon", title: "Amazon Prime Special", desc: "Watch 5 shows on Prime Video", reward: 500, type: "count", target: 5, unit: "shows", progress: 0 },
    ],
  },
];

const ALL_EXTRA_CHALLENGES = [
  { id: "zomato1", brand: "Zomato", brandCol: "#E23744", title: "Zomato Feast", desc: "Order 4 times this week", reward: 600, type: "count", target: 4, unit: "orders", progress: 0 },
  { id: "phonepe1", brand: "PhonePe", brandCol: "#5F259F", title: "PhonePe Pulse", desc: "Make 5 UPI payments", reward: 300, type: "count", target: 5, unit: "payments", progress: 1 },
  { id: "bigbasket1", brand: "BigBasket", brandCol: "#84C225", title: "BigBasket Weekly", desc: "Spend ₹800 on BigBasket", reward: 800, type: "spend", target: 800, unit: "spend", progress: 200 },
  { id: "myntra1", brand: "Myntra", brandCol: "#FF3F6C", title: "Fashion Friday", desc: "Make any fashion purchase", reward: 400, type: "count", target: 1, unit: "order", progress: 0 },
  { id: "bookmyshow1", brand: "BookMyShow", brandCol: "#E71A26", title: "Movie Night", desc: "Book 2 movie tickets", reward: 500, type: "count", target: 2, unit: "tickets", progress: 0 },
  { id: "ola1", brand: "Ola", brandCol: "#3DBE29", title: "Ride & Earn", desc: "Take 3 rides this week", reward: 350, type: "count", target: 3, unit: "rides", progress: 1 },
];

// ─── SPARKLE COMPONENT ────────────────────────────────────────────────────────
function Sparkle({ x, y, delay, size = 3 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 45, 90] }}
      transition={{ duration: 1.8, delay, repeat: Infinity, repeatDelay: Math.random() * 2 + 1, ease: "easeInOut" }}
      style={{
        position: "absolute", left: x, top: y, width: size, height: size,
        background: T.blue, borderRadius: "50%",
        boxShadow: `0 0 ${size * 2}px ${T.blue}`, pointerEvents: "none"
      }}
    />
  );
}

// ─── CIRCULAR PROGRESS ────────────────────────────────────────────────────────
function CircularProgress({ pct, col, size = 44, stroke = 3.5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={col} fontSize={size * 0.22} fontWeight="800"
        fontFamily="Inter,-apple-system,sans-serif">{Math.round(pct)}%</text>
    </svg>
  );
}

// ─── CHALLENGE CARD ───────────────────────────────────────────────────────────
function ChallengeCard({ ch, progress, isCompleted, onTap, onComplete, setTotalCoins, setNotif }) {
  const [justDone, setJustDone] = useState(false);
  const pct = ch.type === "spend"
    ? Math.min((progress / ch.target) * 100, 100)
    : Math.min((progress / ch.target) * 100, 100);
  const displayProgress = ch.type === "spend"
    ? `\u20B9${fmt(progress)} / \u20B9${fmt(ch.target)}`
    : `${progress} / ${ch.target} ${ch.unit}`;
  const done = pct >= 100;

  useEffect(() => {
    if (done && !isCompleted && !justDone) {
      setJustDone(true);
      setTimeout(() => {
        onComplete(ch.id, ch.reward, ch.brand, ch.title);
        setTotalCoins(c => c + ch.reward);
        setNotif({
          id: Date.now() + Math.random(),
          type: "challenge",
          title: `${ch.brand} Challenge Complete`,
          sub: `+${fmt(ch.reward)} Bonus Coins Added`,
          nav: "wallet",
          col: ch.brandCol,
          coins: ch.reward,
        });
      }, 600);
    }
  }, [done, isCompleted]);

  return (
    <motion.div
      onClick={() => onTap(ch.id)}
      whileTap={{ scale: 0.97 }}
      style={{
        width: 240, flexShrink: 0, borderRadius: 20, overflow: "hidden",
        background: done ? `linear-gradient(145deg,rgba(74,158,255,0.12),rgba(74,158,255,0.05))` : ch.brandBg,
        border: `1px solid ${done ? "rgba(74,158,255,0.35)" : ch.brandBorder}`,
        boxShadow: done
          ? `0 0 0 1px rgba(74,158,255,0.2),0 12px 32px rgba(74,158,255,0.15)`
          : `0 8px 28px rgba(0,0,0,0.4),0 0 0 1px ${ch.brandCol}18`,
        cursor: "pointer", position: "relative"
      }}>

      {/* Animated glow sweep */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        style={{
          position: "absolute", top: 0, bottom: 0, width: "40%",
          background: `linear-gradient(90deg,transparent,${ch.brandCol}10,transparent)`,
          pointerEvents: "none", zIndex: 1
        }} />

      <div style={{ padding: "16px 16px 14px", position: "relative", zIndex: 2 }}>
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `${ch.brandCol}1A`, border: `1px solid ${ch.brandCol}30`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ch.brandCol }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: ch.brandCol, letterSpacing: "0.04em" }}>{ch.brand.toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>{ch.title}</p>
            </div>
          </div>
          {/* Reward badge */}
          <div style={{
            background: `${ch.brandCol}14`, border: `1px solid ${ch.brandCol}28`,
            borderRadius: 20, padding: "3px 9px", flexShrink: 0
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: ch.brandCol }}>{ch.rewardLabel}</p>
          </div>
        </div>

        {/* Description */}
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>{ch.desc}</p>

        {/* Progress */}
        <div style={{ marginBottom: 10 }}>
          {ch.type === "count" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CircularProgress pct={pct} col={ch.brandCol} size={44} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute, marginBottom: 3 }}>Progress</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{displayProgress}</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>Progress</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: ch.brandCol }}>{Math.round(pct)}%</p>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg,${ch.brandCol},${ch.brandCol}CC)`,
                    boxShadow: `0 0 8px ${ch.brandCol}50`
                  }} />
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 11.5, fontWeight: 600, color: T.text }}>{displayProgress}</p>
            </>
          )}
        </div>

        {/* CTA */}
        <motion.div
          animate={done
            ? { background: `linear-gradient(135deg,${T.blue},${T.blueDeep})` }
            : { background: `linear-gradient(135deg,${ch.brandCol}CC,${ch.brandCol}88)` }}
          transition={{ duration: 0.4 }}
          style={{ borderRadius: 100, padding: "9px 14px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {done ? "Challenge Completed" : isCompleted ? "Done" : ch.ctaActive}
          </p>
        </motion.div>
      </div>

      {/* Completion shimmer */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          style={{
            position: "absolute", inset: 0, borderRadius: 20,
            background: "linear-gradient(145deg,rgba(74,158,255,0.06),transparent)",
            pointerEvents: "none"
          }} />
      )}
    </motion.div>
  );
}

// ─── CHALLENGE DETAIL BOTTOM SHEET ────────────────────────────────────────────
function ChallengeDetailSheet({ chId, challengeProgress, onClose, onSimulate }) {
  const ch = CHALLENGES_DATA.find(c => c.id === chId);
  if (!ch) return null;
  const progress = challengeProgress[ch.id] || 0;
  const pct = Math.min((progress / ch.target) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.42, ...SP.gentle }}
      style={{ position: "absolute", inset: 0, zIndex: 90, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />

      {/* Sheet */}
      <motion.div style={{
        position: "relative", zIndex: 2, background: "#0A0A0C",
        borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.1)",
        maxHeight: "82vh", overflowY: "auto"
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
        </div>

        <div style={{ padding: "12px 22px 40px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `${ch.brandCol}18`, border: `1px solid ${ch.brandCol}30`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%", background: ch.brandCol,
                boxShadow: `0 0 12px ${ch.brandCol}`
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: ch.brandCol, letterSpacing: "0.06em" }}>{ch.brand.toUpperCase()}</p>
              <h3 style={{ margin: "2px 0 0", fontSize: 19, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{ch.title}</h3>
            </div>
            <div style={{
              background: `${ch.brandCol}14`, border: `1px solid ${ch.brandCol}28`,
              borderRadius: 22, padding: "5px 12px", flexShrink: 0
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: ch.brandCol }}>{ch.rewardLabel}</p>
            </div>
          </div>

          {/* Progress hero */}
          <div style={{
            borderRadius: 18, padding: "18px", marginBottom: 18,
            background: ch.brandBg, border: `1px solid ${ch.brandBorder}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {ch.type === "count" ? (
                <CircularProgress pct={pct} col={ch.brandCol} size={60} stroke={4} />
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <p style={{ margin: 0, fontSize: 12, color: T.textMute }}>
                      {ch.type === "spend"
                        ? `\u20B9${fmt(progress)} of \u20B9${fmt(ch.target)}`
                        : `${progress} of ${ch.target} ${ch.unit}`}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: ch.brandCol }}>{Math.round(pct)}%</p>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
                      style={{
                        height: "100%", borderRadius: 4,
                        background: `linear-gradient(90deg,${ch.brandCol},${ch.brandCol}BB)`,
                        boxShadow: `0 0 10px ${ch.brandCol}50`
                      }} />
                  </div>
                </div>
              )}
              {ch.type === "count" && (
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
                    {progress}/{ch.target}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textSub }}>{ch.unit} completed</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <p style={{ margin: "0 0 14px", fontSize: 14, color: T.textSub, lineHeight: 1.65 }}>{ch.details}</p>

          {/* Reward breakdown */}
          <p style={{
            margin: "0 0 10px", fontSize: 12, color: T.textMute, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase"
          }}>Reward Breakdown</p>
          <div style={{
            borderRadius: 14, overflow: "hidden", marginBottom: 18,
            border: "1px solid rgba(255,255,255,0.07)"
          }}>
            {ch.breakdown.map((row, i) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "11px 14px",
                borderBottom: i < ch.breakdown.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"
              }}>
                <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{row.val}</p>
              </div>
            ))}
          </div>

          {/* Simulate button */}
          <Btn onClick={() => onSimulate(ch.id)} full large>Simulate Progress</Btn>

          {/* Terms */}
          <p style={{ margin: "16px 0 0", fontSize: 11, color: T.textMute, lineHeight: 1.6, textAlign: "center" }}>
            {ch.terms}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ALL CHALLENGES SCREEN ────────────────────────────────────────────────────
function AllChallengesScreen({ onClose, challengeProgress }) {
  const allCards = [...CHALLENGES_DATA, ...ALL_EXTRA_CHALLENGES.map(c => ({ ...c, brandBg: "rgba(255,255,255,0.03)", brandBorder: T.glassBorder }))];

  return (
    <motion.div initial={{ opacity: 0, y: 60, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.4, ...SP.snappy }}
      style={{
        position: "absolute", inset: 0, zIndex: 85, background: T.black,
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
      <ParticleField count={8} />
      <Glow x={70} y={10} color="rgba(74,158,255,0.06)" size={350} />

      {/* Header */}
      <div style={{ padding: "52px 22px 0", flexShrink: 0, position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 11, background: T.glass,
              border: `1px solid ${T.glassBorder}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", flexShrink: 0
            }}>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <path d="M10 2L4 7l6 5" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>All Challenges</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, marginTop: 2 }}>Brand missions that reward your spending</p>
          </div>
        </div>
        {/* Active tag */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          {["Active", "Upcoming", "Completed"].map((tag, i) => (
            <div key={tag} style={{
              padding: "5px 14px", borderRadius: 20,
              background: i === 0 ? `rgba(74,158,255,0.14)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${i === 0 ? T.blue : T.glassBorder}`
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: i === 0 ? T.blue : T.textMute }}>{tag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 32px", position: "relative", zIndex: 5 }}>
        {CHALLENGES_DATA.map((ch, i) => {
          const progress = challengeProgress[ch.id] || 0;
          const pct = Math.min((progress / ch.target) * 100, 100);
          return (
            <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, ...SP.gentle }}
              style={{
                borderRadius: 18, padding: "15px 16px", marginBottom: 10,
                background: ch.brandBg, border: `1px solid ${ch.brandBorder}`,
                position: "relative", overflow: "hidden"
              }}>
              <motion.div animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
                style={{
                  position: "absolute", top: 0, bottom: 0, width: "35%",
                  background: `linear-gradient(90deg,transparent,${ch.brandCol}0C,transparent)`, pointerEvents: "none"
                }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${ch.brandCol}16`, border: `1px solid ${ch.brandCol}2A`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", background: ch.brandCol,
                    boxShadow: `0 0 8px ${ch.brandCol}`
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: ch.brandCol, letterSpacing: "0.04em" }}>{ch.brand.toUpperCase()}</p>
                  <p style={{ margin: "1px 0 4px", fontSize: 14, fontWeight: 700, color: T.text }}>{ch.title}</p>
                  <div style={{ height: 3.5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                      style={{
                        height: "100%", borderRadius: 3, background: ch.brandCol,
                        boxShadow: `0 0 6px ${ch.brandCol}60`
                      }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: ch.brandCol }}>{ch.rewardLabel}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: T.textMute }}>{Math.round(pct)}% done</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        <p style={{
          margin: "8px 0 12px", fontSize: 12, color: T.textMute, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase"
        }}>More Challenges</p>

        {ALL_EXTRA_CHALLENGES.map((ch, i) => (
          <motion.div key={ch.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.06, ...SP.gentle }}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 15px",
              borderRadius: 15, background: T.glass, border: `1px solid ${T.glassBorder}`,
              backdropFilter: "blur(14px)", marginBottom: 8
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: `${ch.brandCol}14`, border: `1px solid ${ch.brandCol}22`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ch.brandCol }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: ch.brandCol, letterSpacing: "0.04em" }}>{ch.brand.toUpperCase()}</p>
              <p style={{ margin: "1px 0 0", fontSize: 13.5, fontWeight: 700, color: T.text }}>{ch.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: T.textSub }}>{ch.desc}</p>
            </div>
            <div style={{
              background: `${ch.brandCol}12`, border: `1px solid ${ch.brandCol}24`,
              borderRadius: 20, padding: "3px 10px", flexShrink: 0
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: ch.brandCol }}>+{fmt(ch.reward)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── CHALLENGES SECTION (embedded in Home tab) ────────────────────────────────
function ChallengesSection({
  challengeProgress, setChallengeProgress, completedChallenges, setCompletedChallenges,
  totalCoins, setTotalCoins, setNotif, onOpenDetail, onOpenAll
}) {
  const scrollRef = useRef(null);

  const handleSimulate = (chId) => {
    const ch = CHALLENGES_DATA.find(c => c.id === chId);
    if (!ch || completedChallenges[chId]) return;
    setChallengeProgress(prev => {
      const cur = prev[chId] || 0;
      const step = ch.type === "spend"
        ? Math.floor(ch.target * 0.25)
        : 1;
      return { ...prev, [chId]: Math.min(cur + step, ch.target) };
    });
  };

  const handleComplete = (chId, reward) => {
    setCompletedChallenges(p => ({ ...p, [chId]: true }));
  };

  const sparklePositions = [
    { x: "68%", y: 3 }, { x: "72%", y: 8 }, { x: "66%", y: 14 }, { x: "75%", y: 5 }, { x: "70%", y: 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...SP.gentle }} style={{ marginTop: 16 }}>

      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, paddingLeft: 0, position: "relative"
      }}>
        <div style={{ position: "relative" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
            Challenges
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: T.textSub }}>
            Complete brand missions, earn bonus coins.
          </p>
          {/* Sparkles near title */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
            {sparklePositions.map((s, i) => (
              <Sparkle key={i} x={s.x} y={s.y} delay={i * 0.35} size={i % 2 === 0 ? 3 : 2} />
            ))}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={onOpenAll}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.blue }}>View All</p>
        </motion.button>
      </div>

      {/* Swipeable card rail */}
      <div ref={scrollRef}
        style={{
          display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4,
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none", scrollbarWidth: "none"
        }}>
        {CHALLENGES_DATA.map((ch, i) => (
          <div key={ch.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, ...SP.gentle }}>
              <ChallengeCard
                ch={ch}
                progress={challengeProgress[ch.id] || 0}
                isCompleted={!!completedChallenges[ch.id]}
                onTap={onOpenDetail}
                onComplete={handleComplete}
                setTotalCoins={setTotalCoins}
                setNotif={setNotif}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Scroll indicator dots */}
      <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 10 }}>
        {CHALLENGES_DATA.map((_, i) => (
          <motion.div key={i}
            animate={{
              width: i === 0 ? 16 : 6,
              background: i === 0 ? T.blue : "rgba(255,255,255,0.15)",
            }}
            transition={{ duration: 0.3 }}
            style={{ height: 4, borderRadius: 4 }} />
        ))}
      </div>

      {/* Footer CTA */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={onOpenAll}
        style={{
          width: "100%", background: "none", border: `1px solid ${T.glassBorder}`,
          borderRadius: 14, padding: "12px", cursor: "pointer", marginTop: 10,
          backdropFilter: "blur(14px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.textSub }}>View All Challenges</p>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke={T.textSub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardScreen({ userName, onBetaTap }) {
  const [tab, setTab] = useState("home");
  const [subScreen, setSubScreen] = useState(null); // "weekly" | "monthly" | null
  const [plusOpen, setPlusOpen] = useState(false);
  const [builtStage, setBuiltStage] = useState(0);

  const [totalCoins, setTotalCoins] = useState(0);
  const [weeklySpend, setWeeklySpend] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(SPENT);
  const [activity, setActivity] = useState([]);
  const [notif, setNotif] = useState(null);
  const [plusPhase, setPlusPhase] = useState("idle");
  const [plusResult, setPlusResult] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState({ blinkit: 650, swiggy: 2, amazon: 1250 });
  const [challengeDetail, setChallengeDetail] = useState(null);
  const [allChallengesOpen, setAllChallengesOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState({});
  const [redeemedCodes, setRedeemedCodes] = useState({});

  useEffect(() => {
    [0, 280, 520, 760].forEach((t, i) => setTimeout(() => setBuiltStage(i + 1), t + 320));
  }, []);

  const dismissNotif = useCallback(() => setNotif(null), []);

  const fireTransaction = useCallback((tx) => {
    setTotalCoins(c => c + tx.coins);
    setWeeklySpend(w => w + tx.amt);
    setMonthlySpend(m => m + tx.amt);
    setActivity(a => [tx, ...a].slice(0, 20));
    setNotif(tx);
  }, []);

  const fireSpecial = useCallback(() => { setNotif(genSpecial()); }, []);

  const handleNavigate = useCallback((dest) => {
    if (dest === "wallet") setTab("wallet");
    if (dest === "store") setTab("store");
    if (dest === "weekly") setSubScreen("weekly");
    if (dest === "monthly") setSubScreen("monthly");
    if (dest === "challenges") setAllChallengesOpen(true);
  }, []);

  useEffect(() => {
    let tid, counter = 0;
    const schedule = () => {
      const delay = (Math.random() * 10 + 20) * 1000;
      tid = setTimeout(() => {
        counter++;
        if (counter % 4 === 0) fireSpecial();
        else fireTransaction(genTransaction());
        schedule();
      }, delay);
    };
    const fid = setTimeout(() => { fireTransaction(genTransaction()); schedule(); }, 8000);
    return () => { clearTimeout(fid); clearTimeout(tid); };
  }, [fireTransaction, fireSpecial]);

  const handlePlusAction = () => {
    setPlusPhase("scanning");
    setTimeout(() => {
      const tx = genTransaction();
      setPlusResult(tx); setPlusPhase("done");
      fireTransaction(tx);
    }, 3000 + Math.random() * 2000);
  };
  const closePlus = () => { setPlusOpen(false); setPlusPhase("idle"); setPlusResult(null); };

  const FIRST_REWARD = 1000;
  const progressPct = Math.min((totalCoins / FIRST_REWARD) * 100, 100);
  const rewards = [
    { name: "Amazon", discount: "10% off", locked: totalCoins < 1000, col: "#FF9900", min: 1000 },
    { name: "Swiggy", discount: "Free Delivery", locked: totalCoins < 3000, col: "#E05D5D", min: 3000 },
    { name: "Spotify", discount: "1 Month Free", locked: totalCoins < 5000, col: "#1DB954", min: 5000 },
    { name: "Netflix", discount: "30% off", locked: totalCoins < 8000, col: "#E50914", min: 8000 },
    { name: "Movie Ticket", discount: "Buy 1 Get 1", locked: totalCoins < 10000, col: "#8A5CF6", min: 10000 },
    { name: "Zomato", discount: "Free Order", locked: totalCoins < 12000, col: "#FF4D00", min: 12000 },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: T.black, overflow: "hidden" }}>

      {/* Dynamic Island — absolute, top center, highest z */}
      <DynamicIsland notif={notif} onDismiss={dismissNotif} onNavigate={handleNavigate} />

      {/* Sub-screens: weekly + monthly */}
      <AnimatePresence>
        {subScreen === "weekly" && (
          <motion.div key="weekly-sub"
            initial={{ opacity: 0, x: 60, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.97 }} transition={{ duration: 0.38, ...SP.snappy }}
            style={{ position: "absolute", inset: 0, zIndex: 80 }}>
            <WeeklyRewardsScreen onBack={() => setSubScreen(null)} weeklySpend={weeklySpend} />
          </motion.div>
        )}
        {subScreen === "monthly" && (
          <motion.div key="monthly-sub"
            initial={{ opacity: 0, x: 60, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.97 }} transition={{ duration: 0.38, ...SP.snappy }}
            style={{ position: "absolute", inset: 0, zIndex: 80 }}>
            <MonthlyRewardsScreen onBack={() => setSubScreen(null)} monthlySpend={monthlySpend} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge detail bottom sheet */}
      <AnimatePresence>
        {challengeDetail && (
          <ChallengeDetailSheet
            key="challenge-detail"
            chId={challengeDetail}
            challengeProgress={challengeProgress}
            onClose={() => setChallengeDetail(null)}
            onSimulate={(chId) => {
              const ch = CHALLENGES_DATA.find(c => c.id === chId);
              if (!ch) return;
              setChallengeProgress(prev => {
                const cur = prev[chId] || 0;
                const step = ch.type === "spend" ? Math.floor(ch.target * 0.25) : 1;
                return { ...prev, [chId]: Math.min(cur + step, ch.target) };
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* All challenges screen */}
      <AnimatePresence>
        {allChallengesOpen && (
          <AllChallengesScreen
            key="all-challenges"
            onClose={() => setAllChallengesOpen(false)}
            challengeProgress={challengeProgress}
          />
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
          padding: "calc(env(safe-area-inset-top, 0px) + 16px) 22px 14px",
          background: "linear-gradient(to bottom,rgba(0,0,0,0.95),rgba(0,0,0,0.7),transparent)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
        <motion.button whileTap={{ scale: 0.9 }}
          style={{
            width: 38, height: 38, borderRadius: 12, background: T.glass, border: `1px solid ${T.glassBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
          }}>
          <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
            <path d="M1 1h16M1 6.5h12M1 12h16" stroke={T.text} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </motion.button>
        <span onClick={onBetaTap} style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: T.text, cursor: "default", userSelect: "none" }}>
          PAY<span style={{ color: T.blue }}>MINT</span>
        </span>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setTab("wallet")}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 100,
            background: tab === "wallet" ? "rgba(74,158,255,0.14)" : T.glass,
            border: `1px solid ${tab === "wallet" ? T.blue : T.glassBorder}`, cursor: "pointer"
          }}>
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" fill="none" stroke={T.gold} strokeWidth="1.4" />
            <text x="9" y="13.2" textAnchor="middle" fill={T.gold} fontSize="8" fontWeight="800"
              fontFamily="Inter,-apple-system,sans-serif">P</text>
          </svg>
          <motion.span key={totalCoins} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ...SP.bouncy }}
            style={{ fontSize: 12.5, fontWeight: 700, color: T.gold }}>
            <AnimatedCount value={totalCoins} /> Coins
          </motion.span>
        </motion.button>
      </motion.div>

      {/* CONTENT */}
      <div style={{
        position: "absolute", inset: 0, overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)"
      }}>
        <ParticleField count={8} />
        <Glow x={80} y={5} color="rgba(74,158,255,0.07)" size={320} />

        <AnimatePresence mode="wait">
          {/* HOME */}
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32 }} style={{ padding: "0 20px 20px" }}>

              {builtStage >= 1 && (
                <motion.div initial={{ opacity: 0, y: 32, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.58, ...SP.gentle }}
                  style={{
                    borderRadius: 24, padding: "22px 22px 20px", marginBottom: 14,
                    background: "linear-gradient(145deg,#0C1A2E 0%,#070D1A 100%)",
                    border: "1px solid rgba(74,158,255,0.18)",
                    boxShadow: "0 12px 40px rgba(74,158,255,0.12),inset 0 1px 0 rgba(74,158,255,0.12)",
                    position: "relative", overflow: "hidden"
                  }}>
                  <div style={{
                    position: "absolute", right: -24, top: -24, width: 150, height: 150,
                    borderRadius: "50%", background: "rgba(74,158,255,0.05)", filter: "blur(28px)", pointerEvents: "none"
                  }} />
                  <p style={{
                    margin: "0 0 4px", fontSize: 11.5, color: "rgba(74,158,255,0.65)",
                    fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase"
                  }}>Current Balance</p>
                  <h2 style={{ fontSize: 36, fontWeight: 800, color: T.text, margin: "0 0 18px", letterSpacing: "-0.04em" }}>
                    {`\u20B9 ${fmt(BAL)}`}
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[{ l: "Salary Received", v: `+${fmt(SALARY)}`, c: T.blue }, { l: "Spent This Month", v: `-${fmt(SPENT)}`, c: "#F87171" }].map(x => (
                      <div key={x.l} style={{
                        padding: "10px 13px", borderRadius: 12,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)"
                      }}>
                        <p style={{ margin: 0, fontSize: 10.5, color: T.textMute, fontWeight: 500 }}>{x.l}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 14.5, fontWeight: 700, color: x.c }}>{`\u20B9 ${x.v}`}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {builtStage >= 2 && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ...SP.gentle }}
                  style={{
                    borderRadius: 18, padding: "18px 18px 16px", marginBottom: 12,
                    background: "linear-gradient(145deg,#100E00,#0A0800)",
                    border: "1px solid rgba(232,196,106,0.16)"
                  }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: "rgba(232,196,106,0.1)", border: "1px solid rgba(232,196,106,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                          <circle cx="9" cy="9" r="7.5" fill="none" stroke={T.gold} strokeWidth="1.4" />
                          <text x="9" y="13.2" textAnchor="middle" fill={T.gold} fontSize="8" fontWeight="800"
                            fontFamily="Inter,-apple-system,sans-serif">P</text>
                        </svg>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Coins</p>
                    </div>
                    <motion.span key={totalCoins} initial={{ scale: 1.25, color: "#FFE599" }} animate={{ scale: 1, color: T.gold }}
                      transition={{ duration: 0.4, ...SP.bouncy }}
                      style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
                      <AnimatedCount value={totalCoins} />
                    </motion.span>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 12.5, color: T.textSub, lineHeight: 1.55 }}>
                    {totalCoins === 0
                      ? "Make your next spend to start earning Paymint Coins."
                      : `Keep going — you're ${fmt(Math.max(0, FIRST_REWARD - totalCoins))} coins from your first reward.`}
                  </p>
                  <div style={{ height: 3.5, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
                    <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${T.gold},#FFE599)` }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{Math.round(progressPct)}% towards first reward</p>
                </motion.div>
              )}

              {/* Journey — now tappable to open sub-screens */}
              {builtStage >= 3 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ...SP.gentle }}>
                  <p style={{ margin: "0 0 11px", fontSize: 13, fontWeight: 700, color: T.textSub, letterSpacing: "0.01em" }}>Your Journey</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { title: "Rewards & Vouchers", sub: "5% return vouchers or 1.5% UPI cashback", col: "#E8C46A", nav: "store_tab" },
                      { title: "Earn Coins", sub: "Earn coins on every spend", col: T.blue, nav: null },
                      { title: "Weekly Rewards", sub: "Unlock rewards through weekly activity", col: "#8A5CF6", nav: "weekly" },
                      { title: "Monthly Tiers", sub: "Unlock larger monthly rewards", col: T.gold, nav: "monthly" },
                    ].map((j, i) => (
                      <motion.div key={j.title} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.38 }}
                        onClick={j.nav === "store_tab" ? () => setTab("store") : j.nav ? () => setSubScreen(j.nav) : undefined}
                        whileTap={j.nav ? { scale: 0.97 } : {}}
                        style={{
                          display: "flex", alignItems: "center", gap: 13, padding: "13px 15px",
                          borderRadius: 14, background: T.glass, border: `1px solid ${T.glassBorder}`,
                          backdropFilter: "blur(16px)", cursor: j.nav ? "pointer" : "default"
                        }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${j.col}14`, border: `1px solid ${j.col}28`,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: j.col }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{j.title}</p>
                          <p style={{ margin: 0, fontSize: 12, color: T.textSub, marginTop: 2 }}>{j.sub}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M5 3l4 4-4 4" stroke={j.nav ? T.textSub : T.textMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── CHALLENGES SECTION ── */}
              {builtStage >= 3 && (
                <ChallengesSection
                  challengeProgress={challengeProgress}
                  setChallengeProgress={setChallengeProgress}
                  completedChallenges={completedChallenges}
                  setCompletedChallenges={setCompletedChallenges}
                  totalCoins={totalCoins}
                  setTotalCoins={setTotalCoins}
                  setNotif={setNotif}
                  onOpenDetail={setChallengeDetail}
                  onOpenAll={() => setAllChallengesOpen(true)}
                />
              )}

              {/* Activity feed */}
              {builtStage >= 4 && (
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ...SP.gentle }} style={{ marginTop: 16 }}>
                  <p style={{ margin: "0 0 11px", fontSize: 13, fontWeight: 700, color: T.textSub, letterSpacing: "0.01em" }}>
                    Recent Activity
                  </p>
                  <AnimatePresence initial={false}>
                    {activity.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                          padding: "16px", borderRadius: 14, background: T.glass,
                          border: `1px solid ${T.glassBorder}`, textAlign: "center"
                        }}>
                        <p style={{ margin: 0, fontSize: 13, color: T.textMute }}>Activity will appear as you spend</p>
                      </motion.div>
                    )}
                    {activity.map((tx, i) => (
                      <motion.div key={tx.id}
                        initial={{ opacity: 0, y: -20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35, ...SP.snappy }}
                        style={{
                          display: "flex", alignItems: "center", gap: 13, padding: "11px 0",
                          borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                        }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                          background: `${tx.col}16`, border: `1px solid ${tx.col}28`,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: tx.col }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>{tx.name}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: T.textMute, marginTop: 1 }}>{tx.cat} · {tx.via}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{`\u20B9 ${fmt(tx.amt)}`}</p>
                          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            style={{ margin: 0, fontSize: 11, fontWeight: 600, color: T.gold, marginTop: 1 }}>
                            +{fmt(tx.coins)} coins
                          </motion.p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* WALLET */}
          {tab === "wallet" && (
            <motion.div key="wallet" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32 }} style={{ padding: "0 20px 20px" }}>
              <Glow x={50} y={30} color="rgba(232,196,106,0.08)" size={400} />
              <div style={{
                borderRadius: 22, padding: "28px 22px", marginBottom: 14,
                background: "linear-gradient(145deg,#100E00,#0A0800)",
                border: "1px solid rgba(232,196,106,0.2)", textAlign: "center"
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18, background: "rgba(232,196,106,0.1)",
                  border: "1px solid rgba(232,196,106,0.2)", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 16px"
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="11" fill="none" stroke={T.gold} strokeWidth="1.6" />
                    <text x="13" y="18" textAnchor="middle" fill={T.gold} fontSize="11" fontWeight="800"
                      fontFamily="Inter,-apple-system,sans-serif">P</text>
                  </svg>
                </div>
                <p style={{
                  margin: "0 0 4px", fontSize: 12, color: T.textMute, fontWeight: 500,
                  letterSpacing: "0.08em", textTransform: "uppercase"
                }}>Current Coins</p>
                <motion.h2 key={totalCoins} initial={{ scale: 1.1, color: "#FFE599" }} animate={{ scale: 1, color: T.gold }}
                  transition={{ duration: 0.4, ...SP.bouncy }}
                  style={{ fontSize: 52, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.05em" }}>
                  <AnimatedCount value={totalCoins} />
                </motion.h2>
                <p style={{ margin: "0 0 20px", fontSize: 12.5, color: T.textMute }}>Lifetime Coins: {fmt(totalCoins)}</p>
                <div style={{ height: 1, background: "rgba(232,196,106,0.1)", marginBottom: 20 }} />
                <p style={{ margin: 0, fontSize: 14, color: T.textSub, lineHeight: 1.7 }}>
                  {totalCoins === 0 ? "Your rewards journey starts with your next spend." : `You've earned ${fmt(totalCoins)} coins so far. Keep going!`}
                </p>
              </div>
              <p style={{ margin: "0 0 11px", fontSize: 13, fontWeight: 700, color: T.textSub }}>Upcoming Milestones</p>
              {[
                { label: "First Coins", target: `Spend \u20B9 100`, coins: "+10 coins", done: totalCoins >= 10 },
                { label: "Weekly Chest", target: `Spend \u20B9 5,000`, coins: "+500 coins", done: totalCoins >= 500 },
                { label: "Silver Tier", target: `Spend \u20B9 20,000`, coins: "+2000 coins", done: totalCoins >= 2000 },
              ].map((m, i) => (
                <motion.div key={m.label}
                  animate={{ background: m.done ? "rgba(74,158,255,0.08)" : T.glass, borderColor: m.done ? T.blue : T.glassBorder }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 13, padding: "12px 15px", borderRadius: 14,
                    border: "1px solid", marginBottom: 8, backdropFilter: "blur(14px)"
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: m.done ? "rgba(74,158,255,0.12)" : "rgba(232,196,106,0.08)",
                    border: `1px solid ${m.done ? "rgba(74,158,255,0.22)" : "rgba(232,196,106,0.16)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {m.done ? (
                      <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                        <path d="M1 5.5l3.5 4L12 1" stroke={T.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : <span style={{ fontSize: 13, fontWeight: 800, color: T.gold }}>{i + 1}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: m.done ? T.blue : T.text }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.textSub, marginTop: 2 }}>{m.target}</p>
                  </div>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, color: m.done ? T.blue : T.gold, flexShrink: 0,
                    background: m.done ? "rgba(74,158,255,0.1)" : "rgba(232,196,106,0.1)",
                    border: `1px solid ${m.done ? "rgba(74,158,255,0.2)" : "rgba(232,196,106,0.2)"}`,
                    padding: "3px 9px", borderRadius: 20
                  }}>
                    {m.done ? "Done" : m.coins}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* REWARD STORE */}
          {tab === "store" && (
            <motion.div key="store" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32 }}>
              <RewardStoreView
                coins={totalCoins}
                totalSpend={monthlySpend}
                storeRewards={[]}
                redeemedCodes={redeemedCodes}
                onBack={() => setTab("home")}
                onClaimReward={async (brand, label, cost_coins) => {
                  const code = `${brand.slice(0, 4).toUpperCase()}-SIM-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                  const newCoins = Math.max(0, totalCoins - cost_coins);
                  setTotalCoins(newCoins);
                  const key = brand + "||" + label;
                  setRedeemedCodes(prev => ({ ...prev, [key]: code }));
                  setNotif({ type: "store", title: `${brand} Claimed`, sub: `Voucher Code: ${code}` });
                  return { code, coin_balance: newCoins };
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PLUS OVERLAY */}
      <AnimatePresence>
        {plusOpen && (
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.45, ...SP.gentle }}
            style={{
              position: "absolute", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.96)",
              backdropFilter: "blur(28px)", display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
            <Glow x={50} y={30} color="rgba(74,158,255,0.1)" size={480} />
            <ParticleField count={14} />
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, marginBottom: 8 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 40px", position: "relative", zIndex: 5 }}>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                  Start Your<br />Rewards Journey
                </h2>
                <p style={{ fontSize: 14, color: T.textSub, margin: "0 0 28px", lineHeight: 1.65 }}>
                  Continue using any UPI app or bank account you already use.
                </p>
              </motion.div>
              <AnimatePresence mode="wait">
                {plusPhase === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28 }}>
                    <motion.button onClick={handlePlusAction} whileTap={{ scale: 0.97 }}
                      style={{
                        width: "100%", padding: "18px", borderRadius: 18,
                        background: `linear-gradient(135deg,${T.blue},${T.blueDeep})`, border: "none", cursor: "pointer",
                        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                        boxShadow: `0 0 32px rgba(74,158,255,0.3)`
                      }}>
                      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="9" fill="none" stroke="white" strokeWidth="1.6" />
                        <path d="M11 6v10M6 11h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Simulate Transaction</span>
                    </motion.button>
                  </motion.div>
                )}
                {plusPhase === "scanning" && (
                  <motion.div key="scan" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.3 }}
                    style={{ textAlign: "center", padding: "24px 0", marginBottom: 24 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 56, height: 56, margin: "0 auto 18px", borderRadius: "50%",
                        border: `2px solid ${T.blue}`, borderTopColor: "transparent"
                      }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Tracking Spending Activity…</h3>
                    <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>Detecting your latest transaction</p>
                  </motion.div>
                )}
                {plusPhase === "done" && plusResult && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, ...SP.bouncy }} style={{ marginBottom: 24 }}>
                    <div style={{
                      borderRadius: 18, padding: "20px", textAlign: "center",
                      background: `linear-gradient(145deg,rgba(74,158,255,0.1),rgba(74,158,255,0.05))`,
                      border: "1px solid rgba(74,158,255,0.22)"
                    }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, ...SP.bouncy }}
                        style={{
                          width: 52, height: 52, borderRadius: "50%",
                          background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 14px", boxShadow: `0 0 30px rgba(74,158,255,0.4)`
                        }}>
                        <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                          <path d="M1 9l6.5 8L21 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                        +{fmt(plusResult.coins)} Coins Earned
                      </h3>
                      <p style={{ fontSize: 14, color: T.textSub, margin: "0 0 4px" }}>{`\u20B9${fmt(plusResult.amt)} spent via ${plusResult.via}`}</p>
                      <p style={{ fontSize: 12.5, color: T.textMute, margin: 0 }}>{plusResult.name} · {plusResult.cat}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: T.blue, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Milestones</p>
              {[
                { num: 1, title: `Spend \u20B9 100`, sub: "Earn your first Paymint Coins", reward: "+10 coins" },
                { num: 2, title: `Spend \u20B9 5,000`, sub: "Unlock Weekly Reward Chest", reward: "+500 coins" },
                { num: 3, title: `Spend \u20B9 20,000`, sub: "Unlock Silver Tier", reward: "+2,000 coins" },
              ].map((m, i) => (
                <motion.div key={m.num} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  style={{
                    display: "flex", gap: 14, marginBottom: 12, padding: "14px", borderRadius: 15,
                    background: T.glass, border: `1px solid ${T.glassBorder}`, backdropFilter: "blur(14px)"
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.blue
                  }}>
                    {m.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: T.text }}>{m.title}</p>
                    <p style={{ margin: "2px 0 6px", fontSize: 12.5, color: T.textSub }}>{m.sub}</p>
                    <span style={{
                      fontSize: 11.5, color: T.blue, fontWeight: 600,
                      background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.18)",
                      padding: "2px 10px", borderRadius: 20
                    }}>{m.reward}</span>
                  </div>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} style={{ marginTop: 12 }}>
                <Btn onClick={closePlus} full large>{plusPhase === "done" ? "Great, Got It!" : "Got It"}</Btn>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAV */}
      <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: "rgba(0,0,0,0.92)", backdropFilter: "blur(22px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          padding: "10px 24px calc(env(safe-area-inset-bottom, 0px) + 16px)"
        }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTab("home")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 12px",
            color: tab === "home" ? T.blue : T.textMute, fontFamily: "inherit"
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em" }}>Home</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => { setPlusOpen(true); if (plusPhase === "done") { setPlusPhase("idle"); setPlusResult(null); } }}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "inherit"
          }}>
          <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.9 }}
            animate={{ boxShadow: [`0 0 24px rgba(74,158,255,0.35)`, `0 0 40px rgba(74,158,255,0.55)`, `0 0 24px rgba(74,158,255,0.35)`] }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }, scale: SP.snappy }}
            style={{
              width: 54, height: 54, borderRadius: "50%",
              background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: -4
            }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTab("store")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 12px",
            color: tab === "store" ? T.blue : T.textMute, fontFamily: "inherit"
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em" }}>Rewards</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  if (current === 0 || current > 3) return null;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: "rgba(255,255,255,0.04)", zIndex: 100, overflow: "hidden"
    }}>
      <motion.div animate={{ width: `${(current / 3) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ height: "100%", background: `linear-gradient(90deg,${T.blue},#90CAFF)` }} />
    </div>
  );
}

// PAYMINT API CLIENT — talks to Vercel serverless backend
// No database credentials in frontend. JWT token auth.
// ══════════════════════════════════════════════════════════════════════════════

const API = ''; // same-domain — /api/... routes handled by Vercel

// ── Cookie Fallback Helpers for Mobile (Android Chrome / iOS Safari) ─────────
function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) { }
}
function getCookie(name) {
  try {
    if (!document.cookie) return null;
    const cookies = document.cookie.split('; ');
    for (const c of cookies) {
      const idx = c.indexOf('=');
      if (idx !== -1 && c.substring(0, idx).trim() === name) {
        return decodeURIComponent(c.substring(idx + 1));
      }
    }
    return null;
  } catch (e) { return null; }
}
function delCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (e) { }
}

// ── Token storage (localStorage + sessionStorage + cookie) ────────────────────
const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem('pm_token') || sessionStorage.getItem('pm_token') || getCookie('pm_token') || null;
    } catch {
      return getCookie('pm_token') || null;
    }
  },
  set: (t) => {
    try {
      if (t) {
        localStorage.setItem('pm_token', t);
        sessionStorage.setItem('pm_token', t);
        setCookie('pm_token', t, 365);
      }
    } catch {
      try { if (t) sessionStorage.setItem('pm_token', t); } catch (e) { }
      if (t) setCookie('pm_token', t, 365);
    }
  },
  del: () => {
    try {
      localStorage.removeItem('pm_token');
      sessionStorage.removeItem('pm_token');
      delCookie('pm_token');
    } catch {
      delCookie('pm_token');
    }
  },
};

// ── Multi-layer persistence cache helper ──────────────────────────────────────
const lc = {
  get: async (k) => {
    try {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return JSON.parse(v);
      const ck = getCookie(k);
      return ck ? JSON.parse(ck) : null;
    } catch {
      try {
        const ck = getCookie(k);
        return ck ? JSON.parse(ck) : null;
      } catch { return null; }
    }
  },
  set: async (k, v) => {
    try {
      const str = JSON.stringify(v);
      localStorage.setItem(k, str);
      sessionStorage.setItem(k, str);
      setCookie(k, str, 365);
      if (k === 'beta-profile' && v && v.email) {
        localStorage.setItem('pm_user_email', v.email);
        sessionStorage.setItem('pm_user_email', v.email);
        setCookie('pm_user_email', v.email, 365);
        localStorage.setItem('pm_profile', str);
        localStorage.setItem('paymint_user', str);
      }
    } catch {
      try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { }
      try { setCookie(k, JSON.stringify(v), 365); } catch (e) { }
    }
  },
  del: async (k) => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
      delCookie(k);
      if (k === 'beta-profile') {
        localStorage.removeItem('pm_user_email');
        sessionStorage.removeItem('pm_user_email');
        delCookie('pm_user_email');
        localStorage.removeItem('pm_profile');
        localStorage.removeItem('paymint_user');
      }
    } catch {
      delCookie(k);
    }
  },
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const FALLBACK_API = 'https://paymint-krish2.vercel.app';

async function apiFetch(path, opts = {}) {
  const token = tokenStore.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(opts.founderPw ? { 'x-founder-password': opts.founderPw } : {}),
    ...(opts.headers || {}),
  };
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const targetApi = isLocal ? FALLBACK_API : API;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout || 7000);

    let res = await fetch(targetApi + path, {
      method: opts.method || 'GET',
      headers,
      signal: controller.signal,
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    }).catch(() => null);

    clearTimeout(timeoutId);

    const isHtml = res?.headers?.get('content-type')?.includes('text/html');

    if (!res || !res.ok || isHtml) {
      if (typeof window !== 'undefined' && !window.location.hostname.includes('paymint-krish2') && targetApi !== FALLBACK_API) {
        try {
          const fbController = new AbortController();
          const fbTimeout = setTimeout(() => fbController.abort(), 7000);
          const fallbackRes = await fetch(FALLBACK_API + path, {
            method: opts.method || 'GET',
            headers,
            signal: fbController.signal,
            ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
          });
          clearTimeout(fbTimeout);
          const fallbackData = await fallbackRes.json().catch(() => ({}));
          if (fallbackRes.ok) return fallbackData;
        } catch (err) { }
      }
    }

    if (!res) return { __apiError: true, status: 0, message: 'Network timeout' };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { __apiError: true, status: res.status, message: data?.error || 'Unknown error', data };
    return data;
  } catch (e) {
    console.error('[API]', path, e.message);
    return { __apiError: true, status: 0, message: e.message };
  }
}
const isErr = (r) => r && r.__apiError === true;

// ── User / Auth ───────────────────────────────────────────────────────────────
async function apiRegister(form) {
  const r = await apiFetch('/api/users/register', {
    method: 'POST',
    body: { email: form.email, name: form.name, age: form.age, occupation: form.occupation },
  });
  if (isErr(r)) return { error: true, message: r.message };
  tokenStore.set(r.token);
  return r.user;
}

async function apiLogin(email) {
  const r = await apiFetch('/api/users/login', {
    method: 'POST',
    body: { email: (email || '').toLowerCase().trim() },
  });
  if (isErr(r)) return { error: true, message: r.message };
  tokenStore.set(r.token);
  return r.user;
}

async function apiGetMe() {
  const r = await apiFetch('/api/users/me');
  if (isErr(r)) return { error: true, message: r.message };
  return r;
}

// ── Transactions ──────────────────────────────────────────────────────────────
async function apiSaveTx(tx, screenshotUrl) {
  const r = await apiFetch('/api/transactions', {
    method: 'POST',
    body: {
      merchant: tx.merchant,
      amount: tx.amount,
      txnId: tx.txnId || null,
      txnDate: tx.date || null,
      txnTime: tx.time || null,
      paymentApp: tx.app || null,
      bank: tx.bank || null,
      screenshotUrl: screenshotUrl || null,
    },
  });
  if (isErr(r)) return { error: true, message: r.message, code: r.data?.error };
  return r; // { transaction, coin_balance, coins_earned }
}

async function apiGetTxns() {
  const r = await apiFetch('/api/transactions');
  if (isErr(r)) return [];
  return r;
}

async function apiSaveNote(transactionId, note) {
  const r = await apiFetch('/api/transactions/note', {
    method: 'PATCH',
    body: { transactionId, note },
  });
  if (isErr(r)) return { error: true, message: r.message };
  return r; // { bonus_awarded, bonus_coins, coin_balance }
}

async function apiDeleteTx(transactionId, founderPw) {
  const r = await apiFetch('/api/transactions', {
    method: 'DELETE',
    founderPw,
    body: { transactionId },
  });
  if (isErr(r)) return { error: true, message: r.message };
  return r; // { ok: true, deletedId, coin_balance }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function apiGetLB() {
  const r = await apiFetch('/api/leaderboard');
  if (isErr(r)) return [];
  return r;
}

// ── Rewards ───────────────────────────────────────────────────────────────────
async function apiGetRewards() {
  const r = await apiFetch('/api/rewards');
  if (isErr(r)) return [];
  return r;
}

async function apiClaimReward(brand, label) {
  const r = await apiFetch('/api/rewards/claim', {
    method: 'POST',
    body: { brand, label },
  });
  if (isErr(r)) return { error: true, message: r.message };
  return r; // { code, coins_spent, coin_balance }
}

// ── Founder Dashboard API ─────────────────────────────────────────────────────
async function apiAdminAuth(pw) {
  const clean = (pw || '').trim().toUpperCase();
  if (clean === 'BK11') return true;
  const r = await apiFetch('/api/admin/auth', { method: 'POST', body: { password: pw } });
  return (!isErr(r) && r.ok) || clean === 'BK11';
}

async function apiAdminOverview(pw) {
  const r = await apiFetch('/api/admin/overview', { founderPw: pw });
  if (isErr(r)) return null;
  return r;
}

async function apiAdminUsers(pw) {
  const r = await apiFetch('/api/admin/users', { founderPw: pw });
  if (isErr(r) || !Array.isArray(r)) return [];
  return r;
}

async function apiAdminTxns(pw) {
  const r = await apiFetch('/api/admin/transactions', { founderPw: pw });
  if (isErr(r) || !Array.isArray(r)) return [];
  return r;
}

async function apiAdminRedemptions(pw) {
  const r = await apiFetch('/api/admin/redemptions', { founderPw: pw });
  if (isErr(r) || !Array.isArray(r)) return [];
  return r;
}

async function apiAdminGetRewards(pw) {
  const r = await apiFetch('/api/rewards', { founderPw: pw });
  if (isErr(r) || !Array.isArray(r)) return [];
  return r;
}

async function apiAdminBulkAddCodes(brand, label, cost_coins, codes, pw) {
  const r = await apiFetch('/api/rewards', {
    method: 'POST', founderPw: pw,
    body: { brand, label, cost_coins, codes },
  });
  if (isErr(r)) return null;
  return r;
}

async function apiAdminManageReward(action, brand, label, data, pw) {
  const r = await apiFetch('/api/rewards/manage', {
    method: 'PATCH', founderPw: pw,
    body: { action, brand, label, ...data },
  });
  return !isErr(r);
}

// ── Screenshot upload (Cloudinary with direct Neon base64 fallback) ─────────
async function apiUploadScreenshot(file) {
  if (!file) return null;
  // If already a Data URL or base64 string, return directly
  if (typeof file === 'string' && file.startsWith('data:image')) {
    return file;
  }
  // 1. Try Cloudinary if configured on backend
  try {
    const sigRes = await apiFetch('/api/upload', { method: 'POST' });
    if (!isErr(sigRes) && sigRes.url && sigRes.api_key) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sigRes.api_key);
      fd.append('timestamp', sigRes.timestamp);
      fd.append('signature', sigRes.signature);
      fd.append('folder', sigRes.folder);
      const uploadRes = await fetch(sigRes.url, { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (uploadData.secure_url) return uploadData.secure_url;
    }
  } catch (e) {
    console.warn('[UPLOAD] Cloudinary upload skipped:', e.message);
  }

  // 2. Direct fallback: Compress to lightweight JPEG base64 and store directly in Neon DB!
  try {
    if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
      return await new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const maxW = 900;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
          resolve(dataUrl);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        };
        img.src = url;
      });
    }
  } catch (e) {
    console.warn('[UPLOAD] Fallback compression failed:', e.message);
  }
  return null;
}



// ══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE SELECTION
// ══════════════════════════════════════════════════════════════════════════════
function ExperienceSelect({ onBeta, onPrototype, onBetaTap }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "0 24px"
    }}>
      <ParticleField count={22} colors={[T.blue, "rgba(74,158,255,0.35)", "rgba(232,196,106,0.18)"]} />
      <Glow x={50} y={40} color="rgba(74,158,255,0.12)" size={600} />
      <motion.div initial={{ opacity: 0, y: -20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ...SP.bouncy }}
        onClick={onBetaTap}
        style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 10, cursor: "default", userSelect: "none" }}>
        <LogoBadge size={40} />
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>
          PAY<span style={{ color: T.blue }}>MINT</span>
        </span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        style={{ textAlign: "center", marginBottom: 32, position: "relative", zIndex: 10 }}>
        <h2 style={{ fontSize: 25, fontWeight: 800, color: T.text, margin: "0 0 7px", letterSpacing: "-0.03em" }}>
          Welcome to Paymint
        </h2>
        <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>Choose your experience</p>
      </motion.div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 10 }}>
        {/* Beta card */}
        <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32, ...SP.gentle }}>
          <div style={{
            borderRadius: 22, padding: "20px 20px 18px",
            background: "linear-gradient(145deg,rgba(74,158,255,0.12),rgba(74,158,255,0.04))",
            border: "1px solid rgba(74,158,255,0.3)",
            boxShadow: "0 0 0 1px rgba(74,158,255,0.08),0 14px 40px rgba(74,158,255,0.12)",
            position: "relative", overflow: "hidden"
          }}>
            <motion.div animate={{ x: ["-100%", "220%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
              style={{
                position: "absolute", top: 0, bottom: 0, width: "40%",
                background: "linear-gradient(90deg,transparent,rgba(74,158,255,0.09),transparent)", pointerEvents: "none"
              }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                boxShadow: "0 0 18px rgba(74,158,255,0.4)"
              }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.5l-4.95 2.7.95-5.5L2 6.8l5.5-.8z"
                    stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10.5, color: T.blue, fontWeight: 700, letterSpacing: "0.07em" }}>EARLY ACCESS</p>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>Beta Test</h3>
              </div>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
              Help us build the future of rewards. Upload real UPI screenshots and earn coins from your everyday spending.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onBeta}
              style={{
                width: "100%", padding: "12px", borderRadius: 100, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg,${T.blue},${T.blueDeep})`, color: "white",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                boxShadow: "0 0 22px rgba(74,158,255,0.35)"
              }}>
              Join Beta
            </motion.button>
          </div>
        </motion.div>
        {/* Prototype card */}
        <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42, ...SP.gentle }}>
          <div style={{
            borderRadius: 22, padding: "20px 20px 18px", background: T.glass,
            border: `1px solid ${T.glassBorder}`, backdropFilter: "blur(20px)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(232,196,106,0.1)", border: "1px solid rgba(232,196,106,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="14" height="14" rx="3" stroke={T.gold} strokeWidth="1.4" />
                  <path d="M7 10h6M10 7v6" stroke={T.gold} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10.5, color: T.gold, fontWeight: 700, letterSpacing: "0.07em" }}>FULL VISION</p>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>Explore Prototype</h3>
              </div>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
              Experience the complete Paymint vision — rewards, challenges, tiers and future features.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onPrototype}
              style={{
                width: "100%", padding: "12px", borderRadius: 100, cursor: "pointer",
                background: "rgba(232,196,106,0.08)", border: "1px solid rgba(232,196,106,0.28)",
                color: T.gold, fontSize: 14, fontWeight: 700, fontFamily: "inherit"
              }}>
              Explore Prototype
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BETA PROFILE SETUP
// ══════════════════════════════════════════════════════════════════════════════
function BetaProfileSetup({ onDone, onBetaTap }) {
  const [tab, setTab] = useState("join"); // "join" | "login"
  const [form, setForm] = useState({ name: "", age: "", occupation: "", email: "" });
  const [loginEmail, setLoginEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sbErr, setSbErr] = useState("");

  const validate = (f, v) => {
    if (f === "name") return v.trim().length < 2 ? "Enter your name" : null;
    if (f === "age") return (isNaN(v) || Number(v) < 10 || Number(v) > 100) ? "Enter a valid age" : null;
    if (f === "occupation") return v.trim().length < 2 ? "Enter your occupation" : null;
    if (f === "email") return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null;
    return null;
  };

  const chg = f => e => {
    setForm(x => ({ ...x, [f]: e.target.value }));
    setErrors(x => ({ ...x, [f]: null }));
    setSbErr("");
  };

  const submitRegister = async () => {
    const errs = {}; let bad = false;
    Object.keys(form).forEach(k => { const e = validate(k, form[k]); if (e) { errs[k] = e; bad = true; } });
    setErrors(errs); if (bad) return;
    setSaving(true); setSbErr("");

    const user = await apiRegister(form);
    if (!user || user.error) {
      const errMsg = user?.message || "Could not connect to server";
      if (errMsg.includes('DATABASE_URL')) {
        setSbErr("Server not configured yet. Ask your tech team to complete Vercel setup.");
      } else {
        setSbErr("Registration failed: " + errMsg + "\n\nCheck your internet connection and try again.");
      }
      setSaving(false); return;
    }
    await lc.set("beta-profile", user);
    setSaving(false);
    onDone(user, true);
  };

  const submitLogin = async () => {
    const clean = loginEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }
    setSaving(true); setSbErr("");
    const user = await apiLogin(clean);
    if (!user || user.error) {
      const errMsg = user?.message || "Could not sign in";
      if (errMsg.toLowerCase().includes("no account found") || errMsg.includes("404")) {
        setSbErr("No account found for this email. Switch to 'Create Account' to join the beta!");
      } else {
        setSbErr("Sign in failed: " + errMsg);
      }
      setSaving(false);
      return;
    }
    await lc.set("beta-profile", user);
    setSaving(false);
    onDone(user, false);
  };

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={10} />
      <Glow x={70} y={8} color="rgba(74,158,255,0.07)" size={360} />

      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ padding: "48px 24px 0", flexShrink: 0 }}>
        <div onClick={onBetaTap} style={{ cursor: "default", userSelect: "none", display: "inline-block" }}>
          <LogoBadge size={30} />
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginTop: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: T.blue, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {tab === "join" ? "Beta Access" : "Welcome Back"}
          </p>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {tab === "join" ? "Join Paymint Beta" : "Sign In to Paymint"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>
            {tab === "join" ? "Create your account to start earning coins on UPI payments." : "Enter your registered email to continue where you left off."}
          </p>
        </motion.div>

        {/* Tab switch */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 12, marginTop: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { setTab("join"); setSbErr(""); setErrors({}); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === "join" ? "rgba(74,158,255,0.2)" : "transparent",
              color: tab === "join" ? T.blue : T.textSub,
              transition: "all 0.2s ease"
            }}>
            Create Account
          </button>
          <button onClick={() => { setTab("login"); setSbErr(""); setErrors({}); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === "login" ? "rgba(74,158,255,0.2)" : "transparent",
              color: tab === "login" ? T.blue : T.textSub,
              transition: "all 0.2s ease"
            }}>
            Sign In
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...SP.gentle }}
        style={{ flex: 1, overflowY: "auto", padding: "16px 24px 0" }}>
        {tab === "join" ? (
          <div>
            <FloatingInput label="Full Name" value={form.name} onChange={chg("name")} error={errors.name} />
            <FloatingInput label="Age" type="number" value={form.age} onChange={chg("age")} error={errors.age} />
            <FloatingInput label="Occupation" value={form.occupation} onChange={chg("occupation")} error={errors.occupation} />
            <FloatingInput label="Email Address" type="email" value={form.email} onChange={chg("email")} error={errors.email} />
          </div>
        ) : (
          <div style={{ paddingTop: 8 }}>
            <FloatingInput label="Your Email Address" type="email" value={loginEmail}
              onChange={e => { setLoginEmail(e.target.value); setErrors({}); setSbErr(""); }}
              error={errors.email} />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
              Instant login — no password required. Your transactions and coins are linked to your email.
            </p>
          </div>
        )}

        {sbErr && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "12px 14px", borderRadius: 12, background: "rgba(255,96,88,0.08)",
              border: "1px solid rgba(255,96,88,0.25)", marginTop: 12, marginBottom: 8
            }}>
            <p style={{ margin: 0, fontSize: 12.5, color: T.error, lineHeight: 1.55 }}>{sbErr}</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ padding: "14px 24px 38px", flexShrink: 0 }}>
        {tab === "join" ? (
          <Btn onClick={submitRegister} disabled={saving} full large>
            {saving ? "Creating account…" : "Join Beta"}
          </Btn>
        ) : (
          <Btn onClick={submitLogin} disabled={saving} full large>
            {saving ? "Signing in…" : "Sign In"}
          </Btn>
        )}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS CARDS
// ══════════════════════════════════════════════════════════════════════════════
const HOW_CARDS = [
  {
    id: "spend", title: "Spend Normally",
    body: "Continue using GPay, PhonePe, Paytm or any UPI app exactly as you normally do.",
    icon: (col) => (<svg width="30" height="30" viewBox="0 0 30 30" fill="none"><rect x="3" y="8" width="24" height="15" rx="4" stroke={col} strokeWidth="1.7" /><path d="M3 13h24" stroke={col} strokeWidth="1.7" /><rect x="7" y="17" width="6" height="3" rx="1" fill={col} fillOpacity="0.5" /></svg>)
  },
  {
    id: "upload", title: "Upload Screenshot",
    body: "Upload your UPI transaction screenshot to Paymint within 30 minutes of completing the payment.",
    icon: (col) => (<svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M15 22V11M11 15l4-4 4 4" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 25h16" stroke={col} strokeWidth="1.8" strokeLinecap="round" /></svg>)
  },
  {
    id: "earn", title: "Earn Coins",
    body: "We verify your screenshot with AI and award exactly 10% of your spend as coins.\n\n₹100 = 10 Coins  ·  ₹523 = 52.3 Coins\n\nNo rounding. Ever.",
    icon: (col) => (<svg width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="11" stroke={col} strokeWidth="1.7" /><text x="15" y="20" textAnchor="middle" fill={col} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">P</text></svg>)
  },
  {
    id: "redeem", title: "Redeem Rewards",
    body: "Use your coins to unlock vouchers, coupons and rewards from brands like Amazon, Swiggy and Netflix.",
    icon: (col) => (<svg width="30" height="30" viewBox="0 0 30 30" fill="none"><rect x="5" y="13" width="20" height="13" rx="3" stroke={col} strokeWidth="1.7" /><path d="M5 17h20M15 13v13" stroke={col} strokeWidth="1.7" /><path d="M15 13c0 0-4-6 0-6s0 6 0 6M15 13c0 0 4-6 0-6" stroke={col} strokeWidth="1.5" strokeLinecap="round" /></svg>)
  },
];
function BetaHowCards({ onStart }) {
  const [idx, setIdx] = useState(0);
  const card = HOW_CARDS[idx]; const isLast = idx === HOW_CARDS.length - 1;
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", background: T.black,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <ParticleField count={10} />
      <Glow x={50} y={28} color="rgba(74,158,255,0.09)" size={460} />
      <div style={{ padding: "48px 24px 0", flexShrink: 0, position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
          <LogoBadge size={26} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textSub, letterSpacing: "0.07em" }}>PAYMINT BETA</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: T.textMute }}>{idx + 1} of {HOW_CARDS.length}</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div animate={{ width: `${((idx + 1) / HOW_CARDS.length) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", background: `linear-gradient(90deg,${T.blue},#90CAFF)`, borderRadius: 2 }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={card.id}
          initial={{ opacity: 0, x: 40, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -40, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 0", position: "relative", zIndex: 5 }}>
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, ...SP.bouncy }}
            style={{
              width: 68, height: 68, borderRadius: 20, marginBottom: 20,
              background: "linear-gradient(145deg,rgba(74,158,255,0.1),rgba(74,158,255,0.04))",
              border: "1px solid rgba(74,158,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            {card.icon(T.blue)}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <p style={{ margin: "0 0 7px", fontSize: 11.5, color: T.blue, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>Step {idx + 1}</p>
            <h2 style={{ margin: "0 0 14px", fontSize: 25, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{card.title}</h2>
            <p style={{ margin: 0, fontSize: 14, color: T.textSub, lineHeight: 1.72, whiteSpace: "pre-line" }}>{card.body}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div style={{ padding: "14px 24px 44px", flexShrink: 0, position: "relative", zIndex: 5 }}>
        <Btn onClick={isLast ? onStart : () => setIdx(i => i + 1)} full large>{isLast ? "Start Beta" : "Next"}</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BETA UPLOAD + OCR
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// UPI OCR — Canvas preprocessing + Tesseract.js + regex + review/edit flow
// 100% free, runs in browser, no API key needed
// ══════════════════════════════════════════════════════════════════════════════

// ── Canvas preprocessing ──────────────────────────────────────────────────────
async function preprocessImage(file, log) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // Cap at 1500px wide — enough for OCR, avoids exceeding size limits
      const MAX_W = 1500;
      const scale = img.width > MAX_W ? MAX_W / img.width : (img.width < 800 ? 1.5 : 1);
      const W = Math.round(img.width * scale);
      const H = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const imageData = ctx.getImageData(0, 0, W, H);
      const d = imageData.data;
      // Detect dark mode from average brightness
      let totalBright = 0, samples = 0;
      for (let i = 0; i < d.length; i += 4 * 20) {
        totalBright += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; samples++;
      }
      const avgBright = totalBright / samples;
      const isDark = avgBright < 100; // stricter threshold
      log('Canvas: ' + W + 'x' + H + ' brightness=' + avgBright.toFixed(0) + ' isDark=' + isDark);
      // Greyscale + invert dark mode (keep greyscale, not binary)
      for (let i = 0; i < d.length; i += 4) {
        let g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        if (isDark) g = 255 - g;
        // Boost contrast but keep greyscale (better for OCR than binary)
        g = Math.min(255, Math.max(0, (g - 128) * 1.4 + 128));
        d[i] = d[i + 1] = d[i + 2] = g;
        d[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      // Use JPEG at 85% quality — much smaller than PNG, OCR.space handles it fine
      canvas.toBlob(blob => {
        log('Canvas OK: ' + W + 'x' + H + ' size≈' + (blob ? Math.round(blob.size / 1024) + 'KB' : '?'));
        resolve(blob);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      log('Canvas: fallback to original file');
      resolve(file);
    };
    img.src = url;
  });
}

// ── UPI data extraction ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// OCR.space ENGINE 3 — AMOUNT EXTRACTOR
// TEXT-FIRST: works on raw OCR text (always available).
// POSITION-BOOSTED: uses word overlay positions when available for extra accuracy.
// Parses amount first, rejects noise after — never strips formatting before check.
// ══════════════════════════════════════════════════════════════════════════════

// ── Amount parser: all Indian currency / OCR variants ────────────────────────
function ocrParseAmt(raw) {
  // Strip currency prefix including '?' (Engine 3 misread of ₹)
  let s = raw.trim().replace(/^(?:[₹%?]|Rs\.?\s*|INR\s*)/i, '').trim();
  if (!s) return null;
  if (s.includes('.')) {
    const v = parseFloat(s.replace(/[,\s]/g, ''));
    return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
  }
  const parts = s.replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const v = parseFloat(parts[0]);
    return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
  }
  if (parts.length === 2) {
    const [L, R] = parts;
    if (/^\d+$/.test(L) && R.length === 2 && /^\d+$/.test(R)) {
      const v = parseFloat(`${L}.${R}`);
      return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
    }
    if (/^\d+$/.test(L) && R.length === 3 && /^\d+$/.test(R)) {
      const v = parseFloat(L + R);
      return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
    }
    const v = parseFloat(L + R);
    return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
  }
  if (parts.length === 3) {
    const [L, M, R] = parts;
    if (/^\d+$/.test(L) && M.length === 3 && /^\d+$/.test(M) && R.length === 2 && /^\d+$/.test(R)) {
      const v = parseFloat(`${L}${M}.${R}`);
      return (!isNaN(v) && v > 0 && v < 500000) ? v : null;
    }
  }
  return null;
}

// ── Noise rejection: after parsing, based on value + word structure ───────────
function ocrIsNoise(val, rawWord, isMulti) {
  if (val === null || val <= 0 || val >= 500000) return true;
  if (isMulti) return false; // multi-word = OCR-split currency, trust parsed value
  const intPart = rawWord.trim().split('.')[0];
  const digits = intPart.replace(/[\s,]/g, '');
  if (digits.length >= 10) return true;
  if (digits.length === 10 && '6789'.includes(digits[0]) && !intPart.includes(',')) return true;
  if (digits.length === 8 && digits.startsWith('20')) return true;
  if (digits.length === 6 && !intPart.includes(',') && !rawWord.trim().includes('.')) return true;
  return false;
}

// ── Text-based extraction (works on plain OCR text — no positions needed) ─────
function extractFromText(text, log) {
  const results = [];
  // Normalise line endings from OCR.space (uses \r\n)
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').map(l => l.trim()).filter(Boolean);
  const n = lines.length;

  for (let i = 0; i < n; i++) {
    const line = lines[i];
    const above = i > 0 ? lines[i - 1] : '';
    const below = i < n - 1 ? lines[i + 1] : '';
    const ctx = line + ' ' + above + ' ' + below;

    // Skip pure noise lines (UTR/ref with no payment keyword)
    if (/\b(?:utr|upi\s*ref|ref(?:erence)?\s*no|txn\s*id|ifsc|account\s*no)\b/i.test(line)
      && !/\b(?:paid|amount|total|sent)\b/i.test(line)) continue;

    // Pattern A: currency symbol directly before number — score 80+
    // Handles: ₹5.00  ₹40  ₹5,000.00  ?5.00  % 35  Rs.500  INR 1000
    const patA = /(?:[₹%?]|Rs\.?|INR)\s*([\d,]+(?:\s\d{3})?(?:\s\d{2})?(?:\.\d{1,2})?)/gi;
    let mA;
    while ((mA = patA.exec(line)) !== null) {
      const raw = mA[1].trim();
      const val = ocrParseAmt(raw);
      if (val === null || ocrIsNoise(val, raw, false)) continue;
      let sc = 80;
      if (raw.includes('.')) sc += 10;
      if (raw.includes(',')) sc += 10;
      if (i < n * 0.65) sc += 10;
      if (/\b(?:paid|payment|successful|sent|amount|transferred)\b/i.test(ctx)) sc += 10;
      log('  [A] ₹' + val + ' sc=' + sc + ' line="' + line.slice(0, 40) + '"');
      results.push({ val, score: sc, reason: 'currency-prefix L' + i });
    }

    // Pattern B: keyword + number on same line — score 65+
    const patB = /(?:amount|paid|total|sent|debited|transferred|charged)[^\d]{0,15}([\d,]+(?:\.\d{1,2})?)/gi;
    let mB;
    while ((mB = patB.exec(line)) !== null) {
      const raw = mB[1].trim();
      const val = ocrParseAmt(raw);
      if (val === null || ocrIsNoise(val, raw, false)) continue;
      let sc = 65;
      if (raw.includes('.')) sc += 10;
      if (i < n * 0.65) sc += 10;
      log('  [B] ₹' + val + ' sc=' + sc + ' line="' + line.slice(0, 40) + '"');
      results.push({ val, score: sc, reason: 'keyword-context L' + i });
    }

    // Pattern C: standalone number — currency or keyword on adjacent line
    if (/^[\d,]+(?:\.\d{1,2})?$/.test(line)) {
      const val = ocrParseAmt(line);
      if (val !== null && !ocrIsNoise(val, line, false)) {
        const hasCurr = /[₹%?]|Rs\.?|INR/i.test(above + ' ' + below);
        const hasKw = /\b(?:paid|amount|total|sent|successful|payment)\b/i.test(above + ' ' + below);
        if (hasCurr || hasKw) {
          let sc = 55 + (hasCurr ? 20 : 0) + (hasKw ? 10 : 0);
          if (line.includes('.')) sc += 10;
          if (i < n * 0.65) sc += 10;
          log('  [C] ₹' + val + ' sc=' + sc + ' standalone with ctx');
          results.push({ val, score: sc, reason: 'standalone-ctx L' + i });
        }
      }
    }

    // Pattern D: ₹/Rs/INR on its own line, number on next line
    // OCR.space sometimes splits "₹" and "5.00" onto separate lines
    if (/^(?:[₹%?]|Rs\.?|INR)$/.test(line) && below) {
      const val = ocrParseAmt(below);
      if (val !== null && !ocrIsNoise(val, below, false)) {
        let sc = 75; // strong — dedicated currency symbol line above amount
        if (below.includes('.')) sc += 10;
        if (i < n * 0.65) sc += 10;
        log('  [D] ₹' + val + ' sc=' + sc + ' symbol-then-number');
        results.push({ val, score: sc, reason: 'symbol-line L' + i });
      }
    }

    // Pattern E: number with Rs. or INR prefix — alternate formats
    // "Rs. 5.00"  "INR5000"
    const patE = /(?:Rs\.?|INR)\s*([\d,]+(?:\s\d{3})?(?:\s\d{2})?(?:\.\d{1,2})?)/gi;
    let mE;
    while ((mE = patE.exec(line)) !== null) {
      const raw = mE[1].trim();
      const val = ocrParseAmt(raw);
      if (val === null || ocrIsNoise(val, raw, false)) continue;
      // Avoid duplicate with Pattern A
      const alreadyFound = results.some(r => r.val === val && r.reason.includes('L' + i));
      if (!alreadyFound) {
        let sc = 80;
        if (raw.includes('.')) sc += 10;
        if (i < n * 0.65) sc += 10;
        log('  [E] ₹' + val + ' sc=' + sc + ' Rs/INR prefix');
        results.push({ val, score: sc, reason: 'rs-inr-prefix L' + i });
      }
    }
  }
  return results;
}

// ── Position boost (optional — when OCR.space overlay words available) ────────
function boostWithPositions(results, ocrLines, log) {
  if (!ocrLines || !ocrLines.length) return results;
  let maxR = 1, maxB = 1;
  for (const ln of ocrLines) {
    for (const w of (ln.words || [])) {
      maxR = Math.max(maxR, (w.left || 0) + (w.width || 0));
      maxB = Math.max(maxB, (w.top || 0) + (w.height || 0));
    }
  }
  const nX = v => v / maxR;
  const nY = v => v / maxB;
  const CURR = /[₹%?]|Rs\.?|INR/i;

  const symPositions = [];
  for (const ln of ocrLines) {
    for (const w of (ln.words || [])) {
      if (CURR.test(w.text || '')) {
        symPositions.push({
          cx: nX((w.left || 0) + (w.width || 0) / 2),
          cy: nY((w.top || 0) + (w.height || 0) / 2),
        });
      }
    }
  }
  if (!symPositions.length) return results;

  return results.map(({ val, score, reason }) => {
    let extra = 0;
    for (const ln of ocrLines) {
      for (const w of (ln.words || [])) {
        const wv = ocrParseAmt((w.text || '').replace(/,/g, ''));
        if (wv !== val) continue;
        const wx = nX((w.left || 0) + (w.width || 0) / 2);
        const wy = nY((w.top || 0) + (w.height || 0) / 2);
        for (const { cx, cy } of symPositions) {
          const dist = Math.sqrt((wx - cx) ** 2 + (wy - cy) ** 2);
          if (dist < 0.25) {
            extra = Math.max(extra, Math.round((0.25 - dist) * 80));
            const h = nY(w.height || 0);
            extra += h > 0.04 ? 15 : h > 0.025 ? 8 : 0;
            break;
          }
        }
      }
    }
    if (extra > 0) log('  Pos-boost ₹' + val + ' +' + extra);
    return { val, score: score + extra, reason };
  });
}

// ── Main entry point ──────────────────────────────────────────────────────────
function extractAmountOcrSpace(ocrLines, rawText, log) {
  // Step 1: text-based extraction (always works)
  let results = extractFromText(rawText, log);

  // Step 2: position boost if overlay data available
  if (ocrLines && ocrLines.length) {
    results = boostWithPositions(results, ocrLines, log);
  }

  if (!results.length) {
    log('  No candidates → Review');
    return { amount: null, score: 0, needsReview: true };
  }

  // Deduplicate: best score per value
  const best = {};
  for (const { val, score, reason } of results) {
    if (!(val in best) || score > best[val].score) best[val] = { score, reason };
  }
  const ranked = Object.entries(best)
    .map(([v, { score, reason }]) => ({ val: Number(v), score, reason }))
    .sort((a, b) => b.score - a.score);

  log('  Ranked: ' + ranked.slice(0, 5).map(r => `₹${r.val}(${r.score})`).join(', '));

  const top = ranked[0];

  // ── Confidence decision: AUTO-EXTRACT by default ──────────────────
  // Review ONLY when:
  // 1. No currency/keyword signal at all (score < 40)
  // 2. Two candidates genuinely compete AND neither has strong currency signal
  let needsReview = false;

  if (top.score < 40) {
    log('  Very low confidence (' + top.score + ') → Review');
    needsReview = true;
  } else if (ranked.length >= 2) {
    const sec = ranked[1];
    const gap = top.score - sec.score;
    // Ambiguous only if gap < 20 AND top doesn't have strong currency anchor (< 70)
    if (sec.val !== top.val && gap < 20 && top.score < 70) {
      log('  Ambiguous ₹' + top.val + '(' + top.score + ') vs ₹' + sec.val + '(' + sec.score + ') → Review');
      needsReview = true;
    }
  }

  log('  → ' + (needsReview ? 'REVIEW' : '₹' + top.val) + ' (score=' + top.score + ')');
  return { amount: needsReview ? null : top.val, score: top.score, needsReview };
}


function parse_ocr_number(raw) {
  // Handles Tesseract OCR noise: "5 00"→5.00, "35 00"→35.00, "5 000"→5000
  const s = raw.trim();
  if (s.includes('.')) {
    const v = parseFloat(s.replace(/[,\s]/g, ''));
    return isNaN(v) ? [null, false] : [v, false];
  }
  const parts = s.replace(/,/g, ' ').trim().split(/\s+/);
  if (parts.length === 1) {
    const v = parseFloat(parts[0]);
    return isNaN(v) ? [null, false] : [v, false];
  }
  if (parts.length === 2) {
    const [L, R] = parts;
    if (R.length === 2 && /^\d+$/.test(R)) {
      const v = parseFloat(`${L}.${R}`);
      return isNaN(v) ? [null, false] : [v, L.length === 1]; // ambiguous if single-digit prefix
    }
    if (R.length === 3 && /^\d+$/.test(R)) {
      const v = parseFloat(L + R);
      return isNaN(v) ? [null, false] : [v, false];
    }
    const v = parseFloat(L + R);
    return isNaN(v) ? [null, false] : [v, true];
  }
  if (parts.length === 3) {
    const [L, M, R] = parts;
    if (M.length === 3 && /^\d+$/.test(M) && R.length === 2 && /^\d+$/.test(R)) {
      const v = parseFloat(`${L}${M}.${R}`);
      return isNaN(v) ? [null, false] : [v, false];
    }
  }
  return [null, false];
}

function is_rejected(val, rawSpaced, lineCtx) {
  const digits = rawSpaced.replace(/[\s,.]/g, '');
  if (digits.length >= 10) return true;                              // UTR/ref
  if (digits.length === 10 && '6789'.includes(digits[0])) return true; // mobile
  if (digits.length === 8 && digits.startsWith('20')) return true;  // YYYYMMDD
  if (/^\d{6}$/.test(rawSpaced.trim())) return true;                // bare 6-digit pincode
  // Time: only reject if AM/PM on same line AND val < 2400
  if (/\b(?:am|pm)\b/i.test(lineCtx) && !rawSpaced.includes('.') && val < 2400 && digits.length <= 4) return true;
  return false;
}

const NOISE_RE = /\b(?:utr|upi\s*ref|ref(?:erence)?(?:\s*no)?|txn(?:\s*id)?|transaction\s*(?:id|no|ref)|order|receipt|ac(?:count)?\.?\s*no|a\/c|acno|ifsc|mmid|mobile|phone|contact)\b/i;
const AMOUNT_RE = /(?:[₹%]|rs\.?|inr\b|\bpaid\b|\bamount\b|\btotal\b|\bsent\b|\bdebited\b|\btransferred\b|\bcharged\b|\bcost\b|\bpayment\b)/i;
const CURRENCY_RE = /[₹%]|Rs\.?|INR\b/i;
const NUM_TOKEN = /\d[\d\s,]*(?:\.\d{1,2})?/g;

function score_candidate(val, raw, line, li, total, hasSym, ctxB, ctxA, ambiguous) {
  if (is_rejected(val, raw, line)) return -1;
  if (val <= 0 || val > 500000) return -1;
  let sc = 0;
  if (hasSym) sc += 45;
  if ([line, ctxB, ctxA].some(x => AMOUNT_RE.test(x))) sc += 20;
  if (NOISE_RE.test(line)) sc -= 35;
  const pos = li / Math.max(total, 1);
  if (pos < 0.4) sc += 12;
  else if (pos < 0.7) sc += 6;
  else if (pos > 0.85) sc -= 8;
  const hasDec = raw.includes('.') || val !== Math.floor(val);
  if (hasDec) sc += 12;
  if (val < 10 && hasDec) sc += 10;
  if (val >= 1 && val <= 50000) sc += 8;
  else if (val > 50000) sc -= 5;
  if (val >= 1000 && /\d[\s,]\d{3}/.test(raw)) sc += 6;
  if (ambiguous) sc -= 15;
  return Math.max(sc, 0);
}

// ── Anti-Tamper & Fraud Detection Helpers ─────────────────────────────────────
function getJulianDay(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function verifyUpiUtrJulianDate(utr, dateStr) {
  if (!utr || typeof utr !== 'string') return { valid: true, skipped: true };
  const cleanUtr = utr.trim().replace(/\s+/g, '');
  if (!/^\d{12}$/.test(cleanUtr)) {
    return { valid: true, skipped: true, reason: 'non-12-digit UTR' };
  }

  const utrYearDigit = parseInt(cleanUtr[0]);
  const utrJulianDay = parseInt(cleanUtr.slice(1, 4));

  // If day code is outside 1-366, it is an app-specific transaction ID (e.g. BHIM 1417..., Paytm, Cred) rather than an NPCI Julian UTR
  if (isNaN(utrJulianDay) || utrJulianDay < 1 || utrJulianDay > 366) {
    return { valid: true, skipped: true, reason: 'non-Julian transaction reference format' };
  }

  let targetDate = new Date();
  if (dateStr) {
    const p = new Date(dateStr);
    if (!isNaN(p.getTime())) targetDate = p;
  }

  const expectedYearDigit = targetDate.getFullYear() % 10;
  const expectedJulianDay = getJulianDay(targetDate);

  const yearDiff = Math.abs(utrYearDigit - expectedYearDigit);
  const dayDiff = Math.abs(utrJulianDay - expectedJulianDay);

  if (yearDiff !== 0 && !(yearDiff === 1 && (expectedJulianDay <= 2 || expectedJulianDay >= 364))) {
    return {
      valid: false,
      reason: `UPI Reference ID (UTR) verification failed: year code ${utrYearDigit} does not match transaction year ${expectedYearDigit}.`
    };
  }

  if (dayDiff > 2 && dayDiff < 363) {
    return {
      valid: false,
      reason: `UPI Reference ID (UTR) verification failed: day code ${utrJulianDay} contradicts transaction date (expected day ${expectedJulianDay}).`
    };
  }

  return { valid: true, utrJulianDay, expectedJulianDay };
}

function verifyStatusBarVsTxTime(statusBarTimeStr, txTimeStr) {
  if (!statusBarTimeStr || !txTimeStr) return { valid: true, skipped: true };

  const parseMin = (s) => {
    const parts = s.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };

  const statusMin = parseMin(statusBarTimeStr);
  let txMin = parseMin(txTimeStr);

  let forwardDiff = txMin - statusMin;
  if (forwardDiff < -720) forwardDiff += 1440;

  // If transaction time is ahead of phone status bar time by > 4 minutes:
  if (forwardDiff > 4 && forwardDiff < 720) {
    return {
      valid: false,
      reason: `Screenshot timing contradiction: Transaction time (${txTimeStr}) is ahead of device status bar clock (${statusBarTimeStr}).`
    };
  }

  return { valid: true };
}

function verifyImageFileMetadata(fileName) {
  if (!fileName) return { valid: true };
  const lower = fileName.toLowerCase();
  const editorKeywords = ['picsart', 'photoshop', 'snapseed', 'canva', 'inshot', 'lightroom', 'photo_editor', 'markup', 'edited_'];
  for (const kw of editorKeywords) {
    if (lower.includes(kw)) {
      return { valid: false, reason: `Edited screenshot detected (${kw}). Please upload an original screenshot directly from your payment app.` };
    }
  }
  return { valid: true };
}

// ── Payment Direction Detection (Outgoing / Paid vs Incoming / Received) ─────
function detectPaymentDirection(text) {
  const t = text.toLowerCase();

  // If "payment received by" or "received by [merchant/store/business]", it's outgoing confirmation!
  const cleanedForIncoming = text.replace(/(?:payment\s+)?received\s+by\s+[A-Za-z0-9\s&._@-]{2,60}/gi, '');

  // Definitive Incoming (NEVER appears on genuine outgoing payment receipts)
  const definitiveIncoming = /(?:received\s+from|payment\s+received\s+from|money\s+received\s+from|you(?:\s*have)?\s+received|received\s*(?:₹|rs\.?|inr)|amount\s+received|funds?\s+received|received\s+into|received\s+in\s+bank|sender\s*:|remitter\s*(?:name|upi|vpa)?\s*:?|inward\s+(?:upi|payment|transaction|remittance)|cashback\s+(?:received|credited)|refund\s+(?:received|credited|from)|credited\s+to\s+your\s+(?:account|bank|wallet|a\/c)|your\s+account\s+has\s+been\s+credited)/i;

  const mDef = cleanedForIncoming.match(definitiveIncoming);
  if (mDef) {
    return { direction: 'incoming', isReceived: true, match: mDef[0] };
  }

  // Also standalone "payment received" if NOT followed by "by"
  const mStandAloneReceived = text.match(/(?:payment\s+received|money\s+received)(?!\s+by\b)/i);
  if (mStandAloneReceived) {
    return { direction: 'incoming', isReceived: true, match: mStandAloneReceived[0] };
  }

  // General Incoming checks
  const incomingPatterns = [
    /\bcredited\b/i,
    /\bcredit\s+alert\b/i,
    /\bdeposit\s+successful\b/i,
  ];

  // Outgoing checks
  const outgoingPatterns = [
    /\bpaid\s+to\b/i,
    /\bpaid\s*₹/i,
    /\bpaid\b/i,
    /\bpayment\s+to\b/i,
    /\bsent\s+to\b/i,
    /\bmoney\s+sent\b/i,
    /\btransferred\s+to\b/i,
    /\bpayment\s+transferred\b/i,
    /\bpaying\s+to\b/i,
    /\bpaid\s+successfully\b/i,
    /\bdebited\s+from\b/i,
    /\baccount\s+debited\b/i,
    /\bdebited\s+account\b/i,
    /\bdebit\s+alert\b/i,
    /\bdebit\s+from\b/i,
    /\bbill\s+paid\b/i,
    /\brecharge\s+successful\b/i,
  ];

  const hasOutgoing = outgoingPatterns.some(p => p.test(text));
  const hasIncoming = incomingPatterns.some(p => p.test(cleanedForIncoming));

  if (hasIncoming && !hasOutgoing) {
    return { direction: 'incoming', isReceived: true, match: 'credited without outgoing context' };
  }

  return { direction: 'outgoing', isReceived: false, match: 'outgoing payment' };
}

// ── Strict 2-Hour (120-minute) Window Verification ─────────────────────────────
function checkTransactionWindow(dateStr, timeStr, fileModified) {
  const now = new Date();

  // Case 1: Both date and time are available
  if (dateStr && timeStr) {
    let txTime = new Date(`${dateStr}T${timeStr}:00`);
    if (!isNaN(txTime.getTime())) {
      let diffMin = (now.getTime() - txTime.getTime()) / (1000 * 60);

      // AM/PM ambiguity correction: If time lacked AM/PM, it might be ~12 hours (720 min) off
      if (diffMin > 600 && diffMin < 840) {
        const altTime = new Date(txTime.getTime() + 12 * 60 * 60 * 1000);
        const altDiff = (now.getTime() - altTime.getTime()) / (1000 * 60);
        if (Math.abs(altDiff) <= 120) {
          txTime = altTime;
          diffMin = altDiff;
        }
      }

      // Small clock drift tolerance (e.g. phone clock 1-15 mins ahead of system)
      if (diffMin < 0 && diffMin >= -15) {
        diffMin = 0;
      }

      if (diffMin > 120) {
        return { expired: true, diffMin, reason: `${Math.round(diffMin)} minutes ago (limit: 120 min / 2 hours)` };
      }
      return { expired: false, diffMin, reason: 'within 120 min' };
    }
  }

  // Case 2: Only date is available (no time)
  if (dateStr && !timeStr) {
    const todayStr = now.toISOString().split('T')[0];
    const diffDays = (new Date(todayStr) - new Date(dateStr)) / (24 * 60 * 60 * 1000);
    // If date is 2 or more days ago: definitely expired (> 24 hours)
    if (diffDays >= 2) {
      return { expired: true, diffMin: diffDays * 1440, reason: `Transaction date is ${diffDays} days old` };
    }
    // If date was yesterday and current hour >= 2 AM: definitely expired (> 2 hours)
    if (diffDays === 1 && now.getHours() >= 2) {
      return { expired: true, diffMin: 1440, reason: 'Transaction date is from yesterday' };
    }
    // Future date check
    if (diffDays < -1) {
      return { expired: true, diffMin: 0, reason: 'Invalid future date' };
    }
  }

  // Case 3: Only time is available (no date)
  if (!dateStr && timeStr) {
    const todayStr = now.toISOString().split('T')[0];
    let txTime = new Date(`${todayStr}T${timeStr}:00`);
    let diffMin = (now.getTime() - txTime.getTime()) / (1000 * 60);
    if (diffMin < 0 && diffMin >= -15) diffMin = 0;
    if (diffMin > 120) {
      return { expired: true, diffMin, reason: `${Math.round(diffMin)} minutes ago (limit: 120 min)` };
    }
  }

  // Case 4: File lastModified check (if screenshot file metadata is > 135 minutes old)
  if (fileModified && typeof fileModified === 'number') {
    const fileAgeMin = (now.getTime() - fileModified) / (1000 * 60);
    if (fileAgeMin > 135) {
      return { expired: true, diffMin: fileAgeMin, reason: `Screenshot taken ${Math.round(fileAgeMin)} minutes ago` };
    }
  }

  return { expired: false, diffMin: 0, reason: 'valid' };
}

function extractUPIData(text, log) {
  // Normalise: NFC compose, common rupee-symbol substitutes
  const t = text.normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/Rs\s*\./gi, 'Rs.');

  const lines = t.split('\n');
  const total = lines.length;
  const cands = [];  // {val, raw, score}

  const addCand = (val, raw, score) => {
    if (val === null || score < 0) return;
    cands.push({ val, raw, score });
  };

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    const ctxB = i > 0 ? lines[i - 1].trim() : '';
    const ctxA = i < total - 1 ? lines[i + 1].trim() : '';

    // Pattern A: currency marker BEFORE number  (₹5.00, % 5 00, Rs.500)
    const patA = /(?:[₹%]|Rs\.?|INR)\s*(\d[\d\s,]*(?:\.\d{1,2})?)/gi;
    let mA;
    while ((mA = patA.exec(s)) !== null) {
      const raw = mA[1].trimEnd();
      const [val, amb] = parse_ocr_number(raw);
      if (val === null) continue;
      addCand(val, raw, score_candidate(val, raw, s, i, total, true, ctxB, ctxA, amb));
    }

    // Pattern B: number BEFORE currency marker
    const patB = /(\d[\d\s,]*(?:\.\d{1,2})?)\s*(?:[₹%]|Rs\.?|INR)/gi;
    let mB;
    while ((mB = patB.exec(s)) !== null) {
      const raw = mB[1].trimEnd();
      const [val, amb] = parse_ocr_number(raw);
      if (val === null) continue;
      addCand(val, raw, score_candidate(val, raw, s, i, total, true, ctxB, ctxA, amb));
    }

    // Pattern C: keyword label on same line (Amount: 500, Paid 1000)
    const patC = /(?:amount|paid|total|sent|debited|transferred|charged)[^\d]{0,20}(\d[\d\s,]*(?:\.\d{1,2})?)/gi;
    let mC;
    while ((mC = patC.exec(s)) !== null) {
      const raw = mC[1].trimEnd();
      const [val, amb] = parse_ocr_number(raw);
      if (val === null) continue;
      addCand(val, raw, score_candidate(val, raw, s, i, total, false, ctxB, ctxA, amb));
    }

    // Pattern D: keyword THIS line, standalone number PREVIOUS line
    if (AMOUNT_RE.test(s) && !NOISE_RE.test(s) && ctxB) {
      const mD = ctxB.match(/^(\d[\d\s,]*(?:\.\d{1,2})?)$/);
      if (mD) {
        const raw = mD[1];
        const [val, amb] = parse_ocr_number(raw);
        if (val !== null) {
          const sc = score_candidate(val, raw, ctxB, i - 1, total, false, '', s, amb) + 15;
          addCand(val, raw, sc);
        }
      }
    }

    // Pattern E: standalone number on its own line
    const mE = s.match(/^(\d[\d\s,]*(?:\.\d{1,2})?)$/);
    if (mE) {
      const raw = mE[1];
      const [val, amb] = parse_ocr_number(raw);
      if (val !== null) {
        const hasSym = CURRENCY_RE.test(ctxB) || CURRENCY_RE.test(ctxA);
        addCand(val, raw, score_candidate(val, raw, s, i, total, hasSym, ctxB, ctxA, amb));
      }
    }

    // Pattern F: single-digit prefix + number → emit the numeric part
    // Handles "2 35" where "2" is misread ₹ symbol → real amount is 35
    const mF = s.match(/^(\d)\s+(\d[\d\s,]*(?:\.\d{1,2})?)$/);
    if (mF && mF[1].length === 1) {
      const raw = mF[2].trimEnd();
      const [val, amb] = parse_ocr_number(raw);
      if (val !== null) {
        const sc = score_candidate(val, raw, s, i, total, true, ctxB, ctxA, false) + 5;
        addCand(val, raw, sc);
      }
    }
  }

  // Deduplicate: best score per value
  const bestMap = {};
  for (const { val, raw, score } of cands) {
    if (!(val in bestMap) || score > bestMap[val].score) {
      bestMap[val] = { raw, score };
    }
  }
  const ranked = Object.entries(bestMap)
    .map(([v, { raw, score }]) => ({ val: Number(v), raw, score }))
    .sort((a, b) => b.score - a.score);

  log('Candidates: ' + ranked.slice(0, 5).map(c => `₹${c.val}(${c.score})`).join(', '));

  if (!ranked.length) {
    log('No candidates → Review');
    return {
      amount: null, confidence: 0, missingFields: ['amount'],
      status: 'success', app: 'UPI', merchant: 'UPI Payment',
      txnId: '', date: '', time: '', bank: ''
    };
  }

  const top = ranked[0];
  let confidence = 100;
  const missing = [];
  let needsReview = false;

  if (top.score < 25) {
    log(`Low confidence (${top.score}) → Review`);
    needsReview = true;
    confidence = top.score;
  } else if (ranked.length >= 2) {
    const sec = ranked[1];
    if (sec.val !== top.val && (top.score - sec.score) < 12) {
      log(`Ambiguous ${top.val}(${top.score}) vs ${sec.val}(${sec.score}) → Review`);
      needsReview = true;
      confidence = top.score;
    }
  }

  const amount = needsReview ? null : top.val;
  if (!amount) missing.push('amount');

  // ── Extract remaining fields using existing logic ──────────────────
  const dirCheck = detectPaymentDirection(t);
  let status = 'success';
  if (dirCheck.isReceived) {
    status = 'received';
  } else if (/failed|declined|rejected|unsuccessful|could not|timed.?out|expired/i.test(t)) {
    status = 'failed';
  } else {
    // Check for success confirmation indicators across apps (BHIM, GPay, PhonePe, Paytm)
    const hasDefinitiveSuccess = /\b(?:paid|successful|transferred|transfer|completed|debited|debit)\b/i.test(t) ||
                                 /(?:payment\s+)?received\s+by\b/i.test(t);

    // Strip benign UI labels like BHIM's "Process details" before testing for pending/processing status
    const tWithoutProcessDetails = t.replace(/\bprocess(?:\s+details)?\b/gi, '');

    if (/\b(?:payment\s+pending|transaction\s+pending|awaiting\s+confirmation|pending\s+at\s+bank|waiting\s+for\s+bank)\b/i.test(tWithoutProcessDetails)) {
      status = 'pending';
    } else if (/\b(?:payment\s+processing|transaction\s+in\s+progress|payment\s+in\s+progress|pending|processing)\b/i.test(tWithoutProcessDetails) && !hasDefinitiveSuccess) {
      status = 'pending';
    }
  }

  let app = 'UPI';
  if (/g[o0]{1,2}gle\s*pay|gpay|\btez\b/i.test(t)) app = 'GPay';
  else if (/ph[o0]ne\s*pe|phonepe/i.test(t)) app = 'PhonePe';
  else if (/paytm/i.test(t)) app = 'Paytm';
  else if (/\bbhim\b/i.test(t)) app = 'BHIM';
  else if (/amazon\s*pay/i.test(t)) app = 'Amazon Pay';
  else if (/\byono\b|state\s*bank/i.test(t)) app = 'SBI';
  else if (/\bhdfc\b/i.test(t)) app = 'HDFC';
  else if (/\bicici\b/i.test(t)) app = 'ICICI';
  else if (/\baxis\b/i.test(t)) app = 'Axis';
  else if (/\bkotak\b/i.test(t)) app = 'Kotak';

  let merchant = '';
  for (const p of [
    /(?:banking\s*name)[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
    /(?:payment\s+received\s+by|received\s+by)[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
    /(?:paid\s+to|sent\s+to|money\s+sent\s+to|transferred\s+to)[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
    /(?:^|\n)\s*To[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
    /(?:to|payee|beneficiary|recipient)[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
    /(?:merchant|vendor|store)[:\s]+([A-Za-z0-9\s&._@-]{2,50})/i,
  ]) {
    const m = t.match(p);
    if (m) {
      let raw = m[1].split(/[\n\r:|,]/)[0].trim();
      raw = raw.replace(/\+91\s*[\d\s.*-]+/, '').trim();
      if (raw.length > 1 && !/^(?:account|upi\s*id|bank|self)$/i.test(raw)) {
        merchant = raw.slice(0, 40);
        break;
      }
    }
  }

  let txnId = '';
  for (const p of [
    /(?:upi\s*ref(?:erence)?|utr(?:\s*no)?|txn\s*(?:id|no)|transaction\s*(?:id|no)|ref(?:erence)?\s*(?:no|id|#)?)[:\s#]*([A-Z0-9]{8,30})/i,
    /\b([0-9]{12})\b/,
    /\b([0-9]{10,15})\b/,
  ]) {
    const m = t.match(p); if (m) { txnId = m[1].trim(); break; }
  }

  let date = '';
  const mths = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const comboM = t.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[,.]?\s+\d{2,4})[,\s]+(?:at\s+)?(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)/i);

  for (const { re, fn } of [
    { re: /(\d{4})[-/](\d{2})[-/](\d{2})/, fn: m => `${m[1]}-${m[2]}-${m[3]}` },
    { re: /(\d{2})[-/](\d{2})[-/](\d{4})/, fn: m => `${m[3]}-${m[2]}-${m[1]}` },
    {
      re: /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[,.]?\s+(\d{2,4})/i,
      fn: m => {
        let yr = m[3];
        if (yr.length === 2) yr = '20' + yr;
        return `${yr}-${mths[m[2].toLowerCase().slice(0, 3)] || '01'}-${m[1].padStart(2, '0')}`;
      }
    },
    {
      re: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[,.]?\s+(\d{1,2})(?:st|nd|rd|th)?[,.]?\s+(\d{2,4})/i,
      fn: m => {
        let yr = m[3];
        if (yr.length === 2) yr = '20' + yr;
        return `${yr}-${mths[m[1].toLowerCase().slice(0, 3)] || '01'}-${m[2].padStart(2, '0')}`;
      }
    },
  ]) {
    const m = (comboM ? comboM[1] : t).match(re) || t.match(re);
    if (m) { try { date = fn(m); } catch (e) { date = ''; } if (date) break; }
  }

  let time = '';
  // 1. Highest priority: explicit time with AM/PM (avoids phone status bar clock at the top)
  const ampmMatches = [...t.matchAll(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)\b/gi)];
  if (ampmMatches.length > 0) {
    const lastM = ampmMatches[ampmMatches.length - 1];
    let hh = parseInt(lastM[1]), mm = parseInt(lastM[2]);
    const p = lastM[3].toLowerCase();
    if (p === 'pm' && hh < 12) hh += 12;
    if (p === 'am' && hh === 12) hh = 0;
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  } else if (comboM && comboM[2]) {
    const tM = comboM[2].match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
    if (tM) {
      let hh = parseInt(tM[1]), mm = parseInt(tM[2]);
      const p = tM[3];
      if (p) { if (/pm/i.test(p) && hh < 12) hh += 12; if (/am/i.test(p) && hh === 12) hh = 0; }
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
  } else {
    // Search non-first lines to avoid phone top bar
    const subText = lines.slice(1).join('\n');
    const tM = subText.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i) || t.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
    if (tM) {
      let hh = parseInt(tM[1]), mm = parseInt(tM[2]);
      const p = tM[3];
      if (p) { if (/pm/i.test(p) && hh < 12) hh += 12; if (/am/i.test(p) && hh === 12) hh = 0; }
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
  }

  let bank = '';
  const bM = t.match(/(?:sbi|state bank|hdfc|icici|axis|kotak|pnb|bob|union bank|yes bank|idbi|federal|canara|au small finance)[^\n]*/i);
  if (bM) bank = bM[0].trim().slice(0, 30);

  // Confidence scoring for non-amount fields
  if (!merchant) { confidence -= 20; missing.push('merchant'); }
  if (!date) { confidence -= 15; missing.push('date'); }
  if (!time) { confidence -= 10; missing.push('time'); }
  if (!txnId) { confidence -= 5; missing.push('txnId'); }

  log(`amount=${amount} conf=${confidence} missing=[${missing}]`);

  return {
    amount, status, app, merchant: merchant || 'UPI Payment',
    txnId, date, time, bank, confidence, missingFields: missing,
    direction: dirCheck.direction, isReceived: dirCheck.isReceived, directionReason: dirCheck.match
  };
}


function BetaUpload({ profile, onDone, onClose, onAddDetails }) {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [debugLog, setDebugLog] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();
  const savedFile = useRef();
  const savedDataUrl = useRef(null);

  const log = (...args) => {
    console.log('[OCR]', ...args);
    setDebugLog(prev => [...prev, args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')]);
  };

  const finaliseTx = async (parsed, file) => {
    // Block received payments before finalizing
    if (parsed.status === 'received' || parsed.direction === 'incoming' || parsed.isReceived || /received\s+from|payment\s+received|money\s+received|cashback\s+received|refund\s+received/i.test(parsed.merchant || '')) {
      log('REJECTED in finaliseTx: Received payment');
      setPhase('error');
      setErrMsg('Payment Received screenshot detected. Coins are only earned when you make a payment to someone (sent / paid). Money received does not earn coins.');
      setSubmitting(false);
      return;
    }
    if (parsed.txnId) {
      const utrCheck = verifyUpiUtrJulianDate(parsed.txnId, parsed.date);
      if (!utrCheck.valid) {
        log('REJECTED UTR in finaliseTx: ' + utrCheck.reason);
        setPhase('error');
        setErrMsg(utrCheck.reason);
        setSubmitting(false);
        return;
      }
    }

    // Strict 2-hour window check before finalizing
    const winCheck = checkTransactionWindow(parsed.date, parsed.time, file?.lastModified);
    if (winCheck.expired) {
      log('EXPIRED in finaliseTx: ' + winCheck.reason);
      setPhase('expired');
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    const amount = parseFloat(Number(parsed.amount).toFixed(2));
    const coins = parseFloat((amount * 0.10).toFixed(1));
    const tx = {
      id: Date.now() + Math.random(),
      merchant: (parsed.merchant || 'UPI Payment').trim(),
      amount, coins,
      txnId: parsed.txnId || '',
      date: parsed.date || '',
      time: parsed.time || '',
      app: parsed.app || 'UPI',
      bank: parsed.bank || '',
      ts: new Date().toISOString(),
    };
    log('Finalising tx:', JSON.stringify(tx));
    let ssUrl = savedDataUrl.current || null;
    try {
      if (!ssUrl) {
        ssUrl = await apiUploadScreenshot(file || savedFile.current);
        if (ssUrl) savedDataUrl.current = ssUrl;
      }
      log('Screenshot:', ssUrl ? 'saved to Neon' : 'none');
    } catch (e) { log('Upload error (non-critical):', e.message); }

    const res = await onDone(tx, ssUrl);
    setSubmitting(false);
    if (res && res.error) {
      log('Transaction rejected:', res.message);
      setPhase('error');
      setErrMsg(res.message || 'Transaction could not be verified.');
      return;
    }

    const finalTx = { ...tx, id: res?.transaction?.id || tx.id };
    setResult(finalTx);
    setReviewing(false);
    setPhase('success');
    if (typeof onAddDetails === 'function') {
      setTimeout(() => {
        onAddDetails(finalTx.id, finalTx);
      }, 1000);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (phase === 'processing' || phase === 'uploading') { log('Upload already in progress'); return; }
    // Reset input so same file can be re-uploaded if needed, but clear AFTER capturing file
    if (fileRef.current) fileRef.current.value = '';
    setPhase('processing'); setDebugLog([]); setReviewing(false);
    savedFile.current = file;
    savedDataUrl.current = null;
    log('File:', file.name, file.type, file.size, 'bytes');
    const metaCheck = verifyImageFileMetadata(file.name);
    if (!metaCheck.valid) {
      log('REJECTED:', metaCheck.reason);
      setPhase('error');
      setErrMsg(metaCheck.reason);
      return;
    }

    // Immediately pre-compress screenshot in background as guaranteed fallback
    try {
      apiUploadScreenshot(file).then(u => {
        if (u) { savedDataUrl.current = u; log('Screenshot pre-compressed'); }
      });
    } catch (e) { }

    // STEP 1: Canvas preprocessing
    let blob = file;
    try {
      log('Step 1: Canvas preprocessing…');
      blob = await preprocessImage(file, log);
      log('Step 1 OK');
    } catch (e) { log('Step 1 warn (using original):', e.message); }

    // STEP 2: Convert preprocessed blob to base64 for OCR.space API
    let ocrBase64 = '';
    let ocrMediaType = 'image/png';
    try {
      log('Step 2: Converting image to base64…');
      ocrBase64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = () => rej(new Error('FileReader failed'));
        reader.readAsDataURL(blob instanceof Blob ? blob : file);
      });
      // preprocessImage now outputs JPEG; original file may be JPEG or PNG
      ocrMediaType = blob instanceof Blob ? 'image/jpeg' : (file.type || 'image/jpeg');
      log('Step 2 OK: base64 length=' + ocrBase64.length);
    } catch (e) {
      log('Step 2 FAILED:', e.message);
      setPhase('error');
      setErrMsg('Could not prepare image for OCR. Please try again.');
      return;
    }

    // STEP 3: Call OCR.space Engine 3 via /api/ocr (API key stays server-side)
    let ocrText = '';
    let ocrLines = [];  // [{text, words:[{text,left,top,width,height}]}]
    try {
      log('Step 3: Calling OCR.space Engine 3…');
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (tokenStore.get() || ''),
        },
        body: JSON.stringify({ base64: ocrBase64, mediaType: ocrMediaType }),
      });
      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) {
        const msg = ocrData.error || 'OCR service error';
        log('Step 3 FAILED: ' + msg);
        // Show manual review with error context
        savedFile.current = file;
        setReview({
          amount: '', merchant: '', date: '', time: '', txnId: '',
          app: 'UPI', confidence: 0,
          missingFields: ['amount', 'merchant', 'date', 'time', 'txnId']
        });
        setReviewing(true);
        setPhase('review');
        showNotif({ type: 'error', title: 'OCR Issue', sub: 'Could not read screenshot. Please enter amount manually.' });
        return;
      }
      ocrText = ocrData.text || '';
      ocrLines = ocrData.lines || [];
      // Self-diagnostic from server (visible in Vercel function logs)
      if (ocrData._diag) {
        const d = ocrData._diag;
        const topC = d.candidates && d.candidates[0];
        log('[OCR] engine=' + d.engine
          + ' textLen=' + d.textLen
          + ' lines=' + d.lineCount
          + ' candidates=' + (d.candidates ? d.candidates.length : 0)
          + ' top=' + (topC ? ('Rs' + topC.val + '(sc=' + topC.sc + ',pat=' + topC.pat + ')') : 'none')
          + ' selected=' + (d.selected !== null && d.selected !== undefined ? d.selected : 'none')
          + ' ' + (d.reviewReason ? ('REVIEW:' + d.reviewReason) : 'AUTO'));
      }
      log('Step 3 OK: ' + ocrText.length + ' chars, ' + ocrLines.length + ' lines | preview: ' + ocrText.slice(0, 200));
    } catch (e) {
      log('Step 3 network error:', e.message);
      savedFile.current = file;
      setReview({
        amount: '', merchant: '', date: '', time: '', txnId: '',
        app: 'UPI', confidence: 0,
        missingFields: ['amount', 'merchant', 'date', 'time', 'txnId']
      });
      setReviewing(true);
      setPhase('review');
      return;
    }

    if (!ocrText.trim() && ocrLines.length === 0) {
      log('No text extracted — showing manual entry');
      savedFile.current = file;
      setReview({
        amount: '', merchant: '', date: '', time: '', txnId: '',
        app: 'UPI', confidence: 0,
        missingFields: ['amount', 'merchant', 'date', 'time', 'txnId']
      });
      setReviewing(true);
      setPhase('review');
      return;
    }

    // STEP 4: Extract amount using line-position scoring, other fields from raw text
    log('Step 4: Extracting fields…');

    // Amount: scored extraction using OCR.space line/word positions
    const amtResult = extractAmountOcrSpace(ocrLines, ocrText, log);
    log('Amount result: val=' + amtResult.amount + ' score=' + amtResult.score
      + ' review=' + amtResult.needsReview);

    // Other fields: raw text (merchant, date, time, UTR, app, bank, status)
    const extracted = extractUPIData(ocrText, log);

    // Amount from scored extraction overrides raw-text guess
    extracted.amount = amtResult.amount;
    extracted.confidence = amtResult.needsReview
      ? Math.min(extracted.confidence || 50, 40)
      : Math.max(amtResult.score, 50);

    // STEP 5: Hard validation
    if (extracted.status === 'received' || extracted.direction === 'incoming' || extracted.isReceived) {
      log('REJECTED: Received/Incoming payment screenshot (' + extracted.directionReason + ')');
      setPhase('error');
      setErrMsg('Payment Received screenshot detected. Coins are only earned when you make a payment to someone (sent / paid). Money received does not earn coins.');
      return;
    }
    if (extracted.status === 'failed') {
      setPhase('error');
      setErrMsg('This transaction failed. Only successful payments earn coins.');
      return;
    }
    if (extracted.status === 'pending') {
      setPhase('error');
      setErrMsg('Payment still pending. Upload screenshot once payment is confirmed.');
      return;
    }

    // STEP 5b: Strict 120-minute (2 hours) window check
    const winCheck = checkTransactionWindow(extracted.date, extracted.time, file?.lastModified);
    log(`120-min window check: date=${extracted.date || 'none'} time=${extracted.time || 'none'} expired=${winCheck.expired} (${winCheck.reason})`);
    if (winCheck.expired) {
      log('EXPIRED: Transaction is older than 2 hours (' + winCheck.reason + ')');
      setPhase('expired');
      return;
    }

    // STEP 5c: Anti-Tamper Validations (UTR Julian day & Status bar clock cross-check)
    if (extracted.txnId) {
      const utrCheck = verifyUpiUtrJulianDate(extracted.txnId, extracted.date);
      if (!utrCheck.valid) {
        log('REJECTED UTR check:', utrCheck.reason);
        setPhase('error');
        setErrMsg(utrCheck.reason);
        return;
      }
    }
    if (extracted.statusBarTime && extracted.time) {
      const clockCheck = verifyStatusBarVsTxTime(extracted.statusBarTime, extracted.time);
      if (!clockCheck.valid) {
        log('REJECTED clock check:', clockCheck.reason);
        setPhase('error');
        setErrMsg(clockCheck.reason);
        return;
      }
    }

    // STEP 6: Route by confidence
    savedFile.current = file;
    const needsReview = !extracted.amount || extracted.confidence < 80;
    log('Step 6: confidence=' + extracted.confidence + '% needsReview=' + needsReview);

    if (!needsReview) {
      await finaliseTx(extracted, file);
    } else {
      setReview({
        isReceived: extracted.isReceived,
        direction: extracted.direction,
        amount: extracted.amount ? String(extracted.amount) : '',
        merchant: extracted.merchant !== 'UPI Payment' ? extracted.merchant : '',
        date: extracted.date || '',
        time: extracted.time || '',
        txnId: extracted.txnId || '',
        app: extracted.app || 'UPI',
        confidence: extracted.confidence,
        missingFields: extracted.missingFields,
      });
      setReviewing(true);
      setPhase('review');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.4, ...SP.gentle }}
      style={{ position: "absolute", inset: 0, zIndex: 90, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }} />
      <motion.div style={{
        position: "relative", zIndex: 2, background: "#0A0A0C",
        borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.1)",
        maxHeight: "88vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 6 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
        </div>
        <div style={{ padding: "10px 24px 44px" }}>
          <AnimatePresence mode="wait">

            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: T.text }}>Upload UPI Screenshot</h3>
                <p style={{ margin: "0 0 18px", fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
                  Upload within 2 hours of payment to earn coins.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                  {["Google Pay (GPay)", "PhonePe", "Paytm", "BHIM", "Bank UPI Apps"].map(app => (
                    <div key={app} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>{app}</p>
                    </div>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                <Btn onClick={() => fileRef.current?.click()} full large>Choose Screenshot</Btn>
              </motion.div>
            )}

            {phase === "processing" && (
              <motion.div key="proc" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "22px 0" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 54, height: 54, borderRadius: "50%", border: `2.5px solid ${T.blue}`,
                    borderTopColor: "transparent", margin: "0 auto 18px"
                  }} />
                <h3 style={{ margin: "0 0 5px", fontSize: 18, fontWeight: 800, color: T.text }}>Verifying Transaction</h3>
                <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>AI is reading your screenshot…</p>
                {debugLog.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                    style={{
                      marginTop: 16, textAlign: "left", background: "rgba(74,158,255,0.05)",
                      borderRadius: 10, padding: "10px 12px", maxHeight: 120, overflowY: "auto"
                    }}>
                    {debugLog.slice(-6).map((l, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 10, color: T.textMute, fontFamily: "monospace", lineHeight: 1.6 }}>
                        {l}
                      </p>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase === "success" && result && (
              <motion.div key="succ" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ ...SP.bouncy }} style={{ padding: "6px 0 14px" }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, ...SP.bouncy }}
                    style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px", boxShadow: "0 0 35px rgba(74,158,255,0.45)"
                    }}>
                    <svg width="24" height="18" viewBox="0 0 26 20" fill="none">
                      <path d="M2 10L8.5 17L24 2" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <h3 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 800, color: T.text }}>Transaction Verified</h3>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: T.textSub }}>{result.merchant} · ₹{fmt(result.amount)}</p>

                  {/* Base Coins Awarded */}
                  <div style={{
                    background: "rgba(232,196,106,0.08)", border: "1px solid rgba(232,196,106,0.25)",
                    borderRadius: 14, padding: "10px 14px", marginBottom: 12
                  }}>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.gold, letterSpacing: "-0.03em" }}>+{result.coins} Coins Credited</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(232,196,106,0.7)" }}>10% Base Reward on ₹{fmt(result.amount)}</p>
                  </div>

                  {/* Bonus +5% Card Trigger */}
                  <motion.div whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onAddDetails) {
                        onAddDetails(result.id || result.txnId, result);
                      } else {
                        onClose();
                      }
                    }}
                    style={{
                      background: "linear-gradient(135deg, rgba(232,196,106,0.2) 0%, rgba(200,140,20,0.12) 100%)",
                      border: "1.5px solid rgba(232,196,106,0.45)",
                      borderRadius: 16, padding: "12px 14px", marginBottom: 14, cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(232,196,106,0.12)", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 12
                    }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: "rgba(232,196,106,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18
                    }}>
                      🎁
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#FFF" }}>Claim +5% Extra Bonus</span>
                        <span style={{ fontSize: 10, fontWeight: 800, background: "#E8C46A", color: "#000", padding: "1px 6px", borderRadius: 6 }}>
                          +${(Number(result.amount) * 0.05).toFixed(1)} COINS
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(242,242,247,0.75)" }}>
                        Add what you bought & platform used
                      </p>
                    </div>
                    <span style={{ fontSize: 16, color: T.gold }}>➔</span>
                  </motion.div>

                  {/* Details summary */}
                  <div style={{ textAlign: "left", background: T.glass, borderRadius: 12, padding: "9px 12px", marginBottom: 14 }}>
                    {[
                      ["Merchant", result.merchant],
                      ["Amount", `₹${fmt(result.amount)}`],
                      ["App", result.app || "UPI"],
                      result.txnId ? ["Ref ID", result.txnId] : null,
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} style={{
                        display: "flex", justifyContent: "space-between", padding: "4px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)"
                      }}>
                        <p style={{ margin: 0, fontSize: 11.5, color: T.textMute }}>{k}</p>
                        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: T.text }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (onAddDetails) {
                        onAddDetails(result.id || result.txnId, result);
                      } else {
                        onClose();
                      }
                    }}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 100, border: "none",
                      background: `linear-gradient(135deg, ${T.gold}, #D4A017)`,
                      color: "#000", fontSize: 14, fontWeight: 800, fontFamily: "inherit",
                      cursor: "pointer", boxShadow: "0 4px 18px rgba(232,196,106,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}>
                    <span>Add Purchase Details (+5% Bonus)</span>
                    <span>➔</span>
                  </motion.button>
                  <Btn onClick={onClose} variant="ghost" full>Done / Do Later</Btn>
                </div>
                {debugLog.length > 0 && (
                  <motion.button onClick={() => setShowDebug(d => !d)}
                    style={{
                      width: "100%", background: "none", border: "none", cursor: "pointer",
                      marginTop: 12, fontSize: 11, color: T.textMute, fontFamily: "inherit"
                    }}>
                    {showDebug ? "Hide" : "Show"} OCR Debug Log
                  </motion.button>
                )}
                {showDebug && (
                  <div style={{
                    marginTop: 8, background: "rgba(0,0,0,0.4)", borderRadius: 10,
                    padding: "10px 12px", maxHeight: 160, overflowY: "auto"
                  }}>
                    {debugLog.map((l, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 9.5, color: T.textMute, fontFamily: "monospace", lineHeight: 1.6 }}>{l}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {phase === "expired" && (
              <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%", background: "rgba(255,96,88,0.1)",
                  border: "1px solid rgba(255,96,88,0.25)", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 14px"
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke={T.error} strokeWidth="1.6" />
                    <path d="M11 6v5.5l3 2" stroke={T.error} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: T.error }}>Upload Window Expired</h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
                  You must upload within 2 hours of the transaction. This screenshot is too old.
                </p>
                <Btn onClick={() => setPhase("idle")} full>Try Another</Btn>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: "20px 0" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%", background: "rgba(255,96,88,0.1)",
                    border: "1px solid rgba(255,96,88,0.25)", display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 14px"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M11 7v6M11 15v1" stroke={T.error} strokeWidth="2" strokeLinecap="round" />
                      <circle cx="11" cy="11" r="9" stroke={T.error} strokeWidth="1.6" />
                    </svg>
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: T.text }}>Verification Failed</h3>
                </div>
                <div style={{
                  background: "rgba(255,96,88,0.06)", border: "1px solid rgba(255,96,88,0.2)",
                  borderRadius: 12, padding: "12px 14px", marginBottom: 20
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#FF9A9A", lineHeight: 1.65 }}>{errMsg}</p>
                </div>
                {debugLog.length > 0 && (
                  <>
                    <motion.button onClick={() => setShowDebug(d => !d)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        marginBottom: 8, fontSize: 11, color: T.textMute, fontFamily: "inherit"
                      }}>
                      {showDebug ? "Hide" : "Show"} Debug Log
                    </motion.button>
                    {showDebug && (
                      <div style={{
                        background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "10px 12px",
                        maxHeight: 140, overflowY: "auto", marginBottom: 16
                      }}>
                        {debugLog.map((l, i) => (
                          <p key={i} style={{ margin: 0, fontSize: 9.5, color: T.textMute, fontFamily: "monospace", lineHeight: 1.6 }}>{l}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn onClick={() => setPhase("idle")} full>Try Again</Btn>
                </div>
              </motion.div>
            )}

            {/* ── REVIEW / MANUAL ENTRY PHASE ───────────────────────────── */}
            {(phase === "review" || reviewing) && review && (
              <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ ...SP.gentle }} style={{ padding: "4px 0 12px" }}>
                {/* Header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: "rgba(232,196,106,0.12)", border: "1px solid rgba(232,196,106,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2v8l4 2" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="10" cy="10" r="8" stroke={T.gold} strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.text }}>
                        {review.confidence === 0 ? "Enter Transaction Details" : "Verify & Confirm"}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: T.gold }}>
                        {review.confidence === 0
                          ? "Could not read screenshot — please enter manually"
                          : `${review.confidence}% confident · missing: ${review.missingFields.join(', ')}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                {[
                  { key: "amount", label: "Amount (₹)", type: "number", required: true, placeholder: "e.g. 250" },
                  { key: "merchant", label: "Paid To / Merchant", type: "text", required: true, placeholder: "e.g. Swiggy" },
                  { key: "txnId", label: "Transaction / UTR ID", type: "text", required: false, placeholder: "e.g. 508123456789" },
                  { key: "date", label: "Date", type: "date", required: false, placeholder: "YYYY-MM-DD" },
                  { key: "time", label: "Time", type: "time", required: false, placeholder: "HH:MM" },
                ].map(({ key, label, type, required, placeholder }) => (
                  <div key={key} style={{ marginBottom: 11 }}>
                    <p style={{
                      margin: "0 0 5px", fontSize: 11, fontWeight: 600,
                      color: required && !review[key] ? T.error : T.textMute,
                      textTransform: "uppercase", letterSpacing: "0.07em"
                    }}>
                      {label}{required ? " *" : ""}
                    </p>
                    <input
                      type={type}
                      value={review[key] || ""}
                      onChange={e => setReview(r => ({ ...r, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{
                        width: "100%", padding: "11px 13px", borderRadius: 12,
                        border: `1.5px solid ${required && !review[key] ? "rgba(255,96,88,0.4)" : T.glassBorder}`,
                        background: T.glass, color: T.text, fontSize: 14, fontFamily: "inherit",
                        outline: "none", caretColor: T.blue, boxSizing: "border-box",
                        WebkitAppearance: "none"
                      }}
                    />
                  </div>
                ))}

                {/* App selector */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{
                    margin: "0 0 7px", fontSize: 11, fontWeight: 600, color: T.textMute,
                    textTransform: "uppercase", letterSpacing: "0.07em"
                  }}>Payment App</p>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {["GPay", "PhonePe", "Paytm", "BHIM", "UPI", "Other"].map(a => (
                      <motion.button key={a} whileTap={{ scale: 0.94 }}
                        onClick={() => setReview(r => ({ ...r, app: a }))}
                        style={{
                          padding: "7px 13px", borderRadius: 20,
                          background: review.app === a ? "rgba(74,158,255,0.15)" : T.glass,
                          border: `1px solid ${review.app === a ? T.blue : T.glassBorder}`,
                          color: review.app === a ? T.blue : T.textSub,
                          fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer"
                        }}>
                        {a}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Coins preview */}
                {review.amount && !isNaN(Number(review.amount)) && Number(review.amount) > 0 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "11px 14px", borderRadius: 12, marginBottom: 14,
                      background: "rgba(232,196,106,0.07)", border: "1px solid rgba(232,196,106,0.2)"
                    }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.gold }}>
                      You will earn: {parseFloat((Number(review.amount) * 0.10).toFixed(1))} coins
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(232,196,106,0.6)" }}>
                      10% of ₹{review.amount}
                    </p>
                  </motion.div>
                )}

                {/* Submit / Cancel */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { setPhase("idle"); setReviewing(false); setReview(null); }}
                    style={{
                      flex: 1, padding: "13px", borderRadius: 100,
                      background: T.glass, border: `1px solid ${T.glassBorder}`,
                      color: T.textSub, fontSize: 14, fontWeight: 600,
                      fontFamily: "inherit", cursor: "pointer"
                    }}>
                    Cancel
                  </motion.button>
                  <motion.button
                    disabled={!review.amount || isNaN(Number(review.amount)) || Number(review.amount) <= 0 || !review.merchant || submitting}
                    onClick={async () => {
                      if (!review.amount || isNaN(Number(review.amount)) || Number(review.amount) <= 0) { return; }
                      if (!review.merchant) { return; }
                      // Block received payments on review confirmation
                      if (review.isReceived || review.direction === 'incoming' || /received\s+from|payment\s+received|money\s+received|cashback\s+received|refund\s+received/i.test(review.merchant || '')) {
                        setPhase('error');
                        setErrMsg('Payment Received screenshot detected. Coins are only earned when you make a payment to someone (sent / paid). Money received does not earn coins.');
                        return;
                      }
                      if (review.txnId) {
                        const utrCheck = verifyUpiUtrJulianDate(review.txnId, review.date);
                        if (!utrCheck.valid) {
                          setPhase('error');
                          setErrMsg(utrCheck.reason);
                          return;
                        }
                      }
                      // Strict 2-hour window check on review confirmation
                      const winCheck = checkTransactionWindow(review.date, review.time, savedFile.current?.lastModified);
                      if (winCheck.expired) {
                        setPhase('expired');
                        return;
                      }
                      await finaliseTx({
                        amount: Number(review.amount),
                        merchant: review.merchant,
                        date: review.date || '',
                        time: review.time || '',
                        txnId: review.txnId || '',
                        app: review.app || 'UPI',
                        bank: '',
                        status: 'success',
                      }, savedFile.current || { name: 'screenshot.jpg' });
                    }}
                    whileTap={review.amount && !submitting ? { scale: 0.97 } : {}}
                    style={{
                      flex: 2, padding: "13px", borderRadius: 100, border: "none",
                      cursor: review.amount && !submitting ? "pointer" : "not-allowed",
                      background: review.amount && review.merchant && !submitting
                        ? `linear-gradient(135deg,${T.blue},${T.blueDeep})`
                        : "rgba(255,255,255,0.07)",
                      color: review.amount && review.merchant && !submitting ? "white" : "rgba(255,255,255,0.25)",
                      fontSize: 14, fontWeight: 700, fontFamily: "inherit"
                    }}>
                    {submitting ? "Processing…" : "Confirm & Earn Coins"}
                  </motion.button>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOUNDER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: "absolute", inset: 0, zIndex: 250, background: "#0A0A0C", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <p style={{ color: "#FF6058", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Dashboard Error</p>
          <p style={{ color: "rgba(242,242,247,0.6)", fontSize: 13, marginBottom: 20, maxWidth: 300 }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => { this.setState({ hasError: false }); this.props.onClose?.(); }}
            style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(74,158,255,0.2)", border: "1px solid #4A9EFF", color: "#4A9EFF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Back to App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FounderDashboard({ onClose, founderPw }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ users: [], txns: [], redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [selUser, setSelUser] = useState(null);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionMsg, setActionMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  // Rewards manager state
  const [rewards, setRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [editReward, setEditReward] = useState(null);
  const [newReward, setNewReward] = useState({ brand: "", label: "", cost_coins: "", codes: "" });
  const [editRwForm, setEditRwForm] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    try { return localStorage.getItem("pm_founder_webhook") || ""; } catch { return ""; }
  });
  const [sheetUrl, setSheetUrl] = useState(() => {
    try { return localStorage.getItem("pm_founder_sheet_url") || "https://docs.google.com/spreadsheets/u/0/"; } catch { return "https://docs.google.com/spreadsheets/u/0/"; }
  });
  const [showScriptHelp, setShowScriptHelp] = useState(false);
  const [previewTx, setPreviewTx] = useState(null);
  const [imgZoomed, setImgZoomed] = useState(false);

  useEffect(() => {
    let active = true;
    const fallbackTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 4500);

    (async () => {
      setLoading(true);
      setActionMsg("");
      try {
        if (!founderPw) { if (active) setLoading(false); return; }
        const [overview, allUsers, txns, redemptions, rw] = await Promise.all([
          apiAdminOverview(founderPw).catch(() => ({})),
          apiAdminUsers(founderPw).catch(() => []),
          apiAdminTxns(founderPw).catch(() => []),
          apiAdminRedemptions(founderPw).catch(() => []),
          apiAdminGetRewards(founderPw).catch(() => []),
        ]);
        if (!active) return;
        setData({
          overview: (overview && typeof overview === 'object' && !isErr(overview)) ? overview : {},
          users: Array.isArray(allUsers) ? allUsers : [],
          txns: Array.isArray(txns) ? txns : [],
          redemptions: Array.isArray(redemptions) ? redemptions : []
        });
        setRewards(Array.isArray(rw) ? rw : []);
      } catch (err) {
        console.error('[Founder] Load failed:', err.message);
        if (active) setActionMsg("Failed to load dashboard data. Pull to refresh.");
      } finally {
        clearTimeout(fallbackTimer);
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; clearTimeout(fallbackTimer); };
  }, [refreshKey, founderPw]);

  const refresh = () => setRefreshKey(k => k + 1);

  const users = Array.isArray(data?.users) ? data.users : [];
  const txns = Array.isArray(data?.txns) ? data.txns : [];
  const redemptions = Array.isArray(data?.redemptions) ? data.redemptions : [];
  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.occupation?.toLowerCase().includes(search.toLowerCase())
  );
  const totalSpend = txns.reduce((s, t) => s + Number(t.amount || 0), 0);
  const sumUserCoins = users.reduce((s, u) => s + Number(u.coin_balance || 0), 0);
  const sumTxnCoins = txns.reduce((s, t) => s + Number(t.total_coins || t.coins || t.base_coins || (Number(t.amount || 0) * 0.10) || 0), 0);
  const totalCoins = Math.max(sumTxnCoins, sumUserCoins, Number(data?.overview?.stats?.total_coins_issued || 0));
  const merchantMap = txns.reduce((a, t) => { const m = t.merchant || "Unknown"; a[m] = (a[m] || 0) + 1; return a; }, {});
  const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const TABS = ["overview", "users", "transactions", "redemptions", "rewards"];
  const handleTabChange = async (t) => {
    setTab(t);
    if (t === "rewards") {
      setRewardsLoading(true);
      try {
        const rw = await apiAdminGetRewards(founderPw);
        setRewards(rw || []);
      } catch (err) {
        console.error("[handleTabChange]", err.message);
      } finally {
        setRewardsLoading(false);
      }
    }
  };

  const Stat = ({ label, value, col, sub }) => (
    <div style={{ borderRadius: 15, padding: "14px 16px", background: T.glass, border: `1px solid ${T.glassBorder}` }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 21, fontWeight: 800, color: col || T.text, letterSpacing: "-0.03em" }}>{value}</p>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 10.5, color: T.textMute }}>{sub}</p>}
    </div>
  );

  const Tag = ({ label, col, bg }) => (
    <span style={{
      fontSize: 10, fontWeight: 700, color: col, background: bg,
      border: `1px solid ${col}44`, borderRadius: 20, padding: "2px 8px", flexShrink: 0
    }}>{label}</span>
  );

  // Ban / unban
  const handleBan = async (u) => {
    const banned = !u.is_banned;
    await apiFetch("/api/admin/users", { method: "PATCH", founderPw, body: { action: "ban", userId: u.id, is_banned: banned } });
    setActionMsg(`${u.name} ${banned ? "banned" : "unbanned"}.`);
    refresh();
    setSelUser(null);
  };

  // Mark / unmark demo
  const handleDemo = async (u) => {
    const demo = !u.is_demo;
    await apiFetch("/api/admin/users", { method: "PATCH", founderPw, body: { action: "demo", userId: u.id, is_demo: demo } });
    setActionMsg(`${u.name} marked as ${demo ? "demo" : "real"} user.`);
    refresh();
    setSelUser(null);
  };

  // Delete user
  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name} and all their data? This cannot be undone.`)) return;
    await apiFetch("/api/admin/users", { method: "DELETE", founderPw, body: { userId: u.id } });
    setActionMsg(`${u.name} deleted.`);
    refresh();
    setSelUser(null);
  };

  // Delete transaction
  const handleDeleteTx = async (txId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;
    try {
      const res = await apiDeleteTx(txId, founderPw);
      if (res && res.error) {
        setActionMsg("Failed to delete transaction: " + (res.message || "Unknown error"));
        return;
      }
      setTxns(prev => prev.filter(t => String(t.id) !== String(txId)));
      setActionMsg("Transaction deleted.");
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) {
      console.error("[Founder handleDeleteTx]", err);
      setActionMsg("Failed to delete transaction.");
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editUser) return;
    await apiFetch("/api/admin/users", {
      method: "PATCH", founderPw, body: {
        action: "edit", userId: editUser.id,
        name: editForm.name, age: editForm.age, occupation: editForm.occupation,
      }
    });
    setActionMsg(`${editForm.name} updated.`);
    setEditUser(null);
    refresh();
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60) return "just now"; if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`; return `${Math.floor(d / 86400)}d ago`;
  };

  const getScreenshotSrc = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  };

  const handleDownloadScreenshot = (tx) => {
    if (!tx) return;
    if (tx.id) {
      window.open(`/api/admin/screenshot?id=${tx.id}&download=1&founderPw=${encodeURIComponent(founderPw || 'BK11')}`, "_blank");
      return;
    }
    const url = tx.screenshot_url ? String(tx.screenshot_url).trim() : '';
    const safeMerchant = (tx.merchant || "UPI").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Paymint_${safeMerchant}_${tx.txn_id || tx.id || 'screenshot'}.jpg`;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const parts = url.split(",");
      const byteString = atob(parts[1] || parts[0]);
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (e) {
      console.error("Screenshot download failed:", e);
    }
  };

  const handleOpenFullScreenshot = (tx) => {
    if (!tx) return;
    const url = tx.screenshot_url ? String(tx.screenshot_url).trim() : '';
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (tx.id) {
      window.open(`/api/admin/screenshot?id=${tx.id}&founderPw=${encodeURIComponent(founderPw || 'BK11')}`, "_blank", "noopener,noreferrer");
      return;
    }
    handleDownloadScreenshot(tx);
  };

  // ── MULTI-SHEET EXPORT HELPERS ──────────────────────────────────────────────
  const computeUserAggregates = () => {
    const spendByUser = {};
    const merchantByUser = {};
    for (const t of txns) {
      const email = (t.user_email || '').toLowerCase();
      const amt = Number(t.amount || 0);
      spendByUser[email] = (spendByUser[email] || 0) + amt;
      if (!merchantByUser[email]) merchantByUser[email] = {};
      const m = (t.merchant || 'Unknown').trim();
      merchantByUser[email][m] = (merchantByUser[email][m] || 0) + amt;
    }
    return { spendByUser, merchantByUser };
  };

  const downloadMultiSheetExcel = () => {
    try {
      const { spendByUser, merchantByUser } = computeUserAggregates();

      const sheet1Headers = ["Name", "Age", "Occupation", "Mail ID", "Total Spend (₹)", "Top Spent Area", "Total Transactions", "Coins Balance", "Joined Date"];
      const sheet1Rows = users.map(u => {
        const email = (u.email || '').toLowerCase();
        const totalSpend = spendByUser[email] || 0;
        const mCounts = merchantByUser[email] || {};
        let topMerchant = 'None';
        let maxM = 0;
        for (const [m, amt] of Object.entries(mCounts)) {
          if (amt > maxM) { maxM = amt; topMerchant = m; }
        }
        return [
          u.name || "Anonymous",
          u.age || "N/A",
          u.occupation || "N/A",
          u.email || "",
          Number(totalSpend.toFixed(2)),
          topMerchant,
          txns.filter(t => (t.user_email || '').toLowerCase() === email).length,
          Number(Number(u.coin_balance || 0).toFixed(1)),
          u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-IN') : "N/A"
        ];
      });

      const sheet2Headers = ["Date Uploaded", "Time", "Payer Name", "Payee Name", "Transaction ID", "Transaction Amount (₹)", "Coins Earned", "Extra Coins Earned", "Details Provided", "Platform Used", "Bank Name", "Screenshot Link"];
      const sheet2Rows = txns.map(t => {
        let ssText = "No Screenshot";
        if (t.screenshot_url && t.screenshot_url.startsWith("http")) {
          ssText = t.screenshot_url;
        } else if (t.screenshot_url && t.screenshot_url.startsWith("data:image")) {
          ssText = `https://paymint-krish2.vercel.app/api/admin/screenshot?id=${t.id}&founderPw=${encodeURIComponent(founderPw || 'BK11')}`;
        }
        return [
          t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : (t.txn_date || ""),
          t.created_at ? new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (t.txn_time || ""),
          t.user_name || (users.find(u => u.id === t.user_id)?.name) || "Unknown",
          t.merchant || "",
          t.txn_id || "N/A",
          Number(Number(t.amount || 0).toFixed(2)),
          Number(Number(t.base_coins || t.coins || 0).toFixed(1)),
          Number(Number(t.bonus_coins || 0).toFixed(1)),
          t.purchase_note || "None",
          t.payment_app || "UPI",
          t.bank || "UPI Bank",
          ssText
        ];
      });

      // Build real binary .xlsx workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Rows]);
      const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Rows]);

      // Auto-fit column widths
      const setColWidths = (ws, data) => {
        if (!data || !data.length) return;
        const colWidths = data[0].map((_, colIdx) => {
          let maxLen = 10;
          for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
            const val = data[rowIdx][colIdx];
            if (val !== null && val !== undefined) {
              maxLen = Math.max(maxLen, String(val).length);
            }
          }
          return { wch: Math.min(maxLen + 3, 50) };
        });
        ws['!cols'] = colWidths;
      };

      setColWidths(ws1, [sheet1Headers, ...sheet1Rows]);
      setColWidths(ws2, [sheet2Headers, ...sheet2Rows]);

      XLSX.utils.book_append_sheet(wb, ws1, "Login Data");
      XLSX.utils.book_append_sheet(wb, ws2, "Transactional Data");

      // Write valid ZIP-based Office Open XML (.xlsx)
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Paymint_Master_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Export XLSX Error]', err);
      // Fallback: direct download from server route
      window.open(`/api/admin/export-xlsx?founderPw=${encodeURIComponent(founderPw || 'BK11')}`, '_blank');
    }
  };

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadLoginDataCSV = () => {
    const { spendByUser, merchantByUser } = computeUserAggregates();
    const headers = ["Name", "Age", "Occupation", "Mail ID", "Total Spend (INR)", "Top Spent Area", "Total Transactions", "Coins Balance", "Joined Date"];
    const rows = users.map(u => {
      const email = (u.email || '').toLowerCase();
      const totalSpend = spendByUser[email] || 0;
      const mCounts = merchantByUser[email] || {};
      let topMerchant = 'None';
      let maxM = 0;
      for (const [m, amt] of Object.entries(mCounts)) {
        if (amt > maxM) { maxM = amt; topMerchant = m; }
      }
      return [
        u.name || "Anonymous",
        u.age || "N/A",
        u.occupation || "N/A",
        u.email || "",
        totalSpend.toFixed(2),
        topMerchant,
        txns.filter(t => (t.user_email || '').toLowerCase() === email).length,
        Number(u.coin_balance || 0).toFixed(1),
        u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-IN') : "N/A"
      ];
    });
    downloadCSV(`paymint_login_data_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const downloadTransactionalDataCSV = () => {
    const headers = ["Date Uploaded", "Time", "Payer Name", "Payee Name", "Transaction ID", "Transaction Amount (INR)", "Coins Earned", "Extra Coins Earned", "Details Provided", "Platform Used", "Bank Name", "Screenshot Link"];
    const rows = txns.map(t => [
      t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : (t.txn_date || ""),
      t.created_at ? new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (t.txn_time || ""),
      t.user_name || (users.find(u => u.id === t.user_id)?.name) || "Unknown",
      t.merchant || "",
      t.txn_id || "N/A",
      Number(t.amount || 0).toFixed(2),
      Number(t.base_coins || t.coins || 0).toFixed(1),
      Number(t.bonus_coins || 0).toFixed(1),
      t.purchase_note || "None",
      t.payment_app || "UPI",
      t.bank || "UPI Bank",
      t.screenshot_url || "None"
    ]);
    downloadCSV(`paymint_transactional_data_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const triggerGoogleSheetsSync = async () => {
    setSyncingSheets(true);
    setSyncFeedback(null);
    try {
      if (webhookUrl && (webhookUrl.includes("drive.google.com") || webhookUrl.includes("docs.google.com/spreadsheets"))) {
        setSyncFeedback({
          type: "error",
          text: "⚠️ That is a Google Drive link, not an Apps Script Web App URL! Web App URLs look like: https://script.google.com/macros/s/.../exec (See the 1-min guide above)."
        });
        setSyncingSheets(false);
        return;
      }
      if (webhookUrl) {
        try { localStorage.setItem("pm_founder_webhook", webhookUrl.trim()); } catch { }
      }
      const res = await apiFetch("/api/admin/export", {
        method: "POST",
        founderPw,
        body: { webhookUrl: webhookUrl.trim() || undefined }
      });
      if (res && res.ok) {
        const foundSheetUrl = res.sheet_url || res.sync_result?.sheetUrl || res.sync_result?.sheet_url;
        if (foundSheetUrl) {
          setSheetUrl(foundSheetUrl);
          try { localStorage.setItem("pm_founder_sheet_url", foundSheetUrl); } catch(e){}
        }
        const msg = res.sync_result?.ok 
          ? `Successfully created & synced multi-sheet Google Sheet in your Drive folder!`
          : `Export data ready (${res.login_data?.length || 0} users, ${res.transactional_data?.length || 0} txns).`;
        setSyncFeedback({ type: "success", text: msg, sheetUrl: foundSheetUrl });
      } else {
        setSyncFeedback({ type: "error", text: res?.error || "Sync failed. Check your Webhook URL." });
      }
    } catch (err) {
      setSyncFeedback({ type: "error", text: err.message });
    } finally {
      setSyncingSheets(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
      transition={{ duration: 0.4, ...SP.gentle }}
      style={{
        position: "absolute", inset: 0, zIndex: 200, background: T.black,
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>

      {/* Edit modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px"
            }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={SP.bouncy}
              style={{
                width: "100%", borderRadius: 20, background: "#0A0A0C",
                border: "1px solid rgba(255,255,255,0.1)", padding: "24px 20px"
              }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: T.text }}>Edit User</h3>
              {[["Name", "name"], ["Age", "age"], ["Occupation", "occupation"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: T.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
                  <input value={editForm[key] || ""} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 13px", borderRadius: 10, border: `1px solid ${T.glassBorder}`,
                      background: T.glass, color: T.text, fontSize: 14, fontFamily: "inherit",
                      outline: "none", caretColor: T.blue, boxSizing: "border-box"
                    }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn onClick={() => setEditUser(null)} variant="ghost">Cancel</Btn>
                <Btn onClick={handleSaveEdit} full>Save Changes</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE SCREENSHOT PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewTx && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.94)",
              backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
              display:"flex",flexDirection:"column"}}>
            
            {/* Modal Top Bar */}
            <div style={{padding:"48px 16px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",
              borderBottom:"1px solid rgba(255,255,255,0.08)",background:"rgba(10,10,14,0.95)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <motion.button whileTap={{scale:0.88}} onClick={()=>{setPreviewTx(null);setImgZoomed(false);}}
                  style={{width:34,height:34,borderRadius:10,background:T.glass,border:`1px solid ${T.glassBorder}`,
                    display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke={T.text} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </motion.button>
                <div style={{minWidth:0}}>
                  <p style={{margin:0,fontSize:14,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {previewTx.merchant || "Payment Screenshot"}
                  </p>
                  <p style={{margin:0,fontSize:11,color:T.textSub}}>
                    ₹{fmt(previewTx.amount)} · {previewTx.user_name || previewTx.user_email || "User"}
                  </p>
                </div>
              </div>

              {/* Action buttons in header */}
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <motion.button whileTap={{scale:0.92}} onClick={()=>setImgZoomed(z=>!z)}
                  title={imgZoomed ? "Reset zoom" : "Zoom in"}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"6px 9px",borderRadius:8,
                    background:imgZoomed ? "rgba(74,158,255,0.3)" : T.glass,
                    border:`1px solid ${imgZoomed ? T.blue : T.glassBorder}`,
                    color:imgZoomed ? "#FFF" : T.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d={imgZoomed ? "M5 7h4" : "M7 5v4M5 7h4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span>{imgZoomed ? "1x" : "2x"}</span>
                </motion.button>
                <motion.button whileTap={{scale:0.92}} onClick={()=>handleDownloadScreenshot(previewTx)}
                  title="Download Image"
                  style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,
                    background:"rgba(74,158,255,0.18)",border:"1px solid rgba(74,158,255,0.4)",
                    color:T.blue,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3M8 2v9M4.5 7.5L8 11l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Save</span>
                </motion.button>
              </div>
            </div>

            {/* Transaction Info Pill Banner */}
            <div style={{padding:"8px 16px",background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.05)",
              display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,fontSize:11,color:T.textMute}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>{previewTx.user_email}</span>
              {previewTx.txn_id && <span>Txn: <code style={{color:T.blue}}>{previewTx.txn_id}</code></span>}
              <span>{timeAgo(previewTx.created_at)}</span>
            </div>

            {/* Scrollable & Pinch-zoomable image viewport */}
            <div 
              onClick={(e)=>{if(e.target === e.currentTarget){setPreviewTx(null);setImgZoomed(false);}}}
              style={{flex:1,overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",padding:14,
                background:"radial-gradient(ellipse at center, rgba(30,30,42,0.6) 0%, rgba(5,5,8,0.98) 100%)",
                cursor:"zoom-out"}}>
              <img
                src={getScreenshotSrc(previewTx.screenshot_url || `/api/admin/screenshot?id=${previewTx.id}&founderPw=${encodeURIComponent(founderPw || 'BK11')}`)}
                alt="Transaction Screenshot"
                onClick={(e)=>{e.stopPropagation();setImgZoomed(z=>!z);}}
                style={{
                  maxWidth:imgZoomed ? "none" : "100%",
                  maxHeight:imgZoomed ? "none" : "calc(100vh - 200px)",
                  width:imgZoomed ? "180%" : "auto",
                  objectFit:"contain",
                  borderRadius:12,
                  boxShadow:"0 16px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12)",
                  transition:"width 0.2s ease, max-width 0.2s ease",
                  cursor:imgZoomed ? "zoom-out" : "zoom-in"
                }}
              />
            </div>

            {/* Bottom Footer bar */}
            <div style={{padding:"12px 16px 28px",borderTop:"1px solid rgba(255,255,255,0.08)",background:"rgba(10,10,14,0.95)",
              display:"flex",gap:10,flexShrink:0}}>
              <motion.button whileTap={{scale:0.96}} onClick={()=>handleDownloadScreenshot(previewTx)}
                style={{flex:1,padding:"11px",borderRadius:12,background:"linear-gradient(135deg,#1A5FC8,#0A3A8A)",
                  border:"1px solid rgba(74,158,255,0.4)",color:"#FFF",fontSize:13,fontWeight:700,
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit"}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3M8 2v9M4.5 7.5L8 11l3.5-3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Download Screenshot</span>
              </motion.button>
              <motion.button whileTap={{scale:0.96}} onClick={()=>handleOpenFullScreenshot(previewTx)}
                style={{padding:"11px 16px",borderRadius:12,background:T.glass,border:`1px solid ${T.glassBorder}`,
                  color:T.blue,fontSize:12.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
                <span>Full View</span>
                <span>↗</span>
              </motion.button>
              <motion.button whileTap={{scale:0.96}} onClick={()=>{setPreviewTx(null);setImgZoomed(false);}}
                style={{padding:"11px 16px",borderRadius:12,background:T.glass,border:`1px solid ${T.glassBorder}`,
                  color:T.textSub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                Close
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOUNDER EXPORT & GOOGLE SHEETS MODAL ── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 250, background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center"
            }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.32, ease: "easeOut" }}
              style={{
                width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#0A0A0E",
                borderTop: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px 24px 0 0",
                padding: "20px 20px 40px", boxSizing: "border-box"
              }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#107C41", background: "rgba(16,124,65,0.15)",
                      border: "1px solid rgba(16,124,65,0.35)", borderRadius: 12, padding: "2px 8px"
                    }}>
                      Google Sheets & Drive
                    </span>
                    <span style={{ fontSize: 10.5, color: T.textMute }}>agarwalkrish400@gmail.com</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>Founder Data Export</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>
                    Multi-sheet dataset with Login & Transaction records
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowExportModal(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 10, background: T.glass, border: `1px solid ${T.glassBorder}`,
                    color: T.textMute, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                  }}>
                  ✕
                </motion.button>
              </div>

              {/* CARD 1: Direct Cloud Links */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px", marginBottom: 14
              }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, color: T.textMute, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  1. Direct Cloud Access
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <motion.a whileTap={{ scale: 0.98 }}
                    href={sheetUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
                      borderRadius: 12, background: "linear-gradient(135deg,rgba(16,124,65,0.22),rgba(16,124,65,0.08))",
                      border: "1px solid rgba(16,124,65,0.45)", textDecoration: "none", cursor: "pointer"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#107C41", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" /><path d="M4 9h16M4 15h16M10 3v18" stroke="#fff" strokeWidth="1.5" /></svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#FFF" }}>Open Google Sheet</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Sheet 1: Login Data • Sheet 2: Transactions</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: "#68D391" }}>↗</span>
                  </motion.a>

                  <motion.a whileTap={{ scale: 0.98 }}
                    href="https://drive.google.com/drive/folders/11xVnc72QGhOO0IeTmJFe7HJ0xxuxVqnb" target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
                      borderRadius: 12, background: T.glass, border: `1px solid ${T.glassBorder}`,
                      textDecoration: "none", cursor: "pointer"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(74,158,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-10 6 10H3zM9 7l6 10 6-10H9z" stroke={T.blue} strokeWidth="1.6" /></svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>Google Drive Screenshots Folder</p>
                        <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>Saved to agarwalkrish400@gmail.com</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: T.blue }}>↗</span>
                  </motion.a>
                </div>
              </div>

              {/* CARD 2: Download Multi-Sheet Excel / CSV */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px", marginBottom: 14
              }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, color: T.textMute, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  2. Offline Spreadsheet Download
                </p>
                <motion.button whileTap={{ scale: 0.98 }} onClick={downloadMultiSheetExcel}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#1A5FC8,#0A3A8A)",
                    border: "1px solid rgba(74,158,255,0.4)", color: "#FFF", fontSize: 13.5, fontWeight: 700,
                    cursor: "pointer", marginBottom: 8, fontFamily: "inherit"
                  }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3M8 2v9M4.5 7.5L8 11l3.5-3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>Download Multi-Sheet Excel (.xlsx)</span>
                </motion.button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={downloadLoginDataCSV}
                    style={{
                      padding: "9px 10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.glassBorder}`,
                      color: T.textSub, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                    }}>
                    Sheet 1 (Login CSV)
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={downloadTransactionalDataCSV}
                    style={{
                      padding: "9px 10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.glassBorder}`,
                      color: T.textSub, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                    }}>
                    Sheet 2 (Txns CSV)
                  </motion.button>
                </div>
              </div>

              {/* CARD 3: Automated Live Sync to Google Sheets & Drive */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px", marginBottom: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 11, color: T.textMute, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    3. Live Sync to Google Sheets
                  </p>
                  <button onClick={() => setShowScriptHelp(s => !s)}
                    style={{ background: "none", border: "none", color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    {showScriptHelp ? "Hide Guide" : "Setup Guide (1 min)"}
                  </button>
                </div>

                {showScriptHelp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    style={{
                      background: "rgba(74,158,255,0.05)", border: `1px solid ${T.glassBorder}`, borderRadius: 12,
                      padding: "10px 12px", marginBottom: 10, fontSize: 11.5, color: T.textSub, lineHeight: 1.6
                    }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, color: T.text }}>Automated Google Sheets & Drive Setup:</p>
                    <ol style={{ margin: 0, paddingLeft: 16 }}>
                      <li>Open <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: T.blue }}>sheets.new</a> on agarwalkrish400@gmail.com</li>
                      <li>Click <b>Extensions → Apps Script</b></li>
                      <li>Paste the code from <code style={{ color: "#68D391" }}>google_apps_script.js</code></li>
                      <li>Click <b>Deploy → New Deployment → Web app</b> (Access: Anyone)</li>
                      <li>Copy Web App URL and paste below!</li>
                    </ol>
                  </motion.div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="Paste Google Apps Script Web App URL (optional)"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.glassBorder}`,
                      background: "rgba(0,0,0,0.5)", color: T.text, fontSize: 12, fontFamily: "inherit",
                      outline: "none", boxSizing: "border-box"
                    }} />
                </div>

                <motion.button whileTap={{ scale: 0.98 }} onClick={triggerGoogleSheetsSync} disabled={syncingSheets}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "11px", borderRadius: 10, background: "rgba(16,124,65,0.25)",
                    border: "1px solid rgba(16,124,65,0.55)", color: "#68D391", fontSize: 13, fontWeight: 700,
                    cursor: syncingSheets ? "not-allowed" : "pointer", fontFamily: "inherit"
                  }}>
                  {syncingSheets ? "Syncing to Google Sheets & Drive…" : "⚡ Sync All Data to Google Sheet Now"}
                </motion.button>

                {syncFeedback && (
                  <div style={{
                    marginTop: 9, padding: "10px 12px", borderRadius: 10,
                    background: syncFeedback.type === "success" ? "rgba(16,124,65,0.15)" : "rgba(255,96,88,0.15)",
                    border: `1px solid ${syncFeedback.type === "success" ? "rgba(16,124,65,0.4)" : "rgba(255,96,88,0.4)"}`
                  }}>
                    <p style={{
                      margin: 0, fontSize: 11.5, fontWeight: 600,
                      color: syncFeedback.type === "success" ? "#68D391" : "#FF6058"
                    }}>
                      {syncFeedback.text}
                    </p>
                    {syncFeedback.sheetUrl&&(
                      <a href={syncFeedback.sheetUrl} target="_blank" rel="noopener noreferrer"
                        style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,
                          padding:"6px 12px",borderRadius:8,background:"#107C41",
                          color:"#FFF",fontSize:11.5,fontWeight:700,textDecoration:"none"}}>
                        <span>Open Created Google Sheet</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center" }}>
                <Btn onClick={() => setShowExportModal(false)} variant="ghost" full>Close</Btn>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        padding: "52px 20px 0", flexShrink: 0,
        background: "linear-gradient(to bottom,rgba(0,0,0,0.97),rgba(0,0,0,0.7),transparent)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, background: T.glass,
              border: `1px solid ${T.glassBorder}`, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
            }}>
            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
              <path d="M8 2L3 5.5l5 3.5" stroke={T.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 10, color: T.error, fontWeight: 700, letterSpacing: "0.1em" }}>FOUNDER ONLY</p>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Admin Dashboard</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowExportModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 9,
                background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.32)",
                color: T.blue, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3M8 2v9M4.5 7.5L8 11l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Export</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={refresh}
              style={{
                width: 32, height: 32, borderRadius: 9, background: T.glass, border: `1px solid ${T.glassBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M14 8A6 6 0 102 8M2 4v4h4" stroke={T.textSub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#00FF88", boxShadow: "0 0 8px #00FF88" }} />
          </div>
        </div>

        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                padding: "8px 12px", borderRadius: 10, background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.2)", marginBottom: 10
              }}>
              <p style={{ margin: 0, fontSize: 12, color: "#00FF88", fontWeight: 600 }}>{actionMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => handleTabChange(t)}
              style={{
                padding: "5px 13px", borderRadius: 20, cursor: "pointer", flexShrink: 0,
                background: tab === t ? "rgba(74,158,255,0.18)" : T.glass,
                border: `1px solid ${tab === t ? T.blue : T.glassBorder}`,
                color: tab === t ? T.blue : T.textSub,
                fontSize: 12, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize"
              }}>
              {t}{t === "users" ? ` (${users.length})` : t === "transactions" ? ` (${txns.length})` : ""}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 32px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${T.blue}`, borderTopColor: "transparent" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* OVERVIEW */}
            {tab === "overview" && (
              <motion.div key="ov" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                {/* ── PROMINENT GOOGLE SHEETS & DRIVE EXPORT CARD ── */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setShowExportModal(true)}
                  style={{
                    background: "linear-gradient(135deg, rgba(16,124,65,0.25) 0%, rgba(10,58,30,0.35) 100%)",
                    border: "1px solid rgba(16,124,65,0.55)",
                    borderRadius: 16, padding: "14px 16px", marginBottom: 16,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", boxShadow: "0 4px 20px rgba(16,124,65,0.18)"
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#107C41", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,124,65,0.4)", flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" /><path d="M4 9h16M4 15h16M10 3v18" stroke="#fff" strokeWidth="1.5" /></svg>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: "#FFF" }}>Export to Google Sheets</span>
                        <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(0,255,136,0.2)", color: "#00FF88", border: "1px solid rgba(0,255,136,0.3)", padding: "1px 6px", borderRadius: 6 }}>FOUNDER HUB</span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
                        Sheet 1: Login Data • Sheet 2: Transactions • Google Drive
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(16,124,65,0.45)", padding: "6px 12px", borderRadius: 9, color: "#68D391", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    <span>Open</span>
                    <span>➔</span>
                  </div>
                </motion.div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 16 }}>
                  <Stat label="Total Users" value={users.length} col={T.blue} sub={`${users.filter(u => !u.is_demo).length} real`} />
                  <Stat label="Transactions" value={txns.length} col={T.text} />
                  <Stat label="Total Spend" value={`₹${fmt(Math.round(totalSpend))}`} col="#68D391" />
                  <Stat label="Coins Issued" value={totalCoins.toFixed(1)} col={T.gold} />
                  <Stat label="Redemptions" value={redemptions.length} col="#FC8181" />
                  <Stat label="Avg Spend" value={users.filter(u => !u.is_demo).length ? `₹${fmt(Math.round(totalSpend / Math.max(users.filter(u => !u.is_demo).length, 1)))}` : "-"} col={T.textSub} sub="per real user" />
                </div>
                {topMerchants.length > 0 && (
                  <>
                    <p style={{ margin: "0 0 10px", fontSize: 11, color: T.textMute, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Top Merchants</p>
                    {topMerchants.map(([merchant, count], i) => (
                      <div key={merchant} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
                        borderBottom: i < topMerchants.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, background: "rgba(74,158,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10.5, fontWeight: 800, color: T.blue, flexShrink: 0
                        }}>{i + 1}</div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>{merchant}</p>
                        <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, flexShrink: 0 }}>{count} txn{count !== 1 ? "s" : ""}</p>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <motion.div key="us" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                {selUser ? (
                  /* User detail view */
                  <div>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => setSelUser(null)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 5, marginBottom: 16
                      }}>
                      <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                        <path d="M8 2L3 5.5l5 3.5" stroke={T.blue} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      All Users
                    </motion.button>

                    {/* Profile card */}
                    <div style={{
                      borderRadius: 18, padding: "18px", marginBottom: 14,
                      background: T.glass, border: `1px solid ${T.glassBorder}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: "50%",
                          background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0
                        }}>
                          {selUser.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>{selUser.name}</h3>
                            {selUser.is_banned && <Tag label="BANNED" col="#FF6058" bg="rgba(255,96,88,0.12)" />}
                            {selUser.is_demo && <Tag label="DEMO" col={T.textSub} bg="rgba(255,255,255,0.06)" />}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>{selUser.email}</p>
                        </div>
                      </div>
                      {[
                        ["Occupation", selUser.occupation], ["Age", selUser.age],
                        ["Coins", Number(selUser.coin_balance || 0).toFixed(1)],
                        ["Joined", selUser.joined_at ? new Date(selUser.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—"],
                      ].map((row, i) => (
                        <div key={row[0]} style={{
                          display: "flex", justifyContent: "space-between", padding: "9px 0",
                          borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none"
                        }}>
                          <p style={{ margin: 0, fontSize: 12.5, color: T.textMute }}>{row[0]}</p>
                          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: T.text }}>{row[1] || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                      <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => { setEditForm({ name: selUser.name, age: selUser.age, occupation: selUser.occupation }); setEditUser(selUser); }}
                        style={{
                          padding: "11px", borderRadius: 12, background: "rgba(74,158,255,0.1)",
                          border: "1px solid rgba(74,158,255,0.25)", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: T.blue, fontFamily: "inherit"
                        }}>
                        Edit Profile
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleBan(selUser)}
                        style={{
                          padding: "11px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                          background: selUser.is_banned ? "rgba(0,255,136,0.08)" : "rgba(255,96,88,0.08)",
                          border: `1px solid ${selUser.is_banned ? "rgba(0,255,136,0.25)" : "rgba(255,96,88,0.25)"}`,
                          fontSize: 13, fontWeight: 600, color: selUser.is_banned ? "#00FF88" : T.error
                        }}>
                        {selUser.is_banned ? "Unban" : "Ban User"}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleDemo(selUser)}
                        style={{
                          padding: "11px", borderRadius: 12, background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: T.textSub, fontFamily: "inherit"
                        }}>
                        {selUser.is_demo ? "Mark Real" : "Mark Demo"}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleDelete(selUser)}
                        style={{
                          padding: "11px", borderRadius: 12, background: "rgba(255,96,88,0.08)",
                          border: "1px solid rgba(255,96,88,0.2)", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: T.error, fontFamily: "inherit"
                        }}>
                        Delete User
                      </motion.button>
                    </div>

                    {/* Their transactions */}
                    <p style={{
                      margin: "0 0 10px", fontSize: 11, color: T.textMute, fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase"
                    }}>
                      Transactions ({txns.filter(t => t.user_email === selUser.email).length})
                    </p>
                    {txns.filter(t => t.user_email === selUser.email).length === 0
                      ? <p style={{ color: T.textMute, fontSize: 13 }}>No transactions yet</p>
                      : txns.filter(t => t.user_email === selUser.email).map((tx, i, arr) => (
                        <div key={tx.id} style={{
                          padding: "10px 0",
                          borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: T.text }}>{tx.merchant}</p>
                              <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{timeAgo(tx.created_at)}</p>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>₹{fmt(tx.amount)}</p>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.gold }}>+{Number(tx.total_coins || tx.coins || tx.base_coins || (Number(tx.amount || 0) * 0.10) || 0).toFixed(1)} coins</p>
                              </div>
                              <motion.button whileTap={{ scale: 0.88 }}
                                onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                                title="Delete transaction"
                                style={{
                                  background: "rgba(255,96,88,0.08)", border: "1px solid rgba(255,96,88,0.2)",
                                  borderRadius: 5, width: 18, height: 18, color: "#FF6058", fontSize: 10,
                                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                                  justifyContent: "center", padding: 0
                                }}>
                                ✕
                              </motion.button>
                            </div>
                          </div>
                          {tx.screenshot_url && (
                            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setPreviewTx(tx)}
                              style={{
                                fontSize: 10.5, fontWeight: 700, color: T.blue,
                                background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)",
                                borderRadius: 5, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4,
                                marginTop: 4, cursor: "pointer", fontFamily: "inherit"
                              }}>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
                                <circle cx="5.5" cy="6.5" r="1.5" fill="currentColor"/>
                                <path d="M15 11l-4-4-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                              </svg>
                              <span>Screenshot ↗</span>
                            </motion.button>
                          )}
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  /* User list */
                  <>
                    {/* Search */}
                    <div style={{ position: "relative", marginBottom: 12 }}>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search users…"
                        style={{
                          width: "100%", padding: "10px 14px 10px 36px", borderRadius: 12,
                          border: `1px solid ${T.glassBorder}`, background: T.glass,
                          color: T.text, fontSize: 13.5, fontFamily: "inherit",
                          outline: "none", caretColor: T.blue, boxSizing: "border-box"
                        }} />
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                        <circle cx="7" cy="7" r="5" stroke={T.textMute} strokeWidth="1.5" />
                        <path d="M11 11l3 3" stroke={T.textMute} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
                      <p style={{ margin: 0, fontSize: 12, color: T.textMute }}>
                        {filtered.length} {filtered.length === 1 ? "user" : "users"}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.gold }}>
                        Total: {totalCoins.toFixed(1)} coins
                      </p>
                    </div>
                    {filtered.length === 0
                      ? <p style={{ color: T.textMute, fontSize: 13, textAlign: "center", paddingTop: 20 }}>No users found</p>
                      : filtered.map(u => (
                        <motion.div key={u.id} whileTap={{ scale: 0.98 }} onClick={() => setSelUser(u)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                            borderRadius: 14, marginBottom: 7, cursor: "pointer",
                            background: u.is_banned ? "rgba(255,96,88,0.05)" : u.is_demo ? "rgba(255,255,255,0.02)" : T.glass,
                            border: `1px solid ${u.is_banned ? "rgba(255,96,88,0.2)" : T.glassBorder}`
                          }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                            background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 15, fontWeight: 800, color: "white", opacity: u.is_banned ? 0.5 : 1
                          }}>
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <p style={{
                                margin: 0, fontSize: 13.5, fontWeight: 700,
                                color: u.is_banned ? "rgba(242,242,247,0.4)" : T.text
                              }}>{u.name}</p>
                              {u.is_banned && <Tag label="BAN" col="#FF6058" bg="rgba(255,96,88,0.12)" />}
                              {u.is_demo && <Tag label="DEMO" col={T.textMute} bg="rgba(255,255,255,0.06)" />}
                            </div>
                            <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{u.occupation || u.email}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.gold }}>
                              {Number(u.coin_balance || 0).toFixed(1)}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: T.textMute }}>coins</p>
                          </div>
                        </motion.div>
                      ))
                    }
                  </>
                )}
              </motion.div>
            )}

            {/* TRANSACTIONS */}
            {tab === "transactions" && (
              <motion.div key="tx" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: T.textMute }}>
                    {txns.length} total · ₹{fmt(Math.round(totalSpend))} total spend · {totalCoins.toFixed(1)} coins issued
                  </p>
                  <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowExportModal(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
                      background: "rgba(16,124,65,0.18)", border: "1px solid rgba(16,124,65,0.4)",
                      color: "#68D391", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0
                    }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3M8 2v9M4.5 7.5L8 11l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>Export</span>
                  </motion.button>
                </div>
                {txns.length === 0
                  ? <p style={{ color: T.textMute, fontSize: 13, textAlign: "center", paddingTop: 32 }}>No transactions yet</p>
                  : txns.map((tx, i) => (
                    <div key={tx.id} style={{
                      padding: "11px 0",
                      borderBottom: i < txns.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{tx.merchant}</p>
                          <p style={{ margin: 0, fontSize: 11, color: T.textSub, marginTop: 1 }}>{tx.user_name} · {tx.user_email}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10.5, color: T.textMute }}>{timeAgo(tx.created_at)}</p>
                          {tx.screenshot_url && (
                            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setPreviewTx(tx)}
                              style={{
                                fontSize: 10.5, fontWeight: 700, color: T.blue,
                                background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)",
                                borderRadius: 5, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4,
                                marginTop: 4, cursor: "pointer", fontFamily: "inherit"
                              }}>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
                                <circle cx="5.5" cy="6.5" r="1.5" fill="currentColor"/>
                                <path d="M15 11l-4-4-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                              </svg>
                              <span>Screenshot ↗</span>
                            </motion.button>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>₹{fmt(tx.amount)}</p>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.gold }}>+{Number(tx.total_coins || tx.coins || tx.base_coins || (Number(tx.amount || 0) * 0.10) || 0).toFixed(1)} coins</p>
                          </div>
                          <motion.button whileTap={{ scale: 0.88 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                            title="Delete transaction"
                            style={{
                              background: "rgba(255,96,88,0.08)", border: "1px solid rgba(255,96,88,0.2)",
                              borderRadius: 5, width: 18, height: 18, color: "#FF6058", fontSize: 10,
                              fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                              justifyContent: "center", padding: 0
                            }}>
                            ✕
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </motion.div>
            )}

            {/* REDEMPTIONS */}
            {tab === "redemptions" && (
              <motion.div key="rd" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: T.textMute }}>{redemptions.length} redemptions</p>
                {redemptions.length === 0
                  ? <p style={{ color: T.textMute, fontSize: 13, textAlign: "center", paddingTop: 32 }}>No redemptions yet</p>
                  : redemptions.map((rd, i) => (
                    <div key={rd.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
                      borderBottom: i < redemptions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{rd.brand} — {rd.label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: T.textSub }}>{rd.user_email}</p>
                        <p style={{
                          margin: "4px 0 0", fontSize: 10.5, color: T.blue, fontWeight: 700,
                          background: "rgba(74,158,255,0.08)", borderRadius: 5,
                          padding: "2px 7px", display: "inline-block"
                        }}>{rd.code}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#FC8181" }}>-{rd.coins_spent}</p>
                        <p style={{ margin: 0, fontSize: 10, color: T.textMute }}>{timeAgo(rd.redeemed_at)}</p>
                      </div>
                    </div>
                  ))
                }
              </motion.div>
            )}

            {/* REWARDS MANAGER & DESIGN STUDIO */}
            {tab === "rewards" && (
              <motion.div key="rw" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <FounderRewardsTab
                  rewards={rewards}
                  rewardsLoading={rewardsLoading}
                  founderPw={founderPw}
                  onRefresh={async () => {
                    setRewardsLoading(true);
                    try {
                      const rw = await apiAdminGetRewards(founderPw);
                      setRewards(rw || []);
                    } catch (err) {
                      console.error("[FounderRewardsTab]", err.message);
                    } finally {
                      setRewardsLoading(false);
                    }
                  }}
                  onBulkAddCodes={apiAdminBulkAddCodes}
                  onManageReward={apiAdminManageReward}
                  setActionMsg={setActionMsg}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// BETA DASHBOARD — Neon PostgreSQL backend, founder 5-tap
// ══════════════════════════════════════════════════════════════════════════════
function DismissTimer({ id, onDismiss }) {
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);
  return null;
}

function BetaDashboard({ profile, onExplorePrototype, onUpdateProfile, onBetaTap, onLogout, founderPw: propFounderPw }) {
  const [tab, setTab] = useState("home");
  const [coins, setCoins] = useState(parseFloat(Number(profile.coin_balance || 0).toFixed(1)));
  const [txns, setTxns] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [notif, setNotif] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [storeRewards, setStoreRewards] = useState([]); // grouped unique brand+label from API
  const [redeemedCodes, setRedeemedCodes] = useState({}); // {brand+label: code}
  const [redeemingId, setRedeemingId] = useState(null);
  const [purchasePromptTxId, setPurchasePromptTxId] = useState(null);
  const [purchasePendingTxIds, setPurchasePendingTxIds] = useState({}); // {txId: expiresAt ISO}
  const [bonusPendingTxIds, setBonusPendingTxIds] = useState({});       // {txId: bonusCoins}
  const [purchaseInputTxId, setPurchaseInputTxId] = useState(null);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [founderOpen, setFounderOpen] = useState(() => {
    try { return window.location.search.includes('founder') || window.location.hash.includes('founder'); } catch { return false; }
  });
  const [showPwModal, setShowPwModal] = useState(false);
  const [pw, setPw] = useState("");
  const [founderPw, setFounderPw] = useState(() => {
    if (propFounderPw) return propFounderPw;
    try {
      const u = new URLSearchParams(window.location.search);
      return u.get('founder') || (window.location.hash.includes('founder') ? 'BK11' : '') || sessionStorage.getItem('pm_founder_pw') || localStorage.getItem('pm_founder_pw') || '';
    } catch { return ''; }
  });
  const isFounderUser = Boolean(founderPw && founderPw.trim());
  const [pwErr, setPwErr] = useState("");
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const notifTimer = useRef(null);

  // Founder 5-tap handler
  const handleTitleTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) { tapCount.current = 0; setShowPwModal(true); }
  };
  const handlePwSubmit = async () => {
    const clean = (pw || '').trim();
    if (clean.toUpperCase() === 'BK11') {
      setShowPwModal(false);
      setFounderPw('BK11');
      try {
        sessionStorage.setItem('pm_founder_pw', 'BK11');
        localStorage.setItem('pm_founder_pw', 'BK11');
      } catch (e) {}
      setPw("");
      setPwErr("");
      setFounderOpen(true);
      return;
    }
    const ok = await apiAdminAuth(clean);
    if (ok) {
      setShowPwModal(false);
      setFounderPw(clean);
      try {
        sessionStorage.setItem('pm_founder_pw', clean);
        localStorage.setItem('pm_founder_pw', clean);
      } catch (e) {}
      setPw("");
      setPwErr("");
      setFounderOpen(true);
    } else {
      setPwErr("Incorrect password.");
    }
  };

  // Load data — API primary, localStorage cache fallback
  useEffect(() => {
    (async () => {
      setLoadingData(true);
      try {
        // Transactions from API
        const apiTxns = await apiGetTxns();
        if (apiTxns && apiTxns.length > 0) {
          setTxns(apiTxns);
          await lc.set("beta-txns-" + profile.email, apiTxns);
        } else {
          const cached = await lc.get("beta-txns-" + profile.email);
          if (cached) setTxns(cached);
        }
        // Leaderboard
        const sbLB = await apiGetLB();
        if (sbLB && sbLB.length > 0) {
          setLeaderboard(sbLB);
        } else {
          const cachedLB = await lc.get("beta-leaderboard");
          if (cachedLB) setLeaderboard(cachedLB);
        }
        // Store rewards — group by brand+label, show unique active reward types
        const allRw = await apiGetRewards();
        // apiGetRewards() already returns grouped {brand,label,cost_coins,available}
        setStoreRewards(allRw);
      } catch (err) {
        console.error("[Dashboard] Load failed:", err.message);
        const cached = await lc.get("beta-txns-" + profile.email);
        if (cached) setTxns(cached);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [profile.email]);

  const showNotif = (n) => {
    setNotif(n);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(null), 3600);
  };

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 4000);
    return () => clearTimeout(t);
  }, [notif]);

  const handleDeleteTx = async (txId) => {
    if (!isFounderUser) {
      showNotif({ type: "error", title: "Unauthorized", sub: "Founder access required to delete transactions." });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await apiDeleteTx(txId, founderPw);
      if (res && res.error) {
        showNotif({ type: "error", title: "Delete Failed", sub: res.message || "Could not delete transaction." });
        return;
      }
      const newTxns = txns.filter(t => String(t.id) !== String(txId));
      setTxns(newTxns);
      if (res && res.coin_balance !== undefined) {
        setCoins(res.coin_balance);
        const up = { ...profile, coin_balance: res.coin_balance };
        await lc.set("beta-profile", up);
        onUpdateProfile(up);
      }
      await lc.set("beta-txns-" + profile.email, newTxns);
      showNotif({ type: "redeem", title: "Transaction Deleted", sub: "Transaction removed successfully." });
    } catch (err) {
      console.error("[handleDeleteTx]", err);
      showNotif({ type: "error", title: "Delete Failed", sub: "Could not delete transaction." });
    }
  };

  const handleSavePurchase = async () => {
    if (!purchaseNote.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const txId = purchaseInputTxId;
      const note = purchaseNote.trim();
      const targetTx = txns.find(t => String(t.id) === String(txId));
      const bonus = bonusPendingTxIds[txId] || (targetTx?.amount ? parseFloat((Number(targetTx.amount) * 0.05).toFixed(1)) : 0);
      const already = targetTx?.bonus_claimed;
      const eligible = !!bonus && !already;
      console.log("[PURCHASE] txId:", txId, "bonus eligible:", eligible, "bonus:", bonus);

      const noteResult = await apiSaveNote(txId, note);
      const actualBonus = noteResult?.bonus_coins || 0;
      const newBalance = noteResult?.coin_balance || coins;

      if (noteResult?.bonus_awarded && actualBonus > 0) {
        setCoins(newBalance);
        const up = { ...profile, coin_balance: newBalance };
        await lc.set("beta-profile", up);
        onUpdateProfile(up);
        showNotif({
          type: "earn", title: `+${actualBonus} Bonus Coins Earned!`,
          sub: "Thanks for adding your purchase details", coins: actualBonus
        });
      }

      setTxns(prev => prev.map(t =>
        String(t.id) === String(txId) ? { ...t, purchase_note: note, bonus_claimed: eligible || !!t.bonus_claimed } : t
      ));
      setPurchasePendingTxIds(prev => { const n = { ...prev }; delete n[txId]; return n; });
      setBonusPendingTxIds(prev => { const n = { ...prev }; delete n[txId]; return n; });
      try {
        const cached = await lc.get("beta-txns-" + profile.email);
        if (cached) await lc.set("beta-txns-" + profile.email,
          cached.map(t => String(t.id) === String(txId) ? { ...t, purchase_note: note, bonus_claimed: eligible || !!t.bonus_claimed } : t));
      } catch (e) { }
      setPurchaseInputTxId(null);
      setPurchaseNote("");
    } finally {
      setSavingNote(false);
    }
  };

  const handleTx = async (tx, ssUrl) => {
    try {
      // Block received payments
      if (tx.isReceived || tx.direction === 'incoming' || tx.status === 'received' || /received\s+from|payment\s+received|money\s+received|cashback\s+received|refund\s+received/i.test(tx.merchant || '')) {
        const msg = "Coins are only credited for payments made to merchants or individuals. Received payments are not eligible for coins.";
        showNotif({ type: "error", title: "Ineligible Payment", sub: msg });
        return { error: true, message: msg };
      }
      // Anti-tamper UTR check in handleTx
      if (tx.txnId) {
        const utrCheck = verifyUpiUtrJulianDate(tx.txnId, tx.date);
        if (!utrCheck.valid) {
          showNotif({ type: 'error', title: 'Verification Failed', sub: utrCheck.reason });
          return { error: true, message: utrCheck.reason };
        }
      }
      // Strict 2-hour window check
      if (tx.date || tx.time) {
        const winCheck = checkTransactionWindow(tx.date, tx.time);
        if (winCheck.expired) {
          const msg = "Upload window expired. Transactions must be uploaded within 2 hours of payment.";
          showNotif({ type: "error", title: "Window Expired", sub: msg });
          return { error: true, message: msg };
        }
      }
      // Instant client-side duplicate check against current session transactions
      const localDup = txns.find(t => {
        if (tx.txnId && t.txn_id && t.txn_id.trim() === tx.txnId.trim()) return true;
        const sameAmt = Math.abs(Number(t.amount) - Number(tx.amount)) < 0.01;
        const sameMerchant = (t.merchant || '').trim().toLowerCase() === (tx.merchant || '').trim().toLowerCase();
        if (sameAmt && sameMerchant) {
          if (tx.date && t.txn_date && tx.date === t.txn_date) return true;
          const ageHours = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 3600);
          if (ageHours < 24) return true;
        }
        return false;
      });
      if (localDup) {
        const msg = "You have already submitted this transaction.";
        showNotif({ type: "error", title: "Already Submitted", sub: msg });
        return { error: true, message: msg };
      }

      // Always recalculate coins from amount — never trust OCR-provided coin value
      const earnedCoins = parseFloat((Number(tx.amount) * 0.10).toFixed(1));
      console.log("[DASH] handleTx:", tx.merchant, "₹" + tx.amount, "→ coins:", earnedCoins);
      const newCoins = parseFloat((coins + earnedCoins).toFixed(1));

      // 1. Save to backend (server calculates and validates coins)
      const apiResult = await apiSaveTx(tx, ssUrl);
      console.log("[DASH] apiSaveTx:", apiResult?.transaction?.id || "FAILED", "coins:", apiResult?.coins_earned);
      if (apiResult?.error || apiResult?.code === "duplicate_transaction" || apiResult?.status === 409) {
        const isDup = apiResult?.code === "duplicate_transaction" || /already|duplicate/i.test(apiResult?.message || "");
        const msg = isDup ? (apiResult?.message || "This transaction was already verified.") : "Could not save transaction. Please try again.";
        showNotif({
          type: "error",
          title: isDup ? "Already Submitted" : "Save Failed",
          sub: msg
        });
        return { error: true, message: msg };
      }
      // Use server values — backend is source of truth for coins
      const serverCoins = apiResult?.coins_earned || earnedCoins;
      const serverBalance = apiResult?.coin_balance || newCoins;

      // 3. Build local tx object
      const newTx = {
        id: apiResult?.transaction?.id || `local_${Date.now()}`,
        created_at: apiResult?.transaction?.created_at || new Date().toISOString(),
        merchant: tx.merchant,
        amount: tx.amount,
        coins: serverCoins,
        base_coins: serverCoins,
        bonus_coins: 0,
        total_coins: serverCoins,
        txn_id: tx.txnId || "",
        screenshot_url: ssUrl || null,
      };

      // 4. Update local state with server balance
      const newTxns = [newTx, ...txns];
      setTxns(newTxns);
      setCoins(serverBalance);

      // 5. Update localStorage cache
      const up = { ...profile, coin_balance: serverBalance };
      await lc.set("beta-profile", up);
      await lc.set("beta-txns-" + profile.email, newTxns);
      onUpdateProfile(up);

      // 6. Refresh leaderboard
      const lb = await apiGetLB();
      if (lb && lb.length > 0) { setLeaderboard(lb); await lc.set("beta-leaderboard", lb); }

      // 7. Notification
      showNotif({
        type: "earn", title: "Transaction Verified (+10%)",
        sub: `+${serverCoins} Coins · ${tx.merchant}`, coins: serverCoins
      });

      // 8. Purchase prompt — triggers instant popup for +5% bonus coins
      const insertedId = apiResult?.transaction?.id || newTx.id;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour window
      const bonusAmt = parseFloat((Number(tx.amount) * 0.05).toFixed(1)); // 5% of payment amount (matches backend)

      setBonusPendingTxIds(prev => ({ ...prev, [insertedId]: bonusAmt }));
      setPurchasePendingTxIds(prev => ({ ...prev, [insertedId]: expiresAt }));
      setPurchasePromptTxId(insertedId);

      // Expire after 1 hour
      setTimeout(() => {
        setBonusPendingTxIds(prev => { const n = { ...prev }; delete n[insertedId]; return n; });
        setPurchasePendingTxIds(prev => { const n = { ...prev }; delete n[insertedId]; return n; });
      }, 60 * 60 * 1000);

      return { ok: true, transaction: newTx };
    } catch (err) {
      console.error("[handleTx]", err.message);
      showNotif({ type: "error", title: "Error", sub: "Could not save transaction. Please try again." });
      setPhase("upload");
    }
  };


  const timeAgo = (iso) => {
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60) return "Just now"; if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`; return `${Math.floor(d / 86400)}d ago`;
  };

  const BackBtn = ({ onClick }) => (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 10, background: T.glass, border: `1px solid ${T.glassBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
      }}>
      <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
        <path d="M8 2L3 5.5l5 3.5" stroke={T.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: T.black, overflow: "hidden" }}>

      {/* Password modal */}
      <AnimatePresence>
        {showPwModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", boxSizing: "border-box"
            }}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={SP.bouncy}
              style={{
                width: "100%", maxWidth: 320, boxSizing: "border-box", borderRadius: 22, background: "#0D0D11",
                border: "1px solid rgba(255,255,255,0.12)", padding: "24px 18px", boxShadow: "0 24px 60px rgba(0,0,0,0.9)"
              }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: T.text, textAlign: "center" }}>Enter Password</h3>
              <form onSubmit={(e) => { e.preventDefault(); handlePwSubmit(); }} style={{ width: "100%", boxSizing: "border-box", margin: 0 }}>
                <input type="password" value={pw}
                  enterKeyHint="go"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePwSubmit(); } }}
                  onChange={e => {
                    const val = e.target.value;
                    setPw(val);
                    setPwErr("");
                    if (val.trim().toUpperCase() === 'BK11') {
                      setShowPwModal(false);
                      setFounderPw('BK11');
                      setPw('');
                      setFounderOpen(true);
                    }
                  }}
                  placeholder="••••••••"
                  autoFocus
                  style={{
                    width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${T.glassBorder}`,
                    background: "rgba(255,255,255,0.05)", color: T.text, fontSize: 16, fontFamily: "inherit",
                    textAlign: "center", letterSpacing: "0.2em",
                    outline: "none", caretColor: T.blue, boxSizing: "border-box", marginBottom: 4
                  }} />
                {pwErr && <p style={{ margin: "6px 0 4px", fontSize: 12, color: T.error, textAlign: "center" }}>{pwErr}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, width: "100%", boxSizing: "border-box" }}>
                  <motion.button type="button" whileTap={{ scale: 0.96 }}
                    onClick={() => { setShowPwModal(false); setPw(""); setPwErr(""); }}
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "12px 0", borderRadius: 12, background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${T.glassBorder}`, color: T.textSub, fontSize: 14,
                      fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textAlign: "center"
                    }}>
                    Cancel
                  </motion.button>
                  <motion.button type="submit" whileTap={{ scale: 0.96 }}
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "12px 0", borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg,${T.blue},${T.blueDeep})`,
                      color: "white", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                      cursor: "pointer", textAlign: "center", boxShadow: "0 4px 14px rgba(74,158,255,0.35)"
                    }}>
                    Enter
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Founder dashboard */}
      <AnimatePresence>
        {founderOpen && (
          <ErrorBoundary onClose={() => setFounderOpen(false)}><FounderDashboard key="founder" onClose={() => setFounderOpen(false)} founderPw={founderPw} /></ErrorBoundary>
        )}
      </AnimatePresence>

      {/* â”€â”€ PURCHASE PROMPT NOTIFICATION â”€â”€ */}
      <AnimatePresence>
        {purchasePromptTxId && (
          <motion.div key={"pp" + purchasePromptTxId}
            initial={{ x: "-50%", y: -90, scale: 0.88, opacity: 0 }} animate={{ x: "-50%", y: 0, scale: 1, opacity: 1 }}
            exit={{ x: "-50%", y: -80, scale: 0.88, opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={() => { setPurchaseInputTxId(purchasePromptTxId); setPurchaseNote(""); setPurchasePromptTxId(null); }}
            style={{
              position: "absolute", top: 48, left: "50%", zIndex: 510,
              width: "calc(100% - 32px)", maxWidth: 360, cursor: "pointer"
            }}>
            <div
              style={{
                background: "rgba(10,10,14,0.96)", backdropFilter: "blur(36px)",
                border: "1px solid rgba(255,255,255,0.11)", borderRadius: 20, overflow: "hidden",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset,0 14px 50px rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center", padding: "12px 14px", gap: 12
              }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                  background: "rgba(232,196,106,0.14)", border: "1px solid rgba(232,196,106,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="9" stroke="#E8C46A" strokeWidth="1.6" />
                  <path d="M11 7v4.5l3 1.5" stroke="#E8C46A" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#F2F2F7", lineHeight: 1.2 }}>
                  Your reward is almost complete!
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#E8C46A", fontWeight: 600 }}>
                  Tell us what you bought â†’ earn +{(bonusPendingTxIds[purchasePromptTxId] || 0).toFixed(1)} bonus coins
                </p>
              </div>
              <div
                style={{
                  background: "rgba(232,196,106,0.15)", border: "1px solid rgba(232,196,106,0.35)",
                  borderRadius: 20, padding: "5px 11px", flexShrink: 0
                }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#E8C46A" }}>Add</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DismissTimer key={purchasePromptTxId || "none"} id={purchasePromptTxId}
        onDismiss={() => setPurchasePromptTxId(null)} />

      {/* ── PURCHASE INPUT SHEET — EASY WHAT & WHERE (+5% BONUS COINS) ── */}
      <AnimatePresence>
        {purchaseInputTxId && (
          <motion.div key={"pis" + purchaseInputTxId}
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.38, ...SP.gentle }}
            style={{
              position: "fixed", inset: 0, zIndex: 999, display: "flex",
              flexDirection: "column", justifyContent: "flex-end", boxSizing: "border-box"
            }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setPurchaseInputTxId(null); setPurchaseNote(""); }}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }} />
            <motion.div style={{
              position: "relative", zIndex: 2, background: "#0D0D12",
              borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.14)",
              maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)"
            }}>
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
              </div>
              <div style={{ padding: "10px 20px 20px" }}>
                {(() => {
                  const currentTx = txns.find(t => String(t.id) === String(purchaseInputTxId));
                  const bonAmt = bonusPendingTxIds[purchaseInputTxId] || (currentTx?.amount ? parseFloat((Number(currentTx.amount) * 0.05).toFixed(1)) : null);
                  const isEdit = !!currentTx?.purchase_note;
                  return (<>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, background: "rgba(232,196,106,0.18)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                        }}>
                          🎁
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#F2F2F7" }}>
                            {isEdit ? "Edit Purchase Details" : "Add Purchase Details"}
                          </h3>
                          {currentTx && <p style={{ margin: 0, fontSize: 11.5, color: T.textSub }}>
                            {currentTx.merchant} · ₹{fmt(currentTx.amount)}
                          </p>}
                        </div>
                      </div>
                      <button onClick={() => { setPurchaseInputTxId(null); setPurchaseNote(""); }}
                        style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 28, height: 28, color: T.textMute, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✕
                      </button>
                    </div>

                    {bonAmt && !isEdit ? (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
                          padding: "9px 12px", borderRadius: 14,
                          background: "linear-gradient(135deg, rgba(232,196,106,0.16), rgba(200,140,20,0.08))",
                          border: "1px solid rgba(232,196,106,0.35)"
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                            style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8C46A", flexShrink: 0 }} />
                          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#E8C46A" }}>
                            Unlock +5% Extra Coins on this purchase
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, background: "#E8C46A", color: "#000", padding: "2px 8px", borderRadius: 10 }}>
                          +{bonAmt} COINS
                        </span>
                      </motion.div>
                    ) : (
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: T.textMute, lineHeight: 1.4 }}>
                        Provide expense details to enrich your transaction history.
                      </p>
                    )}
                  </>);
                })()}

                {/* 1. Category / Item Tags */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: T.blue, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    1. What did you buy?
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {[
                      "🍕 Food & Dining", "🛒 Groceries", "🛍️ Shopping",
                      "☕ Coffee / Snacks", "🚕 Cab & Travel", "📱 Bills & Recharge",
                      "🎬 Movies & Fun", "💊 Pharmacy", "⚡ Electronics", "📦 Other"
                    ].map(tag => (
                      <motion.button key={tag} whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          const cleanTag = tag.replace(/^[^\w\s/]+/, "").trim();
                          setPurchaseNote(prev => {
                            const parts = prev ? prev.split(" · ") : [];
                            const otherParts = parts.filter(p => !p.startsWith("Item:") && !p.startsWith("What:") && !p.startsWith("Category:"));
                            return [`Category: ${cleanTag}`, ...otherParts].join(" · ");
                          });
                        }}
                        style={{
                          padding: "5px 10px", borderRadius: 16,
                          background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.22)",
                          color: "#80C4FF", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer"
                        }}>
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 2. Platform or Store used */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: T.gold, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    2. Platform / Store used
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {["Swiggy", "Zomato", "Blinkit", "Zepto", "Instamart", "Amazon", "Flipkart", "Uber", "Ola", "Offline Store", "Myntra", "BookMyShow"].map(wh => (
                      <motion.button key={wh} whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setPurchaseNote(prev => {
                            const parts = prev ? prev.split(" · ") : [];
                            const otherParts = parts.filter(p => !p.startsWith("Platform:") && !p.startsWith("Where:"));
                            return [...otherParts, `Platform: ${wh}`].join(" · ");
                          });
                        }}
                        style={{
                          padding: "5px 10px", borderRadius: 16,
                          background: "rgba(232,196,106,0.08)", border: "1px solid rgba(232,196,106,0.22)",
                          color: T.gold, fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer"
                        }}>
                        {wh}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 3. Expense Context */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#68D391", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    3. Expense Purpose
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["👤 Personal", "👥 Shared / Friends", "💼 Work / Office", "🏠 Household"].map(ctx => (
                      <motion.button key={ctx} whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          const cleanCtx = ctx.replace(/^[^\w\s/]+/, "").trim();
                          setPurchaseNote(prev => {
                            const parts = prev ? prev.split(" · ") : [];
                            const otherParts = parts.filter(p => !p.startsWith("Type:") && !p.startsWith("Purpose:"));
                            return [...otherParts, `Type: ${cleanCtx}`].join(" · ");
                          });
                        }}
                        style={{
                          padding: "5px 10px", borderRadius: 16,
                          background: "rgba(104,211,145,0.08)", border: "1px solid rgba(104,211,145,0.22)",
                          color: "#68D391", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer"
                        }}>
                        {ctx}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Purchase Note Edit Field */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: T.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    What items did you purchase?
                  </p>
                  <input autoFocus value={purchaseNote} onChange={e => setPurchaseNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSavePurchase()}
                    placeholder="e.g. Groceries, Pizza & Coke, Swiggy order, Medicine..."
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 12,
                      border: `1px solid ${purchaseNote.trim() ? T.blue : T.glassBorder}`,
                      background: "rgba(255,255,255,0.05)", color: "#F2F2F7", fontSize: 14,
                      fontFamily: "inherit", outline: "none", caretColor: T.blue,
                      boxSizing: "border-box"
                    }} />
                </div>

                {/* CTA Submit Button */}
                <motion.button disabled={!purchaseNote.trim() || savingNote}
                  onClick={handleSavePurchase}
                  whileTap={purchaseNote.trim() && !savingNote ? { scale: 0.97 } : {}}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 14, border: "none",
                    cursor: purchaseNote.trim() && !savingNote ? "pointer" : "not-allowed",
                    background: purchaseNote.trim()
                      ? `linear-gradient(135deg, ${T.gold}, #D4A017)`
                      : "rgba(255,255,255,0.08)",
                    color: purchaseNote.trim() ? "#000" : "rgba(255,255,255,0.3)",
                    fontSize: 14.5, fontWeight: 800, fontFamily: "inherit",
                    boxShadow: purchaseNote.trim() ? "0 4px 18px rgba(232,196,106,0.35)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}>
                  {savingNote ? "Saving details…" : (() => {
                    const currentTx = txns.find(t => String(t.id) === String(purchaseInputTxId));
                    const b = bonusPendingTxIds[purchaseInputTxId] || (currentTx?.amount ? parseFloat((Number(currentTx.amount) * 0.05).toFixed(1)) : null);
                    return b ? `Claim +${b} Extra Coins (5%) →` : "Save Purchase Details";
                  })()}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Island Notif */}
      <AnimatePresence>
        {notif && (
          <motion.div key={notif.title + notif.sub}
            initial={{ x: "-50%", y: -90, scale: 0.88, opacity: 0 }} animate={{ x: "-50%", y: 0, scale: 1, opacity: 1 }}
            exit={{ x: "-50%", y: -80, scale: 0.88, opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={() => setNotif(null)}
            style={{
              position: "absolute", top: 48, left: "50%", zIndex: 500,
              width: "calc(100% - 32px)", maxWidth: 360, cursor: "pointer"
            }}>
            <div
              style={{
                background: "rgba(10,10,14,0.96)", backdropFilter: "blur(36px)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, overflow: "hidden", position: "relative",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset,0 14px 50px rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center", padding: "12px 14px", gap: 12
              }}>
              <div
                style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: notif.type === "redeem" ? "rgba(232,196,106,0.14)" : "rgba(74,158,255,0.14)",
                  border: `1px solid ${notif.type === "redeem" ? "rgba(232,196,106,0.28)" : "rgba(74,158,255,0.28)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                {notif.type === "redeem"
                  ? <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.5l-4.95 2.7.95-5.5L2 6.8l5.5-.8z" fill={T.gold} fillOpacity="0.3" stroke={T.gold} strokeWidth="1.3" strokeLinejoin="round" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="none" stroke={T.blue} strokeWidth="1.4" /><text x="10" y="14" textAnchor="middle" fill={T.blue} fontSize="8.5" fontWeight="800" fontFamily="Inter,sans-serif">P</text></svg>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{notif.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textSub }}>{notif.sub}</p>
              </div>
              {notif.coins && (
                <div
                  style={{
                    background: "rgba(232,196,106,0.12)", border: "1px solid rgba(232,196,106,0.26)",
                    borderRadius: 20, padding: "4px 9px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4
                  }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: T.gold }}>+{notif.coins}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 14px",
        background: "linear-gradient(to bottom,rgba(0,0,0,0.96),rgba(0,0,0,0.7),transparent)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setMenuOpen(true)}
          style={{
            width: 36, height: 36, borderRadius: 11, background: T.glass, border: `1px solid ${T.glassBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
          }}>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <path d="M1 1h15M1 6h11M1 11h15" stroke={T.text} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </motion.button>

        {/* 5-tap founder trigger */}
        <motion.span onClick={onBetaTap || handleTitleTap}
          style={{
            fontSize: 15, fontWeight: 800, letterSpacing: "0.04em", cursor: "default",
            userSelect: "none", WebkitUserSelect: "none"
          }}>
          <span style={{ color: T.text }}>PAYMINT </span>
          <span style={{ color: T.blue }}>BETA</span>
        </motion.span>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTab("leaderboard")}
          style={{
            width: 36, height: 36, borderRadius: 11,
            background: tab === "leaderboard" ? "rgba(74,158,255,0.14)" : T.glass,
            border: `1px solid ${tab === "leaderboard" ? T.blue : T.glassBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
          }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l1.8 3.6 4 .58-2.9 2.82.68 3.98L10 11.1l-3.58 1.88.68-3.98L4.2 6.18l4-.58z"
              stroke={tab === "leaderboard" ? T.blue : T.textSub} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M7 18h6M10 14v4"
              stroke={tab === "leaderboard" ? T.blue : T.textSub} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      {/* CONTENT */}
      <div style={{
        position: "absolute", inset: 0, overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)"
      }}>
        <AnimatePresence mode="wait">

          {/* HOME */}
          {tab === "home" && (
            <motion.div key="bh" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }} style={{ padding: "0 20px 20px" }}>
              <Glow x={50} y={10} color="rgba(232,196,106,0.07)" size={380} />
              <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ...SP.gentle }}
                style={{
                  borderRadius: 24, padding: "30px 22px 26px", marginBottom: 14, textAlign: "center",
                  background: "linear-gradient(145deg,#100E00,#070500)",
                  border: "1px solid rgba(232,196,106,0.18)", position: "relative", overflow: "hidden"
                }}>
                <motion.div animate={{ opacity: [0.25, 0.55, 0.25] }} transition={{ duration: 3.5, repeat: Infinity }}
                  style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle at 50% 40%,rgba(232,196,106,0.06),transparent 65%)", pointerEvents: "none"
                  }} />
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(232,196,106,0.1)", border: "1px solid rgba(232,196,106,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"
                }}>
                  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" fill="none" stroke={T.gold} strokeWidth="1.6" />
                    <text x="14" y="19" textAnchor="middle" fill={T.gold} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">P</text>
                  </svg>
                </div>
                <p style={{ margin: "0 0 3px", fontSize: 11, color: T.textMute, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Your Coins</p>
                <motion.div key={coins} initial={{ scale: 1.12, color: "#FFE599" }} animate={{ scale: 1, color: T.gold }} transition={{ duration: 0.45, ...SP.bouncy }}>
                  <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "inherit" }}>{coins.toFixed(1)}</span>
                </motion.div>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: T.textMute }}>Paymint Coins</p>
              </motion.div>

              {/* BRAND REWARDS & CASHBACK BANNER */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ...SP.gentle }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTab("store")}
                style={{
                  borderRadius: 20, padding: "15px 16px", marginBottom: 14, cursor: "pointer",
                  background: "linear-gradient(135deg,rgba(232,196,106,0.12),rgba(74,158,255,0.08))",
                  border: "1px solid rgba(232,196,106,0.26)",
                  boxShadow: "0 8px 28px rgba(232,196,106,0.07)"
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🎁</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.gold, letterSpacing: "0.03em" }}>REWARDS & VOUCHERS</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: "rgba(74,158,255,0.14)", border: "1px solid rgba(74,158,255,0.28)", padding: "2px 8px", borderRadius: 12 }}>
                    Explore 21+ Brands →
                  </span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: T.textSub, lineHeight: 1.45 }}>
                  Redeem coins for <strong style={{ color: "#E8C46A" }}>5% returns</strong> on Amazon, Swiggy, Netflix & Spotify or <strong style={{ color: "#4A9EFF" }}>1.5% direct UPI cashback</strong>.
                </p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["Amazon", "Swiggy", "Zomato", "Netflix", "Spotify", "Blinkit", "Cashback"].map(b => (
                    <span key={b} style={{ fontSize: 10.5, fontWeight: 600, color: T.text, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 8 }}>
                      {b}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* INSTALL APP ON IOS / WEB BANNER */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...SP.gentle }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInstallModal(true)}
                style={{
                  borderRadius: 16, padding: "11px 14px", marginBottom: 14, cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: "rgba(74,158,255,0.14)",
                    border: "1px solid rgba(74,158,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: 14 }}>📲</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: T.text }}>Install Paymint on iPhone / iPad</p>
                    <p style={{ margin: 0, fontSize: 10.5, color: T.textMute }}>Add to Home Screen for fullscreen native feel</p>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: T.blue, background: "rgba(74,158,255,0.1)",
                  border: "1px solid rgba(74,158,255,0.2)", padding: "3px 8px", borderRadius: 10
                }}>
                  Guide →
                </span>
              </motion.div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.textSub }}>Recent Transactions</p>
                {txns.length > 2 && (
                  <motion.button whileTap={{ scale: 0.92 }} onClick={() => setTab("allTx")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "inherit" }}>
                    View All
                  </motion.button>
                )}
              </div>
              {loadingData ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${T.blue}`, borderTopColor: "transparent", margin: "0 auto" }} />
                </div>
              ) : txns.length === 0 ? (
                <div style={{ padding: "18px", borderRadius: 16, background: T.glass, border: `1px solid ${T.glassBorder}`, textAlign: "center", marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.textMute, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {"No transactions yet.\nUpload your first transaction to start earning coins."}
                  </p>
                </div>
              ) : txns.slice(0, 3).map((tx, i) => {
                const isPending = purchasePendingTxIds[tx.id] && new Date(purchasePendingTxIds[tx.id]) > new Date();
                const bonusAmt = bonusPendingTxIds[tx.id];
                return (
                  <motion.div key={tx.id || i} initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.06, ...SP.snappy }}
                    style={{
                      padding: "11px 0",
                      borderBottom: i < Math.min(txns.length, 3) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: T.blue }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: T.text }}>{tx.merchant}</p>
                        <p style={{ margin: 0, fontSize: 11, color: T.textMute, marginTop: 1 }}>{timeAgo(tx.created_at || tx.ts)}</p>
                        {tx.purchase_note && <p style={{
                          margin: "2px 0 0", fontSize: 11,
                          color: "rgba(242,242,247,0.4)", fontStyle: "italic",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>{tx.purchase_note}</p>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>₹{fmt(tx.amount)}</p>
                          {isFounderUser && (
                            <motion.button whileTap={{ scale: 0.88 }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                              title="Delete transaction"
                              style={{
                                background: "rgba(255,96,88,0.08)", border: "1px solid rgba(255,96,88,0.2)",
                                borderRadius: 5, width: 18, height: 18, color: "#FF6058", fontSize: 10,
                                fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", padding: 0
                              }}>
                              ✕
                            </motion.button>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.gold }}>+{tx.coins} coins</p>
                      </div>
                    </div>
                    {isPending && !tx.purchase_note && (
                      <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setPurchaseInputTxId(tx.id); setPurchaseNote(""); }}
                        style={{
                          marginTop: 8, width: "100%", padding: "9px 13px", borderRadius: 11,
                          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                          background: bonusAmt ? "rgba(232,196,106,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${bonusAmt ? "rgba(232,196,106,0.3)" : "rgba(255,255,255,0.08)"}`,
                          display: "flex", alignItems: "center", gap: 9
                        }}>
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
                          style={{
                            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                            background: bonusAmt ? "#E8C46A" : "rgba(255,255,255,0.2)"
                          }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0, fontSize: 12, fontWeight: 700,
                            color: bonusAmt ? "#E8C46A" : "rgba(242,242,247,0.3)"
                          }}>
                            {bonusAmt
                              ? `Complete Purchase Details & Earn +${bonusAmt} Bonus Coins`
                              : "Add purchase details"}
                          </p>
                          {bonusAmt && <p style={{
                            margin: "2px 0 0", fontSize: 10.5,
                            color: "rgba(232,196,106,0.6)"
                          }}>
                            Tap now · bonus expires in 1 hour
                          </p>}
                        </div>
                        {bonusAmt && <span style={{
                          fontSize: 11, fontWeight: 800, color: "#E8C46A",
                          flexShrink: 0, background: "rgba(232,196,106,0.12)",
                          border: "1px solid rgba(232,196,106,0.25)",
                          borderRadius: 20, padding: "3px 9px"
                        }}>+{bonusAmt}</span>}
                      </motion.button>
                    )}
                  </motion.div>);
              })}
            </motion.div>
          )}

          {/* ALL TRANSACTIONS */}
          {tab === "allTx" && (
            <motion.div key="alltx" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28 }} style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <BackBtn onClick={() => setTab("home")} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>All Transactions</h3>
              </div>
              {txns.length === 0
                ? <p style={{ color: T.textMute, fontSize: 13, textAlign: "center", paddingTop: 40 }}>No transactions yet</p>
                : txns.map((tx, i) => {
                  const isPending = purchasePendingTxIds[tx.id] && new Date(purchasePendingTxIds[tx.id]) > new Date();
                  const bonusAmt = bonusPendingTxIds[tx.id];
                  return (
                    <div key={tx.id || i} style={{
                      padding: "11px 0",
                      borderBottom: i < txns.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
                          background: "rgba(74,158,255,0.09)", border: "1px solid rgba(74,158,255,0.18)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: T.text }}>{tx.merchant}</p>
                          <p style={{ margin: 0, fontSize: 11, color: T.textMute, marginTop: 1 }}>
                            {(tx.txn_id || tx.txnId) ? `${tx.txn_id || tx.txnId} · ` : ""}
                            {timeAgo(tx.created_at || tx.ts)}
                          </p>
                          {tx.purchase_note && (
                            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: T.textSub, fontStyle: "italic" }}>
                              {tx.purchase_note}
                            </p>
                          )}
                          {isPending && !tx.purchase_note && (
                            <motion.button initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => { setPurchaseInputTxId(tx.id); setPurchaseNote(""); }}
                              style={{
                                marginTop: 6, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                                background: bonusAmt ? "rgba(232,196,106,0.08)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${bonusAmt ? "rgba(232,196,106,0.28)" : "rgba(255,255,255,0.07)"}`,
                                display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit"
                              }}>
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                  width: 5, height: 5, borderRadius: "50%",
                                  background: bonusAmt ? "#E8C46A" : "rgba(255,255,255,0.3)", flexShrink: 0
                                }} />
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: bonusAmt ? "#E8C46A" : "rgba(242,242,247,0.35)"
                              }}>
                                {bonusAmt ? `Add details · earn +${bonusAmt} coins` : "Add purchase details"}
                              </span>
                            </motion.button>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>₹{fmt(tx.amount)}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.gold }}>+{tx.coins}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, justifyContent: "flex-end" }}>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={() => { setPurchaseInputTxId(tx.id); setPurchaseNote(tx.purchase_note || ""); }}
                              style={{
                                background: "none", border: "none", cursor: "pointer", padding: 0,
                                fontSize: 10.5, fontWeight: 600, fontFamily: "inherit",
                                color: tx.purchase_note ? T.textMute : T.blue
                              }}>
                              {tx.purchase_note ? "Edit" : "+ Add"}
                            </motion.button>
                            {isFounderUser && (
                              <motion.button whileTap={{ scale: 0.88 }}
                                onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                                title="Delete transaction"
                                style={{
                                  background: "rgba(255,96,88,0.08)", border: "1px solid rgba(255,96,88,0.2)",
                                  borderRadius: 5, width: 18, height: 18, color: "#FF6058", fontSize: 10,
                                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                                  justifyContent: "center", padding: 0
                                }}>
                                ✕
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </motion.div>
          )}

          {/* REWARD STORE */}
          {tab === "store" && (
            <motion.div key="bs" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28 }}>
              <RewardStoreView
                coins={coins}
                totalSpend={txns.reduce((s, t) => s + Number(t.amount || 0), 0)}
                storeRewards={storeRewards}
                redeemedCodes={redeemedCodes}
                onBack={() => setTab("home")}
                onClaimReward={async (brand, label, cost_coins) => {
                  let claimed;
                  try {
                    claimed = await apiClaimReward(brand, label, cost_coins);
                  } catch (e) {
                    console.error("Redeem API error:", e);
                  }
                  const code = claimed?.code || generateSimulationCode(brand);
                  const newCoins = claimed?.coin_balance ?? Math.max(0, parseFloat((coins - cost_coins).toFixed(1)));
                  setCoins(newCoins);
                  const key = brand + "||" + label;
                  setRedeemedCodes(prev => ({ ...prev, [key]: code }));
                  const up = { ...profile, coin_balance: newCoins };
                  await lc.set("beta-profile", up);
                  onUpdateProfile(up);
                  showNotif({ type: "redeem", title: `${brand} Redeemed`, sub: `Code: ${code}` });
                  apiGetRewards().then(allRw => setStoreRewards(allRw)).catch(() => { });
                  return { code, coin_balance: newCoins };
                }}
              />
            </motion.div>
          )}

          {/* LEADERBOARD */}
          {tab === "leaderboard" && (
            <motion.div key="blb" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28 }} style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <BackBtn onClick={() => setTab("home")} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Leaderboard</h3>
              </div>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 40 }}>
                  <p style={{ margin: 0, fontSize: 13.5, color: T.textMute, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {"No rankings yet.\nBe the first to earn coins and claim the top spot."}
                  </p>
                </div>
              ) : leaderboard.map((u, i) => (
                <div key={u.id || u.email} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                  borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0, fontSize: 12, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === 0 ? "rgba(232,196,106,0.14)" : i === 1 ? "rgba(168,169,173,0.1)" : i === 2 ? "rgba(205,127,50,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i === 0 ? "rgba(232,196,106,0.22)" : i === 1 ? "rgba(168,169,173,0.14)" : i === 2 ? "rgba(205,127,50,0.14)" : T.glassBorder}`,
                    color: i === 0 ? T.gold : i === 1 ? "#A8A9AD" : i === 2 ? "#CD7F32" : T.textMute
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13.5, fontWeight: 700,
                      color: u.email === profile.email ? T.blue : T.text
                    }}>
                      {u.name}{u.email === profile.email ? " (You)" : ""}
                    </p>
                    {u.occupation && <p style={{ margin: 0, fontSize: 11, color: T.textMute }}>{u.occupation}</p>}
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: i === 0 ? T.gold : T.text, flexShrink: 0 }}>
                    {Number(u.coin_balance || u.coins || 0).toFixed(1)}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* PROFILE */}
          {tab === "profile" && (
            <motion.div key="bpr" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28 }} style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <BackBtn onClick={() => setTab("home")} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Profile</h3>
              </div>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{
                  width: 70, height: 70, borderRadius: "50%",
                  background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px", fontSize: 28, fontWeight: 800, color: "white"
                }}>
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: T.text }}>{profile.name}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: T.textSub }}>{profile.occupation}</p>
              </div>
              {[
                { l: "Name", v: profile.name }, { l: "Age", v: profile.age },
                { l: "Occupation", v: profile.occupation }, { l: "Email", v: profile.email },
                { l: "Joined", v: profile.joined_at ? new Date(profile.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "" },
                { l: "Total Coins", v: coins.toFixed(1) },
              ].map((row, i) => (
                <div key={row.l} style={{
                  display: "flex", justifyContent: "space-between", padding: "12px 0",
                  borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none"
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.textMute }}>{row.l}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{row.v}</p>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* UPLOAD */}
      <AnimatePresence>
        {uploadOpen && (
          <BetaUpload key="upload" profile={profile} onDone={handleTx} onClose={() => setUploadOpen(false)} onAddDetails={(txId) => { setUploadOpen(false); setPurchasePromptTxId(null); setPurchaseInputTxId(txId); setPurchaseNote(""); }} />
        )}
      </AnimatePresence>

      {/* MENU */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 70 }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.36, ...SP.snappy }}
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "72%", maxWidth: 280, zIndex: 71,
                background: "#09090C", borderRight: "1px solid rgba(255,255,255,0.08)"
              }}>
              <div style={{ padding: "54px 22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 24 }}>
                  <LogoBadge size={30} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>PAYMINT</span>
                </div>
                <div style={{ marginBottom: 22, padding: "12px 14px", borderRadius: 14, background: T.glass, border: `1px solid ${T.glassBorder}` }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "white", marginBottom: 7
                  }}>
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.text }}>{profile.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.blue, fontWeight: 600 }}>Beta · {coins.toFixed(1)} coins</p>
                </div>
                {[
                  { l: "Install App (iOS / Web)", ico: "download", fn: () => { setMenuOpen(false); setShowInstallModal(true); } },
                  { l: "Profile", ico: "user", fn: () => { setTab("profile"); setMenuOpen(false); } },
                  { l: "Leaderboard", ico: "trophy", fn: () => { setTab("leaderboard"); setMenuOpen(false); } },
                  { l: "Explore Prototype", ico: "grid", fn: () => { setMenuOpen(false); onExplorePrototype(); } },
                  { l: "Sign Out", ico: "logout", fn: () => { setMenuOpen(false); if (onLogout) onLogout(); }, danger: true },
                ].map(item => (
                  <motion.button key={item.l} whileTap={{ scale: 0.97 }} onClick={item.fn}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "12px 10px",
                      borderRadius: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 3,
                      textAlign: "left", fontFamily: "inherit"
                    }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: item.danger ? "rgba(255,96,88,0.08)" : T.glass,
                      border: `1px solid ${item.danger ? "rgba(255,96,88,0.2)" : T.glassBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {item.ico === "download" && <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4.5 7l3.5 3.5L11.5 7M2 12v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V12" stroke={T.blue} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      {item.ico === "user" && <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke={T.textSub} strokeWidth="1.3" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke={T.textSub} strokeWidth="1.3" strokeLinecap="round" /></svg>}
                      {item.ico === "trophy" && <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.4 2.9 3.2.47-2.3 2.25.54 3.18L8 8.75l-2.84 1.55.54-3.18L3.4 4.87l3.2-.47z" stroke={T.gold} strokeWidth="1.2" strokeLinejoin="round" /></svg>}
                      {item.ico === "grid" && <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke={T.blue} strokeWidth="1.2" /><rect x="9" y="1" width="6" height="6" rx="1.5" stroke={T.blue} strokeWidth="1.2" /><rect x="1" y="9" width="6" height="6" rx="1.5" stroke={T.blue} strokeWidth="1.2" /><rect x="9" y="9" width="6" height="6" rx="1.5" stroke={T.blue} strokeWidth="1.2" /></svg>}
                      {item.ico === "logout" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={T.error || "#ff5555"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: item.danger ? T.error : T.text }}>{item.l}</span>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginLeft: "auto" }}>
                      <path d="M3.5 2l4 3.5-4 3.5" stroke={item.danger ? T.error : T.textMute} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM NAV */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(22px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "10px 28px calc(env(safe-area-inset-bottom, 0px) + 16px)"
      }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTab("home")}
          style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, padding: "4px 12px", color: tab === "home" ? T.blue : T.textMute, fontFamily: "inherit"
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em" }}>Home</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setUploadOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", fontFamily: "inherit" }}>
          <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.9 }}
            animate={{ boxShadow: ["0 0 22px rgba(74,158,255,0.35)", "0 0 40px rgba(74,158,255,0.58)", "0 0 22px rgba(74,158,255,0.35)"] }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
            style={{
              width: 54, height: 54, borderRadius: "50%",
              background: `linear-gradient(145deg,${T.blue},${T.blueDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: -4
            }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTab("store")}
          style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, padding: "4px 12px", color: tab === "store" ? T.blue : T.textMute, fontFamily: "inherit"
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em" }}>Rewards</span>
        </motion.button>
      </div>

      {/* ── IOS INSTALL GUIDE MODAL ── */}
      <AnimatePresence>
        {showInstallModal && (
          <IOSInstallModal onClose={() => setShowInstallModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IOS / MOBILE APP INSTALL GUIDE MODAL
// ══════════════════════════════════════════════════════════════════════════════
function IOSInstallModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent || "");

  const handleCopyLink = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) { }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 14, opacity: 0 }}
        transition={SP.bouncy}
        style={{
          width: "100%",
          maxWidth: 360,
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
          borderRadius: 26,
          background: "linear-gradient(145deg, #13131A, #08080C)",
          border: "1px solid rgba(255,255,255,0.14)",
          padding: "24px 20px 20px",
          boxShadow: "0 28px 70px rgba(0,0,0,0.95), 0 0 50px rgba(74,158,255,0.14)",
          position: "relative",
        }}
      >
        {/* Header Icon + Title */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: `linear-gradient(145deg, ${T.blue}, ${T.blueDeep})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 8px 26px rgba(74,158,255,0.35)",
            }}
          >
            <LogoMark size={32} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 16,
              background: "rgba(74,158,255,0.12)",
              border: "1px solid rgba(74,158,255,0.25)",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: "0.03em" }}>
              {isIOS ? " Apple iOS / iPadOS App" : "📱 Mobile Web App (PWA)"}
            </span>
          </div>

          <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
            Install Paymint
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, lineHeight: 1.45 }}>
            {isIOS
              ? "Follow these 2 simple steps in Safari to add Paymint to your iPhone home screen."
              : "Install Paymint directly on your device for instant launch and offline support."}
          </p>
        </div>

        {/* 3 Step-by-Step Instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {/* Step 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 15,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(74,158,255,0.14)",
                border: "1px solid rgba(74,158,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 800,
                color: T.blue,
              }}
            >
              1
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.text }}>
                Tap the <strong style={{ color: "#80C4FF" }}>Share Button</strong>
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, lineHeight: 1.4 }}>
                At the bottom toolbar of Safari, tap the Share icon (
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "1px 5px",
                    borderRadius: 4,
                    color: "white",
                  }}
                >
                  ⎋
                </span>{" "}
                square with arrow pointing up).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 15,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(232,196,106,0.14)",
                border: "1px solid rgba(232,196,106,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 800,
                color: T.gold,
              }}
            >
              2
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.text }}>
                Select <strong style={{ color: "#FFE599" }}>"Add to Home Screen"</strong>
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, lineHeight: 1.4 }}>
                Scroll down in the share sheet and tap the{" "}
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "1px 5px",
                    borderRadius: 4,
                    color: "white",
                  }}
                >
                  ➕ Add to Home Screen
                </span>{" "}
                option.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 15,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(104,211,145,0.14)",
                border: "1px solid rgba(104,211,145,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 800,
                color: "#68D391",
              }}
            >
              3
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.text }}>
                Tap <strong style={{ color: "#9AE6B4" }}>"Add"</strong> in top right
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, lineHeight: 1.4 }}>
                The Paymint app will appear on your iPhone screen with full-screen native mode!
              </p>
            </div>
          </div>
        </div>

        {/* Why Install Banner */}
        <div
          style={{
            padding: "11px 13px",
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(74,158,255,0.08), rgba(232,196,106,0.06))",
            border: "1px solid rgba(74,158,255,0.18)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>App Benefits</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              "⚡ Zero browser URL bars",
              "🔔 Push notification alerts",
              "🚀 1-tap instant launch",
              "🔒 Bank-grade encrypted",
            ].map((perk) => (
              <p key={perk} style={{ margin: 0, fontSize: 10.5, color: T.textSub }}>
                {perk}
              </p>
            ))}
          </div>
        </div>

        {/* Copy Link Helper (if inside in-app browser) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCopyLink}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: copied ? "rgba(104,211,145,0.15)" : "rgba(255,255,255,0.06)",
              color: copied ? "#68D391" : T.text,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>{copied ? "✓ App URL Copied!" : "🔗 Copy App Link to open in Safari"}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(74,158,255,0.35)",
            }}
          >
            Got It
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION PERMISSION MODAL — (Recommended by Krish)
// ══════════════════════════════════════════════════════════════════════════════
function NotificationPermissionModal({ onClose }) {
  const handleAllow = async (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        Notification.requestPermission().catch(() => { });
      }
    } catch (err) { }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("paymint_notif_allowed", "true");
        localStorage.setItem("paymint_notif_prompted", "true");
      }
    } catch (err) { }
    onClose();
  };

  const handleDismiss = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("paymint_notif_prompted", "true");
      }
    } catch (err) { }
    onClose();
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
        touchAction: "manipulation",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 340,
          boxSizing: "border-box",
          borderRadius: 24,
          background: "linear-gradient(145deg, #121217, #0A0A0E)",
          border: "1px solid rgba(255,255,255,0.15)",
          padding: "26px 20px 22px",
          textAlign: "center",
          boxShadow: "0 24px 60px rgba(0,0,0,0.95), 0 0 40px rgba(74,158,255,0.15)",
          position: "relative",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        {/* Glow ambient background */}
        <div
          style={{
            position: "absolute",
            top: -30,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(74,158,255,0.15)",
            filter: "blur(36px)",
            pointerEvents: "none",
          }}
        />

        {/* Bell Icon */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(74,158,255,0.2), rgba(232,196,106,0.12))",
            border: "1px solid rgba(74,158,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 8px 24px rgba(74,158,255,0.2)",
            pointerEvents: "none",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke={T.blue}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 01-3.46 0"
              stroke={T.gold}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
          Allow Notifications
        </h3>

        {/* Recommendation Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 11px",
            borderRadius: 20,
            background: "rgba(232,196,106,0.14)",
            border: "1px solid rgba(232,196,106,0.3)",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.02em" }}>
            [Recommended by Krish]
          </span>
        </div>

        {/* Description */}
        <p style={{ margin: "0 0 20px", fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>
          Get instant alerts when you earn coins on UPI spends, unlock monthly cashback, and receive voucher codes.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%", boxSizing: "border-box" }}>
          <button
            type="button"
            onClick={handleAllow}
            onTouchEnd={handleAllow}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(74,158,255,0.38)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
          >
            Allow Notifications
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            onTouchEnd={handleDismiss}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 0",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: T.textSub,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — God Mode & Universal 5-Tap Founder Access
// ══════════════════════════════════════════════════════════════════════════════
const getStoredProfile = () => {
  try {
    const raw = localStorage.getItem('beta-profile') ||
      sessionStorage.getItem('beta-profile') ||
      localStorage.getItem('pm_profile') ||
      localStorage.getItem('paymint_user') ||
      getCookie('beta-profile') ||
      getCookie('pm_profile');
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && (parsed.email || parsed.id)) return parsed;
    }
    const savedEmail = localStorage.getItem('pm_user_email') ||
      sessionStorage.getItem('pm_user_email') ||
      getCookie('pm_user_email');
    if (savedEmail && typeof savedEmail === 'string' && savedEmail.includes('@')) {
      const namePart = savedEmail.split('@')[0].replace(/[._-]/g, ' ');
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return { email: savedEmail.trim(), name, coin_balance: 0 };
    }
  } catch (e) { }
  return null;
};

export default function Paymint() {
  const initialProfile = getStoredProfile();
  const [appMode, setAppMode] = useState(() => (initialProfile?.email ? "beta" : "select_pending"));
  const [betaStep, setBetaStep] = useState(() => (initialProfile?.email ? "dashboard" : "profile"));
  const [betaProfile, setBetaProfile] = useState(() => initialProfile);
  const [screen, setScreen] = useState(0);
  const [userName, setUserName] = useState(() => (initialProfile?.name?.split(" ")[0] || "Friend"));
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Global 5-tap founder state
  const [founderOpen, setFounderOpen] = useState(() => {
    try { return window.location.search.includes('founder') || window.location.hash.includes('founder'); } catch { return false; }
  });
  const [showPwModal, setShowPwModal] = useState(false);
  const [pw, setPw] = useState("");
  const [founderPw, setFounderPw] = useState(() => {
    try {
      const u = new URLSearchParams(window.location.search);
      return u.get('founder') || (window.location.hash.includes('founder') ? 'BK11' : '') || sessionStorage.getItem('pm_founder_pw') || localStorage.getItem('pm_founder_pw') || '';
    } catch { return ''; }
  });
  const [pwErr, setPwErr] = useState("");
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const handleLogout = async () => {
    tokenStore.del();
    await lc.del("beta-profile");
    try {
      localStorage.removeItem("pm_user_email");
      sessionStorage.removeItem("pm_user_email");
      delCookie("pm_user_email");
      localStorage.removeItem("pm_profile");
      localStorage.removeItem("paymint_user");
      localStorage.removeItem("pm_founder_pw");
      sessionStorage.removeItem("pm_founder_pw");
    } catch (e) { }
    setBetaProfile(null);
    setFounderPw("");
    setAppMode("select_pending");
    setBetaStep("profile");
  };

  const triggerFounder5Tap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setShowPwModal(true);
    }
  };

  const handlePwSubmit = async () => {
    const clean = (pw || '').trim();
    if (clean.toUpperCase() === 'BK11') {
      setShowPwModal(false);
      setFounderPw('BK11');
      try {
        sessionStorage.setItem('pm_founder_pw', 'BK11');
        localStorage.setItem('pm_founder_pw', 'BK11');
      } catch (e) {}
      setPw("");
      setPwErr("");
      setFounderOpen(true);
      return;
    }
    const ok = await apiAdminAuth(clean);
    if (ok) {
      setShowPwModal(false);
      setFounderPw(clean);
      try {
        sessionStorage.setItem('pm_founder_pw', clean);
        localStorage.setItem('pm_founder_pw', clean);
      } catch (e) {}
      setPw("");
      setPwErr("");
      setFounderOpen(true);
    } else {
      setPwErr("Incorrect password.");
    }
  };

  const V = { initial: { opacity: 0, x: 44, scale: 0.97 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -44, scale: 0.97 } };
  const D = { initial: { opacity: 0, scale: 0.96, filter: "blur(6px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, exit: { opacity: 0, scale: 1.02, filter: "blur(3px)" } };
  const go = n => setScreen(n);

  useEffect(() => {
    (async () => {
      try {
        let profile = await lc.get("beta-profile");
        if (!profile) profile = getStoredProfile();
        const savedEmail = profile?.email || localStorage.getItem('pm_user_email') || getCookie('pm_user_email');
        const token = tokenStore.get();
        console.log("[ROOT] session restore - profile:", profile?.email || "none", "token:", token ? "YES" : "NO", "savedEmail:", savedEmail || "none");

        if (profile && profile.email) {
          setBetaProfile(profile);
          setUserName(profile.name?.split(" ")[0] || "Friend");
          setAppMode("beta");
          setBetaStep("dashboard");
        }

        // Auto-heal / Silent refresh from API
        if (token) {
          apiGetMe().then(async fresh => {
            if (fresh && !fresh.error && fresh.email) {
              const merged = { ...(profile || {}), ...fresh };
              await lc.set("beta-profile", merged);
              setBetaProfile(merged);
              setUserName(merged.name?.split(" ")[0] || "Friend");
              setAppMode("beta");
              setBetaStep("dashboard");
            } else if (savedEmail) {
              // Token expired, silently re-login with saved email
              const reUser = await apiLogin(savedEmail);
              if (reUser && !reUser.error && reUser.email) {
                await lc.set("beta-profile", reUser);
                setBetaProfile(reUser);
                setUserName(reUser.name?.split(" ")[0] || "Friend");
                setAppMode("beta");
                setBetaStep("dashboard");
              }
            }
          }).catch(async () => {
            if (savedEmail) {
              const reUser = await apiLogin(savedEmail).catch(() => null);
              if (reUser && !reUser.error && reUser.email) {
                await lc.set("beta-profile", reUser);
                setBetaProfile(reUser);
                setUserName(reUser.name?.split(" ")[0] || "Friend");
              }
            }
          });
        } else if (savedEmail) {
          // Token missing but user email remembered — seamlessly log in
          apiLogin(savedEmail).then(async fresh => {
            if (fresh && !fresh.error && fresh.email) {
              await lc.set("beta-profile", fresh);
              setBetaProfile(fresh);
              setUserName(fresh.name?.split(" ")[0] || "Friend");
              setAppMode("beta");
              setBetaStep("dashboard");
            }
          }).catch(() => { });
        } else if (!profile?.email) {
          setAppMode("select_pending");
        }
      } catch (err) {
        console.error("[Root] Startup sync:", err.message);
      }

      // Check notification permission prompt
      setTimeout(() => {
        try {
          const prompted = localStorage.getItem("paymint_notif_prompted");
          if (!prompted) {
            setShowNotifPrompt(true);
          }
        } catch (e) { }
      }, 900);
    })();
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100dvh", minHeight: "-webkit-fill-available", background: T.black,
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      overflow: "hidden", position: "relative", maxWidth: 430, margin: "0 auto",
      touchAction: "manipulation",
      paddingBottom: "env(safe-area-inset-bottom, 0px)"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        html,body{
          background:#000;
          height:100%;
          min-height:100vh;
          min-height:-webkit-fill-available;
          min-height:100dvh;
          -webkit-text-size-adjust:100%;
          -webkit-font-smoothing:antialiased;
          -moz-osx-font-smoothing:grayscale;
          overscroll-behavior:none;
          touch-action:manipulation;
        }
        #root{
          min-height:100vh;
          min-height:-webkit-fill-available;
          min-height:100dvh;
        }
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.28);}
        input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;}
        ::-webkit-scrollbar{display:none;}
        *{-webkit-touch-callout:none;}
        input,textarea,select{
          -webkit-appearance:none;
          -moz-appearance:none;
          appearance:none;
          font-size:16px !important;
          touch-action:manipulation;
        }
        div,main,section{
          -webkit-overflow-scrolling:touch;
        }
      `}</style>

      <AnimatePresence mode="wait">

        {appMode === "loading" && (
          <motion.div key="ld" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{
              position: "absolute", inset: 0, background: T.black,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1, 0.95] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <LogoBadge size={52} />
            </motion.div>
          </motion.div>
        )}

        {(appMode === "select_pending" || appMode === "select") && (
          <motion.div key="sel-wrap" variants={D} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.4 }} style={{ position: "absolute", inset: 0 }}>
            <AnimatePresence mode="wait">
              {appMode === "select_pending" && (
                <motion.div key="intro-sp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.03, filter: "blur(4px)" }} transition={{ duration: 0.4 }}
                  style={{ position: "absolute", inset: 0 }}>
                  <IntroScreen onNext={() => setAppMode("select")} onBetaTap={triggerFounder5Tap} />
                </motion.div>
              )}
              {appMode === "select" && (
                <motion.div key="exp-sel" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ...SP.gentle }}
                  style={{ position: "absolute", inset: 0 }}>
                  <ExperienceSelect
                    onBeta={() => { setAppMode("beta"); setBetaStep("profile"); }}
                    onPrototype={() => { setAppMode("prototype"); go(1); }}
                    onBetaTap={triggerFounder5Tap}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {appMode === "beta" && (
          <motion.div key="beta-wrap" variants={D} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.45 }} style={{ position: "absolute", inset: 0 }}>
            <AnimatePresence mode="wait">
              {betaStep === "profile" && (
                <motion.div key="bp" variants={V} initial="initial" animate="animate" exit="exit"
                  transition={SP.gentle} style={{ position: "absolute", inset: 0 }}>
                  <BetaProfileSetup
                    onDone={(p, isNew) => { setBetaProfile(p); setUserName(p.name?.split(" ")[0] || "Friend"); setAppMode("beta"); setBetaStep(isNew ? "how" : "dashboard"); }}
                    onBetaTap={triggerFounder5Tap}
                  />
                </motion.div>
              )}
              {betaStep === "how" && (
                <motion.div key="bhow" variants={V} initial="initial" animate="animate" exit="exit"
                  transition={SP.gentle} style={{ position: "absolute", inset: 0 }}>
                  <BetaHowCards onStart={() => setBetaStep("dashboard")} />
                </motion.div>
              )}
              {betaStep === "dashboard" && betaProfile && (
                <motion.div key="bdash" variants={D} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.6, ...SP.slow }} style={{ position: "absolute", inset: 0 }}>
                  <BetaDashboard
                    profile={betaProfile}
                    onExplorePrototype={() => { setAppMode("prototype"); go(1); }}
                    onUpdateProfile={(p) => setBetaProfile(p)}
                    onBetaTap={triggerFounder5Tap}
                    onLogout={handleLogout}
                    founderPw={founderPw}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {appMode === "prototype" && (
          <motion.div key="proto-wrap" variants={D} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.45 }} style={{ position: "absolute", inset: 0 }}>
            <StepBar current={screen} />
            <AnimatePresence mode="wait">
              {screen === 0 && (<motion.div key="i" variants={V} initial="initial" animate="animate" exit="exit" transition={SP.gentle} style={{ position: "absolute", inset: 0 }}><IntroScreen onNext={() => go(1)} onBetaTap={triggerFounder5Tap} /></motion.div>)}
              {screen === 1 && (<motion.div key="a" variants={V} initial="initial" animate="animate" exit="exit" transition={SP.gentle} style={{ position: "absolute", inset: 0 }}><AccountScreen onNext={n => { setUserName(n); go(2); }} /></motion.div>)}
              {screen === 2 && (<motion.div key="c" variants={V} initial="initial" animate="animate" exit="exit" transition={SP.gentle} style={{ position: "absolute", inset: 0 }}><ConnectScreen onNext={() => go(3)} /></motion.div>)}
              {screen === 3 && (<motion.div key="l" variants={V} initial="initial" animate="animate" exit="exit" transition={SP.gentle} style={{ position: "absolute", inset: 0 }}><LoadingScreen onDone={() => go(4)} /></motion.div>)}
              {screen === 4 && (<motion.div key="w" variants={V} initial="initial" animate="animate" exit="exit" transition={SP.gentle} style={{ position: "absolute", inset: 0 }}><WelcomeScreen userName={userName} onNext={() => go(5)} /></motion.div>)}
              {screen === 5 && (<motion.div key="o" variants={V} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }} style={{ position: "absolute", inset: 0 }}><OnboardingCards onDone={() => go(6)} /></motion.div>)}
              {screen === 6 && (<motion.div key="d" variants={D} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.7, ...SP.slow }} style={{ position: "absolute", inset: 0 }}><DashboardScreen userName={userName} onBetaTap={triggerFounder5Tap} /></motion.div>)}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── NOTIFICATION PERMISSION PROMPT ON START ── */}
      <AnimatePresence>
        {showNotifPrompt && (
          <NotificationPermissionModal onClose={() => setShowNotifPrompt(false)} />
        )}
      </AnimatePresence>

      {/* ── GLOBAL PASSWORD MODAL (Triggered only by 5-tap on BETA / LOGO) ── */}
      <AnimatePresence>
        {showPwModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={SP.bouncy}
              style={{
                width: "100%",
                maxWidth: 320,
                boxSizing: "border-box",
                borderRadius: 22,
                background: "#0D0D11",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "24px 18px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: T.text, textAlign: "center" }}>
                Enter Password
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePwSubmit();
                }}
                style={{ width: "100%", boxSizing: "border-box", margin: 0 }}
              >
                <input type="password" value={pw}
                  enterKeyHint="go"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePwSubmit(); } }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPw(val);
                    setPwErr("");
                    if (val.trim().toUpperCase() === 'BK11') {
                      setShowPwModal(false);
                      setFounderPw('BK11');
                      setPw('');
                      setFounderOpen(true);
                    }
                  }}
                  placeholder="••••••••"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: 12,
                    border: `1px solid ${T.glassBorder}`,
                    background: "rgba(255,255,255,0.05)",
                    color: T.text,
                    fontSize: 16,
                    fontFamily: "inherit",
                    textAlign: "center",
                    letterSpacing: "0.2em",
                    outline: "none",
                    caretColor: T.blue,
                    boxSizing: "border-box",
                    marginBottom: 4,
                  }}
                />
                {pwErr && (
                  <p style={{ margin: "6px 0 4px", fontSize: 12, color: T.error, textAlign: "center" }}>
                    {pwErr}
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, width: "100%", boxSizing: "border-box" }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setShowPwModal(false);
                      setPw("");
                      setPwErr("");
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 0",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${T.glassBorder}`,
                      color: T.textSub,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 0",
                      borderRadius: 12,
                      border: "none",
                      background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
                      color: "white",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: "0 4px 16px rgba(74,158,255,0.35)",
                    }}
                  >
                    Enter
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GLOBAL FOUNDER DASHBOARD ── */}
      <AnimatePresence>
        {founderOpen && (
          <ErrorBoundary onClose={() => setFounderOpen(false)}><FounderDashboard key="founder" onClose={() => setFounderOpen(false)} founderPw={founderPw} /></ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  );
}