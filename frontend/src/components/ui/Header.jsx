// src/components/ui/Header.jsx

import {
  colors,
  spacing,
  typography,
} from "../../theme";

export default function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  centered = false,
  style = {},
}) {
  return (
    <header
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginBottom: spacing.xl,
        ...style,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr 44px",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <div>{leftAction || null}</div>

        <div
          style={{
            textAlign: centered ? "center" : "left",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: colors.text,
              fontSize: typography.size.title,
              lineHeight: typography.lineHeight.compact,
              fontWeight: typography.weight.black,
            }}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              style={{
                margin: `${spacing.xs}px 0 0`,
                color: colors.textSecondary,
                fontSize: typography.size.small,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {rightAction || null}
        </div>
      </div>
    </header>
  );
}