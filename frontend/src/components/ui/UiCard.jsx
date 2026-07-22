// src/components/ui/UiCard.jsx

import { cards } from "../../theme";

export default function UiCard({
  children,
  variant = "main",
  style = {},
  as: Component = "div",
  ...props
}) {
  const cardStyle = cards[variant] || cards.main;

  return (
    <Component
      style={{
        ...cardStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}