import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteBenefit, adminListBenefits, adminSaveBenefit } from "../services/benefitsService";

const emptyForm = { id: "", title: "", zone: "NORTE", shortInfo: "", active: true, pdfFile: null };

export default function AdminBenefits() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(search = q) {
    setLoading(true);
    setError("");
    try {
      const data = await adminListBenefits(search);
      setItems(Array.isArray(data?.benefits) ? data.benefits : []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar los beneficios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function edit(item) {
    setForm({
      id: item.id,
      title: item.title || "",
      zone: item.zone || "NORTE",
      shortInfo: item.shortInfo || "",
      active: item.active !== false,
      pdfFile: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await adminSaveBenefit(form);
      setNotice("Beneficio guardado correctamente.");
      setForm(emptyForm);
      await load("");
    } catch (e) {
      setError(e.message || "No se pudo guardar el beneficio.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("¿Eliminar este beneficio?")) return;
    setError("");
    try {
      await adminDeleteBenefit(id);
      setNotice("Beneficio eliminado.");
      await load(q);
    } catch (e) {
      setError(e.message || "No se pudo eliminar.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Beneficios y convenios</h1>
            <p style={styles.sub}>Carga beneficios por zona y adjunta un PDF informativo.</p>
          </div>
          <Link to="/admin" style={styles.back}>Volver</Link>
        </div>

        <form onSubmit={save} style={styles.card}>
          <h2 style={styles.cardTitle}>{form.id ? "Editar beneficio" : "Nuevo beneficio"}</h2>

          <label style={styles.label}>Título</label>
          <input style={styles.input} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ej: Convenio óptica" />

          <label style={styles.label}>Zona</label>
          <select style={styles.input} value={form.zone} onChange={(e) => update("zone", e.target.value)}>
            <option value="NORTE">Zona Norte</option>
            <option value="SUR">Zona Sur</option>
          </select>

          <label style={styles.label}>Información corta</label>
          <textarea style={styles.textarea} maxLength={500} value={form.shortInfo} onChange={(e) => update("shortInfo", e.target.value)} placeholder="Resumen corto visible para el socio" />
          <div style={styles.counter}>{form.shortInfo.length}/500</div>

          <label style={styles.label}>PDF con más información</label>
          <input style={styles.file} type="file" accept="application/pdf,.pdf" onChange={(e) => update("pdfFile", e.target.files?.[0] || null)} />
          {form.id && <div style={styles.hint}>Si no seleccionas PDF, se mantiene el archivo actual.</div>}

          <label style={styles.checkRow}>
            <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
            Beneficio visible para socios
          </label>

          {error && <div style={styles.error}>{error}</div>}
          {notice && <div style={styles.notice}>{notice}</div>}

          <div style={styles.actions}>
            <button disabled={saving} style={styles.primary}>{saving ? "Guardando..." : "Guardar beneficio"}</button>
            <button type="button" style={styles.secondary} onClick={() => setForm(emptyForm)}>Limpiar</button>
          </div>
        </form>

        <div style={styles.card}>
          <form onSubmit={(e) => { e.preventDefault(); load(q); }} style={styles.searchRow}>
            <input style={styles.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar beneficio" />
            <button style={styles.secondary}>Buscar</button>
          </form>

          {loading ? <div style={styles.empty}>Cargando...</div> : items.length === 0 ? <div style={styles.empty}>Sin beneficios cargados.</div> : (
            <div style={styles.list}>
              {items.map((item) => (
                <div key={item.id} style={styles.item}>
                  <div style={styles.itemTop}>
                    <strong>{item.title}</strong>
                    <span style={styles.badge}>{item.zone === "SUR" ? "Zona Sur" : "Zona Norte"}</span>
                  </div>
                  <div style={styles.desc}>{item.shortInfo}</div>
                  <div style={styles.meta}>{item.active ? "Visible" : "Oculto"} · {item.hasPdf ? "Con PDF" : "Sin PDF"}</div>
                  <div style={styles.rowActions}>
                    <button type="button" style={styles.smallBtn} onClick={() => edit(item)}>Editar</button>
                    <button type="button" style={styles.dangerBtn} onClick={() => remove(item.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0B1F3A", padding: 20, fontFamily: "system-ui", color: "white" },
  container: { maxWidth: 920, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 26 },
  sub: { margin: "6px 0 0", opacity: 0.85 },
  back: { color: "#0B1F3A", background: "#5CC6C8", padding: "10px 14px", borderRadius: 12, fontWeight: 900, textDecoration: "none" },
  card: { background: "#12385A", borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: "0 18px 35px rgba(0,0,0,.35)" },
  cardTitle: { marginTop: 0 },
  label: { display: "block", fontWeight: 800, marginTop: 12, marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.25)", fontSize: 15 },
  textarea: { width: "100%", minHeight: 92, boxSizing: "border-box", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.25)", fontSize: 15, resize: "vertical" },
  file: { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 12, background: "rgba(255,255,255,.1)" },
  counter: { textAlign: "right", fontSize: 12, opacity: 0.75 },
  hint: { fontSize: 12, opacity: 0.75, marginTop: 4 },
  checkRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontWeight: 800 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  primary: { border: 0, borderRadius: 12, padding: "12px 16px", background: "#5CC6C8", color: "#0B1F3A", fontWeight: 900, cursor: "pointer" },
  secondary: { border: 0, borderRadius: 12, padding: "12px 16px", background: "#1E4E75", color: "white", fontWeight: 900, cursor: "pointer" },
  error: { background: "#7f1d1d", padding: 10, borderRadius: 12, marginTop: 12 },
  notice: { background: "#14532d", padding: 10, borderRadius: 12, marginTop: 12 },
  searchRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10 },
  empty: { opacity: 0.85, padding: 14 },
  list: { display: "grid", gap: 12, marginTop: 14 },
  item: { background: "rgba(255,255,255,.95)", color: "#0F172A", padding: 14, borderRadius: 14 },
  itemTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  badge: { background: "#DBEAFE", color: "#1E3A8A", borderRadius: 999, padding: "4px 8px", fontSize: 12, fontWeight: 900 },
  desc: { marginTop: 8, opacity: 0.85 },
  meta: { marginTop: 8, fontSize: 12, opacity: 0.7 },
  rowActions: { display: "flex", gap: 8, marginTop: 10 },
  smallBtn: { border: 0, borderRadius: 10, padding: "8px 10px", background: "#1E4E75", color: "white", fontWeight: 800 },
  dangerBtn: { border: 0, borderRadius: 10, padding: "8px 10px", background: "#991B1B", color: "white", fontWeight: 800 },
};
