import { useEffect, useState } from "react";
import QrBox from "./QrBox";

function resolvePhotoSrc(member) {
  const raw =
    member?.photoDataUrl ??
    member?.photoDataURL ??
    member?.photo ??
    member?.photoUrl ??
    member?.photoData ??
    member?.avatar ??
    member?.profilePhoto ??
    member?.profilePhotoUrl;

  if (!raw || typeof raw !== "string") return "";

  const value = raw.trim();

  if (value.startsWith("data:image")) return value;
  if (value.startsWith("/api/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const looksBase64 = value.length > 100 && /^[A-Za-z0-9+/=]+$/.test(value);
  if (looksBase64) return `data:image/jpeg;base64,${value}`;

  return "";
}

export default function CardPreview({ member, qrValue }) {
  const photoSrc = resolvePhotoSrc(member);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [photoSrc, member?.credentialCode]);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoWrap}>
            <img src="/VMC.PNG" alt="VMC" style={styles.logo} />
          </div>
          <div>
            <div style={styles.org}>Valparaíso Moto Club</div>
            <div style={styles.orgSub}>VMC</div>
          </div>
        </div>
      </div>

      <div style={styles.bodyRow}>
        <div style={styles.photoBox}>
          {photoSrc && !imgFailed ? (
            <img
              src={photoSrc}
              alt="Foto socio"
              style={styles.photoImg}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span style={styles.photoPlaceholder}>FOTO</span>
          )}
        </div>

        <div style={styles.dataCol}>
          <div style={styles.name}>{member?.displayName || "Nombre Socio"}</div>

          <div style={styles.fieldBlock}>
            <span style={styles.label}>RUT</span>
            <span style={styles.value}>{member?.rutMasked || "—"}</span>
          </div>

          <div style={styles.fieldBlock}>
            <span style={styles.label}>Sección</span>
            <span style={styles.value}>{member?.section || "Valparaíso Moto Club"}</span>
          </div>

          <div style={styles.statusChip}>
            {member?.statusLabel || "MIEMBRO VIGENTE"}
          </div>

          <div style={styles.code}>Código: {member?.credentialCode || "VMC-0000"}</div>
        </div>
      </div>

      <div style={styles.qrRow}>
        <QrBox value={qrValue} />
      </div>
    </div>
  );
}

const styles = {
  /*card: {
    width: "100%",
    borderRadius: 24,
    padding: 18,
    background: "linear-gradient(180deg, #556B2F 0%, #3E4F22 100%)",
    color: "white",
    fontFamily: "system-ui",
    boxShadow: "0 18px 38px rgba(0,0,0,0.45)",
    boxSizing: "border-box",
  },*/
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#556B2F",
    color: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.40)",
  },
  header: { marginBottom: 10 },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 14,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  logo: { width: 120, height: 120, objectFit: "contain" },
  org: { fontSize: 18, fontWeight: 900, letterSpacing: 0.4 },
  orgSub: { fontSize: 11, textTransform: "uppercase", opacity: 0.9, letterSpacing: 1.2 },

  bodyRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 14,
    alignItems: "center",
  },
  photoBox: {
    width: 100,
    height: 120,
    borderRadius: 18,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { fontSize: 11, letterSpacing: 1.2 },

  dataCol: { display: "grid", gap: 4 },
  name: { fontSize: 18, fontWeight: 900 },
  fieldBlock: { display: "flex", justifyContent: "space-between", fontSize: 12 },
  label: { opacity: 0.85 },
  value: { fontWeight: 600 },
  statusChip: {
    marginTop: 4,
    alignSelf: "flex-start",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.4)",
  },
  code: { marginTop: 2, fontSize: 11, opacity: 0.9 },

  qrRow: { marginTop: 14, display: "flex", justifyContent: "flex-end" },
};