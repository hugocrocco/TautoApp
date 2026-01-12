import { useState, useEffect } from "react";
import { mockDb } from "../services/mockDb";
import { Link } from "react-router-dom";

export default function Admin() {
  const [, forceUpdate] = useState(0);

  function toggleStatus(code) {
    mockDb[code].status = mockDb[code].status === "VALID" ? "REVOKED" : "VALID";
    forceUpdate((n) => n + 1);
  }

  // (Opcional) para que no quede “pegado” si cambias de usuario/lista
  useEffect(() => {
    forceUpdate((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* HEADER (igual que CardPreview) */}
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

          {/* BODY (mismo patrón: bodyRow + dataCol) */}
          <div style={styles.bodyRow}>
            <div style={styles.dataCol}>
              <div style={styles.name}>Panel Administrativo</div>
              <div style={styles.subTitle}>Activar / Revocar credenciales</div>

              <div style={styles.list}>
                {Object.entries(mockDb).map(([code, data]) => {
                  const isValid = data.status === "VALID";

                  return (
                    <div key={code} style={styles.item}>
                      <div style={styles.itemLeft}>
                        <div style={styles.itemName}>{data.name}</div>
                        <div style={styles.itemCode}>{code}</div>

                        <span
                          style={{
                            ...styles.badge,
                            background: isValid
                              ? "rgba(220,252,231,0.95)"
                              : "rgba(254,226,226,0.95)",
                            color: isValid ? "#14532D" : "#7F1D1D",
                          }}
                        >
                          {data.status}
                        </span>
                      </div>

                      <button
                        style={styles.button}
                        onClick={() => toggleStatus(code)}
                      >
                        Cambiar
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={styles.footerRow}>
                <Link to="/" style={styles.link}>
                  Volver
                </Link>
              </div>
            </div>
          </div>

          {/* “qrRow” lo dejamos para mantener estructura idéntica */}
          <div style={styles.qrRow} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Misma “página” que el resto
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

  // === MISMA TARJETA QUE CardPreview ===
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#556B2F",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    boxSizing: "border-box",
  },

  // Header igual
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
    flex: "0 0 auto",
  },
  logo: { width: 120, height: 120, objectFit: "contain" },
  org: { fontSize: 18, fontWeight: 900, letterSpacing: 0.4 },
  orgSub: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.9,
    letterSpacing: 1.2,
  },

  // Body igual (pero acá usamos dataCol como contenedor de todo)
  bodyRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    alignItems: "start",
  },
  dataCol: { display: "grid", gap: 8 },

  // Títulos similares
  name: { fontSize: 18, fontWeight: 900 },
  subTitle: { fontSize: 12, opacity: 0.9, marginTop: -2 },

  // Lista estilo “dentro de tarjeta”
  list: {
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  item: {
    background: "rgba(255,255,255,0.95)",
    color: "#0F172A",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemLeft: { display: "grid", gap: 2 },
  itemName: { fontWeight: 900, fontSize: 15, lineHeight: 1.1 },
  itemCode: { fontSize: 12, opacity: 0.75 },

  badge: {
    display: "inline-block",
    marginTop: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 11,
    width: "fit-content",
  },

  button: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "#3E4F22",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  footerRow: {
    marginTop: 10,
    display: "flex",
    justifyContent: "center",
  },
  link: {
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
    opacity: 0.9,
  },

  // Mantener la misma key del componente original
  qrRow: { marginTop: 14, display: "flex", justifyContent: "flex-end" },
};