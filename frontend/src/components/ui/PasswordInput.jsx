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

  const fieldId = id || name || "password";

  function toggleVisibility() {
    if (disabled || readOnly) {
      return;
    }

    setVisible((current) => !current);
  }

  return (
    <div
      style={{
        width: "100%",
        ...containerStyle,
      }}
    >
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

      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
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
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${fieldId}-error`
              : helpText
                ? `${fieldId}-help`
                : undefined
          }
          style={{
            ...inputs.input,
            paddingRight: 82,
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
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={
            visible
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
          aria-pressed={visible}
          style={{
            position: "absolute",
            top: "50%",
            right: spacing.sm,
            transform: "translateY(-50%)",
            minWidth: 58,
            height: 34,
            padding: `0 ${spacing.sm}px`,
            border: "none",
            borderRadius: radius.small,
            background: "rgba(92,198,200,0.16)",
            color: "#78DBDD",
            fontFamily: typography.fontFamily,
            fontSize: typography.size.small,
            fontWeight: typography.weight.black,
            cursor:
              disabled || readOnly
                ? "not-allowed"
                : "pointer",
            opacity:
              disabled || readOnly
                ? 0.6
                : 1,
          }}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>

      {error ? (
        <div
          id={`${fieldId}-error`}
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
          id={`${fieldId}-help`}
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