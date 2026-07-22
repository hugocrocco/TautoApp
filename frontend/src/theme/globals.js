// src/theme/globals.js

import { colors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { typography } from "./typography";

export const globals = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    boxSizing: "border-box",
    padding: `${spacing.xxl}px ${spacing.lg}px`,
    background: `linear-gradient(
      155deg,
      ${colors.primaryDark} 0%,
      ${colors.primary} 48%,
      ${colors.secondary} 100%
    )`,
    color: colors.text,
    fontFamily: typography.fontFamily,
  },

  centeredPage: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: `${spacing.xxl}px ${spacing.lg}px`,
    background: `linear-gradient(
      155deg,
      ${colors.primaryDark} 0%,
      ${colors.primary} 48%,
      ${colors.secondary} 100%
    )`,
    color: colors.text,
    fontFamily: typography.fontFamily,
  },

  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
  },

  glowTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: radius.circle,
    background: "rgba(92,198,200,0.18)",
    filter: "blur(30px)",
    top: -90,
    right: -80,
    pointerEvents: "none",
  },

  glowBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radius.circle,
    background: "rgba(255,143,31,0.12)",
    filter: "blur(35px)",
    bottom: -100,
    left: -80,
    pointerEvents: "none",
  },

  title: {
    margin: 0,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.compact,
    fontWeight: typography.weight.black,
    color: colors.text,
  },

  centeredTitle: {
    margin: 0,
    textAlign: "center",
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.compact,
    fontWeight: typography.weight.black,
    color: colors.text,
  },

  subtitle: {
    margin: 0,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.comfortable,
    color: colors.textSecondary,
  },

  centeredSubtitle: {
    margin: 0,
    textAlign: "center",
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.comfortable,
    color: colors.textSecondary,
  },

  mutedText: {
    margin: 0,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.normal,
    color: colors.textMuted,
  },

  errorBox: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.medium,
    background: colors.errorBackground,
    border: "1px solid rgba(254,202,202,0.22)",
    color: "#FEE2E2",
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.normal,
  },

  successBox: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.medium,
    background: colors.successBackground,
    border: "1px solid rgba(134,239,172,0.22)",
    color: "#DCFCE7",
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.normal,
  },

  infoBox: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.medium,
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(147,197,253,0.22)",
    color: "#DBEAFE",
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.normal,
  },
};