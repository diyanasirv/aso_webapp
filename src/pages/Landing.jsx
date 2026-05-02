import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* ─── tokens ─────────────────────────────────────────── */
const C = {
  brand:       "#4338ca",
  brandHover:  "#3730a3",
  brandLight:  "#ede9fe",
  brandBorder: "#c4b5fd",
  brandMid:    "#5b21b6",
  surface:     "#f5f3ff",
  white:       "#ffffff",
  ink:         "#1a1a2e",
  muted:       "#6b7280",
  hint:        "#9ca3af",
  border:      "#e5e7eb",
  borderFaint: "#f3f4f6",
};

/* ─── static content ─────────────────────────────────── */
const SERVICES = [
  { icon: "★", name: "App Reviews",   desc: "Genuine written reviews from verified users that lift your store credibility." },
  { icon: "◆", name: "App Ratings",   desc: "Push your star rating higher with real, organic submissions from authentic devices." },
  { icon: "↓", name: "App Installs",  desc: "Drive install volume that signals quality to the algorithm and climbs store ranking." },
  { icon: "⌖", name: "Keyword Boost", desc: "Target high-intent search terms and climb positions that convert browsers to installers." },
];

const FALLBACK_PACKAGES = [
  { id: 1, name: "Basic Boost",   quantity: "100 installs",   price: 29,  tag: "Starter",      featured: false },
  { id: 2, name: "Growth Pack",   quantity: "500 installs",   price: 99,  tag: "Most Popular", featured: true  },
  { id: 3, name: "Review Bundle", quantity: "50 reviews",     price: 79,  tag: "Reviews",      featured: false },
  { id: 4, name: "Rating Push",   quantity: "200 ratings",    price: 49,  tag: "Ratings",      featured: false },
  { id: 5, name: "Keyword Climb", quantity: "10 keywords",    price: 149, tag: "Keywords",     featured: false },
  { id: 6, name: "Scale Bundle",  quantity: "2,000 installs", price: 349, tag: "Enterprise",   featured: false },
];

const TRUST = [
  { icon: "⚡", title: "Fast Delivery",   sub: "Orders start in 24h" },
  { icon: "✦",  title: "Real Users",      sub: "No bots, ever"       },
  { icon: "🔒", title: "Secure Payments", sub: "Encrypted checkout"  },
  { icon: "↑",  title: "Growth Focused",  sub: "Sustainable results" },
];

