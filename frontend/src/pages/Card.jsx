import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import PageFlipShell from "../components/PageFlipShell";
import { benefitsDb } from "../services/benefitsDb";

export default function Card() {
  const baseUrl = window.location.origin;
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);

  // Keep both faces EXACT same height as the front face
  const frontRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  useLayoutEffect(() => {
    const el = frontRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h && h > 0) setCardHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const stored = localStorage.getItem("member");
  const memberFallback = {
    displayName: "Hugo Crocco",
    rutMasked: "16664*****",
    section: "Valparaíso Moto Club",
    credentialCode: "VMC-0001",
    photoUrl: "",
  };

  let member = memberFallback;
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      member = { ...memberFallback, ...parsed };
    } catch {
      member = memberFallback;
    }
  }

  const status = member.credentialCode ? "VALID" : "NOT_FOUND";
  const statusLabel = status === "VALID" ? "MIEMBRO VIGENTE" : "NO REGISTRADO";

  const verifyUrl = `${baseUrl}/#/verify/${member.credentialCode || "NO-CARD"}`;

  const benefits = useMemo(() => {
    const raw = Array.isArray(benefitsDb) ? benefitsDb : [];
    return raw.filter((b) => b?.active !== false);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("member");
      localStorage.removeItem("session");
      localStorage.removeItem("role");
      localStorage.removeItem("isAdmin");
    } catch (e) {
      // ignore
    }
    navigate("/", { replace: true });
  };

  const flipInnerStyle = {
    ...styles.flipInner,
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div
            style={{
              ...styles.flipCard,
              height: cardHeight ? cardHeight : undefined,
            }}
          >
            <div style={flipInnerStyle}>
              {/* FRONT */}
              <div style={{ ...styles.flipFace, ...styles.flipFront }}>
                <div ref={frontRef}>
                  <CardPreview
                    member={{
                      ...member,
                      statusLabel,
                      photoUrl: member.photoUrl || "",
                    }}
                    qrValue={verifyUrl}
                    status={status}
                  />

                  <div style={styles.footer}>
                    <button
                      type="button"
                      onClick={() => setFlipped(true)}
                      style={styles.linkButton}
                    >
                      Ver Beneficios
                    </button>
                    <span style={styles.dot}>•</span>
                    <Link to="/" style={styles.link}>
                      Ir al inicio
                    </Link>
                    <span style={styles.dot}>•</span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={styles.linkButton}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>

              {/* BACK */}
              <div style={{ ...styles.flipFace, ...styles.flipBack }}>
                <div style={styles.backCard}>
                  <div style={styles.backHeader}>
                    <div style={styles.brandRow}>
                      <div style={styles.logoWrap}>
                        <img
                          src="/VMC.PNG"
                          alt="Logo VMC"
                          style={styles.logo}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <div style={styles.backTitle}>Beneficios VMC</div>
                        <div style={styles.backSub}>
                          {member.displayName || "Invitado"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.benefitList}>
                    {benefits.length === 0 ? (
                      <div style={styles.empty}>No hay beneficios cargados todavía.</div>
                    ) : (
                      benefits.map((b) => (
                        <div key={b.id ?? b.title} style={styles.benefitItem}>
                          <div style={styles.benefitTitle}>• {b.title}</div>
                          <div style={styles.benefitDesc}>{b.detail}</div>
                          <div style={styles.benefitMeta}>
                            {b.institution ? `• ${b.institution}` : ""}
                            {b.category ? `  •  ${b.category}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={styles.backFooter}>
                    <button
                      type="button"
                      onClick={() => setFlipped(false)}
                      style={styles.linkButton}
                    >
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageFlipShell>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1F2A14", // olive dark
    padding: 20,
    fontFamily: "system-ui",
  },
  container: { maxWidth: 420, margin: "0 auto" },

  flipCard: {
    position: "relative",
    width: "100%",
    perspective: 1200,
  },
  flipInner: {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transition: "transform 0.6s ease",
  },
  flipFace: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },
  flipFront: { transform: "rotateY(0deg)" },
  flipBack: { transform: "rotateY(180deg)" },

  footer: { textAlign: "center", marginTop: 12 },
  link: {
    color: "#A3D07C", // olive accent
    fontWeight: 900,
    textDecoration: "none",
  },
  dot: { color: "rgba(255,255,255,0.40)", margin: "0 10px" },
  linkButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    color: "#A3D07C", // olive accent
    fontWeight: 900,
    textDecoration: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
  },

  backCard: {
    borderRadius: 24,
    background: "#556B2F", // olive main
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: 18,
  },
  backHeader: {
    marginBottom: 12,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 14,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flex: "0 0 auto",
  },
  logo: {
    width: 120,
    height: 120,
    objectFit: "contain",
  },
  backTitle: { fontSize: 26, fontWeight: 900, lineHeight: 1.05 },
  backSub: { fontSize: 13, opacity: 0.85, fontWeight: 700, marginTop: 4 },

  benefitList: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 2,
    display: "grid",
    gap: 12,
  },
  benefitItem: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    background: "rgba(59, 80, 38, 0.35)", // olive tinted dark
    border: "1px solid rgba(145, 124, 124, 0.18)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
  },
  benefitTitle: {
    fontWeight: 900,
    fontSize: 22,
    marginBottom: 6,
    color: "#FFFFFF",
  },
  benefitDesc: {
    fontSize: 16,
    opacity: 0.95,
    lineHeight: 1.25,
    color: "#FFFFFF",
  },
  benefitMeta: {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 10,
    color: "#F1F5F0",
  },
  empty: { opacity: 0.9, fontSize: 14 },

  backFooter: {
    textAlign: "center",
    marginTop: 12,
    paddingTop: 6,
  },

  idCardWrap: {
    background: "transparent",
  },

  idBrandHeader: {
    borderRadius: 18,
    background: "rgba(138, 42, 42, 0.18)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.18)",
  },
};