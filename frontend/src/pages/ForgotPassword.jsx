import { useState } from "react";
import { Link } from "react-router-dom";
import PageFlipShell from "../components/PageFlipShell";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [rut, setRut] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanRut = rut.trim();

    if (!cleanRut) {
      setError("Ingresa tu RUT.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await forgotPassword(cleanRut);

      setMessage(
        response?.message ||
          "Si el RUT corresponde a una cuenta registrada, enviaremos un enlace al correo asociado."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo procesar la solicitud. Intenta nuevamente."
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
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },

    logoWrap: {
      width: 82,
      height: 82,
      borderRadius: 18,
      background: "rgba(255,255,255,0.14)",
      border: "1px solid rgba(255,255,255,0.18)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      flex: "0 0 auto",
    },

    logo: {
      width: 76,
      height: 76,
      objectFit: "contain",
    },

    title: {
      fontSize: 20,
      fontWeight: 900,
      margin: 0,
    },

    subtitle: {
      fontSize: 13,
      opacity: 0.9,
      marginTop: 4,
    },

    form: {
      display: "grid",
      gap: 12,
      maxWidth: 300,
      margin: "0 auto",
    },

    label: {
      display: "grid",
      gap: 6,
      fontSize: 12,
      opacity: 0.92,
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: 11,
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.35)",
      background: "rgba(15,23,42,0.35)",
      color: "white",
      outline: "none",
      fontSize: 14,
    },

    button: {
      marginTop: 4,
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: "none",
      fontWeight: 900,
      cursor: loading ? "not-allowed" : "pointer",
      background: loading ? "#c5e7a5" : "#FFB347",
      color: "#0B1F3A",
      opacity: loading ? 0.8 : 1,
    },

    message: {
      fontSize: 12,
      lineHeight: 1.5,
      color: "#E5F5C6",
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(229,245,198,0.25)",
      padding: 10,
      borderRadius: 12,
    },

    error: {
      fontSize: 12,
      lineHeight: 1.5,
      color: "#FFE08A",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.18)",
      padding: 10,
      borderRadius: 12,
    },

    footer: {
      marginTop: 16,
      textAlign: "center",
      fontSize: 12,
    },

    link: {
      color: "#E5F5C6",
      fontWeight: 900,
      textDecoration: "none",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.logoWrap}>
                <img
                  src="/logo-sindicato.png"
                  alt="Sindicato Humboldt"
                  style={styles.logo}
                />
              </div>

              <div>
                <h1 style={styles.title}>
                  Restablecer contraseña
                </h1>

                <div style={styles.subtitle}>
                  Ingresa tu RUT y enviaremos un enlace al correo registrado.
                </div>
              </div>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              <label style={styles.label}>
                RUT

                <input
                  value={rut}
                  onChange={(event) => {
                    setRut(event.target.value);
                    setError("");
                    setMessage("");
                  }}
                  style={styles.input}
                  placeholder="Ej: 12.345.678-9"
                  autoComplete="username"
                  disabled={loading}
                />
              </label>

              {message ? (
                <div style={styles.message}>
                  {message}
                </div>
              ) : null}

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
                  ? "Enviando..."
                  : "Enviar enlace"}
              </button>
            </form>

            <div style={styles.footer}>
              <Link to="/login" style={styles.link}>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </PageFlipShell>
      </div>
    </div>
  );
}