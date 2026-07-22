// src/components/ui/ConfirmDialog.jsx

import { spacing } from "../../theme";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Confirmar acción",
  message = "¿Estás seguro de continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onCancel}
      closeOnBackdrop={!loading}
    >
      <p
        style={{
          margin: 0,
          lineHeight: 1.55,
          opacity: 0.82,
        }}
      >
        {message}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.sm,
          marginTop: spacing.xl,
        }}
      >
        <Button
          variant="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          {cancelText}
        </Button>

        <Button
          variant={variant}
          loading={loading}
          disabled={loading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}