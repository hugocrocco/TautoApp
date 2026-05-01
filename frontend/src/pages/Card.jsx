import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import PageFlipShell from "../components/PageFlipShell";
import { benefitsDb } from "../services/benefitsDb";

export default function Card() {
  const baseUrl = window.location.origin;
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);

  const frontRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  useLayoutEffect(() => {
    const el = frontRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) setCardHeight(h);
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
    section: "Sindicato Humboldt",
    credentialCode: "HUMB-0001",
    photoUrl: "",
  };

  let member = memberFallback;

  if (stored) {
    try {
      member = { ...memberFallback, ...JSON.parse(stored) };
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

  function handleLogout() {
    localStorage.removeItem("member");
    localStorage.removeItem("session");
    localStorage.removeItem("role");
    localStorage.removeItem("isAdmin");
    navigate("/", { replace: true });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div style={{ ...styles.flipCard, height: cardHeight || "auto" }}>
            <div
              style={{
                ...styles.flipInner,
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div style={{ ...styles.face, ...styles.front }}>
                <div ref={frontRef}>
                  <CardPreview
                    member={{ ...member, statusLabel }}
                    qrValue={verifyUrl}
                    status={status}
                  />

                  <div style={styles.footer}>
                    <button style={styles.linkButton} onClick={() => setFlipped(true)}>
                      Ver beneficios
                    </button>
                    <span style={styles.dot}>•</span>
                    <Link to="/" style={styles.link}>Inicio</Link>
                    <span style={styles.dot}>•</span>
                    <button style={styles.linkButton} onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.face, ...styles.back }}>
                <div style={styles.backCard}>
                  <div style={styles.backHeader}>
                    <img
                      src="/logo-sindicato.png"
                      alt="Logo Sindicato Humboldt"
                      style={styles.logo}
                    />
                    <div>
                      <div style={styles.backTitle}>Beneficios Humboldt</div>
                      <div style={styles.backSub}>{member.displayName}</div>
                    </div>
                  </div>

                  <div style={styles.benefitList}>
                    {benefits.length === 0 ? (
                      <div style={styles.empty}>No hay beneficios cargados todavía.</div>
                    ) : (
                      benefits.map((b) => (
                        <div key={b.id ?? b.title} style={styles.benefitItem}>
                          <div style={styles.benefitTitle}>{b.title}</div>
                          <div style={styles.benefitDesc}>{b.detail || b.description}</div>
                          <div style={styles.benefitMeta}>
                            {b.institution || ""} {b.category ? `• ${b.category}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={styles.backFooter}>
                    <button style={styles.linkButton} onClick={() => setFlipped(false)}>
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
    background: "#0B1F3A",
    padding: 20,
    fontFamily: "system-ui",
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
  },
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
  face: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },
  front: {
    transform: "rotateY(0deg)",
  },
  back: {
    transform: "rotateY(180deg)",
  },
  footer: {
    textAlign: "center",
    marginTop: 12,
  },
  link: {
    color: "#5CC6C8",
    fontWeight: 900,
    textDecoration: "none",
  },
  linkButton: {
    background: "transparent",
    border: "none",
    color: "#5CC6C8",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 14,
  },
  dot: {
    color: "rgba(255,255,255,0.45)",
    margin: "0 8px",
  },
  backCard: {
    height: "100%",
    borderRadius: 24,
    padding: 18,
    background: "#12385A",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  backHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
  },
  backTitle: {
    fontSize: 22,
    fontWeight: 900,
  },
  backSub: {
    fontSize: 13,
    opacity: 0.85,
  },
  benefitList: {
    flex: 1,
    overflowY: "auto",
    display: "grid",
    gap: 10,
  },
  benefitItem: {
    borderRadius: 16,
    padding: 12,
    background: "rgba(92,198,200,0.14)",
    border: "1px solid rgba(92,198,200,0.28)",
  },
  benefitTitle: {
    fontWeight: 900,
    fontSize: 16,
  },
  benefitDesc: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.95,
  },
  benefitMeta: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.8,
  },
  empty: {
    opacity: 0.9,
    fontSize: 14,
  },
  backFooter: {
    textAlign: "center",
    marginTop: 12,
  },
};