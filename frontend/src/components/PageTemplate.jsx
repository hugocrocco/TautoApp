// ✅ 2) Crea este archivo: frontend/src/components/PageTemplate.jsx


import { defaultTheme, buildCardFrameStyles } from "../theme/theme";

export default function PageTemplate({
  theme = defaultTheme,
  subtitle,
  children,
  cardStyle,
}) {
  const s = buildCardFrameStyles(theme);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ ...s.card, ...(cardStyle || {}) }}>
          <div style={s.header}>
            <div style={s.logoWrap}>
              <img src={theme.logoSrc} alt={theme.short} style={s.logo} />
            </div>
            <div>
              <div style={s.title}>{theme.name}</div>
              <div style={s.subtitle}>{subtitle || theme.short}</div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
