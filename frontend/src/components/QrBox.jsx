import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrBox({ value }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, { width: 200, margin: 1 })
      .then(setSrc)
      .catch(console.error);
  }, [value]);

  return (
    <div style={styles.box}>
      {src ? <img src={src} alt="QR" /> : <div>Generando QR…</div>}
    </div>
  );
}

const styles = {
  box: {
    marginTop: 16,
    padding: 12,
    background: "white",
    borderRadius: 12,
    display: "flex",
    justifyContent: "center",
  }
};