// src/theme/inputs.js

import { colors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { typography } from "./typography";

const baseField = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: radius.input,
  border: `1px solid ${colors.borderStrong}`,
  outline: "none",
  background: colors.surfaceDark,
  color: colors.text,
  fontFamily: typography.fontFamily,
  fontSize: typography.size.input,
};

export const inputs = {
  label: {
    display: "block",
    marginBottom: spacing.sm,
    fontSize: typography.size.small,
    fontWeight: typography.weight.extraBold,
    color: colors.text,
  },

  input: {
    ...baseField,
    height: 50,
    padding: `0 ${spacing.md}px`,
  },

  textarea: {
    ...baseField,
    minHeight: 110,
    padding: spacing.md,
    resize: "vertical",
  },

  select: {
    ...baseField,
    height: 50,
    padding: `0 ${spacing.md}px`,
  },

  readOnly: {
    opacity: 0.72,
    cursor: "default",
  },

  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};