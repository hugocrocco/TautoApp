import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageFlipShell from "../components/PageFlipShell";
import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rut: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rut = form.rut.trim();
    const password = form.password;

    if (!rut || !password) {
      setError("Completa RUT y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userData = await login({
        rut,
        password,
        institucionId: 1,
      });

      try {
        localStorage.setItem(
          "member",
          JSON.stringify({
            ...userData,
            displayName: userData.displayName,
            rutMasked: userData.rut,
            photoUrl: `/api/photos/1/${userData.rut}?t=${Date.now()}`,
            statusLabel: "MIEMBRO VIGENTE",
            credentialCode:
              userData.credentialCode || "HUMB-0001",
          })
        );

        localStorage.setItem(
          "session",
          JSON.stringify({
            ok: true,
            rut,
            ts: Date.now(),
            backendUser: userData || null,
          })
        );
      } catch (storageError) {
        console.error(
          "Error guardando sesión:",
          storageError
        );
      }

      navigate("/card");
    } catch (loginError) {
      console.error("Error de login:", loginError);

      setError(
        loginError.message ||
          "No se pudo iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

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
      padding: 18,
      background:
        "linear-gradient(180deg, #12385A 0%, #1E4E75 100%)",
      color: "white",
      boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
    },

    header: {
      marginBottom: 12,
    },

    brandRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },

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

    logo: {
      width: 90,
      height: 90,
      objectFit: "contain",
    },

    org: {
      fontSize: 20,
      fontWeight: 900,
      letterSpacing: 0.3,
    },

    sub: {
      marginTop: 2,
      fontSize: 13,
      opacity: 0.9,
    },

    form: {
      display: "grid",
      gap: 10,
      marginTop: 8,
      maxWidth: 300,
      marginLeft: "auto",
      marginRight: "auto",
    },

    label: {
      fontSize: 12,
      opacity: 0.9,
      display: "grid",
      gap: 4,
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
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
      cursor: loading ? "not-allowed" : "pointer",
      background: loading ? "#c5e7a5" : "#5CC6C8",
      color: "#0B1F3A",
      fontSize: 14,
      opacity: loading ? 0.8 : 1,
    },

    forgotPasswordWrap: {
      marginTop: 4,
      textAlign: "center",
    },

    forgotPasswordLink: {
      color: "#FFB347",
      textDecoration: "none",
      fontWeight: 800,
      fontSize: 12,
    },

    footer: {
      marginTop: 14,
      textAlign: "center",
      fontSize: 12,
    },

    link: {
      color: "#E5F5C6",
      fontWeight: 900,
      textDecoration: "none",
    },

    helper: {
      fontSize: 11,
      opacity: 0.8,
      marginTop: 4,
      textAlign: "center",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.brandRow}>
                <div style={styles.logoWrap}>
                  <img
                    src="/logo-sindicato.png"
                    alt="Sindicato Humboldt"
                    style={styles.logo}
                  />
                </div>

                <div>
                  <div style={styles.org}>
                    Sindicato Humboldt
                  </div>

                  <div style={styles.sub}>
                    Iniciar sesión
                  </div>
                </div>
              </div>
            </div>

            <form
              style={styles.form}
              onSubmit={handleSubmit}
            >
              <label style={styles.label}>
                RUT (o ID)

                <input
                  name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: 12.345.678-9"
                  autoComplete="username"
                  disabled={loading}
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
                  disabled={loading}
                />
              </label>

              {error ? (
                <div style={styles.error}>
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                style={styles.button}
                disabled={loading}
              >
                {loading
                  ? "Ingresando..."
                  : "Iniciar sesión"}
              </button>

              <div style={styles.forgotPasswordWrap}>
                <Link
                  to="/forgot-password"
                  style={styles.forgotPasswordLink}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div style={styles.helper}>
                {loading
                  ? "Validando tus credenciales en el servidor..."
                  : "Ingresa tus datos para ver tu credencial."}
              </div>
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