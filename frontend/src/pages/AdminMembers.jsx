import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:8080/api/admin/members";
const ADMIN_KEY = "VMC1914";

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch(API_URL, {
          headers: {
            "X-ADMIN-KEY": ADMIN_KEY,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || `Error HTTP ${res.status}`);
        }

        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando socios", err);
        setError(err.message || "No se pudo cargar la lista de socios.");
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>Sindicato Humboldt</div>
          <div style={styles.subtitle}>Lista de socios</div>

          {loading ? (
            <div style={styles.notice}>Cargando...</div>
          ) : error ? (
            <div style={styles.notice}>{error}</div>
          ) : members.length === 0 ? (
            <div style={styles.notice}>No hay socios cargados.</div>
          ) : (
            <div style={styles.list}>
              {members.map((m) => (
                <div key={m.rut || m.id} style={styles.memberCard}>
                  <div style={styles.name}>{m.nombreCompleto || "Sin nombre"}</div>
                  <div style={styles.rut}>{m.rut || "Sin RUT"}</div>
                  <div style={styles.meta}>{m.estadoSindicato || "Sin estado"}</div>
                  <div style={styles.meta}>{m.alDiaCuotas ? "Cuotas al día" : "Cuotas pendientes"}</div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.footer}>
            <Link to="/admin" style={styles.link}>
              Volver al panel admin
            </Link>
          </div>
        </div>
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
    color: "white",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
  },
  card: {
    background: "#12385A",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 14,
  },
  notice: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(0,0,0,0.18)",
  },
  list: {
    display: "grid",
    gap: 10,
  },
  memberCard: {
    background: "white",
    color: "#0B1F3A",
    borderRadius: 14,
    padding: 12,
  },
  name: {
    fontWeight: 900,
  },
  rut: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    fontWeight: 800,
    marginTop: 8,
  },
  footer: {
    marginTop: 14,
    textAlign: "center",
  },
  link: {
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
  },
};
