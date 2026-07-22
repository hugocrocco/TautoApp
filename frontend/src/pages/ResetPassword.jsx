// src/pages/ResetPassword.jsx

import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { AuthLayout } from "../layouts";
import {
  Button,
  PasswordInput,
} from "../components/ui";

import {
  colors,
  globals,
  radius,
  shadows,
  spacing,
  typography,
} from "../theme";

import { resetPassword } from "../services/authService";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "El enlace de recuperación no es válido."
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Debes completar ambos campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(token, newPassword);

      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No se pudo restablecer la contraseña. El enlace puede haber expirado."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    navigate("/login", {
      replace: true,
    });
  }

  const styles = {
    brandArea: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingBottom: spacing.lg,
      borderBottom:
        "1px solid rgba(255,255,255,0.10)",
    },

    brandLogo: {
      width: 48,
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.medium,
      background: `linear-gradient(
        145deg,
        ${colors.accent},
        ${colors.accentDark}
      )`,
      boxShadow: shadows.accent,
      color: colors.primaryDark,
      fontSize: 26,
      fontWeight: typography.weight.black,
    },

    brandText: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.xs,
    },

    brandName: {
      margin: 0,
      color: colors.text,
      fontSize: 21,
      lineHeight: 1,
      fontWeight: typography.weight.black,
      letterSpacing: typography.letterSpacing.wide,
    },

    platformName: {
      margin: 0,
      color: colors.accent,
      fontSize: 9,
      fontWeight: typography.weight.extraBold,
      letterSpacing:
        typography.letterSpacing.extraWide,
    },

    iconCircle: {
      width: 70,
      height: 70,
      margin: "0 auto",
      borderRadius: radius.circle,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(92,198,200,0.14)",
      border: "1px solid rgba(92,198,200,0.32)",
      fontSize: 31,
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

    helper: {
      margin: 0,
      color: colors.textMuted,
      fontSize: typography.size.small,
      lineHeight: typography.lineHeight.normal,
      textAlign: "center",
    },

    footer: {
      paddingTop: spacing.sm,
      borderTop:
        "1px solid rgba(255,255,255,0.10)",
      textAlign: "center",
    },

    backLink: {
      color: colors.textSecondary,
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
      textDecoration: "none",
    },

    successContent: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.lg,
      textAlign: "center",
    },

    successIcon: {
      width: 74,
      height: 74,
      margin: "0 auto",
      borderRadius: radius.circle,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.accent,
      color: colors.primaryDark,
      fontSize: 38,
      fontWeight: typography.weight.black,
      boxShadow: shadows.accentStrong,
    },
  };

  return (
    <AuthLayout
      title={
        success
          ? "Contraseña actualizada"
          : "Restablecer contraseña"
      }
      subtitle={
        success
          ? "Tu contraseña fue cambiada correctamente"
          : "Ingresa una nueva contraseña para volver a acceder a tu credencial digital"
      }
    >
      <div style={styles.brandArea}>
        <div
          aria-hidden="true"
          style={styles.brandLogo}
        >
          T
        </div>

        <div style={styles.brandText}>
          <p style={styles.brandName}>TAUTO</p>
          <p style={styles.platformName}>
            PLATFORM
          </p>
        </div>
      </div>

      {!success ? (
        <>
          <div
            aria-hidden="true"
            style={styles.iconCircle}
          >
            🔐
          </div>

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <PasswordInput
              id="newPassword"
              name="newPassword"
              label="Nueva contraseña"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError("");
              }}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value
                );
                setError("");
              }}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <p style={styles.helper}>
              La contraseña debe contener al menos 6
              caracteres.
            </p>

            {error ? (
              <div
                role="alert"
                style={styles.error}
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : "Guardar nueva contraseña"}
            </Button>
          </form>

          <div style={styles.footer}>
            <Link
              to="/login"
              style={styles.backLink}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </>
      ) : (
        <div style={styles.successContent}>
          <div
            aria-hidden="true"
            style={styles.successIcon}
          >
            ✓
          </div>

          <p style={globals.centeredSubtitle}>
            Ya puedes iniciar sesión con tu nueva
            contraseña.
          </p>

          <Button onClick={goToLogin}>
            Iniciar sesión
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}