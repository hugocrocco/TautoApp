import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageFlipShell from "../components/PageFlipShell";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    rutMasked: "",
    section: "Valparaíso Moto Club",
    credentialCode: "",
    photoUrl: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        photoUrl: String(reader.result || ""), // data:image/... base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const member = {
      displayName: form.displayName.trim() || "Invitado",
      rutMasked: form.rutMasked.trim() || "******",
      section: form.section.trim() || "Valparaíso Moto Club",
      credentialCode: form.credentialCode.trim() || "",
      photoUrl: form.photoUrl, // <- dataURL si se subió foto
    };

    try {
      localStorage.setItem("member", JSON.stringify(member));
    } catch (err) {
      console.error("Error guardando en localStorage", err);
    }

    navigate("/card");
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
                  <div style={styles.sub}>VMC · Crear cuenta</div>
                </div>
              </div>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              <label style={styles.label}>
                Nombre completo
                <input
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: Hugo Crocco"
                />
              </label>

              <label style={styles.label}>
                RUT (o ID)
                <input
                  name="rutMasked"
                  value={form.rutMasked}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: 12.345.678-9"
                />
              </label>

              <label style={styles.label}>
                Sección / Capítulo
                <input
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: Valparaíso Moto Club"
                />
              </label>

              <label style={styles.label}>
                Código de credencial
                <input
                  name="credentialCode"
                  value={form.credentialCode}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: VMC-0001"
                />
              </label>

              {/* FOTO: subir o sacar */}
              <label style={styles.label}>
                Foto (subir o sacar)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  style={styles.fileInput}
                />
              </label>

              <button type="submit" style={styles.button}>
                Guardar y ver credencial
              </button>
            </form>

            <div style={styles.footer}>
              <Link to="/card" style={styles.link}>
                Ver mi credencial
              </Link>
              <span style={styles.dot}>•</span>
              <Link to="/" style={styles.link}>
                Ir al inicio
              </Link>
            </div>
          </div>
        </PageFlipShell>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1F2A14",
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
    background: "linear-gradient(180deg, #556B2F 0%, #3E4F22 100%)",
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
    width: 128,
    height: 128,
    borderRadius: 18,
    background: "rgba(255,255,255,0.14)",
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
  org: { fontSize: 20, fontWeight: 900, letterSpacing: 0.3 },
  sub: { marginTop: 2, fontSize: 13, opacity: 0.9 },

  form: {
    display: "grid",
    gap: 10,
    marginTop: 8,
    maxWidth: 300, // 👈 ajusta aquí (320–360 recomendado)
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
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(15,23,42,0.35)",
    color: "white",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 14,
  },
  fileInput: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px dashed rgba(255,255,255,0.45)",
    background: "rgba(15,23,42,0.25)",
    color: "white",
    fontSize: 13,
    cursor: "pointer",
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
  footer: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
  },
  link: {
    color: "#E5F5C6",
    fontWeight: 900,
    textDecoration: "none",
  },
  dot: {
    color: "rgba(255,255,255,0.6)",
    margin: "0 8px",
  },
};