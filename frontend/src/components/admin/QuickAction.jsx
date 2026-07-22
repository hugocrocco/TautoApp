import { Link } from "react-router-dom";

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../theme";

export default function QuickAction({
  icon,
  title,
  description,
  to,
  onClick,
  disabled = false,
}) {
  const content = (
    <>
      <div aria-hidden="true" style={styles.icon}>
        {icon}
      </div>

      <div style={styles.textArea}>
        <div style={styles.title}>{title}</div>

        {description ? (
          <div style={styles.description}>
            {description}
          </div>
        ) : null}
      </div>

      <div aria-hidden="true" style={styles.arrow}>
        ›
      </div>
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} style={styles.action}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.action,
        ...styles.buttonReset,
        ...(disabled ? styles.disabled : {}),
      }}
    >
      {content}
    </button>
  );
}

const styles = {
  action: {
    width: "100%",
    minHeight: 82,
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    boxSizing: "border-box",
    borderRadius: radius.large,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.055)",
    boxShadow: shadows.small,
    color: colors.text,
    textDecoration: "none",
    cursor: "pointer",
    transition:
      "transform 160ms ease, background 160ms ease, border-color 160ms ease",
  },

  buttonReset: {
    appearance: "none",
    fontFamily: "inherit",
    textAlign: "left",
  },

  icon: {
    width: 44,
    height: 44,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: radius.medium,
    background: "rgba(92,198,200,0.14)",
    color: colors.accent,
    fontSize: 22,
  },

  textArea: {
    minWidth: 0,
    flex: 1,
  },

  title: {
    color: colors.text,
    fontSize: typography.size.medium,
    fontWeight: typography.weight.extraBold,
  },

  description: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.size.small,
    lineHeight: 1.35,
  },

  arrow: {
    flex: "0 0 auto",
    color: colors.accent,
    fontSize: 28,
    lineHeight: 1,
    fontWeight: typography.weight.bold,
  },

  disabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};