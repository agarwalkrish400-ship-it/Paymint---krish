import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Design tokens matching Paymint
const T = {
  blue: "#4A9EFF",
  blueDim: "#2E7FE0",
  blueDeep: "#1A5FC8",
  blueGlow: "rgba(74,158,255,0.18)",
  gold: "#E8C46A",
  goldDim: "#C59B27",
  black: "#000000",
  glass: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassActive: "rgba(74,158,255,0.08)",
  text: "#F2F2F7",
  textSub: "rgba(242,242,247,0.52)",
  textMute: "rgba(242,242,247,0.30)",
  error: "#FF6058",
  green: "#00FF88",
  greenGlow: "rgba(0,255,136,0.15)",
};

const SP = {
  gentle: { type: "spring", stiffness: 120, damping: 20 },
  bouncy: { type: "spring", stiffness: 360, damping: 22 },
  snappy: { type: "spring", stiffness: 300, damping: 28 },
};

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND METADATA & STYLES
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND_META = {
  Amazon: {
    name: "Amazon",
    tagline: "Pay & Shopping Vouchers",
    primary: "#FF9900",
    secondary: "#146EB4",
    bgGradient: "linear-gradient(135deg, rgba(255,153,0,0.16), rgba(20,110,180,0.08))",
    borderColor: "rgba(255,153,0,0.3)",
    category: "Shopping",
    badge: "5% Return",
  },
  Swiggy: {
    name: "Swiggy",
    tagline: "Food & Swiggy One Subscriptions",
    primary: "#FC8019",
    secondary: "#FFA048",
    bgGradient: "linear-gradient(135deg, rgba(252,128,25,0.18), rgba(255,160,72,0.06))",
    borderColor: "rgba(252,128,25,0.32)",
    category: "Food & Dining",
    badge: "5% Return",
  },
  Zomato: {
    name: "Zomato",
    tagline: "Dining & Zomato Gold Pass",
    primary: "#E23744",
    secondary: "#CB202D",
    bgGradient: "linear-gradient(135deg, rgba(226,55,68,0.18), rgba(203,32,45,0.06))",
    borderColor: "rgba(226,55,68,0.32)",
    category: "Food & Dining",
    badge: "5% Return",
  },
  Blinkit: {
    name: "Blinkit",
    tagline: "10-Min Grocery & Essentials",
    primary: "#F8CB46",
    secondary: "#0C831F",
    bgGradient: "linear-gradient(135deg, rgba(248,203,70,0.18), rgba(12,131,31,0.08))",
    borderColor: "rgba(248,203,70,0.32)",
    category: "Quick Commerce",
    badge: "5% Return",
  },
  Zepto: {
    name: "Zepto",
    tagline: "Zepto Pass & Grocery Credits",
    primary: "#8B24D4",
    secondary: "#FF3269",
    bgGradient: "linear-gradient(135deg, rgba(139,36,212,0.18), rgba(255,50,105,0.08))",
    borderColor: "rgba(139,36,212,0.32)",
    category: "Quick Commerce",
    badge: "5% Return",
  },
  Myntra: {
    name: "Myntra",
    tagline: "Fashion, Beauty & Trends",
    primary: "#FF3F6C",
    secondary: "#FFA100",
    bgGradient: "linear-gradient(135deg, rgba(255,63,108,0.18), rgba(255,161,0,0.08))",
    borderColor: "rgba(255,63,108,0.32)",
    category: "Fashion",
    badge: "5% Return",
  },
  Flipkart: {
    name: "Flipkart",
    tagline: "Electronics & Daily Deals",
    primary: "#2874F0",
    secondary: "#FFE11B",
    bgGradient: "linear-gradient(135deg, rgba(40,116,240,0.18), rgba(255,225,27,0.08))",
    borderColor: "rgba(40,116,240,0.32)",
    category: "Shopping",
    badge: "5% Return",
  },
  Netflix: {
    name: "Netflix",
    tagline: "1-Month Mobile & Basic OTT",
    primary: "#E50914",
    secondary: "#B81D24",
    bgGradient: "linear-gradient(135deg, rgba(229,9,20,0.22), rgba(184,29,36,0.08))",
    borderColor: "rgba(229,9,20,0.35)",
    category: "OTT & Entertainment",
    badge: "1-Mo Sub",
  },
  Spotify: {
    name: "Spotify",
    tagline: "1-Month Premium Ad-Free Music",
    primary: "#1DB954",
    secondary: "#191414",
    bgGradient: "linear-gradient(135deg, rgba(29,185,84,0.20), rgba(25,20,20,0.4))",
    borderColor: "rgba(29,185,84,0.35)",
    category: "Music",
    badge: "1-Mo Sub",
  },
  "Apple Music": {
    name: "Apple Music",
    tagline: "1-Month Spatial Audio & Lossless",
    primary: "#FA243C",
    secondary: "#FB5C74",
    bgGradient: "linear-gradient(135deg, rgba(250,36,60,0.20), rgba(251,92,116,0.08))",
    borderColor: "rgba(250,36,60,0.35)",
    category: "Music",
    badge: "1-Mo Sub",
  },
  "YouTube Premium": {
    name: "YouTube Premium",
    tagline: "1-Month Ad-Free + Background Play",
    primary: "#FF0000",
    secondary: "#282828",
    bgGradient: "linear-gradient(135deg, rgba(255,0,0,0.20), rgba(40,40,40,0.4))",
    borderColor: "rgba(255,0,0,0.35)",
    category: "OTT & Entertainment",
    badge: "1-Mo Sub",
  },
  Uber: {
    name: "Uber",
    tagline: "Cab & Auto Spend Credits",
    primary: "#000000",
    secondary: "#276EF1",
    bgGradient: "linear-gradient(135deg, rgba(39,110,241,0.18), rgba(255,255,255,0.05))",
    borderColor: "rgba(39,110,241,0.3)",
    category: "Travel",
    badge: "5% Return",
  },
  Starbucks: {
    name: "Starbucks",
    tagline: "Coffee & Beverage Credits",
    primary: "#00704A",
    secondary: "#2D9CDB",
    bgGradient: "linear-gradient(135deg, rgba(0,112,74,0.22), rgba(45,156,219,0.08))",
    borderColor: "rgba(0,112,74,0.35)",
    category: "Food & Dining",
    badge: "5% Return",
  },
  "Direct Cashback": {
    name: "Direct Cashback",
    tagline: "Direct 1.5% Bank / UPI Transfer",
    primary: "#00FF88",
    secondary: "#00B4D8",
    bgGradient: "linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,180,216,0.08))",
    borderColor: "rgba(0,255,136,0.32)",
    category: "Cashback",
    badge: "1.5% Direct",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL COPYRIGHT-FREE VECTOR LOGO COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function BrandLogoBadge({ brand = "", size = 44 }) {
  const b = (brand || "").trim();

  // Amazon
  if (b.toLowerCase().includes("amazon")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#131921",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(255,153,0,0.25)", border: "1px solid rgba(255,153,0,0.3)" }}>
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none">
          <path d="M12.8 14.5c-3.1 2.2-7.5 1.2-10.2-.7-.2-.2-.1-.5.2-.4 2.8 1.4 6.8 1.5 9.7-.3.3-.2.6.2.3.4z" fill="#FF9900"/>
          <path d="M13.2 13.9c.4-.5 1.3-.2 1.8.2.2.2.2.4 0 .6-.7.8-1.9 1.1-2.4.4-.2-.3-.1-.9.6-1.2z" fill="#FF9900"/>
          <path d="M7 6.5h3.2c1.9 0 3.3 1 3.3 3 0 1.9-1.4 3-3.3 3H8.8v2.5H7V6.5zm1.8 4.6h1.2c1 0 1.7-.5 1.7-1.6 0-1-.7-1.5-1.7-1.5H8.8v3.1z" fill="#FFFFFF"/>
        </svg>
      </div>
    );
  }

  // Swiggy
  if (b.toLowerCase().includes("swiggy")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#FC8019",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(252,128,25,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.05 11.45 7.36 11.72.37.33.91.33 1.28 0C12.95 21.45 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 5c1.66 0 3 1.34 3 3 0 2.25-3 5-3 5s-3-2.75-3-5c0-1.66 1.34-3 3-3z" fill="#FFFFFF"/>
          <path d="M12 8.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" fill="#FC8019"/>
        </svg>
      </div>
    );
  }

  // Zomato
  if (b.toLowerCase().includes("zomato")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#E23744",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(226,55,68,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontStyle: "italic", fontSize: size * 0.44, fontFamily: "'Inter', sans-serif" }}>
          z
        </span>
      </div>
    );
  }

  // Blinkit
  if (b.toLowerCase().includes("blinkit")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#F8CB46",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(248,203,70,0.35)", border: "1px solid rgba(12,131,31,0.25)" }}>
        <span style={{ color: "#0C831F", fontWeight: 900, fontSize: size * 0.46, fontFamily: "'Inter', sans-serif" }}>
          b
        </span>
      </div>
    );
  }

  // Zepto
  if (b.toLowerCase().includes("zepto")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28,
        background: "linear-gradient(135deg, #7A1CAC, #FF3269)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(255,50,105,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: size * 0.46, fontFamily: "'Inter', sans-serif" }}>
          Z
        </span>
      </div>
    );
  }

  // Myntra
  if (b.toLowerCase().includes("myntra")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28,
        background: "linear-gradient(135deg, #FF3F6C, #FFA100)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(255,63,108,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: size * 0.46, fontFamily: "'Inter', sans-serif" }}>
          M
        </span>
      </div>
    );
  }

  // Flipkart
  if (b.toLowerCase().includes("flipkart")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#2874F0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(40,116,240,0.35)", border: "1px solid rgba(255,225,27,0.3)" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <path d="M5 4h14l-2 13H7L5 4z" fill="#FFE11B"/>
          <path d="M9 9h6M9 12h4" stroke="#2874F0" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  // Netflix
  if (b.toLowerCase().includes("netflix")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#000000",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(229,9,20,0.35)", border: "1px solid rgba(229,9,20,0.4)" }}>
        <span style={{ color: "#E50914", fontWeight: 900, fontSize: size * 0.52, fontFamily: "'Impact', 'Inter', sans-serif" }}>
          N
        </span>
      </div>
    );
  }

  // Spotify
  if (b.toLowerCase().includes("spotify")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#1DB954",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(29,185,84,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.42c-.18.3-.57.4-.87.21-2.38-1.46-5.38-1.79-8.91-.98-.34.08-.68-.14-.76-.48-.08-.34.14-.68.48-.76 3.87-.88 7.18-.51 9.85 1.14.3.19.4.58.21.87zm1.22-2.72c-.23.37-.71.49-1.08.26-2.73-1.68-6.89-2.17-10.12-1.18-.42.13-.86-.11-.99-.53-.13-.42.11-.86.53-.99 3.69-1.12 8.28-.58 11.4 1.35.37.24.49.72.26 1.09zm.11-2.83C14.64 8.92 9.24 8.74 6.1 9.69c-.49.15-1.02-.13-1.17-.62-.15-.49.13-1.02.62-1.17 3.62-1.1 9.58-.89 13.4 1.38.45.27.6.85.33 1.3-.27.45-.85.6-1.37.29z" fill="#000000"/>
        </svg>
      </div>
    );
  }

  // Apple Music
  if (b.toLowerCase().includes("apple")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28,
        background: "linear-gradient(135deg, #FA243C, #FB5C74)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(250,36,60,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="#FFFFFF"/>
        </svg>
      </div>
    );
  }

  // YouTube
  if (b.toLowerCase().includes("youtube")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#FF0000",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(255,0,0,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FFFFFF"/>
        </svg>
      </div>
    );
  }

  // Uber
  if (b.toLowerCase().includes("uber")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#000000",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: size * 0.38, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.04em" }}>
          Uber
        </span>
      </div>
    );
  }

  // Starbucks
  if (b.toLowerCase().includes("starbucks")) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#00704A",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(0,112,74,0.35)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="1.6"/>
          <path d="M12 7l1.5 3.5 3.5.5-2.5 2.5.6 3.5-3.1-1.7-3.1 1.7.6-3.5-2.5-2.5 3.5-.5z" fill="#FFFFFF"/>
        </svg>
      </div>
    );
  }

  // Direct Cashback / Default
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      boxShadow: "0 4px 14px rgba(74,158,255,0.25)", border: "1px solid rgba(255,255,255,0.18)" }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="1.8"/>
        <path d="M12 7v10M9 9.5c.5-.8 1.6-1.2 3-1.2 1.8 0 3 .8 3 2s-1 1.8-3 2.2-3 1-3 2.3 1.2 2.2 3 2.2c1.4 0 2.5-.5 3-1.2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURATED REWARDS SIMULATION CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const CURATED_REWARDS_CATALOG = [
  // OTT & Subscriptions (Flat 50% Voucher Return on Coins)
  {
    id: "netflix-mobile",
    brand: "Netflix",
    label: "1-Month Mobile Subscription",
    faceValue: 149,
    cost_coins: 298, // 50% voucher return (₹149 / 0.5 = 298 coins)
    requiredSpend: 2980,
    category: "OTT & Entertainment",
    type: "subscription",
    duration: "1 Month",
    description: "Stream unlimited movies & TV shows on 1 mobile phone or tablet in 480p SD.",
    codePrefix: "NFLX-SIM",
    popular: true,
  },
  {
    id: "netflix-basic",
    brand: "Netflix",
    label: "1-Month Basic HD Plan",
    faceValue: 199,
    cost_coins: 398,
    requiredSpend: 3980,
    category: "OTT & Entertainment",
    type: "subscription",
    duration: "1 Month",
    description: "Watch on 1 supported screen at a time in 720p HD with ad-free entertainment.",
    codePrefix: "NFLX-SIM",
  },
  {
    id: "spotify-premium",
    brand: "Spotify",
    label: "1-Month Premium Individual",
    faceValue: 119,
    cost_coins: 238,
    requiredSpend: 2380,
    category: "Music",
    type: "subscription",
    duration: "1 Month",
    description: "Ad-free music listening, offline song downloads & unlimited skips on any device.",
    codePrefix: "SPOT-SIM",
    popular: true,
  },
  {
    id: "apple-music",
    brand: "Apple Music",
    label: "1-Month Individual Plan",
    faceValue: 99,
    cost_coins: 198,
    requiredSpend: 1980,
    category: "Music",
    type: "subscription",
    duration: "1 Month",
    description: "Over 100 million songs, Lossless Audio, Spatial Audio with Dolby Atmos & offline play.",
    codePrefix: "APPL-SIM",
  },
  {
    id: "youtube-premium",
    brand: "YouTube Premium",
    label: "1-Month Ad-Free + YouTube Music",
    faceValue: 149,
    cost_coins: 298,
    requiredSpend: 2980,
    category: "OTT & Entertainment",
    type: "subscription",
    duration: "1 Month",
    description: "Ad-free videos, background play while using other apps, downloads & YouTube Music Premium.",
    codePrefix: "YT-SIM",
  },
  {
    id: "swiggy-one",
    brand: "Swiggy",
    label: "1-Month Swiggy One Membership",
    faceValue: 99,
    cost_coins: 198,
    requiredSpend: 1980,
    category: "Food & Dining",
    type: "subscription",
    duration: "1 Month",
    description: "Free delivery on food & Instamart orders, extra up to 30% discounts and no surge fees.",
    codePrefix: "SWIG-SIM",
    popular: true,
  },
  {
    id: "zepto-pass",
    brand: "Zepto",
    label: "1-Month Zepto Pass",
    faceValue: 99,
    cost_coins: 198,
    requiredSpend: 1980,
    category: "Quick Commerce",
    type: "subscription",
    duration: "1 Month",
    description: "Unlimited free deliveries on orders above ₹99 plus exclusive member price drops.",
    codePrefix: "ZEPT-SIM",
  },
  {
    id: "zomato-gold",
    brand: "Zomato",
    label: "1-Month Zomato Gold Pass",
    faceValue: 99,
    cost_coins: 198,
    requiredSpend: 1980,
    category: "Food & Dining",
    type: "subscription",
    duration: "1 Month",
    description: "Free delivery on orders within 10km, VIP dining discounts up to 40% OFF.",
    codePrefix: "ZOM-SIM",
    popular: true,
  },

  // Daily Spending Vouchers (Flat 50% returns on coins)
  {
    id: "amazon-250",
    brand: "Amazon",
    label: "₹250 Amazon Pay Gift Card",
    faceValue: 250,
    cost_coins: 500, // 500 coins = ₹250 voucher
    requiredSpend: 5000,
    category: "Shopping",
    type: "voucher",
    description: "Add to Amazon Pay balance for bill payments, mobile recharges, shopping & food.",
    codePrefix: "AMZN-SIM",
    popular: true,
  },
  {
    id: "amazon-500",
    brand: "Amazon",
    label: "₹500 Amazon Pay Gift Card",
    faceValue: 500,
    cost_coins: 1000,
    requiredSpend: 10000,
    category: "Shopping",
    type: "voucher",
    description: "Add ₹500 to Amazon Pay wallet. Usable across 500+ top partner merchant sites.",
    codePrefix: "AMZN-SIM",
  },
  {
    id: "blinkit-100",
    brand: "Blinkit",
    label: "₹100 Quick Commerce Voucher",
    faceValue: 100,
    cost_coins: 200,
    requiredSpend: 2000,
    category: "Quick Commerce",
    type: "voucher",
    description: "Instant ₹100 discount on your next 10-minute grocery or electronics order.",
    codePrefix: "BLNK-SIM",
    popular: true,
  },
  {
    id: "blinkit-250",
    brand: "Blinkit",
    label: "₹250 Quick Commerce Voucher",
    faceValue: 250,
    cost_coins: 500,
    requiredSpend: 5000,
    category: "Quick Commerce",
    type: "voucher",
    description: "Flat ₹250 OFF on fresh veggies, dairy, snacks and home essentials.",
    codePrefix: "BLNK-SIM",
  },
  {
    id: "swiggy-200",
    brand: "Swiggy",
    label: "₹200 Food Delivery Voucher",
    faceValue: 200,
    cost_coins: 400,
    requiredSpend: 4000,
    category: "Food & Dining",
    type: "voucher",
    description: "Redeemable on all restaurant orders and gourmet picks across Swiggy.",
    codePrefix: "SWIG-SIM",
  },
  {
    id: "zomato-200",
    brand: "Zomato",
    label: "₹200 Dining & Delivery Voucher",
    faceValue: 200,
    cost_coins: 400,
    requiredSpend: 4000,
    category: "Food & Dining",
    type: "voucher",
    description: "Valid across delivery orders or Zomato Pay dine-in restaurant bills.",
    codePrefix: "ZOM-SIM",
  },
  {
    id: "myntra-300",
    brand: "Myntra",
    label: "₹300 Fashion Voucher",
    faceValue: 300,
    cost_coins: 600,
    requiredSpend: 6000,
    category: "Fashion",
    type: "voucher",
    description: "Flat ₹300 coupon code valid across clothing, footwear, accessories & beauty.",
    codePrefix: "MYNT-SIM",
    popular: true,
  },
  {
    id: "flipkart-250",
    brand: "Flipkart",
    label: "₹250 Shopping Gift Card",
    faceValue: 250,
    cost_coins: 500,
    requiredSpend: 5000,
    category: "Shopping",
    type: "voucher",
    description: "Direct gift card credit for electronics, fashion, groceries and household appliances.",
    codePrefix: "FLIP-SIM",
  },
  {
    id: "uber-150",
    brand: "Uber",
    label: "₹150 Uber Rides Voucher",
    faceValue: 150,
    cost_coins: 300,
    requiredSpend: 3000,
    category: "Travel",
    type: "voucher",
    description: "Add to Uber Credits for Uber Auto, Uber Go, Premier or Intercity rides.",
    codePrefix: "UBER-SIM",
  },
  {
    id: "starbucks-250",
    brand: "Starbucks",
    label: "₹250 Beverage Card",
    faceValue: 250,
    cost_coins: 500,
    requiredSpend: 5000,
    category: "Food & Dining",
    type: "voucher",
    description: "Redeemable at any Starbucks India café for handcrafted coffees, frappes and bakery.",
    codePrefix: "SBUX-SIM",
  },

  // Direct Flat 15% Cashback on Total Coins (2-day cycle)
  {
    id: "cashback-75",
    brand: "Direct Cashback",
    label: "₹75 Direct UPI Cashback (15% on 500 coins)",
    faceValue: 75,
    cost_coins: 500, // 500 coins * 15% = ₹75 cash
    requiredSpend: 5000,
    category: "Cashback",
    type: "cashback",
    description: "Flat 15% direct cash return disbursed every 2 days directly to your linked UPI ID.",
    codePrefix: "CASH-SIM",
    popular: true,
  },
  {
    id: "cashback-150",
    brand: "Direct Cashback",
    label: "₹150 Direct UPI Cashback (15% on 1,000 coins)",
    faceValue: 150,
    cost_coins: 1000, // 1,000 coins * 15% = ₹150 cash
    requiredSpend: 10000,
    category: "Cashback",
    type: "cashback",
    description: "Flat 15% direct cashback payout disbursed every 2 days directly via UPI.",
    codePrefix: "CASH-SIM",
  },
  {
    id: "cashback-300",
    brand: "Direct Cashback",
    label: "₹300 Direct UPI Cashback (15% on 2,000 coins)",
    faceValue: 300,
    cost_coins: 2000, // 2,000 coins * 15% = ₹300 cash
    requiredSpend: 20000,
    category: "Cashback",
    type: "cashback",
    description: "Flat 15% direct cashback payout on 2,000 coins. Disbursed every 2 days directly to UPI.",
    codePrefix: "CASH-SIM",
  },
  {
    id: "cashback-750",
    brand: "Direct Cashback",
    label: "₹750 Direct UPI Cashback (15% on 5,000 coins)",
    faceValue: 750,
    cost_coins: 5000, // 5,000 coins * 15% = ₹750 cash
    requiredSpend: 50000,
    category: "Cashback",
    type: "cashback",
    description: "Flat 15% high-volume direct cashback payout. Disbursed every 2 days directly to UPI.",
    codePrefix: "CASH-SIM",
  },
];

