import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthLayout } from "../layouts";
import { Button, Input } from "../components/ui";
import {
  colors,
  globals,
  radius,
  spacing,
  typography,
} from "../theme";

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
    logoSection: {
      display: "flex",
      justifyContent: "center",
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

    message: {
      ...globals.successBox,
      textAlign: "center",
    },

    error: {
      ...globals.errorBox,
      textAlign: "center",
    },

    helper: {
      margin: 0,
      color: colors.textMuted,
      fontSize: typography.size.small,
      lineHeight: typography.lineHeight.normal,
      textAlign: "center",
    },

    footer: {
      paddingTop: spacing.sm,
      borderTop: "1px solid rgba(255,255,255,0.10)",
      textAlign: "center",
    },

    link: {
      color: colors.textSecondary,
      textDecoration: "none",
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
    },
  };

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu RUT y enviaremos un enlace al correo registrado"
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
          id="forgot-password-rut"
          name="rut"
          label="RUT"
          value={rut}
          onChange={(event) => {
            setRut(event.target.value);
            setError("");
            setMessage("");
          }}
          placeholder="Ej: 12.345.678-9"
          autoComplete="username"
          disabled={loading}
          required
        />

        {message ? (
          <div role="status" style={styles.message}>
            {message}
          </div>
        ) : null}

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
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>

        <p style={styles.helper}>
          Por seguridad, el sistema mostrará el mismo mensaje aunque el RUT no
          esté registrado.
        </p>
      </form>

      <div style={styles.footer}>
        <Link to="/login" style={styles.link}>
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthLayout>
  );
}