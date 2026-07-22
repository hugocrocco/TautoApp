// src/components/ui/Modal.jsx

import { useEffect } from "react";
import {
  cards,
  colors,
  spacing,
  typography,
} from "../../theme";

export default function Modal({
  open,
  title,
  children,
  onClose,
  closeOnBackdrop = true,
  maxWidth = 420,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget) return;
    if (closeOnBackdrop) onClose?.();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Ventana"}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
        boxSizing: "border-box",
        background: colors.overlay,
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        style={{
          ...cards.main,
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: colors.text,
              fontSize: typography.size.sectionTitle,
              fontWeight: typography.weight.black,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              border: "none",
              borderRadius: "50%",
              background: colors.surfaceTransparent,
              color: colors.text,
              cursor: "pointer",
              fontSize: 20,
              fontWeight: typography.weight.black,
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}