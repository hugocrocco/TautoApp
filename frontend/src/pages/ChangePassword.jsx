import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../services/authService";
import PasswordInput from "../components/ui/PasswordInput";

export default function ChangePassword() {
  const navigate = useNavigate();

  const member = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("member") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!member?.rut) {
      setError("No se encontró la sesión. Inicia sesión nuevamente.");
      return;
    }

    if (!currentPassword || !newPassword || !repeatPassword) {
      setError("Debes completar todos los campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    try {
      setLoading(true);

      const response = await changePassword({
        rut: member.rut,
        currentPassword,
        newPassword,
      });

      setMessage(
        response?.message || "Contraseña cambiada correctamente."
      );

      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");

      window.setTimeout(() => {
        navigate("/card", { replace: true });
      }, 1800);
    } catch (err) {
      setError(
        err?.message || "No se pudo cambiar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>🔒</div>

          <h1 style={styles.title}>Cambiar contraseña</h1>

          <p style={styles.subtitle}>
            Ingresa tu contraseña actual y luego crea una nueva.
          </p>

          <div style={styles.memberBox}>
            <strong>
              {member?.displayName || "Socio Humboldt"}
            </strong>
            <span>{member?.rut || ""}</span>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Contraseña actual
              <PasswordInput
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
              />
            </label>

            <label style={styles.label}>
              Nueva contraseña
              <PasswordInput
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                disabled={loading}
              />
            </label>

            <label style={styles.label}>
              Repetir nueva contraseña
              <PasswordInput
                value={repeatPassword}
                onChange={(event) =>
                  setRepeatPassword(event.target.value)
                }
                autoComplete="new-password"
                disabled={loading}
              />
            </label>

            {error ? (
              <div style={styles.error}>{error}</div>
            ) : null}

            {message ? (
              <div style={styles.success}>{message}</div>
            ) : null}

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.65 : 1,
              }}
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : "Cambiar contraseña"}
            </button>
          </form>

          <Link to="/card" style={styles.backLink}>
            Volver a la credencial
          </Link>
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
    display: "flex",
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 45px rgba(0,0,0,.35)",
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    margin: "0 auto",
    display: "grid",
    placeItems: "center",
    background: "#DFF7F7",
    fontSize: 27,
  },
  title: {
    margin: "16px 0 6px",
    textAlign: "center",
    color: "#0B1F3A",
    fontSize: 25,
  },
  subtitle: {
    margin: 0,
    textAlign: "center",
    color: "#526173",
    lineHeight: 1.45,
    fontSize: 14,
  },
  memberBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    background: "#F1F5F9",
    color: "#0F172A",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 15,
    marginTop: 20,
  },
  label: {
    display: "grid",
    gap: 7,
    color: "#1E293B",
    fontWeight: 800,
    fontSize: 13,
  },
  error: {
    padding: 11,
    borderRadius: 12,
    background: "#FEE2E2",
    color: "#991B1B",
    fontSize: 13,
    fontWeight: 700,
  },
  success: {
    padding: 11,
    borderRadius: 12,
    background: "#DCFCE7",
    color: "#166534",
    fontSize: 13,
    fontWeight: 700,
  },
  submitButton: {
    border: "none",
    borderRadius: 14,
    padding: "13px 16px",
    background: "#1E4E75",
    color: "#FFFFFF",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
  },
  backLink: {
    display: "block",
    textAlign: "center",
    marginTop: 18,
    color: "#1E4E75",
    fontWeight: 900,
    textDecoration: "none",
  },
};