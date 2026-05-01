import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8080";

function normalizeRut(rut) {
  return (rut || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/[^0-9K-]/g, "");
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

async function apiFetch(path, { method = "GET", adminKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (adminKey) headers["X-ADMIN-KEY"] = adminKey;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && data.message) || res.statusText || "Error";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("adminKey") || "");
  const [draftKey, setDraftKey] = useState(adminKey);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastResponse, setLastResponse] = useState(null);
  const [notice, setNotice] = useState("Ingresa la clave admin para administrar el padrón.");
  const [mode, setMode] = useState("create"); // create | edit

  const [rut, setRut] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estadoSindicato, setEstadoSindicato] = useState("ACTIVO");
  const [alDiaCuotas, setAlDiaCuotas] = useState(true);
  const [ultimaCuotaPagada, setUltimaCuotaPagada] = useState("");

  const rutNorm = useMemo(() => normalizeRut(rut), [rut]);

  async function verifyAdminKey() {
    setAuthError("");
    setAuthLoading(true);
    try {
      await apiFetch("/api/admin/health", { adminKey: draftKey.trim() });
      localStorage.setItem("adminKey", draftKey.trim());
      setAdminKey(draftKey.trim());
      setNotice("Acceso admin concedido. Ahora puedes buscar, crear o actualizar socios.");
    } catch (e) {
      setAuthError(`No autorizado o backend caído. (${e.status || ""}) ${e.message}`);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("adminKey");
    setAdminKey("");
    setDraftKey("");
    setAuthError("");
    setNotice("Ingresa la clave admin para administrar el padrón.");
  }

  useEffect(() => {
    if (!adminKey) return;

    apiFetch("/api/admin/health", { adminKey }).catch(() => {
      localStorage.removeItem("adminKey");
      setAdminKey("");
      setDraftKey("");
      setAuthError("La clave admin ya no es válida.");
    });
  }, [adminKey]);

  async function buscar() {
    setError("");
    setNotice("");
    setLastResponse(null);

    if (!rutNorm) {
      setError("Ingresa un RUT para buscar.");
      return;
    }

    setBusy(true);
    try {
      const data = await apiFetch(`/api/admin/members/${encodeURIComponent(rutNorm)}`, {
        adminKey,
      });

      setLastResponse(data);
      setRut(data.rut || rutNorm);
      setNombreCompleto(data.nombreCompleto || "");
      setEmail(data.email || "");
      setTelefono(data.telefono || "");
      setEstadoSindicato(data.estadoSindicato || "ACTIVO");
      setAlDiaCuotas(Boolean(data.alDiaCuotas));
      setUltimaCuotaPagada(data.ultimaCuotaPagada || "");
      setMode("edit");
      setNotice("Socio encontrado. Puedes actualizar sus datos y guardar.");
    } catch (e) {
      setError(e.message || "No se pudo buscar el socio.");
      setLastResponse(e.data || null);
      setMode("create");
      setNotice("No se encontró el socio. Puedes crearlo completando el formulario y presionando Guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function guardar() {
    setError("");
    setNotice("");
    setLastResponse(null);

    if (!rutNorm) {
      setError("RUT es obligatorio.");
      return;
    }

    if (!nombreCompleto.trim()) {
      setError("Nombre completo es obligatorio.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        rut: rutNorm,
        nombreCompleto: nombreCompleto.trim().replace(/\s+/g, " "),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        estadoSindicato: (estadoSindicato || "ACTIVO").trim().toUpperCase(),
        alDiaCuotas: Boolean(alDiaCuotas),
        ultimaCuotaPagada: ultimaCuotaPagada || null,
      };

      const data = await apiFetch("/api/admin/members", {
        method: "POST",
        adminKey,
        body: payload,
      });

      setLastResponse(data);
      setMode("edit");
      setNotice("Socio guardado correctamente en el padrón.");
    } catch (e) {
      setError(e.message || "No se pudo guardar el socio.");
      setLastResponse(e.data || null);
    } finally {
      setBusy(false);
    }
  }

  function limpiar() {
    setRut("");
    setNombreCompleto("");
    setEmail("");
    setTelefono("");
    setEstadoSindicato("ACTIVO");
    setAlDiaCuotas(true);
    setUltimaCuotaPagada("");
    setError("");
    setLastResponse(null);
    setMode("create");
    setNotice("Formulario listo para crear un nuevo socio.");
  }

  if (!adminKey) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.brandRow}>
                <div style={styles.logoWrap}>
                  <img src="/logo-sindicato.png" alt="VMC" style={styles.logo} />
                </div>
                <div>
                  <div style={styles.org}>Sindicato Humboldt</div>
                  <div style={styles.orgSub}>Admin · Acceso</div>
                </div>
              </div>
            </div>

            <div style={styles.form}>
              <div style={styles.notice}>{notice}</div>
              <label style={styles.label}>
                Clave admin
                <input
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  style={styles.input}
                  placeholder="Ingresa tu clave admin"
                  type="password"
                />
              </label>

              {authError ? <div style={styles.error}>{authError}</div> : null}

              <button
                style={styles.button}
                onClick={verifyAdminKey}
                disabled={authLoading || !draftKey.trim()}
              >
                {authLoading ? "Verificando..." : "Entrar"}
              </button>

              <div style={styles.footerRow}>
                <Link to="/" style={styles.link}>
                  Volver
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.brandRow}>
              <div style={styles.logoWrap}>
                <img src="/logo-sindicato.png" alt="VMC" style={styles.logo} />
              </div>
              <div>
                <div style={styles.org}>Valparaíso Moto Club</div>
                <div style={styles.orgSub}>Panel Administrador</div>
              </div>
            </div>

            <div style={styles.topActions}>
  <button style={styles.smallBtn} onClick={limpiar}>
    Nuevo socio
  </button>

  <Link to="/admin/members" style={{ textDecoration: "none", flex: 1 }}>
    <div style={{ ...styles.smallBtn, textAlign: "center" }}>
      Ver socios
    </div>
  </Link>

  <button
    style={{ ...styles.smallBtn, background: "rgba(255,255,255,0.16)" }}
    onClick={logout}
  >
    Salir
  </button>
</div>
          </div>

          <div style={styles.bodyRow}>
            <div style={styles.dataCol}>
              <div style={styles.name}>Miembros (padrón)</div>
              <div style={styles.subTitle}>
                {mode === "edit"
                  ? "Editando socio encontrado"
                  : "Crear socio o buscar por RUT para editar"}
              </div>

              <div style={styles.form}>
                <div style={styles.notice}>
                  <strong>Qué puedes hacer aquí</strong>
                  <div style={{ marginTop: 6 }}>
                    • Buscar un socio por RUT<br />
                    • Crear un socio nuevo<br />
                    • Actualizar estado sindical y cuotas<br />
                    • Corregir email y teléfono
                  </div>
                </div>

                {notice ? <div style={styles.notice}>{notice}</div> : null}

                <label style={styles.label}>
                  RUT
                  <input
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    style={styles.input}
                    placeholder="Ej: 12.345.678-9"
                  />
                </label>

                <div style={styles.row2}>
                  <button style={styles.button} onClick={buscar} disabled={busy}>
                    {busy ? "Buscando..." : "Buscar socio"}
                  </button>
                  <button style={{ ...styles.button, background: "#5CC6C8", color: "#0B1F3A" }} onClick={limpiar} disabled={busy}>
                    Limpiar
                  </button>
                </div>

                <label style={styles.label}>
                  Nombre completo
                  <input
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    style={styles.input}
                    placeholder="Nombre y apellido"
                  />
                </label>

                <label style={styles.label}>
                  Email
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="correo@dominio.com"
                  />
                </label>

                <label style={styles.label}>
                  Teléfono
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    style={styles.input}
                    placeholder="+56 9 ..."
                  />
                </label>

                <div style={styles.row2}>
                  <label style={styles.label}>
                    Estado sindicato
                    <select
                      value={estadoSindicato}
                      onChange={(e) => setEstadoSindicato(e.target.value)}
                      style={{ ...styles.input, padding: 10 }}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="SUSPENDIDO">SUSPENDIDO</option>
                      <option value="RETIRADO">RETIRADO</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    Última cuota
                    <input
                      value={ultimaCuotaPagada}
                      onChange={(e) => setUltimaCuotaPagada(e.target.value)}
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                    />
                  </label>
                </div>

                <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={alDiaCuotas}
                    onChange={(e) => setAlDiaCuotas(e.target.checked)}
                  />
                  Al día en cuotas
                </label>

                {error ? <div style={styles.error}>{error}</div> : null}

                <button style={styles.button} onClick={guardar} disabled={busy}>
                  {busy ? "Guardando..." : mode === "edit" ? "Actualizar socio" : "Crear socio"}
                </button>
              </div>

              {lastResponse ? <pre style={styles.pre}>{prettyJson(lastResponse)}</pre> : null}

              <div style={styles.footerRow}>
                <Link to="/" style={styles.link}>
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>

          <div style={styles.qrRow} />
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
    maxWidth: 420,
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
  header: { marginBottom: 10, display: "grid", gap: 10 },
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
  topActions: { display: "flex", gap: 8, justifyContent: "space-between" },
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
  bodyRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    alignItems: "start",
  },
  dataCol: { display: "grid", gap: 8 },
  name: { fontSize: 18, fontWeight: 900 },
  subTitle: { fontSize: 12, opacity: 0.9, marginTop: -2 },
  form: {
    display: "grid",
    gap: 10,
    marginTop: 6,
    padding: 12,
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  label: { fontSize: 12, opacity: 0.95, display: "grid", gap: 4 },
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
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
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
  error: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 900,
    color: "#FFE08A",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 12,
  },
  notice: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 700,
    color: "#F4F1C9",
    background: "rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.4,
  },
  pre: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
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
  qrRow: { marginTop: 14, display: "flex", justifyContent: "flex-end" },
};