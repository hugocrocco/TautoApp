import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "../layouts";
import {
  Button,
  Input,
  PasswordInput,
} from "../components/ui";
import {
  colors,
  globals,
  radius,
  spacing,
  typography,
} from "../theme";

import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rut: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
    logoSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.sm,
    },

    logoWrap: {
      width: 104,
      height: 104,
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      borderRadius: radius.large,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.10)",
    },

    logo: {
      width: 96,
      height: 96,
      objectFit: "contain",
    },

    form: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    },

    error: {
      ...globals.errorBox,
      textAlign: "center",
    },

    forgotPasswordWrap: {
      textAlign: "center",
    },

    forgotPasswordLink: {
      color: colors.accent || "#FFB347",
      textDecoration: "none",
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
    },

    helper: {
      margin: 0,
      textAlign: "center",
      color: colors.textMuted,
      fontSize: typography.size.small,
      lineHeight: typography.lineHeight.normal,
    },

    footer: {
      paddingTop: spacing.sm,
      textAlign: "center",
      borderTop: "1px solid rgba(255,255,255,0.10)",
    },

    homeLink: {
      color: colors.textSecondary,
      textDecoration: "none",
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
    },
  };

  return (
    <AuthLayout
      title="Sindicato Humboldt"
      subtitle="Inicia sesión para acceder a tu credencial digital"
    >
      <div style={styles.logoSection}>
        <div style={styles.logoWrap}>
          <img
            src="/logo-sindicato.png"
            alt="Logo Sindicato Humboldt"
            style={styles.logo}
          />
        </div>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <Input
          id="login-rut"
          name="rut"
          label="RUT o ID"
          value={form.rut}
          onChange={handleChange}
          placeholder="Ej: 12.345.678-9"
          autoComplete="username"
          disabled={loading}
          required
        />

        <PasswordInput
          id="login-password"
          name="password"
          label="Contraseña"
          value={form.password}
          onChange={handleChange}
          placeholder="Ingresa tu contraseña"
          autoComplete="current-password"
          disabled={loading}
          required
        />

        {error ? (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {loading
            ? "Ingresando..."
            : "Iniciar sesión"}
        </Button>

        <div style={styles.forgotPasswordWrap}>
          <Link
            to="/forgot-password"
            style={styles.forgotPasswordLink}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <p style={styles.helper}>
          {loading
            ? "Validando tus credenciales en el servidor..."
            : "Ingresa tus datos para ver tu credencial."}
        </p>
      </form>

      <div style={styles.footer}>
        <Link to="/" style={styles.homeLink}>
          Volver al inicio
        </Link>
      </div>
    </AuthLayout>
  );
}