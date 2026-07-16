import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyMessages } from "../services/messagesService";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  let member = {};
  try { member = JSON.parse(localStorage.getItem("member") || "{}"); } catch { member = {}; }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!member?.rut) throw new Error("Debes iniciar sesión para ver tus mensajes.");
        const data = await listMyMessages(member.rut);
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
      } catch (e) {
        setError(e.message || "No se pudieron cargar los mensajes.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.rut]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Mis mensajes</h1>
              <p style={styles.sub}>Comunicados del sindicato.</p>
            </div>
            <Link to="/card" style={styles.back}>Credencial</Link>
          </div>

          {loading ? <div>Cargando...</div> : error ? <div style={styles.error}>{error}</div> : messages.length === 0 ? (
            <div style={styles.empty}>No tienes mensajes por ahora.</div>
          ) : (
            <div style={styles.list}>
              {messages.map((m) => (
                <div key={m.id} style={styles.item}>
                  <div style={styles.itemTop}>
                    <strong>{m.title}</strong>
                    <span style={styles.badge}>{m.messageType === "PERSONAL" ? "Personal" : "General"}</span>
                  </div>
                  <div style={styles.body}>{m.body}</div>
                  <div style={styles.meta}>{String(m.createdAt || "").slice(0, 19)}</div>
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
  container: { maxWidth: 720, margin: "0 auto" },
  card: { background: "#12385A", borderRadius: 22, padding: 18, boxShadow: "0 18px 35px rgba(0,0,0,.35)" },
  header: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 26 },
  sub: { margin: "6px 0 0", opacity: 0.85 },
  back: { color: "#0B1F3A", background: "#5CC6C8", padding: "10px 14px", borderRadius: 12, fontWeight: 900, textDecoration: "none" },
  error: { background: "#7f1d1d", padding: 10, borderRadius: 12 },
  empty: { opacity: 0.85, padding: 14 },
  list: { display: "grid", gap: 12 },
  item: { background: "rgba(255,255,255,.95)", color: "#0F172A", padding: 14, borderRadius: 14 },
  itemTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  badge: { background: "#DBEAFE", color: "#1E3A8A", borderRadius: 999, padding: "4px 8px", fontSize: 12, fontWeight: 900 },
  body: { marginTop: 8, whiteSpace: "pre-wrap" },
  meta: { marginTop: 8, fontSize: 12, opacity: 0.7 },
};
