import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = `${window.location.origin}/api/admin/members`;

function getAdminKey() {
  return localStorage.getItem("adminKey") || "hbdt";
}

function formatDateCL(value) {
  if (!value) return "Sin dato";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return text;
}

function normalizeRut(rut) {
  return (rut || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/[^0-9K-]/g, "");
}

async function fetchMembers(q = "") {
  const adminKey = getAdminKey();

  const url = q.trim()
    ? `${API_URL}?q=${encodeURIComponent(q.trim())}`
    : API_URL;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-ADMIN-KEY": adminKey,
    },
  });

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data?.message || res.statusText || "Error al cargar socios";
    throw new Error(`${msg} (${res.status})`);
  }

  return data;
}

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const count = useMemo(() => members.length, [members]);

  async function loadMembers(search = q) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await fetchMembers(search);
      const list = Array.isArray(data?.members) ? data.members : [];

      setMembers(list);

      if (list.length === 0) {
        setNotice("No se encontraron socios.");
      }
    } catch (e) {
      setError(e.message || "No se pudo cargar el padrón.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadMembers(q);
  }

  function clearSearch() {
    setQ("");
    loadMembers("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.brandRow}>
              <div style={styles.logoWrap}>
                <img src="/logo-sindicato.png" alt="Sindicato Humboldt" style={styles.logo} />
              </div>

              <div>
                <div style={styles.org}>Sindicato Humboldt</div>
                <div style={styles.orgSub}>Padrón de socios</div>
              </div>
            </div>

            <div style={styles.topActions}>
              <Link to="/admin" style={{ textDecoration: "none", flex: 1 }}>
                <div style={{ ...styles.smallBtn, textAlign: "center" }}>
                  Volver admin
                </div>
              </Link>

              <button style={styles.smallBtn} onClick={() => loadMembers(q)} disabled={loading}>
                {loading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
          </div>

          <form style={styles.searchBox} onSubmit={handleSearch}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={styles.input}
              placeholder="Buscar por RUT, nombre, email o teléfono"
            />

            <div style={styles.row2}>
              <button style={styles.button} type="submit" disabled={loading}>
                Buscar
              </button>

              <button
                style={{ ...styles.button, background: "#5CC6C8", color: "#0B1F3A" }}
                type="button"
                onClick={clearSearch}
                disabled={loading}
              >
                Ver todos
              </button>
            </div>
          </form>

          <div style={styles.summary}>
            Total socios visibles: <strong>{count}</strong>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}
          {notice ? <div style={styles.notice}>{notice}</div> : null}

          <div style={styles.list}>
            {members.map((m) => {
              const rut = normalizeRut(m.rut || "");
              const editHref = `#/admin?rut=${encodeURIComponent(rut)}`;

              return (
                <div key={rut || m.nombreCompleto} style={styles.memberCard}>
                  <div style={styles.memberTop}>
                    <div>
                      <div style={styles.memberName}>
                        {m.nombreCompleto || "Sin nombre"}
                      </div>

                      <div style={styles.memberRut}>
                        RUT: {m.rut || "Sin dato"}
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,
                        ...(String(m.estadoSindicato || "").toUpperCase() === "ACTIVO"
                          ? styles.statusActive
                          : styles.statusInactive),
                      }}
                    >
                      {m.estadoSindicato || "Sin estado"}
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.label}>Email</span>
                      <span>{m.email || "Sin dato"}</span>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.label}>Teléfono</span>
                      <span>{m.telefono || "Sin dato"}</span>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.label}>Cuotas</span>
                      <span>{m.alDiaCuotas ? "Al día" : "Pendiente"}</span>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.label}>Última cuota</span>
                      <span>{formatDateCL(m.ultimaCuotaPagada)}</span>
                    </div>
                  </div>

                  <a href={editHref} style={styles.editButton}>
                    Editar socio
                  </a>
                </div>
              );
            })}
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
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
  },
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#12385A",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: 12,
    display: "grid",
    gap: 10,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 14,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flex: "0 0 auto",
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
  },
  org: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0.4,
  },
  orgSub: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.9,
    letterSpacing: 1.2,
  },
  topActions: {
    display: "flex",
    gap: 8,
    justifyContent: "space-between",
  },
  smallBtn: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.22)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  searchBox: {
    display: "grid",
    gap: 10,
    marginTop: 6,
    padding: 12,
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(15,23,42,0.35)",
    color: "white",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
    background: "#1E4E75",
    color: "white",
    fontSize: 14,
  },
  summary: {
    marginTop: 12,
    fontSize: 13,
    color: "#F4F1C9",
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 900,
    color: "#FFE08A",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 12,
  },
  notice: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#F4F1C9",
    background: "rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.4,
  },
  list: {
    display: "grid",
    gap: 12,
    marginTop: 12,
  },
  memberCard: {
    padding: 12,
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  memberTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 900,
  },
  memberRut: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.85,
  },
  statusBadge: {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  statusActive: {
    background: "rgba(92,198,200,0.22)",
    border: "1px solid rgba(92,198,200,0.75)",
    color: "#D9FFFF",
  },
  statusInactive: {
    background: "rgba(255,224,138,0.20)",
    border: "1px solid rgba(255,224,138,0.75)",
    color: "#FFE08A",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 12,
  },
  infoItem: {
    display: "grid",
    gap: 2,
    fontSize: 12,
    background: "rgba(0,0,0,0.14)",
    padding: 8,
    borderRadius: 10,
    wordBreak: "break-word",
  },
  label: {
    opacity: 0.75,
    fontWeight: 800,
    fontSize: 11,
  },
  editButton: {
    display: "block",
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    background: "#5CC6C8",
    color: "#0B1F3A",
    textDecoration: "none",
    textAlign: "center",
    fontWeight: 900,
  },
};
