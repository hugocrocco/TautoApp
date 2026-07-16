import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyCredentialToken } from "../services/credentialService";

export default function Verify() {
  const { code } = useParams();
  const token = decodeURIComponent(code || "");
  const [result, setResult] = useState({ loading: true, status: "CHECKING", message: "Verificando credencial…", remainingSeconds: 0, expiresAt: 0 });

  useEffect(() => {
    let alive = true;

    async function runVerification() {
      try {
        const data = await verifyCredentialToken(token);
        if (!alive) return;

        setResult({
          loading: false,
          status: data.status || (data.ok ? "VALID" : "INVALID"),
          message: data.message || "Resultado de verificación.",
          remainingSeconds: Number(data.remainingSeconds || 0),
          expiresAt: Number(data.expiresAt || 0),
          displayName: data.displayName || "",
          rutMasked: data.rutMasked || data.rut || "",
          estadoSindicato: data.estadoSindicato || "",
          alDiaCuotas: data.alDiaCuotas,
          expiresAtText: data.expiresAtText || "",
        });
      } catch (err) {
        if (!alive) return;
        setResult({ loading: false, status: "ERROR", message: err.message || "No se pudo verificar la credencial.", remainingSeconds: 0, expiresAt: 0 });
      }
    }

    runVerification();
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!result.expiresAt) return;

    const timerId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((result.expiresAt - Date.now()) / 1000));
      setResult((prev) => ({
        ...prev,
        remainingSeconds: remaining,
        status: remaining <= 0 && prev.status === "VALID" ? "EXPIRED" : prev.status,
        message: remaining <= 0 && prev.status === "VALID" ? "El código QR expiró." : prev.message,
      }));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [result.expiresAt]);

  const ui = useMemo(() => {
    if (result.loading || result.status === "CHECKING") {
      return {
        title: "VERIFICANDO",
        subtitle: result.message,
        icon: "⏳",
        pillBg: "#DBEAFE",
        pillBorder: "#2563EB",
        pillText: "#1E3A8A",
        cardBg: "#FFFFFF",
      };
    }

    if (result.status === "VALID") {
      return {
        title: "MIEMBRO VIGENTE",
        subtitle: result.message,
        icon: "✅",
        pillBg: "#DCFCE7",
        pillBorder: "#16A34A",
        pillText: "#14532D",
        cardBg: "#FFFFFF",
      };
    }

    if (result.status === "REVOKED") {
      return {
        title: "CREDENCIAL REVOCADA",
        subtitle: result.message,
        icon: "⛔",
        pillBg: "#FEF3C7",
        pillBorder: "#D97706",
        pillText: "#7C2D12",
        cardBg: "#FFFFFF",
      };
    }

    if (result.status === "EXPIRED") {
      return {
        title: "QR EXPIRADO",
        subtitle: "Pide al socio que muestre nuevamente su credencial para generar otro QR.",
        icon: "⌛",
        pillBg: "#FEE2E2",
        pillBorder: "#DC2626",
        pillText: "#7F1D1D",
        cardBg: "#FFFFFF",
      };
    }

    return {
      title: "NO VÁLIDO",
      subtitle: result.message || "El código no es válido.",
      icon: "❌",
      pillBg: "#FEE2E2",
      pillBorder: "#DC2626",
      pillText: "#7F1D1D",
      cardBg: "#FFFFFF",
    };
  }, [result]);

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

        <div style={styles.timerBox}>
          <div style={styles.timerLabel}>Tiempo restante del QR</div>
          <div style={styles.timerValue}>{formatSeconds(result.remainingSeconds)}</div>
        </div>

        <div style={styles.infoBox}>
          <InfoRow label="Socio" value={result.displayName || "—"} />
          <div style={styles.divider} />
          <InfoRow label="RUT" value={result.rutMasked || "—"} />
          <div style={styles.divider} />
          <InfoRow label="Estado" value={result.estadoSindicato || result.status || "—"} />
          <div style={styles.divider} />
          <InfoRow label="Cuotas" value={result.alDiaCuotas === true ? "Al día" : result.alDiaCuotas === false ? "Pendiente / no informado" : "—"} />
          <div style={styles.divider} />
          <InfoRow label="Vence" value={result.expiresAtText || "—"} />
          <div style={styles.divider} />
          <InfoRow label="Verificado" value={new Date().toLocaleString()} />
        </div>

        <Link to="/" style={styles.button}>
          Volver
        </Link>
      </div>

      <div style={styles.footer}>
        Este verificador solo acepta códigos QR temporales generados por la app.
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function formatSeconds(total) {
  const value = Math.max(0, Number(total || 0));
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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

  timerBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    textAlign: "center",
    background: "#E0F2FE",
    color: "#0C4A6E",
    border: "1px solid #7DD3FC",
  },
  timerLabel: { fontSize: 12, fontWeight: 900, opacity: 0.85 },
  timerValue: { marginTop: 4, fontSize: 34, fontWeight: 950, letterSpacing: 1 },

  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    background: "#F1F5F9",
    color: "#0F172A",
  },
  infoRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  infoLabel: { fontSize: 12, opacity: 0.75, fontWeight: 800 },
  infoValue: { fontSize: 12, fontWeight: 900, textAlign: "right" },
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
