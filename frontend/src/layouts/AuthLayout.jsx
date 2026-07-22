import PageContainer from "./PageContainer";
import { UiCard } from "../components/ui";
import { globals, spacing } from "../theme";

export default function AuthLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <PageContainer centered>
      <UiCard>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.lg,
          }}
        >
          {title && (
            <h1 style={globals.centeredTitle}>
              {title}
            </h1>
          )}

          {subtitle && (
            <p style={globals.centeredSubtitle}>
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </UiCard>
    </PageContainer>
  );
}