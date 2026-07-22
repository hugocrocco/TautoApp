// src/theme/buttons.js

import { colors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { typography } from "./typography";

const baseButton = {
  width: "100%",
  minHeight: 50,
  boxSizing: "border-box",
  border: "none",
  borderRadius: radius.button,
  padding: `${spacing.md}px ${spacing.lg}px`,
  fontFamily: typography.fontFamily,
  fontSize: typography.size.body,
  fontWeight: typography.weight.black,
  cursor: "pointer",
  transition:
    "transform 0.15s ease, opacity 0.15s ease, background 0.15s ease",
};

export const buttons = {
  primary: {
    ...baseButton,
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
    color: colors.primaryDark,
    boxShadow: shadows.accent,
  },

  secondary: {
    ...baseButton,
    background: colors.secondary,
    color: colors.text,
    border: `1px solid ${colors.borderStrong}`,
  },

  danger: {
    ...baseButton,
    background: colors.error,
    color: colors.white,
    boxShadow: shadows.error,
  },

  orange: {
    ...baseButton,
    background: colors.orange,
    color: colors.primaryDark,
    boxShadow: shadows.orange,
  },

  transparent: {
    ...baseButton,
    width: "auto",
    minHeight: "auto",
    padding: 0,
    background: "transparent",
    color: colors.accent,
    boxShadow: "none",
  },

  compact: {
    ...baseButton,
    width: "auto",
    minHeight: 38,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: typography.size.small,
  },

  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
  },
};