import { useState } from "react";
import { Link } from "react-router-dom";
import PageFlipShell from "../components/PageFlipShell";

export default function Home() {
  const [view, setView] = useState("main"); // "main" | "contact"

  const hasSession = (() => {
    try {
      const s = JSON.parse(localStorage.getItem("session") || "null");
      return !!s?.ok;
    } catch {
      return false;
    }
  })();

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
                  <div style={styles.sub}>VMC</div>
                </div>
              </div>
              <div style={styles.sub}>{view === "main" ? "Inicio" : "Contacto"}</div>
            </div>

            {view === "main" ? (
              <>
                <div style={styles.actions}>
                  <Link to="/login" style={styles.btn}>
                    Iniciar sesión
                  </Link>
                  <Link to="/register" style={styles.btnAlt}>
                    Crear cuenta
                  </Link>

                  {hasSession ? (
                    <Link to="/card" style={styles.btnAlt}>
                      Mi credencial
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setView("contact")}
                    style={styles.btnAltBtn}
                  >
                    Contacto
                  </button>
                </div>

                <div style={styles.hint}>
                  Tip: crea tu cuenta o inicia sesión para ver tu credencial.
                </div>
              </>
            ) : (
              <>
                <div style={styles.contactBox}>
                  <div style={styles.contactTitle}>¿Necesitas ayuda?</div>
                  <div style={styles.contactText}>
                    Aquí después ponemos formulario y datos reales.
                    <br />
                    Por ahora puedes dejarnos un correo de prueba.
                  </div>

                  <div style={styles.contactRow}>
                    <a style={styles.btnAltLink} href="mailto:contacto@vmc.cl">
                      Escribir correo
                    </a>
                    <button type="button" onClick={() => setView("main")} style={styles.btnAltBtn}>
                      Volver
                    </button>
                  </div>
                </div>
              </>
            )}
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
    maxWidth: 960,
    margin: "0 auto",
  },
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#556B2F",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
  },
  header: { textAlign: "center", marginBottom: 14 },
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 6,
  },
  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 14,
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
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
  },
  org: { fontSize: 20, fontWeight: 900, letterSpacing: 0.2 },
  sub: { marginTop: 4, fontSize: 16, opacity: 0.9 }, // Tamaño del Titulo

  actions: { display: "grid", gap: 10, marginTop: 12 },

  btn: {
    display: "block",
    textAlign: "center",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    background: "#3E4F22",
    color: "white",
    border: "none",
  },

  btnAlt: {
    display: "block",
    textAlign: "center",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    background: "rgba(31,42,20,0.35)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
  },

  // botón con look de Link
  btnAltBtn: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900,
    background: "rgba(31,42,20,0.35)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
    cursor: "pointer",
  },

  hint: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.9,
    textAlign: "center",
  },

  contactBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    background: "rgba(31,42,20,0.25)",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  contactTitle: { fontWeight: 900, fontSize: 16 },
  contactText: { marginTop: 6, fontSize: 13, opacity: 0.9, lineHeight: 1.35 },
  contactRow: { display: "grid", gap: 10, marginTop: 12 },

  btnAltLink: {
    display: "block",
    textAlign: "center",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    background: "rgba(31,42,20,0.35)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
  },
};