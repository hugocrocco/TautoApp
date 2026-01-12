import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageFlipShell from "../components/PageFlipShell";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rut: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const rut = form.rut.trim();
    const password = form.password;

    if (!rut || !password) {
      setError("Completa RUT y contraseña.");
      return;
    }

    // MVP: por ahora solo guardamos “sesión” local (sin backend)
    // Más adelante aquí llamamos al backend /api/auth/login
    try {
      localStorage.setItem(
        "session",
        JSON.stringify({
          ok: true,
          rut,
          ts: Date.now(),
        })
      );
    } catch (err) {
      console.error(err);
    }

    // Si hay credencial ya creada, la mostramos; si no, lo mandas a register (después)
    navigate("/card");
  };

  const styles = {
    page: { minHeight: "100vh", background: "#1F2A14", padding: 20, fontFamily: "system-ui" },
    container: { maxWidth: 420, margin: "0 auto" },

    card: {
      borderRadius: 24,
      padding: 18,
      background: "linear-gradient(180deg, #556B2F 0%, #3E4F22 100%)",
      color: "white",
      boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    },

    header: { marginBottom: 12 },
    brandRow: { display: "flex", alignItems: "center", gap: 12 },
    logoWrap: {
      width: 96,
      height: 96,
      borderRadius: 18,
      background: "rgba(255,255,255,0.14)",
      border: "1px solid rgba(255,255,255,0.18)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      flex: "0 0 auto",
    },
    logo: { width: 90, height: 90, objectFit: "contain" },
    org: { fontSize: 20, fontWeight: 900, letterSpacing: 0.3 },
    sub: { marginTop: 2, fontSize: 13, opacity: 0.9 },

    form: {
      display: "grid",
      gap: 10,
      marginTop: 8,
      maxWidth: 300,
      marginLeft: "auto",
      marginRight: "auto",
    },
    label: { fontSize: 12, opacity: 0.9, display: "grid", gap: 4 },
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

    button: {
      marginTop: 6,
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: "none",
      fontWeight: 900,
      cursor: "pointer",
      background: "#A3D07C",
      color: "#1F2A14",
      fontSize: 14,
    },

    footer: { marginTop: 10, textAlign: "center", fontSize: 12 },
    link: { color: "#E5F5C6", fontWeight: 900, textDecoration: "none" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.brandRow}>
                <div style={styles.logoWrap}>
                  <img src="/VMC.PNG" alt="VMC" style={styles.logo} />
                </div>
                <div>
                  <div style={styles.org}>Valparaíso Moto Club</div>
                  <div style={styles.sub}>VMC · Iniciar sesión</div>
                </div>
              </div>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              <label style={styles.label}>
                RUT (o ID)
                <input
                  name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: 12.345.678-9"
                  autoComplete="username"
                />
              </label>

              <label style={styles.label}>
                Contraseña
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="••••"
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              {error ? <div style={styles.error}>{error}</div> : null}

              <button type="submit" style={styles.button}>
                Iniciar sesión
              </button>
            </form>

            <div style={styles.footer}>
              <Link to="/" style={styles.link}>
                Volver al inicio
              </Link>
            </div>
          </div>
        </PageFlipShell>
      </div>
    </div>
  );
}