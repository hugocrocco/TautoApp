import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import CardPreview from "../components/CardPreview";
import PageFlipShell from "../components/PageFlipShell";

import {
  benefitPdfUrl,
  listBenefits,
} from "../services/benefitsService";

import {
  generateCredentialQr,
} from "../services/credentialService";

import {
  listMyMessages,
} from "../services/messagesService";

import {
  uploadMemberPhoto,
} from "../services/photoService";

const MEMBER_FALLBACK = {
  displayName: "Socio Humboldt",
  rutMasked: "",
  section: "Sindicato Humboldt",
  credentialCode: "HUMB-0001",
  photoUrl: "",
  rut: "",
};

export default function Card() {
  const baseUrl = window.location.origin;
  const navigate = useNavigate();

  const cardRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [member, setMember] = useState(() => {
    const stored = localStorage.getItem("member");

    if (!stored) {
      return MEMBER_FALLBACK;
    }

    try {
      return {
        ...MEMBER_FALLBACK,
        ...JSON.parse(stored),
      };
    } catch {
      return MEMBER_FALLBACK;
    }
  });

  const [qrState, setQrState] = useState({
    loading: true,
    error: "",
    token: "",
    expiresAt: 0,
    remainingSeconds: 0,
  });

  const [activePanel, setActivePanel] = useState("messages");
  const [benefits, setBenefits] = useState([]);
  const [messages, setMessages] = useState([]);
  const [panelError, setPanelError] = useState("");
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [cardHeight, setCardHeight] = useState(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  const status =
    member?.credentialCode || member?.rut
      ? "VALID"
      : "NOT_FOUND";

  const statusLabel =
    status === "VALID"
      ? "MIEMBRO VIGENTE"
      : "NO REGISTRADO";

  const verifyUrl = qrState.token
    ? `${baseUrl}/#/verify/${encodeURIComponent(qrState.token)}`
    : "";

  const qrTimer = formatSeconds(qrState.remainingSeconds);

  useLayoutEffect(() => {
    const element = cardRef.current;

    if (!element) return undefined;

    const measure = () => {
      const height = Math.ceil(
        element.getBoundingClientRect().height
      );

      if (height > 0) {
        setCardHeight(height);
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    activePanel,
    benefits.length,
    messages.length,
    loadingPanels,
  ]);

  useEffect(() => {
    let alive = true;
    let refreshTimer;

    async function loadQr() {
      const rut = member?.rut;

      if (!rut) {
        setQrState({
          loading: false,
          error:
            "No se encontró el RUT del socio para generar el QR.",
          token: "",
          expiresAt: 0,
          remainingSeconds: 0,
        });

        return;
      }

      try {
        setQrState((previous) => ({
          ...previous,
          loading: true,
          error: "",
        }));

        const data = await generateCredentialQr(rut);

        if (!alive) return;

        setQrState({
          loading: false,
          error: "",
          token: data?.token || "",
          expiresAt: Number(data?.expiresAt || 0),
          remainingSeconds: Number(
            data?.remainingSeconds ||
              data?.ttlSeconds ||
              180
          ),
        });
      } catch (error) {
        if (!alive) return;

        setQrState({
          loading: false,
          error:
            error?.message ||
            "No se pudo generar el QR.",
          token: "",
          expiresAt: 0,
          remainingSeconds: 0,
        });
      }
    }

    loadQr();

    refreshTimer = window.setInterval(
      loadQr,
      175000
    );

    return () => {
      alive = false;
      window.clearInterval(refreshTimer);
    };
  }, [member?.rut]);

  useEffect(() => {
    if (!qrState.expiresAt) return undefined;

    const timerId = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (qrState.expiresAt - Date.now()) / 1000
        )
      );

      setQrState((previous) => ({
        ...previous,
        remainingSeconds: remaining,
      }));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [qrState.expiresAt]);

  useEffect(() => {
    let alive = true;

    async function loadInsideCard() {
      if (!member?.rut) return;

      setLoadingPanels(true);
      setPanelError("");

      try {
        const [benefitsData, messagesData] =
          await Promise.all([
            listBenefits(),
            listMyMessages(member.rut),
          ]);

        if (!alive) return;

        setBenefits(
          Array.isArray(benefitsData?.benefits)
            ? benefitsData.benefits
            : []
        );

        setMessages(
          Array.isArray(messagesData?.messages)
            ? messagesData.messages
            : []
        );
      } catch (error) {
        if (!alive) return;

        setPanelError(
          error?.message ||
            "No se pudieron cargar los mensajes o beneficios."
        );
      } finally {
        if (alive) {
          setLoadingPanels(false);
        }
      }
    }

    loadInsideCard();

    const timerId = window.setInterval(
      loadInsideCard,
      60000
    );

    return () => {
      alive = false;
      window.clearInterval(timerId);
    };
  }, [member?.rut]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function openPhotoModal() {
    setSelectedPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setPhotoMessage("");
    setShowPhotoModal(true);
  }

  function closePhotoModal() {
    if (photoLoading) return;

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setSelectedPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setPhotoMessage("");
    setShowPhotoModal(false);
  }

  function handlePhotoSelection(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPhotoError(
        "Solo se permiten imágenes JPG, PNG o WEBP."
      );
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setPhotoError(
        "La fotografía no puede superar los 5 MB."
      );
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedPhoto(file);
    setPhotoPreview(previewUrl);
    setPhotoError("");
    setPhotoMessage("");
  }

  async function handleSavePhoto() {
    if (!selectedPhoto) {
      setPhotoError(
        "Primero debes elegir o tomar una fotografía."
      );
      return;
    }

    if (!member?.rut) {
      setPhotoError(
        "No se encontró el RUT del socio."
      );
      return;
    }

    try {
      setPhotoLoading(true);
      setPhotoError("");
      setPhotoMessage("");

      const response = await uploadMemberPhoto({
        institucionId: 1,
        rut: member.rut,
        file: selectedPhoto,
      });

      const timestamp = Date.now();

      const newPhotoUrl =
        response?.photoUrl ||
        `/api/photos/1/${encodeURIComponent(
          member.rut
        )}?v=${timestamp}`;

      const photoUrlWithVersion =
        newPhotoUrl.includes("?")
          ? `${newPhotoUrl}&refresh=${timestamp}`
          : `${newPhotoUrl}?refresh=${timestamp}`;

      const updatedMember = {
        ...member,
        photoUrl: photoUrlWithVersion,
        photoObjectKey:
          response?.objectName ||
          member?.photoObjectKey ||
          "",
      };

      setMember(updatedMember);

      localStorage.setItem(
        "member",
        JSON.stringify(updatedMember)
      );

      setPhotoMessage(
        "Fotografía actualizada correctamente."
      );

      window.setTimeout(() => {
        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }

        setSelectedPhoto(null);
        setPhotoPreview("");
        setPhotoError("");
        setPhotoMessage("");
        setShowPhotoModal(false);
      }, 1200);
    } catch (error) {
      setPhotoError(
        error?.message ||
          "No se pudo actualizar la fotografía."
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("member");
    localStorage.removeItem("session");
    localStorage.removeItem("role");
    localStorage.removeItem("isAdmin");

    navigate("/", {
      replace: true,
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <PageFlipShell>
          <div
            style={{
              ...styles.shell,
              minHeight: cardHeight || "auto",
            }}
          >
            <div ref={cardRef}>
              <div style={styles.cardPreviewWrapper}>
                <CardPreview
                  member={{
                    ...member,
                    statusLabel,
                  }}
                  qrValue={verifyUrl}
                  status={status}
                  qrLoading={qrState.loading}
                  qrError={qrState.error}
                  qrTimer={qrTimer}
                  onPhotoClick={openPhotoModal}
                />

                <button
                  type="button"
                  style={styles.libraryButton}
                  onClick={() => navigate("/library")}
                  aria-label="Abrir biblioteca"
                  title="Biblioteca"
                >
                  <span style={styles.libraryIcon}>📚</span>
                  <span>Biblioteca</span>
                </button>
              </div>

              <div style={styles.photoHint}>
                Presiona “Cambiar foto” para actualizarla
              </div>

              <div style={styles.panelCard}>
                <div style={styles.tabs}>
                  <button
                    type="button"
                    style={{
                      ...styles.tab,
                      ...(activePanel === "messages"
                        ? styles.tabActive
                        : {}),
                    }}
                    onClick={() =>
                      setActivePanel("messages")
                    }
                  >
                    Mensajes{" "}
                    {messages.length
                      ? `(${messages.length})`
                      : ""}
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.tab,
                      ...(activePanel === "benefits"
                        ? styles.tabActive
                        : {}),
                    }}
                    onClick={() =>
                      setActivePanel("benefits")
                    }
                  >
                    Beneficios{" "}
                    {benefits.length
                      ? `(${benefits.length})`
                      : ""}
                  </button>
                </div>

                {loadingPanels ? (
                  <div style={styles.empty}>
                    Cargando información...
                  </div>
                ) : null}

                {panelError ? (
                  <div style={styles.error}>
                    {panelError}
                  </div>
                ) : null}

                {activePanel === "messages" ? (
                  <div style={styles.list}>
                    {messages.length === 0 ? (
                      <div style={styles.empty}>
                        No tienes mensajes nuevos.
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          style={styles.item}
                        >
                          <div style={styles.itemTop}>
                            <strong>
                              {message.title ||
                                "Mensaje"}
                            </strong>

                            <span style={styles.badge}>
                              {message.messageType ===
                              "PERSONAL"
                                ? "Personal"
                                : "General"}
                            </span>
                          </div>

                          <div style={styles.text}>
                            {message.body}
                          </div>

                          <div style={styles.meta}>
                            {formatDate(
                              message.createdAt
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={styles.list}>
                    {benefits.length === 0 ? (
                      <div style={styles.empty}>
                        No hay beneficios cargados
                        todavía.
                      </div>
                    ) : (
                      benefits.map((benefit) => (
                        <div
                          key={benefit.id}
                          style={styles.item}
                        >
                          <div style={styles.itemTop}>
                            <strong>
                              {benefit.title}
                            </strong>

                            <span style={styles.badge}>
                              {benefit.zone === "SUR"
                                ? "Zona Sur"
                                : "Zona Norte"}
                            </span>
                          </div>

                          <div style={styles.text}>
                            {benefit.shortInfo}
                          </div>

                          {benefit.hasPdf ? (
                            <a
                              style={styles.pdfBtn}
                              href={benefitPdfUrl(
                                benefit
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
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
                <Link to="/" style={styles.link}>
                  Inicio
                </Link>

                <span style={styles.dot}>•</span>

                <Link
                  to="/change-password"
                  style={styles.link}
                >
                  Cambiar contraseña
                </Link>

                <span style={styles.dot}>•</span>

                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </PageFlipShell>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={styles.hiddenInput}
          onChange={handlePhotoSelection}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          style={styles.hiddenInput}
          onChange={handlePhotoSelection}
        />

        {showPhotoModal ? (
          <div
            style={styles.photoModalBackdrop}
            onClick={closePhotoModal}
          >
            <div
              style={styles.photoModal}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h2 style={styles.photoModalTitle}>
                Cambiar fotografía
              </h2>

              <p style={styles.photoModalText}>
                Puedes elegir una imagen guardada o
                tomar una fotografía en este instante.
              </p>

              <div style={styles.photoOptions}>
                <button
                  type="button"
                  style={styles.photoOptionButton}
                  onClick={() =>
                    galleryInputRef.current?.click()
                  }
                  disabled={photoLoading}
                >
                  <span style={styles.optionIcon}>
                    🖼️
                  </span>

                  <span>
                    Elegir desde galería
                  </span>
                </button>

                <button
                  type="button"
                  style={styles.photoOptionButton}
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  disabled={photoLoading}
                >
                  <span style={styles.optionIcon}>
                    📷
                  </span>

                  <span>
                    Tomar foto ahora
                  </span>
                </button>
              </div>

              {photoPreview ? (
                <>
                  <div style={styles.previewTitle}>
                    Vista previa
                  </div>

                  <div style={styles.photoPreviewBox}>
                    <img
                      src={photoPreview}
                      alt="Vista previa de la fotografía"
                      style={
                        styles.photoPreviewImage
                      }
                    />
                  </div>
                </>
              ) : (
                <div style={styles.noPreview}>
                  Todavía no has seleccionado una
                  fotografía.
                </div>
              )}

              {photoError ? (
                <div style={styles.photoUploadError}>
                  {photoError}
                </div>
              ) : null}

              {photoMessage ? (
                <div
                  style={styles.photoUploadSuccess}
                >
                  {photoMessage}
                </div>
              ) : null}

              <div style={styles.photoModalActions}>
                <button
                  type="button"
                  style={styles.photoCancelButton}
                  onClick={closePhotoModal}
                  disabled={photoLoading}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.photoSaveButton,
                    opacity:
                      !selectedPhoto ||
                      photoLoading
                        ? 0.55
                        : 1,
                    cursor:
                      !selectedPhoto ||
                      photoLoading
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={handleSavePhoto}
                  disabled={
                    !selectedPhoto ||
                    photoLoading
                  }
                >
                  {photoLoading
                    ? "Guardando..."
                    : "Guardar foto"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
    boxSizing: "border-box",
  },

  container: {
    maxWidth: 420,
    margin: "0 auto",
  },

  shell: {
    width: "100%",
  },

  cardPreviewWrapper: {
    position: "relative",
    width: "100%",
  },

  libraryButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(255,255,255,.45)",
    borderRadius: 999,
    padding: "7px 10px",
    background: "rgba(11,31,58,.88)",
    color: "white",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,.28)",
    backdropFilter: "blur(6px)",
  },

  libraryIcon: {
    fontSize: 15,
    lineHeight: 1,
  },

  photoHint: {
    marginTop: 8,
    color: "rgba(255,255,255,.72)",
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
  },

  panelCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 14,
    background: "#12385A",
    color: "white",
    boxShadow: "0 18px 35px rgba(0,0,0,.35)",
  },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 12,
  },

  tab: {
    border:
      "1px solid rgba(255,255,255,.18)",
    borderRadius: 14,
    padding: "10px 8px",
    background: "rgba(0,0,0,.22)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  tabActive: {
    background: "#5CC6C8",
    color: "#0B1F3A",
  },

  list: {
    display: "grid",
    gap: 10,
    maxHeight: 320,
    overflowY: "auto",
  },

  item: {
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,.94)",
    color: "#0F172A",
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },

  badge: {
    background: "#DBEAFE",
    color: "#1E3A8A",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  text: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.9,
  },

  meta: {
    marginTop: 8,
    fontSize: 11,
    opacity: 0.65,
  },

  empty: {
    opacity: 0.9,
    fontSize: 14,
    padding: 10,
  },

  error: {
    background: "#7F1D1D",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    fontSize: 13,
  },

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

  footer: {
    textAlign: "center",
    marginTop: 14,
    lineHeight: 2,
  },

  link: {
    color: "#5CC6C8",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 14,
  },

  linkButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#5CC6C8",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 14,
  },

  dot: {
    color: "rgba(255,255,255,.45)",
    margin: "0 8px",
  },

  hiddenInput: {
    display: "none",
  },

  photoModalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "rgba(0,0,0,.75)",
    overflowY: "auto",
    boxSizing: "border-box",
  },

  photoModal: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "calc(100vh - 36px)",
    overflowY: "auto",
    padding: 20,
    borderRadius: 22,
    background: "#FFFFFF",
    color: "#0F172A",
    boxShadow:
      "0 24px 60px rgba(0,0,0,.45)",
    boxSizing: "border-box",
  },

  photoModalTitle: {
    margin: 0,
    textAlign: "center",
    color: "#0B1F3A",
    fontSize: 23,
  },

  photoModalText: {
    margin: "8px 0 16px",
    textAlign: "center",
    color: "#526173",
    fontSize: 14,
    lineHeight: 1.4,
  },

  photoOptions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },

  photoOptionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 14,
    padding: "13px 12px",
    background: "#F8FAFC",
    color: "#0B1F3A",
    fontWeight: 900,
    cursor: "pointer",
  },

  optionIcon: {
    fontSize: 20,
  },

  previewTitle: {
    marginTop: 16,
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  photoPreviewBox: {
    width: 150,
    height: 180,
    margin: "8px auto 0",
    borderRadius: 18,
    overflow: "hidden",
    background: "#E2E8F0",
    border: "1px solid #CBD5E1",
  },

  photoPreviewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  noPreview: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    background: "#F1F5F9",
    color: "#64748B",
    textAlign: "center",
    fontSize: 13,
  },

  photoUploadError: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    background: "#FEE2E2",
    color: "#991B1B",
    fontSize: 13,
    fontWeight: 700,
  },

  photoUploadSuccess: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    background: "#DCFCE7",
    color: "#166534",
    fontSize: 13,
    fontWeight: 700,
  },

  photoModalActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
  },

  photoCancelButton: {
    border: "1px solid #CBD5E1",
    borderRadius: 13,
    padding: "12px 10px",
    background: "#FFFFFF",
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
  },

  photoSaveButton: {
    border: "none",
    borderRadius: 13,
    padding: "12px 10px",
    background: "#1E4E75",
    color: "#FFFFFF",
    fontWeight: 900,
  },
};

function formatSeconds(total) {
  const value = Math.max(
    0,
    Number(total || 0)
  );

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return `${minutes}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatDate(value) {
  if (!value) return "";

  const text = String(value);

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return text;
}