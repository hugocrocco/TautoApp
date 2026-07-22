import { globals } from "../theme";

export default function PageContainer({
  children,
  centered = false,
}) {
  return (
    <div style={centered ? globals.centeredPage : globals.page}>
      <div style={globals.glowTop} />
      <div style={globals.glowBottom} />

      <div style={globals.container}>
        {children}
      </div>
    </div>
  );
}