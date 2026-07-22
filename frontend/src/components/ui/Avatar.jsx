// src/components/ui/Avatar.jsx

import { colors, shadows, typography } from "../../theme";

export default function Avatar({
  src,
  alt = "Usuario",
  name = "",
  size = 80,
  style = {},
}) {
  const initials = getInitials(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(145deg, ${colors.accent}, ${colors.accentDark})`,
        border: `3px solid ${colors.borderStrong}`,
        boxShadow: shadows.medium,
        color: colors.primaryDark,
        fontSize: Math.max(16, Math.round(size * 0.32)),
        fontWeight: typography.weight.black,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span>{initials || "U"}</span>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}