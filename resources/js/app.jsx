import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";

// ── Cart Context ────────────────────────────────────────────
const CartCtx = createContext();
function useCart() { return useContext(CartCtx); }

function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const add = (product) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setToast(product.name);
    setTimeout(() => setToast(null), 2200);
  };
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) return remove(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <CartCtx.Provider value={{ items, add, remove, updateQty, clear, count, total, toast }}>
      {children}
    </CartCtx.Provider>
  );
}

// ── Dummy Products for hero ─────────────────────────────────
const FEATURED = [
  { id: 901, name: "Sony WH-1000XM5", description: "Industry-leading noise canceling headphones with 30hr battery.", price: 348, rating: 4.7, reviews_count: 12453, category: "Electronics", image_url: null, is_prime: true },
  { id: 902, name: "Apple MacBook Air 15\" M3", description: "Strikingly thin with M3 chip and 18-hour battery life.", price: 1299, rating: 4.8, reviews_count: 8921, category: "Computers", image_url: null, is_prime: true },
  { id: 903, name: "Kindle Paperwhite Signature", description: "6.8\" display, wireless charging, 32GB storage.", price: 189.99, rating: 4.6, reviews_count: 34210, category: "Electronics", image_url: null, is_prime: true },
  { id: 904, name: "Dyson V15 Detect", description: "Laser-equipped cordless vacuum with particle counter.", price: 749.99, rating: 4.5, reviews_count: 9876, category: "Home", image_url: null, is_prime: true },
  { id: 905, name: "Ooni Koda 16 Pizza Oven", description: "Gas-powered, cooks 16\" pizzas in 60 seconds.", price: 599, rating: 4.7, reviews_count: 8760, category: "Kitchen", image_url: null, is_prime: true },
  { id: 906, name: "PS5 Slim Digital Edition", description: "Compact PS5 with 1TB SSD and 4K gaming.", price: 449.99, rating: 4.7, reviews_count: 29876, category: "Gaming", image_url: null, is_prime: true },
];

const CATEGORIES = ["Electronics", "Computers", "Gaming", "Kitchen", "Home", "Fitness", "Outdoors", "Clothing"];
const CAT_EMOJI = { Electronics: "🔌", Computers: "💻", Gaming: "🎮", "Smart Home": "🏠", Kitchen: "🍳", Fitness: "💪", Health: "❤️", Wearables: "⌚", Outdoors: "🏔️", Clothing: "👕", Shoes: "👟", Travel: "🧳", Office: "🖊️", "Personal Care": "✨", Pets: "🐾", Auto: "🚗", "Musical Instruments": "🎵", Garden: "🌱", Baby: "👶", Toys: "🧸", Crafts: "✂️", Accessories: "👜" };

const SUGGESTIONS = [
  "I need something to help me sleep better",
  "Gift for someone who loves building things",
  "Best coffee setup for home barista",
  "Better desk setup for working from home",
  "Something for long road trips",
  "I want to start running outdoors",
  "Keep my house clean automatically",
  "Premium audio experience",
];

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n) => {
  const w = Math.floor(n);
  const c = ((n % 1) * 100).toFixed(0).padStart(2, "0");
  return { whole: w, cents: c };
};

// ── Small Components ────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: i < Math.round(rating) ? "#F59E0B" : "#D1D5DB", fontSize: size }}>★</span>
      ))}
      <span style={{ color: "#6B7280", fontSize: size - 1, marginLeft: 3 }}>{rating}</span>
    </span>
  );
}

function Price({ amount, size = "md" }) {
  const { whole, cents } = fmt(amount);
  const fs = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  const ss = size === "lg" ? 14 : size === "sm" ? 10 : 12;
  return (
    <span style={{ fontWeight: 700, color: "#111827", fontSize: fs, lineHeight: 1 }}>
      <span style={{ fontSize: ss, verticalAlign: "top", fontWeight: 400 }}>$</span>
      {whole}
      <span style={{ fontSize: ss, verticalAlign: "top", fontWeight: 400 }}>.{cents}</span>
    </span>
  );
}

