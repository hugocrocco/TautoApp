import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/logo-sindicato.png" alt="Logo Sindicato" style={styles.logo} />

          <div style={styles.title}>Sindicato Humboldt</div>
          <div style={styles.subtitle}>Sistema de Identificacion de Afiliados </div>

          <div style={styles.actions}>
            <Link to="/login" style={styles.button}>Iniciar sesión</Link>
            <Link to="/register" style={styles.button}>Registrarse</Link>
            <Link to="/benefits" style={styles.button}>Beneficios</Link>
            <Link to="/messages" style={styles.button}>Mensajes</Link>
            <Link to="/admin" style={styles.adminButton}>Panel Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0B1F3A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui" },
  container: { width: "100%", maxWidth: 420 },
  card: { background: "#12385A", borderRadius: 24, padding: 24, color: "#F4FAFA", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.40)", boxSizing: "border-box" },
  logo: { width: 140, height: 140, objectFit: "contain", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 900 },
  subtitle: { fontSize: 13, opacity: 0.9, marginBottom: 20 },
  actions: { display: "flex", flexDirection: "column", gap: 12 },
  button: { padding: "12px", borderRadius: 12, background: "#1E4E75", color: "#F4FAFA", fontWeight: 900, textDecoration: "none" },
  adminButton: { padding: "12px", borderRadius: 12, background: "#5CC6C8", color: "#0B1F3A", fontWeight: 900, textDecoration: "none" },
};