// src/theme/cards.js

import { colors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadows } from "./shadows";

export const cards = {
  main: {
    width: "100%",
    boxSizing: "border-box",
    padding: spacing.xxl,
    borderRadius: radius.largeCard,
    background: "rgba(18,56,90,0.97)",
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.large,
    color: colors.text,
  },

  section: {
    width: "100%",
    boxSizing: "border-box",
    padding: spacing.lg,
    borderRadius: radius.card,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.medium,
    color: colors.text,
  },

  light: {
    width: "100%",
    boxSizing: "border-box",
    padding: spacing.lg,
    borderRadius: radius.item,
    background: colors.surfaceLight,
    color: colors.textDark,
  },

  transparent: {
    width: "100%",
    boxSizing: "border-box",
    padding: spacing.lg,
    borderRadius: radius.item,
    background: colors.surfaceTransparent,
    border: `1px solid ${colors.border}`,
    color: colors.text,
  },
};