import { useEffect, useState } from "react";

export default function PageFlipShell({ children }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Dispara la animación justo después de montar
    const id = setTimeout(() => setShown(true), 0);
    return () => clearTimeout(id);
  }, []);

  const wrapperStyle = {
    perspective: 1200,
  };

  const innerStyle = {
    transformStyle: "preserve-3d",
    willChange: "transform, opacity",
    transition: "transform 0.6s ease, opacity 0.6s ease",
    transform: shown ? "rotateY(0deg)" : "rotateY(90deg)",
    opacity: shown ? 1 : 0,
  };

  return (
    <div style={wrapperStyle}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
}