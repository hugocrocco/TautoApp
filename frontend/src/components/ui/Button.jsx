// src/components/ui/Button.jsx

import { buttons } from "../../theme";

export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = true,
  style = {},
  onClick,
  ...props
}) {
  const variantStyle = buttons[variant] || buttons.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...variantStyle,
        width: fullWidth ? "100%" : "auto",
        ...((disabled || loading) ? buttons.disabled : {}),
        ...style,
      }}
      {...props}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}