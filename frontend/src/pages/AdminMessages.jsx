import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteMessage, adminListMessages, adminListRecipients, adminSendMessage } from "../services/messagesService";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [messageType, setMessageType] = useState("GENERAL");
  const [targetStatus, setTargetStatus] = useState("TODOS");
  const [recipientRut, setRecipientRut] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return recipients.slice(0, 50);
    return recipients.filter((r) => {
      const text = `${r.rut || ""} ${r.nombreCompleto || ""} ${r.email || ""}`.toLowerCase();
      return text.includes(q);
    }).slice(0, 50);
  }, [recipients, recipientSearch]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [messagesData, recipientsData] = await Promise.all([
        adminListMessages(),
        adminListRecipients(),
      ]);
      setMessages(Array.isArray(messagesData?.messages) ? messagesData.messages : []);
      setRecipients(Array.isArray(recipientsData?.members) ? recipientsData.members : []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function send(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!title.trim()) {
      setError("Escribe un título para el mensaje.");
      return;
    }
    if (!body.trim()) {
      setError("Escribe el contenido del mensaje.");
      return;
    }
    if (messageType === "PERSONAL" && !recipientRut.trim()) {
      setError("Selecciona un socio destinatario para el mensaje personal.");
      return;
    }

    try {
      await adminSendMessage({ messageType, targetStatus, recipientRut, title, body });
      setNotice("Mensaje enviado correctamente. El socio lo verá dentro de su credencial.");
      setTitle("");
      setBody("");
      setRecipientRut("");
      setRecipientSearch("");
      await load();
    } catch (e) {
      setError(e.message || "No se pudo enviar el mensaje.");
    }
  }

  async function remove(id) {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    try {
      await adminDeleteMessage(id);
      await load();
    } catch (e) {
      setError(e.message || "No se pudo eliminar.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Mensajes para socios</h1>
            <p style={styles.sub}>Los mensajes aparecerán dentro de la credencial del socio al iniciar sesión.</p>
          </div>
          <Link to="/admin" style={styles.back}>Volver</Link>
        </div>

        <form onSubmit={send} style={styles.card}>
          <h2 style={styles.cardTitle}>Nuevo mensaje</h2>

          <label style={styles.label}>Tipo de mensaje</label>
          <select style={styles.input} value={messageType} onChange={(e) => setMessageType(e.target.value)}>
            <option value="GENERAL">General</option>
            <option value="PERSONAL">Personal a un socio</option>
          </select>

          {messageType === "GENERAL" ? (
            <>
              <label style={styles.label}>Destinatarios</label>
              <select style={styles.input} value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
                <option value="TODOS">Todos los socios</option>
                <option value="ACTIVO">Solo socios activos</option>
                <option value="SUSPENDIDO">Solo socios suspendidos/no activos</option>
                <option value="RETIRADO">Solo socios retirados</option>
              </select>
            </>
          ) : (
            <>
              <label style={styles.label}>Buscar y seleccionar socio</label>
              <input
                style={styles.input}
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Buscar por nombre, RUT o correo"
              />

              <div style={styles.recipientList}>
                {filteredRecipients.length === 0 ? <div style={styles.empty}>No se encontraron socios.</div> : null}
                {filteredRecipients.map((r) => {
                  const selected = recipientRut === r.rut;
                  return (
                    <button
                      key={r.rut}
                      type="button"
                      style={{ ...styles.recipientBtn, ...(selected ? styles.recipientSelected : {}) }}
                      onClick={() => setRecipientRut(r.rut)}
                    >
                      <strong>{r.nombreCompleto || r.displayName || "Sin nombre"}</strong>
                      <span>RUT: {r.rut}</span>
                      <small>{r.estadoSindicato || "Sin estado"}</small>
                    </button>
                  );
                })}
              </div>

              <div style={styles.hint}>Seleccionado: <strong>{recipientRut || "ninguno"}</strong></div>
            </>
          )}

          <label style={styles.label}>Título</label>
          <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión informativa" />

          <label style={styles.label}>Mensaje</label>
          <textarea style={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el mensaje que verá el socio dentro de su credencial" />

          {error && <div style={styles.error}>{error}</div>}
          {notice && <div style={styles.notice}>{notice}</div>}

          <button style={styles.primary} disabled={loading}>{loading ? "Cargando..." : "Enviar mensaje"}</button>
        </form>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Mensajes enviados</h2>
          {messages.length === 0 ? <div style={styles.empty}>Sin mensajes enviados.</div> : (
            <div style={styles.list}>
              {messages.map((m) => (
                <div key={m.id} style={styles.item}>
                  <div style={styles.itemTop}>
                    <strong>{m.title}</strong>
                    <span style={styles.badge}>{m.messageType === "PERSONAL" ? `Personal · ${m.recipientRut}` : `General · ${m.targetStatus}`}</span>
                  </div>
                  <div style={styles.desc}>{m.body}</div>
                  <button type="button" style={styles.dangerBtn} onClick={() => remove(m.id)}>Eliminar</button>
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
  textarea: { width: "100%", minHeight: 120, boxSizing: "border-box", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.25)", fontSize: 15, resize: "vertical" },
  primary: { marginTop: 16, border: 0, borderRadius: 12, padding: "12px 16px", background: "#5CC6C8", color: "#0B1F3A", fontWeight: 900, cursor: "pointer" },
  error: { background: "#7f1d1d", padding: 10, borderRadius: 12, marginTop: 12 },
  notice: { background: "#14532d", padding: 10, borderRadius: 12, marginTop: 12 },
  hint: { fontSize: 13, opacity: 0.85, marginTop: 8 },
  recipientList: { display: "grid", gap: 8, maxHeight: 280, overflowY: "auto", marginTop: 8 },
  recipientBtn: { textAlign: "left", border: "1px solid rgba(255,255,255,.18)", borderRadius: 14, padding: 12, background: "rgba(255,255,255,.95)", color: "#0F172A", cursor: "pointer", display: "grid", gap: 3 },
  recipientSelected: { outline: "3px solid #5CC6C8" },
  empty: { opacity: 0.85, padding: 14 },
  list: { display: "grid", gap: 12, marginTop: 14 },
  item: { background: "rgba(255,255,255,.95)", color: "#0F172A", padding: 14, borderRadius: 14 },
  itemTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  badge: { background: "#DBEAFE", color: "#1E3A8A", borderRadius: 999, padding: "4px 8px", fontSize: 12, fontWeight: 900 },
  desc: { marginTop: 8, opacity: 0.85, whiteSpace: "pre-wrap" },
  dangerBtn: { marginTop: 10, border: 0, borderRadius: 10, padding: "8px 10px", background: "#991B1B", color: "white", fontWeight: 800 },
};
