import { Link } from "react-router-dom";

import { Button, UiCard } from "../components/ui";
import {
  colors,
  globals,
  radius,
  shadows,
  spacing,
  typography,
} from "../theme";

export default function AdminLayout({
  title = "Panel de administración",
  subtitle = "Sindicato Humboldt",
  children,
  onLogout,
}) {
  return (
    <div style={globals.page}>
      <div style={globals.glowTop} />
      <div style={globals.glowBottom} />

      <main style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brandArea}>
            <div style={styles.logoWrap}>
              <img
                src="/logo-sindicato.png"
                alt="Sindicato Humboldt"
                style={styles.logo}
              />
            </div>

            <div>
              <div style={styles.platform}>
                TAUTO PLATFORM
              </div>

              <h1 style={styles.title}>
                {title}
              </h1>

              <p style={styles.subtitle}>
                {subtitle}
              </p>
            </div>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/"
              style={styles.homeLink}
            >
              Inicio
            </Link>

            {onLogout ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onLogout}
                style={styles.logoutButton}
              >
                Cerrar sesión
              </Button>
            ) : null}
          </div>
        </header>

        <UiCard style={styles.contentCard}>
          {children}
        </UiCard>

        <footer style={styles.footer}>
          TAUTO Platform · Administración
        </footer>
      </main>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
    padding: `${spacing.xl}px ${spacing.md}px`,
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.large,
    background: "rgba(18,56,90,0.88)",
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.large,
    backdropFilter: "blur(18px)",
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    minWidth: 0,
  },

  logoWrap: {
    width: 72,
    height: 72,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: radius.medium,
    background: "rgba(255,255,255,0.10)",
    border: `1px solid ${colors.border}`,
  },

  logo: {
    width: 66,
    height: 66,
    objectFit: "contain",
  },

  platform: {
    marginBottom: spacing.xs,
    color: colors.accent,
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extraBold,
    letterSpacing:
      typography.letterSpacing.extraWide,
  },

  title: {
    margin: 0,
    color: colors.text,
    fontSize: typography.size.xlarge,
    fontWeight: typography.weight.black,
    lineHeight: 1.1,
  },

  subtitle: {
    margin: `${spacing.xs}px 0 0`,
    color: colors.textMuted,
    fontSize: typography.size.small,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  homeLink: {
    padding: "10px 14px",
    borderRadius: radius.input,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    background: "rgba(255,255,255,0.06)",
    textDecoration: "none",
    fontSize: typography.size.small,
    fontWeight: typography.weight.bold,
  },

  logoutButton: {
    width: "auto",
  },

  contentCard: {
    width: "100%",
    boxSizing: "border-box",
  },

  footer: {
    paddingTop: spacing.lg,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.bold,
    letterSpacing:
      typography.letterSpacing.normal,
  },
};