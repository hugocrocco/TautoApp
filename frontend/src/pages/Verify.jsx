import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { mockDb } from "../services/mockDb";

export default function Verify() {
  const { code } = useParams();

  // Mock demo: válido solo HUMB-001
  const status = mockDb[code]?.status ?? "NOT_FOUND";

  const ui = useMemo(() => {
    if (status === "VALID") {
      return {
        title: "MIEMBRO VIGENTE",
        subtitle: "Credencial verificada correctamente",
        icon: "✅",
        pillBg: "#DCFCE7",
        pillBorder: "#16A34A",
        pillText: "#14532D",
        cardBg: "#FFFFFF",
      };
    }

    if (status === "REVOKED") {
      return {
        title: "CREDENCIAL REVOCADA",
        subtitle: "El miembro ya no se encuentra activo",
        icon: "⛔",
        pillBg: "#FEF3C7",
        pillBorder: "#D97706",
        pillText: "#7C2D12",
        cardBg: "#FFFFFF",
      };
    }

    return {
      title: "NO ENCONTRADO",
      subtitle: "El código no existe en el sistema",
      icon: "❌",
      pillBg: "#FEE2E2",
      pillBorder: "#DC2626",
      pillText: "#7F1D1D",
      cardBg: "#FFFFFF",
    };
  }, [status]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Sindicato Humboldt</div>
        <div style={styles.caption}>Verificador de Credenciales</div>
      </div>

      <div style={{ ...styles.card, background: ui.cardBg }}>
        <div style={styles.pillWrap}>
          <div
            style={{
              ...styles.pill,
              background: ui.pillBg,
              borderColor: ui.pillBorder,
              color: ui.pillText,
            }}
          >
            <span style={styles.pillIcon}>{ui.icon}</span>
            <span style={styles.pillText}>{ui.title}</span>
          </div>
        </div>

        <div style={styles.subtitle}>{ui.subtitle}</div>

        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <div style={styles.infoLabel}>Código</div>
            <div style={styles.infoValue}>{code}</div>
          </div>
          <div style={styles.divider} />
          <div style={styles.infoRow}>
            <div style={styles.infoLabel}>Fecha</div>
            <div style={styles.infoValue}>{new Date().toLocaleString()}</div>
          </div>
        </div>

        <Link to="/" style={styles.button}>
          Volver a mi credencial
        </Link>
      </div>

      <div style={styles.footer}>
        Consejo: si el miembro está revocado, aquí debe aparecer “❌ Revocado”.
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    fontFamily: "system-ui",
    background: "linear-gradient(180deg, #0B4AA2 0%, #062A57 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: "100%",
    maxWidth: 520,
    color: "white",
    marginTop: 10,
    marginBottom: 14,
  },
  brand: { fontSize: 20, fontWeight: 900, letterSpacing: 0.2 },
  caption: { marginTop: 4, opacity: 0.85, fontSize: 13 },

  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
  },

  pillWrap: { display: "flex", justifyContent: "center" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "2px solid",
  },
  pillIcon: { fontSize: 18, lineHeight: 1 },
  pillText: { fontWeight: 900, fontSize: 14, letterSpacing: 0.2 },

  subtitle: {
    marginTop: 12,
    textAlign: "center",
    color: "#0F172A",
    fontSize: 14,
  },

  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    background: "#F1F5F9",
    color: "#0F172A",
  },
  infoRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  infoLabel: { fontSize: 12, opacity: 0.75, fontWeight: 800 },
  infoValue: { fontSize: 12, fontWeight: 900 },
  divider: { height: 1, background: "#CBD5E1", margin: "10px 0" },

  button: {
    marginTop: 14,
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    background: "#0B4AA2",
    color: "white",
    padding: 12,
    borderRadius: 14,
    fontWeight: 900,
  },

  footer: {
    width: "100%",
    maxWidth: 520,
    marginTop: 12,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
  },
};