import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import PageFlipShell from "../components/PageFlipShell";
import { benefitPdfUrl, listBenefits } from "../services/benefitsService";
import { generateCredentialQr } from "../services/credentialService";
import { listMyMessages } from "../services/messagesService";

export default function Card() {
  const baseUrl = window.location.origin;
  const navigate = useNavigate();
  const [qrState, setQrState] = useState({ loading: true, error: "", token: "", expiresAt: 0, remainingSeconds: 0 });
  const [activePanel, setActivePanel] = useState("messages");
  const [benefits, setBenefits] = useState([]);
  const [messages, setMessages] = useState([]);
  const [panelError, setPanelError] = useState("");
  const [loadingPanels, setLoadingPanels] = useState(false);

  const cardRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) setCardHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activePanel, benefits.length, messages.length, loadingPanels]);

  const stored = localStorage.getItem("member");

  const memberFallback = {
    displayName: "Socio Humboldt",
    rutMasked: "",
    section: "Sindicato Humboldt",
    credentialCode: "HUMB-0001",
    photoUrl: "",
    rut: "",
  };

  let member = memberFallback;

  if (stored) {
    try {
      member = { ...memberFallback, ...JSON.parse(stored) };
    } catch {
      member = memberFallback;
    }
  }

  const status = member.credentialCode || member.rut ? "VALID" : "NOT_FOUND";
  const statusLabel = status === "VALID" ? "MIEMBRO VIGENTE" : "NO REGISTRADO";
  const verifyUrl = qrState.token ? `${baseUrl}/#/verify/${encodeURIComponent(qrState.token)}` : "";

  useEffect(() => {
    let alive = true;
    let timerId;

    async function loadQr() {
      const rut = member?.rut;

      if (!rut) {
        setQrState({ loading: false, error: "No se encontró el RUT del socio para generar el QR.", token: "", expiresAt: 0, remainingSeconds: 0 });
        return;
      }

      try {
        setQrState((prev) => ({ ...prev, loading: true, error: "" }));
        const data = await generateCredentialQr(rut);
        if (!alive) return;

        setQrState({
          loading: false,
          error: "",
          token: data.token || "",
          expiresAt: Number(data.expiresAt || 0),
          remainingSeconds: Number(data.remainingSeconds || data.ttlSeconds || 180),
        });
      } catch (err) {
        if (!alive) return;
        setQrState({ loading: false, error: err.message || "No se pudo generar el QR.", token: "", expiresAt: 0, remainingSeconds: 0 });
      }
    }

    loadQr();
    timerId = window.setInterval(loadQr, 175000);

    return () => {
      alive = false;
      window.clearInterval(timerId);
    };
  }, [member?.rut]);

  useEffect(() => {
    if (!qrState.expiresAt) return;

    const timerId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((qrState.expiresAt - Date.now()) / 1000));
      setQrState((prev) => ({ ...prev, remainingSeconds: remaining }));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [qrState.expiresAt]);

  useEffect(() => {
    let alive = true;

    async function loadInsideCard() {
      if (!member?.rut) return;
      setLoadingPanels(true);
      setPanelError("");
      try {
        const [benefitsData, messagesData] = await Promise.all([
          listBenefits(),
          listMyMessages(member.rut),
        ]);

        if (!alive) return;
        setBenefits(Array.isArray(benefitsData?.benefits) ? benefitsData.benefits : []);
        setMessages(Array.isArray(messagesData?.messages) ? messagesData.messages : []);
      } catch (err) {
        if (!alive) return;
        setPanelError(err.message || "No se pudieron cargar los mensajes o beneficios.");
      } finally {
        if (alive) setLoadingPanels(false);
      }
    }

    loadInsideCard();
    const timer = window.setInterval(loadInsideCard, 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [member?.rut]);

  const qrTimer = formatSeconds(qrState.remainingSeconds);

  function handleLogout() {
    localStorage.removeItem("member");
    localStorage.removeItem("session");
    localStorage.removeItem("role");
    localStorage.removeItem("isAdmin");
    navigate("/", { replace: true });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div style={{ ...styles.shell, minHeight: cardHeight || "auto" }}>
            <div ref={cardRef}>
              <CardPreview
                member={{ ...member, statusLabel }}
                qrValue={verifyUrl}
                status={status}
                qrLoading={qrState.loading}
                qrError={qrState.error}
                qrTimer={qrTimer}
              />

              <div style={styles.panelCard}>
                <div style={styles.tabs}>
                  <button
                    style={{ ...styles.tab, ...(activePanel === "messages" ? styles.tabActive : {}) }}
                    onClick={() => setActivePanel("messages")}
                  >
                    Mensajes {messages.length ? `(${messages.length})` : ""}
                  </button>
                  <button
                    style={{ ...styles.tab, ...(activePanel === "benefits" ? styles.tabActive : {}) }}
                    onClick={() => setActivePanel("benefits")}
                  >
                    Beneficios {benefits.length ? `(${benefits.length})` : ""}
                  </button>
                </div>

                {loadingPanels ? <div style={styles.empty}>Cargando información...</div> : null}
                {panelError ? <div style={styles.error}>{panelError}</div> : null}

                {activePanel === "messages" ? (
                  <div style={styles.list}>
                    {messages.length === 0 ? (
                      <div style={styles.empty}>No tienes mensajes nuevos.</div>
                    ) : (
                      messages.map((m) => (
                        <div key={m.id} style={styles.item}>
                          <div style={styles.itemTop}>
                            <strong>{m.title || "Mensaje"}</strong>
                            <span style={styles.badge}>{m.messageType === "PERSONAL" ? "Personal" : "General"}</span>
                          </div>
                          <div style={styles.text}>{m.body}</div>
                          <div style={styles.meta}>{formatDate(m.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={styles.list}>
                    {benefits.length === 0 ? (
                      <div style={styles.empty}>No hay beneficios cargados todavía.</div>
                    ) : (
                      benefits.map((b) => (
                        <div key={b.id} style={styles.item}>
                          <div style={styles.itemTop}>
                            <strong>{b.title}</strong>
                            <span style={styles.badge}>{b.zone === "SUR" ? "Zona Sur" : "Zona Norte"}</span>
                          </div>
                          <div style={styles.text}>{b.shortInfo}</div>
                          {b.hasPdf ? (
                            <a style={styles.pdfBtn} href={benefitPdfUrl(b)} target="_blank" rel="noreferrer">
                              Descargar PDF
                            </a>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div style={styles.footer}>
                <Link to="/" style={styles.link}>Inicio</Link>
                <span style={styles.dot}>•</span>
                <button style={styles.linkButton} onClick={handleLogout}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </PageFlipShell>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0B1F3A", padding: 20, fontFamily: "system-ui" },
  container: { maxWidth: 420, margin: "0 auto" },
  shell: { width: "100%" },
  panelCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 14,
    background: "#12385A",
    color: "white",
    boxShadow: "0 18px 35px rgba(0,0,0,.35)",
  },
  tabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 },
  tab: {
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 14,
    padding: "10px 8px",
    background: "rgba(0,0,0,.22)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  tabActive: { background: "#5CC6C8", color: "#0B1F3A" },
  list: { display: "grid", gap: 10, maxHeight: 320, overflowY: "auto" },
  item: {
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,.94)",
    color: "#0F172A",
  },
  itemTop: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" },
  badge: { background: "#DBEAFE", color: "#1E3A8A", borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap" },
  text: { marginTop: 8, fontSize: 13, lineHeight: 1.35, opacity: 0.9 },
  meta: { marginTop: 8, fontSize: 11, opacity: 0.65 },
  empty: { opacity: 0.9, fontSize: 14, padding: 10 },
  error: { background: "#7f1d1d", padding: 10, borderRadius: 12, marginBottom: 10, fontSize: 13 },
  pdfBtn: {
    display: "inline-block",
    marginTop: 10,
    padding: "8px 10px",
    borderRadius: 10,
    background: "#1E4E75",
    color: "white",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 12,
  },
  footer: { textAlign: "center", marginTop: 12 },
  link: { color: "#5CC6C8", fontWeight: 900, textDecoration: "none" },
  linkButton: { background: "transparent", border: "none", color: "#5CC6C8", fontWeight: 900, cursor: "pointer", fontSize: 14 },
  dot: { color: "rgba(255,255,255,0.45)", margin: "0 8px" },
};

function formatSeconds(total) {
  const value = Math.max(0, Number(total || 0));
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return text;
}