// Helper to generate simulated code
export function generateSimulationCode(brand = "REWARD") {
  const clean = (brand || "REWARD").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4) || "PMNT";
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-SIM-${hex}-${num}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI BURST ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
export function ConfettiBurst() {
  const pieces = Array.from({ length: 32 });
  const colors = ["#4A9EFF", "#E8C46A", "#00FF88", "#FC8019", "#FF3F6C", "#90CAFF", "#FFFFFF"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100 }}>
      {pieces.map((_, i) => {
        const x = Math.random() * 300 - 150;
        const y = Math.random() * -240 - 60;
        const rot = Math.random() * 720 - 360;
        const col = colors[i % colors.length];
        const size = Math.random() * 6 + 4;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: x,
              y: [y * 0.5, y, y + 160],
              scale: [0, 1.2, 0.8],
              rotate: rot,
            }}
            transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              width: size,
              height: size * (i % 2 === 0 ? 1 : 2.2),
              borderRadius: i % 3 === 0 ? "50%" : 2,
              background: col,
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REWARD STORE VIEW (5% Vouchers vs 1.5% Cashback Modes + Real-time Brands)
// ─────────────────────────────────────────────────────────────────────────────
export function RewardStoreView({
  coins = 0,
  totalSpend = 0,
  storeRewards = [],
  redeemedCodes = {},
  onClaimReward,
  onBack,
}) {
  const [returnMode, setReturnMode] = useState("vouchers"); // 'vouchers' (5%) or 'cashback' (1.5%)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReward, setSelectedReward] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showMyRewards, setShowMyRewards] = useState(false);

  // Combine curated rewards with any custom founder-added rewards from backend
  const allRewards = useMemo(() => {
    const list = [...CURATED_REWARDS_CATALOG];
    // If backend has custom rewards that don't exist in catalog, merge them
    if (storeRewards && storeRewards.length > 0) {
      storeRewards.forEach((sr) => {
        const exists = list.some((c) => c.brand.toLowerCase() === sr.brand.toLowerCase() && c.label.toLowerCase() === sr.label.toLowerCase());
        if (!exists) {
          list.push({
            id: `custom-${sr.brand}-${sr.label}`.replace(/\s+/g, "-").toLowerCase(),
            brand: sr.brand,
            label: sr.label,
            faceValue: Math.round(Number(sr.cost_coins || 100) / 10),
            cost_coins: Number(sr.cost_coins || 100),
            requiredSpend: Number(sr.cost_coins || 100) * 2,
            category: BRAND_META[sr.brand]?.category || "Vouchers",
            type: "voucher",
            description: `Exclusive ${sr.brand} reward voucher code.`,
            codePrefix: `${sr.brand.slice(0, 4).toUpperCase()}-SIM`,
            available: sr.available,
          });
        }
      });
    }
    return list;
  }, [storeRewards]);

  // Filter rewards based on active mode, category and search
  const filteredRewards = useMemo(() => {
    return allRewards.filter((r) => {
      // Return Mode filter
      if (returnMode === "vouchers" && r.type === "cashback") return false;
      if (returnMode === "cashback" && r.type !== "cashback") return false;

      // Category filter
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.brand.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allRewards, returnMode, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    if (returnMode === "cashback") return ["All", "Cashback"];
    return ["All", "OTT & Entertainment", "Music", "Food & Dining", "Quick Commerce", "Shopping", "Fashion", "Travel"];
  }, [returnMode]);

  const handleClaim = async (reward) => {
    if (coins < reward.cost_coins || isClaiming) return;
    setIsClaiming(true);
    try {
      let result = null;
      if (onClaimReward) {
        result = await onClaimReward(reward.brand, reward.label, reward.cost_coins);
      }
      if (!result || result.error || !result.code) {
        // Redemption failed on server - do not show false success modal
        return;
      }
      setClaimSuccessData({
        ...reward,
        code: result.code,
        claimedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Claim error:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    }
  };

  const claimedList = useMemo(() => {
    return Object.entries(redeemedCodes).map(([key, code]) => {
      const [brand, label] = key.split("||");
      return { brand, label: label || "Voucher", code };
    });
  }, [redeemedCodes]);

  return (
    <div style={{ padding: "0 18px 30px" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: T.glass,
                border: `1px solid ${T.glassBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: T.text,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
              Rewards Studio
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: T.gold, fontWeight: 600 }}>
              {coins.toFixed(1)} Coins Balance · ₹{fmt(Math.round(totalSpend))} Total Spend
            </p>
          </div>
        </div>

        {claimedList.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowMyRewards(true)}
            style={{
              padding: "7px 12px",
              borderRadius: 12,
              background: "rgba(0,255,136,0.1)",
              border: "1px solid rgba(0,255,136,0.25)",
              color: "#00FF88",
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            My Codes ({claimedList.length})
          </motion.button>
        )}
      </div>

      {/* ── MANDATORY SIMULATION DISCLAIMER BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 16,
          background: "linear-gradient(135deg, rgba(232,196,106,0.12), rgba(232,196,106,0.03))",
          border: "1px solid rgba(232,196,106,0.3)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "rgba(232,196,106,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke={T.gold} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.gold, lineHeight: 1.4 }}>
            Simulation Notice
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(242,242,247,0.7)", lineHeight: 1.45 }}>
            &ldquo;This is a reward simulation and no actual rewards are listed yet, thank you for understanding and support&rdquo;
          </p>
        </div>
      </motion.div>

      {/* ── 2 RETURN MODES TOGGLE (5% Vouchers vs 1.5% Cashback) ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.glassBorder}`,
          borderRadius: 16,
          padding: "4px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          marginBottom: 14,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setReturnMode("vouchers");
            setSelectedCategory("All");
          }}
          style={{
            padding: "10px 8px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            background:
              returnMode === "vouchers"
                ? `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`
                : "transparent",
            color: returnMode === "vouchers" ? "#FFFFFF" : T.textSub,
            boxShadow: returnMode === "vouchers" ? "0 4px 14px rgba(74,158,255,0.25)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800 }}>Flat 50% on Vouchers</span>
          <span
            style={{
              fontSize: 10,
              opacity: returnMode === "vouchers" ? 0.9 : 0.6,
              fontWeight: 500,
            }}
          >
            500 coins = ₹250 Voucher
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setReturnMode("cashback");
            setSelectedCategory("All");
          }}
          style={{
            padding: "10px 8px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            background:
              returnMode === "cashback"
                ? "linear-gradient(135deg, #00C853, #009624)"
                : "transparent",
            color: returnMode === "cashback" ? "#FFFFFF" : T.textSub,
            boxShadow: returnMode === "cashback" ? "0 4px 14px rgba(0,200,83,0.25)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800 }}>Flat 15% on Cashback</span>
          <span
            style={{
              fontSize: 10,
              opacity: returnMode === "cashback" ? 0.9 : 0.6,
              fontWeight: 500,
            }}
          >
            500 coins = ₹75 Cash · 2-Day Cycle
          </span>
        </motion.button>
      </div>

      {/* ── MUTUAL EXCLUSIVITY & 2-DAY REDEMPTION CYCLE NOTICE ── */}
      <div
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 14,
          background: returnMode === "cashback" ? "rgba(0,200,83,0.08)" : "rgba(74,158,255,0.08)",
          border: `1px solid ${returnMode === "cashback" ? "rgba(0,200,83,0.24)" : "rgba(74,158,255,0.24)"}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span style={{ fontSize: 16 }}>{returnMode === "cashback" ? "⚡" : "🔒"}</span>
        <p style={{ margin: 0, fontSize: 11.5, color: T.textSub, lineHeight: 1.45 }}>
          {returnMode === "cashback" ? (
            <>
              <strong style={{ color: "#00E676" }}>2-Day Cash Redemption Cycle:</strong> Direct UPI cashback is disbursed every 2 days. Both voucher & cashback redemptions cannot be combined.
            </>
          ) : (
            <>
              <strong style={{ color: "#80C4FF" }}>Exclusive Reward Mode:</strong> You can choose either 50% Brand Vouchers OR 15% Direct Cashback (both cannot be active simultaneously).
            </>
          )}
        </p>
      </div>

      {/* ── SEARCH & CATEGORY CHIPS ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Amazon, Swiggy, Netflix, Spotify..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: 12,
              border: `1px solid ${T.glassBorder}`,
              background: T.glass,
              color: T.text,
              fontSize: 16,
              fontFamily: "inherit",
              outline: "none",
              caretColor: T.blue,
              boxSizing: "border-box",
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="7" cy="7" r="5" stroke={T.textMute} strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke={T.textMute} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: T.textMute,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories scroll */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${selectedCategory === cat ? T.blue : T.glassBorder}`,
                background: selectedCategory === cat ? "rgba(74,158,255,0.15)" : T.glass,
                color: selectedCategory === cat ? T.blue : T.textSub,
                fontSize: 11.5,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── REWARDS GRID / LIST ── */}
      {filteredRewards.length === 0 ? (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            borderRadius: 16,
            background: T.glass,
            border: `1px solid ${T.glassBorder}`,
          }}
        >
          <p style={{ margin: 0, fontSize: 13.5, color: T.textMute }}>
            No rewards found matching &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {filteredRewards.map((reward) => {
            const meta = BRAND_META[reward.brand] || {};
            const isAffordable = coins >= reward.cost_coins;
            const progressPct = Math.min(100, Math.round((coins / reward.cost_coins) * 100));
            const coinsNeeded = Math.max(0, parseFloat((reward.cost_coins - coins).toFixed(1)));
            const spendNeeded = coinsNeeded * 10; // 10% coin earn rate

            const isRedeemed = !!redeemedCodes[`${reward.brand}||${reward.label}`];

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 18,
                  padding: "15px 16px",
                  background: isAffordable
                    ? meta.bgGradient || "rgba(74,158,255,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${
                    isAffordable ? meta.borderColor || "rgba(74,158,255,0.25)" : T.glassBorder
                  }`,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isAffordable ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <BrandLogoBadge brand={reward.brand} size={46} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: T.text }}>
                        {reward.brand}
                      </span>
                      {reward.type === "subscription" && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 10,
                            background: "rgba(229,9,20,0.15)",
                            color: "#FF6058",
                            border: "1px solid rgba(229,9,20,0.3)",
                            textTransform: "uppercase",
                          }}
                        >
                          1-Mo Subscription
                        </span>
                      )}
                      {reward.type === "cashback" && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 10,
                            background: "rgba(0,255,136,0.12)",
                            color: "#00FF88",
                            border: "1px solid rgba(0,255,136,0.25)",
                            textTransform: "uppercase",
                          }}
                        >
                          1.5% Cashback
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isAffordable ? T.text : T.textSub }}>
                      {reward.label}
                    </p>

                    <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMute, lineHeight: 1.4 }}>
                      {reward.description}
                    </p>

                    {/* Progress to unlock bar */}
                    {!isAffordable && (
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 10,
                            color: T.textMute,
                            marginBottom: 4,
                          }}
                        >
                          <span>{progressPct}% unlocked</span>
                          <span>Spend ₹{fmt(spendNeeded)} to earn {coinsNeeded} coins</span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${progressPct}%`,
                              borderRadius: 4,
                              background: `linear-gradient(90deg, ${T.gold}, ${T.blue})`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer: Cost and action button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: isAffordable ? T.gold : T.textMute }}>
                      {fmt(reward.cost_coins)} coins
                    </span>
                    <span style={{ fontSize: 11, color: T.textMute, marginLeft: 5 }}>
                      (₹{fmt(reward.faceValue)} value)
                    </span>
                  </div>

                  {isRedeemed ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#00FF88",
                        background: "rgba(0,255,136,0.1)",
                        border: "1px solid rgba(0,255,136,0.2)",
                        padding: "5px 12px",
                        borderRadius: 10,
                      }}
                    >
                      Claimed ✓
                    </span>
                  ) : (
                    <motion.button
                      whileTap={isAffordable ? { scale: 0.94 } : {}}
                      disabled={!isAffordable}
                      onClick={() => setSelectedReward(reward)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 11,
                        border: "none",
                        cursor: isAffordable ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        fontSize: 12,
                        fontWeight: 700,
                        background: isAffordable
                          ? `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`
                          : "rgba(255,255,255,0.06)",
                        color: isAffordable ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                        boxShadow: isAffordable ? "0 2px 10px rgba(74,158,255,0.3)" : "none",
                      }}
                    >
                      {isAffordable ? "Claim Simulation" : "Locked"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── CONFIRM CLAIM MODAL ── */}
      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 600,
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(18px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={SP.bouncy}
              style={{
                width: "100%",
                maxWidth: 390,
                borderRadius: 22,
                background: "#0C0C0F",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "24px 20px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                position: "relative",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ margin: "0 auto 12px", display: "inline-block" }}>
                  <BrandLogoBadge brand={selectedReward.brand} size={58} />
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: T.text }}>
                  Claim {selectedReward.brand}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>
                  {selectedReward.label}
                </p>
              </div>

              {/* Simulation Notice inside modal */}
              <div
                style={{
                  background: "rgba(232,196,106,0.08)",
                  border: "1px solid rgba(232,196,106,0.22)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontSize: 11, color: T.gold, lineHeight: 1.45 }}>
                  &ldquo;This is a reward simulation and no actual rewards are listed yet, thank you for understanding and support&rdquo;
                </p>
              </div>

              {/* Cost breakdown */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  border: `1px solid ${T.glassBorder}`,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5 }}>
                  <span style={{ color: T.textMute }}>Voucher Value</span>
                  <span style={{ fontWeight: 700, color: T.text }}>₹{fmt(selectedReward.faceValue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5 }}>
                  <span style={{ color: T.textMute }}>Coins to Deduct</span>
                  <span style={{ fontWeight: 800, color: T.gold }}>-{fmt(selectedReward.cost_coins)} Coins</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0 0",
                    fontSize: 12.5,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: T.textMute }}>Remaining Balance</span>
                  <span style={{ fontWeight: 700, color: T.blue }}>
                    {parseFloat((coins - selectedReward.cost_coins).toFixed(1))} Coins
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedReward(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    background: T.glass,
                    border: `1px solid ${T.glassBorder}`,
                    color: T.textSub,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isClaiming}
                  onClick={async () => {
                    await handleClaim(selectedReward);
                    setSelectedReward(null);
                  }}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
                    color: "#FFFFFF",
                    boxShadow: "0 4px 18px rgba(74,158,255,0.35)",
                  }}
                >
                  {isClaiming ? "Generating Code…" : "Confirm Claim"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CLAIM SUCCESS VOUCHER MODAL (With Confetti & Reveal Code) ── */}
      <AnimatePresence>
        {claimSuccessData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 700,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
            }}
          >
            <ConfettiBurst />

            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SP.bouncy}
              style={{
                width: "100%",
                maxWidth: 390,
                borderRadius: 24,
                background: "#0B0B0E",
                border: "1px solid rgba(0,255,136,0.3)",
                padding: "26px 20px",
                textAlign: "center",
                boxShadow: "0 0 50px rgba(0,255,136,0.15)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: "rgba(0,255,136,0.12)",
                  border: "1px solid rgba(0,255,136,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#00FF88" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>
                Simulation Redeemed!
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: T.textSub }}>
                {claimSuccessData.brand} · {claimSuccessData.label}
              </p>

              {/* Revealed Voucher Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(74,158,255,0.04))",
                  border: "1.5px dashed rgba(0,255,136,0.4)",
                  borderRadius: 16,
                  padding: "16px 14px",
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, color: "rgba(0,255,136,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Your Simulation Voucher Code
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#00FF88",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  {claimSuccessData.code}
                </p>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => copyToClipboard(claimSuccessData.code)}
                  style={{
                    marginTop: 12,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,255,136,0.3)",
                    background: "rgba(0,255,136,0.12)",
                    color: "#00FF88",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {copiedCode ? "Copied to Clipboard!" : "Copy Code"}
                </motion.button>
              </div>

              {/* Disclaimer reminder */}
              <p style={{ margin: "0 0 20px", fontSize: 10.5, color: T.textMute, lineHeight: 1.4 }}>
                * This is a simulated code for preview demonstration purposes.
              </p>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setClaimSuccessData(null)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
                  color: "#FFFFFF",
                }}
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MY CLAIMED REWARDS DRAWER ── */}
      <AnimatePresence>
        {showMyRewards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 600,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(16px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SP.gentle}
              style={{
                width: "100%",
                maxWidth: 430,
                maxHeight: "80vh",
                overflowY: "auto",
                background: "#0E0E12",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "24px 24px 0 0",
                padding: "24px 20px 40px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>
                  My Claimed Rewards
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMyRewards(false)}
                  style={{
                    background: T.glass,
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 10,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.textSub,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {claimedList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${T.glassBorder}`,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <BrandLogoBadge brand={item.brand} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>
                      {item.brand} — {item.label}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 800, color: "#00FF88", fontFamily: "monospace" }}>
                      {item.code}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => copyToClipboard(item.code)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      background: "rgba(74,158,255,0.12)",
                      border: "1px solid rgba(74,158,255,0.25)",
                      color: T.blue,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Copy
                  </motion.button>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDER REWARDS STUDIO / ADD & DESIGN REWARDS TAB
// ─────────────────────────────────────────────────────────────────────────────
export function FounderRewardsTab({
  rewards = [],
  rewardsLoading = false,
  founderPw = "",
  onRefresh,
  onBulkAddCodes,
  onManageReward,
  setActionMsg,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editReward, setEditReward] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Reward Designer State
  const [selectedBrandPreset, setSelectedBrandPreset] = useState("Amazon");
  const [customBrand, setCustomBrand] = useState("");
  const [rewardType, setRewardType] = useState("voucher"); // 'subscription' | 'voucher' | 'cashback'
  const [customLabel, setCustomLabel] = useState("₹250 Gift Voucher");
  const [faceValue, setFaceValue] = useState("250");
  const [coinCost, setCoinCost] = useState("2500"); // 10x value or 5% equivalent
  const [batchCodeCount, setBatchCodeCount] = useState(10);
  const [customCodes, setCustomCodes] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const brandNames = [
    "Amazon",
    "Swiggy",
    "Zomato",
    "Blinkit",
    "Zepto",
    "Myntra",
    "Flipkart",
    "Netflix",
    "Spotify",
    "Apple Music",
    "YouTube Premium",
    "Uber",
    "Starbucks",
    "Direct Cashback",
    "Custom Brand",
  ];

  // Auto-calculate suggested coin cost when face value changes
  const handleFaceValueChange = (val) => {
    setFaceValue(val);
    const num = Number(val || 0);
    if (rewardType === "cashback") {
      setCoinCost(String(Math.round(num / 0.15))); // 15% cashback rate -> e.g. ₹75 = 500 coins
    } else {
      setCoinCost(String(Math.round(num * 2))); // 50% voucher rate -> e.g. ₹250 = 500 coins
    }
  };

  const handleBrandPresetSelect = (brand) => {
    setSelectedBrandPreset(brand);
    if (brand === "Netflix") {
      setRewardType("subscription");
      setCustomLabel("1-Month Mobile Plan");
      setFaceValue("149");
      setCoinCost("298");
    } else if (brand === "Spotify") {
      setRewardType("subscription");
      setCustomLabel("1-Month Premium Music");
      setFaceValue("119");
      setCoinCost("238");
    } else if (brand === "Apple Music") {
      setRewardType("subscription");
      setCustomLabel("1-Month Individual");
      setFaceValue("99");
      setCoinCost("198");
    } else if (brand === "Swiggy") {
      setRewardType("subscription");
      setCustomLabel("1-Month Swiggy One");
      setFaceValue("99");
      setCoinCost("198");
    } else if (brand === "Zepto") {
      setRewardType("subscription");
      setCustomLabel("1-Month Zepto Pass");
      setFaceValue("99");
      setCoinCost("198");
    } else if (brand === "Direct Cashback") {
      setRewardType("cashback");
      setCustomLabel("₹75 Direct Cashback (15%)");
      setFaceValue("75");
      setCoinCost("500");
    } else if (brand !== "Custom Brand") {
      setRewardType("voucher");
      setCustomLabel("₹250 Gift Voucher");
      setFaceValue("250");
      setCoinCost("500");
    }
  };

  const handleGenerateSimulationCodes = () => {
    const brandToUse = selectedBrandPreset === "Custom Brand" ? customBrand || "BRAND" : selectedBrandPreset;
    const generated = Array.from({ length: batchCodeCount }).map(() => generateSimulationCode(brandToUse));
    setCustomCodes(generated.join("\n"));
  };

  const handlePublishReward = async () => {
    const brand = selectedBrandPreset === "Custom Brand" ? customBrand.trim() : selectedBrandPreset;
    const label = customLabel.trim();
    const cost = Number(coinCost);

    if (!brand || !label || !cost || isNaN(cost)) {
      if (setActionMsg) setActionMsg("Please specify Brand, Label and valid Coin Cost.");
      return;
    }

    let codes = customCodes
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    // If no codes pasted, auto-generate batch simulation codes
    if (codes.length === 0) {
      codes = Array.from({ length: batchCodeCount }).map(() => generateSimulationCode(brand));
    }

    setIsPublishing(true);
    try {
      if (onBulkAddCodes) {
        await onBulkAddCodes(brand, label, cost, codes, founderPw);
      }
      if (onRefresh) await onRefresh();
      setShowAddModal(false);
      setCustomCodes("");
      if (setActionMsg) setActionMsg(`Published ${codes.length} simulation codes for ${brand} (${label}).`);
    } catch (err) {
      console.error("Publish error:", err);
      if (setActionMsg) setActionMsg(`Error publishing reward: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Group inventory for founder management
  const groupedInventory = useMemo(() => {
    const grouped = {};
    rewards.forEach((r) => {
      const key = `${r.brand}||${r.label}||${r.cost_coins}`;
      if (!grouped[key]) {
        grouped[key] = {
          brand: r.brand,
          label: r.label,
          cost_coins: r.cost_coins,
          active: 0,
          total: 0,
          codes: [],
        };
      }
      grouped[key].total++;
      if (r.active && r.stock > 0) grouped[key].active++;
      grouped[key].codes.push(r);
    });
    return Object.values(grouped);
  }, [rewards]);

  const activeBrand = selectedBrandPreset === "Custom Brand" ? customBrand || "Preview" : selectedBrandPreset;

  return (
    <div>
      {/* ── HEADER & ACTIONS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.text }}>
            Founder Reward Studio & Inventory
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textMute }}>
            Design custom brand rewards & auto-generate simulation batches
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            handleBrandPresetSelect("Amazon");
            setShowAddModal(true);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
            border: "none",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          + Design Reward
        </motion.button>
      </div>

      {/* ── DESIGN & ADD REWARD MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 500,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={SP.bouncy}
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 22,
                background: "#0D0D11",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "22px 18px",
                maxHeight: "88vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text }}>
                  Design New Reward
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "none", border: "none", color: T.textMute, fontSize: 14, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  borderRadius: 16,
                  padding: "14px",
                  background: BRAND_META[activeBrand]?.bgGradient || "rgba(74,158,255,0.08)",
                  border: `1px solid ${BRAND_META[activeBrand]?.borderColor || "rgba(74,158,255,0.3)"}`,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <BrandLogoBadge brand={activeBrand} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: T.text }}>
                      {activeBrand}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 8,
                        background: "rgba(74,158,255,0.15)",
                        color: T.blue,
                      }}
                    >
                      {rewardType.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub, fontWeight: 600 }}>
                    {customLabel || "Reward Description"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: T.gold, fontWeight: 700 }}>
                    {fmt(coinCost)} Coins (₹{fmt(faceValue)} value)
                  </p>
                </div>
              </div>

              {/* Brand Presets Selector */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: T.textMute, fontWeight: 700, textTransform: "uppercase" }}>
                  Select Brand Preset
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    overflowX: "auto",
                    paddingBottom: 4,
                    scrollbarWidth: "none",
                  }}
                >
                  {brandNames.map((b) => (
                    <motion.button
                      key={b}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleBrandPresetSelect(b)}
                      style={{
                        padding: "6px 11px",
                        borderRadius: 16,
                        border: `1px solid ${selectedBrandPreset === b ? T.blue : T.glassBorder}`,
                        background: selectedBrandPreset === b ? "rgba(74,158,255,0.18)" : T.glass,
                        color: selectedBrandPreset === b ? T.blue : T.textSub,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {b}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedBrandPreset === "Custom Brand" && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: T.textMute, fontWeight: 600 }}>Custom Brand Name</p>
                  <input
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Dominos, Cult.fit, Tata Neu..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: `1px solid ${T.glassBorder}`,
                      background: T.glass,
                      color: T.text,
                      fontSize: 16,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {/* Reward Type Toggle */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: T.textMute, fontWeight: 700, textTransform: "uppercase" }}>
                  Reward Type
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    ["voucher", "Voucher (5%)"],
                    ["subscription", "1-Mo Sub"],
                    ["cashback", "Cashback (1.5%)"],
                  ].map(([val, name]) => (
                    <button
                      key={val}
                      onClick={() => setRewardType(val)}
                      style={{
                        padding: "7px 4px",
                        borderRadius: 10,
                        border: `1px solid ${rewardType === val ? T.blue : T.glassBorder}`,
                        background: rewardType === val ? "rgba(74,158,255,0.15)" : T.glass,
                        color: rewardType === val ? T.blue : T.textSub,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: T.textMute, fontWeight: 600 }}>Reward Title / Label</p>
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. 1-Month Premium Subscription"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: `1px solid ${T.glassBorder}`,
                    background: T.glass,
                    color: T.text,
                    fontSize: 16,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Face value & Coin Cost */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: T.textMute, fontWeight: 600 }}>Face Value (₹)</p>
                  <input
                    type="number"
                    value={faceValue}
                    onChange={(e) => handleFaceValueChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: `1px solid ${T.glassBorder}`,
                      background: T.glass,
                      color: T.text,
                      fontSize: 16,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: T.textMute, fontWeight: 600 }}>Coins Cost</p>
                  <input
                    type="number"
                    value={coinCost}
                    onChange={(e) => setCoinCost(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: `1px solid ${T.glassBorder}`,
                      background: T.glass,
                      color: T.gold,
                      fontWeight: 700,
                      fontSize: 16,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* VOUCHER / COUPON QUANTITY TO LIST AT ONCE */}
              <div
                style={{
                  background: "rgba(74,158,255,0.06)",
                  border: "1px solid rgba(74,158,255,0.22)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: T.blue, letterSpacing: "0.02em" }}>
                      VOUCHER / COUPON QUANTITY TO LIST
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textSub }}>
                      Quantity: <strong style={{ color: T.gold }}>{batchCodeCount} {batchCodeCount === 1 ? 'voucher' : 'vouchers'}</strong> will be created at once
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <button
                      type="button"
                      onClick={() => setBatchCodeCount((c) => Math.max(1, Number(c) - 1))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: T.glass,
                        border: `1px solid ${T.glassBorder}`,
                        color: T.text,
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={batchCodeCount}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                        setBatchCodeCount(val);
                      }}
                      style={{
                        width: 44,
                        height: 28,
                        borderRadius: 7,
                        background: "rgba(255,255,255,0.08)",
                        border: `1px solid ${T.blue}`,
                        color: T.text,
                        fontSize: 13,
                        fontWeight: 800,
                        textAlign: "center",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setBatchCodeCount((c) => Math.min(100, Number(c) + 1))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: T.glass,
                        border: `1px solid ${T.glassBorder}`,
                        color: T.text,
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Quantity Chips (1, 2, 3, 5, 10, 15, 20, 25, 50) */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBatchCodeCount(cnt)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: 8,
                        background: Number(batchCodeCount) === cnt ? `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})` : "rgba(255,255,255,0.05)",
                        color: Number(batchCodeCount) === cnt ? "white" : T.textSub,
                        border: `1px solid ${Number(batchCodeCount) === cnt ? T.blue : "rgba(255,255,255,0.08)"}`,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGenerateSimulationCodes}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    background: "rgba(74,158,255,0.14)",
                    border: "1px solid rgba(74,158,255,0.3)",
                    color: "#80C4FF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    marginBottom: 8,
                  }}
                >
                  ⚡ Auto-Generate {batchCodeCount} Branded Voucher Codes
                </motion.button>

                <textarea
                  value={customCodes}
                  onChange={(e) => setCustomCodes(e.target.value)}
                  rows={4}
                  placeholder={`AMZN-SIM-XXXX-1\nAMZN-SIM-XXXX-2\nAMZN-SIM-XXXX-3\n(or click Auto-Generate above to create ${batchCodeCount} codes)`}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${T.glassBorder}`,
                    background: T.glass,
                    color: T.text,
                    fontSize: 13,
                    fontFamily: "monospace",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 12,
                    background: T.glass,
                    border: `1px solid ${T.glassBorder}`,
                    color: T.textSub,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isPublishing}
                  onClick={handlePublishReward}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: 12,
                    border: "none",
                    background: `linear-gradient(135deg, ${T.blue}, ${T.blueDeep})`,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(74,158,255,0.35)",
                  }}
                >
                  {isPublishing ? "Publishing…" : `Publish ${batchCodeCount} Vouchers to Store`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVENTORY LIST ── */}
      {rewardsLoading ? (
        <div style={{ textAlign: "center", paddingTop: 32 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `2px solid ${T.blue}`,
              borderTopColor: "transparent",
              margin: "0 auto",
            }}
          />
        </div>
      ) : groupedInventory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: T.textMute, lineHeight: 1.6 }}>
            No custom reward codes stocked in database yet.<br />
            Click &ldquo;+ Design Reward&rdquo; to stock initial simulated inventory.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groupedInventory.map((g, gi) => (
            <div
              key={gi}
              style={{
                borderRadius: 16,
                padding: "14px 16px",
                background: g.active > 0 ? "rgba(74,158,255,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${g.active > 0 ? "rgba(74,158,255,0.2)" : T.glassBorder}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <BrandLogoBadge brand={g.brand} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: g.active > 0 ? T.text : "rgba(242,242,247,0.45)" }}>
                      {g.brand}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>— {g.label}</p>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 12,
                        color: g.active > 0 ? "#00FF88" : "rgba(255,255,255,0.3)",
                        background: g.active > 0 ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${g.active > 0 ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {g.active > 0 ? "ACTIVE" : "EMPTY"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 8px" }}>
                    <p style={{ margin: 0, fontSize: 11.5, color: T.textSub }}>
                      <span style={{ fontWeight: 700, color: g.active > 0 ? T.blue : T.textMute }}>{g.active}</span>
                      <span style={{ color: T.textMute }}> / {g.total} codes</span>
                    </p>
                    <p style={{ margin: 0, fontSize: 11.5, color: T.gold, fontWeight: 700 }}>
                      {fmt(g.cost_coins)} coins
                    </p>
                  </div>

                  {/* Stock bar */}
                  <div
                    style={{
                      height: 3,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: g.active > 0 ? `linear-gradient(90deg, ${T.blue}, #90CAFF)` : "rgba(255,255,255,0.1)",
                        width: `${g.total > 0 ? (g.active / g.total) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  {/* Manage Actions & Quick Quantity Add */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, color: T.textMute, fontWeight: 600 }}>+ Stock Quantity:</span>
                    {[3, 5, 10].map((addQty) => (
                      <motion.button
                        key={addQty}
                        whileTap={{ scale: 0.92 }}
                        onClick={async () => {
                          const brandPrefix = g.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'REWD';
                          const newCodes = Array.from({ length: addQty }).map((_, i) =>
                            `${brandPrefix}-SIM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${i + 1}`
                          );
                          if (onBulkAddCodes) {
                            await onBulkAddCodes(g.brand, g.label, g.cost_coins, newCodes, founderPw);
                          }
                          if (onRefresh) await onRefresh();
                          if (setActionMsg) setActionMsg(`Added +${addQty} vouchers to ${g.brand} (${g.label}).`);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 7,
                          background: "rgba(74,158,255,0.1)",
                          border: "1px solid rgba(74,158,255,0.25)",
                          color: "#80C4FF",
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        +{addQty} Vouchers
                      </motion.button>
                    ))}

                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={async () => {
                          const newActive = g.active === 0;
                          if (onManageReward) {
                            await onManageReward("toggle", g.brand, g.label, { active: newActive }, founderPw);
                          }
                          if (onRefresh) await onRefresh();
                        }}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: g.active > 0 ? "rgba(255,96,88,0.08)" : "rgba(0,255,136,0.08)",
                          border: `1px solid ${g.active > 0 ? "rgba(255,96,88,0.2)" : "rgba(0,255,136,0.2)"}`,
                          color: g.active > 0 ? T.error : "#00FF88",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {g.active > 0 ? "Deactivate" : "Activate"}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={async () => {
                          if (!window.confirm(`Delete ALL ${g.total} code(s) for ${g.brand} ${g.label}?`)) return;
                          if (onManageReward) {
                            await onManageReward("delete", g.brand, g.label, {}, founderPw);
                          }
                          if (onRefresh) await onRefresh();
                        }}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: "rgba(255,96,88,0.07)",
                          border: "1px solid rgba(255,96,88,0.18)",
                          color: T.error,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
