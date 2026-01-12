import { useState } from "react";
import { Link } from "react-router-dom";
import { benefitsDb } from "../services/benefitsDb";

export default function Benefits() {
  const [flipped, setFlipped] = useState(false);

  const benefits = Array.isArray(benefitsDb) ? benefitsDb.slice(0, 8) : [];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          {!flipped ? (
            /* ================= FRONT ================= */
            <div>
              <div style={styles.header}>
                <div style={styles.brandRow}>
                  <div style={styles.logoWrap}>
                    <img src="/VMC.PNG" alt="VMC" style={styles.logo} />
                  </div>
                  <div>
                    <div style={styles.org}>Valparaíso Moto Club</div>
                    <div style={styles.orgSub}>VMC</div>
                  </div>
                </div>
              </div>

              <div style={styles.frontBody}>
                <div style={styles.frontTitle}>Credencial Digital</div>
                <div style={styles.frontSub}>
                  Accede a los beneficios disponibles para socios
                </div>

                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  style={styles.flipBtn}
                >
                  Ver beneficios
                </button>
              </div>
            </div>
          ) : (
            /* ================= BACK ================= */
            <div>
              <div style={styles.header}>
                <div style={styles.brandRow}>
                  <div style={styles.logoWrapSmall}>
                    <img src="/VMC.PNG" alt="VMC" style={styles.logoSmall} />
                  </div>
                  <div>
                    <div style={styles.org}>Beneficios</div>
                    <div style={styles.orgSub}>VMC</div>
                  </div>
                </div>
              </div>

              <div style={styles.benefitList}>
                {benefits.length === 0 ? (
                  <div style={styles.empty}>
                    No hay beneficios cargados todavía.
                    <div style={styles.emptyHint}>
                      (benefitsDb está vacío)
                    </div>
                  </div>
                ) : (
                  benefits.map((b, i) => (
                    <div key={b.id ?? i} style={styles.benefitItem}>
                      <div style={styles.benefitTitle}>
                        {b.title ?? b.name ?? "Beneficio"}
                      </div>
                      <div style={styles.benefitDesc}>
                        {b.description ?? b.desc ?? ""}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.backFooter}>
                <button
                  type="button"
                  onClick={() => setFlipped(false)}
                  style={styles.backBtn}
                >
                  Volver
                </button>
                <span style={styles.dot}>•</span>
                <Link to="/admin" style={styles.link}>
                  Admin
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1F2A14",
    padding: 20,
    fontFamily: "system-ui",
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
  },

  /* MISMA TARJETA BASE QUE CardPreview / Admin */
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#556B2F",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    boxSizing: "border-box",
  },

  header: { marginBottom: 10 },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },

  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 14,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  logo: { width: 120, height: 120, objectFit: "contain" },

  logoWrapSmall: {
    width: 64,
    height: 64,
    borderRadius: 12,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  logoSmall: { width: 56, height: 56, objectFit: "contain" },

  org: { fontSize: 18, fontWeight: 900, letterSpacing: 0.4 },
  orgSub: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.9,
    letterSpacing: 1.2,
  },

  /* FRONT */
  frontBody: {
    marginTop: 12,
    display: "grid",
    gap: 10,
    textAlign: "center",
  },
  frontTitle: { fontSize: 20, fontWeight: 900 },
  frontSub: { fontSize: 13, opacity: 0.9 },

  flipBtn: {
    marginTop: 14,
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "#3E4F22",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  /* BACK */
  benefitList: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  benefitItem: {
    background: "rgba(255,255,255,0.95)",
    color: "#0F172A",
    borderRadius: 14,
    padding: 12,
  },
  benefitTitle: { fontWeight: 900, fontSize: 14 },
  benefitDesc: { marginTop: 4, fontSize: 13, opacity: 0.85 },

  empty: {
    background: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 14,
    textAlign: "center",
    fontSize: 14,
  },
  emptyHint: { fontSize: 12, opacity: 0.75, marginTop: 6 },

  backFooter: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backBtn: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "none",
    background: "#3E4F22",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  dot: { opacity: 0.7 },
  link: {
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
    opacity: 0.9,
  },
};