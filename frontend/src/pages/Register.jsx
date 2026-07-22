import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthLayout } from "../layouts";
import {
  Button,
  Input,
  PasswordInput,
} from "../components/ui";
import {
  colors,
  globals,
  inputs,
  radius,
  spacing,
  typography,
} from "../theme";

import { registerWithPhoto } from "../services/authService";

export default function Register() {
  const [displayName, setDisplayName] = useState("");
  const [rut, setRut] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const displayNameClean = displayName.trim();
    const rutClean = rut.trim();
    const emailClean = email.trim().toLowerCase();
    const emailConfirmClean = emailConfirm
      .trim()
      .toLowerCase();
    const telefonoClean = telefono.trim();
    const direccionClean = direccion.trim();

    setError("");

    if (!displayNameClean) {
      setError("Debes ingresar tu nombre completo.");
      return;
    }

    if (!rutClean) {
      setError("Debes ingresar tu RUT.");
      return;
    }

    if (!emailClean || !emailConfirmClean) {
      setError(
        "Debes ingresar y confirmar el correo electrónico."
      );
      return;
    }

    if (emailClean !== emailConfirmClean) {
      setError("Los correos electrónicos no coinciden.");
      return;
    }

    if (!password || !passwordConfirm) {
      setError("Debes ingresar y confirmar la clave.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Las claves no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError(
        "La clave debe tener al menos 6 caracteres."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithPhoto({
        displayName: displayNameClean,
        rut: rutClean,
        password,
        photoFile,
        email: emailClean,
        telefono: telefonoClean,
        direccion: direccionClean,
      });

      console.log("REGISTER OK:", result);

      const resultRut = result?.rut || rutClean;
      const resultEmail = result?.email || emailClean;

      window.location.href =
        `/#/verify-email?rut=${encodeURIComponent(
          resultRut
        )}&email=${encodeURIComponent(resultEmail)}`;
    } catch (registerError) {
      console.error("REGISTER ERROR:", registerError);

      setError(
        registerError.message ||
          "No se pudo completar el registro. Intenta nuevamente."
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
      width: 112,
      height: 112,
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      borderRadius: radius.large,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.10)",
    },

    logo: {
      width: 104,
      height: 104,
      objectFit: "contain",
    },

    form: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    },

    sectionTitle: {
      margin: `${spacing.sm}px 0 0`,
      paddingBottom: spacing.sm,
      borderBottom:
        "1px solid rgba(255,255,255,0.10)",
      color: colors.textSecondary,
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    fileGroup: {
      width: "100%",
    },

    fileLabel: {
      display: "block",
      marginBottom: spacing.xs,
      color: colors.textSecondary,
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
    },

    fileInput: {
      ...inputs.input,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.65 : 1,
    },

    selectedFile: {
      margin: `${spacing.xs}px 0 0`,
      color: colors.textMuted,
      fontSize: typography.size.small,
      lineHeight: typography.lineHeight.normal,
      overflowWrap: "anywhere",
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

    link: {
      color: colors.textSecondary,
      textDecoration: "none",
      fontSize: typography.size.small,
      fontWeight: typography.weight.bold,
    },
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para acceder a tu credencial digital"
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
        <p style={styles.sectionTitle}>
          Datos personales
        </p>

        <Input
          id="register-display-name"
          label="Nombre completo"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            clearError();
          }}
          placeholder="Nombre y apellidos"
          autoComplete="name"
          disabled={loading}
          required
        />

        <Input
          id="register-rut"
          label="RUT"
          value={rut}
          onChange={(event) => {
            setRut(event.target.value);
            clearError();
          }}
          placeholder="Ej: 12.345.678-9"
          autoComplete="username"
          disabled={loading}
          required
        />

        <Input
          id="register-phone"
          label="Teléfono"
          type="tel"
          value={telefono}
          onChange={(event) => {
            setTelefono(event.target.value);
            clearError();
          }}
          placeholder="+56 9 1234 5678"
          autoComplete="tel"
          disabled={loading}
        />

        <Input
          id="register-address"
          label="Dirección"
          value={direccion}
          onChange={(event) => {
            setDireccion(event.target.value);
            clearError();
          }}
          placeholder="Dirección de domicilio"
          autoComplete="street-address"
          disabled={loading}
        />

        <p style={styles.sectionTitle}>
          Correo electrónico
        </p>

        <Input
          id="register-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError();
          }}
          placeholder="correo@dominio.com"
          autoComplete="email"
          disabled={loading}
          required
        />

        <Input
          id="register-email-confirm"
          label="Confirmar email"
          type="email"
          value={emailConfirm}
          onChange={(event) => {
            setEmailConfirm(event.target.value);
            clearError();
          }}
          placeholder="Repite tu correo electrónico"
          autoComplete="email"
          disabled={loading}
          required
        />

        <p style={styles.sectionTitle}>
          Seguridad
        </p>

        <PasswordInput
          id="register-password"
          label="Clave"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError();
          }}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          disabled={loading}
          helpText="La clave debe tener al menos 6 caracteres."
          required
        />

        <PasswordInput
          id="register-password-confirm"
          label="Confirmar clave"
          value={passwordConfirm}
          onChange={(event) => {
            setPasswordConfirm(event.target.value);
            clearError();
          }}
          placeholder="Repite tu clave"
          autoComplete="new-password"
          disabled={loading}
          required
        />

        <p style={styles.sectionTitle}>
          Fotografía
        </p>

        <div style={styles.fileGroup}>
          <label
            htmlFor="register-photo"
            style={styles.fileLabel}
          >
            Foto de perfil
          </label>

          <input
            id="register-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              setPhotoFile(
                event.target.files?.[0] || null
              );
              clearError();
            }}
            disabled={loading}
            style={styles.fileInput}
          />

          <p style={styles.selectedFile}>
            {photoFile
              ? `Archivo seleccionado: ${photoFile.name}`
              : "Puedes tomar una fotografía o elegir una imagen del dispositivo."}
          </p>
        </div>

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
            ? "Registrando..."
            : "Crear cuenta"}
        </Button>

        <p style={styles.helper}>
          {loading
            ? "Estamos validando tus datos con el padrón..."
            : "Tus datos serán validados antes de activar la credencial."}
        </p>
      </form>

      <div style={styles.footer}>
        <Link to="/" style={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </AuthLayout>
  );
} 