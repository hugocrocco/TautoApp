// src/components/ui/Section.jsx

import {
  cards,
  colors,
  spacing,
  typography,
} from "../../theme";

export default function Section({
  title,
  subtitle,
  action,
  children,
  variant = "section",
  style = {},
}) {
  const selectedStyle = cards[variant] || cards.section;

  return (
    <section
      style={{
        ...selectedStyle,
        ...style,
      }}
    >
      {title || subtitle || action ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <div>
            {title ? (
              <h2
                style={{
                  margin: 0,
                  color:
                    variant === "light"
                      ? colors.textDark
                      : colors.text,
                  fontSize: typography.size.sectionTitle,
                  fontWeight: typography.weight.black,
                }}
              >
                {title}
              </h2>
            ) : null}

            {subtitle ? (
              <p
                style={{
                  margin: title ? `${spacing.xs}px 0 0` : 0,
                  fontSize: typography.size.small,
                  lineHeight: typography.lineHeight.normal,
                  opacity: 0.7,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}