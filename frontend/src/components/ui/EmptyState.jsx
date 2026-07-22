// src/components/ui/EmptyState.jsx

import {
  colors,
  globals,
  radius,
  spacing,
  typography,
} from "../../theme";
import Button from "./Button";

export default function EmptyState({
  icon = "📭",
  title = "No hay información",
  description = "",
  actionLabel = "",
  onAction,
  style = {},
}) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: spacing.xxl,
        textAlign: "center",
        borderRadius: radius.item,
        background: colors.surfaceTransparent,
        border: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 42,
          marginBottom: spacing.md,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          ...globals.centeredTitle,
          fontSize: typography.size.sectionTitle,
        }}
      >
        {title}
      </h3>

      {description ? (
        <p
          style={{
            ...globals.centeredSubtitle,
            marginTop: spacing.sm,
          }}
        >
          {description}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          onClick={onAction}
          style={{
            marginTop: spacing.lg,
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}