function Badge({ children, color = "#2563EB", bg = "#EFF6FF" }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", background: bg, borderRadius: 4, fontSize: 11, fontWeight: 600, color }}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, full, style: sx }) {
  const base = { border: "none", borderRadius: size === "sm" ? 8 : 12, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, transition: "all 0.15s ease", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: full ? "100%" : undefined, opacity: disabled ? 0.6 : 1 };
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 22px", fontSize: 14 }, lg: { padding: "14px 32px", fontSize: 16 } };
  const variants = {
    primary: { background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" },
    amber: { background: "linear-gradient(135deg, #FCD34D, #F59E0B)", color: "#78350F" },
    outline: { background: "transparent", color: "#6366F1", border: "1.5px solid #C7D2FE" },
    ghost: { background: "transparent", color: "#6B7280" },
    success: { background: "linear-gradient(135deg, #34D399, #059669)", color: "#fff" },
    danger: { background: "#FEE2E2", color: "#DC2626" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...sx }}>{children}</button>;
}

// ── Toast ───────────────────────────────────────────────────
function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1E1B4B", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 9999, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "toastIn 0.3s ease" }}>
      <span style={{ fontSize: 18 }}>✓</span> Added "{toast}" to cart
    </div>
  );
}

// ── Product Card ────────────────────────────────────────────
function ProductCard({ product, idx = 0, onView }) {
  const { add } = useCart();
  const emoji = CAT_EMOJI[product.category] || "📦";
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", transition: "all 0.2s", cursor: "pointer", animation: `fadeUp 0.35s ease ${idx * 0.04}s both` }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Image area */}
      <div onClick={() => onView?.(product)} style={{ height: 140, background: `linear-gradient(135deg, #F0F4FF, #E8ECFF)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
        {product.image_url ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : emoji}
        {product.is_prime && <div style={{ position: "absolute", top: 8, right: 8 }}><Badge>✓ Prime</Badge></div>}
        {product.similarity != null && (
          <div style={{ position: "absolute", top: 8, left: 8 }}><Badge color="#7C3AED" bg="#EDE9FE">{(product.similarity * 100).toFixed(0)}% match</Badge></div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#A78BFA", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{product.category}</p>
        <h3 onClick={() => onView?.(product)} style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</h3>
        <div style={{ marginTop: 4 }}><Stars rating={product.rating} size={12} /></div>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#B0B0B0" }}>{(product.reviews_count || 0).toLocaleString()} ratings</p>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Price amount={product.price} size="sm" />
          <Btn variant="amber" size="sm" onClick={e => { e.stopPropagation(); add(product); }}>+ Cart</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Modal ────────────────────────────────────
function ProductModal({ product, onClose }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const emoji = CAT_EMOJI[product.category] || "📦";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, maxWidth: 700, width: "100%", maxHeight: "90vh", overflow: "auto", display: "flex", flexDirection: "row", animation: "scaleIn 0.25s ease" }}>
        {/* Image */}
        <div style={{ width: 280, minWidth: 280, background: "linear-gradient(135deg, #F0F4FF, #E8ECFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, borderRadius: "20px 0 0 20px" }}>
          {product.image_url ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px 0 0 20px" }} /> : emoji}
        </div>
        {/* Details */}
        <div style={{ flex: 1, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#A78BFA", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{product.category}</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#111827" }}>{product.name}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF", padding: 4 }}>✕</button>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <Stars rating={product.rating} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{(product.reviews_count || 0).toLocaleString()} ratings</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 14, color: "#4B5563", lineHeight: 1.6 }}>{product.description}</p>
          <div style={{ marginTop: 16, padding: "16px 0", borderTop: "1px solid #F3F4F6" }}>
            <Price amount={product.price} size="lg" />
            {product.is_prime && <span style={{ marginLeft: 10 }}><Badge>✓ Prime — FREE delivery</Badge></span>}
          </div>
          <p style={{ margin: "4px 0 12px", fontSize: 13, color: "#059669", fontWeight: 500 }}>✓ In Stock</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, border: "none", background: "#F9FAFB", cursor: "pointer", fontSize: 16 }}>−</button>
              <span style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, border: "none", background: "#F9FAFB", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <Btn variant="amber" size="md" style={{ flex: 1 }} onClick={() => { for (let i = 0; i < qty; i++) add(product); onClose(); }}>Add to Cart — ${(product.price * qty).toFixed(2)}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cart Drawer ─────────────────────────────────────────────
function CartDrawer({ open, onClose, onCheckout }) {
  const { items, remove, updateQty, total, count } = useCart();
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, animation: "fadeIn 0.2s ease" }} />}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "90vw", background: "#fff", zIndex: 2001, boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.15)" : "none", transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Shopping Cart ({count})</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
        </div>
        {/* Items */}
        <div style={{ flex: 1, overflow: "auto", padding: items.length ? "16px 24px" : "60px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ fontWeight: 500 }}>Your cart is empty</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Find something you love!</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #F9FAFB" }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {CAT_EMOJI[item.category] || "📦"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                <Price amount={item.price} size="sm" />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 6, overflow: "hidden" }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, border: "none", background: "#F9FAFB", cursor: "pointer", fontSize: 13 }}>−</button>
                    <span style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 600 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, border: "none", background: "#F9FAFB", cursor: "pointer", fontSize: 13 }}>+</button>
                  </div>
                  <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Remove</button>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>${(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>
        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Subtotal ({count} items)</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Shipping</span>
              <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>FREE</span>
            </div>
            <Btn variant="amber" size="lg" full onClick={() => { onClose(); onCheckout(); }}>Proceed to Checkout — ${total.toFixed(2)}</Btn>
          </div>
        )}
      </div>
    </>
  );
}

// ── Checkout Page ───────────────────────────────────────────
function Checkout({ onBack, onComplete }) {
  const { items, total, count } = useCart();
  const [step, setStep] = useState(1); // 1=form, 2=review, 3=processing
  const [form, setForm] = useState({ name: "", email: "", address: "", city: "", zip: "", card: "", exp: "", cvv: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filled = form.name && form.email && form.address && form.city && form.zip;
  const cardFilled = form.card.length >= 16 && form.exp.length >= 4 && form.cvv.length >= 3;

  const process = () => {
    setStep(3);
    setTimeout(() => onComplete(), 2000);
  };

  if (items.length === 0) { onBack(); return null; }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px", animation: "fadeUp 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6366F1", fontSize: 14, cursor: "pointer", fontWeight: 500, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Back to shop</button>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {["Shipping", "Payment", "Confirm"].map((label, i) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 2, background: step > i ? "#6366F1" : "#E5E7EB", transition: "background 0.3s" }} />
            <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 600, color: step > i ? "#4338CA" : "#9CA3AF" }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
        {/* Left: forms */}
        <div style={{ flex: 1 }}>
          {step === 1 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 28 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Shipping Information</h3>
              {[["name", "Full Name", "text"], ["email", "Email", "email"], ["address", "Street Address", "text"], ["city", "City", "text"], ["zip", "Zip / Postal Code", "text"]].map(([k, l, t]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{l}</label>
                  <input value={form[k]} onChange={e => set(k, e.target.value)} type={t} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#818CF8"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                </div>
              ))}
              <Btn variant="primary" size="lg" full disabled={!filled} onClick={() => setStep(2)} style={{ marginTop: 8 }}>Continue to Payment →</Btn>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 28 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Payment Details</h3>
              <div style={{ padding: "12px 16px", background: "#FFFBEB", borderRadius: 10, marginBottom: 20, fontSize: 12, color: "#92400E" }}>🔒 This is a demo — no real payment will be processed.</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Card Number</label>
                <input value={form.card} onChange={e => set("card", e.target.value.replace(/\D/g, "").slice(0, 16))} placeholder="4242 4242 4242 4242" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} onFocus={e => e.target.style.borderColor = "#818CF8"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Expiry</label>
                  <input value={form.exp} onChange={e => set("exp", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="MMYY" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} onFocus={e => e.target.style.borderColor = "#818CF8"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>CVV</label>
                  <input value={form.cvv} onChange={e => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" type="password" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} onFocus={e => e.target.style.borderColor = "#818CF8"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <Btn variant="outline" size="lg" onClick={() => setStep(1)}>← Back</Btn>
                <Btn variant="success" size="lg" style={{ flex: 1 }} disabled={!cardFilled} onClick={process}>Pay ${total.toFixed(2)}</Btn>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 48, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #6366F1", borderTopColor: "transparent", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Processing your order...</h3>
              <p style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>Please wait while we confirm your payment</p>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div style={{ width: 300, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 24, position: "sticky", top: 20 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Order Summary</h4>
          {items.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "#4B5563", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>{item.name} × {item.qty}</span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
              <span>Subtotal</span><span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
              <span>Shipping</span><span style={{ color: "#059669" }}>Free</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
              <span>Tax (est.)</span><span>${(total * 0.08).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, paddingTop: 10, borderTop: "1.5px solid #E5E7EB" }}>
              <span>Total</span><span>${(total * 1.08).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Success ───────────────────────────────────────────
function OrderSuccess({ onContinue }) {
  const orderId = `SM-${Date.now().toString(36).toUpperCase()}`;
  return (
    <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", padding: 20, animation: "fadeUp 0.4s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, animation: "scaleIn 0.4s ease 0.2s both" }}>✓</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>Order Confirmed!</h1>
      <p style={{ fontSize: 15, color: "#6B7280", marginTop: 10 }}>Thank you for your purchase. Your order has been placed successfully.</p>
      <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "20px 28px", marginTop: 24, display: "inline-block", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, fontSize: 13 }}>
          <div><p style={{ color: "#9CA3AF", margin: "0 0 2px" }}>Order Number</p><p style={{ margin: 0, fontWeight: 700, color: "#4338CA" }}>{orderId}</p></div>
          <div><p style={{ color: "#9CA3AF", margin: "0 0 2px" }}>Estimated Delivery</p><p style={{ margin: 0, fontWeight: 700 }}>{new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p></div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <Btn variant="primary" size="lg" onClick={onContinue}>Continue Shopping</Btn>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────
function Shop() {
  const { count, clear } = useCart();
  const [page, setPage] = useState("home"); // home | checkout | success
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState("hybrid");
  const [searchTime, setSearchTime] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
    setSearchTime(null);
    inputRef.current?.focus();
  };

  const doSearch = useCallback(async (q) => {
    const sq = q || query;
    if (!sq.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setSearched(true); setError(null); setSearchTime(null);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: sq, limit: 24, mode: searchMode }), signal: ctrl.signal });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setSearchTime(Math.round(performance.now() - t0));
      setResults(data.results || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Search failed.");
      setResults([]);
    } finally { setLoading(false); }
  }, [query, searchMode]);

  // ── Render ──────────────────────────────────────
  if (page === "checkout") return (
    <Page count={count} onCartOpen={() => setCartOpen(true)} onHome={() => setPage("home")}>
      <Checkout onBack={() => setPage("home")} onComplete={() => { clear(); setPage("success"); }} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setPage("checkout")} />
    </Page>
  );

  if (page === "success") return (
    <Page count={count} onCartOpen={() => setCartOpen(true)} onHome={() => setPage("home")}>
      <OrderSuccess onContinue={() => { clearSearch(); setPage("home"); }} />
    </Page>
  );

  return (
    <Page count={count} onCartOpen={() => setCartOpen(true)} onHome={() => { clearSearch(); setPage("home"); }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", paddingTop: searched ? 24 : 56, paddingBottom: searched ? 16 : 0, transition: "padding 0.4s" }}>
          {!searched && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: "#1E1B4B", margin: 0, letterSpacing: -1 }}>What are you looking to buy?</h1>
              <p style={{ fontSize: 16, color: "#6B7280", marginTop: 8 }}>Describe what you need — our AI understands natural language</p>
            </div>
          )}

          {/* Search */}
          <div style={{ marginTop: searched ? 0 : 28, display: "flex", alignItems: "center", background: "#fff", borderRadius: 16, border: "2px solid #E0E7FF", boxShadow: "0 4px 24px rgba(99,102,241,0.08)", padding: "4px 4px 4px 18px", maxWidth: 680, margin: searched ? "0 auto" : "28px auto 0", transition: "all 0.3s" }}>
            <span style={{ fontSize: 18, marginRight: 8, opacity: 0.4 }}>🔍</span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder='Try "noise canceling headphones for flights" or "gift for a coffee lover"' style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "13px 0", background: "transparent", color: "#111827" }} />
            {query && (
              <button onClick={clearSearch} style={{ background: "none", border: "none", fontSize: 18, color: "#9CA3AF", cursor: "pointer", padding: "6px 10px", lineHeight: 1 }} title="Clear search">✕</button>
            )}
            <Btn variant="primary" size="md" disabled={loading || !query.trim()} onClick={() => doSearch()}>
              {loading ? "Searching…" : "Search"}
            </Btn>
          </div>

          {/* Mode toggle */}
          {searched && !loading && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
              {["hybrid", "semantic"].map(m => (
                <button key={m} onClick={() => { setSearchMode(m); setTimeout(() => doSearch(), 0); }} style={{ padding: "3px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1.5px solid", cursor: "pointer", background: searchMode === m ? "#EEF2FF" : "#fff", borderColor: searchMode === m ? "#818CF8" : "#E5E7EB", color: searchMode === m ? "#4338CA" : "#9CA3AF", transition: "all 0.2s" }}>
                  {m === "hybrid" ? "🔀 Hybrid" : "🧠 Semantic"}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {!searched && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18, animation: "fadeUp 0.4s ease 0.15s both" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s); doSearch(s); }} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#6B7280", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.target.style.borderColor = "#818CF8"; e.target.style.color = "#4F46E5"; e.target.style.background = "#F5F3FF"; }} onMouseLeave={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.color = "#6B7280"; e.target.style.background = "#fff"; }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 0" }}>
            <div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366F1", animation: `pulse 1s ease ${i * 0.2}s infinite` }} />)}</div>
            <p style={{ color: "#6B7280", fontSize: 14, marginTop: 14 }}>Finding the best products for you...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", margin: "16px 0", display: "flex", gap: 10 }}>
            <span>⚠️</span><p style={{ margin: 0, fontSize: 13, color: "#991B1B" }}>{error}</p>
          </div>
        )}

        {/* Search Results */}
        {searched && !loading && (
          <div style={{ paddingBottom: 60 }}>
            {results.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, #EEF2FF, #F0F4FF)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, border: "1px solid #E0E7FF", animation: "fadeUp 0.3s ease" }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <p style={{ margin: 0, fontSize: 13, color: "#4338CA", lineHeight: 1.5 }}>
                  Found <strong>{results.length}</strong> products matching "<em>{query}</em>"
                  {searchTime && <span style={{ color: "#818CF8" }}> · {searchTime}ms</span>}
                </p>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {results.map((p, i) => <ProductCard key={p.id} product={p} idx={i} onView={setViewProduct} />)}
            </div>
            {results.length === 0 && !error && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <h3 style={{ color: "#374151", fontSize: 18, margin: 0 }}>No matches found</h3>
                <p style={{ color: "#9CA3AF", fontSize: 14, marginTop: 8 }}>Try different words or browse our categories below</p>
                <Btn variant="outline" size="md" onClick={clearSearch} style={{ marginTop: 16 }}>← Browse All</Btn>
              </div>
            )}
          </div>
        )}

        {/* Default Home Content */}
        {!searched && !loading && (
          <div style={{ paddingBottom: 60, animation: "fadeUp 0.4s ease 0.1s both" }}>
            {/* Categories */}
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E1B4B", margin: "0 0 16px" }}>Shop by Category</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => { setQuery(c); doSearch(c); }} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "18px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#818CF8"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 28 }}>{CAT_EMOJI[c] || "📦"}</div>
                    <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#374151" }}>{c}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E1B4B", margin: "0 0 16px" }}>Featured Products</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {FEATURED.map((p, i) => <ProductCard key={p.id} product={p} idx={i} onView={setViewProduct} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals & drawers */}
      <ProductModal product={viewProduct} onClose={() => setViewProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setPage("checkout")} />
    </Page>
  );
}

// ── Page Shell (header + footer) ────────────────────────────
function Page({ children, count, onCartOpen, onHome }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { opacity:0.35; } 50% { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        input::placeholder { color:#9CA3AF; }
        *::-webkit-scrollbar { width:6px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81, #4338CA)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 500 }}>
        <div onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <span style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>SmartShop</span>
          <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,255,255,0.12)", color: "#C7D2FE", padding: "2px 7px", borderRadius: 8, marginLeft: 2 }}>AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ color: "#C7D2FE", fontSize: 13, cursor: "pointer" }}>Orders</span>
          <span style={{ color: "#C7D2FE", fontSize: 13, cursor: "pointer" }}>Account</span>
          <button onClick={onCartOpen} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 14, fontWeight: 600, position: "relative", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
            🛒
            {count > 0 && <span style={{ background: "#F59E0B", color: "#78350F", borderRadius: 10, padding: "0 6px", fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{count}</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* Footer */}
      <div style={{ background: "#1E1B4B", padding: "30px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#6366F1", fontSize: 12 }}>SmartShop © 2026 — AI-Powered Product Discovery</p>
        <p style={{ margin: "4px 0 0", color: "#4338CA", fontSize: 11 }}>Built with Laravel, Supabase pgvector & OpenAI Embeddings</p>
      </div>

      <Toast />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
function App() {
  return (
    <CartProvider>
      <Shop />
    </CartProvider>
  );
}

// ── Mount to DOM ────────────────────────────────────────────
const el = document.getElementById("root");
if (el) {
  createRoot(el).render(<App />);
}