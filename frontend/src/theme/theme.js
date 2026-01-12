// ✅ 1) Crea este archivo: frontend/src/theme/theme.js
export const defaultTheme = {
  name: "Valparaíso Moto Club",
  short: "VMC",
  logoSrc: "/VMC.PNG",

  colors: {
    pageBg: "#1F2A14",        // olive dark
    cardBg: "#556B2F",        // olive main
    cardBgAlt: "rgba(31,42,20,0.35)",
    text: "#FFFFFF",
    link: "#A3D07C",
    border: "rgba(255,255,255,0.18)",
    shadow: "rgba(0,0,0,0.40)",
  },

  sizes: {
    maxWidth: 420,
    cardRadius: 24,
    cardPadding: 18,
    // 👇 altura estándar opcional para TODAS las tarjetas (si quieres fijo)
    // si la dejas en null, cada tarjeta se ajusta al contenido.
    cardHeight: null, // ej: 520
  },
};

export function buildCardFrameStyles(theme = defaultTheme) {
  return {
    page: {
      minHeight: "100vh",
      background: theme.colors.pageBg,
      padding: 20,
      fontFamily: "system-ui",
    },
    container: {
      maxWidth: theme.sizes.maxWidth,
      margin: "0 auto",
    },
    card: {
      borderRadius: theme.sizes.cardRadius,
      background: theme.colors.cardBg,
      color: theme.colors.text,
      boxShadow: `0 20px 40px ${theme.colors.shadow}`,
      padding: theme.sizes.cardPadding,
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    logoWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.14)",
      border: `1px solid ${theme.colors.border}`,
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      flex: "0 0 auto",
    },
    logo: {
      width: 34,
      height: 34,
      objectFit: "contain",
    },
    title: { fontSize: 20, fontWeight: 900, lineHeight: 1.05 },
    subtitle: { fontSize: 12, opacity: 0.85, fontWeight: 800, marginTop: 3 },
    link: { color: theme.colors.link, fontWeight: 900, textDecoration: "none" },
  };
}