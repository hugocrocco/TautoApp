import "./SplashScreen.css";

export default function SplashScreen() {
  return (
    <div className="tauto-splash" aria-label="TAUTO, identidad que conecta">
      <div className="tauto-splash__content">
        <div className="tauto-splash__logo-wrapper">
          <img
            src="/tauto-logo.png"
            alt="TAUTO - Identidad que conecta"
            className="tauto-splash__logo"
          />

          <span className="tauto-splash__blink" aria-hidden="true" />

          <span className="tauto-splash__spark" aria-hidden="true">
            ✦
          </span>
        </div>

        <div className="tauto-splash__loading" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}