/* ─── responsive hook ────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

/* ─── component ──────────────────────────────────────── */
export default function Landing() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [packages, setPackages] = useState([]);
  const [hovered,  setHovered]  = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!document.querySelector("#aso-fonts")) {
      const link = document.createElement("link");
      link.id    = "aso-fonts";
      link.rel   = "stylesheet";
      link.href  = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&display=swap";
      document.head.appendChild(link);
    }
    loadPackages();
  }, []);

  async function loadPackages() {
    const { data, error } = await supabase
      .from("packages")
      .select("id, name, quantity, price, services(name)")
      .limit(6);
    if (!error && data?.length) setPackages(data);
  }

  async function handleOrderNow() {
    const { data: { session } } = await supabase.auth.getSession();
    navigate(session ? "/add-order" : "/signup");
  }

  const pkgs = packages.length
    ? packages.map((p) => ({ ...p, tag: p.services?.name || "", featured: false }))
    : FALLBACK_PACKAGES;

  const hov    = (id) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) });
  const isHov  = (id) => hovered === id;
  const px     = isMobile ? "20px" : "48px";

  /* ── static base styles ── */
  const S = {
    page: { fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.white, color: C.ink, margin: 0, padding: 0, minHeight: "100vh" },

    /* nav */
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: `14px ${px}`, background: C.white, borderBottom: `1px solid ${C.borderFaint}`, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: C.brand, letterSpacing: "-0.5px" },
    hamburger: { background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 },
    mobileMenu: { background: C.white, borderBottom: `1px solid ${C.borderFaint}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
    mobileMenuLink: { fontSize: 15, fontWeight: 600, color: C.ink, textDecoration: "none", padding: "8px 0", borderBottom: `1px solid ${C.borderFaint}` },
    mobileBtns: { display: "flex", gap: 8, paddingTop: 4 },

    /* hero */
    hero: { padding: isMobile ? "48px 20px 40px" : "88px 48px 80px", background: C.surface },
    pill: { display: "inline-flex", alignItems: "center", gap: 8, background: C.brandLight, border: `1px solid ${C.brandBorder}`, borderRadius: 100, padding: "5px 14px", fontSize: 11, color: C.brandMid, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 },
    pillDot: { width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: "asoBlink 2s infinite", flexShrink: 0 },
    heroTitle: { fontFamily: "'Fraunces', serif", fontSize: isMobile ? 38 : 58, fontWeight: 700, lineHeight: 1.07, color: C.ink, letterSpacing: isMobile ? "-1.5px" : "-2px", marginBottom: 16 },
    heroSub: { fontSize: 15, color: C.muted, lineHeight: 1.75, maxWidth: 420, marginBottom: 32, fontWeight: 400 },
    heroCtas: { display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" },
    heroStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: isMobile ? 36 : 0, width: isMobile ? "100%" : 260, flexShrink: 0 },
    statBox: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 16px", textAlign: "center" },
    statNum: { fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: C.brand, letterSpacing: "-1px", lineHeight: 1 },
    statLbl: { fontSize: 12, color: C.hint, marginTop: 4, fontWeight: 500 },

    /* trust */
    trustRow: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", background: "#fafafa", borderTop: `1px solid ${C.borderFaint}`, borderBottom: `1px solid ${C.borderFaint}` },
    trustItem: { display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "14px 16px" : "18px 24px", borderRight: `1px solid ${C.borderFaint}` },
    trustIcon: { width: 32, height: 32, borderRadius: 8, background: C.brandLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
    trustV: { fontSize: isMobile ? 12 : 13, fontWeight: 700, color: C.ink },
    trustL: { fontSize: 11, color: C.hint, marginTop: 1 },

    /* sections */
    sec:      { padding: isMobile ? "48px 20px" : "80px 48px" },
    secLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "2px", color: "#7c3aed", fontWeight: 700, marginBottom: 8 },
    secTitle: { fontFamily: "'Fraunces', serif", fontSize: isMobile ? 28 : 38, fontWeight: 700, letterSpacing: "-1.5px", color: C.ink, marginBottom: isMobile ? 24 : 40, lineHeight: 1.1 },

    /* services */
    svcGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 12 : 16 },
    svcIcon: { width: 38, height: 38, borderRadius: 10, background: C.brandLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 14 },
    svcName: { fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 },
    svcDesc: { fontSize: 12, color: C.hint, lineHeight: 1.6 },

    /* pricing */
    pricingSec: { padding: isMobile ? "48px 20px" : "80px 48px", background: C.surface },
    pkgGrid:    { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 },
    pkgTagBase: { fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", color: C.hint, fontWeight: 600, marginBottom: 10 },
    pkgTagHot:  { display: "inline-block", background: C.brandLight, color: C.brandMid, borderRadius: 6, padding: "3px 10px", fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 },
    pkgName:    { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.5px", marginBottom: 4 },
    pkgQty:     { fontSize: 13, color: C.hint, marginBottom: 18 },
    pkgPrice:   { fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 700, color: C.brand, letterSpacing: "-2px", lineHeight: 1, marginBottom: 20 },
    pkgPriceSup:{ fontSize: 19, verticalAlign: "top", marginTop: 9, letterSpacing: 0 },

    /* cta */
    ctaBanner: { margin: isMobile ? "0 20px 48px" : "0 48px 80px", borderRadius: 18, background: C.brand, padding: isMobile ? "36px 24px" : "52px 48px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 20 : 24 },
    ctaTitle:   { fontFamily: "'Fraunces', serif", fontSize: isMobile ? 26 : 34, fontWeight: 700, color: C.white, letterSpacing: "-1.5px", lineHeight: 1.15 },
    ctaSub:     { fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 8 },

    /* footer */
    footer:     { borderTop: `1px solid ${C.borderFaint}`, padding: `18px ${px}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white },
    footerLogo: { fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: C.brand },
    footerCopy: { fontSize: 12, color: "#d1d5db" },
  };

  /* ── dynamic button styles ── */
  const btnOutline = (id) => ({
    background: isHov(id) ? C.brandLight : C.white,
    border: `1.5px solid ${isHov(id) ? C.brand : C.border}`,
    color: isHov(id) ? C.brand : "#374151",
    padding: "8px 18px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
  });

  const btnSolid = (id) => ({
    background: isHov(id) ? C.brandHover : C.brand, border: "none", color: C.white,
    padding: "8px 18px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
  });

  const btnHeroPrimary = (id) => ({
    background: isHov(id) ? C.brandHover : C.brand, color: C.white, border: "none",
    padding: "14px 26px", borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
    textAlign: "center",
  });

  const btnHeroGhost = (id) => ({
    background: C.white, color: isHov(id) ? C.brand : "#374151",
    border: `1.5px solid ${isHov(id) ? C.brand : C.border}`,
    padding: "14px 26px", borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
    textDecoration: "none", display: "inline-block", textAlign: "center",
  });

  const svcCardStyle = (id) => ({
    background: C.white,
    border: `1.5px solid ${isHov(id) ? C.brandBorder : C.borderFaint}`,
    borderRadius: 14, padding: isMobile ? "20px 16px" : "26px 20px", cursor: "default",
    transition: "all 0.22s", transform: isHov(id) ? "translateY(-3px)" : "none",
    boxShadow: isHov(id) ? "0 6px 24px rgba(67,56,202,0.08)" : "none",
  });

  const pkgCardStyle = (pkg) => {
    const feat = pkg.featured || pkg.tag === "Most Popular";
    const h    = isHov(`pkg-${pkg.id}`);
    return {
      background: C.white,
      border: feat ? `2px solid ${C.brand}` : `1.5px solid ${h ? "#a5b4fc" : C.border}`,
      borderRadius: 16, padding: isMobile ? "22px 20px" : 28, transition: "all 0.22s",
      transform: h ? "translateY(-3px)" : "none",
      boxShadow: h ? "0 10px 32px rgba(67,56,202,0.10)" : "none",
    };
  };

  const btnPkgStyle = (pkg) => {
    const feat = pkg.featured || pkg.tag === "Most Popular";
    const h    = isHov(`order-${pkg.id}`);
    return {
      width: "100%",
      background: feat ? (h ? C.brandHover : C.brand) : (h ? C.brand : C.surface),
      border: `1.5px solid ${feat ? (h ? C.brandHover : C.brand) : (h ? C.brand : C.brandBorder)}`,
      color: feat || h ? C.white : C.brand,
      padding: "11px", borderRadius: 9, fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s",
    };
  };

  const btnCtaWhite = (id) => ({
    background: isHov(id) ? C.brandLight : C.white, color: C.brand, border: "none",
    padding: "14px 28px", borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
    transition: "all 0.18s", alignSelf: isMobile ? "stretch" : "auto",
    textAlign: "center",
  });

  /* ─── render ─────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes asoBlink { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div style={S.page}>

        {/* ── NAV ── */}
        <nav style={S.nav}>
          <div style={S.logo}>ASOBoost</div>

          {isMobile ? (
            <button style={S.hamburger} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                {["services", "pricing", "contact"].map((id) => (
                  <a key={id} href={`#${id}`} style={{ fontSize: 14, fontWeight: 500, textDecoration: "none", color: isHov(`nav-${id}`) ? C.ink : C.muted, transition: "color 0.18s" }} {...hov(`nav-${id}`)}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </a>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btnOutline("login")}  {...hov("login")}  onClick={() => navigate("/login")}>Login</button>
                <button style={btnSolid("signup")} {...hov("signup")} onClick={() => navigate("/signup")}>Sign Up</button>
              </div>
            </>
          )}
        </nav>

        {/* mobile menu */}
        {isMobile && menuOpen && (
          <div style={S.mobileMenu}>
            {["services", "pricing", "contact"].map((id) => (
              <a key={id} href={`#${id}`} style={S.mobileMenuLink} onClick={() => setMenuOpen(false)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
            <div style={S.mobileBtns}>
              <button style={{ ...btnOutline("m-login"),  flex: 1 }} onClick={() => navigate("/login")}>Login</button>
              <button style={{ ...btnSolid("m-signup"), flex: 1 }} onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <section style={S.hero}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 0 : 56, alignItems: isMobile ? "flex-start" : "center" }}>
            <div style={{ flex: 1 }}>
              <div style={S.pill}>
                <div style={S.pillDot} />
                Trusted by 2,400+ publishers
              </div>
              <h1 style={S.heroTitle}>
                Grow Your App<br />Rankings{" "}
                <em style={{ fontStyle: "italic", color: C.brand }}>Faster.</em>
              </h1>
              <p style={S.heroSub}>
                Real installs, genuine ratings, and keyword boosts from authentic users — built for sustainable, long-term growth.
              </p>
              <div style={S.heroCtas}>
                <button style={btnHeroPrimary("cta-start")} {...hov("cta-start")} onClick={handleOrderNow}>Get Started →</button>
                <a href="#pricing" style={btnHeroGhost("cta-pricing")} {...hov("cta-pricing")}>View Pricing</a>
              </div>
            </div>

            <div style={S.heroStats}>
              {[
                { num: "98%",  lbl: "Satisfaction" },
                { num: "24h",  lbl: "Delivery" },
                { num: "12k+", lbl: "Orders delivered", wide: true },
              ].map((stat) => (
                <div key={stat.lbl} style={{ ...S.statBox, ...(stat.wide ? { gridColumn: "1/-1" } : {}) }}>
                  <div style={S.statNum}>{stat.num}</div>
                  <div style={S.statLbl}>{stat.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div style={S.trustRow}>
          {TRUST.map((t, i) => (
            <div key={t.title} style={{ ...S.trustItem, ...(i === TRUST.length - 1 || (isMobile && i % 2 === 1) ? { borderRight: "none" } : {}), ...(isMobile && i >= 2 ? { borderTop: `1px solid ${C.borderFaint}` } : {}) }}>
              <div style={S.trustIcon}>{t.icon}</div>
              <div>
                <div style={S.trustV}>{t.title}</div>
                <div style={S.trustL}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SERVICES ── */}
        <section id="services" style={S.sec}>
          <div style={S.secLabel}>What we offer</div>
          <div style={S.secTitle}>Our Services</div>
          <div style={S.svcGrid}>
            {SERVICES.map((svc) => (
              <div key={svc.name} style={svcCardStyle(`svc-${svc.name}`)} {...hov(`svc-${svc.name}`)}>
                <div style={S.svcIcon}>{svc.icon}</div>
                <div style={S.svcName}>{svc.name}</div>
                <div style={S.svcDesc}>{svc.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={S.pricingSec}>
          <div style={S.secLabel}>Plans & packages</div>
          <div style={S.secTitle}>Popular Packages</div>
          <div style={S.pkgGrid}>
            {pkgs.map((pkg) => {
              const isFeatured = pkg.featured || pkg.tag === "Most Popular";
              return (
                <div key={pkg.id} style={pkgCardStyle(pkg)} {...hov(`pkg-${pkg.id}`)}>
                  <div style={isFeatured ? S.pkgTagHot : S.pkgTagBase}>{pkg.tag}</div>
                  <div style={S.pkgName}>{pkg.name}</div>
                  <div style={S.pkgQty}>{pkg.quantity}</div>
                  <div style={S.pkgPrice}><sup style={S.pkgPriceSup}>$</sup>{pkg.price}</div>
                  <button style={btnPkgStyle(pkg)} {...hov(`order-${pkg.id}`)} onClick={handleOrderNow}>
                    Order Now →
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <div id="contact" style={S.ctaBanner}>
          <div>
            <div style={S.ctaTitle}>Need a custom growth campaign for your app?</div>
            <div style={S.ctaSub}>We build tailored packages for every budget and goal.</div>
          </div>
          <button style={btnCtaWhite("contact-btn")} {...hov("contact-btn")} onClick={() => navigate("/contact")}>
            Contact Us →
          </button>
        </div>

        {/* ── FOOTER ── */}
        <footer style={S.footer}>
          <div style={S.footerLogo}>ASOBoost</div>
          <div style={S.footerCopy}>© 2026 ASOBoost. All rights reserved.</div>
        </footer>

      </div>
    </>
  );
}