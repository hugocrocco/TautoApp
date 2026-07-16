import { useState } from "react";
import { Link } from "react-router-dom";
import { registerWithPhoto } from "../services/authService";

export default function Register() {
  const [displayName, setDisplayName] = useState("");
  const [rut, setRut] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailClean = email.trim().toLowerCase();
    const emailConfirmClean = emailConfirm.trim().toLowerCase();

    if (!emailClean || !emailConfirmClean) {
      alert("Debes ingresar y confirmar el correo electrÃ³nico.");
      return;
    }

    if (emailClean !== emailConfirmClean) {
      alert("Los correos electrÃ³nicos no coinciden.");
      return;
    }

    if (!password || !passwordConfirm) {
      alert("Debes ingresar y confirmar la clave.");
      return;
    }

    if (password !== passwordConfirm) {
      alert("Las claves no coinciden.");
      return;
    }

    if (password.length < 6) {
      alert("La clave debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithPhoto({
        displayName,
        rut,
        password,
        photoFile,
        email: emailClean,
        telefono,
        direccion,
      });

      console.log("REGISTER OK:", result);
      window.location.href = `/#/verify-email?rut=${encodeURIComponent(result?.rut || rut)}&email=${encodeURIComponent(result?.email || emailClean)}`;
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                <div style={styles.orgSub}>Registro de usuario</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Nombre completo
              <input
                style={styles.input}
                placeholder="Nombre completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              RUT
              <input
                style={styles.input}
                placeholder="RUT"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                type="email"
                placeholder="correo@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              Confirmar email
              <input
                style={styles.input}
                type="email"
                placeholder="Repite tu correo"
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              TelÃ©fono
              <input
                style={styles.input}
                placeholder="+56 9 ..."
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </label>

            <label style={styles.label}>
              DirecciÃ³n
              <input
                style={styles.input}
                placeholder="DirecciÃ³n de casa"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </label>

            <label style={styles.label}>
              Clave
              <input
                style={styles.input}
                type="password"
                placeholder="Clave"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              Confirmar clave
              <input
                style={styles.input}
                type="password"
                placeholder="Repite tu clave"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </label>

            <label style={styles.label}>
              Foto
              <input
                style={styles.fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </label>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </form>

          <div style={styles.footerRow}>
            <Link to="/" style={styles.link}>
              Volver al inicio
            </Link>
          </div>
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
  header: { marginBottom: 10 },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
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
  logo: {
    width: 120,
    height: 120,
    objectFit: "contain",
  },
  org: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0.4,
  },
  orgSub: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.9,
    letterSpacing: 1.2,
  },
  form: {
    display: "grid",
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  label: {
    fontSize: 12,
    opacity: 0.95,
    display: "grid",
    gap: 4,
  },
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
    boxSizing: "border-box",
  },
  fileInput: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(15,23,42,0.35)",
    color: "white",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  },
  button: {
    marginTop: 6,
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
    background: "#5CC6C8",
    color: "#0B1F3A",
    fontSize: 14,
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
};
