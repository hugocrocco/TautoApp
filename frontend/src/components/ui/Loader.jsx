// src/components/ui/Loader.jsx

import { colors, spacing, typography } from "../../theme";

export default function Loader({
  text = "Cargando...",
  size = 34,
  fullScreen = false,
  style = {},
}) {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
        color: colors.text,
        fontFamily: typography.fontFamily,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `4px solid ${colors.border}`,
          borderTopColor: colors.accent,
          animation: "tauto-spin 0.8s linear infinite",
        }}
      />

      {text ? (
        <div
          style={{
            fontSize: typography.size.body,
            color: colors.textSecondary,
          }}
        >
          {text}
        </div>
      ) : null}

      <style>
        {`
          @keyframes tauto-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(7,24,45,0.88)",
        backdropFilter: "blur(4px)",
      }}
    >
      {content}
    </div>
  );
}