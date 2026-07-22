// src/components/ui/PasswordInput.jsx

import { useState } from "react";
import {
  colors,
  inputs,
  radius,
  spacing,
  typography,
} from "../../theme";

export default function PasswordInput({
  label,
  error,
  helpText,
  containerStyle = {},
  inputStyle = {},
  required = false,
  disabled = false,
  readOnly = false,
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const fieldId = id || name;

  return (
    <div style={{ width: "100%", ...containerStyle }}>
      {label ? (
        <label htmlFor={fieldId} style={inputs.label}>
          {label}

          {required ? (
            <span
              style={{
                color: colors.error,
                marginLeft: spacing.xs,
              }}
            >
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div style={{ position: "relative" }}>
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          readOnly={readOnly}
          style={{
            ...inputs.input,
            paddingRight: 78,
            ...(disabled ? inputs.disabled : {}),
            ...(readOnly ? inputs.readOnly : {}),
            ...(error
              ? {
                  border: `1px solid ${colors.error}`,
                }
              : {}),
            ...inputStyle,
          }}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={
            visible
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
          style={{
            position: "absolute",
            top: "50%",
            right: spacing.sm,
            transform: "translateY(-50%)",
            minWidth: 56,
            height: 34,
            padding: `0 ${spacing.sm}px`,
            border: "none",
            borderRadius: radius.small,
            background: "rgba(92,198,200,0.16)",
            color: "#78DBDD",
            fontFamily: typography.fontFamily,
            fontSize: typography.size.small,
            fontWeight: typography.weight.black,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            marginTop: spacing.xs,
            color: "#FECACA",
            fontSize: typography.size.small,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {error}
        </div>
      ) : null}

      {!error && helpText ? (
        <div
          style={{
            marginTop: spacing.xs,
            color: colors.textMuted,
            fontSize: typography.size.small,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {helpText}
        </div>
      ) : null}
    </div>
  );
}