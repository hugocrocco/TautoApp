// src/components/ui/Input.jsx

import { colors, inputs, spacing, typography } from "../../theme";

export default function Input({
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
  ...props
}) {
  const fieldId = id || name;

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
            <span style={{ color: colors.error, marginLeft: 4 }}>*</span>
          ) : null}
        </label>
      ) : null}

      <input
        id={fieldId}
        name={name}
        disabled={disabled}
        readOnly={readOnly}
        style={{
          ...inputs.input,
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