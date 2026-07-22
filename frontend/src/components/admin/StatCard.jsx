import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../theme";

export default function StatCard({
  icon,
  label,
  value,
  description,
  tone = "default",
  loading = false,
}) {
  const toneStyle =
    toneStyles[tone] || toneStyles.default;

  return (
    <article
      style={{
        ...styles.card,
        borderColor: toneStyle.borderColor,
        background: toneStyle.background,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...styles.iconWrap,
          background: toneStyle.iconBackground,
          color: toneStyle.iconColor,
        }}
      >
        {icon}
      </div>

      <div style={styles.content}>
        <div style={styles.label}>{label}</div>

        <div style={styles.value}>
          {loading ? "…" : value ?? 0}
        </div>

        {description ? (
          <div style={styles.description}>
            {description}
          </div>
        ) : null}
      </div>
    </article>
  );
}

const toneStyles = {
  default: {
    background:
      "linear-gradient(145deg, rgba(30,78,117,0.90), rgba(18,56,90,0.96))",
    borderColor: "rgba(92,198,200,0.25)",
    iconBackground: "rgba(92,198,200,0.16)",
    iconColor: colors.accent,
  },

  success: {
    background:
      "linear-gradient(145deg, rgba(21,80,65,0.88), rgba(18,56,90,0.96))",
    borderColor: "rgba(134,239,172,0.26)",
    iconBackground: "rgba(134,239,172,0.15)",
    iconColor: "#86EFA9",
  },

  warning: {
    background:
      "linear-gradient(145deg, rgba(120,76,20,0.80), rgba(18,56,90,0.96))",
    borderColor: "rgba(253,186,116,0.28)",
    iconBackground: "rgba(253,186,116,0.16)",
    iconColor: "#FDBA74",
  },

  danger: {
    background:
      "linear-gradient(145deg, rgba(110,38,52,0.82), rgba(18,56,90,0.96))",
    borderColor: "rgba(253,164,175,0.28)",
    iconBackground: "rgba(253,164,175,0.15)",
    iconColor: "#FDA4AF",
  },

  info: {
    background:
      "linear-gradient(145deg, rgba(44,63,128,0.82), rgba(18,56,90,0.96))",
    borderColor: "rgba(147,197,253,0.28)",
    iconBackground: "rgba(147,197,253,0.15)",
    iconColor: "#93C5FD",
  },
};

const styles = {
  card: {
    minHeight: 126,
    display: "flex",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.large,
    border: "1px solid",
    boxShadow: shadows.medium,
    boxSizing: "border-box",
  },

  iconWrap: {
    width: 46,
    height: 46,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: radius.medium,
    fontSize: 23,
  },

  content: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },

  label: {
    color: colors.textMuted,
    fontSize: typography.size.small,
    fontWeight: typography.weight.bold,
  },

  value: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: typography.weight.black,
  },

  description: {
    color: colors.textMuted,
    fontSize: typography.size.tiny,
    lineHeight: 1.4,
  },
};