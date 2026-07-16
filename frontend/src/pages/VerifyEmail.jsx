import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rutFromUrl = useMemo(() => searchParams.get("rut") || "", [searchParams]);
  const emailFromUrl = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [rut, setRut] = useState(rutFromUrl);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const rutClean = rut.trim();
    const codeClean = code.trim();

    if (!rutClean) {
      alert("Ingresa tu RUT.");
      return;
    }

    if (!codeClean) {
      alert("Ingresa el código de verificación.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyEmail({
        rut: rutClean,
        code: codeClean,
      });

      if (!result?.ok) {
        alert(result?.message || "No se pudo verificar el correo.");
        return;
      }

      alert(result.message || "Correo verificado correctamente. Ahora puedes iniciar sesión.");
      navigate("/login");
    } catch (error) {
      alert(error.message || "Error al verificar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Verificar correo</h2>

        <p style={styles.text}>
          Ingresa el código de 6 dígitos generado para activar tu cuenta.
        </p>

        {emailFromUrl && (
          <p style={styles.email}>
            Correo: <strong>{emailFromUrl}</strong>
          </p>
        )}

        <label style={styles.label}>RUT</label>
        <input
          style={styles.input}
          placeholder="Ej: 12345678-9"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
        />

        <label style={styles.label}>Código</label>
        <input
          style={styles.input}
          placeholder="Código de verificación"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          inputMode="numeric"
        />

        <button style={styles.button} onClick={handleVerify} disabled={loading}>
          {loading ? "Verificando..." : "Verificar"}
        </button>

        <Link to="/login" style={styles.link}>
          Volver al login
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1F3A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "#12385A",
    padding: 24,
    borderRadius: 20,
    color: "white",
    width: "100%",
    maxWidth: 360,
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
  },
  title: {
    marginTop: 0,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 1.4,
  },
  email: {
    fontSize: 13,
    background: "rgba(255,255,255,0.08)",
    padding: 10,
    borderRadius: 10,
    wordBreak: "break-word",
  },
  label: {
    display: "block",
    textAlign: "left",
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 10,
    border: "none",
    outline: "none",
  },
  button: {
    marginTop: 16,
    padding: 12,
    width: "100%",
    borderRadius: 10,
    background: "#5CC6C8",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },
  link: {
    display: "block",
    marginTop: 14,
    color: "white",
  },
};