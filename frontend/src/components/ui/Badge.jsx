// src/components/ui/Badge.jsx

import { colors, radius, spacing, typography } from "../../theme";

const variants = {
  info: {
    background: colors.infoBackground,
    color: colors.infoDark,
  },

  success: {
    background: "#DCFCE7",
    color: colors.successDark,
  },

  warning: {
    background: "#FEF3C7",
    color: colors.warningDark,
  },

  danger: {
    background: "#FEE2E2",
    color: colors.errorDark,
  },

  accent: {
    background: colors.accent,
    color: colors.primaryDark,
  },

  dark: {
    background: "rgba(0,0,0,0.28)",
    color: colors.text,
  },
};

export default function Badge({
  children,
  variant = "info",
  style = {},
}) {
  const variantStyle = variants[variant] || variants.info;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.round,
        padding: `${spacing.xs}px ${spacing.sm}px`,
        fontSize: typography.size.tiny,
        fontWeight: typography.weight.black,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </span>
  );
}