import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listBenefits } from "../services/benefitsService";

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

export default function Benefits() {
  const [zone, setZone] = useState("");
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(selectedZone = zone) {
    setLoading(true);
    setError("");
    try {
      const data = await listBenefits(selectedZone);
      setBenefits(Array.isArray(data?.benefits) ? data.benefits : []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar los beneficios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []);

  const grouped = useMemo(() => ({
    NORTE: benefits.filter((b) => b.zone === "NORTE"),
    SUR: benefits.filter((b) => b.zone === "SUR"),
  }), [benefits]);

  function changeZone(value) {
    setZone(value);
    load(value);
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.brandRow}>
              <div style={styles.logoWrapSmall}>
                <img src="/logo-sindicato.png" alt="VMC" style={styles.logoSmall} />
              </div>
              <div>
                <div style={styles.org}>Beneficios y Convenios</div>
                <div style={styles.orgSub}>Sindicato Humboldt</div>
              </div>
            </div>
            <Link to="/" style={styles.link}>Inicio</Link>
          </div>

          <div style={styles.filters}>
            <button style={zone === "" ? styles.activeBtn : styles.filterBtn} onClick={() => changeZone("")}>Todos</button>
            <button style={zone === "NORTE" ? styles.activeBtn : styles.filterBtn} onClick={() => changeZone("NORTE")}>Zona Norte</button>
            <button style={zone === "SUR" ? styles.activeBtn : styles.filterBtn} onClick={() => changeZone("SUR")}>Zona Sur</button>
          </div>

          {loading ? <div style={styles.empty}>Cargando beneficios...</div> : error ? <div style={styles.error}>{error}</div> : benefits.length === 0 ? (
            <div style={styles.empty}>No hay beneficios cargados todavía.</div>
          ) : zone ? (
            <BenefitList items={benefits} />
          ) : (
            <>
              <Section title="Zona Norte" items={grouped.NORTE} />
              <Section title="Zona Sur" items={grouped.SUR} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  if (!items.length) return null;
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <BenefitList items={items} />
    </div>
  );
}

function BenefitList({ items }) {
  return (
    <div style={styles.benefitList}>
      {items.map((b) => (
        <div key={b.id} style={styles.benefitItem}>
          <div style={styles.benefitTitle}>{b.title}</div>
          <div style={styles.zone}>{b.zone === "SUR" ? "Zona Sur" : "Zona Norte"}</div>
          <div style={styles.benefitDesc}>{b.shortInfo}</div>
          {b.hasPdf && b.pdfUrl ? (
            <a href={`${API_BASE}${b.pdfUrl}`} target="_blank" rel="noreferrer" style={styles.pdfBtn}>
              Descargar PDF
            </a>
          ) : (
            <div style={styles.noPdf}>Sin PDF adjunto</div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0B1F3A", padding: 20, fontFamily: "system-ui" },
  container: { maxWidth: 760, margin: "0 auto" },
  card: { borderRadius: 24, padding: 18, background: "#12385A", color: "white", boxShadow: "0 20px 40px rgba(0,0,0,0.40)", boxSizing: "border-box" },
  header: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  logoWrapSmall: { width: 64, height: 64, borderRadius: 12, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.18)", display: "grid", placeItems: "center", overflow: "hidden" },
  logoSmall: { width: 56, height: 56, objectFit: "contain" },
  org: { fontSize: 18, fontWeight: 900, letterSpacing: 0.4 },
  orgSub: { fontSize: 11, textTransform: "uppercase", opacity: 0.9, letterSpacing: 1.2 },
  link: { color: "white", fontWeight: 800, textDecoration: "none", opacity: 0.9 },
  filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  filterBtn: { border: 0, borderRadius: 999, padding: "9px 12px", background: "rgba(255,255,255,.12)", color: "white", fontWeight: 900 },
  activeBtn: { border: 0, borderRadius: 999, padding: "9px 12px", background: "#5CC6C8", color: "#0B1F3A", fontWeight: 900 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 16, margin: "0 0 10px" },
  benefitList: { display: "grid", gap: 10 },
  benefitItem: { background: "rgba(255,255,255,0.95)", color: "#0F172A", borderRadius: 14, padding: 14 },
  benefitTitle: { fontWeight: 900, fontSize: 16 },
  zone: { marginTop: 4, fontSize: 12, color: "#1E3A8A", fontWeight: 900 },
  benefitDesc: { marginTop: 8, fontSize: 14, opacity: 0.86, lineHeight: 1.4 },
  pdfBtn: { display: "inline-block", marginTop: 12, padding: "9px 12px", borderRadius: 10, background: "#1E4E75", color: "white", fontWeight: 900, textDecoration: "none" },
  noPdf: { marginTop: 10, fontSize: 12, opacity: 0.65 },
  empty: { background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: 14, textAlign: "center", fontSize: 14 },
  error: { background: "#7f1d1d", borderRadius: 14, padding: 14, fontSize: 14 },
};
